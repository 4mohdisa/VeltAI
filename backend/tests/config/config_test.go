// Startup configuration guards. A bad deploy must fail LOUDLY, not serve a
// process that 401s every request behind a green health check.
package configtests

import (
	"os"
	"regexp"
	"strings"
	"testing"

	"lume/backend/internal/config"
)

func setEnv(t *testing.T, kv map[string]string) {
	t.Helper()
	for k, v := range kv {
		t.Setenv(k, v)
	}
}

// A production-shaped environment with everything required present.
func prodEnv(t *testing.T) {
	setEnv(t, map[string]string{
		"LUME_ENV":             "production",
		"DATABASE_URL":         "postgres://x/y",
		"CLERK_SECRET_KEY":     "sk_live_x",
		"LUME_BASE_URL":        "https://api.example.com",
		"CLERK_ISSUER":         "https://clerk.example.com",
		"CLERK_WEBHOOK_SECRET": "whsec_x", "REVENUECAT_WEBHOOK_AUTH": "rc",
		"INTEGRATION_ENCRYPTION_KEY": "k", "GEMINI_API_KEY": "g", "ANTHROPIC_API_KEY": "a",
	})
}

func TestValidateAcceptsCompleteProdConfig(t *testing.T) {
	prodEnv(t)
	fatal, warn := config.Validate()
	if len(fatal) != 0 {
		t.Fatalf("fatal on a complete config: %v", fatal)
	}
	if len(warn) != 0 {
		t.Errorf("unexpected warnings: %v", warn)
	}
}

func TestValidateFatalOnMissingClerkSecret(t *testing.T) {
	prodEnv(t)
	t.Setenv("CLERK_SECRET_KEY", "")
	fatal, _ := config.Validate()
	if !containsSubstr(fatal, "CLERK_SECRET_KEY") {
		t.Fatalf("missing CLERK_SECRET_KEY must be FATAL (every request would 401); got %v", fatal)
	}
}

func TestValidateFatalOnMissingDatabaseURL(t *testing.T) {
	prodEnv(t)
	t.Setenv("DATABASE_URL", "")
	fatal, _ := config.Validate()
	if !containsSubstr(fatal, "DATABASE_URL") {
		t.Fatalf("missing DATABASE_URL must be FATAL; got %v", fatal)
	}
}

// A production deploy that forgets LUME_BASE_URL would otherwise come up with a
// localhost CORS allowlist and a localhost OAuth redirect_uri.
func TestValidateFatalOnLocalhostBaseURLInProduction(t *testing.T) {
	prodEnv(t)
	t.Setenv("LUME_BASE_URL", "http://localhost:8080")
	fatal, _ := config.Validate()
	if !containsSubstr(fatal, "LUME_BASE_URL") {
		t.Fatalf("localhost base URL must be FATAL in production; got %v", fatal)
	}
}

func TestValidateWarnsOnDegradingSecrets(t *testing.T) {
	prodEnv(t)
	t.Setenv("GEMINI_API_KEY", "")
	_, warn := config.Validate()
	if !containsSubstr(warn, "GEMINI_API_KEY") {
		t.Errorf("a missing feature key should WARN so a partial deploy is visible; got %v", warn)
	}
}

// The Expo web dev origin must never be allowed against a production API.
func TestCORSOriginsExcludeLocalhostInProduction(t *testing.T) {
	prodEnv(t)
	for _, o := range config.CORSOrigins() {
		if strings.Contains(o, "localhost") {
			t.Fatalf("production CORS allowlist contains %q", o)
		}
	}
	// ...but development keeps it, or the Expo web client breaks.
	t.Setenv("LUME_ENV", "development")
	if !containsSubstr(config.CORSOrigins(), "localhost:8081") {
		t.Error("development should still allow the Expo web dev origin")
	}
}

func TestEnvIntAndBoolFallBackOnGarbage(t *testing.T) {
	t.Setenv("LUME_TEST_INT", "not-a-number")
	if got := config.EnvInt("LUME_TEST_INT", 7); got != 7 {
		t.Errorf("EnvInt garbage = %d, want the fallback 7 (a typo'd limit must not become 0)", got)
	}
	t.Setenv("LUME_TEST_BOOL", "maybe")
	if got := config.EnvBool("LUME_TEST_BOOL", true); !got {
		t.Error("EnvBool garbage should fall back, not silently disable a control")
	}
	t.Setenv("LUME_TEST_BOOL", "false")
	if config.EnvBool("LUME_TEST_BOOL", true) {
		t.Error("EnvBool should honour an explicit false")
	}
}

// The 2026-08-06 audit found the LUMO_→LUME_ shim read "LUME_"+suffix — a
// self-referential no-op, so every deployment still exporting old names
// silently fell back to defaults. This pins the real legacy fallback.
func TestLegacyLumoEnvNamesStillHonoured(t *testing.T) {
	t.Setenv("LUME_SHIM_PROBE", "")
	t.Setenv("LUMO_SHIM_PROBE", "41")
	if got := config.EnvInt("LUME_SHIM_PROBE", 7); got != 41 {
		t.Errorf("EnvInt with only the legacy LUMO_ name set = %d, want 41 (the shim must fall back to LUMO_*)", got)
	}
	// The new name must still win when both are set.
	t.Setenv("LUME_SHIM_PROBE", "42")
	if got := config.EnvInt("LUME_SHIM_PROBE", 7); got != 42 {
		t.Errorf("EnvInt with both names set = %d, want the LUME_ value 42", got)
	}
}

func containsSubstr(list []string, want string) bool {
	for _, s := range list {
		if strings.Contains(s, want) {
			return true
		}
	}
	return false
}

// backend/.env.example is the file a human copies to create their real .env, so
// a variable missing from it is a variable that silently stays unset. That is
// how CLERK_ISSUER — the check that stops a Clerk JWT-template token minted for
// another service from authenticating here — came to be documented in four
// markdown files and absent from the one file people actually copy
// (found 2026-08-09).
//
// Scope: every variable config.Validate() names, fatal or warning. Those are
// exactly the ones whose absence Validate has an opinion about, so it is a list
// that cannot go stale relative to the code it guards.
func TestEnvExampleListsEveryValidatedVariable(t *testing.T) {
	b, err := os.ReadFile("../../.env.example")
	if err != nil {
		t.Fatalf("read backend/.env.example: %v", err)
	}
	example := string(b)

	src, err := os.ReadFile("../../internal/config/config.go")
	if err != nil {
		t.Fatalf("read config.go: %v", err)
	}
	// The variables Validate() reads directly — it deliberately uses bare
	// os.Getenv rather than config.Env, which makes them greppable.
	re := regexp.MustCompile(`os\.Getenv\("([A-Z0-9_]+)"\)`)
	matches := re.FindAllStringSubmatch(validateBody(t, string(src)), -1)
	if len(matches) == 0 {
		t.Fatal("found no os.Getenv calls in Validate() — update this test")
	}

	for _, m := range matches {
		name := m[1]
		if name == "PORT" {
			continue // set by the platform (Railway/Fly/Heroku), not by a human
		}
		if !regexp.MustCompile(`(?m)^` + name + `=`).MatchString(example) {
			t.Errorf("config.Validate() checks %s but backend/.env.example never lists it; "+
				"anyone copying that file starts with it unset", name)
		}
	}
}

// validateBody returns the source of Validate() alone, so a Getenv elsewhere in
// config.go is not mistaken for one the function validates.
func validateBody(t *testing.T, src string) string {
	t.Helper()
	start := strings.Index(src, "func Validate()")
	if start < 0 {
		t.Fatal("config.go no longer defines Validate() — update this test")
	}
	rest := src[start:]
	if end := strings.Index(rest, "\nfunc "); end > 0 {
		return rest[:end]
	}
	return rest
}
