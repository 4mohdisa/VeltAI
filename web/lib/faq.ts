/* FAQ content — one source of truth, rendered on the home page (CORE) and in
   full on /faq (CORE + EXTRA). Shared so the two can never drift apart.

   EVERY ANSWER WAS CHECKED AGAINST THE CODE. The previous copy contained five
   claims the implementation does not support — most seriously that Lume syncs
   with Apple Health (there is no HealthKit integration in any form: the seam at
   src/lib/health/appleHealth.ts is a null module whose only importer is its own
   unit test) and that estimates come with a calorie RANGE (nothing in the app
   computes or displays an interval). Both are gone. */

export type QA = { q: string; a: string[] };

export const CORE: QA[] = [
  {
    q: 'How accurate is it?',
    a: [
      'A photo estimate is an estimate, and it carries real uncertainty. Depth is invisible to a single camera, sauce hides what is under it, and two plates of the same dish can differ by a third in weight. Any app that answers this question with a single confident number is telling you something it cannot know.',
      'So Lume scores every photo estimate out of 100 and shows you the score. The score is built from things that are actually checkable: whether the image was sharp, whether the lighting was good, whether a plate was detected to give the scene scale, and whether the macros came from a food database rather than the model alone. A single camera angle is capped part-way up the scale on purpose, because one angle genuinely cannot resolve depth.',
      'Barcodes and nutrition labels are a different matter: those are read, not estimated, and they are exact to whatever the manufacturer printed.',
    ],
  },
  {
    q: 'How does photo scanning work?',
    a: [
      'The photo is analysed to identify the foods and estimate how much of each is on the plate, using the geometry of the image for scale. Where a food matches Lume’s reference library, the macros come from that entry rather than from the model’s guess, and the estimate says so.',
      'You can add a second or third angle. Lume estimates each shot independently and compares them: if they agree it merges them and the confidence goes up; if they disagree it shows you both estimates and asks which one is right, rather than silently averaging them.',
      'Nothing is saved until you review it. You can rename any item, drag its weight, or discard it.',
    ],
  },
  {
    q: 'Is my health data private?',
    a: [
      'Your food, workouts, body stats and weight history are scoped to you at the database level — row-level security means one account cannot read another’s rows even if the application layer were wrong. It is never sold, never shared for advertising, and never shown to other users. The app contains no advertising SDKs and no third-party trackers.',
      'Two things leave our infrastructure, and only after you have agreed to it: meal and label photos go to Google Gemini to be analysed, and a summary of your logged data goes to Anthropic to write the wording of insights. Lume asks before the first time either happens, records that you agreed, and refuses to send anything until you have. You can withdraw it and the sending stops.',
      'Deleting your account is immediate and real: your sign-in identity is deleted first, then your data, and every table cascades. There is no grace period during which it quietly still exists.',
    ],
  },
  {
    q: 'What does it cost?',
    a: [
      'There is a free tier that is genuinely useful rather than a trial in disguise: unlimited manual, search and barcode logging, nutrition-label scanning, three photo scans a day, every gym feature, your dashboards and energy balance, data export and account deletion.',
      'Pro is a subscription that adds unlimited photo scans and the AI layer — insights, the morning brief, and asking questions about your own data. It comes with a 7-day free trial. Pricing is set in App Store Connect and Apple will show you the exact amount and renewal terms before you are charged.',
    ],
  },
  {
    q: 'Does it know my cuisine?',
    a: [
      'Partly, and it is worth being precise about how much. Lume ships a reference library of foods organised across eight cuisine groups — South Asian, East Asian, Southeast Asian, Middle Eastern, Mediterranean, Western, African and Latin American — so a scan that matches one of those uses real per-100g values instead of an estimate. It is a starting library, not an encyclopaedia.',
      'The part that gets better with use is personal: the dishes you log most, the corrections you have made, and your cuisine selections are fed into each new scan, so it learns your food rather than the average person’s.',
    ],
  },
  {
    q: 'Does it sync with Apple Health, Strava or WHOOP?',
    a: [
      'Not yet — none of them. This is worth stating plainly because it is easy to imply otherwise: Lume has no Apple Health integration at all, and the Strava and WHOOP connections are built but not switched on, because they need registered developer applications that do not exist yet.',
      'Today, the exercise side of your energy balance comes from workouts you log in Lume itself.',
    ],
  },
  {
    q: 'Is there a free trial?',
    a: [
      'Yes — 7 days on Pro. You can cancel during the trial from your Apple ID subscription settings and you will not be charged.',
    ],
  },
  {
    q: 'What does the AI actually do?',
    a: [
      'It writes words; it does not do the arithmetic that matters. Calorie and macro totals, BMR, exercise burn and your energy balance are computed by ordinary code from published formulas. The AI reads the result and writes the sentence about it.',
      'The one place a model does estimate numbers is photo scanning, and that is exactly why every photo estimate carries a confidence score.',
    ],
  },
];

export const EXTRA: QA[] = [
  {
    q: 'How is calorie burn calculated?',
    a: [
      'For cardio on a treadmill, bike, rower or stair climber, Lume asks for the parameters that actually determine the work — speed and incline, watts, or split time — and runs the published ACSM metabolic equation for that machine. While you are entering them it will show you the equation and the resulting MET value.',
      'Everything else, including strength work, uses a MET estimate scaled by your bodyweight and the time you were working. That is an approximation and a coarser one; it is not presented as anything more.',
    ],
  },
  {
    q: 'Does it work offline?',
    a: [
      'Logging does. Entries you make without a connection are queued and sent when you are back online, each with an idempotency key so a retry can never create a duplicate. A gym session and its exercises are queued as one ordered unit, so a half-sent workout cannot leave orphaned exercises behind.',
      'Photo scanning needs a connection, because the analysis happens on the server.',
    ],
  },
  {
    q: 'Can I get my data out?',
    a: [
      'Yes. Settings has an export that returns everything Lume holds for you in a machine-readable file — food logs, gym sessions, goals, body weight history and your profile.',
    ],
  },
  {
    q: 'Does it send notifications?',
    a: [
      'No. Lume sends no notifications of any kind. There is no streak-shaming, no “you haven’t logged today”, no engineered urgency.',
    ],
  },
  {
    q: 'What happens when I delete my account?',
    a: [
      'Your authentication identity is deleted first, so the account can no longer be signed into, and then your data rows are deleted. Every user table references your profile with a cascade, so nothing is left behind. If the identity deletion fails, the whole operation stops and reports an error rather than deleting your data and leaving you able to sign in — Lume never claims a deletion it did not complete.',
    ],
  },
];

export const ALL: QA[] = [...CORE, ...EXTRA];
