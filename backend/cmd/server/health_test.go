package main

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

// envelope mirrors httpx's {data, error} response shape.
type envelope struct {
	Data  map[string]any `json:"data"`
	Error *string        `json:"error"`
}

func decodeEnvelope(t *testing.T, rec *httptest.ResponseRecorder) envelope {
	t.Helper()
	var env envelope
	if err := json.Unmarshal(rec.Body.Bytes(), &env); err != nil {
		t.Fatalf("bad envelope: %v (body %s)", err, rec.Body)
	}
	return env
}

// fakePinger stands in for *pgxpool.Pool: err == nil means the database
// answered, non-nil means it did not.
type fakePinger struct{ err error }

func (f fakePinger) Ping(context.Context) error { return f.err }

// /health is the readiness probe: a load balancer or rolling deploy uses it
// to decide whether to route traffic here. It must reflect the database, not
// just the process — a dead DATABASE_URL answering 200 is what let the
// earlier audit find it useless as a health probe.
func TestHealthHandler_DBReachable_Returns200(t *testing.T) {
	h := healthHandler(fakePinger{})
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rec.Code, rec.Body)
	}
	env := decodeEnvelope(t, rec)
	if env.Data["status"] != "ok" {
		t.Errorf(`data.status = %v, want "ok"`, env.Data["status"])
	}
	for _, k := range []string{"revision", "built_at", "dirty"} {
		if _, ok := env.Data[k]; !ok {
			t.Errorf("data.%s missing from a healthy response", k)
		}
	}
}

func TestHealthHandler_DBUnreachable_Returns503(t *testing.T) {
	h := healthHandler(fakePinger{err: errors.New("dial tcp: connection refused")})
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503 (body %s)", rec.Code, rec.Body)
	}
	env := decodeEnvelope(t, rec)
	if env.Data["status"] == "ok" {
		t.Error(`data.status = "ok" with a dead database — /health must not lie to a load balancer`)
	}
	// The build identity must survive a DB failure too — it's the one piece of
	// information that tells an operator WHICH build is failing to reach Postgres.
	for _, k := range []string{"revision", "built_at", "dirty"} {
		if _, ok := env.Data[k]; !ok {
			t.Errorf("data.%s missing from the 503 response", k)
		}
	}
}

// /health/live is the liveness probe: is the process itself still running?
// It must stay 200 through a database outage, or a DB blip becomes a
// container restart loop.
func TestHealthLiveHandler_IgnoresDatabaseState(t *testing.T) {
	h := healthLiveHandler()
	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (body %s)", rec.Code, rec.Body)
	}
	env := decodeEnvelope(t, rec)
	if env.Data["status"] != "ok" {
		t.Errorf(`data.status = %v, want "ok"`, env.Data["status"])
	}
}
