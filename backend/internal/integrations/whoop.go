package integrations

import (
	"context"
	"net/url"
	"strconv"
	"strings"
	"time"

	"lumo/backend/internal/config"
)

// Whoop is the WHOOP OAuth provider. Docs: https://developer.whoop.com.
type Whoop struct {
	clientID, clientSecret string
}

// NewWhoop reads WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET from the environment.
func NewWhoop() *Whoop {
	return &Whoop{
		clientID:     config.Env("WHOOP_CLIENT_ID", ""),
		clientSecret: config.Env("WHOOP_CLIENT_SECRET", ""),
	}
}

const (
	whoopAuthURL  = "https://api.prod.whoop.com/oauth/oauth2/auth"
	whoopTokenURL = "https://api.prod.whoop.com/oauth/oauth2/token"
	whoopWorkout  = "https://api.prod.whoop.com/developer/v1/activity/workout"
)

func (s *Whoop) Name() string     { return "whoop" }
func (s *Whoop) Configured() bool { return s.clientID != "" && s.clientSecret != "" }
func (s *Whoop) Scopes() []string {
	return []string{"read:workout", "read:recovery", "read:cycles", "read:profile"}
}

func (s *Whoop) AuthURL(state, redirectURI string) string {
	q := url.Values{}
	q.Set("client_id", s.clientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("response_type", "code")
	q.Set("scope", strings.Join(s.Scopes(), " "))
	q.Set("state", state)
	return whoopAuthURL + "?" + q.Encode()
}

type whoopToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"` // seconds from now
}

func (t whoopToken) toSet(scopes []string) *TokenSet {
	ts := &TokenSet{AccessToken: t.AccessToken, RefreshToken: t.RefreshToken, Scopes: scopes}
	if t.ExpiresIn > 0 {
		ts.ExpiresAt = time.Now().Add(time.Duration(t.ExpiresIn) * time.Second)
	}
	return ts
}

func (s *Whoop) Exchange(ctx context.Context, code, redirectURI string) (*TokenSet, error) {
	form := url.Values{}
	form.Set("client_id", s.clientID)
	form.Set("client_secret", s.clientSecret)
	form.Set("grant_type", "authorization_code")
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI) // WHOOP requires it on the token exchange
	var t whoopToken
	if err := postForm(ctx, whoopTokenURL, form, &t); err != nil {
		return nil, err
	}
	return t.toSet(s.Scopes()), nil
}

func (s *Whoop) Refresh(ctx context.Context, refreshToken string) (*TokenSet, error) {
	form := url.Values{}
	form.Set("client_id", s.clientID)
	form.Set("client_secret", s.clientSecret)
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refreshToken)
	form.Set("scope", strings.Join(s.Scopes(), " "))
	var t whoopToken
	if err := postForm(ctx, whoopTokenURL, form, &t); err != nil {
		return nil, err
	}
	return t.toSet(s.Scopes()), nil
}

type whoopWorkoutRecord struct {
	ID    int64  `json:"id"`
	Start string `json:"start"`
	End   string `json:"end"`
	Score struct {
		Kilojoule float64 `json:"kilojoule"`
		Strain    float64 `json:"strain"`
	} `json:"score"`
}

type whoopWorkoutPage struct {
	Records []whoopWorkoutRecord `json:"records"`
}

// kjPerKcal converts WHOOP's kilojoule energy to kilocalories.
const kjPerKcal = 4.184

func (s *Whoop) FetchActivities(ctx context.Context, accessToken string, after time.Time) ([]Activity, error) {
	endpoint := whoopWorkout + "?limit=25"
	if !after.IsZero() {
		endpoint += "&start=" + url.QueryEscape(after.UTC().Format(time.RFC3339))
	}
	var page whoopWorkoutPage
	if err := getJSON(ctx, endpoint, accessToken, &page); err != nil {
		return nil, err
	}
	out := make([]Activity, 0, len(page.Records))
	for _, w := range page.Records {
		dur := whoopDurationMinutes(w.Start, w.End)
		params := map[string]any{"duration_minutes": dur}
		if w.Score.Strain > 0 {
			params["strain"] = w.Score.Strain
		}
		a := Activity{
			ExternalID:      strconv.FormatInt(w.ID, 10),
			Name:            "WHOOP Workout",
			ExerciseName:    "Workout",
			SessionType:     "cardio",
			Date:            dateOnly(w.Start),
			DurationMinutes: dur,
			Parameters:      params,
		}
		if w.Score.Kilojoule > 0 {
			kcal := w.Score.Kilojoule / kjPerKcal
			a.Calories = &kcal
		}
		out = append(out, a)
	}
	return out, nil
}

// whoopDurationMinutes computes minutes between two RFC3339 timestamps; 0 when
// either fails to parse.
func whoopDurationMinutes(start, end string) int {
	st, err1 := time.Parse(time.RFC3339, start)
	en, err2 := time.Parse(time.RFC3339, end)
	if err1 != nil || err2 != nil || !en.After(st) {
		return 0
	}
	return int(en.Sub(st).Minutes())
}
