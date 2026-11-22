package feedback

import (
	"net/http"

	"lume/backend/internal/auth"
	"lume/backend/internal/httpx"
)

// Register mounts POST /api/feedback. It sits under /api/, so main.go's auth
// middleware and shared rate limiter already wrap it.
func Register(mux *http.ServeMux, store Store) {
	mux.HandleFunc("POST /api/feedback", func(w http.ResponseWriter, r *http.Request) {
		var req Request
		if err := httpx.Decode(r, &req); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		f, err := req.Validate()
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		// Attribution comes only from the verified JWT.
		id, err := store.Insert(r.Context(), auth.UserID(r.Context()), f)
		if err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to save feedback")
			return
		}
		httpx.JSON(w, http.StatusCreated, map[string]string{"id": id})
	})
}
