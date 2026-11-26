// In-package tests for the Strava and WHOOP providers and the shared OAuth HTTP
// helpers. Every provider call goes to an httptest server: fakeUpstream swaps
// the package httpClient for one whose transport rewrites the hard-coded
// provider host to the fake, and records what was sent.
package integrations

import (
	"bytes"
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"reflect"
	"strings"
	"testing"
	"time"
)

type sentRequest struct {
	URL  *url.URL
	Auth string
	Form url.Values
}

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }

// fakeUpstream serves every provider request with h and returns the requests as
// sent (original provider URL, bearer header and form body).
func fakeUpstream(t *testing.T, h http.HandlerFunc) (*[]sentRequest, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(h)
	t.Cleanup(srv.Close)
	target, err := url.Parse(srv.URL)
	if err != nil {
		t.Fatalf("parse fake url: %v", err)
	}
	sent := &[]sentRequest{}
	prev := httpClient
	httpClient = &http.Client{Timeout: prev.Timeout, Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		req := sentRequest{URL: r.URL, Auth: r.Header.Get("Authorization")}
		if r.Body != nil {
			b, err := io.ReadAll(r.Body)
			if err != nil {
				return nil, err
			}
			if req.Form, err = url.ParseQuery(string(b)); err != nil {
				return nil, err
			}
			r.Body = io.NopCloser(bytes.NewReader(b))
		}
		*sent = append(*sent, req)
		out := r.Clone(r.Context())
		out.URL.Scheme, out.URL.Host, out.Host = target.Scheme, target.Host, target.Host
		return http.DefaultTransport.RoundTrip(out)
	})}
	t.Cleanup(func() { httpClient = prev })
	return sent, srv
}

func respond(status int, body string) http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(status)
		_, _ = io.WriteString(w, body)
	}
}

func configured(t *testing.T) (*Strava, *Whoop) {
	t.Helper()
	t.Setenv("STRAVA_CLIENT_ID", "strava-id")
	t.Setenv("STRAVA_CLIENT_SECRET", "strava-secret")
	t.Setenv("WHOOP_CLIENT_ID", "whoop-id")
	t.Setenv("WHOOP_CLIENT_SECRET", "whoop-secret")
	return NewStrava(), NewWhoop()
}

func TestProviderConfigAndAuthURL(t *testing.T) {
	for _, key := range []string{"STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "WHOOP_CLIENT_ID", "WHOOP_CLIENT_SECRET"} {
		t.Setenv(key, "")
	}
	if NewStrava().Configured() || NewWhoop().Configured() {
		t.Fatal("providers without client credentials must not be configured")
	}
	t.Setenv("STRAVA_CLIENT_ID", "only-id")
	if NewStrava().Configured() {
		t.Fatal("a client id without a secret must not be configured")
	}

	strava, whoop := configured(t)
	cases := []struct {
		p              Provider
		name, host     string
		path, clientID string
		scope          string
	}{
		{strava, "strava", "www.strava.com", "/oauth/authorize", "strava-id", "activity:read_all"},
		{whoop, "whoop", "api.prod.whoop.com", "/oauth/oauth2/auth", "whoop-id", "read:workout read:recovery read:cycles read:profile"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.p.Name() != tc.name || !tc.p.Configured() {
				t.Fatalf("Name/Configured = %q/%v", tc.p.Name(), tc.p.Configured())
			}
			u, err := url.Parse(tc.p.AuthURL("st4te", "https://api.test/cb"))
			if err != nil {
				t.Fatalf("parse auth url: %v", err)
			}
			q := u.Query()
			if u.Host != tc.host || u.Path != tc.path || q.Get("client_id") != tc.clientID ||
				q.Get("redirect_uri") != "https://api.test/cb" || q.Get("response_type") != "code" ||
				q.Get("state") != "st4te" || q.Get("scope") != tc.scope {
				t.Fatalf("auth url = %s", u)
			}
		})
	}
}

func TestTokenExchangeAndRefresh(t *testing.T) {
	strava, whoop := configured(t)
	ctx := context.Background()
	cases := []struct {
		name  string
		call  func() (*TokenSet, error)
		body  string
		form  map[string]string
		check func(t *testing.T, ts *TokenSet)
	}{
		{
			name: "strava exchange",
			call: func() (*TokenSet, error) { return strava.Exchange(ctx, "c0de", "ignored") },
			body: `{"access_token":"a1","refresh_token":"r1","expires_at":1784000000,"athlete":{"id":42}}`,
			form: map[string]string{"grant_type": "authorization_code", "code": "c0de", "client_id": "strava-id", "client_secret": "strava-secret"},
			check: func(t *testing.T, ts *TokenSet) {
				want := &TokenSet{AccessToken: "a1", RefreshToken: "r1", ExpiresAt: time.Unix(1784000000, 0), ExternalUserID: "42", Scopes: []string{"activity:read_all"}}
				if !reflect.DeepEqual(ts, want) {
					t.Fatalf("token set = %+v, want %+v", ts, want)
				}
			},
		},
		{
			name: "strava refresh with partial response",
			call: func() (*TokenSet, error) { return strava.Refresh(ctx, "r1") },
			body: `{"access_token":"a2","unexpected":true}`,
			form: map[string]string{"grant_type": "refresh_token", "refresh_token": "r1"},
			check: func(t *testing.T, ts *TokenSet) {
				if ts.AccessToken != "a2" || ts.RefreshToken != "" || !ts.ExpiresAt.IsZero() || ts.ExternalUserID != "" {
					t.Fatalf("partial token set = %+v", ts)
				}
			},
		},
		{
			name: "whoop exchange",
			call: func() (*TokenSet, error) { return whoop.Exchange(ctx, "c0de", "https://api.test/cb") },
			body: `{"access_token":"w1","refresh_token":"wr","expires_in":3600}`,
			form: map[string]string{"grant_type": "authorization_code", "code": "c0de", "redirect_uri": "https://api.test/cb", "client_id": "whoop-id"},
			check: func(t *testing.T, ts *TokenSet) {
				if ts.AccessToken != "w1" || ts.RefreshToken != "wr" || time.Until(ts.ExpiresAt) < 59*time.Minute || len(ts.Scopes) != 4 {
					t.Fatalf("token set = %+v", ts)
				}
			},
		},
		{
			name: "whoop refresh without expiry",
			call: func() (*TokenSet, error) { return whoop.Refresh(ctx, "wr") },
			body: `{"access_token":"w2"}`,
			form: map[string]string{"grant_type": "refresh_token", "refresh_token": "wr", "scope": "read:workout read:recovery read:cycles read:profile"},
			check: func(t *testing.T, ts *TokenSet) {
				if ts.AccessToken != "w2" || !ts.ExpiresAt.IsZero() {
					t.Fatalf("token set = %+v", ts)
				}
			},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			sent, _ := fakeUpstream(t, respond(http.StatusOK, tc.body))
			ts, err := tc.call()
			if err != nil {
				t.Fatalf("call: %v", err)
			}
			tc.check(t, ts)
			if len(*sent) != 1 {
				t.Fatalf("sent %d requests, want 1", len(*sent))
			}
			for k, v := range tc.form {
				if got := (*sent)[0].Form.Get(k); got != v {
					t.Errorf("form %s = %q, want %q", k, got, v)
				}
			}
		})
	}
}

func TestStravaFetchActivities(t *testing.T) {
	strava, _ := configured(t)
	sent, _ := fakeUpstream(t, respond(http.StatusOK, `[
		{"id":1,"name":"Morning Run","type":"Run","start_date_local":"2026-07-14T07:00:00Z","moving_time":1800,
		 "calories":300,"average_speed":2.5,"distance":5000,"total_elevation_gain":50},
		{"id":2,"name":"","type":"Ride","start_date_local":"2026-07-14T18:00:00Z","moving_time":3600,
		 "average_watts":180.54,"distance":1000,"total_elevation_gain":500},
		{"id":3,"type":"Yoga"}
	]`))

	got, err := strava.FetchActivities(context.Background(), "tok", time.Unix(1784000000, 0))
	if err != nil {
		t.Fatalf("fetch: %v", err)
	}
	kcal := 300.0
	want := []Activity{
		{ExternalID: "1", Name: "Morning Run", ExerciseName: "Running", SessionType: "cardio", Date: "2026-07-14", DurationMinutes: 30,
			Calories: &kcal, Parameters: map[string]any{"duration_minutes": 30, "speed_kmh": 9.0, "incline_percent": 1.0}},
		{ExternalID: "2", Name: "Cycling", ExerciseName: "Cycling", SessionType: "cardio", Date: "2026-07-14", DurationMinutes: 60,
			Parameters: map[string]any{"duration_minutes": 60, "incline_percent": 15.0, "watts": 180.5}},
		{ExternalID: "3", Name: "Yoga", ExerciseName: "Yoga", SessionType: "cardio", Parameters: map[string]any{"duration_minutes": 0}},
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("activities =\n%+v\nwant\n%+v", got, want)
	}
	req := (*sent)[0]
	if req.Auth != "Bearer tok" || req.URL.Host != "www.strava.com" || req.URL.Query().Get("after") != "1784000000" || req.URL.Query().Get("per_page") != "50" {
		t.Fatalf("request = %s (auth %q)", req.URL, req.Auth)
	}

	if _, err := strava.FetchActivities(context.Background(), "tok", time.Time{}); err != nil {
		t.Fatalf("fetch without watermark: %v", err)
	}
	if (*sent)[1].URL.Query().Has("after") {
		t.Fatalf("first sync sent an after filter: %s", (*sent)[1].URL)
	}
}

func TestWhoopFetchActivities(t *testing.T) {
	_, whoop := configured(t)
	sent, _ := fakeUpstream(t, respond(http.StatusOK, `{"next_token":"ignored","records":[
		{"id":7,"start":"2026-07-14T08:00:00Z","end":"2026-07-14T08:45:00Z","score":{"kilojoule":2092,"strain":12.5}},
		{"id":8,"start":"bad"}
	]}`))
	after := time.Date(2026, 7, 13, 6, 0, 0, 0, time.FixedZone("AEST", 10*3600))

	got, err := whoop.FetchActivities(context.Background(), "tok", after)
	if err != nil {
		t.Fatalf("fetch: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("got %d activities, want 2", len(got))
	}
	full, partial := got[0], got[1]
	if full.ExternalID != "7" || full.Date != "2026-07-14" || full.DurationMinutes != 45 || full.Calories == nil ||
		*full.Calories < 499.9 || *full.Calories > 500.1 || full.Parameters["strain"] != 12.5 {
		t.Fatalf("full workout = %+v", full)
	}
	if partial.DurationMinutes != 0 || partial.Calories != nil || partial.Parameters["strain"] != nil || partial.Name != "WHOOP Workout" {
		t.Fatalf("partial workout = %+v", partial)
	}
	req := (*sent)[0]
	if req.Auth != "Bearer tok" || req.URL.Query().Get("start") != "2026-07-12T20:00:00Z" || req.URL.Query().Get("limit") != "25" {
		t.Fatalf("request = %s (auth %q)", req.URL, req.Auth)
	}
}

// providerCalls runs every network method of both providers once.
func providerCalls(ctx context.Context, strava *Strava, whoop *Whoop) map[string]func() error {
	return map[string]func() error{
		"strava exchange": func() error { _, err := strava.Exchange(ctx, "c", ""); return err },
		"strava refresh":  func() error { _, err := strava.Refresh(ctx, "r"); return err },
		"strava fetch":    func() error { _, err := strava.FetchActivities(ctx, "t", time.Time{}); return err },
		"whoop exchange":  func() error { _, err := whoop.Exchange(ctx, "c", ""); return err },
		"whoop refresh":   func() error { _, err := whoop.Refresh(ctx, "r"); return err },
		"whoop fetch":     func() error { _, err := whoop.FetchActivities(ctx, "t", time.Time{}); return err },
	}
}

func TestProviderUpstreamFailures(t *testing.T) {
	strava, whoop := configured(t)
	long := strings.Repeat("x", 300)
	cases := []struct {
		name    string
		status  int
		body    string
		wantErr string
	}{
		{"unauthorized with long body is truncated", http.StatusUnauthorized, long, "provider returned 401: " + long[:200]},
		{"server error", http.StatusBadGateway, "", "provider returned 502: "},
		{"not JSON", http.StatusOK, "<html>", "invalid character"},
		{"wrong JSON shape", http.StatusOK, `"just a string"`, "cannot unmarshal"},
	}
	for _, tc := range cases {
		for name, call := range providerCalls(context.Background(), strava, whoop) {
			t.Run(tc.name+"/"+name, func(t *testing.T) {
				fakeUpstream(t, respond(tc.status, tc.body))
				err := call()
				if err == nil || !strings.Contains(err.Error(), tc.wantErr) {
					t.Fatalf("err = %v, want it to contain %q", err, tc.wantErr)
				}
				if tc.status != http.StatusOK && len(err.Error()) > len("provider returned 401: ")+200 {
					t.Fatalf("error body not truncated: %d chars", len(err.Error()))
				}
			})
		}
	}
}

func TestProviderNetworkFailureAndTimeout(t *testing.T) {
	strava, whoop := configured(t)

	t.Run("provider unreachable", func(t *testing.T) {
		_, srv := fakeUpstream(t, respond(http.StatusOK, "{}"))
		srv.Close()
		for name, call := range providerCalls(context.Background(), strava, whoop) {
			if err := call(); err == nil {
				t.Errorf("%s: want an error when the provider is unreachable", name)
			}
		}
	})

	t.Run("provider hangs past the deadline", func(t *testing.T) {
		// The server does not notice a client hang-up on a POST whose body the
		// handler never reads, so release is what lets srv.Close finish.
		release := make(chan struct{})
		fakeUpstream(t, func(w http.ResponseWriter, r *http.Request) {
			select {
			case <-r.Context().Done():
			case <-release:
			}
		})
		t.Cleanup(func() { close(release) })
		ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
		defer cancel()
		for name, call := range providerCalls(ctx, strava, whoop) {
			if err := call(); !errors.Is(err, context.DeadlineExceeded) {
				t.Errorf("%s: err = %v, want context.DeadlineExceeded", name, err)
			}
		}
	})
}
