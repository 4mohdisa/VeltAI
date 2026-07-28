// Package httpx implements the API's response envelope and request helpers.
// Every response is { "data": ..., "error": null } or { "data": null, "error": "..." }.
package httpx

import (
	"encoding/json"
	"errors"
	"net/http"
)

type envelope struct {
	Data  any     `json:"data"`
	Error *string `json:"error"`
}

// JSON writes a success envelope.
func JSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Data: data})
}

// Error writes an error envelope.
func Error(w http.ResponseWriter, status int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(envelope{Error: &msg})
}

// JSONError writes an error envelope whose `error` field carries a structured
// payload instead of a bare string — used where the client must branch on the
// reason (e.g. an entitlement 402 that triggers the paywall). The envelope
// shape is unchanged; only the error value is richer.
func JSONError(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(struct {
		Data  any `json:"data"`
		Error any `json:"error"`
	}{Error: payload})
}

// Decode reads a JSON body into dst (20 MB cap — scan images arrive as base64).
func Decode(r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(nil, r.Body, 20<<20)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		return errors.New("invalid JSON body")
	}
	return nil
}
