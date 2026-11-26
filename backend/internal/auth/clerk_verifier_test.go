// In-package test: NewClerkVerifier and fetchClerkJWKS call Clerk's hard-coded
// JWKS URL, so the test swaps http.DefaultTransport for one that sends the
// request to a local fake JWKS server. Tokens are signed with a key generated
// here; no Clerk key is ever used.
package auth

import (
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	fakeClerkSecret = "sk_test_local_fake"
	testIssuer      = "https://clerk.test.local"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

// fakeJWKS serves body with status at Clerk's JWKS URL for the test's duration,
// rejecting any request that does not carry the fake secret.
func fakeJWKS(t *testing.T, status int, body string) {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/jwks" || r.Header.Get("Authorization") != "Bearer "+fakeClerkSecret {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(srv.Close)
	target, err := url.Parse(srv.URL)
	if err != nil {
		t.Fatalf("parse fake url: %v", err)
	}
	prev := http.DefaultTransport
	http.DefaultTransport = roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.URL.Host != "api.clerk.com" {
			t.Errorf("unexpected outbound request to %s", r.URL.Host)
		}
		out := r.Clone(r.Context())
		out.URL.Scheme, out.URL.Host, out.Host = target.Scheme, target.Host, target.Host
		return prev.RoundTrip(out)
	})
	t.Cleanup(func() { http.DefaultTransport = prev })
}

func b64(b []byte) string { return base64.RawURLEncoding.EncodeToString(b) }

func rsaJWK(kid string, pub *rsa.PublicKey) map[string]string {
	return map[string]string{"kty": "RSA", "kid": kid, "n": b64(pub.N.Bytes()), "e": b64(big.NewInt(int64(pub.E)).Bytes())}
}

func jwksBody(t *testing.T, keys ...map[string]string) string {
	t.Helper()
	b, err := json.Marshal(map[string]any{"keys": keys})
	if err != nil {
		t.Fatalf("marshal jwks: %v", err)
	}
	return string(b)
}

func newKey(t *testing.T) *rsa.PrivateKey {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	return key
}

func TestFetchClerkJWKS(t *testing.T) {
	key := newKey(t)
	good := rsaJWK("k1", &key.PublicKey)
	cases := []struct {
		name     string
		secret   string
		status   int
		body     string
		wantErr  string
		wantKids []string
	}{
		{"secret not set", "", http.StatusOK, "", "CLERK_SECRET_KEY not set", nil},
		{"Clerk error status", fakeClerkSecret, http.StatusInternalServerError, "", "jwks fetch: status 500", nil},
		{"not JSON", fakeClerkSecret, http.StatusOK, "<html>", "invalid character", nil},
		{"empty key set", fakeClerkSecret, http.StatusOK, `{"keys":[]}`, "", []string{}},
		{"skips non-RSA and undecodable keys", fakeClerkSecret, http.StatusOK, jwksBody(t,
			good,
			map[string]string{"kty": "EC", "kid": "ec"},
			map[string]string{"kty": "RSA", "kid": "bad-n", "n": "!!", "e": good["e"]},
			map[string]string{"kty": "RSA", "kid": "bad-e", "n": good["n"], "e": "!!"},
		), "", []string{"k1"}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Setenv("CLERK_SECRET_KEY", tc.secret)
			fakeJWKS(t, tc.status, tc.body)
			keys, err := fetchClerkJWKS()
			if tc.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
					t.Fatalf("err = %v, want it to contain %q", err, tc.wantErr)
				}
				return
			}
			if err != nil || len(keys) != len(tc.wantKids) {
				t.Fatalf("keys = %v, %v, want kids %v", keys, err, tc.wantKids)
			}
			for _, kid := range tc.wantKids {
				if k := keys[kid]; k == nil || k.N.Cmp(key.N) != 0 || k.E != key.E {
					t.Fatalf("key %s = %+v, want the served public key", kid, k)
				}
			}
		})
	}
}

func TestClerkVerifierAgainstJWKS(t *testing.T) {
	key, other := newKey(t), newKey(t)
	t.Setenv("CLERK_SECRET_KEY", fakeClerkSecret)
	t.Setenv("CLERK_ISSUER", testIssuer)
	fakeJWKS(t, http.StatusOK, jwksBody(t, rsaJWK("k1", &key.PublicKey)))
	v := NewClerkVerifier()

	exp := time.Now().Add(time.Hour).Unix()
	sign := func(signer *rsa.PrivateKey, kid string, claims jwt.MapClaims) string {
		tok := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
		tok.Header["kid"] = kid
		s, err := tok.SignedString(signer)
		if err != nil {
			t.Fatalf("sign: %v", err)
		}
		return s
	}
	cases := []struct {
		name, token, wantSub, wantErr string
	}{
		{"valid session token", sign(key, "k1", jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": testIssuer}), "user_1", ""},
		{"wrong issuer", sign(key, "k1", jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": "https://other.example"}), "", "invalid issuer"},
		{"expired", sign(key, "k1", jwt.MapClaims{"sub": "user_1", "exp": time.Now().Add(-time.Minute).Unix(), "iss": testIssuer}), "", "token is expired"},
		{"no expiry", sign(key, "k1", jwt.MapClaims{"sub": "user_1", "iss": testIssuer}), "", "exp claim is required"},
		{"missing sub", sign(key, "k1", jwt.MapClaims{"exp": exp, "iss": testIssuer}), "", "missing sub claim"},
		{"empty sub", sign(key, "k1", jwt.MapClaims{"sub": "", "exp": exp, "iss": testIssuer}), "", "missing sub claim"},
		{"unknown signing key id", sign(key, "k2", jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": testIssuer}), "", "unknown signing key"},
		{"signed by another key", sign(other, "k1", jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": testIssuer}), "", "signature is invalid"},
		{"not a JWT", "not.a.jwt", "", "token is malformed"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			sub, err := v.Verify(t.Context(), tc.token)
			if tc.wantErr != "" {
				if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
					t.Fatalf("Verify = %q, %v, want an error containing %q", sub, err, tc.wantErr)
				}
				return
			}
			if err != nil || sub != tc.wantSub {
				t.Fatalf("Verify = %q, %v, want %q", sub, err, tc.wantSub)
			}
		})
	}
}
