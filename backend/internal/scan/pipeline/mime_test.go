package pipeline

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestNormalizeMime(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"image/png", "image/png"},
		{"", "image/jpeg"},
		{"image/heic", "image/heic"},
		{"image/webp", "image/webp"},
		{"IMAGE/PNG", "image/png"},        // case-insensitive
		{"application/pdf", "image/jpeg"}, // unknown → default
	}
	for _, c := range cases {
		if got := normalizeMime(c.in); got != c.want {
			t.Errorf("normalizeMime(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

// captureMimeServer stands up a fake Gemini that records the request's
// inline_data.mime_type (contents[0].parts[1]) into *captured, and replies with
// respText wrapped in a valid candidates envelope so the client call succeeds.
func captureMimeServer(t *testing.T, respText string, captured *string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Contents []struct {
				Parts []struct {
					InlineData struct {
						MimeType string `json:"mime_type"`
					} `json:"inline_data"`
				} `json:"parts"`
			} `json:"contents"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Errorf("decode request body: %v", err)
		}
		if len(body.Contents) == 0 || len(body.Contents[0].Parts) < 2 {
			t.Errorf("unexpected request shape: %+v", body)
		} else {
			*captured = body.Contents[0].Parts[1].InlineData.MimeType
		}
		w.Write(wrapEnvelope(t, respText))
	}))
}

func TestIdentifyFoods_RequestMime(t *testing.T) {
	const arr = `[{"region_id":0,"food_name":"x","estimated_weight_g":100,"calories_per_100g":100,"confidence":80}]`
	cases := []struct {
		in   string
		want string
	}{
		{"image/png", "image/png"},
		{"", "image/jpeg"},
		{"image/heic", "image/heic"},
	}
	for _, c := range cases {
		t.Run(c.in, func(t *testing.T) {
			var got string
			srv := captureMimeServer(t, arr, &got)
			defer srv.Close()

			g := newTestGemini(srv.URL)
			if _, err := g.IdentifyFoods(context.Background(), []byte("img"), GeometryResult{}, c.in); err != nil {
				t.Fatalf("IdentifyFoods error: %v", err)
			}
			if got != c.want {
				t.Fatalf("captured mime_type = %q, want %q", got, c.want)
			}
		})
	}
}

func TestExtractLabel_RequestMime(t *testing.T) {
	const label = `{"serving_size_g":100,"calories_per_serving":100,"confidence":90}`
	var got string
	srv := captureMimeServer(t, label, &got)
	defer srv.Close()

	g := newTestGemini(srv.URL)
	if _, err := g.ExtractLabel(context.Background(), []byte("img"), "image/webp"); err != nil {
		t.Fatalf("ExtractLabel error: %v", err)
	}
	if got != "image/webp" {
		t.Fatalf("captured mime_type = %q, want %q", got, "image/webp")
	}
}
