package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"lume/backend/internal/ai"
	"lume/backend/internal/analytics"
	"lume/backend/internal/auth"
	"lume/backend/internal/buildinfo"
	"lume/backend/internal/config"
	"lume/backend/internal/cuisine"
	"lume/backend/internal/db"
	"lume/backend/internal/debugreports"
	"lume/backend/internal/energy"
	"lume/backend/internal/entitlement"
	"lume/backend/internal/food"
	"lume/backend/internal/goals"
	"lume/backend/internal/gym"
	"lume/backend/internal/httpx"
	"lume/backend/internal/integrations"
	"lume/backend/internal/ratelimit"
	"lume/backend/internal/recipes"
	"lume/backend/internal/scan"
	"lume/backend/internal/scan/pipeline"
	"lume/backend/internal/subscription"
)

// version is set at build time via -ldflags. It is NOT exposed on any
// endpoint (a version banner just tells an attacker which CVEs to try) — it
// exists for the startup log line only.
var version = "dev"

const (
	// healthTimeout bounds the DB ping /health does, so a hung database
	// cannot hang the health check itself.
	healthTimeout = 2 * time.Second

	// Bounded so shutdown can never hang past what the deploy tree's own
	// grace period allows. docker-compose.yml sets no stop_grace_period, so
	// Docker's default (10s) applies before SIGKILL — these two budgets are
	// sized to fit comfortably inside that without editing the compose file.
	shutdownHTTPTimeout = 6 * time.Second
	shutdownScanTimeout = 3 * time.Second
)

// pinger is the subset of *pgxpool.Pool that /health needs — small enough
// that a fake can stand in for a real database in tests.
type pinger interface {
	Ping(ctx context.Context) error
}

func main() {
	// Container healthcheck. The runtime image is distroless: no shell, no
	// curl, nothing to probe with — so the binary probes itself and exits
	// 0/1. Docker's HEALTHCHECK and compose both invoke this.
	if len(os.Args) > 1 && os.Args[1] == "-healthcheck" {
		os.Exit(healthcheck())
	}

	// Fail LOUDLY on misconfiguration rather than serving a process that 401s
	// every request behind a green health check. Warnings name the features
	// that will degrade to 503 so a partial deploy is visible in the logs.
	fatal, warn := config.Validate()
	for _, w := range warn {
		log.Printf("config warning: %s", w)
	}
	if len(fatal) > 0 {
		for _, f := range fatal {
			log.Printf("config ERROR: %s", f)
		}
		log.Fatal("refusing to start with an invalid configuration")
	}

	pool, err := db.Connect(context.Background())
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()

	// Idempotent (ON CONFLICT DO NOTHING) — safe to run on every startup;
	// non-fatal so a seeding hiccup never blocks the server from serving.
	if err := cuisine.SeedCuisineFoods(context.Background(), pool); err != nil {
		log.Printf("cuisine seed: %v", err)
	}
	if err := gym.SeedExerciseLibrary(pool); err != nil {
		log.Printf("exercise seed: %v", err)
	}

	mux := http.NewServeMux()
	// /health is READINESS: can this instance actually serve a request right
	// now? Backed by a DB ping, so a dead DATABASE_URL flips it to 503 instead
	// of the always-200 that made it useless as a load-balancer probe (an
	// earlier audit finding). Point a load balancer or rolling-deploy check
	// here.
	mux.HandleFunc("GET /health", healthHandler(pool))
	// /health/live is LIVENESS: is the process itself still running? No DB
	// call, so a database blip cannot flap it — point a container/orchestrator
	// restart policy here instead (see healthcheck() below), so a transient
	// DB outage never turns into a restart loop.
	mux.HandleFunc("GET /health/live", healthLiveHandler())

	// Public webhooks — signature-verified, not JWT-authed. These more-specific
	// patterns take precedence over the /api/ catch-all below.
	profiles := auth.NewPGProfileStore(pool)
	auth.RegisterWebhook(mux, profiles, config.Env("CLERK_WEBHOOK_SECRET", ""))
	subs := subscription.NewPGStore(pool)
	subscription.RegisterWebhook(mux, subs, config.Env("REVENUECAT_WEBHOOK_AUTH", ""))

	// Integrations (Strava/WHOOP). The OAuth callback is a browser redirect with
	// no Clerk JWT, so it registers on the root mux (public, like the webhooks
	// above); identity comes from the one-time CSRF state. A missing/invalid
	// INTEGRATION_ENCRYPTION_KEY leaves cipher nil → the token routes return 503.
	cipher, cerr := integrations.NewCipher(config.Env("INTEGRATION_ENCRYPTION_KEY", ""))
	if cerr != nil {
		log.Printf("integrations: %v — token routes will return 503", cerr)
	}
	integrationsSvc := integrations.NewService(
		integrations.NewPGStore(pool), cipher,
		integrations.NewStrava(), integrations.NewWhoop(),
	)
	integrations.RegisterCallbacks(mux, integrationsSvc)

	// Authenticated /api routes.
	api := http.NewServeMux()
	auth.RegisterProfileWithIdentity(api, profiles,
		auth.NewClerkUserDeleter(config.Env("CLERK_SECRET_KEY", "")))
	auth.RegisterExport(api, pool)
	food.Register(api, food.NewPGStore(pool), food.NewSearchClient(config.Env("USDA_API_KEY", "DEMO_KEY")))
	gym.RegisterWithEngine(api, gym.NewPGStore(pool), gym.NewParamEngine(pool))
	gym.RegisterSchedule(api, gym.NewSchedulePGStore(pool))
	energy.Register(api, energy.NewPGStore(pool))
	integrations.Register(api, integrationsSvc)
	goals.Register(api, goals.NewPGStore(pool))
	geminiKey := config.Env("GEMINI_API_KEY", "")
	scanStore := scan.NewPGStore(pool)
	scan.Register(api, scan.NewGemini(geminiKey), scanStore)
	// Async multi-pass pipeline (POST /api/scan/pipeline) + nutrition-label scan
	// (POST /api/scan/label). Additive — the routes above are unchanged.
	// drainScans is called during shutdown, below — it waits for whatever
	// background scans are still running and marks any stragglers 'failed'.
	drainScans := scan.RegisterPipeline(api, pipeline.NewGemini(geminiKey), scanStore, pool)
	subscription.Register(api, subs)
	recipes.Register(api, recipes.NewPGStore(pool))
	analytics.Register(api, analytics.NewPGStore(pool))
	// Internal testing capture (secondary copy — the device is the source of
	// truth). Harmless in production: it only ever stores the caller's own rows.
	debugreports.Register(api, debugreports.NewPGStore(pool))

	aiSvc := ai.NewService(ai.NewPGStore(pool), ai.NewClaude(config.Env("ANTHROPIC_API_KEY", "")))
	aiSvc.Routes(api)
	go runRebuildSweeps(aiSvc)

	// Free/Pro enforcement wraps the authenticated mux: identity is already
	// verified by the time the gate runs, and the whole gated surface lives in
	// one policy table (internal/entitlement). Ordering matters — auth first,
	// then entitlement, then the routes.
	gate := entitlement.New(subs, scanStore, entitlement.LoadConfig())
	// Rate limiting sits AFTER auth (it keys on the verified user id) and BEFORE
	// entitlement, so a flood costs one indexed upsert rather than the
	// entitlement path's subscription + scan-count lookups. Counters live in
	// Postgres: per-process counters would mean N instances allow N x the limit,
	// which is the same as not limiting. Built once — a limiter constructed per
	// request has no memory and enforces nothing.
	limiter := ratelimit.NewShared(ratelimit.LoadLimits(), nil, ratelimit.NewPGStore(pool))
	// EnsureProfile sits AFTER the rate limiter so a flood cannot turn into a
	// flood of inserts, and BEFORE any handler so the row every user table's
	// foreign key points at exists by the time a new user's first write runs.
	mux.Handle("/api/", cors(auth.Middleware(auth.NewClerkVerifier())(
		limiter.Middleware(auth.EnsureProfile(profiles)(gate.Middleware(jsonFallback(api)))))))

	srv := &http.Server{
		Addr:              config.Addr(),
		Handler:           securityHeaders(mux),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	// Identify the build in the FIRST line of the log, before anything else can
	// go wrong. This is the line that would have exposed the stale `lumoserver`
	// on 2026-08-08 in one glance.
	log.Printf("lume backend %s build %s listening on %s (%s)",
		version, buildinfo.Get(), config.Addr(), config.BaseURL())

	errCh := make(chan error, 1)
	go func() { errCh <- srv.ListenAndServe() }()

	// SIGTERM mid-scan used to strand rows in 'analyzing' forever — the
	// process was simply killed, no defer or recover runs on a raw signal
	// kill. Below, the HTTP server drains first, then any background scan
	// goroutines get a bounded window to finish or be marked 'failed'.
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		if err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("server: %v", err)
		}
	case sig := <-sigCh:
		log.Printf("shutdown: %s received, draining", sig)
	}

	httpCtx, httpCancel := context.WithTimeout(context.Background(), shutdownHTTPTimeout)
	defer httpCancel()
	if err := srv.Shutdown(httpCtx); err != nil {
		log.Printf("shutdown: http server did not drain cleanly: %v", err)
	}

	scanCtx, scanCancel := context.WithTimeout(context.Background(), shutdownScanTimeout)
	defer scanCancel()
	drainScans(scanCtx)

	log.Printf("shutdown: complete")
}

// healthHandler answers readiness with a DB ping bounded by healthTimeout: a
// dead database means this instance cannot actually serve anything, so it
// answers 503 rather than the always-200 that made /health useless as a
// load-balancer probe (found 2026-08). revision/built_at/dirty are included
// on both outcomes — they're what tells an operator WHICH build is failing
// to reach Postgres.
func healthHandler(p pinger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		b := buildinfo.Get()
		ctx, cancel := context.WithTimeout(r.Context(), healthTimeout)
		defer cancel()
		if err := p.Ping(ctx); err != nil {
			httpx.JSON(w, http.StatusServiceUnavailable, map[string]any{
				"status":   "unavailable",
				"revision": b.Revision,
				"built_at": b.Time,
				"dirty":    b.Dirty,
			})
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]any{
			"status":   "ok",
			"revision": b.Revision,
			"built_at": b.Time,
			"dirty":    b.Dirty,
		})
	}
}

// healthLiveHandler answers liveness: no DB call, so it cannot flap on a
// transient database outage. This is what the container healthcheck below
// probes, so a DB blip never turns into a restart loop.
func healthLiveHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, _ *http.Request) {
		b := buildinfo.Get()
		httpx.JSON(w, http.StatusOK, map[string]any{
			"status":   "ok",
			"revision": b.Revision,
			"built_at": b.Time,
			"dirty":    b.Dirty,
		})
	}
}

// runRebuildSweeps rebuilds any brain flagged needs_rebuild and stale (see
// ai.RunRebuildSweep) every 6 hours. One user's failure never stops the sweep.
func runRebuildSweeps(svc *ai.Service) {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		sweepOnce(svc)
	}
}

// sweepOnce contains one sweep with its own panic recovery: this goroutine has
// no HTTP-server recover between it and the process, so pre-audit a single
// panic in the 6-hourly sweep killed the whole server (audit 2026-08-06).
func sweepOnce(svc *ai.Service) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("ai rebuild sweep: recovered panic: %v", r)
		}
	}()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	if err := svc.RunRebuildSweep(ctx); err != nil {
		log.Printf("ai rebuild sweep: %v", err)
	}
}

// jsonFallback rewrites ServeMux's plain-text 404/405 builtins into the JSON
// envelope; our handlers always write JSON before those defaults can fire.
func jsonFallback(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fw := &fallbackWriter{ResponseWriter: w}
		next.ServeHTTP(fw, r)
	})
}

type fallbackWriter struct {
	http.ResponseWriter
	intercepted bool
}

func (f *fallbackWriter) WriteHeader(code int) {
	if (code == http.StatusNotFound || code == http.StatusMethodNotAllowed) &&
		f.Header().Get("Content-Type") != "application/json" {
		f.intercepted = true
		f.Header().Del("Content-Length")
		httpx.Error(f.ResponseWriter, code, http.StatusText(code))
		return
	}
	f.ResponseWriter.WriteHeader(code)
}

func (f *fallbackWriter) Write(b []byte) (int, error) {
	if f.intercepted {
		return len(b), nil // swallow the plain-text body; envelope already sent
	}
	return f.ResponseWriter.Write(b)
}

// cors allows the configured browser origins (Expo web); native apps skip CORS.
func cors(next http.Handler) http.Handler {
	allowed := map[string]bool{}
	for _, o := range config.CORSOrigins() {
		allowed[o] = true
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if origin := r.Header.Get("Origin"); allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// healthcheck probes the local server and returns a process exit code. Used by
// the container HEALTHCHECK, which cannot shell out in a distroless image.
// Deliberately hits 127.0.0.1 (never the public origin) so it tests THIS
// process, not whatever the load balancer happens to point at.
//
// Hits /health/live, not /health: the container orchestration layer restarts
// on a failing HEALTHCHECK, and a transient database outage must not look
// like a reason to restart an otherwise-healthy process. Something in front
// of this instance (a load balancer, a rolling-deploy check) should still
// probe /health for readiness.
func healthcheck() int {
	addr := config.Addr()
	if strings.HasPrefix(addr, ":") {
		addr = "127.0.0.1" + addr
	}
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://" + addr + "/health/live")
	if err != nil {
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 1
	}
	return 0
}

// securityHeaders sets defence-in-depth headers on EVERY response, including
// /health and the webhooks. nginx sets these too; doing it here as well means
// they hold if the app is ever exposed without nginx in front (a mistake that
// should not also silently drop the headers).
//
// This is a JSON API consumed by a native app, so the headers that matter are
// the ones that stop a browser being tricked into interpreting a response:
// nosniff (no MIME guessing), DENY (never framed), and no referrer leakage.
// HSTS is set by nginx, which is what actually terminates TLS.
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "no-referrer")
		// Nothing here is meant to be rendered or embedded by a browser.
		h.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		h.Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}
