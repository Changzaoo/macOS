import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../types/user';
import { defaultPermissionsByRole } from '../types/user';

type AuthContextType = {
  user: UserProfile | null;
  userProfile: UserProfile | null;
  loading: boolean;
  setUser: (u: UserProfile | null) => void;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  isAdmin: boolean;
};

const mockUser: UserProfile = {
  uid: 'local',
  username: 'owner',
  displayName: 'Owner',
  email: 'owner@sistema.local',
  role: 'admin',
  active: true,
  theme: 'dark',
  accentColor: '#0A84FF',
  createdAt: new Date().toISOString(),
  passwordSet: true,
  permissions: defaultPermissionsByRole('admin'),
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  userProfile: mockUser,
  loading: false,
  setUser: () => {},
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  isAdmin: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{
    user: mockUser,
    userProfile: mockUser,
    loading: false,
    setUser: () => {},
    login: async () => {},
    logout: async () => {},
    register: async () => {},
    isAdmin: true,
  }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);
