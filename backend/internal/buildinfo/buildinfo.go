// Package buildinfo answers "which build is this?" — the question nobody could
// answer on 2026-08-08, when a binary named `lumoserver`, built three days
// earlier in a scratchpad from pre-rename code, was serving :8080 and
// answering /health with 200. Everything looked wired up while the code being
// exercised no longer existed in the tree.
//
// The values come from Go's own VCS stamping (`debug.ReadBuildInfo`), which
// `go build` fills in automatically inside a git work tree since Go 1.18. No
// ldflags, no build script, nothing to forget — a binary cannot be built
// without carrying them.
package buildinfo

import (
	"runtime/debug"
	"strings"
	"time"
)

// Info identifies one build.
type Info struct {
	// Revision is the git SHA, or "unknown" when the binary was built outside
	// a work tree (go run, some container builds).
	Revision string `json:"revision"`
	// Time is the commit timestamp in RFC3339, or "" when unknown.
	Time string `json:"time"`
	// Dirty reports uncommitted changes at build time. A dirty production
	// binary is a red flag: it does not correspond to any commit.
	Dirty bool `json:"dirty"`
	// GoVersion is the toolchain that produced the binary.
	GoVersion string `json:"go_version"`
}

// Short is the abbreviated revision for log lines.
func (i Info) Short() string {
	if len(i.Revision) >= 12 {
		return i.Revision[:12]
	}
	return i.Revision
}

// String is the one-line startup form.
func (i Info) String() string {
	s := i.Short()
	if i.Dirty {
		s += "-dirty"
	}
	if i.Time != "" {
		s += " committed " + i.Time
	}
	return s + " (" + i.GoVersion + ")"
}

var cached = read()

func read() Info {
	bi, ok := debug.ReadBuildInfo()
	if !ok {
		return Info{Revision: "unknown"}
	}
	return FromSettings(bi.GoVersion, bi.Settings)
}

// FromSettings builds an Info from raw build settings. Exported so the parsing
// is directly testable: `go test` binaries are NOT VCS-stamped by the
// toolchain (Go omits vcs.* for test builds), so a test can never observe a
// real SHA through Get() — only through this.
func FromSettings(goVersion string, settings []debug.BuildSetting) Info {
	out := Info{Revision: "unknown", GoVersion: goVersion}
	for _, s := range settings {
		switch s.Key {
		case "vcs.revision":
			out.Revision = s.Value
		case "vcs.time":
			// Normalise to RFC3339 so /health is machine-readable.
			if t, err := time.Parse(time.RFC3339, s.Value); err == nil {
				out.Time = t.UTC().Format(time.RFC3339)
			} else {
				out.Time = s.Value
			}
		case "vcs.modified":
			out.Dirty = strings.EqualFold(s.Value, "true")
		}
	}
	return out
}

// Get returns this binary's identity.
func Get() Info { return cached }
