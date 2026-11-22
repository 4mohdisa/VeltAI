// Package localdb guards scripts that write seed data: they run against a
// local database only.
package localdb

import (
	"errors"
	"fmt"
	"net/url"
	"strings"

	"github.com/jackc/pgx/v5"
)

var localHosts = map[string]bool{"localhost": true, "127.0.0.1": true}

// DSN returns raw only if it is a postgres URL whose every host is localhost
// or 127.0.0.1. The pgx check catches hosts the URL hostname does not show,
// such as a ?host= query parameter or a multi-host list.
func DSN(raw string) (string, error) {
	if raw == "" {
		return "", errors.New("DATABASE_URL is not set")
	}
	if strings.Contains(strings.ToLower(raw), "supabase.co") {
		return "", errors.New("refusing a supabase.co database: seed runs against a local database only")
	}
	u, err := url.Parse(raw)
	if err != nil || (u.Scheme != "postgres" && u.Scheme != "postgresql") {
		return "", errors.New("DATABASE_URL must be a postgres:// URL")
	}
	if !localHosts[u.Hostname()] {
		return "", fmt.Errorf("refusing host %q: seed runs against localhost or 127.0.0.1 only", u.Hostname())
	}
	cfg, err := pgx.ParseConfig(raw)
	if err != nil {
		return "", fmt.Errorf("parse DATABASE_URL: %w", err)
	}
	hosts := []string{cfg.Host}
	for _, fb := range cfg.Fallbacks {
		hosts = append(hosts, fb.Host)
	}
	for _, h := range hosts {
		if !localHosts[h] {
			return "", fmt.Errorf("refusing host %q: seed runs against localhost or 127.0.0.1 only", h)
		}
	}
	return raw, nil
}
