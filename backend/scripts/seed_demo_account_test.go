package main

import "testing"

func TestRequireLocalDatabase(t *testing.T) {
	if err := requireLocalDatabase("postgres://lume:pw@localhost:55432/lume"); err != nil {
		t.Errorf("localhost: want accepted, got %v", err)
	}
	if err := requireLocalDatabase("postgres://postgres:pw@db.abcdefgh.supabase.co:5432/postgres"); err == nil {
		t.Error("supabase.co: want refused, got accepted")
	}
}
