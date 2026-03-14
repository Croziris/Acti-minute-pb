import { useCallback } from 'react';

// TODO: remplacer par PocketBase

export interface HabitCheck {
  id: string;
  habit_id: string;
  client_id: string;
  date: string;
  checked: boolean;
}

export interface Habit {
  id: string;
  key?: string;
  titre: string;
  description?: string;
  owner: 'coach' | 'client';
  default_active: boolean;
  assignment?: {
    id: string;
    active: boolean;
  };
  checks: HabitCheck[];
}

export const useHabits = () => {
  const habits: Habit[] = [];
  const toggleHabitCheck = useCallback(async (_habitId: string, _date: string) => {
    return;
  }, []);

  return {
    data: habits,
    habits,
    loading: false,
    error: null as string | null,
    toggleHabitCheck,
  };
};
