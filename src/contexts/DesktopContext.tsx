import React, { createContext, useContext, useState, useCallback } from 'react';
import type { WindowState } from '../types/window';
import { apps, internalApps } from '../config/apps';

type DesktopContextType = {
  windows: WindowState[];
  openApp: (appId: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  restoreWindow: (id: string) => void;
  wallpaper: string;
  setWallpaper: (w: string) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
};

const DesktopContext = createContext<DesktopContextType>({} as DesktopContextType);

let zCounter = 100;

export const DesktopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [wallpaper, setWallpaper] = useState('gradient-1');
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const openApp = useCallback((appId: string) => {
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      if (existing.isMinimized) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === existing.id ? { ...w, isMinimized: false, zIndex: ++zCounter } : w
          )
        );
      } else {
        setWindows((prev) =>
          prev.map((w) => (w.id === existing.id ? { ...w, zIndex: ++zCounter } : w))
        );
      }
      return;
    }

    // Check internal apps first
    const internalApp = internalApps.find((a) => a.id === appId);
    if (internalApp) {
      const offset = windows.length * 30;
      const newWin: WindowState = {
        id: `${appId}-${Date.now()}`,
        appId,
        title: internalApp.name,
        url: '',
        icon: internalApp.icon,
        x: 120 + offset,
        y: 60 + offset,
        width: internalApp.defaultSize.width,
        height: internalApp.defaultSize.height,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        zIndex: ++zCounter,
        isLoading: false,
        isInternal: true,
      };
      setWindows((prev) => [...prev, newWin]);
      return;
    }

    const appConfig = apps.find((a) => a.id === appId);
    if (!appConfig) return;

    const offset = windows.length * 30;
    const newWin: WindowState = {
      id: `${appId}-${Date.now()}`,
      appId,
      title: appConfig.name,
      url: appConfig.url,
      icon: appConfig.icon,
      x: 80 + offset,
      y: 50 + offset,
      width: appConfig.defaultSize.width,
      height: appConfig.defaultSize.height,
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      zIndex: ++zCounter,
      isLoading: true,
    };
    setWindows((prev) => [...prev, newWin]);
  }, [windows]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w))
    );
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w
      )
    );
  }, []);

  const toggleFullscreen = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isFullscreen: !w.isFullscreen, isMinimized: false } : w
      )
    );
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, zIndex: ++zCounter } : w))
    );
  }, []);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, isMinimized: false, zIndex: ++zCounter } : w
      )
    );
  }, []);

  return (
    <DesktopContext.Provider
      value={{
        windows,
        openApp,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        toggleFullscreen,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        restoreWindow,
        wallpaper,
        setWallpaper,
        animationsEnabled,
        setAnimationsEnabled,
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
};

export const useDesktop = () => useContext(DesktopContext);
