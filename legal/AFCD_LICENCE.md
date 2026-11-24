# LEGAL note: Australian Food Composition Database (AFCD)

Lume's food search reads a local copy of the AFCD, published by Food Standards
Australia New Zealand (FSANZ). Table: `afcd_foods`
(`supabase/migrations/20261125000001_afcd_foods.sql`). Importer:
`backend/tools/afcd`. Checked 25 Nov 2026 with web tools (no browser).

## Source

- Download page: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/australian-food-composition-database-download-excel-files
- File used: "AFCD Release 3 - Nutrient profiles" (Excel, about 2 MB), sheet
  "All solids & liquids per 100 g":
  https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Nutrient%20profiles.xlsx
- It is a plain direct link (no form, no login). Release 3 has 1,588 foods;
  the importer loaded all 1,588 into a local test database.

## Licence

- Licence page: https://foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement
  (the path under /food-nutrient-databases/ returns 404).
- Name: FSANZ "Data User Licence Agreement".
- **Verified on the page:** a worldwide, royalty-free, non-exclusive, perpetual
  licence; no use of the FSANZ logo or the Commonwealth coat of arms.
- **Read only as a summary, not verified word for word:**
  - The licence is based on Creative Commons Attribution-ShareAlike 3.0
    Australia.
  - Attribution: keep copyright notices, credit FSANZ, the work title and any
    link FSANZ specifies, and mark changes in derived works.
  - Distribution (clause 4A): include the licence or a link to it, the
    "Limitation of Data Statement", and a statement that the work is based on
    Australian data, which may not be appropriate for use in other countries.
  - Derived works may be shared only under the same licence (share-alike).
  - No suggestion that FSANZ endorses Lume.
  - Commercial use is not mentioned either way. The royalty-free grant
    suggests it is allowed, but that is an inference.

## What Lume does

- Credits FSANZ in the Terms (third-party services section), in the app and on
  the website, with the "Australian data" statement.
- Shows nutrient values in search results. It does not offer the dataset
  itself for download.
- Does not use the FSANZ logo or suggest endorsement.

## Open for Isa (see OWNER_CHECKS_phase4.md)

1. Read the licence page in a browser and confirm the summarised points above,
   especially commercial use and whether showing values in a paid app counts
   as "distributing" a derived work under share-alike.
2. Confirm the attribution wording in the Terms is enough, or add a link to the
   licence and the Limitation of Data Statement.
