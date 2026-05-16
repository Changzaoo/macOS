import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile } from '../services/userService';
import type { UserProfile } from '../types/user';

type AuthContextType = {
  user: UserProfile | null;
  loading: boolean;
  setUser: (u: UserProfile | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
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
        (_error) => {
          setLoading(false);
        }
      );
    } catch {
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
