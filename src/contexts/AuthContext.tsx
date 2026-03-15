import React, { createContext, useContext, useEffect, useState } from 'react';
import type { RecordModel } from 'pocketbase';
import pb from '@/lib/pocketbase';

export type UserRole = 'coach' | 'sportif';

export interface AppUser {
  id: string;
  role: UserRole;
  email: string;
  name?: string;
  avatar?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapRecordToUser = (record: RecordModel | null): AppUser | null => {
  if (!record) {
    return null;
  }

  const role = record.role;
  if (role !== 'coach' && role !== 'sportif') {
    return null;
  }

  return {
    id: record.id,
    role,
    email: typeof record.email === 'string' ?record.email : '',
    name: typeof record.name === 'string' && record.name.length > 0 ?record.name : undefined,
    avatar: typeof record.avatar === 'string' && record.avatar.length > 0 ?record.avatar : undefined,
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(mapRecordToUser(pb.authStore.model as RecordModel | null));
    setIsLoading(false);

    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUser(mapRecordToUser(model as RecordModel | null));
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const authData = await pb.collection('users').authWithPassword(email, password);
      const authenticatedUser = mapRecordToUser(authData.record as RecordModel);

      if (!authenticatedUser) {
        pb.authStore.clear();
        setUser(null);
        return { error: 'Rôle utilisateur invalide.' };
      }

      setUser(authenticatedUser);
      return {};
    } catch {
      return { error: 'Erreur de connexion. Vérifiez votre email et votre mot de passe.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loading: isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
