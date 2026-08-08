# Lume — Deployment Runbook

> **Build from source. Never run a binary you did not just build.** On
> 2026-08-08 a three-day-old `lumoserver` from a scratchpad was serving :8080
> and answering `/health` with 200, while the code it ran no longer existed in
> the tree. Every build now stamps its git SHA (Go VCS build info): check the
> first startup log line, or `curl $API/health` and compare `revision` with
> `git rev-parse HEAD`. A `"dirty": true` in that response means the binary
> matches no commit at all.

Ordered, copy-pasteable. Assumes a **fresh Ubuntu 24.04 box** and nothing else.
`ALL_CAPS` is a placeholder. Do the hardening in
[DEPLOYMENT_SECURITY.md](DEPLOYMENT_SECURITY.md) **first** — this runbook
assumes it is done.

**Approach: Docker Compose.** The image is byte-identical to what you tested,
resource limits / log rotation / healthcheck / read-only rootfs are declared in
one file, and rollback is "point at the previous tag". A systemd unit for
running the raw binary is provided as the alternative at
`deploy/systemd/lumo-api.service` — use one or the other, never both.

**Read this before you start:** the migration in step 4 must be applied
**before** the new binary starts. The rate limiter, webhook replay guard and
OAuth state store all read tables it creates, and they **fail closed** — until
it is applied, every `/api/` request answers 503. Rolling the binary back
without rolling back the migration is safe; the reverse is not.

---

## 1. Server prep

Complete [DEPLOYMENT_SECURITY.md](DEPLOYMENT_SECURITY.md) §1 and §2. Confirm:

```bash
sudo ufw status                      # 22, 80, 443 only
sudo ls -l /etc/lumo/lumo-api.env    # -rw------- root root
```

---

## 2. Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker deploy     # log out and back in for this to take effect
docker --version && docker compose version
```

> Adding `deploy` to the `docker` group is equivalent to giving it root (it can
> mount the host filesystem into a container). That is an accepted trade for a
> single-purpose box; if you would rather not, prefix the docker commands below
> with `sudo`.

---

## 3. Clone and configure

```bash
sudo mkdir -p /opt/lumo && sudo chown deploy:deploy /opt/lumo
git clone https://github.com/4mohdisa/VeltAI.git /opt/lumo
cd /opt/lumo
git checkout main            # or the release tag you are deploying
```

### 3.1 Fill in the env file

```bash
sudo nano /etc/lumo/lumo-api.env
```

Minimum viable production set (see [CONFIG.md](CONFIG.md) for all of them):

```ini
# --- Required: the server refuses to start without these ---
DATABASE_URL=postgres://USER:PASSWORD@HOST:6543/postgres?sslmode=require&pool_max_conns=10&statement_timeout=15000
CLERK_SECRET_KEY=sk_live_REPLACE_ME

# --- Required in production ---
LUMO_ENV=production
LUMO_BASE_URL=https://api.example.com
CLERK_ISSUER=https://clerk.example.com

# --- Webhooks ---
CLERK_WEBHOOK_SECRET=whsec_REPLACE_ME
REVENUECAT_WEBHOOK_AUTH=REPLACE_ME_openssl_rand_base64_48
# REVENUECAT_WEBHOOK_AUTH_PREVIOUS=   # only set during a rotation

# --- Features (absent = that feature returns 503) ---
GEMINI_API_KEY=REPLACE_ME
ANTHROPIC_API_KEY=REPLACE_ME
INTEGRATION_ENCRYPTION_KEY=REPLACE_ME_openssl_rand_base64_32
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
WHOOP_CLIENT_ID=
WHOOP_CLIENT_SECRET=

# --- Tunables (defaults are sane; see CONFIG.md) ---
LUMO_TIMEZONE=UTC
LUMO_FREE_SCANS_PER_DAY=3
LUMO_RATE_AI_PER_MIN=10
```

> `INTEGRATION_ENCRYPTION_KEY` is **`openssl rand -base64 32`**, not `-hex`.
> See DEPLOYMENT_SECURITY.md §2.2 — this was documented wrong until 2026-07-29.

### 3.2 Verify the config before starting anything

```bash
grep -c '=' /etc/lumo/lumo-api.env                 # sanity: non-zero
sudo grep -E '^(DATABASE_URL|CLERK_SECRET_KEY|LUMO_BASE_URL)=' /etc/lumo/lumo-api.env | sed 's/=.*/=<set>/'
```

### 3.3 Build the image

```bash
cd /opt/lumo/backend
export LUMO_VERSION=$(git rev-parse --short HEAD)
docker build --build-arg VERSION=$LUMO_VERSION -t lumo-api:$LUMO_VERSION -t lumo-api:latest .
docker images lumo-api --format '{{.Tag}}\t{{.Size}}'      # expect ~15-25 MB
```

Prove it runs as non-root (it must print `65532`, never `0`):

```bash
docker run --rm --entrypoint="" lumo-api:latest id -u 2>/dev/null \
  || docker inspect lumo-api:latest --format '{{.Config.User}}'   # distroless has no `id`; expect 65532:65532
```

### 3.4 Pin the base images (do this once)

The Dockerfile ships floating tags marked `PIN ME`. Resolve and pin them:

```bash
docker pull golang:1.26-bookworm
docker pull gcr.io/distroless/static-debian12:nonroot
docker inspect --format='{{index .RepoDigests 0}}' golang:1.26-bookworm
docker inspect --format='{{index .RepoDigests 0}}' gcr.io/distroless/static-debian12:nonroot
# Paste each result over the corresponding FROM line, e.g.
#   FROM golang@sha256:abc... AS build
# Commit the change. Rebuild to confirm it still builds.
```

---

## 4. Database: back up, migrate, verify

### 4.1 Back up FIRST

```bash
sudo apt-get install -y postgresql-client
set -a; source /etc/lumo/lumo-api.env; set +a
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc -f ~/lumo-pre-migration-$(date +%F-%H%M).dump
ls -lh ~/lumo-pre-migration-*.dump
```

If this is the very first deploy against an empty database, the dump is trivial
— take it anyway, so the habit is established.

### 4.2 See what is pending

```bash
cd /opt/lumo
./deploy/migrate.sh status
```

### 4.3 Apply

```bash
./deploy/migrate.sh apply     # lists them, then requires you to type: apply
```

Migrations run one per transaction with their bookkeeping row, so a failure
leaves neither the schema change nor a false record of it.

### 4.4 Verify

```bash
./deploy/migrate.sh verify    # "Database matches the migrations on disk."
```

`DRIFT` means an applied migration's file changed afterwards — the database no
longer matches git. Stop and work out why before deploying.

---

## 5. Start the service

```bash
cd /opt/lumo/backend
LUMO_IMAGE=lumo-api:$LUMO_VERSION docker compose up -d
docker compose ps                       # STATUS should become "healthy" within ~30s
docker compose logs --tail 30 api
```

Expect `lumo backend <sha> listening on :8080 (https://api.example.com)` and
any config warnings. If the container exits, the log names the bad variable.

```bash
curl -s http://127.0.0.1:8080/health    # {"data":{"status":"ok"},"error":null}
```

---

## 6. nginx + TLS

```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/certbot /etc/nginx/snippets

sudo cp /opt/lumo/deploy/nginx/snippets/lumo-proxy.conf /etc/nginx/snippets/
sudo cp /opt/lumo/deploy/nginx/lumo-api.conf /etc/nginx/sites-available/lumo-api.conf
sudo sed -i 's/api\.example\.com/YOUR_REAL_DOMAIN/g' /etc/nginx/sites-available/lumo-api.conf
sudo ln -sf /etc/nginx/sites-available/lumo-api.conf /etc/nginx/sites-enabled/lumo-api.conf
sudo rm -f /etc/nginx/sites-enabled/default        # the default vhost answers on 80 otherwise
```

Point DNS at the box (`A` record → your IP) and wait for it to resolve
(`dig +short YOUR_REAL_DOMAIN`) before requesting a certificate — certbot needs
to be reachable over HTTP.

```bash
# The config references certs that don't exist yet, so get them first:
sudo certbot certonly --nginx -d YOUR_REAL_DOMAIN --agree-tos -m YOUR_EMAIL --no-eff-email

sudo nginx -t                    # MUST pass before reloading
sudo systemctl reload nginx
```

### 6.1 Renewal

certbot installs a systemd timer that renews at ~60 days. nginx must reload to
pick up the new certificate:

```bash
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
printf '#!/bin/sh\nsystemctl reload nginx\n' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

sudo systemctl list-timers | grep certbot     # timer is armed
sudo certbot renew --dry-run                  # MUST succeed
```

---

## 7. Smoke test — prove the controls actually engaged

Not "does it respond" but "are the defences on". Run from your **laptop**.

```bash
API=https://YOUR_REAL_DOMAIN

# 1. Health
curl -s $API/health
# → {"data":{"status":"ok"},"error":null}

# 2. HTTP redirects to HTTPS
curl -sI http://YOUR_REAL_DOMAIN/health | head -1
# → HTTP/1.1 301 Moved Permanently

# 3. The API port is NOT publicly reachable
curl -m 5 http://YOUR_SERVER_IP:8080/health
# → timeout or connection refused.  ANY response here is a firewall failure — stop and fix it.

# 4. Unauthenticated request is rejected
curl -s -o /dev/null -w '%{http_code}\n' $API/api/food/logs
# → 401

# 5. A garbage token is rejected (signature verification works)
curl -s -o /dev/null -w '%{http_code}\n' -H 'Authorization: Bearer not.a.jwt' $API/api/food/logs
# → 401

# 6. Webhook signature rejection
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/api/webhooks/revenuecat \
  -H 'Authorization: Bearer wrong-secret' -H 'Content-Type: application/json' -d '{"event":{}}'
# → 403   (503 means REVENUECAT_WEBHOOK_AUTH is unset — fails closed, but fix it)

curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/api/webhooks/clerk \
  -H 'Content-Type: application/json' -d '{}'
# → 403  (no svix signature)

# 7. Edge rate limiting engages (nginx, unauthenticated)
for i in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code} ' $API/api/food/logs; done; echo
# → a run of 401s, then 429s once the burst is spent

# 8. Security headers
curl -sI $API/health | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy'
# → all four present

# 9. No version disclosure
curl -sI $API/health | grep -i '^server:'
# → "Server: nginx"  (no version number)

# 10. Oversize body rejected at the edge
head -c 30000000 /dev/zero | base64 > /tmp/big.txt
curl -s -o /dev/null -w '%{http_code}\n' -X POST $API/api/scan \
  -H 'Content-Type: application/json' --data-binary @/tmp/big.txt
# → 413 (nginx rejected it before it reached Go)
rm /tmp/big.txt
```

---

## 8. Point the app at the deployed URL

`EXPO_PUBLIC_API_URL` is the only switch — but it is inlined at **build** time,
so this needs a rebuild, not just a config change.

```bash
# In the app's build environment (.env at the repo root, or CI secrets):
EXPO_PUBLIC_API_URL=https://YOUR_REAL_DOMAIN
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_REPLACE_ME
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_REPLACE_ME
```

Then rebuild the app (`npm run ios`, or an EAS build) and verify a real request
reaches the server: `docker compose logs -f api` while you use the app.

Also update the dashboards to match `LUMO_BASE_URL`:
- **Clerk** → webhook endpoint `https://YOUR_REAL_DOMAIN/api/webhooks/clerk`
- **RevenueCat** → webhook `https://YOUR_REAL_DOMAIN/api/webhooks/revenuecat`,
  Authorization header = `REVENUECAT_WEBHOOK_AUTH`
- **Strava / WHOOP** → OAuth redirect
  `https://YOUR_REAL_DOMAIN/api/integrations/{provider}/callback`

---

## 9. Rollback

Fast path — the previous image is still on the box:

```bash
cd /opt/lumo/backend
docker images lumo-api --format '{{.Tag}}'            # pick the previous sha
LUMO_IMAGE=lumo-api:PREVIOUS_SHA docker compose up -d
docker compose ps && curl -s http://127.0.0.1:8080/health
```

**Migrations do not roll back automatically, and that is deliberate** — an
automatic down-migration during an incident is how you lose data. The
migrations in this repo are additive (new tables and a new nullable column), so
an older binary runs fine against the newer schema. If you ever add a
destructive migration, that stops being true: write the down-migration by hand
and take a backup first.

If the database itself is wrong, restore the dump from step 4.1:

```bash
pg_restore -d "$DATABASE_URL" --clean --no-owner --no-acl ~/lumo-pre-migration-TIMESTAMP.dump
```

---

## 10. First hour, first week

**First hour**

```bash
docker compose logs -f api | grep -iE 'error|panic|config'   # anything repeating?
docker compose ps                                            # still "healthy"?
docker stats --no-stream lumo-api                            # memory well under 1 GB?
sudo tail -f /var/log/nginx/access.log | grep -vE '" (200|201|204|304) '   # non-2xx
```

Watch for: a 401 on *everything* (bad `CLERK_ISSUER`/`CLERK_SECRET_KEY`), 503
on `/api/` (the migration did not apply — see step 4), repeated container
restarts (config error or OOM).

**First 24 hours**
- Confirm a real signup creates a `profiles` row (the Clerk webhook works).
- Confirm a sandbox purchase flips `subscriptions` (the RevenueCat webhook works).
- Check AI spend in both provider consoles against the caps you set.
- `df -h` — disk trending flat.

**First week**
- `sudo certbot renew --dry-run` still passes.
- Review 429 and 5xx counts: `grep -c '" 429 ' /var/log/nginx/access.log`.
- Do the backup restore test (DEPLOYMENT_SECURITY.md §3.4) if you have not.
- Re-check `docker stats` under real load; adjust `mem_limit` if it is close.

---

## Updating a running deployment

Near-zero downtime on one box. Compose recreates the container, so there is a
1–3 s gap; nginx returns 502 for that window. Acceptable for a mobile app that
retries. (True zero-downtime needs two containers and an nginx upstream swap —
not worth the complexity at this scale.)

```bash
cd /opt/lumo && git fetch && git checkout THE_NEW_TAG
./deploy/migrate.sh status        # migrations FIRST, if any
./deploy/migrate.sh apply

cd backend
export LUMO_VERSION=$(git rev-parse --short HEAD)
docker build --build-arg VERSION=$LUMO_VERSION -t lumo-api:$LUMO_VERSION -t lumo-api:latest .
LUMO_IMAGE=lumo-api:$LUMO_VERSION docker compose up -d
docker compose ps && curl -s http://127.0.0.1:8080/health

docker image prune -f             # reclaim space, keeps tagged images for rollback
```

## Reading logs

```bash
docker compose logs --tail 200 api            # app
docker compose logs -f api                    # follow
sudo tail -f /var/log/nginx/access.log        # requests
sudo tail -f /var/log/nginx/error.log         # TLS / proxy problems
journalctl -u docker --since "1 hour ago"     # runtime itself
```

## Rotating a secret

```bash
sudo nano /etc/lumo/lumo-api.env
cd /opt/lumo/backend && docker compose up -d --force-recreate
curl -s http://127.0.0.1:8080/health
```

Per-secret impact is in DEPLOYMENT_SECURITY.md §2.3. The one to know:
**`REVENUECAT_WEBHOOK_AUTH` rotates with zero dropped webhooks** — set
`REVENUECAT_WEBHOOK_AUTH_PREVIOUS` to the old value, put the new value in
`REVENUECAT_WEBHOOK_AUTH` and in the RevenueCat dashboard, restart, then clear
`_PREVIOUS` after 24 hours. Both are accepted (in constant time) in between.

**`INTEGRATION_ENCRYPTION_KEY` cannot be rotated without breaking every stored
Strava/WHOOP connection.** Existing tokens are undecryptable under a new key.

## Scaling to a second instance

Safe **because** rate-limit counters, webhook replay records and OAuth CSRF
states now live in Postgres rather than in each process's memory. With the old
in-memory versions, two instances meant: limits allowing 2× the intended rate,
replayed webhooks landing twice, and OAuth callbacks failing whenever they hit
the instance that did not issue the state.

To add one:

1. Stand up a second box, repeat steps 1–5 (same env file, same image tag).
2. Put both behind a load balancer (ALB, or nginx `upstream` with two servers).
3. Point DNS at the load balancer; terminate TLS there.
4. Verify shared state actually holds: exhaust the rate limit against instance
   A, then immediately call instance B — you should get 429 from B too. If B
   lets you through, the limiter is not sharing and you are back to the old bug.

Still per-process and fine: the morning-brief cache (worst case N paid calls
per user per day instead of 1) and the scan-concurrency semaphore (a per-box
resource bound, which is what you want).
