import React, { createContext, useContext } from 'react';

// TODO: remplacer par PocketBase

export type UserRole = 'spotif.ve' | 'coach';

export interface AppUser {
  id: string;
  role: UserRole;
  handle?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  loading: boolean;
  login: (role: UserRole, username: string, accessKey: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const login = async (_role: UserRole, _username: string, _accessKey: string) => {
    return { error: 'Auth migration in progress: PocketBase is not connected yet.' };
  };

  const logout = async () => {
    return;
  };

  return (
    <AuthContext.Provider
      value={{
        user: null,
        isLoading: false,
        loading: false,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
