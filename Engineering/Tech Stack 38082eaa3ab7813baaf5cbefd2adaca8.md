# Tech Stack

## Mobile

- **Framework**: React Native + Expo SDK 54
- **Architecture**: New Architecture (Fabric + JSI + Hermes) enabled from day one
- **Router**: Expo Router (file-based)
- **Platform**: iOS only for MVP

## Key mobile libraries

| Library | Purpose |
| --- | --- |
| `@clerk/expo` v3.1 | Authentication — native SwiftUI components on iOS |
| `react-native-purchases` | RevenueCat IAP — wraps StoreKit |
| `react-native-health` | Apple HealthKit |
| `expo-camera` | Food scan camera + barcode scanning |
| `expo-speech-recognition` | Voice meal entry (or Whisper API via backend) |
| `react-native-reanimated` v3 | XP animations on UI thread |
| `@shopify/flash-list` | Performant lists |
| `@tanstack/react-query` | Server state, caching |
| `zustand` | Local UI state |
| `expo-notifications` | Push and local notifications |
| **Family Controls** (native) | App lockout — requires Apple entitlement |

## Backend

- **Language**: Go
- **Framework**: Fiber v2 (fasthttp core, ~36K req/s)
- **Why Go**: concurrency for AI background jobs, compiled performance, type safety

## Database

- **Primary**: PostgreSQL 16 via Supabase (managed)
- **Vector**: pgvector 0.7+ with HNSW indexes
- **Storage**: Supabase Storage (food photos, voice audio)
- **Connection**: pgxpool from Go
- **NOT used from Supabase**: their Auth, Edge Functions, Realtime (we own the backend)

## Cache

- **Provider**: Upstash Redis (serverless, pay per request)
- **What lives there**: today's session data, leaderboard, rate limits, short-term AI context

## Authentication

- **Provider**: Clerk (`@clerk/expo` v3.1)
- **Methods**: email + password, Sign in with Apple, Google (optional)
- **JWT**: validated server-side on every Go request via JWKS

## Payments

- **Provider**: RevenueCat
- **iOS**: StoreKit (mandatory for App Store)
- **Android (Phase 2)**: Google Play Billing
- **Web (Phase 3)**: RevenueCat Web Billing (Stripe under the hood)
- **Free tier**: up to A$2,500 MRR — zero RevenueCat cost while validating

## AI

- **Model**: Gemini 3.5 Flash (Google) for everything
- **Why**: best food vision benchmarks, native Google Search grounding, cheapest at scale, single integration
- **Used for**: food photo scanning, voice transcript parsing, uncertainty resolution, weekly digests (Phase 2), nudge generation
- **Embeddings**: Google text-embedding-004 (768 dims, matches pgvector setup)

## Error monitoring

- **Provider**: Sentry (Go + React Native SDKs)
- **Alerts**: crash rate, P95 latency, food scan failure rate, payment webhook failures

## Hosting

- **Backend**: Railway (Go service)
- **Database**: Supabase Cloud
- **Cache**: Upstash Cloud
- **CDN**: Cloudflare (for [veltai.app](http://veltai.app) marketing site)

## Environment variables

```
DATABASE_URL              ← Supabase Postgres connection
REDIS_URL                 ← Upstash Redis URL
CLERK_SECRET_KEY          ← Clerk backend
CLERK_WEBHOOK_SECRET      ← Clerk webhook signing
GEMINI_API_KEY            ← Google AI
REVENUECAT_WEBHOOK_SECRET
SUPABASE_SERVICE_KEY      ← for storage signed URLs
SENTRY_DSN
OPEN_FOOD_FACTS_USER_AGENT ← OFF requires UA header
```

---

## What we do NOT use on iOS

These are explicitly avoided because Apple's guidelines reject them for in-app digital subscriptions, or because they create unnecessary risk:

| Service | Why we avoid it on iOS |
| --- | --- |
| **Stripe** | Apple Guideline 3.1.1 forbids external payment processors for digital subscriptions. RevenueCat + StoreKit replaces it. |
| **Clerk Billing** | Built on Stripe — same Apple restriction applies. **Clerk Auth stays**, but Clerk Billing is not used on iOS. May be used for web in Phase 2. |
| **Firebase** | We use Supabase. Firebase adds nothing we need and was the source of Cal AI's 3.2M user data breach (unauthenticated read access). |
| **Third-party review SDKs** | Apple permits only `SKStoreReviewController`. Third-party review prompts get apps rejected. |
| **Cross-app payment SDKs** (PayPal, Wise, etc.) | All forbidden for digital subscriptions on iOS per Guideline 3.1.1. |

## Payment architecture, settled

The iOS payment flow has three layers, in order:

```
User taps "Start free trial"
   ↓
RevenueCat SDK opens the Apple StoreKit sheet
   ↓
Apple charges the user's Apple ID (Face ID confirms)
   ↓
RevenueCat webhook → Go backend → Supabase entitlement flag
   ↓
User has access
```

**Apple's commission**: 15% (Small Business Program, under A$1M annual revenue). On A$9.99/month, user pays A$9.99, Apple keeps A$1.50, you receive A$8.49.

**RevenueCat cost**: free up to A$2,500 MRR. No cost while validating.

For Phase 2 (web): Stripe, Clerk Billing, or RevenueCat Web Billing all become available. RevenueCat Web Billing keeps entitlements unified across iOS, Android, and web.