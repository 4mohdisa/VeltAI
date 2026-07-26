package auth

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"

	"lumo/backend/internal/db"
	"lumo/backend/internal/httpx"
)

// ErrNotFound is returned by ProfileStore when no profile row exists.
var ErrNotFound = errors.New("profile not found")

type Profile struct {
	ID          string    `json:"id"`
	Email       *string   `json:"email"`
	DisplayName *string   `json:"display_name"`
	AvatarURL   *string   `json:"avatar_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ProfileStore interface {
	Upsert(ctx context.Context, p Profile) error
	Get(ctx context.Context, id string) (Profile, error)
	Update(ctx context.Context, id string, displayName, avatarURL *string) (Profile, error)
	Delete(ctx context.Context, id string) error
}

type pgProfileStore struct{ q db.Querier }

func NewPGProfileStore(q db.Querier) ProfileStore { return &pgProfileStore{q} }

func (s *pgProfileStore) Upsert(ctx context.Context, p Profile) error {
	_, err := s.q.Exec(ctx, `
		INSERT INTO profiles (id, email, display_name, avatar_url)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (id) DO UPDATE SET
			email = EXCLUDED.email,
			display_name = EXCLUDED.display_name,
			avatar_url = EXCLUDED.avatar_url,
			updated_at = now()`,
		p.ID, p.Email, p.DisplayName, p.AvatarURL)
	return err
}

const profileCols = "id, email, display_name, avatar_url, created_at, updated_at"

func (s *pgProfileStore) Get(ctx context.Context, id string) (Profile, error) {
	var p Profile
	err := s.q.QueryRow(ctx, "SELECT "+profileCols+" FROM profiles WHERE id = $1", id).
		Scan(&p.ID, &p.Email, &p.DisplayName, &p.AvatarURL, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Profile{}, ErrNotFound
	}
	return p, err
}

func (s *pgProfileStore) Update(ctx context.Context, id string, displayName, avatarURL *string) (Profile, error) {
	var p Profile
	err := s.q.QueryRow(ctx, `
		UPDATE profiles SET
			display_name = COALESCE($2, display_name),
			avatar_url   = COALESCE($3, avatar_url),
			updated_at   = now()
		WHERE id = $1
		RETURNING `+profileCols,
		id, displayName, avatarURL).
		Scan(&p.ID, &p.Email, &p.DisplayName, &p.AvatarURL, &p.CreatedAt, &p.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Profile{}, ErrNotFound
	}
	return p, err
}

func (s *pgProfileStore) Delete(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx, "DELETE FROM profiles WHERE id = $1", id)
	return err
}

// RegisterProfile mounts the authenticated profile routes.
func RegisterProfile(mux *http.ServeMux, st ProfileStore) {
	mux.HandleFunc("GET /api/profile", func(w http.ResponseWriter, r *http.Request) {
		p, err := st.Get(r.Context(), UserID(r.Context()))
		if err != nil {
			writeStoreErr(w, err)
			return
		}
		httpx.JSON(w, http.StatusOK, p)
	})

	mux.HandleFunc("PATCH /api/profile", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			DisplayName *string `json:"display_name"`
			AvatarURL   *string `json:"avatar_url"`
		}
		if err := httpx.Decode(r, &body); err != nil {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		p, err := st.Update(r.Context(), UserID(r.Context()), body.DisplayName, body.AvatarURL)
		if err != nil {
			writeStoreErr(w, err)
			return
		}
		httpx.JSON(w, http.StatusOK, p)
	})

	// DELETE /api/profile permanently removes the account. Every user table
	// references profiles(id) ON DELETE CASCADE, so this one delete purges all of
	// the user's data (food logs, gym, goals, scan sessions, integrations, …).
	// Idempotent: deleting an already-absent profile is a no-op 200.
	mux.HandleFunc("DELETE /api/profile", func(w http.ResponseWriter, r *http.Request) {
		if err := st.Delete(r.Context(), UserID(r.Context())); err != nil {
			writeStoreErr(w, err)
			return
		}
		httpx.JSON(w, http.StatusOK, map[string]bool{"deleted": true})
	})
}

func writeStoreErr(w http.ResponseWriter, err error) {
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, "profile not found")
		return
	}
	httpx.Error(w, http.StatusInternalServerError, "database error")
}
