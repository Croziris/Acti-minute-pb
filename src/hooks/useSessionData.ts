import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { useAuth } from '@/contexts/AuthContext';

export interface Session {
  id: string;
  client_id: string;
  week_plan_id?: string;
  workout_id?: string;
  index_num?: number;
  date_demarree?: string;
  date_terminee?: string;
  statut: 'planned' | 'ongoing' | 'done' | 'skipped';
  proof_media_url?: string;
  workout?: {
    id: string;
    titre: string;
    description?: string;
    duree_estimee?: number;
    workout_type?: string;
    session_type?: 'warmup' | 'main' | 'cooldown';
    circuit_rounds?: number;
    temps_repos_tours_seconds?: number;
    nombre_circuits?: number;
    circuit_configs?: Array<{ rounds: number; rest: number }>;
    workout_exercise: Array<{
      id: string;
      exercise_id: string;
      series?: number;
      reps?: number;
      temps_seconds?: number;
      charge_cible?: number;
      tempo?: string;
      couleur_elastique?: string;
      tips?: string;
      variations?: string;
      order_index?: number;
      circuit_number?: number;
      section?: string;
      rpe_cible?: number;
      temps_repos_seconds?: number;
      exercise: {
        id: string;
        libelle: string;
        description?: string;
        video_id?: string;
        youtube_url?: string;
        categories: string[];
        groupes: string[];
      };
    }>;
  };
  session_workout?: Array<{
    order_index: number;
    workout: {
      id: string;
      titre: string;
      description?: string;
      duree_estimee?: number;
      workout_type?: string;
      session_type?: 'warmup' | 'main' | 'cooldown';
      circuit_rounds?: number;
      temps_repos_tours_seconds?: number;
      nombre_circuits?: number;
      circuit_configs?: Array<{ rounds: number; rest: number }>;
      workout_exercise: Array<{
        id: string;
        exercise_id: string;
        series?: number;
        reps?: number;
        temps_seconds?: number;
        charge_cible?: number;
        tempo?: string;
        couleur_elastique?: string;
        tips?: string;
        variations?: string;
        order_index?: number;
        circuit_number?: number;
        section?: string;
        rpe_cible?: number;
        temps_repos_seconds?: number;
        exercise: {
          id: string;
          libelle: string;
          description?: string;
          video_id?: string;
          youtube_url?: string;
          categories: string[];
          groupes: string[];
        };
      }>;
    };
  }>;
}

export const useSessionData = (sessionId?: string) => {
  const { user } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!sessionId || !user?.id) {
      setSession(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const record = await pb.collection('sessions').getOne(sessionId, {
        expand: 'workout',
        requestKey: null,
      });

      let workoutData: Session['workout'] | undefined;
      const expandedWorkout = (record as any).expand?.workout;

      if (expandedWorkout) {
        const workoutExercises = await pb.collection('workout_exercises').getFullList({
          filter: `workout = "${expandedWorkout.id}"`,
          sort: 'order_index',
          expand: 'exercise',
          requestKey: null,
        });

        workoutData = {
          id: expandedWorkout.id,
          titre: expandedWorkout.titre ?? '',
          description: expandedWorkout.description ?? undefined,
          duree_estimee: expandedWorkout.duree_estimee ?? undefined,
          workout_type: expandedWorkout.workout_type ?? undefined,
          session_type: expandedWorkout.session_type ?? undefined,
          circuit_rounds: expandedWorkout.circuit_rounds ?? undefined,
          temps_repos_tours_seconds: expandedWorkout.temps_repos_tours_seconds ?? undefined,
          nombre_circuits:
            expandedWorkout.nombre_circuits ??
            (Array.isArray(expandedWorkout.circuit_configs)
              ? expandedWorkout.circuit_configs.length
              : undefined),
          circuit_configs: Array.isArray(expandedWorkout.circuit_configs)
            ? expandedWorkout.circuit_configs
            : undefined,
          workout_exercise: workoutExercises.map((we: any) => ({
            id: we.id,
            exercise_id: we.exercise,
            series: we.series ?? undefined,
            reps: we.reps ?? undefined,
            temps_seconds: we.temps_seconds ?? undefined,
            charge_cible: we.charge_cible ?? undefined,
            tempo: we.tempo ?? undefined,
            couleur_elastique: we.couleur_elastique ?? we.couleur ?? undefined,
            tips: we.tips ?? undefined,
            variations: we.variations ?? undefined,
            order_index: we.order_index ?? undefined,
            circuit_number: we.circuit_number ?? undefined,
            section: we.section ?? undefined,
            rpe_cible: we.rpe_cible ?? undefined,
            temps_repos_seconds: we.temps_repos_seconds ?? undefined,
            exercise: {
              id: we.expand?.exercise?.id ?? we.exercise,
              libelle: we.expand?.exercise?.libelle ?? '',
              description: we.expand?.exercise?.description ?? undefined,
              video_id: we.expand?.exercise?.video_id ?? undefined,
              youtube_url: we.expand?.exercise?.youtube_url ?? undefined,
              categories: Array.isArray(we.expand?.exercise?.categories)
                ? we.expand.exercise.categories
                : [],
              groupes: Array.isArray(we.expand?.exercise?.groupes)
                ? we.expand.exercise.groupes
                : [],
            },
          })),
        };
      }

      const mappedSession: Session = {
        id: record.id,
        client_id: (record as any).client,
        week_plan_id: (record as any).week_plan ?? undefined,
        workout_id: (record as any).workout ?? undefined,
        index_num: (record as any).index_num ?? undefined,
        statut: (record as any).statut,
        date_demarree: (record as any).date_demarree ?? undefined,
        date_terminee: (record as any).date_terminee ?? undefined,
        proof_media_url: (record as any).proof_media_url ?? undefined,
        workout: workoutData,
        session_workout: undefined,
      };

      console.log('✅ Session chargée:', mappedSession.id, mappedSession.statut);
      setSession(mappedSession);
    } catch (err: any) {
      if (err?.status === 404 || err?.status === 403) {
        setError("Cette séance n'existe pas ou vous n'y avez pas accès.");
      } else {
        setError(err?.message ?? 'Impossible de charger la séance');
      }
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId, user?.id]);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  return {
    session,
    data: session ? [session] : [],
    loading,
    error,
    refetch: fetchSession,
  };
};
