import { useCallback } from 'react';

// TODO: remplacer par PocketBase

export interface ClientWithProgram {
  id: string;
  handle: string;
  avatar_url?: string;
  program?: {
    id: string;
    titre: string;
    statut: string;
    objectif?: string;
  };
}

export const useCoachClients = () => {
  const clients: ClientWithProgram[] = [];
  const refetch = useCallback(() => undefined, []);

  return {
    data: clients,
    clients,
    loading: false,
    error: null as string | null,
    refetch,
  };
};
