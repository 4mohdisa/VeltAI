# Lumo marketing site (`/web`)

Static marketing + legal site for Lumo. Next.js App Router, fully static export
(`output: 'export'`) — every page is prerendered HTML/CSS/JS with zero backend.
Builds and deploys independently of the app and the Go API.

## Run

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Build

```bash
npm run build      # → web/out (static site)
npm run lint       # eslint (next/core-web-vitals)
npm run typecheck  # tsc --noEmit
```

## Environment

Set at **build** time (baked into the static output — rebuild to change):

| Var | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used in metadata, sitemap, OG tags | `https://lumo.fit` |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 id (`G-…`). Unset ⇒ GA never loads, no consent banner shown | unset |

GA only runs when: the id is set **and** the visitor accepted the consent note
**and** the browser doesn't send Do Not Track / Global Privacy Control.

## Deploy (AWS)

The build is a plain static folder — no Node server needed:

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain NEXT_PUBLIC_GA_ID=G-XXXX npm run build
```

- **S3 + CloudFront**: sync `out/` to the bucket (`aws s3 sync out/ s3://<bucket> --delete`),
  point CloudFront at it. `trailingSlash` is on, so `/privacy/` maps to
  `privacy/index.html` — the S3 website endpoint and CloudFront (with a default
  root object per directory or a CloudFront function) both handle this.
- **nginx on EC2**: copy `out/` to the web root; `try_files $uri $uri/index.html =404;`.

A Node host (`npm run start`) also works but buys nothing — the site is static.

## Structure

- `app/` — pages (`/`, `/privacy`, `/terms`, `/faq`, `/support`, `/security`) +
  `robots.ts`, `sitemap.ts`, `opengraph-image.tsx` (all statically generated)
- `components/` — header/footer, consent-gated GA, the illustrative app-UI mocks
- `app/globals.css` — the design system (palette + type scale derived from the
  app's `src/lib/design/tokens.ts`; documented in `DECISIONS.md`)
