// Package config is the single source of truth for deployment configuration.
// Everything is read from the environment; a backend/.env file (if present) is
// loaded at init as a DEV convenience — real environment variables always win.
package config

import (
	"log"
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
	for _, k := range []string{"CLERK_WEBHOOK_SECRET", "REVENUECAT_WEBHOOK_AUTH", "INTEGRATION_ENCRYPTION_KEY", "GEMINI_API_KEY", "ANTHROPIC_API_KEY"} {
		if os.Getenv(k) == "" {
			warn = append(warn, k+" is not set — the features that depend on it will return 503")
		}
	}
	return fatal, warn
}

// Timezone is the timezone for server-side "today"/"yesterday" math (streaks,
// morning brief, meal timing). Log dates are client-authored; this only anchors
// the server's view of the calendar. ponytail: one env for all users — per-user
// timezones need a profiles column when the app sends one.
func Timezone() *time.Location {
	if loc, err := time.LoadLocation(Env("LUME_TIMEZONE", "UTC")); err == nil {
		return loc
	}
	return time.UTC
}

// Today returns today's date (YYYY-MM-DD) in the configured timezone.
func Today() string {
	return time.Now().In(Timezone()).Format("2006-01-02")
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

// lookup reads an env var, falling back to its pre-rename LUME_* spelling.
//
// The product was renamed Lume/Lume → Lume, and every LUME_* variable became
// LUME_*. Deployments that still export the old names keep working: the new
// name wins, the old one is honoured with a one-time deprecation warning, and
// nothing silently reverts to a default because a var "disappeared". Delete
// this shim once no environment exports LUME_* any more.
func lookup(key string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	legacy, ok := strings.CutPrefix(key, "LUME_")
	if !ok {
		return ""
	}
	legacy = "LUME_" + legacy
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
