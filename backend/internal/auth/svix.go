package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// VerifySvix checks a Svix webhook signature (the scheme Clerk uses).
// Signed content is "{svix-id}.{svix-timestamp}.{payload}" with an
// HMAC-SHA256 key of the base64-decoded secret (sans "whsec_" prefix).
func VerifySvix(secret string, headers http.Header, payload []byte) error {
	id := headers.Get("svix-id")
	ts := headers.Get("svix-timestamp")
	sigHeader := headers.Get("svix-signature")
	if id == "" || ts == "" || sigHeader == "" {
		return errors.New("missing svix headers")
	}
	tsec, err := strconv.ParseInt(ts, 10, 64)
	if err != nil {
		return errors.New("invalid svix timestamp")
	}
	if d := time.Since(time.Unix(tsec, 0)); d > 5*time.Minute || d < -5*time.Minute {
		return errors.New("svix timestamp too old or too new")
	}
	key, err := base64.StdEncoding.DecodeString(strings.TrimPrefix(secret, "whsec_"))
	if err != nil {
		return errors.New("invalid webhook secret")
	}
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(id + "." + ts + "."))
	mac.Write(payload)
	want := mac.Sum(nil)
	for _, part := range strings.Fields(sigHeader) {
		v, ok := strings.CutPrefix(part, "v1,")
		if !ok {
			continue
		}
		got, err := base64.StdEncoding.DecodeString(v)
		if err == nil && hmac.Equal(got, want) {
			return nil
		}
	}
	return errors.New("signature mismatch")
}
