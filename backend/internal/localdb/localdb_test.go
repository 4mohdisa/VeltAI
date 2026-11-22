package localdb

import "testing"

func TestDSNAcceptsLocalHosts(t *testing.T) {
	for _, dsn := range []string{
		"postgres://lume:pw@localhost:55432/lume",
		"postgres://lume:pw@127.0.0.1:55432/lume?sslmode=disable",
		"postgresql://lume@localhost/lume",
	} {
		if _, err := DSN(dsn); err != nil {
			t.Errorf("%s: want accepted, got %v", dsn, err)
		}
	}
}

func TestDSNRefuses(t *testing.T) {
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
			if _, err := DSN(dsn); err == nil {
				t.Fatalf("%q: want refused, got accepted", dsn)
			}
		})
	}
}
