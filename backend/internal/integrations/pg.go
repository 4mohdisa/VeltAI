package integrations

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
)

// PGStore is the Postgres Store.
type PGStore struct{ q db.Querier }

func NewPGStore(q db.Querier) *PGStore { return &PGStore{q: q} }

func (s *PGStore) ensureProfile(ctx context.Context, q db.Querier, userID string) error {
	_, err := q.Exec(ctx, `INSERT INTO profiles (id) VALUES ($1) ON CONFLICT DO NOTHING`, userID)
	return err
}

const connCols = `user_id, provider, access_token, refresh_token, expires_at, scopes, external_user_id, connected_at, last_sync_at`

func scanConnection(row pgx.Row) (*Connection, error) {
	var c Connection
	var refresh, extUser *string
	if err := row.Scan(&c.UserID, &c.Provider, &c.AccessToken, &refresh, &c.ExpiresAt,
		&c.Scopes, &extUser, &c.ConnectedAt, &c.LastSyncAt); err != nil {
		return nil, err
	}
	if refresh != nil {
		c.RefreshToken = *refresh
	}
	if extUser != nil {
		c.ExternalUserID = *extUser
	}
	return &c, nil
}

func (s *PGStore) GetConnection(ctx context.Context, userID, provider string) (*Connection, error) {
	c, err := scanConnection(s.q.QueryRow(ctx,
		`SELECT `+connCols+` FROM integration_connections WHERE user_id = $1 AND provider = $2`, userID, provider))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	return c, err
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func (s *PGStore) UpsertConnection(ctx context.Context, c *Connection) error {
	if err := s.ensureProfile(ctx, s.q, c.UserID); err != nil {
		return err
	}
	scopes := c.Scopes
	if scopes == nil {
		scopes = []string{}
	}
	// last_sync_at is deliberately not updated on conflict: a token refresh must
	// preserve the existing sync watermark (TouchLastSync owns that column).
	_, err := s.q.Exec(ctx, `
		INSERT INTO integration_connections
			(user_id, provider, access_token, refresh_token, expires_at, scopes, external_user_id, connected_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (user_id, provider) DO UPDATE SET
			access_token = excluded.access_token,
			refresh_token = excluded.refresh_token,
			expires_at = excluded.expires_at,
			scopes = excluded.scopes,
			external_user_id = excluded.external_user_id`,
		c.UserID, c.Provider, c.AccessToken, nilIfEmpty(c.RefreshToken), c.ExpiresAt,
		scopes, nilIfEmpty(c.ExternalUserID), c.ConnectedAt)
	return err
}

func (s *PGStore) DeleteConnection(ctx context.Context, userID, provider string) (bool, error) {
	tag, err := s.q.Exec(ctx,
		`DELETE FROM integration_connections WHERE user_id = $1 AND provider = $2`, userID, provider)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func (s *PGStore) ListConnections(ctx context.Context, userID string) ([]Connection, error) {
	rows, err := s.q.Query(ctx,
		`SELECT `+connCols+` FROM integration_connections WHERE user_id = $1 ORDER BY provider`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Connection
	for rows.Next() {
		c, err := scanConnection(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *c)
	}
	return out, rows.Err()
}

// dedupeColumn maps a provider to the gym_sessions column that dedupes its
// imports. Empty for an unknown provider (no dedupe — always inserts).
func dedupeColumn(provider string) string {
	switch provider {
	case "strava":
		return "strava_activity_id"
	case "whoop":
		return "whoop_workout_id"
	default:
		return ""
	}
}

func (s *PGStore) CreateImportedSession(ctx context.Context, in ImportedSession) (bool, error) {
	tx, err := s.q.Begin(ctx)
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx) // no-op once committed

	if err := s.ensureProfile(ctx, tx, in.UserID); err != nil {
		return false, err
	}

	var durationMin *int
	if in.DurationMinutes > 0 {
		d := in.DurationMinutes
		durationMin = &d
	}
	name := firstNonEmpty(in.Name, in.ExerciseName)

	var sessionID string
	col := dedupeColumn(in.Provider)

	// Cross-source duplicate guard: the same workout arriving from a SECOND
	// source (a manual log, or another provider) must not double-count in the
	// energy balance. Compare against same-day sessions that did NOT come from
	// this provider (same-provider re-imports dedupe exactly by activity id
	// below). Heuristic: same session_type + duration within tolerance — see
	// IsCrossSourceDuplicate.
	{
		q := `SELECT session_type, duration_minutes FROM gym_sessions WHERE user_id = $1 AND date = $2::date`
		if col != "" {
			q += ` AND ` + col + ` IS NULL`
		}
		rows, qerr := tx.Query(ctx, q, in.UserID, in.Date)
		if qerr != nil {
			return false, qerr
		}
		var existing []ExistingSession
		for rows.Next() {
			var e ExistingSession
			if err := rows.Scan(&e.SessionType, &e.DurationMinutes); err != nil {
				rows.Close()
				return false, err
			}
			existing = append(existing, e)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return false, err
		}
		if IsCrossSourceDuplicate(in.SessionType, in.DurationMinutes, existing) {
			return false, tx.Commit(ctx) // skipped — already counted once
		}
	}
	if col == "" {
		// No dedupe column: plain insert, always "created".
		err = tx.QueryRow(ctx, `
			INSERT INTO gym_sessions (user_id, date, name, duration_minutes, calories_burned, calculation_method, session_type)
			VALUES ($1, $2::date, $3, $4, $5, 'device', $6)
			RETURNING id::text`,
			in.UserID, in.Date, name, durationMin, in.Calories, in.SessionType).Scan(&sessionID)
	} else {
		// Partial unique index (user_id, <col>) WHERE <col> IS NOT NULL: DO NOTHING
		// so a re-imported activity yields no row (skipped).
		q := fmt.Sprintf(`
			INSERT INTO gym_sessions (user_id, date, name, duration_minutes, calories_burned, calculation_method, session_type, %s)
			VALUES ($1, $2::date, $3, $4, $5, 'device', $6, $7)
			ON CONFLICT (user_id, %s) WHERE %s IS NOT NULL DO NOTHING
			RETURNING id::text`, col, col, col)
		err = tx.QueryRow(ctx, q,
			in.UserID, in.Date, name, durationMin, in.Calories, in.SessionType, in.ActivityID).Scan(&sessionID)
	}
	if errors.Is(err, pgx.ErrNoRows) {
		// Conflict → already imported. Commit the (no-op) tx and report skipped.
		return false, tx.Commit(ctx)
	}
	if err != nil {
		return false, err
	}

	// Store the mapped parameters (jsonb) so device imports carry the same data
	// the ACSM engine uses. calculation_method stays "device" (the session keeps
	// the provider's own calorie number); parameters are for the record + charts.
	var paramArg any
	if len(in.Parameters) > 0 {
		b, err := json.Marshal(in.Parameters)
		if err != nil {
			return false, err
		}
		paramArg = string(b)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO gym_exercises (session_id, name, exercise_type, duration_minutes, exercise_library_id, parameters)
		VALUES ($1::uuid, $2, $3, $4,
			(SELECT id FROM exercise_library WHERE name = $2 LIMIT 1), $5::jsonb)`,
		sessionID, in.ExerciseName, in.SessionType, durationMin, paramArg); err != nil {
		return false, err
	}
	return true, tx.Commit(ctx)
}

// ConsumeStateSQL burns the token whatever it turns out to be: exactly one
// caller's DELETE matches the row, so two concurrent callbacks with the same
// state can never both be served. Provider and expiry are checked on the
// returned row rather than in the WHERE clause, so probing a state token against
// the wrong provider still destroys it.
const ConsumeStateSQL = `DELETE FROM oauth_states WHERE state = $1 RETURNING user_id, provider, expires_at`

func (s *PGStore) IssueState(ctx context.Context, token, userID, provider string, expiresAt time.Time) error {
	// Sweep first: /connect is a rare, user-initiated request, so this is the
	// cheapest place to keep the table from accumulating abandoned flows.
	if _, err := s.q.Exec(ctx, `DELETE FROM oauth_states WHERE expires_at < $1`, time.Now()); err != nil {
		return err
	}
	_, err := s.q.Exec(ctx,
		`INSERT INTO oauth_states (state, user_id, provider, expires_at) VALUES ($1, $2, $3, $4)`,
		token, userID, provider, expiresAt)
	return err
}

func (s *PGStore) ConsumeState(ctx context.Context, token, provider string, now time.Time) (string, bool, error) {
	var userID, gotProvider string
	var expiresAt time.Time
	err := s.q.QueryRow(ctx, ConsumeStateSQL, token).Scan(&userID, &gotProvider, &expiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", false, nil // unknown or already consumed
	}
	if err != nil {
		return "", false, err
	}
	if gotProvider != provider || now.After(expiresAt) {
		return "", false, nil
	}
	return userID, true, nil
}

func (s *PGStore) TouchLastSync(ctx context.Context, userID, provider string, t time.Time) error {
	_, err := s.q.Exec(ctx,
		`UPDATE integration_connections SET last_sync_at = $3 WHERE user_id = $1 AND provider = $2`,
		userID, provider, t)
	return err
}
