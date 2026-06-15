// One-off scaffolder: writes placeholder screens for Phase 1.
// Each file follows the mission's exact placeholder shape.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const APP = new URL('../src/app/', import.meta.url).pathname;

/** @type {[string,string,string,string,string][]} path, Comp, id, name, todo */
const screens = [
  // Onboarding A1-A19
  ['(onboarding)/welcome.tsx', 'WelcomeScreen', 'A1', 'Welcome', 'Black-bg: logo centred, tagline, Continue at bottom'],
  ['(onboarding)/value-prop.tsx', 'ValuePropScreen', 'A2', 'Value prop carousel', 'Three swipeable cards, bold word + line, skip-to-end top-right'],
  ['(onboarding)/auth.tsx', 'AuthScreen', 'A3', 'Sign in / sign up', 'Apple button top, email below equal, existing-account link'],
  ['(onboarding)/struggles.tsx', 'StrugglesScreen', 'A4', 'What is getting in the way', 'Eight multi-select option cards, Continue when >=1 picked'],
  ['(onboarding)/past-attempts.tsx', 'PastAttemptsScreen', 'A5', 'What have you tried', 'Six multi-select cards, Skip available'],
  ['(onboarding)/frustrations.tsx', 'FrustrationsScreen', 'A6', 'Fitness app frustrations', 'Six options + free-text, all optional, prominent Skip'],
  ['(onboarding)/reflection.tsx', 'ReflectionScreen', 'A7', 'Reflection', 'No inputs, centered conditional copy block, Continue'],
  ['(onboarding)/goal.tsx', 'GoalScreen', 'A8', 'Goal', 'Segmented goal type; weight slider + date picker if weight'],
  ['(onboarding)/why.tsx', 'WhyScreen', 'A9', 'Why', 'Multi-line text input ~5 lines, Skip framed as useful'],
  ['(onboarding)/body.tsx', 'BodyScreen', 'A10', 'About you', 'Weight/height sliders, age stepper, sex segmented, units toggle'],
  ['(onboarding)/schedule.tsx', 'ScheduleScreen', 'A11', 'Your day', 'Three native time pickers: wake, sleep, gym'],
  ['(onboarding)/gym.tsx', 'GymOnboardingScreen', 'A12', 'Your gym', 'Current + target sessions sliders, visual diff'],
  ['(onboarding)/eating.tsx', 'EatingScreen', 'A13', 'Your eating', 'Meals/day stepper, restrictions chips, allergies chips'],
  ['(onboarding)/cuisines.tsx', 'CuisinesScreen', 'A14', 'Your cuisines', 'Cuisine multi-select chips + cooks-at-home segmented'],
  ['(onboarding)/wow.tsx', 'WowScreen', 'A15', 'Wow moment', 'Animated projection chart + plan timeline + lockout preview'],
  ['(onboarding)/lockout.tsx', 'LockoutSetupScreen', 'A16', 'Lockout setup', 'Toggle, app picker, enforcement window, grace period'],
  ['(onboarding)/permissions.tsx', 'PermissionsScreen', 'A17', 'Permissions', 'HealthKit + Notifications explainers then native prompts'],
  ['(onboarding)/paywall.tsx', 'PaywallScreen', 'A18', 'Paywall', '14 days free headline, dated trial, why-14-days, Restore'],
  ['(onboarding)/generating.tsx', 'GeneratingScreen', 'A19', 'First plan generating', 'Loading with rotating tips, auto-advance to Dashboard'],
  // Tabs
  ['(tabs)/index.tsx', 'DashboardScreen', 'B1', 'Dashboard', 'Three zones: streak/xp/rank, gym status + macros ring, plan + lockout'],
  ['(tabs)/food.tsx', 'FoodLogScreen', 'C1', 'Food log', "Today's meals cards chronological, empty state, FAB +, pull-to-refresh"],
  ['(tabs)/gym.tsx', 'GymLogScreen', 'D1', 'Gym log', "Streak counter, 30-day calendar grid, today's log button"],
  ['(tabs)/profile.tsx', 'ProfileScreen', 'E1', 'Profile', 'Avatar, rank + progress bar, XP, streak, recent XP, settings list'],
  // Dashboard sub B2-B4
  ['dashboard/plan.tsx', 'PlanDetailScreen', 'B2', "Today's plan detail", 'Vertical timeline wake to bed, meal slots + 3 foods, gym marked'],
  ['dashboard/lockout.tsx', 'LockoutStatusScreen', 'B3', 'Lockout status', 'Blocked apps, grace remaining, emergency unlocks, grace button'],
  ['dashboard/nutrition.tsx', 'NutritionDetailScreen', 'B4', 'Nutrition detail', 'Calories vs target bar, per-macro bars, per-meal breakdown'],
  // Food sub C2-C12
  ['food/add.tsx', 'AddMealScreen', 'C2', 'Add meal entry method', '2x2 grid cards: Photo, Voice, Barcode, Manual'],
  ['food/photo-capture.tsx', 'PhotoCaptureScreen', 'C3', 'Photo capture', 'Camera viewfinder, capture button, add-label prompt'],
  ['food/photo-review.tsx', 'PhotoReviewScreen', 'C4', 'Photo review', 'Photos top, detected items w/ confidence opacity, total + Save'],
  ['food/uncertainty.tsx', 'UncertaintyScreen', 'C5', 'Uncertainty prompt', 'Single question card, four options, live calorie preview'],
  ['food/voice.tsx', 'VoiceEntryScreen', 'C6', 'Voice entry', 'Mic button center, live transcript, stop then review'],
  ['food/barcode-scan.tsx', 'BarcodeScanScreen', 'C7', 'Barcode scan', 'Auto-detect viewfinder with reticle, no shutter'],
  ['food/barcode-confirm.tsx', 'BarcodeConfirmScreen', 'C8', 'Barcode confirm', 'Product name/image/nutrition, serving size picker, Save'],
  ['food/search.tsx', 'ManualSearchScreen', 'C9', 'Manual food search', 'Search bar, OFF + recent results, add-custom link'],
  ['food/custom-food.tsx', 'CustomFoodScreen', 'C10', 'Custom food form', 'Fields: name, cals/100g, protein, carbs, fat, fibre'],
  ['food/[meal].tsx', 'MealDetailScreen', 'C11', 'Meal detail', 'Food items list, inline edit, destructive delete w/ confirm'],
  ['food/history.tsx', 'MealHistoryScreen', 'C12', 'Meal history', 'List by date desc, total cals + gym status, tap to day'],
  // Gym sub D2-D6
  ['gym/log-session.tsx', 'LogSessionScreen', 'D2', 'Log gym session', 'Optional duration/effort/energy/notes, big Log it'],
  ['gym/auto-detect.tsx', 'AutoDetectScreen', 'D3', 'HealthKit auto-detect', 'Detected workout banner, Yes/No to log as today'],
  ['gym/streak.tsx', 'StreakDetailScreen', 'D4', 'Streak detail', 'Streak top, upcoming 7 days actions, longest/total/freezes'],
  ['gym/freeze.tsx', 'FreezeScreen', 'D5', 'Apply streak freeze', 'Confirm use 1 of X freezes for a date'],
  ['gym/history.tsx', 'GymHistoryScreen', 'D6', 'Gym session history', 'Reverse-chron sessions, duration, verification badge, notes'],
  // Profile sub E2-E12
  ['profile/settings.tsx', 'SettingsScreen', 'E2', 'Settings list', 'Apple grouped list: Account, Subscription, Lockout, etc'],
  ['profile/account.tsx', 'AccountScreen', 'E3', 'Account settings', 'Email read-only, name editable, avatar, units, Delete Account'],
  ['profile/subscription.tsx', 'SubscriptionScreen', 'E4', 'Subscription', 'Plan, renewal date, Manage subscription, Restore Purchases'],
  ['profile/lockout-settings.tsx', 'LockoutSettingsScreen', 'E5', 'Lockout settings', 'Toggle, app picker, window, grace, emergency unlocks left'],
  ['profile/notifications.tsx', 'NotificationPrefsScreen', 'E6', 'Notification preferences', 'Per-type toggles, quiet hours pickers, daily cap stepper'],
  ['profile/apple-health.tsx', 'AppleHealthScreen', 'E7', 'Apple Health', 'Connection status, data types read, deep link to Settings'],
  ['profile/units.tsx', 'UnitsScreen', 'E8', 'Units', 'Metric / Imperial segmented control'],
  ['profile/privacy.tsx', 'PrivacyScreen', 'E9', 'Privacy', 'Policy/Terms/EULA links, data export (Phase 2)'],
  ['profile/support.tsx', 'SupportScreen', 'E10', 'Support', 'Email support, FAQ, app version, feedback textarea'],
  ['profile/about.tsx', 'AboutScreen', 'E11', 'About', 'App version, build number, credits, licenses link'],
  ['profile/delete-account.tsx', 'DeleteAccountScreen', 'E12', 'Delete Account flow', 'Multi-step: confirm, list, type DELETE, final'],
  // Modals F2-F5, F9
  ['modals/rank-up.tsx', 'RankUpModalScreen', 'F2', 'Rank-up modal', 'Animated badge reveal, rank name, unlocks list, Continue'],
  ['modals/milestone.tsx', 'MilestoneModalScreen', 'F3', 'Streak milestone modal', 'Flame animation, milestone count, XP bonus, Continue'],
  ['modals/nudge.tsx', 'NudgeScreen', 'F4', 'AI nudge banner', 'Top banner, dismissable, tap goes to relevant screen'],
  ['modals/lockout-blocked.tsx', 'LockoutBlockedScreen', 'F5', 'Lockout blocked overlay', 'Which app, gym-not-logged message, grace/emergency'],
  ['modals/confirm.tsx', 'ConfirmScreen', 'F9', 'Confirmation sheet', 'Bold action text, cancel, destructive confirm'],
];

const tpl = (comp, id, name, todo) => `// ${id} · ${name}
// TODO: ${todo}
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { color, type, space } from '@/lib/design/tokens';

export default function ${comp}() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.white }}>
      <View style={{ flex: 1, padding: space.lg }}>
        <Text style={{ ...type.title1, color: color.black }}>
          ${id} · ${name}
        </Text>
      </View>
    </SafeAreaView>
  );
}
`;

let n = 0;
for (const [rel, comp, id, name, todo] of screens) {
  const full = join(APP, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, tpl(comp, id, name, todo));
  n++;
}
console.log(`Wrote ${n} screen placeholders.`);
