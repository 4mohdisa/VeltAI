HANDOVER — branch loop/design-match, tree clean at 1b8ab30.

BUILT THIS RUN
- Profile — Goals (src/app/profile/goals.tsx): three design hints wired (goals.setByLume / tapToEdit beside the "Daily calories" label, goals.savedAsYouType below); calorie figure + split control + macro rows wrapped in one Card variant="elevated" with a hairline under the figure. Row stays DIFFERENT with a Built: note.
- Gym — session logging (src/app/gym/log-session.tsx): row now 🔨 BUILT (not verified). Replaced the 4-field questionnaire with the design's "How did it go?" chooser — plan subtitle, three tiles, footer pill committing the plan via logGymSession(session, workout) at completionRate 1. New gymLog group in en.json.
- Gym session modes (src/app/gym/session.tsx): optional mode param 'adjust' | 'ticklist' | 'picker'; log-session passes it per tile.
- Food — Search (src/app/(tabs)/food.tsx): focus=search param focuses the input then clears itself; the trailing + disc is a real button logging at 100 g with a toast; row label uses foodLog.openFood. Row stays DIFFERENT with a Built: note.
- Food — Add sheet (src/app/food/add.tsx): three sub-lines on i18n keys; "Search foods" routes to /(tabs)/food?focus=search.

IN PROGRESS — 3-step data path, step 1 of 3 done
Goal: the detail sheet and the + disc must write the same row. Step 1 (done, 1b8ab30): src/lib/food/detailSubject.ts search variant gained optional proteinPer100 / carbsPer100 / fatPer100. Step 2: src/app/(tabs)/food.tsx pick() must pass those from food. Step 3: src/app/food/detail.tsx search branch replaces its hardcoded protein/carbs/fat zeros in both seed and per100.

DECISIONS
- Design payload: decode via the __bundler/manifest JSON in design/Lume App.html, gzip+base64 per entry (I used a python one-liner to /tmp/bundle.txt).
- Card variant="elevated" is the repo's established mapping for the design's white card; it adds shadow.sm the design lacks.
- session.tsx seeds mode state by derivation, not an effect — eslint react-hooks/set-state-in-effect is active and rejects setState in effects.

GOTCHAS
- adjust/ticklist arrive with rows checked, so dirty is true and the beforeRemove "Save progress?" guard fires on an untouched back-out.
- detail.tsx:169-170 comment ("search catalog has no macro columns") goes stale at step 3; that branch also passes macros={false}, so values stay hidden until Isa decides.
- Dev catalog carries calories only, so macro fixes are a no-op in dev.
- No tests exist on any screen touched; findRelatedTests returns none except detailSubject.ts (51 pass).
- Gym row differences 17, 18, 19, 23 still open.