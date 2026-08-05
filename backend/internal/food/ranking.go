package food

import (
	"context"
	"sort"
	"strings"
	"sync"
	"time"

	"lume/backend/internal/cuisine"
)

// cuisinePrefsTTL bounds how stale a cached cuisine preference can be before
// a search re-fetches it — long enough that a burst of searches from one
// user does not hit user_cuisine_preferences every keystroke.
const cuisinePrefsTTL = 5 * time.Minute

type cuisinePrefsEntry struct {
	cuisines, dietary []string
	fetchedAt         time.Time
}

// cuisinePrefsCache is an in-process, per-userID cache. Zero value is ready
// to use (nil map lazily initialized, sync.Mutex zero value is usable).
type cuisinePrefsCache struct {
	mu      sync.Mutex
	entries map[string]cuisinePrefsEntry
}

// cuisinePrefs returns cached prefs when fresh, otherwise fetches and caches.
// Store errors are swallowed (empty prefs) — ranking should never break search.
func (h *handler) cuisinePrefs(ctx context.Context, userID string) (cuisines, dietary []string) {
	h.cuisineCache.mu.Lock()
	if e, ok := h.cuisineCache.entries[userID]; ok && time.Since(e.fetchedAt) < cuisinePrefsTTL {
		h.cuisineCache.mu.Unlock()
		return e.cuisines, e.dietary
	}
	h.cuisineCache.mu.Unlock()

	cuisines, dietary, err := h.store.UserCuisinePrefs(ctx, userID)
	if err != nil {
		return nil, nil
	}

	h.cuisineCache.mu.Lock()
	if h.cuisineCache.entries == nil {
		h.cuisineCache.entries = map[string]cuisinePrefsEntry{}
	}
	h.cuisineCache.entries[userID] = cuisinePrefsEntry{cuisines: cuisines, dietary: dietary, fetchedAt: time.Now()}
	h.cuisineCache.mu.Unlock()
	return cuisines, dietary
}

// Dietary-conflict keyword heuristic. SearchResult (from OFF/USDA) carries no
// dietary flags, so a name-substring match is the only signal available for
// non-library results — ponytail: not authoritative, a false negative/positive
// is possible on ambiguous names ("chicken of the sea" tuna brand, etc).
var (
	porkKeywords            = []string{"pork", "bacon", "ham", "lard", "prosciutto", "chorizo"}
	veganConflictWords      = []string{"beef", "chicken", "turkey", "lamb", "fish", "salmon", "tuna", "shrimp", "meat", "egg", "milk", "cheese", "butter", "honey", "yogurt", "gelatin"}
	vegetarianConflictWords = []string{"beef", "chicken", "turkey", "lamb", "pork", "fish", "salmon", "tuna", "shrimp", "meat", "bacon", "ham"}
	glutenKeywords          = []string{"wheat", "bread", "pasta", "flour", "barley", "rye", "noodle", "breaded", "cracker"}
)

func containsAny(name string, keywords []string) bool {
	for _, k := range keywords {
		if strings.Contains(name, k) {
			return true
		}
	}
	return false
}

// dietaryScore returns the dietary-conflict/match contribution for a single
// result name (already lowercased). Multiple conflicting requirements do not
// stack — the negative contribution is capped at -10 total; the gluten-free
// label match is a separate, additive +10.
func dietaryScore(name string, dietary []string) float64 {
	if len(dietary) == 0 {
		return 0
	}
	glutenFreeLabeled := strings.Contains(name, "gluten free") || strings.Contains(name, "gluten-free")
	conflict := false
	bonus := 0.0
	for _, d := range dietary {
		switch d {
		case "halal":
			if containsAny(name, porkKeywords) {
				conflict = true
			}
		case "vegan":
			if containsAny(name, porkKeywords) || containsAny(name, veganConflictWords) {
				conflict = true
			}
		case "vegetarian":
			if containsAny(name, porkKeywords) || containsAny(name, vegetarianConflictWords) {
				conflict = true
			}
		case "gluten_free":
			if glutenFreeLabeled {
				bonus = 10
			} else if containsAny(name, glutenKeywords) {
				conflict = true
			}
		}
	}
	score := bonus
	if conflict {
		score -= 10
	}
	return score
}

// rankByCuisine re-orders search results toward a user's cuisine/dietary
// preferences. Called even with empty cuisines/dietary (cuisineScore is then
// 0 for everything, so finalScore is a monotonic function of position alone
// — order is unchanged; simpler than special-casing the skip).
func rankByCuisine(results []SearchResult, cuisines, dietary []string, libraryNames map[string]bool) []SearchResult {
	n := len(results)
	if n == 0 {
		return results
	}
	patterns := cuisine.MergePriors(cuisines).CommonMealPatterns

	type scored struct {
		result SearchResult
		score  float64
	}
	out := make([]scored, n)
	for i, r := range results {
		name := strings.ToLower(r.FoodName)
		// Position-based relevance proxy: external APIs give no numeric
		// score, so source order stands in for relevance.
		originalRelevance := 1.0 - float64(i)/float64(n)

		cuisineScore := 0.0
		if libraryNames[name] {
			cuisineScore += 30
		}
		for _, p := range patterns {
			if strings.Contains(name, strings.ToLower(p)) {
				cuisineScore += 15
				break
			}
		}
		cuisineScore += dietaryScore(name, dietary)

		final := originalRelevance*0.6 + (cuisineScore/30.0)*0.4
		out[i] = scored{result: r, score: final}
	}

	sort.SliceStable(out, func(i, j int) bool { return out[i].score > out[j].score })

	ranked := make([]SearchResult, n)
	for i, s := range out {
		ranked[i] = s.result
	}
	return ranked
}
