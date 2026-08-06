/* Legal document content.
   ==========================================================================

   THIS IS A SCAFFOLD, NOT A LEGAL DOCUMENT. Every block is explicitly one of
   three kinds, and the type system will not let a block be ambiguous:

     { kind: 'p' }         Prose that is safe to assert. Used ONLY for
                           statements that are either standard boilerplate the
                           app already ships (the health disclaimer) or plain
                           descriptions of how the software behaves.
     { kind: 'todo' }      A placeholder. Renders as an unmissable boxed block.
                           NEVER reads as prose. Must be replaced by a lawyer.
     { kind: 'verified' }  A fact derived from the codebase, true on this branch,
                           carrying the file that proves it. Safe to keep.

   WHY SO STRICT: Lume collects health information, which is sensitive
   information under the Privacy Act 1988 (Cth). A policy that states or implies
   a consent basis Lume has not obtained is worse than one with an obvious gap —
   it becomes a documented false representation. So nothing here asserts a legal
   fact about the entity, its consent mechanism, its retention periods or its
   compliance posture. Those are all TODO, on purpose.

   The `source` on a verified block is rendered as an HTML comment only, so the
   page reads as a document while the provenance stays inspectable in view-source
   and greppable here. */

/* The date is duplicated from legal/manifest.json rather than imported.
   Importing it would reach outside this package's root, which Next refuses and
   which would couple the two build systems — the manifest is a CHECK-TIME
   contract, never a build-time dependency. `npm run check:legal` asserts this
   literal equals the manifest, so the two cannot drift. */
export const LAST_UPDATED = '2 August 2026';

/** Flip to false in ONE edit when a lawyer has reviewed the policy. */
export const DRAFT = true;

export const DRAFT_NOTICE =
  'This policy is a working draft and has not been reviewed by an Australian privacy lawyer. ' +
  'Lume collects health information, which is sensitive information under the Privacy Act 1988 (Cth). ' +
  'Do not rely on this document.';

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'todo'; text: string }
  | { kind: 'verified'; text: string; source: string }
  | { kind: 'verifiedList'; lead: string; items: string[]; source: string };

export type Section = { id: string; heading: string; blocks: Block[] };

const p = (text: string): Block => ({ kind: 'p', text });
const todo = (text: string): Block => ({ kind: 'todo', text });
const v = (text: string, source: string): Block => ({ kind: 'verified', text, source });
const vList = (lead: string, items: string[], source: string): Block => ({
  kind: 'verifiedList',
  lead,
  items,
  source,
});

/* ===========================================================================
   PRIVACY POLICY
   =========================================================================== */

export const PRIVACY: Section[] = [
  {
    id: 'who-we-are',
    heading: 'Who we are',
    blocks: [
      todo(
        'The legal entity that operates Lume: registered company or business name, ABN or ACN, ' +
          'registered address, and the contact point for privacy matters. Nothing in this repository ' +
          'identifies the operating entity, so none of it can be stated here.',
      ),
    ],
  },
  {
    id: 'scope',
    heading: 'What this policy covers',
    blocks: [
      todo(
        'Which products this policy applies to (the iOS app, this website, or both), which entity is ' +
          'the APP entity for the purposes of the Privacy Act, and how this policy interacts with the ' +
          'Terms of Service.',
      ),
    ],
  },
  {
    id: 'what-we-collect',
    heading: 'Personal information we collect',
    blocks: [
      p(
        'The list below is derived from the application source, not from a template. It is what the ' +
          'software actually stores today.',
      ),
      vList(
        'Account information, created when you sign up and managed by our authentication provider:',
        ['Email address', 'Display name', 'Profile image URL, if your sign-in provider supplies one'],
        'backend/internal/auth/profile.go:20-27 (Profile: Email, DisplayName, AvatarURL)',
      ),
      vList(
        'Health information — this is sensitive information under the Privacy Act:',
        [
          'Body weight, height, age and sex',
          'Activity level and your stated goal (lose weight, build muscle, or maintain)',
          'Calorie, protein, carbohydrate, fat and fibre targets',
          'Body-weight history over time',
        ],
        'supabase/migrations/20260711000001_initial_schema.sql (onboarding, goals, body_weight tables)',
      ),
      vList(
        'Fitness information:',
        [
          'Gym sessions, including duration, exercises, and the parameters you enter',
          'Weekly workout schedules and templates',
          'Streaks, including which days were logged or frozen',
        ],
        'supabase/migrations/20260711000001_initial_schema.sql (gym_sessions, gym_exercises, gym_streaks)',
      ),
      vList(
        'Content you create:',
        [
          'Photographs of meals and of nutrition labels, at the moment you scan them',
          'Food names, quantities and macronutrient values',
          'Notes you attach to a session or an entry',
          'Recipes and saved foods',
        ],
        'supabase/migrations/20260711000001_initial_schema.sql (food_logs, saved_foods); backend/internal/scan/',
      ),
      v(
        'Identifiers: the user ID issued by our authentication provider. Every row of your data is ' +
          'keyed to it.',
        'supabase/migrations/20260711000001_initial_schema.sql (profiles.id, text primary key = Clerk user ID)',
      ),
      vList(
        'Usage information. The app records a fixed, closed list of twelve event names and nothing else — ' +
          'no food names, no quantities, no photographs, no health values:',
        [
          'onboarding_completed, food_logged, scan_started, scan_confirmed, scan_corrected,',
          'scan_discarded, workout_logged, template_created, integration_connected,',
          'paywall_viewed, trial_started, feature_used',
        ],
        'src/lib/analytics.ts:31-44 (ALLOWED — events outside this set are dropped, not sent)',
      ),
      v(
        'Purchase information: whether you hold an active subscription, and its status and expiry. ' +
          'Payment details are handled by Apple and are never received by Lume.',
        'backend/internal/subscription/ (status, expiry); purchases are Apple in-app purchases',
      ),
      p(
        'Lume collects health information. That is stated plainly here because it is the fact that ' +
          'determines how the rest of this policy must work.',
      ),
    ],
  },
  {
    id: 'sensitive-consent',
    heading: 'Sensitive information and consent',
    blocks: [
      p(
        'Health information is sensitive information under the Privacy Act 1988 (Cth). Australian ' +
          'Privacy Principle 3.3 requires express consent to collect it, over and above the ' +
          'reasonably-necessary test that applies to ordinary personal information.',
      ),
      todo(
        'THE SECTION THAT MATTERS MOST, AND IT IS EMPTY ON PURPOSE. Required: the express consent ' +
          'mechanism for collecting health information — how consent is obtained, at what point in the ' +
          'flow, what it covers, how it is recorded, how long the record is kept, and how it is ' +
          'withdrawn. Do not describe a mechanism that does not exist. As of this branch there is no ' +
          'server-side record of a general collection consent; see the verified note below for the one ' +
          'consent gate that does exist and exactly what it covers.',
      ),
      v(
        'What exists today, and its limits. Before the first meal photograph or AI request, the app ' +
          'shows a one-time disclosure naming Google Gemini and Anthropic, and refuses to send anything ' +
          'until you accept. The acknowledgement is stored on your device AND recorded on our server ' +
          '(profiles.ai_consent_at), and every Gemini/Anthropic send — including background jobs that ' +
          'run with no device involved — is refused server-side without it. You can withdraw it in the ' +
          'app (Settings → Privacy → Turn off AI processing). It covers sharing with those two AI ' +
          'processors — it is not a general consent to collect health information.',
        'src/lib/ai/consent.ts (ensureAiConsent/revokeAiConsent); backend/internal/ai/ai.go (requireAIConsent); backend/internal/scan (requireScanConsent) — audited 2026-08-06',
      ),
    ],
  },
  {
    id: 'purposes',
    heading: 'Why we collect it',
    blocks: [
      todo(
        'The purposes for which each category is collected, used and disclosed, written to APP 6. The ' +
          'functional purposes below are a factual starting point, not a completed section — they ' +
          'describe what the software does, not the legal basis for doing it.',
      ),
      vList(
        'What the software actually does with your data:',
        [
          'Stores and displays your food and workout history',
          'Computes calorie and macronutrient targets from your body metrics using the Mifflin–St Jeor equation',
          'Computes exercise energy expenditure from published ACSM metabolic equations',
          'Reconciles calories in against calories out to produce a daily and weekly energy balance',
          'Estimates the nutritional content of a photographed meal, with a confidence score',
          'Improves future estimates for you specifically, from the corrections you make',
          'Determines whether you have access to subscriber features',
        ],
        'backend/internal/goals/derive.go; backend/internal/energy/formulas.go; backend/internal/scan/; backend/internal/entitlement/',
      ),
    ],
  },
  {
    id: 'disclosure',
    heading: 'Who we disclose it to',
    blocks: [
      p('Lume uses the following processors. Each receives only what its function requires.'),
      vList(
        'Always, as part of running the service:',
        [
          'Clerk — authentication and account management. Receives your email address and name, and issues your user ID.',
          'Supabase — database hosting. Stores every row of your data.',
          'RevenueCat — subscription management. Receives your user ID and your purchase status.',
        ],
        'backend/cmd/server/main.go (Clerk verifier, pgx pool, subscription webhook); CONFIG.md',
      ),
      vList(
        'Only when you use the feature, and only after you have accepted the AI disclosure:',
        [
          'Google Gemini — receives the meal or nutrition-label photograph you are scanning, in full, together with a short learned summary of your food preferences and recent corrections (so estimates improve for you), in order to analyse it.',
          'Anthropic — receives a summary of your logged data (food logs, gym sessions, goals, streak and body weights) in order to write the wording of insights and briefs, and — when you use Ask Lume — the question you typed.',
        ],
        'backend/internal/scan/pipeline/gemini.go (UserContextFrom); backend/internal/ai/ai.go (query: user question in prompt); gated server-side by profiles.ai_consent_at — audited 2026-08-06',
      ),
      vList(
        'When you search foods or scan a barcode (no AI consent involved — these are database lookups):',
        [
          'Open Food Facts and USDA FoodData Central — receive the search text or barcode number to find a match. No account information accompanies the lookup.',
        ],
        'backend/internal/food/search.go — audited 2026-08-06',
      ),
      vList(
        'Only if you connect them yourself:',
        [
          'Strava — receives an authorisation to read your activities, so they can be imported.',
          'WHOOP — the same.',
        ],
        'backend/internal/integrations/strava.go, whoop.go — note: neither is operational today; no OAuth application is registered, so connecting returns 503',
      ),
      v(
        'Lume does not sell personal information, does not disclose health information for advertising, ' +
          'and contains no advertising SDK and no third-party tracking SDK.',
        'package.json (no ad/analytics dependency); src/lib/analytics.ts (first-party only)',
      ),
      todo(
        'The contractual position with each processor: what each is permitted to do with the data, ' +
          'whether any is a controller in its own right rather than a processor, and whether any may ' +
          'use the data to train models. In particular, what Google may do with a meal photograph once ' +
          'it is received is governed by Google’s terms, not by this codebase, and must be stated ' +
          'accurately here rather than assumed.',
      ),
    ],
  },
  {
    id: 'overseas',
    heading: 'Overseas disclosure',
    blocks: [
      p(
        'Australian Privacy Principle 8 requires this policy to identify the countries in which ' +
          'overseas recipients are likely to be located, where practicable, and to explain what happens ' +
          'when personal information is disclosed to them.',
      ),
      v(
        'That every processor named in the previous section is used is verified from the codebase. Which ' +
          'jurisdictions each one stores or processes data in is a matter of your account configuration ' +
          'and their corporate structure, and cannot be read from this repository.',
        'backend/cmd/server/main.go; CONFIG.md — configuration only, no region is pinned in code',
      ),
      todo(
        'For each of Clerk, Supabase, RevenueCat, Google (Gemini), Anthropic, Strava and WHOOP: the ' +
          'country or countries in which it stores and processes data, and the Supabase project region ' +
          'in particular. Then the APP 8 statement itself, including whether Lume takes reasonable steps ' +
          'to ensure overseas recipients comply, or relies on an exception.',
      ),
    ],
  },
  {
    id: 'security',
    heading: 'Storage, security and retention',
    blocks: [
      vList(
        'Security measures that exist in the code today:',
        [
          'All traffic between the app and our servers is encrypted in transit.',
          'Every table enforces row-level security, so one account cannot read another account’s rows even if the application layer were wrong.',
          'Every API request is authenticated against a verified token before it reaches a handler.',
          'OAuth tokens for connected services are encrypted at rest with AES-256-GCM before being written to the database.',
        ],
        'supabase/migrations/*.sql (enable row level security across 8 migrations); backend/internal/auth/middleware.go; backend/internal/integrations/crypto.go:26-33',
      ),
      v(
        'Meal and nutrition-label photographs are NOT retained by Lume. The scan record keeps a quality ' +
          'score and the geometry derived from the image, not the image itself. The photograph is, ' +
          'however, transmitted in full to Google Gemini in order to be analysed, and what happens to it ' +
          'there is governed by Google’s terms.',
        'supabase/migrations/20260719000001_multi_capture.sql:16-23 (scan_images stores quality_score + geometry_result only)',
      ),
      todo(
        'Retention periods. How long each category of data is kept while an account is active, what ' +
          'happens to it if an account is dormant, whether anything is retained after deletion for legal ' +
          'or accounting reasons, and how backups are handled — a cascading delete removes live rows, ' +
          'but backup retention is a hosting configuration question, not a code question.',
      ),
    ],
  },
  {
    id: 'access-correction',
    heading: 'Access and correction',
    blocks: [
      v(
        'You can export everything Lume holds about you from within the app. The export returns every ' +
          'row you own as a single machine-readable document.',
        'backend/internal/auth/export.go:80-84 (GET /api/export)',
      ),
      v(
        'You can view and correct your profile, goals and every logged food and gym entry directly in ' +
          'the app at any time.',
        'src/app/profile/ (account, goals); src/app/(tabs)/food.tsx, gym.tsx (edit and delete entries) — "body metrics" removed 2026-08-06: no dedicated body-metrics edit screen exists',
      ),
      todo(
        'The formal APP 12 and APP 13 process for someone who cannot or does not want to use the app: ' +
          'how to make an access or correction request, what identification is required, the timeframe ' +
          'for responding, and the grounds on which a request may be refused.',
      ),
    ],
  },
  {
    id: 'deletion',
    heading: 'Deleting your account',
    blocks: [
      v(
        'Deleting your account from within the app is immediate and destructive. Your sign-in identity ' +
          'is deleted at the authentication provider first, so the account can no longer be signed into, ' +
          'and your profile row is then deleted. Every table that holds your data references that row ' +
          'with a cascade, so all of it goes with it. There is no grace period during which the account ' +
          'quietly still exists.',
        'backend/internal/auth/profile.go:156-172 (identity first, then cascade)',
      ),
      v(
        'If the identity deletion fails, the operation stops and reports an error WITHOUT deleting your ' +
          'data — the app never reports a deletion that did not happen.',
        'backend/internal/auth/profile.go (502 returned without touching the row)',
      ),
      todo(
        'Whether anything survives deletion — backups, accounting records for a past subscription, or ' +
          'aggregated analytics — and for how long. See the retention TODO above; the answer must be ' +
          'consistent across both sections.',
      ),
    ],
  },
  {
    id: 'complaints',
    heading: 'Complaints',
    blocks: [
      todo(
        'Required by APP 1.4 and currently absent entirely. Needed: how to complain about a privacy ' +
          'breach, who receives the complaint, the timeframe for acknowledging and resolving it, and the ' +
          'escalation path to the Office of the Australian Information Commissioner. Also whether Lume ' +
          'is covered by the Notifiable Data Breaches scheme and how a notifiable breach would be ' +
          'handled.',
      ),
    ],
  },
  {
    id: 'analytics',
    heading: 'Cookies and analytics',
    blocks: [
      v(
        'In the app: first-party product analytics only, sent to our own servers, restricted to the ' +
          'closed list of twelve event names in the collection section above. No advertising SDK, no ' +
          'IDFA, no third-party tracker, and no cross-app or cross-site tracking. Analytics can be ' +
          'turned off in Settings.',
        'src/lib/analytics.ts:31-44 (allowlist), :87-105 (track); package.json (no ad SDK)',
      ),
      v(
        'Analytics in the app is currently ON by default and must be turned off — it is opt-out, not ' +
          'opt-in. That is stated here because it is the kind of default a reader is entitled to know ' +
          'without hunting for it.',
        'src/lib/settings/store.ts:95 (analyticsEnabled: true)',
      ),
      v(
        'On this website: Google Analytics loads only if a measurement ID is configured at build time, ' +
          'AND your browser does not send Do Not Track or Global Privacy Control, AND you have accepted ' +
          'the consent note. If any of those is false it never loads.',
        'web/components/ConsentAnalytics.tsx',
      ),
      todo(
        'Whether the opt-out default is the right posture for a health app, and if analytics is kept ' +
          'opt-out, the disclosure this policy needs to make about it.',
      ),
    ],
  },
  {
    id: 'children',
    heading: 'Children',
    blocks: [
      todo(
        'The minimum age for using Lume and how it is enforced. Note the two documents currently ' +
          'disagree with the code: the Terms of Service state a minimum age of 16, and nothing in the ' +
          'application asks for or verifies age at sign-up. Decide the age, decide the enforcement, then ' +
          'make the app, the Terms and this policy agree.',
      ),
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to this policy',
    blocks: [
      todo(
        'How changes are made and communicated, whether continued use constitutes acceptance, whether ' +
          'material changes to the handling of health information require fresh consent, and where ' +
          'previous versions can be found.',
      ),
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    blocks: [
      todo(
        'The privacy contact: who to write to, at what address, and whether a specific privacy officer ' +
          'is nominated. The general support address is published on the support page, but a privacy ' +
          'contact is a distinct requirement and should be stated deliberately.',
      ),
    ],
  },
];

/* ===========================================================================
   TERMS OF SERVICE
   =========================================================================== */

export const TERMS: Section[] = [
  {
    id: 'acceptance',
    heading: 'Agreement and acceptance',
    blocks: [
      todo(
        'The formation of the agreement: what constitutes acceptance, that these terms form a binding ' +
          'contract, and what happens if a user does not agree.',
      ),
    ],
  },
  {
    id: 'who-we-are',
    heading: 'Who we are',
    blocks: [
      todo('The same entity details required by the privacy policy: legal name, ABN or ACN, and address.'),
    ],
  },
  {
    id: 'eligibility',
    heading: 'Eligibility and your account',
    blocks: [
      todo(
        'Minimum age and how it is enforced, the requirement to provide accurate information, ' +
          'responsibility for account security, and whether accounts may be shared or transferred. See ' +
          'the age inconsistency noted in the privacy policy.',
      ),
    ],
  },
  {
    id: 'the-service',
    heading: 'The service',
    blocks: [
      vList(
        'What Lume does, described from the source rather than from marketing copy:',
        [
          'Logs food by search, barcode, nutrition-label photograph, meal photograph, quick add, saved meals and recipes.',
          'Estimates the contents of a photographed meal and attaches a confidence score to that estimate. Two or three camera angles are compared against each other, and disagreement is surfaced rather than averaged away.',
          'Reads packaged food from a barcode using Open Food Facts and the USDA FoodData Central database.',
          'Logs gym sessions against a weekly schedule and reusable templates, and tracks streaks with one freeze available per streak.',
          'Computes energy expenditure for treadmill, cycling, rowing and stair-climbing from published ACSM metabolic equations, and a MET estimate elsewhere.',
          'Reconciles calories in against basal metabolic rate plus logged exercise.',
          'Generates written insights, a morning brief and answers to questions about your own logged data.',
        ],
        'src/app/food/, src/app/gym/; backend/internal/scan/pipeline/, backend/internal/energy/formulas.go, backend/internal/ai/',
      ),
      v(
        'Estimates produced from a photograph are estimates. The app states a confidence score for each ' +
          'one rather than presenting a single figure as certain.',
        'backend/internal/scan/pipeline/confidence.go:9-82',
      ),
      todo(
        'Any service commitments: availability, support response times, and the right to change or ' +
          'discontinue features.',
      ),
    ],
  },
  {
    id: 'health-disclaimer',
    heading: 'Health disclaimer',
    blocks: [
      // Written in full, deliberately: this is standard, the app already ships the
      // same substance (src/components/display/HealthDisclaimer.tsx and the
      // in-app terms screen), and leaving a health disclaimer as a placeholder
      // would be worse than stating it.
      p(
        'Lume provides general nutrition and fitness information. It is not medical advice, it is not a ' +
          'medical device, and it does not diagnose, treat, cure or prevent any condition.',
      ),
      p(
        'Always consult a qualified healthcare professional before making decisions about your diet, ' +
          'exercise, medication or health — particularly if you are pregnant or nursing, are under 18, or ' +
          'have a medical condition or a history of disordered eating. Never disregard professional ' +
          'medical advice, or delay seeking it, because of something you read in the app.',
      ),
      p(
        'If you think you may have a medical emergency, contact your doctor or your local emergency ' +
          'service immediately.',
      ),
      p(
        'Calorie and macronutrient targets are calculated from standard published formulas using the ' +
          'information you provide. They are a starting point, not a prescription. Estimates produced ' +
          'from photographs are approximations and carry real uncertainty, which is why the app shows ' +
          'you how confident it is. You rely on the app’s estimates and insights at your own risk.',
      ),
      v(
        'The app enforces a floor on calculated calorie targets so it cannot recommend an unsafe intake, ' +
          'and the server rejects a manual target outside a safe band.',
        'backend/internal/goals/goals.go:78-82 (calorieTargetMin 1200, calorieTargetMax 10000); src/lib/onboarding/deriveTargets.ts',
      ),
    ],
  },
  {
    id: 'subscriptions',
    heading: 'Subscriptions and billing',
    blocks: [
      v(
        'Lume Pro is an auto-renewing subscription purchased through Apple’s in-app purchase system. ' +
          'Payment is charged to your Apple ID, and Lume never receives your payment details.',
        'src/lib/billing/purchases.ts (RevenueCat over StoreKit); src/app/onboarding/paywall.tsx (hosted paywall)',
      ),
      v(
        'The free trial is 7 days. That figure is derived from a single constant used by every surface ' +
          'that mentions it, so the app and this document cannot disagree.',
        'src/lib/billing/purchases.ts:23 (TRIAL_DAYS = 7); asserted by src/__tests__/authBilling.test.ts',
      ),
      p(
        'Apple displays the exact price, the billing period and the renewal terms before you confirm a ' +
          'purchase. Subscriptions renew automatically unless auto-renew is turned off at least 24 hours ' +
          'before the end of the current period. You can view, change or cancel a subscription at any ' +
          'time in your Apple ID subscription settings; cancelling stops future renewals. Refunds are ' +
          'handled by Apple under its own policies, not by Lume.',
      ),
      todo(
        'DO NOT STATE A PRICE HERE UNTIL ONE IS CONFIGURED. No subscription product exists in App Store ' +
          'Connect and no RevenueCat offering is set up, so any price printed today would be invented. ' +
          'The previous version of this document stated US$8.99 per month and US$49.99 per year — figures ' +
          'that appear in no code and in no configured product. Once products are live, confirm the ' +
          'trial length configured in the App Store matches the 7 days above, then decide whether to ' +
          'state prices here at all or continue to defer to Apple.',
      ),
      todo(
        'Consumer-law-compliant cancellation and refund wording. Australian Consumer Law guarantees ' +
          'apply to digital products and cannot be excluded — a flat "no refunds" clause is itself a risk.',
      ),
    ],
  },
  {
    id: 'free-tier',
    heading: 'Free tier and limits',
    blocks: [
      v(
        'A free tier exists and is enforced on our servers rather than in the app, so it means the same ' +
          'thing on every device. It covers manual, search and barcode logging, nutrition-label scanning, ' +
          'a daily allowance of photograph scans, every gym feature, your dashboards and energy balance, ' +
          'data export, and account deletion.',
        'backend/internal/entitlement/entitlement.go (policy table wrapping the authenticated mux)',
      ),
      v(
        'The daily photograph-scan allowance is a configuration value, not a fixed number, so this ' +
          'document deliberately does not state one. The app shows you the current allowance and what ' +
          'remains of it.',
        'backend/internal/entitlement/entitlement.go:72 (FreeScansPerDay, env LUME_FREE_SCANS_PER_DAY, default 3)',
      ),
      todo(
        'Whether Lume reserves the right to change the free allowance, and what notice is given if it ' +
          'is reduced.',
      ),
    ],
  },
  {
    id: 'acceptable-use',
    heading: 'Acceptable use',
    blocks: [
      todo(
        'The prohibitions and their consequences. Obvious candidates to scaffold from: no reverse ' +
          'engineering, no automated scraping or bulk access, no attempt to circumvent the entitlement ' +
          'or rate limits, no uploading of content you have no right to upload, no use to harass another ' +
          'person, no use in breach of any law. Each needs a stated consequence.',
      ),
    ],
  },
  {
    id: 'user-content',
    heading: 'Your content',
    blocks: [
      todo(
        'Ownership of the content you create, and the precise licence Lume needs in order to operate — ' +
          'in particular the licence to transmit a meal photograph to a third-party AI processor for ' +
          'analysis, which is narrower than a general content licence and should be drafted as such. ' +
          'State explicitly whether content may be used to train models.',
      ),
      v(
        'Factually: photographs are sent to Google Gemini for analysis and are not retained by Lume ' +
          'afterwards. Only a quality score and derived geometry are stored.',
        'supabase/migrations/20260719000001_multi_capture.sql:16-23; backend/internal/scan/pipeline/gemini.go',
      ),
    ],
  },
  {
    id: 'intellectual-property',
    heading: 'Intellectual property',
    blocks: [
      todo(
        'Ownership of the app, its design and its code; the licence granted to the user; trade mark ' +
          'position; and the third-party and open-source licences relied on. Note that the LICENSE file ' +
          'in this repository is unmodified Expo scaffolding boilerplate and does not license this ' +
          'codebase — that needs resolving before anything is said about ownership.',
      ),
    ],
  },
  {
    id: 'third-parties',
    heading: 'Third-party services',
    blocks: [
      v(
        'Lume relies on Clerk for authentication, Supabase for database hosting, RevenueCat for ' +
          'subscription management, Google Gemini for photograph analysis, and Anthropic for the wording ' +
          'of insights. Strava and WHOOP are used only if you connect them yourself. Each is described ' +
          'in more detail in the privacy policy.',
        'backend/cmd/server/main.go; see the privacy policy disclosure section',
      ),
      todo(
        'That each third-party service is governed by its own terms, that Lume is not responsible for ' +
          'them, and what happens to your use of Lume if one becomes unavailable.',
      ),
    ],
  },
  {
    id: 'liability',
    heading: 'Disclaimers and liability',
    blocks: [
      todo(
        'MUST BE DRAFTED FOR AUSTRALIAN LAW, NOT ADAPTED FROM A US TEMPLATE. Consumer guarantees under ' +
          'the Australian Consumer Law cannot be excluded, restricted or modified, and a blanket ' +
          '"as is, no warranties of any kind" exclusion is itself conduct that may mislead under s18 of ' +
          'the ACL. The clause needs the ACL savings wording, a properly limited liability cap where ' +
          'limitation is permitted, and consistency with the health disclaimer above.',
      ),
    ],
  },
  {
    id: 'termination',
    heading: 'Termination',
    blocks: [
      v(
        'You can delete your account at any time from within the app. Deletion is immediate and ' +
          'destructive, as described in the privacy policy.',
        'backend/internal/auth/profile.go:156-172',
      ),
      todo(
        'The grounds on which Lume may suspend or terminate an account, whether notice is given, what ' +
          'happens to an active subscription on termination, and which clauses survive.',
      ),
    ],
  },
  {
    id: 'changes',
    heading: 'Changes to these terms',
    blocks: [
      todo(
        'How these terms may be changed, what notice is given, whether continued use constitutes ' +
          'acceptance, and — given ACL unfair-contract-terms rules apply to standard-form consumer ' +
          'contracts — whether a unilateral variation right is enforceable as drafted.',
      ),
    ],
  },
  {
    id: 'governing-law',
    heading: 'Governing law',
    blocks: [
      v(
        'These terms are governed by the laws of the State of South Australia, Australia. This is the ' +
          'jurisdiction the existing document already states, and it is consistent with the rest of the ' +
          'site describing an Adelaide-based operation.',
        'web/app/terms/page.tsx (pre-existing); web/components/Footer.tsx (Adelaide, South Australia)',
      ),
      todo(
        'Confirm the governing law and jurisdiction against the actual registered entity once it is ' +
          'identified, and add the submission-to-jurisdiction wording.',
      ),
    ],
  },
  {
    id: 'contact',
    heading: 'Contact',
    blocks: [
      todo('The contact point for notices under these terms, and the address for legal service.'),
    ],
  },
];

/** Every TODO across both documents, for the checker and the page footers. */
export function countTodos(sections: Section[]): number {
  return sections.reduce((n, s) => n + s.blocks.filter((b) => b.kind === 'todo').length, 0);
}
