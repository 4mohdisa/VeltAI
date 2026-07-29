# Lumo — Server Hardening Checklist

Written for someone doing this for the first time. Every command is literal.
`ALL_CAPS_LIKE_THIS` is a placeholder you replace. Run these on a **fresh
Ubuntu 24.04 LTS box** before the first deploy; [DEPLOY.md](DEPLOY.md) assumes
you have finished this file.

Nothing here is theoretical: each item closes a specific way this app could be
broken into or knocked over.

---

## 1. Server

### 1.1 Create a non-root deploy user

Working as root means every mistake is a fatal mistake, and every compromise is
total.

```bash
# As root on the fresh box:
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh && chmod 600 /home/deploy/.ssh/authorized_keys
```

**Open a second terminal and confirm `ssh deploy@YOUR_SERVER_IP` works before
continuing.** If you lock down SSH (next step) without checking, you lose the
box.

### 1.2 SSH: keys only

```bash
sudo sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/'            /etc/ssh/sshd_config
sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/'  /etc/ssh/sshd_config
sudo sed -i 's/^#*ChallengeResponseAuthentication.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config

sudo sshd -t && sudo systemctl restart ssh    # sshd -t first: a syntax error here locks you out
```

A non-default SSH port is **not** worth it: it stops log noise, not attackers,
and it complicates every future command. Key-only auth is the control that
matters.

### 1.3 fail2ban

Key-only auth already defeats password brute force; fail2ban stops the noise
and the connection churn.

```bash
sudo apt-get update && sudo apt-get install -y fail2ban
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd     # verify the jail is active
```

### 1.4 Firewall — the API port is NOT public

```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp                 # or: sudo ufw allow from YOUR.STATIC.IP.HERE to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

Expect exactly 22, 80, 443. **8080 must not appear.**

> **The Docker trap.** Docker writes its own iptables rules that bypass ufw
> entirely. A container published as `-p 8080:8080` is reachable from the
> internet even while `ufw status` says the port is closed. This is why
> `backend/docker-compose.yml` publishes `127.0.0.1:8080:8080` — the loopback
> prefix is what actually keeps the API private. Verify from your laptop:
>
> ```bash
> curl -m 5 http://YOUR_SERVER_IP:8080/health   # MUST fail/time out
> ```

**On AWS**, do the same in the Security Group (inbound 22 from your IP, 80 and
443 from `0.0.0.0/0`, nothing else). The Security Group is the real perimeter;
ufw is defence in depth for when a rule gets loosened.

### 1.5 Automatic security updates

```bash
sudo apt-get install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades      # choose Yes
cat /etc/apt/apt.conf.d/20auto-upgrades              # both lines should read "1"
```

### 1.6 Time sync

TLS certificate validity and JWT `exp` both depend on the clock. A drifting
clock rejects valid tokens or accepts expired ones.

```bash
timedatectl set-ntp true
timedatectl status        # expect: "System clock synchronized: yes"
```

### 1.7 Swap

A 2 GB box with no swap dies hard under an image-decode spike. The app bounds
pixels and concurrency and the container has a memory cap, but swap is what
turns "the kernel picks a victim process" into "things get slow briefly".

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
sudo sysctl vm.swappiness=10 && echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
free -h
```

---

## 2. Secrets on the box

### 2.1 Where they live

```bash
sudo mkdir -p /etc/lumo
sudo touch /etc/lumo/lumo-api.env
sudo chown root:root /etc/lumo/lumo-api.env
sudo chmod 600 /etc/lumo/lumo-api.env         # root-only; the deploy user cannot read it
sudo ls -l /etc/lumo/lumo-api.env             # expect: -rw------- 1 root root
```

Outside the repo directory on purpose: a `git clean`, a redeploy, or a careless
`git add -A` can never touch it. Docker Compose reads it as root before
dropping privileges, so the container process never needs read access to its
own secret file.

**Never**: in the image, in `docker-compose.yml`, in a `docker run -e` flag
(visible in `ps` to every user on the box), or typed inline (it lands in
`~/.bash_history`). Edit with `sudo nano /etc/lumo/lumo-api.env`.

### 2.2 Generating each secret

```bash
# INTEGRATION_ENCRYPTION_KEY — AES-256-GCM key for OAuth tokens at rest.
openssl rand -base64 32
```

> **This was documented wrong until 2026-07-29.** CONFIG.md said
> `openssl rand -hex 32`. The cipher base64-**decodes** this value and requires
> exactly 32 bytes; 64 hex characters decode to 48 bytes, so the key is
> rejected, `NewCipher` errors, and every integration route returns 503 with a
> message that does not obviously point at the key. Verified in
> `backend/internal/integrations/crypto.go`. Use `-base64 32`.

```bash
# REVENUECAT_WEBHOOK_AUTH — arbitrary long random string; paste the SAME value
# into the RevenueCat dashboard's webhook Authorization header field.
openssl rand -base64 48
```

Everything else (`DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`,
`GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, provider client secrets) is copied from
the relevant dashboard. See [CONFIG.md](CONFIG.md) for the full list.

### 2.3 Rotation — and what breaks during each

| Secret | Procedure | What breaks |
|---|---|---|
| `REVENUECAT_WEBHOOK_AUTH` | Set `REVENUECAT_WEBHOOK_AUTH_PREVIOUS` to the old value, `REVENUECAT_WEBHOOK_AUTH` to the new, restart, update the RevenueCat dashboard, then clear `_PREVIOUS` after 24h | **Nothing** — both are accepted during the overlap. This is why the dual-secret support exists |
| `CLERK_SECRET_KEY` | Rotate in Clerk, update the env, restart | Brief: in-flight JWKS fetches fail. Sessions keep working (they are verified against JWKS, not this key) |
| `CLERK_WEBHOOK_SECRET` | Rotate in Clerk, update, restart | Webhooks delivered during the gap are rejected (403). Clerk retries — acceptable |
| `INTEGRATION_ENCRYPTION_KEY` | **No safe rotation.** Existing tokens were encrypted with the old key and become undecryptable | **Every Strava/WHOOP connection breaks.** Users must reconnect. Treat as a break-glass action; if you must, tell users first and clear `integration_connections` |
| `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` | Rotate in the provider console, update, restart | Scans/AI return 503 for the seconds between |
| `DATABASE_URL` (password) | Rotate in Supabase, update, restart | Full outage until restart — do it in a window |

The `INTEGRATION_ENCRYPTION_KEY` limitation is real and worth knowing before
you have users. Envelope encryption (a per-row data key wrapped by a master
key) would make rotation cheap; it is not built.

### 2.4 On AWS: prefer not having static secrets at all

An env file on disk is fine for one box. If you are on EC2, SSM Parameter Store
is strictly better: the secret is never on disk, access is IAM-controlled and
audited in CloudTrail, and rotation does not need a file edit.

```bash
# Store (once, from your laptop with admin creds — NOT on the box):
aws ssm put-parameter --name /lumo/prod/CLERK_SECRET_KEY --type SecureString --value 'sk_live_REPLACE_ME'

# Attach an instance role allowing ssm:GetParameters + kms:Decrypt on /lumo/prod/*,
# then render the env file at boot (no long-lived AWS keys on the box):
aws ssm get-parameters-by-path --path /lumo/prod --with-decryption \
  --query 'Parameters[].{N:Name,V:Value}' --output text \
  | sed 's#/lumo/prod/##' | awk '{print $1"="$2}' | sudo tee /etc/lumo/lumo-api.env >/dev/null
sudo chmod 600 /etc/lumo/lumo-api.env
```

**Never put static AWS access keys on the box.** An instance role gives
short-lived, automatically-rotated credentials; a static key pair in an env
file is a permanent credential that leaks with the disk image.

---

## 3. Database (Supabase)

### 3.1 TLS enforced

```bash
# In DATABASE_URL, require TLS explicitly — do not rely on the default:
# postgres://USER:PASSWORD@HOST:6543/postgres?sslmode=require
```

Use `sslmode=require` at minimum. `verify-full` is stronger (it authenticates
the server, defeating an active MITM) and needs the CA bundle; Supabase
publishes one. Verify what you actually got:

```bash
psql "$DATABASE_URL" -c "SELECT ssl, version FROM pg_stat_ssl JOIN pg_stat_activity USING (pid) WHERE pid = pg_backend_pid();"
```

### 3.2 Use the pooler, and bound connections

Supabase gives a direct port (5432) and a pooler (6543). **Use the pooler.**
Postgres connections are expensive; a restart loop against 5432 exhausts the
connection limit and locks you out of your own database.

The app now issues one rate-limit upsert per request, so connection pressure is
higher than before. Set an explicit pool ceiling well below the Supabase limit
in `/etc/lumo/lumo-api.env`:

```bash
DATABASE_URL=postgres://USER:PASSWORD@HOST:6543/postgres?sslmode=require&pool_max_conns=10&statement_timeout=15000
```

`statement_timeout=15000` (15s) means no query can run forever — a single
pathological query cannot pin a connection indefinitely.

### 3.3 Keys and network

- The **service-role key** never leaves the server and is never in the app
  bundle. The app talks only to your API; it has no Supabase credentials at
  all. (Enforced by `src/__tests__/secretsPosture.test.ts`.)
- Restrict database network access to your server's IP: Supabase Dashboard →
  Settings → Database → Network Restrictions. This is the single highest-value
  database control — it makes a leaked connection string useless from anywhere
  else.

### 3.4 Backups — and the restore test

Supabase takes daily backups on paid plans (7-day retention on Pro). **Check
which plan you are on and what retention you actually have** — free-tier
projects may have none.

**An untested backup is not a backup.** Before launch, prove a restore works:

```bash
# 1. Take a manual dump (from your laptop, not the server):
pg_dump "$DATABASE_URL" --no-owner --no-acl -Fc -f lumo-$(date +%F).dump

# 2. Restore it into a THROWAWAY database (a second free Supabase project, or local):
createdb lumo_restore_test
pg_restore -d lumo_restore_test --no-owner --no-acl lumo-$(date +%F).dump

# 3. Prove the data is really there:
psql lumo_restore_test -c "SELECT count(*) FROM profiles;"
psql lumo_restore_test -c "SELECT count(*) FROM food_logs;"
psql lumo_restore_test -c "\dt"        # every table present?

# 4. Destroy the test database.
dropdb lumo_restore_test
```

Write down how long the restore took. That number is your real recovery time,
and you do not want to be discovering it during an incident.

---

## 4. The app in production posture

Most of this is already enforced in code. Verify, don't assume.

### 4.1 Startup fails loudly on missing secrets

`config.Validate()` refuses to start without `DATABASE_URL` or
`CLERK_SECRET_KEY`, or with a localhost `LUMO_BASE_URL` when
`LUMO_ENV=production`. Every other absent secret logs a warning naming the
feature that will 503. Prove it:

```bash
sudo docker compose -f /opt/lumo/backend/docker-compose.yml logs api | head -20
# Expect the "lumo backend <version> listening on ..." line and any config warnings.
# If it exits, the log says exactly which variable is wrong.
```

### 4.2 `/health` leaks nothing

```bash
curl -s https://api.example.com/health
# Expect exactly: {"data":{"status":"ok"},"error":null}
# No version, no environment, no dependency status. Verified in cmd/server/main.go.
```

### 4.3 Errors leak no internals

The API returns a fixed envelope; handlers write generic messages
("database error"), never a driver string or a stack trace. Spot-check:

```bash
curl -s https://api.example.com/api/food/logs        # unauthenticated
# Expect: {"data":null,"error":"..."} with a 401 — no SQL, no file paths.
```

### 4.4 Logs

The app logs to stdout; Docker rotates at 3 × 10 MB (`docker-compose.yml`), so
logs cannot fill the disk. It logs five operational lines and no tokens, bodies
or PII (verified in the security audit).

**Retention decision:** container logs are ephemeral and capped at 30 MB. That
is deliberate — this app has no log-based debugging story and no compliance
requirement to retain, and health data in logs is a liability. If you later ship
logs off-box, scrub before shipping.

```bash
sudo docker compose -f /opt/lumo/backend/docker-compose.yml logs -f --tail 100 api
```

### 4.5 The reset script cannot run accidentally

`backend/scripts/reset_production.sql` TRUNCATEs every user table. It is not
referenced by any build, start or migration path, and `.dockerignore` excludes
`scripts/` so it is not even in the image. It only runs if you paste it into
psql yourself.

**Do not keep it on the production box.** If you need it, run it from your
laptop against an explicit connection string, having just taken a backup.

---

## 5. What you are blind to on day one

You cannot build alerting from here. These are the gaps, worst first, with the
cheapest fix for each.

| Blind spot | Why it hurts | Cheapest fix |
|---|---|---|
| **AI spend (Gemini + Anthropic)** | The fastest way to lose real money. The app now gates, rate-limits and quotas these routes, but a bug or a determined subscriber can still spend | **Set hard spend caps and billing alerts in both provider consoles today.** This is the single most valuable 10 minutes in this document — it is a ceiling, not a notification |
| **429 spikes** | Someone probing your limits, or a real user hitting a limit set too low. Indistinguishable without data | `grep -c '" 429 '` on the nginx access log via a daily cron mail; or ship nginx logs to CloudWatch with a metric filter |
| **Auth failure spikes** | Credential stuffing, or your JWKS/`CLERK_ISSUER` config being wrong (which 401s *everything* while `/health` stays green) | Same technique on `" 401 "`. A sudden 100% 401 rate means misconfiguration, not attack |
| **5xx rate** | Your only signal that the app is broken for real users | `" 5[0-9][0-9] "` count from the same log. Anything sustained above zero deserves attention |
| **Disk full** | Kills the box silently; Postgres and Docker both fail in confusing ways | `df -h` in a daily cron; alert above 80%. Log rotation and the swap file are already sized |
| **Memory / OOM kills** | The container is capped at 1 GB and will be killed and restarted rather than taking the box down — but a restart loop looks like "it's fine" from outside | `docker events --filter event=oom` or check `restart_count`; watch the healthcheck |
| **Certificate expiry** | HTTPS stops working for everyone at once, with no warning | certbot auto-renews via systemd timer. **Verify the timer is active** (§6) and add a calendar reminder to check 60 days in |
| **Backup restore ability** | You find out it never worked at the worst moment | §3.4. Do it once before launch, then annually |

The cheapest real monitoring for a single box: a free uptime checker (UptimeRobot
or similar) hitting `https://api.example.com/health` every 5 minutes with email
alerts. That catches "the whole thing is down", which is the majority of what
actually goes wrong.

---

## 6. Post-setup verification

Run all of these. Every one should give the stated answer.

```bash
# SSH is key-only, no root
sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication)'
# expect: permitrootlogin no / passwordauthentication no

# Firewall: only 22, 80, 443
sudo ufw status numbered

# The API is NOT publicly reachable (run from your LAPTOP):
curl -m 5 http://YOUR_SERVER_IP:8080/health     # expect timeout / refused

# ...but is reachable through nginx:
curl -s https://api.example.com/health          # expect {"data":{"status":"ok"},"error":null}

# HTTP redirects to HTTPS
curl -sI http://api.example.com/health | head -1   # expect 301

# TLS is 1.2+ and the chain is valid
openssl s_client -connect api.example.com:443 -tls1_2 </dev/null 2>/dev/null | grep -E 'Protocol|Verify return code'

# TLS 1.0 is refused
openssl s_client -connect api.example.com:443 -tls1 </dev/null 2>&1 | grep -q 'no protocols available' && echo "TLS 1.0 correctly refused"

# Security headers present
curl -sI https://api.example.com/health | grep -iE 'strict-transport|x-content-type|x-frame|referrer-policy'

# nginx version not disclosed
curl -sI https://api.example.com/health | grep -i '^server:'    # expect bare "nginx"

# Certificate auto-renewal is armed
sudo systemctl list-timers | grep certbot
sudo certbot renew --dry-run

# Unattended upgrades on
systemctl is-enabled unattended-upgrades

# Clock synced
timedatectl status | grep 'System clock synchronized'

# Secrets file is root-only
sudo ls -l /etc/lumo/lumo-api.env    # expect -rw------- root root
```
