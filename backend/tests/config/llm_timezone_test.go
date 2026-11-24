package configtests

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"lume/backend/internal/config"
)

// Anthropic is no longer required: a Gemini-only deploy starts clean.
func TestValidateGeminiOnlyNeedsNoAnthropicKey(t *testing.T) {
	prodEnv(t)
	t.Setenv("LLM_PROVIDER", "")
	t.Setenv("ANTHROPIC_API_KEY", "")
	fatal, warn := config.Validate()
	if len(fatal) != 0 || len(warn) != 0 {
		t.Fatalf("gemini-only config: fatal=%v warn=%v, want none", fatal, warn)
	}
	if p := config.LLMProvider(); p != "gemini" {
		t.Errorf("default provider = %q, want gemini", p)
	}
}

func TestValidateClaudeFallbackWarnsWithoutAnthropicKey(t *testing.T) {
	prodEnv(t)
	t.Setenv("LLM_PROVIDER", "claude")
	t.Setenv("ANTHROPIC_API_KEY", "")
	_, warn := config.Validate()
	if !containsSubstr(warn, "ANTHROPIC_API_KEY") {
		t.Errorf("claude without a key should warn; got %v", warn)
	}
}

func TestValidateFatalOnUnknownProvider(t *testing.T) {
	prodEnv(t)
	t.Setenv("LLM_PROVIDER", "openai")
	fatal, _ := config.Validate()
	if !containsSubstr(fatal, "LLM_PROVIDER") {
		t.Errorf("unknown provider must be fatal; got %v", fatal)
	}
}

// "Today" follows the device zone in the X-Timezone header, daylight saving
// included, whatever LUME_TIMEZONE the server runs with.
func TestTimezoneHeaderSetsTheUsersCalendarDay(t *testing.T) {
	t.Setenv("LUME_TIMEZONE", "UTC")
	// 2026-01-15 22:00 UTC: summer, Sydney and Adelaide on daylight time.
	// 2026-07-15 14:00 UTC: winter, standard time. Perth has no DST.
	cases := []struct {
		zone   string
		at     time.Time
		day    string
		offset int // seconds east of UTC
	}{
		{"Australia/Sydney", time.Date(2026, 1, 15, 22, 0, 0, 0, time.UTC), "2026-01-16", 11 * 3600},
		{"Australia/Sydney", time.Date(2026, 7, 15, 14, 0, 0, 0, time.UTC), "2026-07-16", 10 * 3600},
		{"Australia/Adelaide", time.Date(2026, 1, 15, 22, 0, 0, 0, time.UTC), "2026-01-16", 10*3600 + 1800},
		{"Australia/Adelaide", time.Date(2026, 7, 15, 14, 0, 0, 0, time.UTC), "2026-07-15", 9*3600 + 1800},
		{"Australia/Perth", time.Date(2026, 1, 15, 15, 59, 0, 0, time.UTC), "2026-01-15", 8 * 3600},
		{"Australia/Perth", time.Date(2026, 1, 15, 16, 0, 0, 0, time.UTC), "2026-01-16", 8 * 3600},
	}
	for _, c := range cases {
		var loc *time.Location
		h := config.TimezoneMiddleware(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
			loc = config.TimezoneOf(r.Context())
		}))
		req := httptest.NewRequest("GET", "/api/x", nil)
		req.Header.Set(config.TimezoneHeader, c.zone)
		h.ServeHTTP(httptest.NewRecorder(), req)
		local := c.at.In(loc)
		if _, off := local.Zone(); off != c.offset || local.Format("2006-01-02") != c.day {
			t.Errorf("%s at %s: day %s offset %d, want %s offset %d", c.zone, c.at, local.Format("2006-01-02"), off, c.day, c.offset)
		}
	}
}

func TestBadOrMissingTimezoneFallsBack(t *testing.T) {
	t.Setenv("LUME_TIMEZONE", "Australia/Perth")
	for _, name := range []string{"", "Local", "Not/AZone", "../../etc/passwd"} {
		if got := config.TimezoneOf(config.WithTimezone(context.Background(), name)); got.String() != "Australia/Perth" {
			t.Errorf("%q: zone = %s, want the LUME_TIMEZONE fallback", name, got)
		}
	}
	if config.Today(context.Background()) != time.Now().In(config.Timezone()).Format("2006-01-02") {
		t.Error("Today without a header must use LUME_TIMEZONE")
	}
}
