package integrations

import (
	"context"
	"math"
	"net/url"
	"strconv"
	"time"

	"lumo/backend/internal/config"
)

// Strava is the Strava OAuth provider. Docs: https://developers.strava.com.
type Strava struct {
	clientID, clientSecret string
}

// NewStrava reads STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET from the environment.
func NewStrava() *Strava {
	return &Strava{
		clientID:     config.Env("STRAVA_CLIENT_ID", ""),
		clientSecret: config.Env("STRAVA_CLIENT_SECRET", ""),
	}
}

func (s *Strava) Name() string       { return "strava" }
func (s *Strava) Configured() bool   { return s.clientID != "" && s.clientSecret != "" }
func (s *Strava) Scopes() []string   { return []string{"activity:read_all"} }
func (s *Strava) scopeParam() string { return "activity:read_all" }

func (s *Strava) AuthURL(state, redirectURI string) string {
	q := url.Values{}
	q.Set("client_id", s.clientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("response_type", "code")
	q.Set("scope", s.scopeParam())
	q.Set("state", state)
	return "https://www.strava.com/oauth/authorize?" + q.Encode()
}

type stravaToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresAt    int64  `json:"expires_at"` // unix seconds
	Athlete      struct {
		ID int64 `json:"id"`
	} `json:"athlete"`
}

func (t stravaToken) toSet(scopes []string) *TokenSet {
	ts := &TokenSet{AccessToken: t.AccessToken, RefreshToken: t.RefreshToken, Scopes: scopes}
	if t.ExpiresAt > 0 {
		ts.ExpiresAt = time.Unix(t.ExpiresAt, 0)
	}
	if t.Athlete.ID != 0 {
		ts.ExternalUserID = strconv.FormatInt(t.Athlete.ID, 10)
	}
	return ts
}

func (s *Strava) Exchange(ctx context.Context, code, _ string) (*TokenSet, error) {
	form := url.Values{}
	form.Set("client_id", s.clientID)
	form.Set("client_secret", s.clientSecret)
	form.Set("code", code)
	form.Set("grant_type", "authorization_code")
	var t stravaToken
	if err := postForm(ctx, "https://www.strava.com/oauth/token", form, &t); err != nil {
		return nil, err
	}
	return t.toSet(s.Scopes()), nil
}

func (s *Strava) Refresh(ctx context.Context, refreshToken string) (*TokenSet, error) {
	form := url.Values{}
	form.Set("client_id", s.clientID)
	form.Set("client_secret", s.clientSecret)
	form.Set("grant_type", "refresh_token")
	form.Set("refresh_token", refreshToken)
	var t stravaToken
	if err := postForm(ctx, "https://www.strava.com/oauth/token", form, &t); err != nil {
		return nil, err
	}
	return t.toSet(s.Scopes()), nil
}

type stravaActivity struct {
	ID                 int64    `json:"id"`
	Name               string   `json:"name"`
	Type               string   `json:"type"`
	StartDateLocal     string   `json:"start_date_local"`
	MovingTime         int      `json:"moving_time"` // seconds
	Calories           *float64 `json:"calories"`
	AverageSpeed       float64  `json:"average_speed"`        // m/s
	Distance           float64  `json:"distance"`             // m
	TotalElevationGain float64  `json:"total_elevation_gain"` // m
	AverageWatts       *float64 `json:"average_watts"`
}

// stravaParams maps a Strava activity onto the Phase 12 parameter keys so device
// imports carry the same data the ACSM engine uses (speed/incline for runs+walks,
// power for rides). Only the keys we can derive are set.
func stravaParams(a stravaActivity) map[string]any {
	p := map[string]any{"duration_minutes": a.MovingTime / 60}
	if a.AverageSpeed > 0 {
		p["speed_kmh"] = round1(a.AverageSpeed * 3.6)
	}
	if a.Distance > 0 && a.TotalElevationGain >= 0 {
		incline := a.TotalElevationGain / a.Distance * 100
		if incline < 0 {
			incline = 0
		}
		if incline > 15 {
			incline = 15
		}
		p["incline_percent"] = round1(incline)
	}
	if a.AverageWatts != nil && *a.AverageWatts > 0 {
		p["watts"] = round1(*a.AverageWatts)
	}
	return p
}

func round1(f float64) float64 { return math.Round(f*10) / 10 }

func (s *Strava) FetchActivities(ctx context.Context, accessToken string, after time.Time) ([]Activity, error) {
	endpoint := "https://www.strava.com/api/v3/athlete/activities?per_page=50"
	if !after.IsZero() {
		endpoint += "&after=" + strconv.FormatInt(after.Unix(), 10)
	}
	var raw []stravaActivity
	if err := getJSON(ctx, endpoint, accessToken, &raw); err != nil {
		return nil, err
	}
	out := make([]Activity, 0, len(raw))
	for _, a := range raw {
		name, sessionType := mapStravaType(a.Type)
		out = append(out, Activity{
			ExternalID:      strconv.FormatInt(a.ID, 10),
			Name:            firstNonEmpty(a.Name, name),
			ExerciseName:    name,
			SessionType:     sessionType,
			Date:            dateOnly(a.StartDateLocal),
			DurationMinutes: a.MovingTime / 60,
			Calories:        a.Calories,
			Parameters:      stravaParams(a),
		})
	}
	return out, nil
}

// mapStravaType maps a Strava activity type to a library-style exercise name and
// a session type. Unknown types fall back to the raw label as cardio.
func mapStravaType(t string) (name, sessionType string) {
	switch t {
	case "Run", "TrailRun", "VirtualRun":
		return "Running", "cardio"
	case "Ride", "VirtualRide", "EBikeRide":
		return "Cycling", "cardio"
	case "Swim":
		return "Swimming", "cardio"
	case "Walk", "Hike":
		return "Incline Walking", "cardio"
	case "Rowing", "Kayaking", "Canoeing":
		return "Rowing", "cardio"
	case "Elliptical":
		return "Elliptical Trainer", "cardio"
	case "StairStepper":
		return "Stair Climber", "cardio"
	case "WeightTraining", "Crossfit", "Workout":
		return t, "strength"
	default:
		return t, "cardio"
	}
}
