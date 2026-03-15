import { useCallback, useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';

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

const getISOWeek = (date: Date): number => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const isNotFoundError = (error: unknown): boolean => {
  const status = (error as { status?: number })?.status;
  const code = (error as { response?: { code?: number } })?.response?.code;
  return status === 404 || code === 404;
};

export const useWeeklyProgram = () => {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklySession[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user?.id) {
      setData([]);
      setWeekPlan(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const program = await pb.collection('programs').getFirstListItem(`client = "${user.id}"`);
      const currentISOWeek = getISOWeek(new Date());

      let weekPlanRecord: any = null;
      try {
        weekPlanRecord = await pb.collection('weekplans').getFirstListItem(
          `program = "${program.id}" && iso_week = ${currentISOWeek}`
        );
      } catch (e: any) {
        if (e?.status === 404) {
          try {
            const allPlans = await pb.collection('weekplans').getFullList({
              filter: `program = "${program.id}"`,
              sort: '-iso_week',
            });
            weekPlanRecord = allPlans[0] ?? null;
          } catch {
            weekPlanRecord = null;
          }
        } else {
          throw e;
        }
      }

      if (!weekPlanRecord) {
        try {
          const directSessions = await pb.collection('sessions').getFullList({
            filter: `client = "${user.id}"`,
            sort: 'index_num',
            expand: 'workout',
          });

          const mappedSessions: WeeklySession[] = directSessions.map((session: any) => ({
            id: session.id,
            index_num: typeof session.index_num === 'number' ? session.index_num : 0,
            statut: session.statut as WeeklySession['statut'],
            workout: session.expand?.workout
              ? {
                  id: session.expand.workout.id,
                  titre: session.expand.workout.titre,
                  duree_estimee: session.expand.workout.duree_estimee ?? undefined,
                }
              : undefined,
            date_demarree: session.date_demarree ?? undefined,
            date_terminee: session.date_terminee ?? undefined,
          }));

          setData(mappedSessions);
          setWeekPlan(null);
        } catch {
          setData([]);
          setWeekPlan(null);
        }

        setLoading(false);
        return;
      }

      const sessions = await pb.collection('sessions').getFullList({
        filter: `weekplan = "${weekPlanRecord.id}" && client = "${user.id}"`,
        sort: 'index_num',
        expand: 'workout',
      });

      const mappedSessions: WeeklySession[] = sessions.map((session: any) => ({
        id: session.id,
        index_num: typeof session.index_num === 'number' ? session.index_num : 0,
        statut: session.statut as WeeklySession['statut'],
        workout: session.expand?.workout
          ? {
              id: session.expand.workout.id,
              titre: session.expand.workout.titre,
              duree_estimee: session.expand.workout.duree_estimee ?? undefined,
            }
          : undefined,
        date_demarree: session.date_demarree ?? undefined,
        date_terminee: session.date_terminee ?? undefined,
      }));

      const mappedWeekPlan: WeekPlan = {
        id: weekPlanRecord.id,
        iso_week:
          typeof weekPlanRecord.iso_week === 'number' ? weekPlanRecord.iso_week : currentISOWeek,
        start_date:
          typeof weekPlanRecord.start_date === 'string' ? weekPlanRecord.start_date : '',
        end_date: typeof weekPlanRecord.end_date === 'string' ? weekPlanRecord.end_date : '',
        expected_sessions:
          typeof weekPlanRecord.expected_sessions === 'number'
            ? weekPlanRecord.expected_sessions
            : mappedSessions.length,
        sessions: mappedSessions,
      };

      setData(mappedSessions);
      setWeekPlan(mappedWeekPlan);
    } catch (fetchError: any) {
      if (isNotFoundError(fetchError)) {
        setData([]);
        setWeekPlan(null);
        setError(null);
        return;
      }

      setData([]);
      setWeekPlan(null);
      setError(
        fetchError?.response?.message ||
          fetchError?.message ||
          'Impossible de charger le programme hebdomadaire'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    weekPlan,
    loading,
    error,
    refetch,
  };
};
