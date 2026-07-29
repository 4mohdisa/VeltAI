// Package integrations connects third-party fitness providers (Strava, WHOOP)
// over OAuth 2.0 and imports their workouts as gym_sessions. Access/refresh
// tokens are stored AES-256-GCM-encrypted (see crypto.go); when the encryption
// key is absent the token routes respond 503.
package integrations

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/httpx"
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Connection is a stored OAuth link. AccessToken/RefreshToken hold ciphertext as
// they live in the DB; the service encrypts on write and decrypts on read.
type Connection struct {
	UserID         string
	Provider       string
	AccessToken    string // encrypted (base64)
	RefreshToken   string // encrypted (base64); "" when the provider issues none
	ExpiresAt      *time.Time
	Scopes         []string
	ExternalUserID string
	ConnectedAt    time.Time
	LastSyncAt     *time.Time
}

// ConnectionStatus is the public per-provider view (never exposes tokens).
type ConnectionStatus struct {
	Provider       string     `json:"provider"`
	Connected      bool       `json:"connected"`
	LastSyncAt     *time.Time `json:"last_sync_at"`
	ExternalUserID string     `json:"external_user_id,omitempty"`
}

// TokenSet is a fresh set of credentials from an OAuth exchange or refresh.
type TokenSet struct {
	AccessToken    string
	RefreshToken   string
	ExpiresAt      time.Time
	ExternalUserID string
	Scopes         []string
}

// Activity is a provider workout normalized for import.
type Activity struct {
	ExternalID      string
	Name            string
	ExerciseName    string // mapped, e.g. Strava "Run" → "Running"
	SessionType     string // "cardio" | "strength"
	Date            string // YYYY-MM-DD (start_date_local)
	DurationMinutes int
	Calories        *float64       // provider-reported when available
	Parameters      map[string]any // mapped onto the Phase 12 parameter system
}

// ---------------------------------------------------------------------------
// Cross-source duplicate detection
// ---------------------------------------------------------------------------

// crossSourceToleranceMin: an import matching an existing session on the same
// date, same session_type, with a duration within this many minutes is treated
// as the SAME workout arriving from a second source (manual log, or another
// provider) and skipped — the energy balance must count it once.
// ponytail: date-granularity heuristic (gym_sessions stores no start time) —
// two genuinely distinct same-type sessions of similar length on one day, from
// different sources, will be merged. Store a start timestamp to upgrade.
const crossSourceToleranceMin = 10

// ExistingSession is the minimal shape of an already-stored session for
// duplicate comparison (same user, same date; caller filters out rows from the
// candidate's own provider — those dedupe exactly by activity id).
type ExistingSession struct {
	SessionType     string
	DurationMinutes *int
}

// IsCrossSourceDuplicate reports whether the candidate import is the same
// workout as one already stored from a different source.
func IsCrossSourceDuplicate(candidateType string, candidateDurationMin int, existing []ExistingSession) bool {
	if candidateDurationMin <= 0 {
		return false // no duration → nothing to match on; import normally
	}
	for _, e := range existing {
		if e.SessionType != candidateType || e.DurationMinutes == nil {
			continue
		}
		d := *e.DurationMinutes - candidateDurationMin
		if d < 0 {
			d = -d
		}
		if d <= crossSourceToleranceMin {
			return true
		}
	}
	return false
}

// ImportedSession is what a synced Activity becomes in gym_sessions.
type ImportedSession struct {
	UserID          string
	Provider        string
	ActivityID      string
	Date            string
	Name            string
	DurationMinutes int
	Calories        *float64
	SessionType     string
	ExerciseName    string
	Parameters      map[string]any // stored on the created gym_exercise (jsonb)
}

// Store persists connections and imported sessions.
type Store interface {
	// GetConnection returns nil,nil when the user has no connection to provider.
	GetConnection(ctx context.Context, userID, provider string) (*Connection, error)
	UpsertConnection(ctx context.Context, c *Connection) error
	// DeleteConnection reports whether a row was removed.
	DeleteConnection(ctx context.Context, userID, provider string) (bool, error)
	ListConnections(ctx context.Context, userID string) ([]Connection, error)
	// CreateImportedSession inserts the gym_session (+ one gym_exercise) for an
	// activity, returning created=false when it was already imported (dedupe on
	// the provider activity id).
	CreateImportedSession(ctx context.Context, in ImportedSession) (bool, error)
	TouchLastSync(ctx context.Context, userID, provider string, t time.Time) error

	// IssueState stores a one-time OAuth CSRF state. /connect and /callback are
	// two separate requests that need not hit the same instance, and a restart
	// between them must not strand the user, so the state is shared, not in RAM.
	IssueState(ctx context.Context, token, userID, provider string, expiresAt time.Time) error

	// ConsumeState redeems a state token, returning the user who started the
	// flow. It MUST delete and return in one statement (DELETE ... RETURNING):
	// two concurrent callbacks carrying the same state must not both succeed.
	// ok=false when the token is unknown, already used, expired, or was issued
	// for a different provider.
	ConsumeState(ctx context.Context, token, provider string, now time.Time) (string, bool, error)
}

// Provider is one OAuth fitness source. Real implementations (strava.go,
// whoop.go) make HTTP calls; tests inject a fake.
type Provider interface {
	Name() string
	// Configured reports whether the provider's client id/secret are present.
	Configured() bool
	Scopes() []string
	AuthURL(state, redirectURI string) string
	Exchange(ctx context.Context, code, redirectURI string) (*TokenSet, error)
	Refresh(ctx context.Context, refreshToken string) (*TokenSet, error)
	FetchActivities(ctx context.Context, accessToken string, after time.Time) ([]Activity, error)
}

// ---------------------------------------------------------------------------
// CSRF state
// ---------------------------------------------------------------------------

// stateTTL bounds how long an OAuth flow may stay half-finished.
const stateTTL = 10 * time.Minute

// issueState mints a 256-bit token and hands it to the shared store.
func (s *Service) issueState(ctx context.Context, userID, provider string) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)
	if err := s.store.IssueState(ctx, token, userID, provider, s.now().Add(stateTTL)); err != nil {
		return "", err
	}
	return token, nil
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

// Service wires the store, cipher and providers behind the HTTP handlers.
type Service struct {
	store     Store
	cipher    *Cipher // nil when INTEGRATION_ENCRYPTION_KEY is missing/invalid
	providers map[string]Provider
	order     []string // stable provider order for list responses
	now       func() time.Time
}

// NewService builds the service. A nil cipher disables the token routes (503).
func NewService(store Store, cipher *Cipher, providers ...Provider) *Service {
	now := time.Now
	svc := &Service{
		store:     store,
		cipher:    cipher,
		providers: map[string]Provider{},
		now:       now,
	}
	for _, p := range providers {
		svc.providers[p.Name()] = p
		svc.order = append(svc.order, p.Name())
	}
	return svc
}

// Register mounts the AUTHENTICATED integration routes on the api mux.
func Register(mux *http.ServeMux, s *Service) {
	mux.HandleFunc("GET /api/integrations", s.list)
	mux.HandleFunc("GET /api/integrations/{provider}/connect", s.connect)
	mux.HandleFunc("POST /api/integrations/{provider}/sync", s.sync)
	mux.HandleFunc("DELETE /api/integrations/{provider}", s.disconnect)
}

// RegisterCallbacks mounts the PUBLIC OAuth callback on the ROOT mux. The
// provider redirects the user's browser here with no Clerk JWT; identity comes
// from the one-time CSRF state issued at connect time. This more-specific pattern
// takes precedence over the /api/ auth-guarded catch-all.
func RegisterCallbacks(mux *http.ServeMux, s *Service) {
	mux.HandleFunc("GET /api/integrations/{provider}/callback", s.callback)
}

func (s *Service) redirectURI(provider string) string {
	return config.BaseURL() + "/api/integrations/" + provider + "/callback"
}

// redirectApp bounces the browser back into the native app via a deep link.
func (s *Service) redirectApp(w http.ResponseWriter, r *http.Request, provider, status string) {
	http.Redirect(w, r, "lumo://integrations/"+provider+"/"+status, http.StatusFound)
}

// storeTokens encrypts a TokenSet and upserts the connection.
func (s *Service) storeTokens(ctx context.Context, userID, provider string, ts *TokenSet) error {
	access, err := s.cipher.Encrypt(ts.AccessToken)
	if err != nil {
		return err
	}
	refresh := ""
	if ts.RefreshToken != "" {
		refresh, err = s.cipher.Encrypt(ts.RefreshToken)
		if err != nil {
			return err
		}
	}
	c := &Connection{
		UserID:         userID,
		Provider:       provider,
		AccessToken:    access,
		RefreshToken:   refresh,
		ExternalUserID: ts.ExternalUserID,
		Scopes:         ts.Scopes,
		ConnectedAt:    s.now(),
	}
	if !ts.ExpiresAt.IsZero() {
		e := ts.ExpiresAt
		c.ExpiresAt = &e
	}
	return s.store.UpsertConnection(ctx, c)
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

func (s *Service) list(w http.ResponseWriter, r *http.Request) {
	conns, err := s.store.ListConnections(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	byProvider := make(map[string]Connection, len(conns))
	for _, c := range conns {
		byProvider[c.Provider] = c
	}
	out := make([]ConnectionStatus, 0, len(s.order))
	for _, name := range s.order {
		st := ConnectionStatus{Provider: name}
		if c, ok := byProvider[name]; ok {
			st.Connected = true
			st.LastSyncAt = c.LastSyncAt
			st.ExternalUserID = c.ExternalUserID
		}
		out = append(out, st)
	}
	httpx.JSON(w, http.StatusOK, out)
}

// provider resolves the {provider} path value or writes 404.
func (s *Service) provider(w http.ResponseWriter, r *http.Request) (Provider, bool) {
	p, ok := s.providers[r.PathValue("provider")]
	if !ok {
		httpx.Error(w, http.StatusNotFound, "unknown provider")
		return nil, false
	}
	return p, true
}

// requireCipher writes 503 and returns false when tokens can't be handled.
func (s *Service) requireCipher(w http.ResponseWriter) bool {
	if s.cipher == nil {
		httpx.Error(w, http.StatusServiceUnavailable, "integrations not configured: INTEGRATION_ENCRYPTION_KEY is missing")
		return false
	}
	return true
}

func (s *Service) connect(w http.ResponseWriter, r *http.Request) {
	if !s.requireCipher(w) {
		return
	}
	p, ok := s.provider(w, r)
	if !ok {
		return
	}
	if !p.Configured() {
		httpx.Error(w, http.StatusServiceUnavailable, p.Name()+" not configured: client credentials missing")
		return
	}
	state, err := s.issueState(r.Context(), auth.UserID(r.Context()), p.Name())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not start OAuth")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"url": p.AuthURL(state, s.redirectURI(p.Name()))})
}

func (s *Service) callback(w http.ResponseWriter, r *http.Request) {
	providerName := r.PathValue("provider")
	p, ok := s.providers[providerName]
	code := r.URL.Query().Get("code")
	state := r.URL.Query().Get("state")
	if s.cipher == nil || !ok || code == "" || state == "" {
		s.redirectApp(w, r, providerName, "error")
		return
	}
	// Consumption is atomic and one-time: a storage error is indistinguishable
	// from an invalid state here, and both DENY.
	userID, valid, err := s.store.ConsumeState(r.Context(), state, providerName, s.now())
	if err != nil || !valid {
		s.redirectApp(w, r, providerName, "error")
		return
	}
	ts, err := p.Exchange(r.Context(), code, s.redirectURI(providerName))
	if err != nil {
		s.redirectApp(w, r, providerName, "error")
		return
	}
	if err := s.storeTokens(r.Context(), userID, providerName, ts); err != nil {
		s.redirectApp(w, r, providerName, "error")
		return
	}
	s.redirectApp(w, r, providerName, "success")
}

func (s *Service) sync(w http.ResponseWriter, r *http.Request) {
	if !s.requireCipher(w) {
		return
	}
	p, ok := s.provider(w, r)
	if !ok {
		return
	}
	userID := auth.UserID(r.Context())
	conn, err := s.store.GetConnection(r.Context(), userID, p.Name())
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	if conn == nil {
		httpx.Error(w, http.StatusBadRequest, "not connected to "+p.Name())
		return
	}
	accessToken, err := s.cipher.Decrypt(conn.AccessToken)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "could not read stored token")
		return
	}
	// Refresh an expired access token before syncing.
	if conn.ExpiresAt != nil && !conn.ExpiresAt.After(s.now()) && conn.RefreshToken != "" {
		refreshToken, err := s.cipher.Decrypt(conn.RefreshToken)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "could not read stored token")
			return
		}
		ts, err := p.Refresh(r.Context(), refreshToken)
		if err != nil {
			httpx.Error(w, http.StatusBadGateway, "token refresh failed")
			return
		}
		if err := s.storeTokens(r.Context(), userID, p.Name(), ts); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "storage error")
			return
		}
		accessToken = ts.AccessToken
	}
	var after time.Time
	if conn.LastSyncAt != nil {
		after = *conn.LastSyncAt
	}
	activities, err := p.FetchActivities(r.Context(), accessToken, after)
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, "could not fetch activities from "+p.Name())
		return
	}
	imported, skipped := 0, 0
	for _, a := range activities {
		created, err := s.store.CreateImportedSession(r.Context(), ImportedSession{
			UserID:          userID,
			Provider:        p.Name(),
			ActivityID:      a.ExternalID,
			Date:            a.Date,
			Name:            a.Name,
			DurationMinutes: a.DurationMinutes,
			Calories:        a.Calories,
			SessionType:     a.SessionType,
			ExerciseName:    a.ExerciseName,
			Parameters:      a.Parameters,
		})
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "storage error")
			return
		}
		if created {
			imported++
		} else {
			skipped++
		}
	}
	if err := s.store.TouchLastSync(r.Context(), userID, p.Name(), s.now()); err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]int{"imported": imported, "skipped": skipped})
}

func (s *Service) disconnect(w http.ResponseWriter, r *http.Request) {
	// No cipher needed: deleting a connection touches no tokens, so this keeps
	// working even after the encryption key is rotated away.
	if _, ok := s.provider(w, r); !ok {
		return
	}
	deleted, err := s.store.DeleteConnection(r.Context(), auth.UserID(r.Context()), r.PathValue("provider"))
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, "storage error")
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]bool{"disconnected": deleted})
}
