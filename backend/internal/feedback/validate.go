// Package feedback stores help and feedback messages sent from Settings. The
// author is always the verified caller; nothing about the request itself
// (headers, IP address, logs, tokens, email) is kept.
package feedback

import (
	"errors"
	"strings"
	"unicode/utf8"
)

const (
	maxMessage = 2000 // characters, after trimming
	maxField   = 64   // characters, app_version and device_model
)

var categories = map[string]bool{"bug": true, "idea": true, "account": true, "other": true}

// Request is the POST /api/feedback body.
type Request struct {
	Category    string  `json:"category"`
	Message     string  `json:"message"`
	AppVersion  *string `json:"app_version"`
	DeviceModel *string `json:"device_model"`
}

// Feedback is one validated message, ready for storage. A nil field was not
// sent and is stored as null.
type Feedback struct {
	Category    string
	Message     string
	AppVersion  *string
	DeviceModel *string
}

// Validate checks the request and returns the trimmed message ready to store.
func (r Request) Validate() (Feedback, error) {
	if !categories[r.Category] {
		return Feedback{}, errors.New("category must be one of bug, idea, account, other")
	}
	msg := strings.TrimSpace(r.Message)
	if n := utf8.RuneCountInString(msg); n == 0 || n > maxMessage {
		return Feedback{}, errors.New("message must be 1 to 2000 characters")
	}
	appVersion, err := optional(r.AppVersion, "app_version")
	if err != nil {
		return Feedback{}, err
	}
	deviceModel, err := optional(r.DeviceModel, "device_model")
	if err != nil {
		return Feedback{}, err
	}
	return Feedback{Category: r.Category, Message: msg, AppVersion: appVersion, DeviceModel: deviceModel}, nil
}

// optional trims a field; absent or blank becomes nil, over maxField is an error.
func optional(v *string, name string) (*string, error) {
	if v == nil {
		return nil, nil
	}
	s := strings.TrimSpace(*v)
	if s == "" {
		return nil, nil
	}
	if utf8.RuneCountInString(s) > maxField {
		return nil, errors.New(name + " must be at most 64 characters")
	}
	return &s, nil
}
