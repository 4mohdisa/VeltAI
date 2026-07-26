package integrations

import (
	"encoding/base64"
	"testing"
	"time"
)

// ---------------------------------------------------------------------------
// Cipher
// ---------------------------------------------------------------------------

func testKey() string { return base64.StdEncoding.EncodeToString(make([]byte, 32)) }

func TestCipherRoundTrip(t *testing.T) {
	c, err := NewCipher(testKey())
	if err != nil {
		t.Fatalf("new cipher: %v", err)
	}
	ct, err := c.Encrypt("super-secret-token")
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	if ct == "super-secret-token" {
		t.Fatal("ciphertext equals plaintext")
	}
	pt, err := c.Decrypt(ct)
	if err != nil || pt != "super-secret-token" {
		t.Fatalf("decrypt = %q, %v", pt, err)
	}
	// Same plaintext encrypts differently (random nonce).
	ct2, _ := c.Encrypt("super-secret-token")
	if ct2 == ct {
		t.Fatal("nonce not randomized")
	}
}

func TestCipherRejectsBadKeys(t *testing.T) {
	if _, err := NewCipher(""); err == nil {
		t.Error("empty key should error")
	}
	if _, err := NewCipher("not-base64!!!"); err == nil {
		t.Error("non-base64 key should error")
	}
	if _, err := NewCipher(base64.StdEncoding.EncodeToString(make([]byte, 16))); err == nil {
		t.Error("16-byte key should error (needs 32)")
	}
}

func TestCipherDecryptRejectsTampering(t *testing.T) {
	c, _ := NewCipher(testKey())
	if _, err := c.Decrypt("!!!not base64"); err == nil {
		t.Error("bad base64 should error")
	}
	if _, err := c.Decrypt("YQ=="); err == nil {
		t.Error("too-short ciphertext should error")
	}
	ct, _ := c.Encrypt("hello")
	// Flip the last char to corrupt the GCM tag.
	tampered := ct[:len(ct)-1] + "A"
	if tampered == ct {
		tampered = ct[:len(ct)-1] + "B"
	}
	if _, err := c.Decrypt(tampered); err == nil {
		t.Error("tampered ciphertext should fail authentication")
	}
}

// ---------------------------------------------------------------------------
// State store
// ---------------------------------------------------------------------------

func TestStateStoreIssueConsume(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	s := newStateStore(func() time.Time { return now })

	tok, err := s.issue("u1", "strava")
	if err != nil {
		t.Fatalf("issue: %v", err)
	}
	// Wrong provider is rejected.
	if _, ok := s.consume(tok, "whoop"); ok {
		t.Error("consume accepted wrong provider")
	}
	// The failed consume still removed the token (one-time), so re-issue.
	tok, _ = s.issue("u1", "strava")
	uid, ok := s.consume(tok, "strava")
	if !ok || uid != "u1" {
		t.Fatalf("consume = %q,%v want u1,true", uid, ok)
	}
	// Second consume of the same token fails (one-time use).
	if _, ok := s.consume(tok, "strava"); ok {
		t.Error("token reused")
	}
}

func TestStateStoreExpiry(t *testing.T) {
	now := time.Unix(1_000_000, 0)
	s := newStateStore(func() time.Time { return now })
	tok, _ := s.issue("u1", "strava")
	now = now.Add(stateTTL + time.Second) // advance past the TTL
	if _, ok := s.consume(tok, "strava"); ok {
		t.Error("expired token accepted")
	}
}

// ---------------------------------------------------------------------------
// Provider pure helpers
// ---------------------------------------------------------------------------

func TestMapStravaType(t *testing.T) {
	cases := map[string]struct {
		name, sessionType string
	}{
		"Run":            {"Running", "cardio"},
		"Ride":           {"Cycling", "cardio"},
		"Swim":           {"Swimming", "cardio"},
		"WeightTraining": {"WeightTraining", "strength"},
		"Yoga":           {"Yoga", "cardio"}, // unknown → raw label, cardio
	}
	for in, want := range cases {
		n, st := mapStravaType(in)
		if n != want.name || st != want.sessionType {
			t.Errorf("mapStravaType(%q) = %q,%q want %q,%q", in, n, st, want.name, want.sessionType)
		}
	}
}

func TestWhoopDurationAndEnergy(t *testing.T) {
	// 45-minute workout.
	if got := whoopDurationMinutes("2026-07-14T08:00:00Z", "2026-07-14T08:45:00Z"); got != 45 {
		t.Errorf("duration = %d, want 45", got)
	}
	if got := whoopDurationMinutes("bad", "worse"); got != 0 {
		t.Errorf("bad timestamps = %d, want 0", got)
	}
	// 2092 kJ ≈ 500 kcal.
	if kcal := 2092.0 / kjPerKcal; kcal < 499 || kcal > 501 {
		t.Errorf("kJ→kcal = %v, want ~500", kcal)
	}
}

func TestDedupeColumn(t *testing.T) {
	if dedupeColumn("strava") != "strava_activity_id" {
		t.Error("strava column wrong")
	}
	if dedupeColumn("whoop") != "whoop_workout_id" {
		t.Error("whoop column wrong")
	}
	if dedupeColumn("garmin") != "" {
		t.Error("unknown provider should have no dedupe column")
	}
}

func TestDateOnlyAndFirstNonEmpty(t *testing.T) {
	if dateOnly("2026-07-14T08:00:00Z") != "2026-07-14" {
		t.Error("dateOnly ISO")
	}
	if dateOnly("short") != "short" {
		t.Error("dateOnly short passthrough")
	}
	if firstNonEmpty("", "b") != "b" || firstNonEmpty("a", "b") != "a" {
		t.Error("firstNonEmpty")
	}
}
