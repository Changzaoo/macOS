import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { WindowState, CustomApp } from '../types/window';
import { apps, internalApps } from '../config/apps';

type DesktopContextType = {
  windows: WindowState[];
  customApps: CustomApp[];
  openApp: (appId: string) => void;
  openUrl: (url: string, name?: string, icon?: string) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  toggleFullscreen: (id: string) => void;
  focusWindow: (id: string) => void;
  updateWindowPosition: (id: string, x: number, y: number) => void;
  updateWindowSize: (id: string, width: number, height: number) => void;
  updateWindowCurrentUrl: (id: string, url: string) => void;
  restoreWindow: (id: string) => void;
  addCustomApp: (app: Omit<CustomApp, 'id' | 'createdAt'>) => void;
  removeCustomApp: (id: string) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
};

const DesktopContext = createContext<DesktopContextType>({} as DesktopContextType);

let zCounter = 100;

const loadCustomApps = (): CustomApp[] => {
  try {
    const raw = localStorage.getItem('macos-custom-apps');
    return raw ? (JSON.parse(raw) as CustomApp[]) : [];
  } catch {
    return [];
  }
};

const centerOffset = (count: number) => ({ x: 100 + count * 28, y: 56 + count * 28 });

export const DesktopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [customApps, setCustomApps] = useState<CustomApp[]>(loadCustomApps);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  useEffect(() => {
    try { localStorage.setItem('macos-custom-apps', JSON.stringify(customApps)); } catch { /* noop */ }
  }, [customApps]);

  const openApp = useCallback((appId: string) => {
    const existing = windows.find((w) => w.appId === appId);
    if (existing) {
      setWindows((prev) =>
        prev.map((w) =>
          w.id === existing.id ? { ...w, isMinimized: false, zIndex: ++zCounter } : w
        )
      );
      return;
    }

    const internalApp = internalApps.find((a) => a.id === appId);
    if (internalApp) {
      const pos = centerOffset(windows.length);
      setWindows((prev) => [
        ...prev,
        {
          id: `${appId}-${Date.now()}`,
          appId,
          title: internalApp.name,
          url: '',
          currentUrl: '',
          icon: internalApp.icon,
          ...pos,
          width: internalApp.defaultSize.width,
          height: internalApp.defaultSize.height,
          isMinimized: false,
          isMaximized: false,
          isFullscreen: false,
          zIndex: ++zCounter,
          isLoading: false,
          isInternal: true,
        },
      ]);
      return;
    }

    const customApp = customApps.find((a) => a.id === appId);
    if (customApp) {
      const pos = centerOffset(windows.length);
      setWindows((prev) => [
        ...prev,
        {
          id: `${appId}-${Date.now()}`,
          appId,
          title: customApp.name,
          url: customApp.url,
          currentUrl: customApp.url,
          icon: customApp.icon,
          ...pos,
          width: 1200,
          height: 760,
          isMinimized: false,
          isMaximized: false,
          isFullscreen: false,
          zIndex: ++zCounter,
          isLoading: true,
        },
      ]);
      return;
    }

    const appConfig = apps.find((a) => a.id === appId);
    if (!appConfig) return;

    const pos = centerOffset(windows.length);
    setWindows((prev) => [
      ...prev,
      {
        id: `${appId}-${Date.now()}`,
        appId,
        title: appConfig.name,
        url: appConfig.url,
        currentUrl: appConfig.url,
        icon: appConfig.icon,
        ...pos,
        width: appConfig.defaultSize.width,
        height: appConfig.defaultSize.height,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        zIndex: ++zCounter,
        isLoading: true,
      },
    ]);
  }, [windows, customApps]);

  const openUrl = useCallback((url: string, name = 'Web', icon = 'Globe') => {
    const pos = centerOffset(windows.length);
    setWindows((prev) => [
      ...prev,
      {
        id: `url-${Date.now()}`,
        appId: `url-${Date.now()}`,
        title: name,
        url,
        currentUrl: url,
        icon,
        ...pos,
        width: 1200,
        height: 760,
        isMinimized: false,
        isMaximized: false,
        isFullscreen: false,
        zIndex: ++zCounter,
        isLoading: true,
      },
    ]);
  }, [windows]);

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
  }, []);

  const maximizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized, isMinimized: false } : w))
    );
  }, []);

  const toggleFullscreen = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isFullscreen: !w.isFullscreen, isMinimized: false } : w))
    );
  }, []);

  const focusWindow = useCallback((id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, zIndex: ++zCounter } : w)));
  }, []);

  const updateWindowPosition = useCallback((id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  }, []);

  const updateWindowSize = useCallback((id: string, width: number, height: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, width, height } : w)));
  }, []);

  const updateWindowCurrentUrl = useCallback((id: string, url: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, currentUrl: url } : w)));
  }, []);

  const restoreWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: false, zIndex: ++zCounter } : w))
    );
  }, []);

  const addCustomApp = useCallback((data: Omit<CustomApp, 'id' | 'createdAt'>) => {
    setCustomApps((prev) => [
      ...prev,
      { ...data, id: `custom-${Date.now()}`, createdAt: new Date().toISOString() },
    ]);
  }, []);

  const removeCustomApp = useCallback((id: string) => {
    setCustomApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <DesktopContext.Provider
      value={{
        windows,
        customApps,
        openApp,
        openUrl,
        closeWindow,
        minimizeWindow,
        maximizeWindow,
        toggleFullscreen,
        focusWindow,
        updateWindowPosition,
        updateWindowSize,
        updateWindowCurrentUrl,
        restoreWindow,
        addCustomApp,
        removeCustomApp,
        animationsEnabled,
        setAnimationsEnabled,
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
};

export const useDesktop = () => useContext(DesktopContext);
