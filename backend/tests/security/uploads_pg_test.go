package security

// Row 18b step 2: upload limits and SSRF. The scan and debug report routes are
// sent bodies over their caps, wrong image types, empty bodies and one valid
// small image. Every outbound call the injectable clients make (food search,
// the three Gemini clients) goes through a recording transport to a local stub
// that plays Gemini and Open Food Facts, with a fake key, so nothing reaches
// the network. Hostile URLs sent in every field that could reach a fetch must
// never become a request to any host but the stub.
//
// Skipped unless LUME_TEST_DATABASE_URL is set.

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	"image/png"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"slices"
	"strings"
	"sync"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
)

// geminiReply is a generateContent answer both the photo and label parsers read.
const geminiReply = `{"candidates":[{"content":{"parts":[{"text":"{\"food_name\":\"Toast\",\"calories\":120,\"confidence\":0.9,\"serving_size_g\":100}"}]}}]}`

// recorder is the transport every injectable outbound client uses. It records
// each request's scheme and host, then sends it on.
type recorder struct {
	mu   sync.Mutex
	seen []string
}

func (r *recorder) RoundTrip(req *http.Request) (*http.Response, error) {
	r.mu.Lock()
	r.seen = append(r.seen, req.URL.Scheme+"://"+req.URL.Host)
	r.mu.Unlock()
	return http.DefaultTransport.RoundTrip(req)
}

func (r *recorder) calls() []string {
	r.mu.Lock()
	defer r.mu.Unlock()
	return append([]string(nil), r.seen...)
}

// stubbedAPI is newAPI with a Gemini key and every injectable client sent
// through rec to a local stub, for an owner who has given AI consent.
type stubbedAPI struct {
	stub *httptest.Server
	rec  *recorder
	send func(method, target, body string) *httptest.ResponseRecorder
}

func newStubbedAPI(t *testing.T) stubbedAPI {
	t.Helper()
	dsn := os.Getenv("LUME_TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("LUME_TEST_DATABASE_URL not set — skipping real-SQL integration test")
	}
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	t.Cleanup(pool.Close)

	stub := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case strings.HasSuffix(r.URL.Path, ":generateContent"):
			fmt.Fprint(w, geminiReply)
		case r.URL.Path == "/cgi/search.pl":
			fmt.Fprint(w, `{"products":[]}`)
		default:
			http.NotFound(w, r)
		}
	}))
	t.Cleanup(stub.Close)
	rec := &recorder{}
	owner := seedOwner(t, pool, fmt.Sprintf("security_uploads_%d", os.Getpid()))
	if _, err := pool.Exec(context.Background(), `UPDATE profiles SET ai_consent_at = now() WHERE id = $1`, owner); err != nil {
		t.Fatalf("grant AI consent: %v", err)
	}
	handler, sign := newAPI(t, pool, upstream{geminiKey: "test-key", base: stub.URL, client: &http.Client{Transport: rec}})
	token := sign(owner)
	return stubbedAPI{stub: stub, rec: rec, send: func(method, target, body string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, target, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		return w
	}}
}

// smallPNG is a valid 2x2 PNG, base64 encoded.
func smallPNG(t *testing.T) string {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, image.NewRGBA(image.Rect(0, 0, 2, 2))); err != nil {
		t.Fatalf("encode png: %v", err)
	}
	return base64.StdEncoding.EncodeToString(buf.Bytes())
}

func imageBody(b64, mime string) string {
	return `{"image_base64":"` + b64 + `","mime_type":"` + mime + `"}`
}

func TestPG_UploadsAreBoundedAndTyped(t *testing.T) {
	api := newStubbedAPI(t)
	small := smallPNG(t)
	// Base64 of 16 MB: an image over the 15 MB decoded cap in a body under the
	// 24 MB scan body cap.
	bigImage := base64.StdEncoding.EncodeToString(make([]byte, 16<<20))
	overBody := func(size int) string { return imageBody(strings.Repeat("A", size), "image/png") }
	scanRoutes := []string{"/api/scan", "/api/scan/pipeline", "/api/scan/label"}

	type upload struct {
		name, target, body string
		want               []int
	}
	var refused []upload
	for _, route := range scanRoutes {
		refused = append(refused,
			upload{"wrong type text/html", route, imageBody(small, "text/html"), []int{http.StatusBadRequest}},
			upload{"wrong type application/pdf", route, imageBody(small, "application/pdf"), []int{http.StatusBadRequest}},
			upload{"empty body", route, "", []int{http.StatusBadRequest}},
			upload{"empty object", route, "{}", []int{http.StatusBadRequest}},
		)
	}
	refused = append(refused,
		upload{"body over the 20 MB decode cap", "/api/scan", overBody(21 << 20), []int{http.StatusRequestEntityTooLarge, http.StatusBadRequest}},
		upload{"body over the 24 MB scan cap", "/api/scan/pipeline", overBody(25 << 20), []int{http.StatusRequestEntityTooLarge}},
		upload{"body over the 24 MB scan cap", "/api/scan/label", overBody(25 << 20), []int{http.StatusRequestEntityTooLarge}},
		upload{"image over the 15 MB cap", "/api/scan/pipeline", imageBody(bigImage, "image/png"), []int{http.StatusRequestEntityTooLarge}},
		upload{"image over the 15 MB cap", "/api/scan/label", imageBody(bigImage, "image/png"), []int{http.StatusRequestEntityTooLarge}},
		upload{"body over the 12 MB cap", "/api/debug-reports", `{"client_id":"c1","title":"Crash","image_base64":"` + strings.Repeat("A", 13<<20) + `"}`, []int{http.StatusRequestEntityTooLarge}},
		upload{"empty body", "/api/debug-reports", "", []int{http.StatusBadRequest}},
		upload{"empty object", "/api/debug-reports", "{}", []int{http.StatusBadRequest}},
	)
	for _, u := range refused {
		t.Run("refused/"+u.target+"/"+u.name, func(t *testing.T) {
			before := len(api.rec.calls())
			rec := api.send(http.MethodPost, u.target, u.body)
			wantEnvelope(t, rec)
			if !slices.Contains(u.want, rec.Code) {
				t.Fatalf("status %d, want one of %v (body %.200s)", rec.Code, u.want, rec.Body.String())
			}
			if after := len(api.rec.calls()); after != before {
				t.Fatalf("a refused upload made %d outbound call(s)", after-before)
			}
		})
	}

	accepted := []upload{
		{"small png", "/api/scan", imageBody(small, "image/png"), []int{http.StatusOK}},
		{"small png", "/api/scan/label", imageBody(small, "image/png"), []int{http.StatusOK}},
		{"small png", "/api/scan/pipeline", imageBody(small, "image/png"), []int{http.StatusAccepted}},
		{"small screenshot", "/api/debug-reports", `{"client_id":"c1","title":"Crash","image_base64":"` + small + `"}`, []int{http.StatusCreated}},
	}
	for _, u := range accepted {
		t.Run("accepted/"+u.target+"/"+u.name, func(t *testing.T) {
			rec := api.send(http.MethodPost, u.target, u.body)
			wantEnvelope(t, rec)
			if !slices.Contains(u.want, rec.Code) {
				t.Fatalf("status %d, want %v (body %.200s)", rec.Code, u.want, rec.Body.String())
			}
		})
	}
}

func TestPG_UserInputNeverChoosesAnOutboundHost(t *testing.T) {
	api := newStubbedAPI(t)
	trap := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Errorf("trap server reached: %s %s", r.Method, r.URL)
	}))
	t.Cleanup(trap.Close)
	hostile := []string{
		trap.URL + "/steal",
		"http://127.0.0.1:1/",
		"http://169.254.169.254/latest/meta-data/",
		"file:///etc/passwd",
		"//" + strings.TrimPrefix(trap.URL, "http://") + "/redirect",
	}
	small := smallPNG(t)
	for _, h := range hostile {
		requests := []struct{ name, method, target, body string }{
			{"food search q", http.MethodGet, "/api/food/search?" + url.Values{"q": {h}}.Encode(), ""},
			{"barcode path", http.MethodGet, "/api/food/barcode/" + url.PathEscape(h), ""},
			{"scan mime_type", http.MethodPost, "/api/scan", imageBody(small, h)},
			{"scan image_base64", http.MethodPost, "/api/scan", imageBody(h, "image/png")},
			{"label mime_type", http.MethodPost, "/api/scan/label", imageBody(small, h)},
			{"pipeline angle", http.MethodPost, "/api/scan/pipeline", `{"images":[{"image_base64":"` + small + `","mime_type":"image/png","angle":"` + h + `"}]}`},
			{"ai query question", http.MethodPost, "/api/ai/query", `{"question":"` + h + `"}`},
			{"profile avatar_url", http.MethodPatch, "/api/profile", `{"avatar_url":"` + h + `"}`},
			{"debug report route", http.MethodPost, "/api/debug-reports", `{"client_id":"c2","title":"t","route":"` + h + `"}`},
			{"integration provider", http.MethodGet, "/api/integrations/" + url.PathEscape(h) + "/connect", ""},
			{"integration callback", http.MethodGet, "/api/integrations/strava/callback?" + url.Values{"code": {h}, "state": {h}}.Encode(), ""},
		}
		for _, r := range requests {
			t.Run(r.name+"/"+h, func(t *testing.T) {
				rec := api.send(r.method, r.target, r.body)
				if rec.Code == http.StatusInternalServerError {
					t.Fatalf("status 500 (body %.200s)", rec.Body.String())
				}
			})
		}
	}
	calls := api.rec.calls()
	if len(calls) == 0 {
		t.Fatal("no outbound call was made, so the host check proves nothing")
	}
	for _, host := range calls {
		if host != api.stub.URL {
			t.Errorf("outbound call to %s, want only the configured base %s", host, api.stub.URL)
		}
	}
}
