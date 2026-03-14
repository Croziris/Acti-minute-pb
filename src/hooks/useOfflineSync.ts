import { useCallback } from 'react';

// TODO: remplacer par PocketBase

interface OfflineData {
  type: 'set_log' | 'exercise_feedback' | 'session_update';
  data: unknown;
  timestamp: number;
  id: string;
}

export const useOfflineSync = () => {
  const addOfflineData = useCallback((_type: OfflineData['type'], _data: unknown) => {
    return;
  }, []);

  const syncPendingData = useCallback(async () => {
    return;
  }, []);

  return {
    data: [] as OfflineData[],
    loading: false,
    error: null as string | null,
    isOnline: true,
    pendingSync: 0,
    isSyncing: false,
    addOfflineData,
    syncPendingData,
  };
};
