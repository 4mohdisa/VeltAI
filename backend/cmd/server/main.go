package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"lumo/backend/internal/ai"
	"lumo/backend/internal/analytics"
	"lumo/backend/internal/auth"
	"lumo/backend/internal/config"
	"lumo/backend/internal/cuisine"
	"lumo/backend/internal/db"
	"lumo/backend/internal/energy"
	"lumo/backend/internal/food"
	"lumo/backend/internal/goals"
	"lumo/backend/internal/gym"
	"lumo/backend/internal/httpx"
	"lumo/backend/internal/integrations"
	"lumo/backend/internal/recipes"
	"lumo/backend/internal/scan"
	"lumo/backend/internal/scan/pipeline"
	"lumo/backend/internal/subscription"
)

func main() {
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
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, _ *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

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
	auth.RegisterProfile(api, profiles)
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
	scan.RegisterPipeline(api, pipeline.NewGemini(geminiKey), scanStore, pool)
	subscription.Register(api, subs)
	recipes.Register(api, recipes.NewPGStore(pool))
	analytics.Register(api, analytics.NewPGStore(pool))

	aiSvc := ai.NewService(ai.NewPGStore(pool), ai.NewClaude(config.Env("ANTHROPIC_API_KEY", "")))
	aiSvc.Routes(api)
	go runRebuildSweeps(aiSvc)

	mux.Handle("/api/", cors(auth.Middleware(auth.NewClerkVerifier())(jsonFallback(api))))

	srv := &http.Server{
		Addr:              config.Addr(),
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}
	log.Printf("lumo backend listening on %s (%s)", config.Addr(), config.BaseURL())
	log.Fatal(srv.ListenAndServe())
}

// runRebuildSweeps rebuilds any brain flagged needs_rebuild and stale (see
// ai.RunRebuildSweep) every 6 hours. One user's failure never stops the sweep.
func runRebuildSweeps(svc *ai.Service) {
	ticker := time.NewTicker(6 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		if err := svc.RunRebuildSweep(ctx); err != nil {
			log.Printf("ai rebuild sweep: %v", err)
		}
		cancel()
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
