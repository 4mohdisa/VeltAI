package retention

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"lume/backend/internal/config"
	"lume/backend/internal/httpx"
)

// FlagEnv turns Apple Retention Messaging on. Off by default: the webhook
// answers 404 and nothing is uploaded.
const FlagEnv = "RETENTION_MESSAGING_ENABLED"

// Enabled reports whether FlagEnv is on.
func Enabled() bool { return config.EnvBool(FlagEnv, false) }

// Apple's Retention Messaging API, from developer.apple.com/documentation/
// retentionmessaging (Upload Message, Get Retention Message), read 27 Nov 2026.
const (
	// Sandbox only in Phase 4; production is https://api.storekit.apple.com.
	AppleSandboxBaseURL = "https://api.storekit-sandbox.apple.com"
	appleUploadPath     = "/inApps/v1/messaging/message/" // + messageIdentifier, PUT
)

// Message is one retention message Lume uploads to Apple. Text is fixed here:
// no price, discount or offer wording, and nothing about the user.
type Message struct {
	ID     string // Apple messageIdentifier, a UUID we own
	Header string // Apple limit: 66 characters
	Body   string // Apple limit: 144 characters
}

// Messages is the whole fixed set, keyed by message key.
var Messages = map[string]Message{
	"keep_progress": {
		ID:     "6f1c2b8e-3d4a-4b6f-9a1e-2c7d5e8f0a11",
		Header: "Your progress stays with you",
		Body:   "Your meals, workouts and streaks are all in Lume. Stay to keep building on them.",
	},
	"keep_insights": {
		ID:     "9b3e7d21-5c6f-4a8b-8e2d-4f1a6c9b0d22",
		Header: "Your insights keep getting sharper",
		Body:   "The more you log, the better Lume knows your routine. Stay to keep your daily insights.",
	},
}

// DefaultMessageKey is the message the webhook picks for every request.
const DefaultMessageKey = "keep_progress"

// RegisterWebhook mounts Apple's Get Retention Message endpoint (the URL given
// to Configure Realtime URL) on the root mux, since Apple sends no Clerk token.
// It always registers so a disabled flag answers 404 instead of falling
// through to the /api/ auth chain.
//
// ponytail: the reply is the same public message id for every caller, so the
// signedPayload is not read or signature-checked. Verify the JWS (x5c chain to
// Apple Root CA G3) once the choice depends on the payload.
func RegisterWebhook(mux *http.ServeMux, enabled bool) {
	mux.HandleFunc("POST /api/webhooks/apple/retention", func(w http.ResponseWriter, r *http.Request) {
		if !enabled {
			httpx.Error(w, http.StatusNotFound, "not found")
			return
		}
		// Apple reads a bare RealtimeResponseBody, not the API envelope.
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{
			"message": map[string]string{"messageIdentifier": Messages[DefaultMessageKey].ID},
		})
	})
}

// AppleClient uploads the fixed messages to Apple.
type AppleClient struct {
	BaseURL string
	HTTP    *http.Client
	Token   func() (string, error) // App Store Server API bearer JWT
}

// NewAppleClient returns a client with a 10 s timeout per call.
func NewAppleClient(baseURL string, token func() (string, error)) *AppleClient {
	return &AppleClient{BaseURL: baseURL, HTTP: &http.Client{Timeout: 10 * time.Second}, Token: token}
}

type uploadBody struct {
	Header string `json:"header"`
	Body   string `json:"body"`
}

// Upload PUTs one message. 409 means Apple already holds this id, so a rerun
// is not an error.
func (c *AppleClient) Upload(ctx context.Context, m Message) error {
	payload, err := json.Marshal(uploadBody{Header: m.Header, Body: m.Body})
	if err != nil {
		return err
	}
	token, err := c.Token()
	if err != nil {
		return fmt.Errorf("apple token: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, c.BaseURL+appleUploadPath+m.ID, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return fmt.Errorf("apple upload %s: %w", m.ID, err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusConflict {
		return fmt.Errorf("apple upload %s: status %d", m.ID, resp.StatusCode)
	}
	return nil
}

// AppleToken signs the App Store Server API JWT (ES256, 20 minute life) from
// the key Apple issues in App Store Connect.
func AppleToken(keyID, issuerID, bundleID, privateKeyPEM string) func() (string, error) {
	return func() (string, error) {
		key, err := jwt.ParseECPrivateKeyFromPEM([]byte(privateKeyPEM))
		if err != nil {
			return "", err
		}
		now := time.Now()
		t := jwt.NewWithClaims(jwt.SigningMethodES256, jwt.MapClaims{
			"iss": issuerID, "iat": now.Unix(), "exp": now.Add(20 * time.Minute).Unix(),
			"aud": "appstoreconnect-v1", "bid": bundleID,
		})
		t.Header["kid"] = keyID
		return t.SignedString(key)
	}
}
