import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { WindowState, CustomApp } from '../types/window';
import type { VercelDockApp, VercelSyncState } from '../types/vercel';
import { apps, internalApps } from '../config/apps';
import { fetchVercelDockApps } from '../services/vercelAppsService';

type DesktopContextType = {
  windows: WindowState[];
  customApps: CustomApp[];
  vercelApps: VercelDockApp[];
  vercelSync: VercelSyncState;
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
  closeActiveWindow: () => void;
  minimizeActiveWindow: () => void;
  minimizeAllWindows: () => void;
  closeAllWindows: () => void;
  arrangeWindows: () => void;
  refreshVercelApps: () => Promise<void>;
  addCustomApp: (app: Omit<CustomApp, 'id' | 'createdAt'>) => void;
  removeCustomApp: (id: string) => void;
  animationsEnabled: boolean;
  setAnimationsEnabled: (v: boolean) => void;
  widgetsVisible: boolean;
  setWidgetsVisible: (v: boolean) => void;
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

const loadVercelApps = (): VercelDockApp[] => {
  try {
    const raw = localStorage.getItem('macos-vercel-apps');
    return raw ? (JSON.parse(raw) as VercelDockApp[]) : [];
  } catch {
    return [];
  }
};

const loadWidgetsVisible = () => {
  try {
    return localStorage.getItem('macos-widgets-visible') !== 'false';
  } catch {
    return true;
  }
};

const centerOffset = (count: number) => ({ x: 100 + count * 28, y: 56 + count * 28 });

const topWindow = (windows: WindowState[]) =>
  windows
    .filter((window) => !window.isMinimized)
    .sort((a, b) => b.zIndex - a.zIndex)[0];

export const DesktopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [customApps, setCustomApps] = useState<CustomApp[]>(loadCustomApps);
  const [vercelApps, setVercelApps] = useState<VercelDockApp[]>(loadVercelApps);
  const [vercelSync, setVercelSync] = useState<VercelSyncState>({
    status: 'idle',
    configured: false,
  });
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [widgetsVisible, setWidgetsVisibleState] = useState(loadWidgetsVisible);

  useEffect(() => {
    try { localStorage.setItem('macos-custom-apps', JSON.stringify(customApps)); } catch { /* noop */ }
  }, [customApps]);

  useEffect(() => {
    try { localStorage.setItem('macos-widgets-visible', String(widgetsVisible)); } catch { /* noop */ }
  }, [widgetsVisible]);

  const setWidgetsVisible = useCallback((value: boolean) => {
    setWidgetsVisibleState(value);
  }, []);

  const refreshVercelApps = useCallback(async () => {
    setVercelSync((current) => ({ ...current, status: 'syncing', error: undefined }));
    try {
      const result = await fetchVercelDockApps();
      if (result.apps.length > 0) {
        setVercelApps(result.apps);
        try { localStorage.setItem('macos-vercel-apps', JSON.stringify(result.apps)); } catch { /* noop */ }
      }
      setVercelSync({
        status: result.error ? 'error' : 'ready',
        configured: result.configured,
        lastSyncedAt: result.syncedAt ?? new Date().toISOString(),
        error: result.error,
      });
    } catch (error) {
      setVercelSync((current) => ({
        ...current,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Vercel sync unavailable.',
      }));
    }
  }, []);

  useEffect(() => {
    const initialSync = setTimeout(() => { void refreshVercelApps(); }, 0);
    const interval = setInterval(() => { void refreshVercelApps(); }, 60_000);
    return () => {
      clearTimeout(initialSync);
      clearInterval(interval);
    };
  }, [refreshVercelApps]);

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
          url: customApp.canonicalUrl || customApp.url,
          currentUrl: customApp.canonicalUrl || customApp.url,
          icon: customApp.icon,
          logoUrl: customApp.logoUrl,
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

    const vercelApp = vercelApps.find((a) => a.id === appId);
    if (vercelApp) {
      const pos = centerOffset(windows.length);
      setWindows((prev) => [
        ...prev,
        {
          id: `${appId}-${Date.now()}`,
          appId,
          title: vercelApp.name,
          url: vercelApp.canonicalUrl || vercelApp.url,
          currentUrl: vercelApp.canonicalUrl || vercelApp.url,
          icon: vercelApp.icon,
          logoUrl: vercelApp.logoUrl,
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
  }, [windows, customApps, vercelApps]);

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

  const closeActiveWindow = useCallback(() => {
    const active = topWindow(windows);
    if (!active) return;
    setWindows((prev) => prev.filter((window) => window.id !== active.id));
  }, [windows]);

  const minimizeActiveWindow = useCallback(() => {
    const active = topWindow(windows);
    if (!active) return;
    setWindows((prev) => prev.map((window) => (window.id === active.id ? { ...window, isMinimized: true } : window)));
  }, [windows]);

  const minimizeAllWindows = useCallback(() => {
    setWindows((prev) => prev.map((window) => ({ ...window, isMinimized: true })));
  }, []);

  const closeAllWindows = useCallback(() => {
    setWindows([]);
  }, []);

  const arrangeWindows = useCallback(() => {
    setWindows((prev) => {
      const visible = prev.filter((window) => !window.isMinimized);
      if (visible.length === 0) return prev;

      const columns = Math.min(3, Math.ceil(Math.sqrt(visible.length)));
      const rows = Math.ceil(visible.length / columns);
      const gap = 16;
      const top = 54;
      const left = 22;
      const usableWidth = Math.max(760, globalThis.innerWidth - left * 2);
      const usableHeight = Math.max(520, globalThis.innerHeight - 144);
      const width = Math.max(520, Math.floor((usableWidth - gap * (columns - 1)) / columns));
      const height = Math.max(380, Math.floor((usableHeight - gap * (rows - 1)) / rows));
      const visibleIds = new Map(visible.map((window, index) => [window.id, index]));

      return prev.map((window) => {
        const index = visibleIds.get(window.id);
        if (index === undefined) return window;
        return {
          ...window,
          x: left + (index % columns) * (width + gap),
          y: top + Math.floor(index / columns) * (height + gap),
          width,
          height,
          isMaximized: false,
          isFullscreen: false,
          zIndex: ++zCounter,
        };
      });
    });
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
        vercelApps,
        vercelSync,
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
        closeActiveWindow,
        minimizeActiveWindow,
        minimizeAllWindows,
        closeAllWindows,
        arrangeWindows,
        refreshVercelApps,
        addCustomApp,
        removeCustomApp,
        animationsEnabled,
        setAnimationsEnabled,
        widgetsVisible,
        setWidgetsVisible,
      }}
    >
      {children}
    </DesktopContext.Provider>
  );
};

export const useDesktop = () => useContext(DesktopContext);
