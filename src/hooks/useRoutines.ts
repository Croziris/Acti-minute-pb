import { useCallback } from 'react';

// TODO: remplacer par PocketBase

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
  const routines: Routine[] = [];

  const toggleRoutineCheck = useCallback(async (_routineId: string, _date: string) => {
    return;
  }, []);

  const refetch = useCallback(async () => {
    return;
  }, []);

  return {
    data: routines,
    routines,
    loading: false,
    error: null as string | null,
    toggleRoutineCheck,
    refetch,
  };
};
