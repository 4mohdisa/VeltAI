// Centralized navigation helper (Task 4). typedRoutes is enabled, so static
// literal routes passed to router.push are type-checked. The onboarding flow and
// the add-menu build their target paths dynamically (string), which typedRoutes
// can't infer — so this helper centralizes the one unavoidable string→Href cast
// in a single place instead of nine scattered `as never` casts at call sites.
import { router, type Href } from 'expo-router';

export function navigate(href: Href | string): void {
  router.push(href as Href);
}
