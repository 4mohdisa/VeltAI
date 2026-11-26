package subscriptiontests

// PHASE4_ROWS.md Row 18a: the RevenueCat webhook accepts only the exact
// configured Authorization header. RevenueCat sends a shared header, not a
// signature over the body, so a changed body cannot be detected here (see
// SECURITY_TEST_REPORT.md, Part A).

import (
	"net/http"
	"os"
	"path/filepath"
	"testing"
)

func TestRevenueCatWebhookAuthorization(t *testing.T) {
	fixture, err := os.ReadFile(filepath.Join("..", "entitlement", "testdata", "initial_purchase.json"))
	if err != nil {
		t.Fatal(err)
	}
	t.Setenv("REVENUECAT_WEBHOOK_AUTH_PREVIOUS", "")

	cases := []struct {
		name   string
		header string
		want   int
	}{
		{"configured header", webhookAuth, http.StatusOK},
		{"missing header", "", http.StatusForbidden},
		{"wrong secret", "Bearer rc-wrong", http.StatusForbidden},
		{"secret without its scheme", "rc-secret", http.StatusForbidden},
		{"secret with a trailing space", webhookAuth + " ", http.StatusForbidden},
		{"secret prefix only", "Bearer rc-", http.StatusForbidden},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			store := newFakeStore()
			rec := postWebhook(newMux(store), tc.header, string(fixture))
			if rec.Code != tc.want {
				t.Fatalf("status = %d, want %d (body %s)", rec.Code, tc.want, rec.Body)
			}
			if tc.want != http.StatusOK && store.count() != 0 {
				t.Fatal("subscription written despite refused authorization")
			}
		})
	}
}
