import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ThemeMode, AppearanceState } from '../types/appearance';

type AppearanceContextType = AppearanceState & {
  setWallpaperId: (id: string) => void;
  setTheme: (theme: ThemeMode) => void;
  setBlurEnabled: (v: boolean) => void;
  setTransparencyEnabled: (v: boolean) => void;
};

const DEFAULTS: AppearanceState = {
  wallpaperId: 'tahoe',
  theme: 'dark',
  blurEnabled: true,
  transparencyEnabled: true,
};

const STORAGE_KEY = 'macos-appearance';

function load(): AppearanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function save(state: AppearanceState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* noop */ }
}

const AppearanceContext = createContext<AppearanceContextType>({} as AppearanceContextType);

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppearanceState>(load);

  useEffect(() => { save(state); }, [state]);

  const setWallpaperId = (wallpaperId: string) => setState((s) => ({ ...s, wallpaperId }));
  const setTheme = (theme: ThemeMode) => setState((s) => ({ ...s, theme }));
  const setBlurEnabled = (blurEnabled: boolean) => setState((s) => ({ ...s, blurEnabled }));
  const setTransparencyEnabled = (transparencyEnabled: boolean) => setState((s) => ({ ...s, transparencyEnabled }));

  return (
    <AppearanceContext.Provider value={{ ...state, setWallpaperId, setTheme, setBlurEnabled, setTransparencyEnabled }}>
      {children}
    </AppearanceContext.Provider>
  );
};

export const useAppearance = () => useContext(AppearanceContext);
