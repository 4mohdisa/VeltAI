package security

// This test PINS A KNOWN OPEN FINDING (SECURITY_TEST_REPORT.md Part C,
// KNOWN_ISSUES.md Row 18b): no outbound HTTP client sets CheckRedirect, so an
// upstream 302 is followed to another host, carrying the query string (where
// the USDA key lives) and the Gemini key header. When the redirect guard Isa
// approves lands, flip the assertions: the second host must see no request.
//
// The first stub answers every call with a 302 to the same path on a second
// stub under another host name (localhost, against 127.0.0.1). Skipped unless
// LUME_TEST_DATABASE_URL is set.

import (
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"sync"
	"testing"
)

// redirected is one request the second host received.
type redirected struct {
	path, rawQuery string
	geminiKey      bool
}

func TestPG_OutboundRedirectIsFollowedToAnotherHost(t *testing.T) {
	var mu sync.Mutex
	var reached []redirected
	second := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		mu.Lock()
		reached = append(reached, redirected{r.URL.Path, r.URL.RawQuery, r.Header.Get("x-goog-api-key") != ""})
		mu.Unlock()
		fakeUpstream(w, r)
	}))
	t.Cleanup(second.Close)
	secondBase := strings.Replace(second.URL, "127.0.0.1", "localhost", 1)
	api := newStubbedAPI(t, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, secondBase+r.URL.RequestURI(), http.StatusFound)
	}))
	reachedPath := func(suffix string) (redirected, bool) {
		mu.Lock()
		defer mu.Unlock()
		for _, r := range reached {
			if strings.HasSuffix(r.path, suffix) {
				return r, true
			}
		}
		return redirected{}, false
	}

	t.Run("food search", func(t *testing.T) {
		rec := api.send(http.MethodGet, "/api/food/search?q=apple", "")
		wantEnvelope(t, rec)
		got, ok := reachedPath("/cgi/search.pl")
		if !ok {
			t.Fatal("the redirect to the second host was not followed; if the guard has landed, flip this test")
		}
		if !strings.Contains(got.rawQuery, "search_terms=apple") {
			t.Fatalf("second host got query %q, want it to carry search_terms=apple", got.rawQuery)
		}
	})

	t.Run("gemini photo scan", func(t *testing.T) {
		rec := api.send(http.MethodPost, "/api/scan", imageBody(smallPNG(t), "image/png"))
		wantEnvelope(t, rec)
		got, ok := reachedPath(":generateContent")
		if !ok {
			t.Fatal("the redirect to the second host was not followed; if the guard has landed, flip this test")
		}
		if !got.geminiKey {
			t.Fatal("the second host did not get the x-goog-api-key header")
		}
	})

	calls := api.rec.calls()
	if !slices.Contains(calls, secondBase) {
		t.Fatalf("recorded outbound calls %v, want one to %s", calls, secondBase)
	}
}
