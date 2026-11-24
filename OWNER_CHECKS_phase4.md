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
