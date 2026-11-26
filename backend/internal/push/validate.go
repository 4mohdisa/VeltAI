// Package push keeps each device's push token for the signed-in user. The
// owner is always the verified caller; only the token and the platform are
// stored. Sending push is a hosted step and lives elsewhere.
package push

import (
	"errors"
	"strings"
	"unicode"
	"unicode/utf8"
)

const maxToken = 512 // characters; APNs and FCM tokens are far shorter

var platforms = map[string]bool{"ios": true, "android": true}

// Request is the POST /api/push/token body.
type Request struct {
	Token    string `json:"token"`
	Platform string `json:"platform"`
}

// DeleteRequest is the DELETE /api/push/token body.
type DeleteRequest struct {
	Token string `json:"token"`
}

// Validate checks the token and the platform.
func (r Request) Validate() error {
	if err := validToken(r.Token); err != nil {
		return err
	}
	if !platforms[r.Platform] {
		return errors.New("platform must be ios or android")
	}
	return nil
}

// Validate checks the token.
func (r DeleteRequest) Validate() error { return validToken(r.Token) }

// validToken allows 1 to maxToken characters with no whitespace or control characters.
func validToken(t string) error {
	if n := utf8.RuneCountInString(t); n == 0 || n > maxToken {
		return errors.New("token must be 1 to 512 characters")
	}
	if strings.IndexFunc(t, func(r rune) bool { return unicode.IsSpace(r) || unicode.IsControl(r) }) >= 0 {
		return errors.New("token must not contain whitespace")
	}
	return nil
}
