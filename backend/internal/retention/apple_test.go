// Apple Retention Messaging behind RETENTION_MESSAGING_ENABLED. Every Apple
// call goes to a fake httptest server; nothing here reaches Apple.
package retention_test

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"
	"unicode/utf8"

	"github.com/golang-jwt/jwt/v5"

	"lume/backend/internal/retention"
)

// fakeApple records every request body it receives and answers with status.
type fakeApple struct {
	mu     sync.Mutex
	status int
	delay  time.Duration
	paths  []string
	bodies []string
	auth   []string
}

func (f *fakeApple) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	b, _ := io.ReadAll(r.Body)
	f.mu.Lock()
	f.paths = append(f.paths, r.Method+" "+r.URL.Path)
	f.bodies = append(f.bodies, string(b))
	f.auth = append(f.auth, r.Header.Get("Authorization"))
	f.mu.Unlock()
	select {
	case <-time.After(f.delay):
	case <-r.Context().Done():
		return
	}
	w.WriteHeader(f.status)
}

func appleServer(t *testing.T, f *fakeApple) *retention.AppleClient {
	t.Helper()
	srv := httptest.NewServer(f)
	t.Cleanup(srv.Close)
	c := retention.NewAppleClient(srv.URL, func() (string, error) { return "test-token", nil })
	c.HTTP.Timeout = 100 * time.Millisecond
	return c
}

func webhook(enabled bool) *httptest.ResponseRecorder {
	mux := http.NewServeMux()
	retention.RegisterWebhook(mux, enabled)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/webhooks/apple/retention",
		strings.NewReader(`{"signedPayload":"a.b.c"}`)))
	return rec
}

func TestFlagDefaultsOff(t *testing.T) {
	for v, want := range map[string]bool{"": false, "false": false, "true": true} {
		t.Setenv(retention.FlagEnv, v)
		if got := retention.Enabled(); got != want {
			t.Errorf("%s=%q: Enabled() = %v, want %v", retention.FlagEnv, v, got, want)
		}
	}
}

func TestWebhookFlagOffIs404(t *testing.T) {
	if rec := webhook(false); rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestWebhookFlagOnPicksDefaultMessage(t *testing.T) {
	rec := webhook(true)
	var body struct {
		Message struct {
			MessageIdentifier string `json:"messageIdentifier"`
		} `json:"message"`
	}
	if rec.Code != http.StatusOK || json.Unmarshal(rec.Body.Bytes(), &body) != nil {
		t.Fatalf("status %d, body %s", rec.Code, rec.Body)
	}
	if body.Message.MessageIdentifier != retention.Messages[retention.DefaultMessageKey].ID {
		t.Errorf("messageIdentifier = %q", body.Message.MessageIdentifier)
	}
}

func TestUploadOutcomes(t *testing.T) {
	m := retention.Messages[retention.DefaultMessageKey]
	cases := []struct {
		name    string
		status  int
		delay   time.Duration
		wantErr bool
	}{
		{"accepted", http.StatusOK, 0, false},
		{"already uploaded", http.StatusConflict, 0, false},
		{"apple 5xx", http.StatusServiceUnavailable, 0, true},
		{"apple timeout", http.StatusOK, time.Second, true},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			f := &fakeApple{status: c.status, delay: c.delay}
			err := appleServer(t, f).Upload(context.Background(), m)
			if (err != nil) != c.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, c.wantErr)
			}
			f.mu.Lock()
			defer f.mu.Unlock()
			if len(f.paths) != 1 || f.paths[0] != "PUT /inApps/v1/messaging/message/"+m.ID || f.auth[0] != "Bearer test-token" {
				t.Errorf("request %v auth %v", f.paths, f.auth)
			}
		})
	}
}

// Every byte Lume sends to Apple, uploads and webhook replies alike, is fixed
// copy: no food, body or health values, no email, no price or offer wording.
func TestOutgoingBodiesCarryNoUserOrPromoData(t *testing.T) {
	f := &fakeApple{status: http.StatusOK}
	c := appleServer(t, f)
	for key, m := range retention.Messages {
		if err := c.Upload(context.Background(), m); err != nil {
			t.Fatalf("%s: %v", key, err)
		}
		if n := utf8.RuneCountInString(m.Header); n > 66 {
			t.Errorf("%s header is %d characters, Apple allows 66", key, n)
		}
		if n := utf8.RuneCountInString(m.Body); n > 144 {
			t.Errorf("%s body is %d characters, Apple allows 144", key, n)
		}
	}
	f.mu.Lock()
	defer f.mu.Unlock()
	sent := append(f.bodies, webhook(true).Body.String())
	banned := []string{
		"chicken", "rice", "oats", "egg", "kcal", "calorie", "protein", "carb", "fat", "fibre",
		" kg", " lb", "weight", "height", "bmi", "@", "price", "$", "%", "discount", "offer", "free", "trial", "deal", "save",
	}
	for _, body := range sent {
		for _, word := range banned {
			if strings.Contains(strings.ToLower(body), word) {
				t.Errorf("outgoing body %q contains %q", body, word)
			}
		}
	}
	if len(f.bodies) != len(retention.Messages) {
		t.Errorf("%d uploads, want %d", len(f.bodies), len(retention.Messages))
	}
}

func TestAppleTokenIsES256WithKeyID(t *testing.T) {
	key, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	der, _ := x509.MarshalPKCS8PrivateKey(key)
	p8 := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: der}))
	signed, err := retention.AppleToken("KEY123", "issuer-1", "app.lume", p8)()
	if err != nil {
		t.Fatal(err)
	}
	tok, err := jwt.Parse(signed, func(*jwt.Token) (any, error) { return &key.PublicKey, nil },
		jwt.WithValidMethods([]string{"ES256"}), jwt.WithAudience("appstoreconnect-v1"), jwt.WithIssuer("issuer-1"))
	if err != nil || tok.Header["kid"] != "KEY123" || tok.Claims.(jwt.MapClaims)["bid"] != "app.lume" {
		t.Fatalf("token %v, err %v", tok, err)
	}
}
