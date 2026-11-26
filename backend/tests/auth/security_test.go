package authtests

// PHASE4_ROWS.md Row 18a: every forged, expired or badly framed bearer token
// is refused with 401, and a Clerk webhook whose body changed after signing is
// refused. Keys are generated per run; no real key is read.

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"lume/backend/internal/auth"
)

func TestMiddlewareRejectsForgedTokens(t *testing.T) {
	trusted, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	stranger, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	der, err := x509.MarshalPKIXPublicKey(&trusted.PublicKey)
	if err != nil {
		t.Fatal(err)
	}
	publicPEM := pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: der})

	const iss = "https://clerk.example.test"
	const trustedKid = "kid_trusted"
	verifier := &auth.JWTVerifier{
		Issuer: iss,
		Keyfunc: func(tok *jwt.Token) (any, error) {
			if kid, _ := tok.Header["kid"].(string); kid != trustedKid {
				return nil, errors.New("unknown signing key")
			}
			return &trusted.PublicKey, nil
		},
	}
	handler := auth.Middleware(verifier)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	session := func() jwt.MapClaims {
		return jwt.MapClaims{"sub": "user_1", "iss": iss, "exp": time.Now().Add(time.Hour).Unix()}
	}
	sign := func(method jwt.SigningMethod, key any, kid string, claims jwt.MapClaims) string {
		tok := jwt.NewWithClaims(method, claims)
		tok.Header["kid"] = kid
		s, err := tok.SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return s
	}
	expired := session()
	expired["exp"] = time.Now().Add(-time.Minute).Unix()
	wrongIssuer := session()
	wrongIssuer["iss"] = "https://other.example.test"
	noExpiry := session()
	delete(noExpiry, "exp")

	cases := []struct {
		name   string
		header string
		want   int
	}{
		{"valid session token", "Bearer " + sign(jwt.SigningMethodRS256, trusted, trustedKid, session()), http.StatusOK},
		{"wrong issuer", "Bearer " + sign(jwt.SigningMethodRS256, trusted, trustedKid, wrongIssuer), http.StatusUnauthorized},
		{"expired", "Bearer " + sign(jwt.SigningMethodRS256, trusted, trustedKid, expired), http.StatusUnauthorized},
		{"no expiry claim", "Bearer " + sign(jwt.SigningMethodRS256, trusted, trustedKid, noExpiry), http.StatusUnauthorized},
		{"alg none", "Bearer " + sign(jwt.SigningMethodNone, jwt.UnsafeAllowNoneSignatureType, trustedKid, session()), http.StatusUnauthorized},
		{"HS256 signed with the public key", "Bearer " + sign(jwt.SigningMethodHS256, publicPEM, trustedKid, session()), http.StatusUnauthorized},
		{"RS512 instead of RS256", "Bearer " + sign(jwt.SigningMethodRS512, trusted, trustedKid, session()), http.StatusUnauthorized},
		{"signed by an unknown key under the trusted kid", "Bearer " + sign(jwt.SigningMethodRS256, stranger, trustedKid, session()), http.StatusUnauthorized},
		{"unknown kid", "Bearer " + sign(jwt.SigningMethodRS256, stranger, "kid_unknown", session()), http.StatusUnauthorized},
		{"empty header", "", http.StatusUnauthorized},
		{"bearer with no token", "Bearer ", http.StatusUnauthorized},
		{"scheme only", "Bearer", http.StatusUnauthorized},
		{"lowercase scheme", "bearer " + sign(jwt.SigningMethodRS256, trusted, trustedKid, session()), http.StatusUnauthorized},
		{"basic scheme", "Basic dXNlcjpwYXNz", http.StatusUnauthorized},
		{"two segments", "Bearer aaa.bbb", http.StatusUnauthorized},
		{"not base64", "Bearer !!!.@@@.###", http.StatusUnauthorized},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/profile", nil)
			if tc.header != "" {
				req.Header.Set("Authorization", tc.header)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != tc.want {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.want, rec.Body)
			}
		})
	}
}

func TestClerkWebhookSignature(t *testing.T) {
	payload := []byte(`{"type":"user.created","data":{"id":"user_sig"}}`)
	ts := fmt.Sprint(time.Now().Unix())
	valid := svixSign(t, "msg_1", ts, payload)

	cases := []struct {
		name      string
		secret    string
		body      []byte
		signature string
		want      int
	}{
		{"valid signature", testSecret(), payload, valid, http.StatusOK},
		{"missing signature header", testSecret(), payload, "", http.StatusForbidden},
		{"signed with another secret", "whsec_" + "b3RoZXItc2VjcmV0LW90aGVyLXNlY3JldA==", payload, valid, http.StatusForbidden},
		{"body changed after signing", testSecret(), []byte(`{"type":"user.created","data":{"id":"user_evil"}}`), valid, http.StatusForbidden},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			st := newFakeStore()
			mux := http.NewServeMux()
			auth.RegisterWebhook(mux, st, tc.secret)
			rec := postWebhook(t, mux, tc.body, tc.signature)
			if rec.Code != tc.want {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.want, rec.Body)
			}
			if tc.want != http.StatusOK && len(st.profiles) != 0 {
				t.Fatal("profile written despite a refused signature")
			}
		})
	}
}
