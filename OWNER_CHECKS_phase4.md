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
