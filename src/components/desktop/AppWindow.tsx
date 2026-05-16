import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, RefreshCw } from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDesktop } from '../../contexts/DesktopContext';
import type { WindowState } from '../../types/window';
import { AdminPanel } from '../admin/AdminPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

type AppWindowProps = {
  window: WindowState;
};

export const AppWindow: React.FC<AppWindowProps> = ({ window: win }) => {
  const {
    closeWindow,
    minimizeWindow,
    maximizeWindow,
    toggleFullscreen,
    focusWindow,
    updateWindowPosition,
    updateWindowSize,
  } = useDesktop();

  const [iframeBlocked, setIframeBlocked] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const dragRef = useRef<{ startX: number; startY: number; winX: number; winY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[win.icon] ?? Icons.AppWindow;

  const getWindowStyle = (): React.CSSProperties => {
    if (win.isFullscreen) {
      return { position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: win.zIndex };
    }
    if (win.isMaximized) {
      return {
        position: 'fixed',
        left: 0,
        top: 36,
        width: '100vw',
        height: 'calc(100vh - 36px - 72px)',
        zIndex: win.zIndex,
      };
    }
    return {
      position: 'fixed',
      left: win.x,
      top: win.y,
      width: win.width,
      height: win.height,
      zIndex: win.zIndex,
    };
  };

  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      if (win.isMaximized || win.isFullscreen) return;
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startY: e.clientY, winX: win.x, winY: win.y };
      focusWindow(win.id);

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        updateWindowPosition(win.id, dragRef.current.winX + dx, dragRef.current.winY + dy);
      };

      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [win, focusWindow, updateWindowPosition]
  );

  const startResize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startW: win.width,
        startH: win.height,
      };

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const dw = ev.clientX - resizeRef.current.startX;
        const dh = ev.clientY - resizeRef.current.startY;
        updateWindowSize(
          win.id,
          Math.max(400, resizeRef.current.startW + dw),
          Math.max(300, resizeRef.current.startH + dh)
        );
      };

      const onUp = () => {
        resizeRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [win, updateWindowSize]
  );

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    try {
      const _href = iframeRef.current?.contentWindow?.location?.href;
      void _href;
    } catch {
      setIframeBlocked(true);
    }
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeBlocked(true);
    setIframeLoaded(true);
  }, []);

  if (win.isMinimized) return null;

  const renderContent = () => {
    if (win.isInternal) {
      if (win.appId === 'settings') return <SettingsPanel />;
      if (win.appId === 'admin') return <AdminPanel />;
      return null;
    }

    return (
      <>
        {!iframeLoaded && !iframeBlocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-blue-400" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-white/50 text-sm">Carregando {win.title}...</span>
            </div>
          </div>
        )}

        {iframeBlocked ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-8">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <ExternalLink size={24} className="text-orange-400" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Visualização não disponível</h3>
              <p className="text-white/50 text-sm mb-6">
                Este aplicativo não permite visualização embutida por configurações de segurança.
              </p>
              <button
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-sm font-medium transition-colors"
                onClick={() => globalThis.open(win.url, '_blank')}
              >
                Abrir aplicativo
              </button>
            </div>
          </div>
        ) : (
          <iframe
            key={refreshKey}
            ref={iframeRef}
            src={win.url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
          />
        )}
      </>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        key={win.id}
        initial={{ opacity: 0, scale: 0.85, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 30 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={getWindowStyle()}
        className="flex flex-col rounded-xl overflow-hidden window-shadow glass-dark"
        onClick={() => focusWindow(win.id)}
      >
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-3 h-10 bg-gray-900/80 backdrop-blur-sm border-b border-white/10 flex-shrink-0 cursor-move"
          onMouseDown={startDrag}
        >
          <div className="flex items-center gap-2">
            <button
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors flex items-center justify-center group"
              onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
              title="Fechar"
            >
              <span className="hidden group-hover:block text-red-900 text-[8px] font-bold leading-none">×</span>
            </button>
            <button
              className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors flex items-center justify-center group"
              onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
              title="Minimizar"
            >
              <span className="hidden group-hover:block text-yellow-900 text-[8px] font-bold leading-none">−</span>
            </button>
            <button
              className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors flex items-center justify-center group"
              onClick={(e) => { e.stopPropagation(); maximizeWindow(win.id); }}
              title="Maximizar"
            >
              <span className="hidden group-hover:block text-green-900 text-[8px] font-bold leading-none">+</span>
            </button>
          </div>

          <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
            <IconComponent size={13} className="text-white/60" />
            <span className="text-white/80 text-xs font-medium">{win.title}</span>
          </div>

          <div
            className="flex items-center gap-1"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {!win.isInternal && (
              <>
                <button
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  onClick={() => setRefreshKey((k) => k + 1)}
                  title="Recarregar"
                >
                  <RefreshCw size={11} />
                </button>
                <button
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  onClick={() => globalThis.open(win.url, '_blank')}
                  title="Abrir em nova aba"
                >
                  <ExternalLink size={11} />
                </button>
              </>
            )}
            <button
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors text-xs"
              onClick={(e) => { e.stopPropagation(); toggleFullscreen(win.id); }}
              title="Tela cheia"
            >
              ⤢
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={`flex-1 relative overflow-hidden ${win.isInternal ? '' : 'bg-white'}`}>
          {renderContent()}
        </div>

        {/* Resize handle */}
        {!win.isMaximized && !win.isFullscreen && (
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            onMouseDown={startResize}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
