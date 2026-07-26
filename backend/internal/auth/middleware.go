// Clerk JWT verification middleware. Every /api/* route (webhooks excepted)
// passes through Middleware, which verifies the bearer token and stashes the
// Clerk user ID in the request context.
package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"lumo/backend/internal/config"
	"lumo/backend/internal/httpx"
)

type ctxKey struct{}

// Verifier turns a bearer token into a Clerk user ID.
type Verifier interface {
	Verify(ctx context.Context, token string) (string, error)
}

// Middleware rejects requests without a valid Clerk JWT.
func Middleware(v Verifier) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			header := r.Header.Get("Authorization")
			token, ok := strings.CutPrefix(header, "Bearer ")
			if !ok || token == "" {
				httpx.Error(w, http.StatusUnauthorized, "missing bearer token")
				return
			}
			userID, err := v.Verify(r.Context(), token)
			if err != nil {
				httpx.Error(w, http.StatusUnauthorized, "invalid token")
				return
			}
			next.ServeHTTP(w, r.WithContext(WithUserID(r.Context(), userID)))
		})
	}
}

// WithUserID stashes a user ID in the context (middleware and tests).
func WithUserID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKey{}, id)
}

// UserID returns the authenticated Clerk user ID ("" if unauthenticated).
func UserID(ctx context.Context) string {
	id, _ := ctx.Value(ctxKey{}).(string)
	return id
}

// JWTVerifier verifies RS256 JWTs. Keyfunc is injectable so tests can supply
// a local RSA key instead of Clerk's JWKS.
type JWTVerifier struct {
	Keyfunc jwt.Keyfunc
}

func (v *JWTVerifier) Verify(_ context.Context, token string) (string, error) {
	parsed, err := jwt.Parse(token, v.Keyfunc,
		jwt.WithValidMethods([]string{"RS256"}),
		jwt.WithExpirationRequired())
	if err != nil || !parsed.Valid {
		return "", fmt.Errorf("verify: %w", err)
	}
	sub, err := parsed.Claims.GetSubject()
	if err != nil || sub == "" {
		return "", errors.New("verify: missing sub claim")
	}
	return sub, nil
}

// NewClerkVerifier verifies against Clerk's JWKS (fetched with CLERK_SECRET_KEY,
// cached for an hour, refetched on unknown kid so key rotation recovers fast).
func NewClerkVerifier() *JWTVerifier {
	cache := &jwksCache{fetch: fetchClerkJWKS}
	return &JWTVerifier{Keyfunc: func(t *jwt.Token) (any, error) {
		kid, _ := t.Header["kid"].(string)
		return cache.key(kid)
	}}
}

// jwksCache caches Clerk's signing keys. A fetch is allowed when the cache is
// empty, older than an hour, or missing the requested kid (key rotation), but
// never more than once per 30s, and never while holding the mutex — waiters
// serve the stale cache instead of queuing behind the network call.
type jwksCache struct {
	fetch func() (map[string]*rsa.PublicKey, error) // swapped in tests

	mu          sync.Mutex
	keys        map[string]*rsa.PublicKey
	fetchedAt   time.Time
	lastAttempt time.Time // set before every attempt, success or failure
	inFlight    bool
}

func (c *jwksCache) key(kid string) (*rsa.PublicKey, error) {
	c.mu.Lock()
	if k, ok := c.keys[kid]; ok && time.Since(c.fetchedAt) <= time.Hour {
		c.mu.Unlock()
		return k, nil
	}
	// Cache empty, stale, or missing this kid: refetch — unless one is
	// already running or we attempted within the last 30s.
	if c.inFlight || time.Since(c.lastAttempt) < 30*time.Second {
		k, ok := c.keys[kid]
		c.mu.Unlock()
		if ok {
			return k, nil // serve stale rather than pile on
		}
		return nil, errors.New("unknown signing key")
	}
	c.inFlight = true
	c.lastAttempt = time.Now()
	c.mu.Unlock()

	fresh, err := c.fetch() // network call, lock released

	c.mu.Lock()
	c.inFlight = false
	if err == nil {
		c.keys, c.fetchedAt = fresh, time.Now()
	}
	k, ok := c.keys[kid]
	c.mu.Unlock()
	if ok {
		return k, nil // stale keys keep serving when a refresh fails
	}
	if err != nil {
		return nil, err
	}
	return nil, errors.New("unknown signing key")
}

func fetchClerkJWKS() (map[string]*rsa.PublicKey, error) {
	secret := config.Env("CLERK_SECRET_KEY", "")
	if secret == "" {
		return nil, errors.New("CLERK_SECRET_KEY not set")
	}
	req, _ := http.NewRequest(http.MethodGet, "https://api.clerk.com/v1/jwks", nil)
	req.Header.Set("Authorization", "Bearer "+secret)
	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jwks fetch: status %d", resp.StatusCode)
	}
	var body struct {
		Keys []struct {
			Kty string `json:"kty"`
			Kid string `json:"kid"`
			N   string `json:"n"`
			E   string `json:"e"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}
	keys := make(map[string]*rsa.PublicKey, len(body.Keys))
	for _, k := range body.Keys {
		if k.Kty != "RSA" {
			continue
		}
		n, err := base64.RawURLEncoding.DecodeString(k.N)
		if err != nil {
			continue
		}
		e, err := base64.RawURLEncoding.DecodeString(k.E)
		if err != nil {
			continue
		}
		keys[k.Kid] = &rsa.PublicKey{
			N: new(big.Int).SetBytes(n),
			E: int(new(big.Int).SetBytes(e).Int64()),
		}
	}
	return keys, nil
}
