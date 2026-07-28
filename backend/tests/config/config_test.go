// Startup configuration guards. A bad deploy must fail LOUDLY, not serve a
// process that 401s every request behind a green health check.
package configtests

import (
	"strings"
	"testing"

	"lumo/backend/internal/config"
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
		"LUMO_ENV":             "production",
		"DATABASE_URL":         "postgres://x/y",
		"CLERK_SECRET_KEY":     "sk_live_x",
		"LUMO_BASE_URL":        "https://api.example.com",
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

// A production deploy that forgets LUMO_BASE_URL would otherwise come up with a
// localhost CORS allowlist and a localhost OAuth redirect_uri.
func TestValidateFatalOnLocalhostBaseURLInProduction(t *testing.T) {
	prodEnv(t)
	t.Setenv("LUMO_BASE_URL", "http://localhost:8080")
	fatal, _ := config.Validate()
	if !containsSubstr(fatal, "LUMO_BASE_URL") {
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
	t.Setenv("LUMO_ENV", "development")
	if !containsSubstr(config.CORSOrigins(), "localhost:8081") {
		t.Error("development should still allow the Expo web dev origin")
	}
}

func TestEnvIntAndBoolFallBackOnGarbage(t *testing.T) {
	t.Setenv("LUMO_TEST_INT", "not-a-number")
	if got := config.EnvInt("LUMO_TEST_INT", 7); got != 7 {
		t.Errorf("EnvInt garbage = %d, want the fallback 7 (a typo'd limit must not become 0)", got)
	}
	t.Setenv("LUMO_TEST_BOOL", "maybe")
	if got := config.EnvBool("LUMO_TEST_BOOL", true); !got {
		t.Error("EnvBool garbage should fall back, not silently disable a control")
	}
	t.Setenv("LUMO_TEST_BOOL", "false")
	if config.EnvBool("LUMO_TEST_BOOL", true) {
		t.Error("EnvBool should honour an explicit false")
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
