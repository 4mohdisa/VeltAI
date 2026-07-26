// Gym-schedule data hooks — the seam between the schedule/template/patterns
// screens and the backend. Every hook tries the API on mount and degrades to an
// empty/null state on any failure (no throws), so the screens render their
// empty/loading states with or without a backend. Mutations (createTemplate,
// setScheduleDay, completeSession, …) are called directly via `api.gym.*` from
// the screens, wrapped in try/catch there.
import { useCallback, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import type {
  ExerciseFilters,
  ExerciseLibraryItem,
  ExerciseProgress,
  GymPatterns,
  TodayWorkout,
  WeeklySchedule,
  WorkoutTemplate,
} from '@/lib/types';

/** Generic mount-fetch with graceful fallback. `deps` re-runs the fetch; the
 *  returned refetch() re-runs it on demand. loading starts true and only clears
 *  asynchronously (in .finally), so there's no synchronous setState-in-effect. */
function useApi<T>(fetcher: () => Promise<T>, fallback: T, deps: readonly unknown[] = []): {
  data: T;
  loading: boolean;
  refetch: () => void;
} {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setData(fallback);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // fetcher/fallback are intentionally excluded — the caller's `deps` + nonce
    // control when the fetch re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const refetch = useCallback(() => {
    setLoading(true);
    setNonce((n) => n + 1);
  }, []);
  return { data, loading, refetch };
}

export function useToday(): { today: TodayWorkout | null; loading: boolean; refetch: () => void } {
  const { data, loading, refetch } = useApi<TodayWorkout | null>(() => api.gym.getToday(), null);
  return { today: data, loading, refetch };
}

export function useSchedule(): { schedule: WeeklySchedule; loading: boolean; refetch: () => void } {
  const { data, loading, refetch } = useApi<WeeklySchedule>(() => api.gym.getSchedule(), []);
  return { schedule: data, loading, refetch };
}

export function useTemplates(): { templates: WorkoutTemplate[]; loading: boolean; refetch: () => void } {
  const { data, loading, refetch } = useApi<WorkoutTemplate[]>(() => api.gym.getTemplates(), []);
  return { templates: data, loading, refetch };
}

export function useExercises(filters?: ExerciseFilters): {
  exercises: ExerciseLibraryItem[];
  loading: boolean;
} {
  // Serialize the filter object into the dependency list so the fetch re-runs
  // when the caller changes category/search.
  const key = JSON.stringify(filters ?? {});
  const { data, loading } = useApi<ExerciseLibraryItem[]>(() => api.gym.getExercises(filters), [], [key]);
  return { exercises: data, loading };
}

export function useGymPatterns(): { patterns: GymPatterns | null; loading: boolean } {
  const { data, loading } = useApi<GymPatterns | null>(() => api.gym.getGymPatterns(), null);
  return { patterns: data, loading };
}

export function useExerciseProgress(name: string, limit?: number): {
  progress: ExerciseProgress | null;
  loading: boolean;
} {
  const { data, loading } = useApi<ExerciseProgress | null>(
    () => (name ? api.gym.getExerciseProgress(name, limit) : Promise.resolve(null)),
    null,
    [name, limit],
  );
  return { progress: data, loading };
}
