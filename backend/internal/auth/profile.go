package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
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
	// EnsureExists creates a bare row for a verified user id if none exists.
	// Idempotent, and never overwrites data the Clerk webhook has filled in.
	EnsureExists(ctx context.Context, id string) error
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

// EnsureExists provisions the row keyed by the Clerk user id. Every user table
// declares `references profiles(id)`, so without this row a brand-new user's
// first write fails with a foreign-key violation surfacing as an opaque 500.
// Provisioning previously happened ONLY in the asynchronous Clerk user.created
// webhook, which makes the whole app depend on (a) CLERK_WEBHOOK_SECRET being
// configured and (b) the webhook landing before the user finishes onboarding —
// a race a new user can lose in the seconds between sign-up and the first POST.
// DO NOTHING on conflict so the webhook's richer row (email, name, avatar) is
// never clobbered by this bare insert, whichever arrives first.
func (s *pgProfileStore) EnsureExists(ctx context.Context, id string) error {
	_, err := s.q.Exec(ctx,
		"INSERT INTO profiles (id) VALUES ($1) ON CONFLICT (id) DO NOTHING", id)
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

// IdentityDeleter removes the user's identity at the auth provider (Clerk).
// nil means "no provider configured" (hermetic tests, keyless dev) — skip.
type IdentityDeleter func(ctx context.Context, userID string) error

// NewClerkUserDeleter deletes the Clerk user via the Backend API so account
// deletion removes the identity (email, name), not just our rows — required by
// App Store guideline 5.1.1(v). A 404 counts as success (already gone; the
// user.deleted webhook and this route are mutually idempotent). Returns nil
// when no secret is configured.
func NewClerkUserDeleter(secret string) IdentityDeleter {
	if secret == "" {
		return nil
	}
	client := &http.Client{Timeout: 10 * time.Second}
	return func(ctx context.Context, userID string) error {
		req, err := http.NewRequestWithContext(ctx, http.MethodDelete,
			"https://api.clerk.com/v1/users/"+url.PathEscape(userID), nil)
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+secret)
		resp, err := client.Do(req)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusNotFound {
			return nil
		}
		return fmt.Errorf("clerk user delete: status %d", resp.StatusCode)
	}
}

// RegisterProfile mounts the authenticated profile routes with no identity
// deleter (hermetic tests call this form).
func RegisterProfile(mux *http.ServeMux, st ProfileStore) {
	RegisterProfileWithIdentity(mux, st, nil)
}

// RegisterProfileWithIdentity mounts the profile routes; deleteIdentity (when
// non-nil) is called BEFORE the row delete so we never report an account
// deleted while its sign-in identity still exists.
func RegisterProfileWithIdentity(mux *http.ServeMux, st ProfileStore, deleteIdentity IdentityDeleter) {
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

	// DELETE /api/profile permanently removes the account: first the identity at
	// the auth provider (Clerk user — email/name PII, ability to sign in), then
	// our profiles row; every user table references profiles(id) ON DELETE
	// CASCADE, so that one delete purges all of the user's data (food logs, gym,
	// goals, scan sessions, integrations, …). If the identity delete fails we
	// return 502 WITHOUT touching the row — never claim a deletion that didn't
	// happen. Idempotent: deleting an already-absent profile/user is a no-op 200.
	mux.HandleFunc("DELETE /api/profile", func(w http.ResponseWriter, r *http.Request) {
		id := UserID(r.Context())
		if deleteIdentity != nil {
			if err := deleteIdentity(r.Context(), id); err != nil {
				httpx.Error(w, http.StatusBadGateway, "could not delete the account with the sign-in provider — try again")
				return
			}
		}
		if err := st.Delete(r.Context(), id); err != nil {
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
