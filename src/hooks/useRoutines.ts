import { useCallback, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';

export interface RoutineExercise {
  id: string;
  exercise_id: string;
  order_index: number;
  repetitions: number | null;
  exercise: {
    id: string;
    libelle: string;
    description: string | null;
    video_id: string | null;
    video_provider: string;
    youtube_url: string | null;
  };
}

export interface Routine {
  id: string;
  title: string;
  description: string | null;
  type: 'exercises' | 'video';
  video_url: string | null;
  tips: string[];
  exercises?: RoutineExercise[];
  tracking?: {
    date: string;
    completed: boolean;
  }[];
}

export const useRoutines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const normalizeDate = (value: string): string => value.split('T')[0].split(' ')[0];

  const fetchRoutines = useCallback(async () => {
    if (!user?.id) {
      setRoutines([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignedRoutines = await pb.collection('client_routines').getFullList({
        filter: `client = "${user.id}" && active = true`,
        expand: 'routine',
        requestKey: null,
      });

      if (assignedRoutines.length === 0) {
        setRoutines([]);
        return;
      }

      const routineIds = assignedRoutines
        .map((assignment: any) => assignment.expand?.routine?.id || assignment.routine)
        .filter(Boolean) as string[];

      const [trackingData, exercisesByRoutine] = await Promise.all([
        pb.collection('routine_tracking').getFullList({
          filter: `client = "${user.id}"`,
          sort: '-date',
          requestKey: null,
        }),
        Promise.all(
          routineIds.map(async (routineId) => {
            const routineExercises = await pb.collection('routine_exercises').getFullList({
              filter: `routine = "${routineId}"`,
              sort: 'order_index',
              expand: 'exercise',
              requestKey: `routine_exercises_${routineId}`,
            });
            return [routineId, routineExercises] as const;
          })
        ),
      ]);

      const exercisesMap = new Map<string, any[]>(exercisesByRoutine);

      const mappedRoutines: Routine[] = assignedRoutines.map((cr: any) => {
        const routineRecord = cr.expand?.routine;
        const routineId = routineRecord?.id || cr.routine;
        const exercises = exercisesMap.get(routineId) || [];

        return {
          id: routineId,
          title: routineRecord?.title || '',
          description: routineRecord?.description ?? null,
          type: (routineRecord?.type || 'exercises') as Routine['type'],
          video_url: routineRecord?.video_url ?? null,
          tips: Array.isArray(routineRecord?.tips) ? routineRecord.tips : [],
          exercises: exercises.map((re: any) => ({
            id: re.id,
            exercise_id: re.exercise,
            order_index: re.order_index,
            repetitions: re.repetitions ?? null,
            exercise: {
              id: re.expand?.exercise?.id || '',
              libelle: re.expand?.exercise?.libelle || '',
              description: re.expand?.exercise?.description ?? null,
              video_id: re.expand?.exercise?.video_id ?? null,
              video_provider: re.expand?.exercise?.video_provider ?? 'youtube',
              youtube_url: re.expand?.exercise?.youtube_url ?? null,
            },
          })),
          tracking: trackingData
            .filter((tracking: any) => tracking.routine === routineId)
            .map((tracking: any) => ({
              date: typeof tracking.date === 'string' ? normalizeDate(tracking.date) : '',
              completed: Boolean(tracking.completed),
            })),
        };
      });

      setRoutines(mappedRoutines);
    } catch (fetchError: any) {
      setRoutines([]);
      setError(
        fetchError?.response?.message || fetchError?.message || 'Impossible de charger les routines'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchRoutines();
  }, [fetchRoutines]);

  const toggleRoutineCheck = useCallback(async (routineId: string, date: string) => {
    if (!user) return;

    setError(null);

    try {
      const allForRoutine = await pb.collection('routine_tracking').getFullList({
        filter: `client = "${user.id}" && routine = "${routineId}"`,
        requestKey: null,
      });

      const existing =
        allForRoutine.find(
          (tracking: any) => normalizeDate(tracking?.date ?? '') === normalizeDate(date)
        ) ?? null;

      if (existing) {
        await pb.collection('routine_tracking').update(
          existing.id,
          {
            completed: !existing.completed,
          },
          { requestKey: null }
        );
      } else {
        await pb.collection('routine_tracking').create(
          {
            client: user.id,
            routine: routineId,
            date,
            completed: true,
          },
          { requestKey: null }
        );
      }

      await fetchRoutines();
    } catch (err: any) {
      console.error('toggleRoutineCheck error:', err);
      setError(
        err?.response?.message || err?.message || 'Impossible de mettre a jour cette routine'
      );
    }
  }, [user, fetchRoutines]);

  return {
    data: routines,
    routines,
    loading,
    error,
    toggleRoutineCheck,
    refetch: fetchRoutines,
  };
};
