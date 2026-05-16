import React, { createContext, useContext } from 'react';
import type { UserProfile } from '../types/user';
import { defaultPermissionsByRole } from '../types/user';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  setUser: (u: UserProfile | null) => void;
};

const mockUser: UserProfile = {
  uid: 'local',
  username: 'owner',
  displayName: 'Owner',
  role: 'owner',
  active: true,
  theme: 'dark',
  accentColor: '#0A84FF',
  createdAt: new Date().toISOString(),
  permissions: defaultPermissionsByRole('owner'),
};

const AuthContext = createContext<AuthContextType>({
  user: mockUser,
  loading: false,
  setUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={{ user: mockUser, loading: false, setUser: () => {} }}>
    {children}
  </AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);
