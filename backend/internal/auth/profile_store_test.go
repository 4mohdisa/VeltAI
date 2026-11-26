package auth_test

import (
	"context"
	"errors"
	"testing"

	"lume/backend/internal/auth"
)

func strPtr(s string) *string { return &s }

func TestPG_ProfileStore(t *testing.T) {
	pool := exportPool(t)
	ctx := context.Background()
	const id = "user_pg_auth_profile_store"
	if _, err := pool.Exec(ctx, `DELETE FROM profiles WHERE id = $1`, id); err != nil {
		t.Fatalf("clear profile: %v", err)
	}
	t.Cleanup(func() { _, _ = pool.Exec(context.Background(), `DELETE FROM profiles WHERE id = $1`, id) })
	s := auth.NewPGProfileStore(pool)

	if _, err := s.Get(ctx, id); !errors.Is(err, auth.ErrNotFound) {
		t.Fatalf("Get(missing) err = %v, want auth.ErrNotFound", err)
	}
	if _, err := s.Update(ctx, id, strPtr("New name"), nil); !errors.Is(err, auth.ErrNotFound) {
		t.Fatalf("Update(missing) err = %v, want auth.ErrNotFound", err)
	}

	steps := []struct {
		name                            string
		run                             func() error
		wantEmail, wantName, wantAvatar *string
	}{
		{"bare row from a verified token", func() error { return s.EnsureExists(ctx, id) }, nil, nil, nil},
		{"webhook fills the row", func() error {
			return s.Upsert(ctx, auth.Profile{ID: id, Email: strPtr("a@test.local"), DisplayName: strPtr("A"), AvatarURL: strPtr("https://img.test/a")})
		}, strPtr("a@test.local"), strPtr("A"), strPtr("https://img.test/a")},
		{"a late bare insert does not clobber the webhook row", func() error { return s.EnsureExists(ctx, id) },
			strPtr("a@test.local"), strPtr("A"), strPtr("https://img.test/a")},
		{"patching the name keeps the avatar", func() error { _, err := s.Update(ctx, id, strPtr("B"), nil); return err },
			strPtr("a@test.local"), strPtr("B"), strPtr("https://img.test/a")},
		{"an empty patch changes nothing", func() error { _, err := s.Update(ctx, id, nil, nil); return err },
			strPtr("a@test.local"), strPtr("B"), strPtr("https://img.test/a")},
		{"a later webhook replaces every field", func() error { return s.Upsert(ctx, auth.Profile{ID: id, Email: strPtr("c@test.local")}) },
			strPtr("c@test.local"), nil, nil},
	}
	same := func(a, b *string) bool { return (a == nil && b == nil) || (a != nil && b != nil && *a == *b) }
	for _, st := range steps {
		if err := st.run(); err != nil {
			t.Fatalf("%s: %v", st.name, err)
		}
		p, err := s.Get(ctx, id)
		if err != nil || p.ID != id || !same(p.Email, st.wantEmail) || !same(p.DisplayName, st.wantName) || !same(p.AvatarURL, st.wantAvatar) {
			t.Fatalf("%s: profile = %+v, %v", st.name, p, err)
		}
	}
}
