// Authorization route table (Row 16). Every route the backend registers is
// listed below as PROTECTED (behind auth.Middleware) or PUBLIC (with the
// reason it needs no Clerk token).
//
// TestAuthzRoutesTableIsComplete reads the registrations straight from the
// source, because http.ServeMux cannot list its routes and package main cannot
// be imported, so a new route fails the build until it is classified here.
//
// TestAuthzRoutesRejectUnauthenticated builds and starts the real server
// (cmd/server) against the local TestPG database and sends every route with no
// token. It skips when LUME_TEST_DATABASE_URL is unset, like the other TestPG
// suites, and passes the server a fake Clerk key and no other secrets.
package tests

import (
	"context"
	"encoding/json"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"
)

type authClass string

const (
	protected authClass = "PROTECTED"
	public    authClass = "PUBLIC"
)

type authzRoute struct {
	pattern string // "METHOD /path", exactly as registered
	class   authClass
	reason  string // required for PUBLIC rows
}

var authzRoutes = []authzRoute{
	{"GET /health", public, "readiness probe for the load balancer; build info only, no user data"},
	{"GET /health/live", public, "liveness probe for the container healthcheck; no database call"},
	{"POST /api/webhooks/clerk", public, "Clerk webhook, verified by its Svix signature"},
	{"POST /api/webhooks/revenuecat", public, "RevenueCat webhook, verified by its shared authorization header"},
	{"POST /api/webhooks/apple/retention", public, "Apple Retention Messaging webhook, off unless enabled and signed by Apple"},
	{"GET /api/integrations/{provider}/callback", public, "OAuth browser redirect; identity comes from the one-time CSRF state"},

	{"GET /api/profile", protected, ""},
	{"PATCH /api/profile", protected, ""},
	{"DELETE /api/profile", protected, ""},
	{"GET /api/export", protected, ""},

	{"GET /api/onboarding", protected, ""},
	{"POST /api/onboarding", protected, ""},
	{"GET /api/onboarding/preferences", protected, ""},
	{"PATCH /api/onboarding/preferences", protected, ""},
	{"GET /api/goals", protected, ""},
	{"PUT /api/goals", protected, ""},
	{"GET /api/body-weight", protected, ""},
	{"POST /api/body-weight", protected, ""},
	{"DELETE /api/body-weight/{id}", protected, ""},

	{"GET /api/food/logs", protected, ""},
	{"POST /api/food/logs", protected, ""},
	{"GET /api/food/logs/{id}", protected, ""},
	{"PATCH /api/food/logs/{id}", protected, ""},
	{"DELETE /api/food/logs/{id}", protected, ""},
	{"GET /api/food/summary", protected, ""},
	{"GET /api/food/days", protected, ""},
	{"POST /api/food/quick-add", protected, ""},
	{"GET /api/food/search", protected, ""},
	{"GET /api/food/barcode/{barcode}", protected, ""},
	{"GET /api/food/portion-memory", protected, ""},
	{"GET /api/food/saved", protected, ""},
	{"POST /api/food/saved", protected, ""},
	{"DELETE /api/food/saved/{id}", protected, ""},

	{"GET /api/gym/sessions", protected, ""},
	{"POST /api/gym/sessions", protected, ""},
	{"PATCH /api/gym/sessions/{id}", protected, ""},
	{"DELETE /api/gym/sessions/{id}", protected, ""},
	{"POST /api/gym/sessions/{id}/complete", protected, ""},
	{"POST /api/gym/sessions/{id}/exercises", protected, ""},
	{"PATCH /api/gym/exercises/{id}", protected, ""},
	{"DELETE /api/gym/exercises/{id}", protected, ""},
	{"GET /api/gym/exercises", protected, ""},
	{"GET /api/gym/exercises/{id}", protected, ""},
	{"GET /api/gym/last-logged/{exercise_id}", protected, ""},
	{"GET /api/gym/templates", protected, ""},
	{"POST /api/gym/templates", protected, ""},
	{"GET /api/gym/templates/{id}", protected, ""},
	{"PATCH /api/gym/templates/{id}", protected, ""},
	{"DELETE /api/gym/templates/{id}", protected, ""},
	{"POST /api/gym/templates/{id}/exercises", protected, ""},
	{"PATCH /api/gym/template-exercises/{id}", protected, ""},
	{"DELETE /api/gym/template-exercises/{id}", protected, ""},
	{"GET /api/gym/streak", protected, ""},
	{"POST /api/gym/streak/freeze", protected, ""},
	{"POST /api/gym/calories/preview", protected, ""},
	{"GET /api/gym/patterns", protected, ""},
	{"GET /api/gym/progress/{exercise_name}", protected, ""},
	{"GET /api/gym/schedule", protected, ""},
	{"PUT /api/gym/schedule", protected, ""},
	{"PUT /api/gym/schedule/{day}", protected, ""},
	{"GET /api/gym/today", protected, ""},

	{"GET /api/energy-balance", protected, ""},
	{"GET /api/energy-balance/week", protected, ""},

	{"GET /api/integrations", protected, ""},
	{"GET /api/integrations/{provider}/connect", protected, ""},
	{"POST /api/integrations/{provider}/sync", protected, ""},
	{"DELETE /api/integrations/{provider}", protected, ""},

	{"POST /api/scan", protected, ""},
	{"POST /api/scan/confirm", protected, ""},
	{"POST /api/scan/correction", protected, ""},
	{"POST /api/scan/feedback", protected, ""},
	{"GET /api/scan/calibration", protected, ""},
	{"GET /api/scan/calibration-report", protected, ""},
	{"POST /api/scan/pipeline", protected, ""},
	{"POST /api/scan/label", protected, ""},

	{"GET /api/recipes", protected, ""},
	{"POST /api/recipes", protected, ""},
	{"GET /api/recipes/{id}", protected, ""},
	{"PATCH /api/recipes/{id}", protected, ""},
	{"DELETE /api/recipes/{id}", protected, ""},
	{"POST /api/recipes/{id}/log", protected, ""},
	{"GET /api/saved-meals", protected, ""},
	{"POST /api/saved-meals", protected, ""},
	{"POST /api/saved-meals/{id}/log", protected, ""},
	{"DELETE /api/saved-meals/{id}", protected, ""},

	{"GET /api/subscription", protected, ""},
	{"GET /api/retention/summary", protected, ""},
	{"POST /api/analytics/events", protected, ""},
	{"POST /api/feedback", protected, ""},
	{"POST /api/push/token", protected, ""},
	{"DELETE /api/push/token", protected, ""},
	{"GET /api/debug-reports", protected, ""},
	{"POST /api/debug-reports", protected, ""},

	{"GET /api/ai/brain", protected, ""},
	{"POST /api/ai/brain/rebuild", protected, ""},
	{"POST /api/ai/query", protected, ""},
	{"GET /api/ai/morning-brief", protected, ""},
	{"GET /api/ai/insights", protected, ""},
	{"POST /api/ai/insights/{id}/dismiss", protected, ""},
	{"GET /api/ai/consent", protected, ""},
	{"POST /api/ai/consent", protected, ""},
	{"DELETE /api/ai/consent", protected, ""},
}

// authCatchAll is main.go's auth-wrapped mount of the whole /api mux, not a route.
const authCatchAll = "/api/"

// registeredRoutes returns every pattern passed to Handle or HandleFunc in the
// backend's non-test source. A pattern that is not a string literal fails the
// test, so no registration can hide from the table.
func registeredRoutes(t *testing.T) map[string]string {
	t.Helper()
	found := map[string]string{}
	fset := token.NewFileSet()
	for _, root := range []string{"../cmd", "../internal"} {
		err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
			if err != nil || d.IsDir() || !strings.HasSuffix(path, ".go") || strings.HasSuffix(path, "_test.go") {
				return err
			}
			file, err := parser.ParseFile(fset, path, nil, 0)
			if err != nil {
				return err
			}
			ast.Inspect(file, func(n ast.Node) bool {
				call, ok := n.(*ast.CallExpr)
				if !ok || len(call.Args) == 0 {
					return true
				}
				sel, ok := call.Fun.(*ast.SelectorExpr)
				if !ok || (sel.Sel.Name != "Handle" && sel.Sel.Name != "HandleFunc") {
					return true
				}
				lit, ok := call.Args[0].(*ast.BasicLit)
				if !ok || lit.Kind != token.STRING {
					t.Errorf("%s: route pattern is not a string literal, so it cannot be checked against the authz table", fset.Position(call.Pos()))
					return true
				}
				pattern, err := strconv.Unquote(lit.Value)
				if err != nil {
					t.Errorf("%s: unquote pattern: %v", fset.Position(lit.Pos()), err)
					return true
				}
				if pattern != authCatchAll {
					found[pattern] = fset.Position(lit.Pos()).String()
				}
				return true
			})
			return nil
		})
		if err != nil {
			t.Fatalf("scan %s: %v", root, err)
		}
	}
	return found
}

func TestAuthzRoutesTableIsComplete(t *testing.T) {
	table := map[string]bool{}
	for _, r := range authzRoutes {
		if table[r.pattern] {
			t.Errorf("%s is listed twice in the authz table", r.pattern)
		}
		table[r.pattern] = true
		switch {
		case r.class != protected && r.class != public:
			t.Errorf("%s has auth class %q, want PROTECTED or PUBLIC", r.pattern, r.class)
		case r.class == public && strings.TrimSpace(r.reason) == "":
			t.Errorf("%s is PUBLIC without a reason", r.pattern)
		case r.class == protected && r.reason != "":
			t.Errorf("%s is PROTECTED but carries a reason; reasons are for PUBLIC rows", r.pattern)
		}
	}

	registered := registeredRoutes(t)
	var missing, stale []string
	for pattern, at := range registered {
		if !table[pattern] {
			missing = append(missing, pattern+" (registered at "+at+")")
		}
	}
	for pattern := range table {
		if _, ok := registered[pattern]; !ok {
			stale = append(stale, pattern)
		}
	}
	sort.Strings(missing)
	sort.Strings(stale)
	if len(missing) > 0 {
		t.Errorf("routes missing from the authz table; classify each as PROTECTED or PUBLIC in tests/authz_routes_test.go:\n  %s", strings.Join(missing, "\n  "))
	}
	if len(stale) > 0 {
		t.Errorf("authz table rows with no registered route; remove them:\n  %s", strings.Join(stale, "\n  "))
	}
}

var pathParam = regexp.MustCompile(`\{[^}]+\}`)

// errorEnvelope is the one error shape every handler and middleware writes
// (httpx.Error): {"data": null, "error": "<message>"}.
type errorEnvelope struct {
	Data  json.RawMessage `json:"data"`
	Error *string         `json:"error"`
}

func assertErrorEnvelope(t *testing.T, resp *http.Response, wantStatus int, wantError string) {
	t.Helper()
	var env errorEnvelope
	dec := json.NewDecoder(resp.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&env); err != nil {
		t.Fatalf("body is not the error envelope: %v", err)
	}
	if resp.StatusCode != wantStatus || string(env.Data) != "null" || env.Error == nil || *env.Error != wantError {
		got := "<nil>"
		if env.Error != nil {
			got = *env.Error
		}
		t.Fatalf("got %d data=%s error=%q, want %d data=null error=%q", resp.StatusCode, env.Data, got, wantStatus, wantError)
	}
	if ct := resp.Header.Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type = %q, want application/json", ct)
	}
}

// startServer builds cmd/server and runs it on a free port against the test
// database, with a fake Clerk key and no other secrets in its environment. It
// runs from the temp dir so the server's .env loader finds no backend/.env.
func startServer(t *testing.T, dsn string) string {
	t.Helper()
	bin := filepath.Join(t.TempDir(), "server")
	build := exec.Command("go", "build", "-o", bin, "./cmd/server")
	build.Dir = ".."
	if out, err := build.CombinedOutput(); err != nil {
		t.Fatalf("build server: %v\n%s", err, out)
	}

	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("free port: %v", err)
	}
	port := l.Addr().(*net.TCPAddr).Port
	l.Close()

	ctx, cancel := context.WithCancel(context.Background())
	srv := exec.CommandContext(ctx, bin)
	srv.Dir = filepath.Dir(bin)
	srv.Env = []string{
		"HOME=" + os.Getenv("HOME"),
		"PATH=" + os.Getenv("PATH"),
		"DATABASE_URL=" + dsn,
		"CLERK_SECRET_KEY=sk_test_local_fake",
		"PORT=" + strconv.Itoa(port),
		"LUME_ENV=test",
	}
	var logs strings.Builder
	srv.Stdout, srv.Stderr = &logs, &logs
	if err := srv.Start(); err != nil {
		cancel()
		t.Fatalf("start server: %v", err)
	}
	t.Cleanup(func() {
		cancel()
		_ = srv.Wait()
	})

	base := fmt.Sprintf("http://127.0.0.1:%d", port)
	for deadline := time.Now().Add(30 * time.Second); time.Now().Before(deadline); time.Sleep(100 * time.Millisecond) {
		if resp, err := http.Get(base + "/health/live"); err == nil {
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return base
			}
		}
	}
	t.Fatalf("server did not become live within 30s; logs:\n%s", logs.String())
	return ""
}

func TestAuthzRoutesRejectUnauthenticated(t *testing.T) {
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-server integration test")
	}
	base := startServer(t, dsn)
	client := &http.Client{
		Timeout:       10 * time.Second,
		CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
	}

	for _, r := range authzRoutes {
		t.Run(r.pattern, func(t *testing.T) {
			method, path, _ := strings.Cut(r.pattern, " ")
			req, err := http.NewRequest(method, base+pathParam.ReplaceAllString(path, "strava"), strings.NewReader("{}"))
			if err != nil {
				t.Fatalf("build request: %v", err)
			}
			req.Header.Set("Content-Type", "application/json")
			resp, err := client.Do(req)
			if err != nil {
				t.Fatalf("send: %v", err)
			}
			defer resp.Body.Close()

			if r.class == protected {
				assertErrorEnvelope(t, resp, http.StatusUnauthorized, "missing bearer token")
				return
			}
			var env errorEnvelope
			_ = json.NewDecoder(resp.Body).Decode(&env)
			if resp.StatusCode == http.StatusUnauthorized && env.Error != nil && *env.Error == "missing bearer token" {
				t.Fatalf("PUBLIC route answered as if behind auth.Middleware; it is mounted on the wrong mux")
			}
		})
	}
}
