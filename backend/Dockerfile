# Lume API — multi-stage build to a distroless, non-root, read-only image.
#
# Build (from the MONOREPO ROOT, not backend/ — the build context needs
# ../supabase for nothing at runtime, but keeping the context at backend/ is
# what .dockerignore assumes; see below):
#
#   cd backend && docker build -t lume-api:$(git rev-parse --short HEAD) .
#
# The final image contains exactly one file: the server binary. No shell, no
# package manager, no compiler — nothing for an attacker who achieves RCE to
# pivot with, and nothing to patch on a CVE treadmill.

# ---------------------------------------------------------------------------
# Stage 1 — build
# ---------------------------------------------------------------------------
# PIN ME BEFORE PRODUCTION. Tags are mutable: `golang:1.26-bookworm` is a
# different image next month, so a tagged build is not reproducible and a
# compromised upstream tag lands silently. DEPLOY.md step 2.4 gives the one
# command that resolves these two tags to digests and rewrites this file.
# Left as tags here deliberately — a hand-written digest I could not verify
# would fail confusingly and, worse, could be mistaken for a checked one.
FROM golang:1.26-bookworm AS build

WORKDIR /src

# Dependency layer first: it changes far less often than the source, so this
# layer stays cached across ordinary code edits.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# CGO_ENABLED=0 gives a genuinely static binary, which is what lets the final
# stage be `static` (no libc). -trimpath strips build-host paths out of panics
# and stack traces (they would otherwise leak the builder's directory layout).
# -s -w drop the symbol table and DWARF: smaller image, less to read.
ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=linux go build \
      -trimpath \
      -ldflags="-s -w -X main.version=${VERSION}" \
      -o /out/lume-api \
      ./cmd/server

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
# distroless/static: ~2 MB, no shell, no busybox, no package manager. `nonroot`
# runs as uid 65532. TLS to Supabase and to the provider APIs needs root CA
# certs, which this image ships (that is the difference from `scratch`, and the
# reason we do not use scratch).
# PIN ME BEFORE PRODUCTION — see the note on the build stage above.
FROM gcr.io/distroless/static-debian12:nonroot

# Fixed, known uid — matches the distroless `nonroot` user. Stated numerically
# so `docker run --user` checks and Kubernetes runAsUser policies can assert it
# without resolving a name (there is no /etc/passwd lookup tooling in here).
USER 65532:65532

COPY --from=build --chown=65532:65532 /out/lume-api /usr/local/bin/lume-api

# The app writes nothing to disk: no uploads (scan images are streamed to
# Gemini and never persisted), no local cache, no log files (it logs to stdout
# for the container runtime to collect). So the container runs with a READ-ONLY
# root filesystem — see docker-compose.yml `read_only: true`. If a future
# feature needs scratch space, mount a tmpfs rather than making the fs writable.
EXPOSE 8080


# Probes itself over loopback — see healthcheck() in cmd/server. compose
# overrides the timings; these are the sane defaults for a bare `docker run`.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["/usr/local/bin/lume-api", "-healthcheck"]

# No shell in the image, so this is the exec form by necessity as well as by
# preference — no shell to interpret, nothing to inject into.
ENTRYPOINT ["/usr/local/bin/lume-api"]
