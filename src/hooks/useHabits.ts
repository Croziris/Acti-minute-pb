import { useCallback, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    if (!user?.id) {
      setHabits([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const assignments = await pb.collection('habit_assignments').getFullList({
        filter: `client = "${user.id}" && active = true`,
        expand: 'habit',
      });

      if (assignments.length === 0) {
        setHabits([]);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      const allChecks = await pb.collection('habit_checks').getFullList({
        filter: `client = "${user.id}" && date >= "${weekAgo}" && date <= "${today}"`,
      });

      const mappedHabits: Habit[] = assignments.map((assignment: any) => {
        const habitRecord = assignment.expand?.habit;
        const habitId = habitRecord?.id || assignment.habit;

        return {
          id: habitId,
          key: habitRecord?.key ?? undefined,
          titre: habitRecord?.titre || '',
          description: habitRecord?.description ?? undefined,
          owner: habitRecord?.owner === 'coach' ? 'coach' : 'client',
          default_active: Boolean(habitRecord?.default_active),
          assignment: { id: assignment.id, active: Boolean(assignment.active) },
          checks: allChecks
            .filter((check: any) => check.habit === habitId)
            .map((check: any) => ({
              id: check.id,
              habit_id: check.habit,
              client_id: check.client,
              date: check.date,
              checked: check.checked,
            })),
        };
      });

      setHabits(mappedHabits);
    } catch (fetchError: any) {
      setHabits([]);
      setError(
        fetchError?.response?.message || fetchError?.message || 'Impossible de charger les habitudes'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchHabits();
  }, [fetchHabits]);

  const toggleHabitCheck = useCallback(async (habitId: string, date: string) => {
    if (!user) return;

    setError(null);

    try {
      let existing: any = null;
      try {
        existing = await pb.collection('habit_checks').getFirstListItem(
          `client = "${user.id}" && habit = "${habitId}" && date = "${date}"`,
          { requestKey: null }
        );
      } catch (e: any) {
        if (e?.status !== 404) throw e;
        existing = null;
      }

      if (existing) {
        await pb.collection('habit_checks').update(existing.id, {
          checked: !existing.checked,
        });
      } else {
        await pb.collection('habit_checks').create({
          client: user.id,
          habit: habitId,
          date,
          checked: true,
        });
      }

      await fetchHabits();
    } catch (err: any) {
      console.error('toggleHabitCheck error:', err);
      setError(
        err?.response?.message || err?.message || 'Impossible de mettre a jour cette habitude'
      );
    }
  }, [user, fetchHabits]);

  return {
    data: habits,
    habits,
    loading,
    error,
    toggleHabitCheck,
    refetch: fetchHabits,
  };
};
