import { useMemo } from 'react';

// TODO: remplacer par PocketBase

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

export const useSessionData = (_sessionId?: string) => {
  const session = useMemo<Session | null>(() => null, []);

  return {
    data: [] as Session[],
    session,
    loading: false,
    error: null as string | null,
  };
};
