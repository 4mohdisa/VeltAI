// Package ai is Lume's intelligence layer: deterministic pattern computation
// over the user's logged data, with an LLM only narrating prepared numbers.
package ai

import (
	"math"
	"sort"
	"strconv"
	"strings"
	"time"

	"lume/backend/internal/config"
	"lume/backend/internal/cuisine"
)

// windowDays is the food-log fetch window; junk frequency and consistency
// are normalised against it.
const windowDays = 30.0

// Raw rows supplied by the Store.

type FoodLogRow struct {
	Date      time.Time
	MealType  string
	FoodName  string
	Calories  float64
	Protein   float64
	Carbs     float64
	Fat       float64
	Fibre     float64
	CreatedAt time.Time
}

type GymSessionRow struct {
	Date            time.Time
	DurationMinutes int
	CreatedAt       time.Time
}

type GoalRow struct {
	CalorieTarget *float64 `json:"calorie_target"`
	ProteinTarget *float64 `json:"protein_target"`
	CarbTarget    *float64 `json:"carb_target"`
	FatTarget     *float64 `json:"fat_target"`
	FibreTarget   *float64 `json:"fibre_target"`
	WeightGoal    *string  `json:"weight_goal"`
}

type StreakRow struct {
	CurrentStreak int  `json:"current_streak"`
	LongestStreak int  `json:"longest_streak"`
	FreezeUsed    bool `json:"freeze_used"`
}

type WeightRow struct {
	Date   time.Time
	Weight float64
}

// ScanCorrectionRow is a scan_corrections row narrowed to what accuracy
// scoring needs (last 90 days).
type ScanCorrectionRow struct {
	FoodNameOriginal    string
	WeightOriginalG     float64
	WeightCorrectedG    float64
	CorrectionMagnitude float64
	CreatedAt           time.Time
}

// Computed pattern types (persisted into ai_user_brain jsonb columns).

type Macros struct {
	Protein float64 `json:"protein"`
	Carbs   float64 `json:"carbs"`
	Fat     float64 `json:"fat"`
	Fibre   float64 `json:"fibre"`
}

type TopFood struct {
	Name         string  `json:"name"`
	Count        int     `json:"count"`
	CalorieShare float64 `json:"calorie_share"`
}

type MealTiming struct {
	WeekdayFirstLogHour float64 `json:"weekday_first_log_hour"`
	WeekendFirstLogHour float64 `json:"weekend_first_log_hour"`
	BreakfastSkipRate   float64 `json:"breakfast_skip_rate"` // first log after 12:00
	ExpectedDinnerHour  float64 `json:"expected_dinner_hour,omitempty"`
}

type JunkFood struct {
	Count    int      `json:"count"`
	PerWeek  float64  `json:"per_week"`
	Keywords []string `json:"keywords,omitempty"`
}

type GoalCheck struct {
	HasCalorieTarget      bool    `json:"has_calorie_target"`
	HasProteinTarget      bool    `json:"has_protein_target"`
	CalorieWithinBandRate float64 `json:"calorie_within_band_rate"` // days within ±10% of target
	ProteinHitRate        float64 `json:"protein_hit_rate"`
	ProteinAvgOnMissDays  float64 `json:"protein_avg_on_miss_days"`
	GymDayCalories        float64 `json:"gym_day_calories"`
	RestDayCalories       float64 `json:"rest_day_calories"`
	WeightTrend           string  `json:"weight_trend"` // up | down | stable | unknown
	WeightChange          float64 `json:"weight_change"`
	TrendMatchesGoal      *bool   `json:"trend_matches_goal"` // nil when trend or goal unknown
}

type EatingPatterns struct {
	DaysLogged       int       `json:"days_logged"`
	TopFoods         []TopFood `json:"top_foods"`
	ConsistencyScore float64   `json:"consistency_score"`
	GoalCheck        GoalCheck `json:"goal_check"`
	CarbSource       string    `json:"carb_source,omitempty"`
	FatSource        string    `json:"fat_source,omitempty"`
}

type GymPatterns struct {
	SessionsPerWeek    float64  `json:"sessions_per_week"`
	PreferredWeekdays  []string `json:"preferred_weekdays"`
	AvgDurationMinutes float64  `json:"avg_duration_minutes"`
	CurrentStreak      int      `json:"current_streak"`
	LongestStreak      int      `json:"longest_streak"`
	FreezeUsed         bool     `json:"freeze_used"`
}

// ScanAccuracyProfile summarises how a user's portion-size scans have needed
// correcting over the last 90 days, computed by BuildScanAccuracyProfile.
type ScanAccuracyProfile struct {
	OverallAccuracyPct      float64  `json:"overall_accuracy_pct"`
	MostUnderestimatedFoods []string `json:"most_underestimated_foods"`
	MostOverestimatedFoods  []string `json:"most_overestimated_foods"`
	AvgCorrectionMagnitude  float64  `json:"avg_correction_magnitude"`
}

type Brain struct {
	EatingPatterns       EatingPatterns       `json:"eating_patterns"`
	GymPatterns          GymPatterns          `json:"gym_patterns"`
	TypicalDailyCalories float64              `json:"typical_daily_calories"`
	TypicalMacros        Macros               `json:"typical_macros"`
	MealTimingPatterns   MealTiming           `json:"meal_timing_patterns"`
	JunkFoodFrequency    JunkFood             `json:"junk_food_frequency"`
	GoalAdherenceScore   float64              `json:"goal_adherence_score"`
	LastRebuilt          time.Time            `json:"last_rebuilt"`
	ScanAccuracyProfile  *ScanAccuracyProfile `json:"scan_accuracy_profile,omitempty"`
}

func dayKey(t time.Time) string { return t.Format("2006-01-02") }

// DistinctDays counts distinct dates carrying food logs.
func DistinctDays(logs []FoodLogRow) int {
	days := map[string]bool{}
	for _, l := range logs {
		days[dayKey(l.Date)] = true
	}
	return len(days)
}

type dayTotal struct{ cal, protein, carbs, fat, fibre float64 }

func dailyTotals(logs []FoodLogRow) map[string]*dayTotal {
	out := map[string]*dayTotal{}
	for _, l := range logs {
		k := dayKey(l.Date)
		d := out[k]
		if d == nil {
			d = &dayTotal{}
			out[k] = d
		}
		d.cal += l.Calories
		d.protein += l.Protein
		d.carbs += l.Carbs
		d.fat += l.Fat
		d.fibre += l.Fibre
	}
	return out
}

// AvgDailyCalories averages daily calorie totals over days that have logs.
func AvgDailyCalories(logs []FoodLogRow) float64 {
	totals := dailyTotals(logs)
	if len(totals) == 0 {
		return 0
	}
	var sum float64
	for _, d := range totals {
		sum += d.cal
	}
	return sum / float64(len(totals))
}

// AvgDailyMacros averages daily macro totals over days that have logs.
func AvgDailyMacros(logs []FoodLogRow) Macros {
	totals := dailyTotals(logs)
	if len(totals) == 0 {
		return Macros{}
	}
	var m Macros
	for _, d := range totals {
		m.Protein += d.protein
		m.Carbs += d.carbs
		m.Fat += d.fat
		m.Fibre += d.fibre
	}
	n := float64(len(totals))
	return Macros{Protein: m.Protein / n, Carbs: m.Carbs / n, Fat: m.Fat / n, Fibre: m.Fibre / n}
}

// TopFoodsByCount returns the n most-logged foods (case-insensitive name)
// with each food's share of total logged calories.
func TopFoodsByCount(logs []FoodLogRow, n int) []TopFood {
	type agg struct {
		count int
		cal   float64
	}
	byName := map[string]*agg{}
	var total float64
	for _, l := range logs {
		name := strings.ToLower(strings.TrimSpace(l.FoodName))
		a := byName[name]
		if a == nil {
			a = &agg{}
			byName[name] = a
		}
		a.count++
		a.cal += l.Calories
		total += l.Calories
	}
	out := make([]TopFood, 0, len(byName))
	for name, a := range byName {
		share := 0.0
		if total > 0 {
			share = a.cal / total
		}
		out = append(out, TopFood{Name: name, Count: a.count, CalorieShare: share})
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Count != out[j].Count {
			return out[i].Count > out[j].Count
		}
		return out[i].Name < out[j].Name // deterministic tie-break
	})
	if len(out) > n {
		out = out[:n]
	}
	return out
}

// ComputeMealTiming finds the median first-log hour split weekday/weekend
// and the breakfast-skip rate (first log of the day lands at/after 12:00).
// Clock hours are read in the configured timezone (LUME_TIMEZONE), not the
// server's zone, so an 8am breakfast doesn't count as a midnight snack.
func ComputeMealTiming(logs []FoodLogRow) MealTiming {
	first := map[string]FoodLogRow{}
	for _, l := range logs {
		k := dayKey(l.Date)
		if f, ok := first[k]; !ok || l.CreatedAt.Before(f.CreatedAt) {
			first[k] = l
		}
	}
	loc := config.Timezone()
	var weekday, weekend []float64
	skipped := 0
	for _, l := range first {
		at := l.CreatedAt.In(loc)
		h := float64(at.Hour()) + float64(at.Minute())/60
		if wd := l.Date.Weekday(); wd == time.Saturday || wd == time.Sunday {
			weekend = append(weekend, h)
		} else {
			weekday = append(weekday, h)
		}
		if h >= 12 {
			skipped++
		}
	}
	mt := MealTiming{WeekdayFirstLogHour: median(weekday), WeekendFirstLogHour: median(weekend)}
	if len(first) > 0 {
		mt.BreakfastSkipRate = float64(skipped) / float64(len(first))
	}
	return mt
}

func median(xs []float64) float64 {
	if len(xs) == 0 {
		return 0
	}
	sort.Float64s(xs)
	m := len(xs) / 2
	if len(xs)%2 == 1 {
		return xs[m]
	}
	return (xs[m-1] + xs[m]) / 2
}

var junkKeywords = []string{
	"pizza", "burger", "fries", "soda", "cola", "chocolate", "candy", "cake",
	"chips", "crisps", "donut", "doughnut", "ice cream", "cookie", "biscuit",
	"kebab", "fried",
}

// IsJunkFood is a case-insensitive keyword-substring heuristic on food_name.
func IsJunkFood(name string) bool {
	n := strings.ToLower(name)
	for _, k := range junkKeywords {
		if strings.Contains(n, k) {
			return true
		}
	}
	return false
}

// ComputeJunkFood counts junk-food logs over the 30-day window, normalised
// to a per-week rate (count * 7 / 30).
func ComputeJunkFood(logs []FoodLogRow) JunkFood {
	count := 0
	for _, l := range logs {
		if IsJunkFood(l.FoodName) {
			count++
		}
	}
	return JunkFood{Count: count, PerWeek: float64(count) * 7 / windowDays}
}

// ConsistencyScore is the fraction of the last 30 days with at least two
// distinct non-empty meal_types logged.
func ConsistencyScore(logs []FoodLogRow) float64 {
	types := map[string]map[string]bool{}
	for _, l := range logs {
		mt := strings.ToLower(strings.TrimSpace(l.MealType))
		if mt == "" {
			continue
		}
		k := dayKey(l.Date)
		if types[k] == nil {
			types[k] = map[string]bool{}
		}
		types[k][mt] = true
	}
	days := 0
	for _, ts := range types {
		if len(ts) >= 2 {
			days++
		}
	}
	return float64(days) / windowDays
}

// SessionsPerWeek is the rolling 4-week session rate: count / 4.
func SessionsPerWeek(sessions []GymSessionRow) float64 {
	return float64(len(sessions)) / 4.0
}

// PreferredWeekdays returns the modal training weekday(s), Sunday-first order.
func PreferredWeekdays(sessions []GymSessionRow) []string {
	counts := map[time.Weekday]int{}
	best := 0
	for _, s := range sessions {
		counts[s.Date.Weekday()]++
		best = max(best, counts[s.Date.Weekday()])
	}
	var out []string
	for wd := time.Sunday; wd <= time.Saturday; wd++ {
		if best > 0 && counts[wd] == best {
			out = append(out, wd.String())
		}
	}
	return out
}

// AvgSessionDuration averages duration_minutes over sessions that have one.
// ponytail: null/zero durations are excluded so they don't drag the mean
func AvgSessionDuration(sessions []GymSessionRow) float64 {
	var sum, n float64
	for _, s := range sessions {
		if s.DurationMinutes > 0 {
			sum += float64(s.DurationMinutes)
			n++
		}
	}
	if n == 0 {
		return 0
	}
	return sum / n
}

// ComputeGoalCheck cross-references logged intake, gym days and weight trend
// against the user's targets.
func ComputeGoalCheck(logs []FoodLogRow, sessions []GymSessionRow, goal *GoalRow, weights []WeightRow) GoalCheck {
	gc := GoalCheck{WeightTrend: "unknown"}
	totals := dailyTotals(logs)
	days := float64(len(totals))

	if goal != nil && goal.CalorieTarget != nil && *goal.CalorieTarget > 0 && days > 0 {
		gc.HasCalorieTarget = true
		t := *goal.CalorieTarget
		hits := 0
		for _, d := range totals {
			if math.Abs(d.cal-t) <= 0.10*t {
				hits++
			}
		}
		gc.CalorieWithinBandRate = float64(hits) / days
	}
	if goal != nil && goal.ProteinTarget != nil && *goal.ProteinTarget > 0 && days > 0 {
		gc.HasProteinTarget = true
		t := *goal.ProteinTarget
		hits, misses, missSum := 0, 0, 0.0
		for _, d := range totals {
			if d.protein >= t {
				hits++
			} else {
				misses++
				missSum += d.protein
			}
		}
		gc.ProteinHitRate = float64(hits) / days
		if misses > 0 {
			gc.ProteinAvgOnMissDays = missSum / float64(misses)
		}
	}

	gymDays := map[string]bool{}
	for _, s := range sessions {
		gymDays[dayKey(s.Date)] = true
	}
	var gSum, rSum float64
	var gN, rN int
	for k, d := range totals {
		if gymDays[k] {
			gSum += d.cal
			gN++
		} else {
			rSum += d.cal
			rN++
		}
	}
	if gN > 0 {
		gc.GymDayCalories = gSum / float64(gN)
	}
	if rN > 0 {
		gc.RestDayCalories = rSum / float64(rN)
	}

	if len(weights) >= 2 {
		ws := append([]WeightRow(nil), weights...)
		sort.Slice(ws, func(i, j int) bool { return ws[i].Date.Before(ws[j].Date) })
		diff := ws[len(ws)-1].Weight - ws[0].Weight
		gc.WeightChange = diff
		switch {
		case math.Abs(diff) < 0.5: // ponytail: 0.5-unit noise floor for "stable"
			gc.WeightTrend = "stable"
		case diff > 0:
			gc.WeightTrend = "up"
		default:
			gc.WeightTrend = "down"
		}
		if goal != nil && goal.WeightGoal != nil {
			// weight_goal carries the app's vocabulary (lose, muscle,
			// consistency, eat-better, health, ...), not lose/gain/maintain.
			var match bool
			switch strings.ToLower(*goal.WeightGoal) {
			case "lose":
				match = gc.WeightTrend == "down"
			case "muscle", "gain":
				match = gc.WeightTrend == "up"
			default:
				// Non-directional goals mean "hold steady": within ±1kg
				// over the window counts as matching.
				match = math.Abs(diff) <= 1
			}
			gc.TrendMatchesGoal = &match
		}
	}
	return gc
}

// AdherenceScore is a 0-100 composite, rounded to 1 decimal. Weights:
//
//	40% calorie-within-±10%-band rate
//	30% protein-target hit rate
//	20% gym consistency vs a 3-sessions/week baseline, capped at 1.0
//	10% logging consistency (fraction of last 30 days with ≥2 meal types)
//
// Missing targets contribute 0 to their component.
func AdherenceScore(calRate, proteinRate, sessionsPerWeek, consistency float64) float64 {
	gym := min(sessionsPerWeek/3.0, 1.0)
	return math.Round((0.4*calRate+0.3*proteinRate+0.2*gym+0.1*consistency)*1000) / 10
}

// BuildBrain runs every deterministic computation over the fetched rows.
func BuildBrain(logs []FoodLogRow, sessions []GymSessionRow, goal *GoalRow, streak *StreakRow, weights []WeightRow) Brain {
	consistency := ConsistencyScore(logs)
	spw := SessionsPerWeek(sessions)
	gc := ComputeGoalCheck(logs, sessions, goal, weights)
	gp := GymPatterns{
		SessionsPerWeek:    spw,
		PreferredWeekdays:  PreferredWeekdays(sessions),
		AvgDurationMinutes: AvgSessionDuration(sessions),
	}
	if streak != nil {
		gp.CurrentStreak = streak.CurrentStreak
		gp.LongestStreak = streak.LongestStreak
		gp.FreezeUsed = streak.FreezeUsed
	}
	return Brain{
		EatingPatterns: EatingPatterns{
			DaysLogged:       DistinctDays(logs),
			TopFoods:         TopFoodsByCount(logs, 5),
			ConsistencyScore: consistency,
			GoalCheck:        gc,
		},
		GymPatterns:          gp,
		TypicalDailyCalories: AvgDailyCalories(logs),
		TypicalMacros:        AvgDailyMacros(logs),
		MealTimingPatterns:   ComputeMealTiming(logs),
		JunkFoodFrequency:    ComputeJunkFood(logs),
		GoalAdherenceScore:   AdherenceScore(gc.CalorieWithinBandRate, gc.ProteinHitRate, spw, consistency),
	}
}

// --- Bayesian prior blending -------------------------------------------
//
// A brand-new user has no logged history, so the raw computed Brain is
// mostly zeroes. priorWeight decides how much a cuisine-derived "day one"
// brain (buildCuisinePriorBrain) should dominate the blend versus the
// user's own computed patterns, tapering to zero once there's two weeks of
// real data to trust.

// priorWeight is the blend weight given to the cuisine prior: 0.8 under a
// week of data, 0.5 under two weeks, 0.0 (prior ignored) from two weeks on.
func priorWeight(daysOfData int) float64 {
	switch {
	case daysOfData < 7:
		return 0.8
	case daysOfData < 14:
		return 0.5
	default:
		return 0.0
	}
}

// parseHourString parses an "HH:MM" 24h clock string into a fractional hour
// ("18:30" -> 18.5). Malformed input yields 0.
func parseHourString(s string) float64 {
	h, m, ok := strings.Cut(s, ":")
	if !ok {
		return 0
	}
	hh, err1 := strconv.Atoi(h)
	mm, err2 := strconv.Atoi(m)
	if err1 != nil || err2 != nil {
		return 0
	}
	return float64(hh) + float64(mm)/60
}

// buildCuisinePriorBrain synthesises a "day one" Brain from a cuisine prior
// and the user's goal targets — what we'd guess about someone before they've
// logged anything, besides their cuisine and their targets.
func buildCuisinePriorBrain(priors cuisine.CuisinePrior, goal *GoalRow) Brain {
	var b Brain
	if goal != nil {
		if goal.CalorieTarget != nil {
			b.TypicalDailyCalories = *goal.CalorieTarget
		}
		if goal.ProteinTarget != nil {
			b.TypicalMacros.Protein = *goal.ProteinTarget
		}
		if goal.CarbTarget != nil {
			b.TypicalMacros.Carbs = *goal.CarbTarget
		}
		if goal.FatTarget != nil {
			b.TypicalMacros.Fat = *goal.FatTarget
		}
		if goal.FibreTarget != nil {
			b.TypicalMacros.Fibre = *goal.FibreTarget
		}
	}
	b.MealTimingPatterns.ExpectedDinnerHour = parseHourString(priors.ExpectedDinnerTime)
	b.JunkFoodFrequency = JunkFood{Count: 0, PerWeek: 0, Keywords: priors.JunkFoodKeywords}
	b.EatingPatterns.CarbSource = priors.TypicalCarbSource
	b.EatingPatterns.FatSource = priors.TypicalFatSource
	return b
}

// applyBayesianPrior blends a cuisine/goal prior into the computed brain,
// tapering out as real data accumulates (see priorWeight). Only numeric
// signals with a meaningful prior counterpart are blended; adherence,
// timing-of-first-log, top foods, consistency and gym patterns are left
// exactly as computed. computed is never mutated.
func applyBayesianPrior(computed Brain, priors cuisine.CuisinePrior, goal *GoalRow, daysOfData int) Brain {
	weight := priorWeight(daysOfData)
	if weight == 0 {
		return computed
	}
	prior := buildCuisinePriorBrain(priors, goal)
	blend := func(p, c float64) float64 { return weight*p + (1-weight)*c }

	out := computed
	out.TypicalDailyCalories = blend(prior.TypicalDailyCalories, computed.TypicalDailyCalories)
	out.TypicalMacros.Protein = blend(prior.TypicalMacros.Protein, computed.TypicalMacros.Protein)
	out.TypicalMacros.Carbs = blend(prior.TypicalMacros.Carbs, computed.TypicalMacros.Carbs)
	out.TypicalMacros.Fat = blend(prior.TypicalMacros.Fat, computed.TypicalMacros.Fat)
	out.TypicalMacros.Fibre = blend(prior.TypicalMacros.Fibre, computed.TypicalMacros.Fibre)
	out.MealTimingPatterns.ExpectedDinnerHour = blend(prior.MealTimingPatterns.ExpectedDinnerHour, computed.MealTimingPatterns.ExpectedDinnerHour)
	out.JunkFoodFrequency.PerWeek = blend(prior.JunkFoodFrequency.PerWeek, computed.JunkFoodFrequency.PerWeek)

	if len(out.JunkFoodFrequency.Keywords) == 0 {
		out.JunkFoodFrequency.Keywords = prior.JunkFoodFrequency.Keywords
	}
	if out.EatingPatterns.CarbSource == "" {
		out.EatingPatterns.CarbSource = prior.EatingPatterns.CarbSource
	}
	if out.EatingPatterns.FatSource == "" {
		out.EatingPatterns.FatSource = prior.EatingPatterns.FatSource
	}
	return out
}

// --- Scan accuracy -------------------------------------------------------

func clamp(v, lo, hi float64) float64 {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

// BuildScanAccuracyProfile summarises scan-correction history into an
// accuracy score plus the foods the scanner most consistently mis-sizes.
// nil when there are no corrections to learn from.
func BuildScanAccuracyProfile(corrections []ScanCorrectionRow) *ScanAccuracyProfile {
	if len(corrections) == 0 {
		return nil
	}
	var magSum float64
	type ratioAgg struct {
		sum float64
		n   int
	}
	byFood := map[string]*ratioAgg{}
	for _, c := range corrections {
		magSum += c.CorrectionMagnitude
		name := strings.ToLower(strings.TrimSpace(c.FoodNameOriginal))
		if name == "" || c.WeightOriginalG <= 0 {
			continue
		}
		a := byFood[name]
		if a == nil {
			a = &ratioAgg{}
			byFood[name] = a
		}
		a.sum += (c.WeightCorrectedG - c.WeightOriginalG) / c.WeightOriginalG
		a.n++
	}
	avgMag := magSum / float64(len(corrections))

	type foodRatio struct {
		name  string
		ratio float64
	}
	ratios := make([]foodRatio, 0, len(byFood))
	for name, a := range byFood {
		ratios = append(ratios, foodRatio{name, a.sum / float64(a.n)})
	}
	// Sort by name first so the stable sorts below break ties deterministically.
	sort.Slice(ratios, func(i, j int) bool { return ratios[i].name < ratios[j].name })

	topN := func(desc bool, positive bool) []string {
		sorted := append([]foodRatio(nil), ratios...)
		sort.SliceStable(sorted, func(i, j int) bool {
			if desc {
				return sorted[i].ratio > sorted[j].ratio
			}
			return sorted[i].ratio < sorted[j].ratio
		})
		var out []string
		for _, r := range sorted {
			if (positive && r.ratio <= 0) || (!positive && r.ratio >= 0) {
				continue
			}
			out = append(out, r.name)
			if len(out) == 3 {
				break
			}
		}
		return out
	}

	return &ScanAccuracyProfile{
		OverallAccuracyPct:      clamp(100*(1-avgMag), 0, 100),
		MostUnderestimatedFoods: topN(true, true),
		MostOverestimatedFoods:  topN(false, false),
		AvgCorrectionMagnitude:  avgMag,
	}
}
