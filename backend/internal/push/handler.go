package push

import (
	"net/http"

	"lume/backend/internal/auth"
	"lume/backend/internal/httpx"
)

// Register mounts POST and DELETE /api/push/token. They sit under /api/, so
// main.go's auth middleware, shared rate limiter and entitlement gate already
// wrap them. Both answer 204 with no body, so a reply never says whether a
// token belongs to anyone else.
func Register(mux *http.ServeMux, store Store) {
	mux.HandleFunc("POST /api/push/token", func(w http.ResponseWriter, r *http.Request) {
		var req Request
		if err := httpx.Decode(r, &req); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if err := req.Validate(); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		// The owner comes only from the verified JWT.
		if err := store.Upsert(r.Context(), auth.UserID(r.Context()), req); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to save push token")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
	mux.HandleFunc("DELETE /api/push/token", func(w http.ResponseWriter, r *http.Request) {
		var req DeleteRequest
		if err := httpx.Decode(r, &req); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if err := req.Validate(); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if err := store.Delete(r.Context(), auth.UserID(r.Context()), req.Token); err != nil {
			httpx.Error(w, http.StatusInternalServerError, "failed to remove push token")
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})
}
