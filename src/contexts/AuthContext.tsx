import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../services/userService';
import { loginWithUsername, logoutUser, createFirstAccount } from '../services/authService';
import type { UserProfile } from '../types/user';

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

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  setUser: () => {},
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          try {
            if (firebaseUser) {
              const profile = await getUserProfile(firebaseUser.uid);
              setUser(profile && profile.active ? profile : null);
            } else {
              setUser(null);
            }
          } catch {
            setUser(null);
          }
          setLoading(false);
        },
        () => setLoading(false)
      );
    } catch {
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const profile = await loginWithUsername(username, password);
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    if (user) await logoutUser(user.uid);
    setUser(null);
  }, [user]);

  const register = useCallback(async (username: string, password: string, displayName: string) => {
    const profile = await createFirstAccount(username, password, displayName);
    setUser(profile);
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  return (
    <AuthContext.Provider value={{ user, userProfile: user, loading, setUser, login, logout, register, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
