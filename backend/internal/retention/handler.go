package retention

import (
	"net/http"

	"lume/backend/internal/auth"
	"lume/backend/internal/config"
	"lume/backend/internal/httpx"
)

// Register mounts GET /api/retention/summary. It sits under /api/, so main.go's
// auth middleware already wraps it; the user comes only from the JWT.
func Register(mux *http.ServeMux, store Store) {
	mux.HandleFunc("GET /api/retention/summary", func(w http.ResponseWriter, r *http.Request) {
		s, err := store.Summary(r.Context(), auth.UserID(r.Context()), config.Today(r.Context()))
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "storage error")
			return
		}
		httpx.JSON(w, http.StatusOK, s)
	})
}
