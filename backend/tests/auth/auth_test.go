package authtests

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"lumo/backend/internal/auth"
)

type fakeStore struct {
	profiles map[string]auth.Profile
}

func newFakeStore() *fakeStore { return &fakeStore{profiles: map[string]auth.Profile{}} }

func (f *fakeStore) Upsert(_ context.Context, p auth.Profile) error {
	f.profiles[p.ID] = p
	return nil
}

func (f *fakeStore) Get(_ context.Context, id string) (auth.Profile, error) {
	p, ok := f.profiles[id]
	if !ok {
		return auth.Profile{}, auth.ErrNotFound
	}
	return p, nil
}

func (f *fakeStore) Update(_ context.Context, id string, displayName, avatarURL *string) (auth.Profile, error) {
	p, ok := f.profiles[id]
	if !ok {
		return auth.Profile{}, auth.ErrNotFound
	}
	if displayName != nil {
		p.DisplayName = displayName
	}
	if avatarURL != nil {
		p.AvatarURL = avatarURL
	}
	f.profiles[id] = p
	return p, nil
}

func (f *fakeStore) Delete(_ context.Context, id string) error {
	delete(f.profiles, id)
	return nil
}

// --- middleware ---

func TestMiddleware(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	verifier := &auth.JWTVerifier{Keyfunc: func(*jwt.Token) (any, error) { return &key.PublicKey, nil }}

	var seenUser string
	handler := auth.Middleware(verifier)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenUser = auth.UserID(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	sign := func(claims jwt.MapClaims) string {
		s, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return s
	}

	cases := []struct {
		name       string
		authHeader string
		wantStatus int
		wantUser   string
	}{
		{"valid", "Bearer " + sign(jwt.MapClaims{"sub": "user_1", "exp": time.Now().Add(time.Hour).Unix()}), http.StatusOK, "user_1"},
		{"expired", "Bearer " + sign(jwt.MapClaims{"sub": "user_1", "exp": time.Now().Add(-time.Hour).Unix()}), http.StatusUnauthorized, ""},
		{"missing header", "", http.StatusUnauthorized, ""},
		{"malformed token", "Bearer not.a.jwt", http.StatusUnauthorized, ""},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			seenUser = ""
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tc.authHeader != "" {
				req.Header.Set("Authorization", tc.authHeader)
			}
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)
			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.wantStatus, rec.Body)
			}
			if seenUser != tc.wantUser {
				t.Fatalf("UserID = %q, want %q", seenUser, tc.wantUser)
			}
		})
	}
}

// --- webhook ---

const testSecretKey = "0123456789abcdef0123456789abcdef"

func testSecret() string {
	return "whsec_" + base64.StdEncoding.EncodeToString([]byte(testSecretKey))
}

func svixSign(t *testing.T, id, ts string, payload []byte) string {
	t.Helper()
	mac := hmac.New(sha256.New, []byte(testSecretKey))
	fmt.Fprintf(mac, "%s.%s.%s", id, ts, payload)
	return "v1," + base64.StdEncoding.EncodeToString(mac.Sum(nil))
}

func postWebhook(t *testing.T, mux *http.ServeMux, payload []byte, signature string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/api/webhooks/clerk", strings.NewReader(string(payload)))
	req.Header.Set("svix-id", "msg_1")
	req.Header.Set("svix-timestamp", fmt.Sprint(time.Now().Unix()))
	req.Header.Set("svix-signature", signature)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)
	return rec
}

func TestWebhookUserCreated(t *testing.T) {
	st := newFakeStore()
	mux := http.NewServeMux()
	auth.RegisterWebhook(mux, st, testSecret())

	payload := []byte(`{
		"type": "user.created",
		"data": {
			"id": "user_1",
			"first_name": "Jane",
			"last_name": "Doe",
			"image_url": "https://img.example/jane.png",
			"primary_email_address_id": "em_1",
			"email_addresses": [
				{"id": "em_2", "email_address": "other@example.com"},
				{"id": "em_1", "email_address": "jane@example.com"}
			]
		}
	}`)
	ts := fmt.Sprint(time.Now().Unix())
	rec := postWebhook(t, mux, payload, svixSign(t, "msg_1", ts, payload))
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", rec.Code, rec.Body)
	}
	p, ok := st.profiles["user_1"]
	if !ok {
		t.Fatal("profile not upserted")
	}
	if p.Email == nil || *p.Email != "jane@example.com" {
		t.Fatalf("email = %v, want jane@example.com", p.Email)
	}
	if p.DisplayName == nil || *p.DisplayName != "Jane Doe" {
		t.Fatalf("display_name = %v, want Jane Doe", p.DisplayName)
	}
	if p.AvatarURL == nil || *p.AvatarURL != "https://img.example/jane.png" {
		t.Fatalf("avatar_url = %v", p.AvatarURL)
	}
}

func TestWebhookInvalidSignature(t *testing.T) {
	st := newFakeStore()
	mux := http.NewServeMux()
	auth.RegisterWebhook(mux, st, testSecret())

	payload := []byte(`{"type":"user.created","data":{"id":"user_1"}}`)
	rec := postWebhook(t, mux, payload, "v1,"+base64.StdEncoding.EncodeToString([]byte("garbage-signature")))
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status = %d, want 403 (body %s)", rec.Code, rec.Body)
	}
	if len(st.profiles) != 0 {
		t.Fatal("profile written despite bad signature")
	}
}

// --- profile ---

func authedRequest(method, path, body string) *http.Request {
	var req *http.Request
	if body == "" {
		req = httptest.NewRequest(method, path, nil)
	} else {
		req = httptest.NewRequest(method, path, strings.NewReader(body))
	}
	return req.WithContext(auth.WithUserID(req.Context(), "user_1"))
}

func decodeProfile(t *testing.T, rec *httptest.ResponseRecorder) auth.Profile {
	t.Helper()
	var env struct {
		Data  auth.Profile `json:"data"`
		Error *string      `json:"error"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v (body %s)", err, rec.Body)
	}
	return env.Data
}

func TestProfileGetAndPatch(t *testing.T) {
	st := newFakeStore()
	email := "jane@example.com"
	name := "Jane Doe"
	st.profiles["user_1"] = auth.Profile{ID: "user_1", Email: &email, DisplayName: &name}
	mux := http.NewServeMux()
	auth.RegisterProfile(mux, st)

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodGet, "/api/profile", ""))
	if rec.Code != http.StatusOK {
		t.Fatalf("GET status = %d, body %s", rec.Code, rec.Body)
	}
	if p := decodeProfile(t, rec); p.ID != "user_1" || *p.Email != email {
		t.Fatalf("GET profile = %+v", p)
	}

	rec = httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodPatch, "/api/profile", `{"display_name":"New Name"}`))
	if rec.Code != http.StatusOK {
		t.Fatalf("PATCH status = %d, body %s", rec.Code, rec.Body)
	}
	p := decodeProfile(t, rec)
	if p.DisplayName == nil || *p.DisplayName != "New Name" {
		t.Fatalf("display_name = %v, want New Name", p.DisplayName)
	}
	if p.Email == nil || *p.Email != email {
		t.Fatalf("email changed by partial patch: %v", p.Email)
	}
}

func TestProfileGetNotFound(t *testing.T) {
	mux := http.NewServeMux()
	auth.RegisterProfile(mux, newFakeStore())
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodGet, "/api/profile", ""))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestProfileDelete(t *testing.T) {
	st := newFakeStore()
	st.profiles["user_1"] = auth.Profile{ID: "user_1"}
	mux := http.NewServeMux()
	auth.RegisterProfile(mux, st)

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodDelete, "/api/profile", ""))
	if rec.Code != http.StatusOK {
		t.Fatalf("DELETE status = %d, body %s", rec.Code, rec.Body)
	}
	if _, ok := st.profiles["user_1"]; ok {
		t.Fatal("profile was not deleted")
	}
	// Idempotent — deleting an already-absent account is still a 200.
	rec = httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodDelete, "/api/profile", ""))
	if rec.Code != http.StatusOK {
		t.Fatalf("second DELETE status = %d, want 200 (idempotent)", rec.Code)
	}
}

// Account deletion must remove the sign-in identity too (5.1.1(v)): the
// identity deleter runs first, and a failure there aborts the row delete so we
// never claim a deletion that left the account able to sign in.
func TestProfileDeleteRemovesIdentityFirst(t *testing.T) {
	st := newFakeStore()
	st.profiles["user_1"] = auth.Profile{ID: "user_1"}
	var gotID string
	mux := http.NewServeMux()
	auth.RegisterProfileWithIdentity(mux, st, func(_ context.Context, id string) error {
		gotID = id
		return nil
	})

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodDelete, "/api/profile", ""))
	if rec.Code != http.StatusOK {
		t.Fatalf("DELETE status = %d, body %s", rec.Code, rec.Body)
	}
	if gotID != "user_1" {
		t.Fatalf("identity deleter called with %q, want user_1", gotID)
	}
	if _, ok := st.profiles["user_1"]; ok {
		t.Fatal("profile was not deleted")
	}
}

func TestProfileDeleteIdentityFailureAbortsRowDelete(t *testing.T) {
	st := newFakeStore()
	st.profiles["user_1"] = auth.Profile{ID: "user_1"}
	mux := http.NewServeMux()
	auth.RegisterProfileWithIdentity(mux, st, func(context.Context, string) error {
		return errors.New("clerk unreachable")
	})

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, authedRequest(http.MethodDelete, "/api/profile", ""))
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("DELETE status = %d, want 502", rec.Code)
	}
	if _, ok := st.profiles["user_1"]; !ok {
		t.Fatal("profile row deleted despite identity-delete failure — account would claim deleted while still able to sign in")
	}
}

// NewClerkUserDeleter: "" secret → nil (dev/hermetic posture, no identity call).
func TestNewClerkUserDeleterUnconfigured(t *testing.T) {
	if d := auth.NewClerkUserDeleter(""); d != nil {
		t.Fatal("expected nil deleter with no secret")
	}
	if d := auth.NewClerkUserDeleter("sk_test_x"); d == nil {
		t.Fatal("expected non-nil deleter with a secret")
	}
}

// Issuer pinning + token-type rejection. Clerk signs EVERY token for an
// instance with the same keys — including JWT-template tokens minted for other
// services. Without these checks any such token is a full session here.
func TestVerifierPinsIssuerAndRejectsNonSessionTokens(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	keyfunc := func(*jwt.Token) (any, error) { return &key.PublicKey, nil }
	sign := func(claims jwt.MapClaims) string {
		s, err := jwt.NewWithClaims(jwt.SigningMethodRS256, claims).SignedString(key)
		if err != nil {
			t.Fatal(err)
		}
		return s
	}
	const iss = "https://clerk.example.com"
	pinned := &auth.JWTVerifier{Keyfunc: keyfunc, Issuer: iss}
	exp := time.Now().Add(time.Hour).Unix()

	if _, err := pinned.Verify(context.Background(),
		sign(jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": iss})); err != nil {
		t.Fatalf("correct issuer rejected: %v", err)
	}
	// A validly-signed token from a DIFFERENT issuer must not authenticate.
	if _, err := pinned.Verify(context.Background(),
		sign(jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": "https://evil.example.com"})); err == nil {
		t.Fatal("token from a different issuer was ACCEPTED")
	}
	// No issuer claim at all, while pinning is on.
	if _, err := pinned.Verify(context.Background(),
		sign(jwt.MapClaims{"sub": "user_1", "exp": exp})); err == nil {
		t.Fatal("token with no issuer was ACCEPTED while pinning is configured")
	}
	// A non-session token type (e.g. a JWT template for another service).
	if _, err := pinned.Verify(context.Background(),
		sign(jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": iss, "typ": "m2m"})); err == nil {
		t.Fatal("a non-session token type was ACCEPTED as a session")
	}
	// Unpinned (CLERK_ISSUER unset) still verifies signature + expiry.
	unpinned := &auth.JWTVerifier{Keyfunc: keyfunc}
	if _, err := unpinned.Verify(context.Background(),
		sign(jwt.MapClaims{"sub": "user_1", "exp": exp, "iss": "anything"})); err != nil {
		t.Fatalf("unpinned verifier should still accept a valid token: %v", err)
	}
	if _, err := unpinned.Verify(context.Background(),
		sign(jwt.MapClaims{"sub": "user_1", "exp": time.Now().Add(-time.Hour).Unix()})); err == nil {
		t.Fatal("expired token accepted")
	}
}
