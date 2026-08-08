package configtests

// Build identity (item 3 of the 2026-08-08 follow-ups). On that date a binary
// named `lumoserver`, built three days earlier in another session's scratchpad
// from pre-rename code, was serving :8080 and answering /health with 200.
// Nothing in the log or the response could tell it apart from the current
// tree. These pin that a build always carries — and reports — its identity.
//
// NOTE: `go test` binaries are deliberately NOT VCS-stamped by the toolchain,
// so Get() cannot observe a real SHA here. The parsing is tested directly, and
// the end-to-end stamping is proven by `go version -m` on a real build (see
// TestRealBuildIsVCSStamped).

import (
	"os"
	"os/exec"
	"path/filepath"
	"runtime/debug"
	"strings"
	"testing"

	"lume/backend/internal/buildinfo"
)

func TestFromSettingsReadsTheToolchainStamp(t *testing.T) {
	got := buildinfo.FromSettings("go1.26.5", []debug.BuildSetting{
		{Key: "vcs.revision", Value: "0123456789abcdef0123456789abcdef01234567"},
		{Key: "vcs.time", Value: "2026-08-08T10:00:00Z"},
		{Key: "vcs.modified", Value: "false"},
		{Key: "-buildmode", Value: "exe"},
	})
	if got.Revision != "0123456789abcdef0123456789abcdef01234567" {
		t.Fatalf("revision = %q", got.Revision)
	}
	if got.Time != "2026-08-08T10:00:00Z" {
		t.Fatalf("time = %q", got.Time)
	}
	if got.Dirty {
		t.Fatal("clean build reported dirty")
	}
	if got.Short() != "0123456789ab" {
		t.Fatalf("Short() = %q, want 12 chars", got.Short())
	}
}

func TestFromSettingsFlagsADirtyBuild(t *testing.T) {
	got := buildinfo.FromSettings("go1.26.5", []debug.BuildSetting{
		{Key: "vcs.revision", Value: "abc123abc123abc123abc123abc123abc123abcd"},
		{Key: "vcs.modified", Value: "true"},
	})
	if !got.Dirty {
		t.Fatal("vcs.modified=true must report Dirty")
	}
	// A dirty binary matches no commit — the log line has to say so.
	if !strings.Contains(got.String(), "-dirty") {
		t.Fatalf("String() = %q, want it to mark the build dirty", got.String())
	}
}

func TestUnstampedBuildIsHonestRatherThanBlank(t *testing.T) {
	got := buildinfo.FromSettings("go1.26.5", nil)
	if got.Revision != "unknown" {
		t.Fatalf("revision = %q, want \"unknown\" — an empty string reads as a missing field", got.Revision)
	}
}

func TestStringStaysOneLogLine(t *testing.T) {
	s := buildinfo.FromSettings("go1.26.5", []debug.BuildSetting{
		{Key: "vcs.revision", Value: "0123456789abcdef0123456789abcdef01234567"},
		{Key: "vcs.time", Value: "2026-08-08T10:00:00Z"},
	}).String()
	if strings.Contains(s, "\n") {
		t.Fatalf("String() must stay one line, got %q", s)
	}
}

// The end-to-end proof: a real `go build` of the server carries vcs.revision.
// This is what makes the stamp automatic — no ldflags, nothing to forget.
func TestRealBuildIsVCSStamped(t *testing.T) {
	if testing.Short() {
		t.Skip("builds the server binary; skipped under -short")
	}
	bin := filepath.Join(t.TempDir(), "lume-server-probe")
	build := exec.Command("go", "build", "-o", bin, "./cmd/server")
	build.Dir = "../.." // tests run from backend/tests/config
	if out, err := build.CombinedOutput(); err != nil {
		t.Fatalf("go build: %v\n%s", err, out)
	}
	if _, err := os.Stat(bin); err != nil {
		t.Fatalf("binary missing: %v", err)
	}
	out, err := exec.Command("go", "version", "-m", bin).CombinedOutput()
	if err != nil {
		t.Fatalf("go version -m: %v\n%s", err, out)
	}
	if !strings.Contains(string(out), "vcs.revision=") {
		t.Fatalf("a real build carries no vcs.revision — the lumoserver failure is still possible:\n%s", out)
	}
}
