package integrationstests

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"testing"
	"time"

	"lumo/backend/internal/auth"
	"lumo/backend/internal/integrations"
)

// ---------------------------------------------------------------------------
// Fakes
// ---------------------------------------------------------------------------

// oauthState mirrors one oauth_states row.
type oauthState struct {
	userID, provider string
	expiresAt        time.Time
}

type fakeStore struct {
	conns    map[string]integrations.Connection // key: user|provider
	imported map[string]bool                    // key: user|provider|activityID

	// mu guards states only: it makes ConsumeState indivisible, exactly as
	// DELETE ... RETURNING is indivisible in Postgres.
	mu       sync.Mutex
	states   map[string]oauthState
	stateErr error // when set, the state store is "down"
}

func newStore() *fakeStore {
	return &fakeStore{
		conns:    map[string]integrations.Connection{},
		imported: map[string]bool{},
		states:   map[string]oauthState{},
	}
}

func (f *fakeStore) IssueState(_ context.Context, token, userID, provider string, expiresAt time.Time) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.stateErr != nil {
		return f.stateErr
	}
	f.states[token] = oauthState{userID: userID, provider: provider, expiresAt: expiresAt}
	return nil
}

// ConsumeState is the fake's model of `DELETE ... RETURNING`: the row is removed
// and returned in one indivisible step, so exactly one caller can ever see it.
// The token is burned even when the provider or expiry then rejects it.
func (f *fakeStore) ConsumeState(_ context.Context, token, provider string, now time.Time) (string, bool, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.stateErr != nil {
		return "", false, f.stateErr
	}
	st, ok := f.states[token]
	if !ok {
		return "", false, nil
	}
	delete(f.states, token)
	if st.provider != provider || now.After(st.expiresAt) {
		return "", false, nil
	}
	return st.userID, true, nil
}

func ckey(u, p string) string { return u + "|" + p }

func (f *fakeStore) GetConnection(_ context.Context, userID, provider string) (*integrations.Connection, error) {
	c, ok := f.conns[ckey(userID, provider)]
	if !ok {
		return nil, nil
	}
	cp := c
	return &cp, nil
}
func (f *fakeStore) UpsertConnection(_ context.Context, c *integrations.Connection) error {
	// Preserve last_sync_at across a token refresh (matches the PG store).
	if prev, ok := f.conns[ckey(c.UserID, c.Provider)]; ok {
		c.LastSyncAt = prev.LastSyncAt
	}
	f.conns[ckey(c.UserID, c.Provider)] = *c
	return nil
}
func (f *fakeStore) DeleteConnection(_ context.Context, userID, provider string) (bool, error) {
	k := ckey(userID, provider)
	_, ok := f.conns[k]
	delete(f.conns, k)
	return ok, nil
}
func (f *fakeStore) ListConnections(_ context.Context, userID string) ([]integrations.Connection, error) {
	var out []integrations.Connection
	for _, c := range f.conns {
		if c.UserID == userID {
			out = append(out, c)
		}
	}
	return out, nil
}
func (f *fakeStore) CreateImportedSession(_ context.Context, in integrations.ImportedSession) (bool, error) {
	k := in.UserID + "|" + in.Provider + "|" + in.ActivityID
	if f.imported[k] {
		return false, nil
	}
	f.imported[k] = true
	return true, nil
}
func (f *fakeStore) TouchLastSync(_ context.Context, userID, provider string, t time.Time) error {
	c := f.conns[ckey(userID, provider)]
	c.LastSyncAt = &t
	f.conns[ckey(userID, provider)] = c
	return nil
}

type fakeProvider struct {
	name         string
	configured   bool
	exchangeTok  *integrations.TokenSet
	refreshTok   *integrations.TokenSet
	activities   []integrations.Activity
	exchangeErr  error
	lastAccess   string
	lastAfter    time.Time
	refreshCalls int
}

func (f *fakeProvider) Name() string     { return f.name }
func (f *fakeProvider) Configured() bool { return f.configured }
func (f *fakeProvider) Scopes() []string { return []string{"read"} }
func (f *fakeProvider) AuthURL(state, redirectURI string) string {
	q := url.Values{}
	q.Set("state", state)
	q.Set("redirect_uri", redirectURI)
	return "https://auth.example/oauth?" + q.Encode()
}
func (f *fakeProvider) Exchange(_ context.Context, _, _ string) (*integrations.TokenSet, error) {
	return f.exchangeTok, f.exchangeErr
}
func (f *fakeProvider) Refresh(_ context.Context, _ string) (*integrations.TokenSet, error) {
	f.refreshCalls++
	return f.refreshTok, nil
}
func (f *fakeProvider) FetchActivities(_ context.Context, accessToken string, after time.Time) ([]integrations.Activity, error) {
	f.lastAccess = accessToken
	f.lastAfter = after
	return f.activities, nil
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

func testKey() string { return base64.StdEncoding.EncodeToString(make([]byte, 32)) }

func serve(svc *integrations.Service) *http.ServeMux {
	mux := http.NewServeMux()
	integrations.Register(mux, svc)
	integrations.RegisterCallbacks(mux, svc)
	return mux
}

// do issues a request; user=="" means no auth context (for the public callback).
func do(t *testing.T, mux *http.ServeMux, user, method, path string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, nil)
	if user != "" {
		req = req.WithContext(auth.WithUserID(req.Context(), user))
	}
	w := httptest.NewRecorder()
	mux.ServeHTTP(w, req)
	return w
}

func decode[T any](t *testing.T, w *httptest.ResponseRecorder) T {
	t.Helper()
	var env struct {
		Data T `json:"data"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &env); err != nil {
		t.Fatalf("decode: %v (body %s)", err, w.Body.String())
	}
	return env.Data
}

// stateFromConnect drives connect and extracts the CSRF state from the auth URL.
func stateFromConnect(t *testing.T, mux *http.ServeMux, user, provider string) string {
	t.Helper()
	w := do(t, mux, user, "GET", "/api/integrations/"+provider+"/connect")
	if w.Code != http.StatusOK {
		t.Fatalf("connect status = %d (body %s)", w.Code, w.Body.String())
	}
	body := decode[map[string]string](t, w)
	u, err := url.Parse(body["url"])
	if err != nil {
		t.Fatalf("parse auth url: %v", err)
	}
	state := u.Query().Get("state")
	if state == "" {
		t.Fatal("no state in auth url")
	}
	return state
}

func strava(configured bool) *fakeProvider {
	return &fakeProvider{
		name:       "strava",
		configured: configured,
		exchangeTok: &integrations.TokenSet{
			AccessToken: "access-1", RefreshToken: "refresh-1",
			ExpiresAt: time.Now().Add(time.Hour), ExternalUserID: "athlete-9",
		},
		activities: []integrations.Activity{
			{ExternalID: "100", Name: "Morning Run", ExerciseName: "Running", SessionType: "cardio", Date: "2026-07-13", DurationMinutes: 30},
			{ExternalID: "101", Name: "Evening Ride", ExerciseName: "Cycling", SessionType: "cardio", Date: "2026-07-14", DurationMinutes: 45},
		},
	}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Cross-source duplicate guard (energy cross-check): the same workout arriving
// from a second source (manual log or another provider) must be skipped so the
// energy balance counts it once. Same date + same type + duration within 10min.
func TestIsCrossSourceDuplicate(t *testing.T) {
	iptr := func(n int) *int { return &n }
	existing := []integrations.ExistingSession{
		{SessionType: "cardio", DurationMinutes: iptr(45)},
		{SessionType: "strength", DurationMinutes: iptr(60)},
		{SessionType: "cardio", DurationMinutes: nil}, // unknown duration never matches
	}
	cases := []struct {
		name     string
		typ      string
		duration int
		want     bool
	}{
		{"same run from a 2nd provider (45 vs 45)", "cardio", 45, true},
		{"within tolerance (45 vs 52)", "cardio", 52, true},
		{"edge of tolerance (45 vs 55)", "cardio", 55, true},
		{"outside tolerance (45 vs 56)", "cardio", 56, false},
		{"different type same duration", "strength", 45, false},
		{"strength matches strength (60 vs 65)", "strength", 65, true},
		{"no candidate duration → import normally", "cardio", 0, false},
	}
	for _, c := range cases {
		if got := integrations.IsCrossSourceDuplicate(c.typ, c.duration, existing); got != c.want {
			t.Errorf("%s: got %v, want %v", c.name, got, c.want)
		}
	}
	// Nothing stored that day → never a duplicate.
	if integrations.IsCrossSourceDuplicate("cardio", 45, nil) {
		t.Error("empty existing: got duplicate, want not")
	}
}

func TestConnectCallbackSyncFlow(t *testing.T) {
	cipher, _ := integrations.NewCipher(testKey())
	store := newStore()
	fp := strava(true)
	svc := integrations.NewService(store, cipher, fp)
	mux := serve(svc)

	// connect → state
	state := stateFromConnect(t, mux, "u1", "strava")

	// callback (public, no auth) exchanges + stores the connection, redirects to app.
	w := do(t, mux, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state)
	if w.Code != http.StatusFound {
		t.Fatalf("callback status = %d, want 302", w.Code)
	}
	if loc := w.Header().Get("Location"); loc != "lumo://integrations/strava/success" {
		t.Fatalf("callback redirect = %q", loc)
	}

	// Connection stored with an ENCRYPTED access token (decryptable to the plaintext).
	conn, _ := store.GetConnection(context.Background(), "u1", "strava")
	if conn == nil {
		t.Fatal("no connection stored")
	}
	if conn.AccessToken == "access-1" {
		t.Fatal("access token stored in plaintext")
	}
	if pt, err := cipher.Decrypt(conn.AccessToken); err != nil || pt != "access-1" {
		t.Fatalf("stored token decrypt = %q,%v", pt, err)
	}
	if conn.ExternalUserID != "athlete-9" {
		t.Fatalf("external user id = %q", conn.ExternalUserID)
	}

	// sync imports both activities.
	res := decode[map[string]int](t, do(t, mux, "u1", "POST", "/api/integrations/strava/sync"))
	if res["imported"] != 2 || res["skipped"] != 0 {
		t.Fatalf("first sync = %+v, want imported 2 skipped 0", res)
	}
	// The provider received the decrypted access token, not ciphertext.
	if fp.lastAccess != "access-1" {
		t.Fatalf("provider got token %q, want access-1", fp.lastAccess)
	}

	// Second sync dedupes → 0 imported, 2 skipped, and passes a non-zero `after`.
	res = decode[map[string]int](t, do(t, mux, "u1", "POST", "/api/integrations/strava/sync"))
	if res["imported"] != 0 || res["skipped"] != 2 {
		t.Fatalf("second sync = %+v, want imported 0 skipped 2", res)
	}
	if fp.lastAfter.IsZero() {
		t.Fatal("second sync should pass a non-zero after watermark")
	}

	// disconnect removes the connection.
	del := decode[map[string]bool](t, do(t, mux, "u1", "DELETE", "/api/integrations/strava"))
	if !del["disconnected"] {
		t.Fatal("disconnect did not report removal")
	}
	if c, _ := store.GetConnection(context.Background(), "u1", "strava"); c != nil {
		t.Fatal("connection still present after disconnect")
	}
}

func TestConnectErrors(t *testing.T) {
	cipher, _ := integrations.NewCipher(testKey())
	svc := integrations.NewService(newStore(), cipher, strava(false)) // unconfigured
	mux := serve(svc)

	// unknown provider
	if w := do(t, mux, "u1", "GET", "/api/integrations/garmin/connect"); w.Code != http.StatusNotFound {
		t.Errorf("unknown provider = %d, want 404", w.Code)
	}
	// configured=false → 503
	if w := do(t, mux, "u1", "GET", "/api/integrations/strava/connect"); w.Code != http.StatusServiceUnavailable {
		t.Errorf("unconfigured connect = %d, want 503", w.Code)
	}
	// sync without a connection → 400
	svc2 := integrations.NewService(newStore(), cipher, strava(true))
	mux2 := serve(svc2)
	if w := do(t, mux2, "u1", "POST", "/api/integrations/strava/sync"); w.Code != http.StatusBadRequest {
		t.Errorf("sync not-connected = %d, want 400", w.Code)
	}
	// bad state on callback → error redirect
	if w := do(t, mux2, "", "GET", "/api/integrations/strava/callback?code=x&state=bogus"); w.Header().Get("Location") != "lumo://integrations/strava/error" {
		t.Errorf("bad-state callback redirect = %q", w.Header().Get("Location"))
	}
}

func TestNoCipher503(t *testing.T) {
	svc := integrations.NewService(newStore(), nil, strava(true)) // no encryption key
	mux := serve(svc)
	if w := do(t, mux, "u1", "GET", "/api/integrations/strava/connect"); w.Code != http.StatusServiceUnavailable {
		t.Errorf("connect w/o cipher = %d, want 503", w.Code)
	}
	if w := do(t, mux, "u1", "POST", "/api/integrations/strava/sync"); w.Code != http.StatusServiceUnavailable {
		t.Errorf("sync w/o cipher = %d, want 503", w.Code)
	}
	// list still works (no tokens involved) so the settings screen can render.
	if w := do(t, mux, "u1", "GET", "/api/integrations"); w.Code != http.StatusOK {
		t.Errorf("list w/o cipher = %d, want 200", w.Code)
	}
}

func TestSyncRefreshesExpiredToken(t *testing.T) {
	cipher, _ := integrations.NewCipher(testKey())
	store := newStore()
	fp := strava(true)
	// Exchanged token is already expired, with a refresh token present.
	fp.exchangeTok = &integrations.TokenSet{
		AccessToken: "old-access", RefreshToken: "the-refresh",
		ExpiresAt: time.Now().Add(-time.Hour),
	}
	fp.refreshTok = &integrations.TokenSet{
		AccessToken: "new-access", RefreshToken: "the-refresh",
		ExpiresAt: time.Now().Add(time.Hour),
	}
	svc := integrations.NewService(store, cipher, fp)
	mux := serve(svc)

	state := stateFromConnect(t, mux, "u1", "strava")
	do(t, mux, "", "GET", "/api/integrations/strava/callback?code=xyz&state="+state)

	do(t, mux, "u1", "POST", "/api/integrations/strava/sync")
	if fp.refreshCalls != 1 {
		t.Fatalf("refresh calls = %d, want 1", fp.refreshCalls)
	}
	if fp.lastAccess != "new-access" {
		t.Fatalf("sync used token %q, want new-access (refreshed)", fp.lastAccess)
	}
	// The refreshed token is persisted (encrypted).
	conn, _ := store.GetConnection(context.Background(), "u1", "strava")
	if pt, _ := cipher.Decrypt(conn.AccessToken); pt != "new-access" {
		t.Fatalf("stored token = %q, want new-access", pt)
	}
}

func TestListStatuses(t *testing.T) {
	cipher, _ := integrations.NewCipher(testKey())
	store := newStore()
	whoop := &fakeProvider{name: "whoop", configured: true}
	svc := integrations.NewService(store, cipher, strava(true), whoop)
	mux := serve(svc)

	// Connect strava only.
	state := stateFromConnect(t, mux, "u1", "strava")
	do(t, mux, "", "GET", "/api/integrations/strava/callback?code=x&state="+state)

	list := decode[[]integrations.ConnectionStatus](t, do(t, mux, "u1", "GET", "/api/integrations"))
	if len(list) != 2 {
		t.Fatalf("list len = %d, want 2 (both providers)", len(list))
	}
	got := map[string]bool{}
	for _, s := range list {
		got[s.Provider] = s.Connected
	}
	if !got["strava"] {
		t.Error("strava should be connected")
	}
	if got["whoop"] {
		t.Error("whoop should not be connected")
	}
}
