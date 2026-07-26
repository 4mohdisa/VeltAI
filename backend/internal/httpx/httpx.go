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

// Decode reads a JSON body into dst (20 MB cap — scan images arrive as base64).
func Decode(r *http.Request, dst any) error {
	r.Body = http.MaxBytesReader(nil, r.Body, 20<<20)
	dec := json.NewDecoder(r.Body)
	if err := dec.Decode(dst); err != nil {
		return errors.New("invalid JSON body")
	}
	return nil
}
