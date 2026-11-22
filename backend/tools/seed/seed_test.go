package main

import (
	"strings"
	"testing"
	"time"
)

func TestLocalDSNAcceptsLocalHosts(t *testing.T) {
	for _, dsn := range []string{
		"postgres://lume:pw@localhost:55432/lume",
		"postgres://lume:pw@127.0.0.1:55432/lume?sslmode=disable",
		"postgresql://lume@localhost/lume",
	} {
		t.Setenv("DATABASE_URL", dsn)
		if _, err := localDSN(); err != nil {
			t.Errorf("%s: want accepted, got %v", dsn, err)
		}
	}
}

func TestLocalDSNRefuses(t *testing.T) {
	cases := map[string]string{
		"missing variable":       "",
		"remote host":            "postgres://lume:pw@db.example.com:5432/lume",
		"supabase host":          "postgres://postgres:pw@db.abcdefgh.supabase.co:5432/postgres",
		"supabase pooler":        "postgres://postgres.abc:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?x=supabase.co",
		"localhost lookalike":    "postgres://lume@localhost.example.com/lume",
		"host query override":    "postgres://lume@localhost/lume?host=db.example.com",
		"multi-host with remote": "postgres://lume@localhost:5432,db.example.com:5432/lume",
		"not a URL":              "host=localhost dbname=lume",
		"wrong scheme":           "mysql://lume@localhost/lume",
	}
	for name, dsn := range cases {
		t.Run(name, func(t *testing.T) {
			t.Setenv("DATABASE_URL", dsn)
			if _, err := localDSN(); err == nil {
				t.Fatalf("%q: want refused, got accepted", dsn)
			}
		})
	}
}

func TestIsSeedEmail(t *testing.T) {
	for _, e := range []string{"heavy@example.test", "New@Example.TEST"} {
		if !isSeedEmail(e) {
			t.Errorf("%s: want seed email", e)
		}
	}
	for _, e := range []string{"", "@example.test", "user@example.com", "user@example.test.com", "user@gmail.com"} {
		if isSeedEmail(e) {
			t.Errorf("%q: want not a seed email", e)
		}
	}
}

func TestSeedUsersUseSeedIdentities(t *testing.T) {
	users := seedUsers(time.Now())
	if len(users) != 6 {
		t.Fatalf("want 6 seed users, got %d", len(users))
	}
	seen := map[string]bool{}
	for _, u := range users {
		if !strings.HasPrefix(u.ID, seedIDPrefix) || !isSeedEmail(u.Email) {
			t.Errorf("%s %s: not a seed identity", u.ID, u.Email)
		}
		if seen[u.ID] || seen[u.Email] {
			t.Errorf("%s: duplicate id or email", u.ID)
		}
		seen[u.ID], seen[u.Email] = true, true
	}
}

func TestStreak(t *testing.T) {
	cases := []struct {
		name             string
		days             []int
		current, longest int
	}{
		{"daily through yesterday", span(59, 1), 59, 59},
		{"broken ten days ago", span(40, 10), 0, 31},
		{"lapsed twice a week", []int{40, 37, 33}, 0, 1},
		{"run then today", []int{9, 8, 7, 2, 1, 0}, 3, 3},
		{"none", nil, 0, 0},
	}
	for _, c := range cases {
		if cur, long := streak(c.days); cur != c.current || long != c.longest {
			t.Errorf("%s: got %d/%d, want %d/%d", c.name, cur, long, c.current, c.longest)
		}
	}
}
