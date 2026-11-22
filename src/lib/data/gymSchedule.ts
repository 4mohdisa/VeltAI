// Gym-schedule data hooks — the seam between the schedule/template/patterns
// screens and the backend. Every hook tries the API on mount and degrades to an
// empty/null state on any failure (no throws), so the screens render their
// empty/loading states with or without a backend. Mutations (createTemplate,
// setScheduleDay, completeSession, …) are called directly via `api.gym.*` from
// the screens, wrapped in try/catch there.
import { useCallback, useEffect, useRef, useState } from 'react';

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
 *  asynchronously (in .finally), so there's no synchronous setState-in-effect.
 *  isError says whether the last read failed, so a caller can tell the
 *  fallback apart from a real empty result. */
export function useApi<T>(fetcher: () => Promise<T>, fallback: T, deps: readonly unknown[] = []): {
  data: T;
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  revalidate: () => void;
} {
  const [data, setData] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [nonce, setNonce] = useState(0);

  // revalidate (below) reads through these instead of closing over fetcher/
  // fallback directly, so its own identity can stay empty-deps and stable —
  // see its comment.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  useEffect(() => {
    let active = true;
    fetcher()
      .then((d) => {
        if (!active) return;
        setData(d);
        setIsError(false);
      })
      .catch(() => {
        if (!active) return;
        setData(fallback);
        setIsError(true);
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

  // Same read as refetch, without the loading flash — for a background
  // revalidate (e.g. a screen regaining focus) where blanking the card to a
  // skeleton would be a visible regression, not a refresh. Reads fetcher/
  // fallback through the refs above rather than closing over them, so this
  // callback's own identity stays stable — a caller listing it in a
  // useFocusEffect/useCallback deps array won't have that effect re-fire on
  // every re-render revalidate's own resolution causes.
  const revalidate = useCallback(() => {
    fetcherRef
      .current()
      .then((d) => {
        setData(d);
        setIsError(false);
      })
      .catch(() => {
        setData(fallbackRef.current);
        setIsError(true);
      });
  }, []);

  return { data, loading, isError, refetch, revalidate };
}

export function useToday(): {
  today: TodayWorkout | null;
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  revalidate: () => void;
} {
  const { data, loading, isError, refetch, revalidate } = useApi<TodayWorkout | null>(() => api.gym.getToday(), null);
  return { today: data, loading, isError, refetch, revalidate };
}

export function useSchedule(): {
  schedule: WeeklySchedule;
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  revalidate: () => void;
} {
  const { data, loading, isError, refetch, revalidate } = useApi<WeeklySchedule>(() => api.gym.getSchedule(), []);
  return { schedule: data, loading, isError, refetch, revalidate };
}

export function useTemplates(): {
  templates: WorkoutTemplate[];
  loading: boolean;
  isError: boolean;
  refetch: () => void;
  revalidate: () => void;
} {
  const { data, loading, isError, refetch, revalidate } = useApi<WorkoutTemplate[]>(() => api.gym.getTemplates(), []);
  return { templates: data, loading, isError, refetch, revalidate };
}

export function useExercises(filters?: ExerciseFilters): {
  exercises: ExerciseLibraryItem[];
  loading: boolean;
  isError: boolean;
} {
  // Serialize the filter object into the dependency list so the fetch re-runs
  // when the caller changes category/search.
  const key = JSON.stringify(filters ?? {});
  const { data, loading, isError } = useApi<ExerciseLibraryItem[]>(() => api.gym.getExercises(filters), [], [key]);
  return { exercises: data, loading, isError };
}

export function useGymPatterns(): { patterns: GymPatterns | null; loading: boolean; isError: boolean } {
  const { data, loading, isError } = useApi<GymPatterns | null>(() => api.gym.getGymPatterns(), null);
  return { patterns: data, loading, isError };
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
