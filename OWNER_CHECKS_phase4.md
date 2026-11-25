# Owner checks: Phase 4

Steps only Isa can do. Each says what, where and why.

## Rows 2c and 2d (Gemini for insights, Australia first)

- [ ] **AFCD licence.** Open https://foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement
  in a browser and confirm the points marked "read only as a summary" in
  `legal/AFCD_LICENCE.md`: commercial use, share-alike for derived data, and
  the exact attribution. Adjust the FSANZ credit in the Terms if needed
  (`src/app/legal/terms.tsx` and `web/lib/legal.ts`).
- [ ] **Load the AFCD into each database you deploy.** The migration only
  creates the empty `afcd_foods` table; search falls back to Open Food Facts
  until it is loaded. The importer refuses non-local databases on purpose.
  Locally:

  ```sh
  curl -fLo /tmp/afcd-nutrient-profiles.xlsx \
    'https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Nutrient%20profiles.xlsx'
  cd backend && DATABASE_URL=postgres://...@127.0.0.1:55432/lume go run ./tools/afcd /tmp/afcd-nutrient-profiles.xlsx
  ```

  For the hosted database, decide how you want to load it (for example, export
  the local table with `pg_dump --data-only -t afcd_foods` and restore it).
- [ ] **Gemini billing cap.** Set a spend cap on the `GEMINI_API_KEY` in Google
  AI Studio. It now runs insights, the morning brief and Ask Lume as well as
  scans. `ANTHROPIC_API_KEY` can be removed unless you switch on
  `LLM_PROVIDER=claude`.
- [ ] **Set `LUME_TIMEZONE=Australia/Sydney`** on the server. The app sends its
  own time zone with every request; this is only the fallback, and it is the
  zone the background insight sweep uses for meal timing.
- [ ] **Read `AI_COSTS.md`** and compare it with the first week of real usage in
  Google AI Studio.
- [ ] **Row 2.1 simulator check of the Total gym days tile.** Not run: no existing seed path gives a user more than 200 distinct gym dates (`backend/tools/seed` tops out at 59 for `seed_long_streak`, `backend/scripts/seed_local.sql` has 2). Seed users also have seed_ Clerk ids, so the E2E_EMAIL account cannot sign in as one. Decide whether to add 250 or more gym dates for the E2E account in a seed path, then rerun the check.
- [ ] **Row 2.3 es and fr range separator.** `dashboard.rangeSeparator` is " – " in en, es and fr (week screen date range). Decide whether es and fr should use another form, for example "al" or "au".
- [ ] **Row 12a App Store privacy label.** Answer the App Store Connect privacy questions to match `app.json` `ios.privacyManifests` and `PRIVACY_DATA.md`: product interaction (linked, analytics), other diagnostic data (linked, app functionality and analytics), crash data (not linked), customer support, photos, health, fitness and other user content (linked, app functionality), no tracking. Account data (email and name through Clerk, user ID) is not in `PRIVACY_DATA.md` or the manifest yet; decide how to declare it.
- [ ] **Row 12a es and fr camera prompt.** Review `src/lib/i18n/infoPlist/es.json` and `fr.json`. They translate the camera plugin text, which is the prompt iOS shows. `app.json` also has a longer `infoPlist.NSCameraUsageDescription` that the plugin text overrides; decide which wording to keep (removing one needs `src/__tests__/productName.test.ts` changed).
- [ ] Push loop/phase4 and confirm the CI workflow runs green on GitHub (Isa only).
- [ ] **Row 2b es and fr session expired message.** Review `onboarding.sessionExpired` in `src/lib/i18n/locales/es.json` ("Tu sesión ha caducado. Vuelve a iniciar sesión para terminar la configuración.") and `fr.json` ("Votre session a expiré. Reconnectez-vous pour terminer la configuration."). Both are the agent's own translation; the message shows on the signup status check and the onboarding paywall when the session has expired.
- [ ] **Row 2b step 1e launch gate 401 route needs a simulator check.** On launch, a signed-in user whose onboarding status check returns 401 is now sent to `/onboarding/signup?mode=signin` with the session expired message (`src/app/index.tsx`). Check it on the simulator: Clerk may still report an active session until it is cleared, so signing in again there may fail or loop.
- [ ] **Row 2b onboarding answers survive an expired session (simulator check).** Mid-onboarding, let the Clerk session expire or revoke it in the Clerk development dashboard, then confirm on the simulator that the app opens sign-in with the session expired message and that, after signing in again, the onboarding answers and saved step are still there. A deliberate sign-out from Profile should still clear everything.
- [ ] Simulator: confirm signup 401 ends the session and keeps onboarding answers after a real Clerk expiry.
- [ ] Simulator: confirm the paywall 401 route (onboarding submit with an expired session) ends the Clerk session, keeps the onboarding answers and opens sign-in with the session expired message.
- [ ] Review R217 es and fr wording for onboarding.preview (title, createAccount, trialNote, the 8 cuisine lines, targets, portions, halal) in src/lib/i18n/locales/es.json and fr.json. All are agent translations.
- [ ] Review R219 es and fr wording for onboarding.done in src/lib/i18n/locales/es.json and fr.json: title es 'Todo listo', fr 'Tout est prêt'; welcomeToast es '¡Te damos la bienvenida a Lume!', fr 'Bienvenue sur Lume !'. All are agent translations.
- [ ] Row 2b paywall es and fr wording needs review: keys under onboarding.paywall in src/lib/i18n/locales/es.json and fr.json (17 keys, including features.*, trialNote, plansUnavailable, storeError, submitFailed, restore, restoring, noSubscription).
- [ ] Review R224 es wording for onboarding.validation.ageMissing: 'Añade tu edad antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.ageMissing: 'Ajoutez votre âge avant de terminer la configuration.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.ageRange: 'Tu edad debe estar entre 13 y 120 años.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.ageRange: 'Votre âge doit être compris entre 13 et 120 ans.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.sexMissing: 'Elige una opción de sexo antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.sexMissing: 'Choisissez une option pour le sexe avant de terminer la configuration.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.heightMissing: 'Añade tu altura antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.heightMissing: 'Ajoutez votre taille avant de terminer la configuration.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.heightRange: 'Tu altura debe estar entre 100 y 250 cm.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.heightRange: 'Votre taille doit être comprise entre 100 et 250 cm.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.weightMissing: 'Añade tu peso antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.weightMissing: 'Ajoutez votre poids avant de terminer la configuration.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.weightRange: 'Tu peso debe estar entre 30 y 300 kg.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.weightRange: 'Votre poids doit être compris entre 30 et 300 kg.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.activityMissing: 'Elige tu nivel de actividad antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.activityMissing: 'Choisissez votre niveau d'activité avant de terminer la configuration.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.goalMissing: 'Elige tu objetivo antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.goalMissing: 'Choisissez votre objectif avant de terminer la configuration.' (agent translation).
- [ ] Review R224 es wording for onboarding.validation.targetWeight: 'Tu peso objetivo no parece correcto — revísalo antes de terminar la configuración.' (agent translation).
- [ ] Review R224 fr wording for onboarding.validation.targetWeight: 'Votre poids cible semble incorrect — vérifiez-le avant de terminer la configuration.' (agent translation).
- [ ] Review R226 es wording for onboarding.sessionExpired: 'Tu sesión ha terminado. Vuelve a iniciar sesión para continuar.' (agent translation).
- [ ] Review R226 fr wording for onboarding.sessionExpired: 'Votre session a pris fin. Reconnectez-vous pour continuer.' (agent translation).
- [ ] Row 2b step 1d es and fr wording needs review: onboarding goal and activity keys (onboarding.goal*, onboarding.activity*), onboarding.measurements, onboarding.bodyType, onboarding.cuisine (title, subtitle, options), onboarding.dietary (title, subtitle, options), onboarding.targets and the shared back label (common.goBack) in src/lib/i18n/locales/es.json and fr.json (agent translations).
- [ ] es and fr wording needs review: healthDisclaimer.text in src/lib/i18n/locales/es.json and fr.json (agent translation).
- [ ] es and fr wording needs review: goals.loadFailed in src/lib/i18n/locales/es.json and fr.json (agent translation).
- [ ] es and fr wording needs review: customFood.saveButton (Save food) in src/lib/i18n/locales/es.json and fr.json (agent translation).
- [ ] es and fr wording needs review: the kJ unit string insights.brainProfile.typicalIntakeValueKj in src/lib/i18n/locales/es.json and fr.json (agent translation).
- [ ] es and fr wording needs review: dashboard.energyTarget in src/lib/i18n/locales/es.json and fr.json (agent translation).
- [ ] es and fr wording needs review: scanCards.noBreakdown in src/lib/i18n/locales/es.json and fr.json (agent translation).
- [ ] es and fr wording needs review: the Terms health disclaimer legal.terms.healthDisclaimer in src/lib/i18n/locales/es.json and fr.json (agent translation, legal text).
- [ ] Confirm English grams from 1,000 up now show a separator (for example 1,234 g, formatGrams and formatMacro in src/lib/formatting.ts); below 1,000 English is unchanged.
- [ ] es and fr wording needs review: barcodeScan.lookupFailedTitle, lookupFailedReason and lookupFailedHint in src/lib/i18n/locales/es.json and fr.json (agent translation, barcode network error).
- [ ] es and fr wording needs review: calendar.loadFailedTitle and calendar.loadFailedMessage in src/lib/i18n/locales/es.json and fr.json (agent translation, calendar error state).
- [ ] es and fr wording needs review: food.loggedDaysFailed in src/lib/i18n/locales/es.json and fr.json (agent translation, Food tab logged-days notice).

## Row 3: Sign in with Apple (owner steps)

1. Apple Developer portal, Identifiers: create or confirm the App ID for the `ios.bundleIdentifier` in `app.json`, with the Sign in with Apple capability ticked.
2. Apple Developer portal, Identifiers: create a Services ID, enable Sign in with Apple on it, and set its website URL to the Clerk return URL shown in step 4.
3. Apple Developer portal, Keys: create a Sign in with Apple private key and keep the .p8 file in a password manager or folder outside the repo, never in Git, notes or screenshots.
4. Clerk dashboard, development instance, SSO connections: enable Apple and enter the Services ID, your Team ID, the Key ID and the .p8 key contents there only.
5. Apple Developer portal, the Services ID from step 2: paste the redirect URL Clerk shows on the Apple connection into its Return URLs.
6. Clerk dashboard, development instance, allowed redirect URLs: add `lume://sso-callback` (the `scheme` in `app.json` plus the `sso-callback` path that `useSSO` uses).
7. Test "Continue with Apple" on the sign up screen with the development instance, on a real iPhone and on the Simulator, and confirm a new account and a returning account both sign in.

- Row 4, delete account screen: its text cannot move into en.json while English-only rounds forbid es and fr edits, because localeParity.test.ts fails on any en key that es and fr lack. Choose: allow es and fr keys for it, or let the parity test accept en-only keys.
- [ ] Row 2b plan-ready summary screen: decide whether to add a summary of the answers between targets and paywall (src/app/onboarding). The row stays PARTIAL until you choose.
- [ ] Row 5a consent version: consent is stored as a timestamp only (profiles.ai_consent_at). Decide whether to add a consent version so a changed disclosure asks everyone again. If yes, choose what happens to users who consented before versions existed: keep their consent or ask again.
