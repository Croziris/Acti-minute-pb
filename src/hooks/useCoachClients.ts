import { useState, useEffect, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';

export interface ClientWithProgram {
  id: string;
  name: string;
  avatar?: string;
  program?: {
    id: string;
    titre: string;
    statut: string;
    objectif?: string;
  };
}

export const useCoachClients = () => {
  const [clients, setClients] = useState<ClientWithProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const coachId = pb.authStore.record?.id;
      if (!coachId) return;

      const programs = await pb.collection('programs').getFullList({
        filter: `coach = "${coachId}"`,
        expand: 'client',
        sort: '-created',
      });

      const enrichedClients: ClientWithProgram[] = programs.map((p: any) => {
        const clientRecord = p.expand?.client;
        return {
          id: clientRecord?.id || p.client,
          name: clientRecord?.name || 'Sportif·ve',
          avatar: clientRecord?.avatar,
          program: {
            id: p.id,
            titre: p.titre,
            statut: p.statut,
            objectif: p.objectif,
          },
        };
      });

      setClients(enrichedClients);
    } catch (err) {
      console.error('Error fetching coach clients:', err);
      setError('Impossible de charger les clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
  };
};
