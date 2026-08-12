package scanpipelinetests

import (
	"context"
	"image/color"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"lume/backend/internal/db"
	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
)

// A scan pipeline goroutine is detached from its request: srv.Shutdown alone
// never waits for it. RegisterPipeline's drain func is the other half of
// graceful shutdown — it waits for in-flight scans up to a deadline, and
// anything still running when the deadline passes gets marked 'failed' so it
// never strands at 'analyzing' forever (the pre-fix behaviour: SIGTERM kills
// the goroutine outright with no chance to update its own row).

// TestDrain_MarksStillRunningScanFailedAtDeadline holds a scan mid-flight
// (blocked on the Gemini call) past the drain deadline, and asserts the row
// is marked 'failed' rather than left at 'analyzing'.
func TestDrain_MarksStillRunningScanFailedAtDeadline(t *testing.T) {
	t.Setenv("LUME_SCAN_CONCURRENCY", "1")

	release := make(chan struct{})
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		<-release // held open past the drain deadline on purpose
		_, _ = w.Write(wrapEnvelope(t, `[]`))
	}))
	defer srv.Close()
	gem := pipeline.NewGemini("test")
	gem.Base = srv.URL

	store := newFakePipelineStore()
	mux := http.NewServeMux()
	drain := scan.RegisterPipeline(mux, gem, store, db.Querier(nil))
	if drain == nil {
		t.Fatal("RegisterPipeline returned a nil drain func")
	}

	body := scanBody(t, solidPNG(t, color.RGBA{10, 20, 30, 255}))
	if rec := post(t, mux, body); rec.Code != http.StatusAccepted {
		t.Fatalf("scan status = %d, want 202 (body %s)", rec.Code, rec.Body)
	}

	// The goroutine is blocked in the release-gated Gemini call, so it is
	// still "in flight" when this fires — well before the pipeline's own
	// runTimeout (120s default) would ever cut it off.
	ctx, cancel := context.WithTimeout(context.Background(), 50*time.Millisecond)
	defer cancel()
	drain(ctx)

	select {
	case fin := <-store.finished:
		if fin.status != "failed" {
			t.Fatalf("FinishScanLog status = %q, want %q", fin.status, "failed")
		}
		if fin.id != "log_abc" {
			t.Fatalf("FinishScanLog id = %q, want %q", fin.id, "log_abc")
		}
	case <-time.After(2 * time.Second):
		t.Fatal("drain returned but never marked the in-flight scan failed")
	}

	// Let the goroutine finish so it doesn't leak past the test. Its own,
	// later FinishScanLog call (if any) is silently absorbed by the fake
	// store's buffered channel — this only proves drain's own write landed.
	close(release)
}

// TestDrain_ReturnsImmediatelyWhenNothingInFlight proves drain does not block
// for its full deadline when there is nothing to wait for, and does not mark
// anything failed.
func TestDrain_ReturnsImmediatelyWhenNothingInFlight(t *testing.T) {
	store := newFakePipelineStore()
	mux := http.NewServeMux()
	gem, gsrv := geminiServer(t, `[]`)
	defer gsrv.Close()
	drain := scan.RegisterPipeline(mux, gem, store, db.Querier(nil))

	start := time.Now()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	drain(ctx)
	if elapsed := time.Since(start); elapsed > 500*time.Millisecond {
		t.Fatalf("drain took %s with nothing in flight, want near-instant", elapsed)
	}

	select {
	case fin := <-store.finished:
		t.Fatalf("drain marked something failed with nothing in flight: %+v", fin)
	default:
	}
}

// TestDrain_DoesNotRefailAScanThatAlreadyFinished proves a scan that
// completes naturally before the deadline is not force-marked failed by
// drain — the WaitGroup must actually track completion, not just launches.
func TestDrain_DoesNotRefailAScanThatAlreadyFinished(t *testing.T) {
	store := newFakePipelineStore()
	mux := http.NewServeMux()
	gem, gsrv := geminiServer(t, `[]`)
	defer gsrv.Close()
	drain := scan.RegisterPipeline(mux, gem, store, db.Querier(nil))

	body := scanBody(t, solidPNG(t, color.RGBA{1, 1, 1, 255}))
	if rec := post(t, mux, body); rec.Code != http.StatusAccepted {
		t.Fatalf("scan status = %d, want 202 (body %s)", rec.Code, rec.Body)
	}

	// Let it finish naturally first.
	select {
	case <-store.finished:
	case <-time.After(5 * time.Second):
		t.Fatal("pipeline never finished")
	}

	// Now drain with an already-tiny deadline; nothing should be in flight,
	// so nothing new should be written.
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Millisecond)
	defer cancel()
	drain(ctx)

	select {
	case fin := <-store.finished:
		t.Fatalf("drain re-wrote an already-finished scan: %+v", fin)
	default:
	}
}
