import { useCallback } from 'react';

// TODO: remplacer par PocketBase

export interface WeeklySession {
  id: string;
  index_num: number;
  statut: 'planned' | 'ongoing' | 'done' | 'skipped';
  workout?: {
    id: string;
    titre: string;
    duree_estimee?: number;
  };
  date_demarree?: string;
  date_terminee?: string;
}

export interface WeekPlan {
  id: string;
  iso_week: number;
  start_date: string;
  end_date: string;
  expected_sessions: number;
  sessions: WeeklySession[];
}

export const useWeeklyProgram = () => {
  const refetch = useCallback(() => undefined, []);

  return {
    data: [] as WeeklySession[],
    weekPlan: null as WeekPlan | null,
    loading: false,
    error: null as string | null,
    refetch,
  };
};
