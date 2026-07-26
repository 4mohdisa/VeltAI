// Package config is the single source of truth for deployment configuration.
// Everything is read from the environment; a backend/.env file (if present) is
// loaded at init as a DEV convenience — real environment variables always win.
package config

import (
	"net/url"
	"os"
	"strings"
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
// webhook URL derives from it. Set LUMO_BASE_URL in production
// (e.g. https://api.example.com); the default is the local dev server.
func BaseURL() string {
	return Env("LUMO_BASE_URL", "http://localhost:8080")
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

// CORSOrigins are the browser origins allowed to call the API.
func CORSOrigins() []string {
	return []string{BaseURL(), "http://localhost:8081"} // 8081 = Expo web dev server
}

// Timezone is the timezone for server-side "today"/"yesterday" math (streaks,
// morning brief, meal timing). Log dates are client-authored; this only anchors
// the server's view of the calendar. ponytail: one env for all users — per-user
// timezones need a profiles column when the app sends one.
func Timezone() *time.Location {
	if loc, err := time.LoadLocation(Env("LUMO_TIMEZONE", "UTC")); err == nil {
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
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
