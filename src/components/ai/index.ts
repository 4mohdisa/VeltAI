// AI-brain UI components. Self-contained cards (MorningBrief, BrainProfile
// call their hooks internally); the Food tab screen (app/(tabs)/food.tsx) makes
// the only useInsights call and passes anomalies, isError and onDismiss to
// AnomalyBanner; InsightCard/AnomalyCard take a row + onDismiss; TypingIndicator
// is a leaf.
export { MorningBriefCard } from './MorningBriefCard';
export { BrainProfileCard } from './BrainProfileCard';
export { InsightCard } from './InsightCard';
export { AnomalyCard } from './AnomalyCard';
export { AnomalyBanner } from './AnomalyBanner';
export { TypingIndicator } from './TypingIndicator';
