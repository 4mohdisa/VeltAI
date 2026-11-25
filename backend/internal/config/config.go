// Package config is the single source of truth for deployment configuration.
// Everything is read from the environment; a backend/.env file (if present) is
// loaded at init as a DEV convenience — real environment variables always win.
package config

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

func init() { loadDotEnv(".env") }

// loadDotEnv sets KEY=VALUE lines from path into the process env, skipping
// blanks, comments, and keys already set (the real environment always wins).
// ponytail: no godotenv dep — quotes/escapes/multiline unsupported on purpose.
func loadDotEnv(path string) {
	b, err := os.ReadFile(path)
	if err != nil {
		return // no .env — production sets real env vars
	}
	for _, line := range strings.Split(string(b), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok || os.Getenv(k) != "" {
			continue
		}
		os.Setenv(strings.TrimSpace(k), strings.TrimSpace(v))
	}
}

// BaseURL is the API's public origin. Every CORS origin, redirect URL, and
// webhook URL derives from it. Set LUME_BASE_URL in production
// (e.g. https://api.example.com); the default is the local dev server.
func BaseURL() string {
	return Env("LUME_BASE_URL", "http://localhost:8080")
}

// Addr returns the listen address: PORT if set (Railway/Fly/Heroku convention),
// else the port of BaseURL, else :8080.
func Addr() string {
	if p := os.Getenv("PORT"); p != "" {
		return ":" + p
	}
	u, err := url.Parse(BaseURL())
	if err != nil || u.Port() == "" {
		return ":8080"
	}
	return ":" + u.Port()
}

// CORSOrigins are the browser origins allowed to call the API. The Expo web
// dev origin is included ONLY outside production — shipping it live would let
// any page on a user's own localhost:8081 read the production API
// cross-origin. Native app traffic is unaffected either way (no CORS).
func CORSOrigins() []string {
	origins := []string{BaseURL()}
	if !IsProduction() {
		origins = append(origins, "http://localhost:8081")
	}
	return origins
}

// IsProduction reports whether this looks like a real deployment. Hosted
// platforms (Railway/Fly/Heroku/Render) inject PORT; LUME_ENV overrides.
func IsProduction() bool {
	switch strings.ToLower(Env("LUME_ENV", "")) {
	case "production", "prod":
		return true
	case "development", "dev", "test":
		return false
	}
	return os.Getenv("PORT") != ""
}

// Validate reports fatal misconfiguration (empty slice = OK) and non-fatal
// warnings. Called at startup so a bad deploy fails LOUDLY instead of serving
// a process that 401s every request behind a green health check.
func Validate() (fatal []string, warn []string) {
	if os.Getenv("DATABASE_URL") == "" {
		fatal = append(fatal, "DATABASE_URL is not set — the server cannot serve any request")
	}
	// Without this, JWKS fetch fails and EVERY /api request 401s.
	if os.Getenv("CLERK_SECRET_KEY") == "" {
		fatal = append(fatal, "CLERK_SECRET_KEY is not set — every authenticated request would fail")
	}
	if IsProduction() {
		if u := BaseURL(); strings.Contains(u, "localhost") || strings.HasPrefix(u, "http://") {
			fatal = append(fatal, "LUME_BASE_URL must be a public https origin in production (got "+u+") — CORS and OAuth redirects derive from it")
		}
		if os.Getenv("CLERK_ISSUER") == "" {
			warn = append(warn, "CLERK_ISSUER is not set — tokens are not issuer-pinned (set it to your Clerk Frontend API URL)")
		}
	}
	keys := []string{"CLERK_WEBHOOK_SECRET", "REVENUECAT_WEBHOOK_AUTH", "INTEGRATION_ENCRYPTION_KEY", "GEMINI_API_KEY"}
	// Gemini runs insights, the brief and the query by default. Anthropic is
	// needed only when the optional Claude fallback is switched on.
	switch p := LLMProvider(); p {
	case "gemini":
	case "claude":
		keys = append(keys, "ANTHROPIC_API_KEY")
	default:
		fatal = append(fatal, "LLM_PROVIDER must be gemini or claude (got "+p+")")
	}
	if _, err := AIDailyLimit(); err != nil {
		fatal = append(fatal, err.Error())
	}
	for _, k := range keys {
		if os.Getenv(k) == "" {
			warn = append(warn, k+" is not set — the features that depend on it will return 503")
		}
	}
	return fatal, warn
}

// DefaultAIDailyLimit is the paid AI calls per user per UTC day when
// LUME_AI_DAILY_LIMIT is unset.
const DefaultAIDailyLimit = 20

// AIDailyLimit reads LUME_AI_DAILY_LIMIT: unset is DefaultAIDailyLimit, 0
// turns the cap off, and anything that is not a whole number of 0 or more is
// an error, which Validate turns into a refusal to start.
func AIDailyLimit() (int, error) {
	v := strings.TrimSpace(lookup("LUME_AI_DAILY_LIMIT"))
	if v == "" {
		return DefaultAIDailyLimit, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil || n < 0 {
		return 0, fmt.Errorf("LUME_AI_DAILY_LIMIT must be a whole number, 0 or more (got %q)", v)
	}
	return n, nil
}

// LLMProvider is the text AI provider for insights, the morning brief and the
// query: "gemini" (default) or "claude" (optional fallback).
func LLMProvider() string {
	return strings.ToLower(strings.TrimSpace(Env("LLM_PROVIDER", "gemini")))
}

// Timezone is the fallback timezone for server-side "today"/"yesterday" math
// (streaks, morning brief, meal timing) when a request carries none, and for
// background work with no request at all. Log dates are client-authored; this
// only anchors the server's view of the calendar.
func Timezone() *time.Location {
	if loc, err := time.LoadLocation(Env("LUME_TIMEZONE", "UTC")); err == nil {
		return loc
	}
	return time.UTC
}

type tzKey struct{}

// TimezoneHeader carries the device's IANA zone (e.g. Australia/Adelaide), so
// "today" is the user's calendar day, daylight saving included, whatever zone
// the server runs in.
const TimezoneHeader = "X-Timezone"

// WithTimezone stores the named IANA zone in ctx. An empty or unknown name
// leaves ctx unchanged, so a bad header falls back to LUME_TIMEZONE.
func WithTimezone(ctx context.Context, name string) context.Context {
	name = strings.TrimSpace(name)
	if name == "" || name == "Local" {
		return ctx
	}
	loc, err := time.LoadLocation(name)
	if err != nil {
		return ctx
	}
	return context.WithValue(ctx, tzKey{}, loc)
}

// TimezoneOf is the request's zone (see WithTimezone), else Timezone().
func TimezoneOf(ctx context.Context) *time.Location {
	if loc, ok := ctx.Value(tzKey{}).(*time.Location); ok {
		return loc
	}
	return Timezone()
}

// TimezoneMiddleware reads TimezoneHeader into the request context.
func TimezoneMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		next.ServeHTTP(w, r.WithContext(WithTimezone(r.Context(), r.Header.Get(TimezoneHeader))))
	})
}

// Today returns today's date (YYYY-MM-DD) in the request's timezone.
func Today(ctx context.Context) string {
	return time.Now().In(TimezoneOf(ctx)).Format("2006-01-02")
}

// Env reads an environment variable with a fallback.
func Env(key, fallback string) string {
	if v := lookup(key); v != "" {
		return v
	}
	return fallback
}

// deprecatedOnce tracks which legacy names we have already warned about, so a
// hot path does not spam the log.
var deprecatedOnce sync.Map

// lookup reads an env var, falling back to its pre-rename LUMO_* spelling.
//
// The product was renamed VeltAI → Lumo → Lume, and every LUMO_* variable
// became LUME_*. Deployments that still export the old names keep working: the
// new name wins, the old one is honoured with a one-time deprecation warning,
// and nothing silently reverts to a default because a var "disappeared".
// Delete this shim once no environment exports LUMO_* any more.
//
// (The 2026-08-06 audit found the original shim read "LUME_"+suffix — the
// rename script had rewritten the shim's own string literal, making it a
// self-referential no-op. The test in tests/config pins the real fallback.)
func lookup(key string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	legacy, ok := strings.CutPrefix(key, "LUME_")
	if !ok {
		return ""
	}
	legacy = "LUMO_" + legacy
	v := os.Getenv(legacy)
	if v == "" {
		return ""
	}
	if _, warned := deprecatedOnce.LoadOrStore(legacy, true); !warned {
		log.Printf("config: %s is deprecated — rename it to %s (still honoured for now)", legacy, key)
	}
	return v
}

// EnvInt reads an integer env var. A missing OR unparseable value yields the
// fallback — a typo'd limit must not silently become 0 (which would lock every
// free user out) or unlimited.
func EnvInt(key string, fallback int) int {
	v := lookup(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(strings.TrimSpace(v))
	if err != nil {
		log.Printf("config: %s=%q is not an integer — using %d", key, v, fallback)
		return fallback
	}
	return n
}

// EnvBool reads a boolean env var ("1", "t", "true", "yes" and their negatives,
// case-insensitive). Unparseable values yield the fallback.
func EnvBool(key string, fallback bool) bool {
	v := strings.TrimSpace(strings.ToLower(lookup(key)))
	if v == "" {
		return fallback
	}
	switch v {
	case "1", "t", "true", "y", "yes", "on":
		return true
	case "0", "f", "false", "n", "no", "off":
		return false
	}
	log.Printf("config: %s=%q is not a boolean — using %v", key, v, fallback)
	return fallback
}
