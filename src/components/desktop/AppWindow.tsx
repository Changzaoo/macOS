import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Lock,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useDesktop } from '../../contexts/DesktopContext';
import type { WindowState } from '../../types/window';
import { AdminPanel } from '../admin/AdminPanel';
import { SettingsPanel } from '../settings/SettingsPanel';

type AppWindowProps = { window: WindowState };
type LoadState = 'loading' | 'loaded' | 'blocked';

const TrafficLight: React.FC<{
  color: 'red' | 'yellow' | 'green';
  onClick: () => void;
  title: string;
}> = ({ color, onClick, title }) => {
  const bg = { red: '#ff5f57', yellow: '#ffbd2e', green: '#28ca41' }[color];
  const hover = { red: '#e0443c', yellow: '#dfa020', green: '#20a832' }[color];
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-3 h-3 rounded-full flex items-center justify-center transition-colors"
      style={{ background: hovered ? hover : bg }}
    >
      {hovered && (
        <span style={{ fontSize: 8, lineHeight: 1, color: 'rgba(0,0,0,0.54)', fontWeight: 900 }}>
          {color === 'red' ? 'x' : color === 'yellow' ? '-' : '+'}
        </span>
      )}
    </button>
  );
};

const NavBtn: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, disabled, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    disabled={disabled}
    className="w-6 h-6 flex items-center justify-center rounded-lg transition-colors text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-default"
  >
    {children}
  </button>
);

const BlockedScreen: React.FC<{ url: string }> = ({ url }) => (
  <div
    className="flex flex-col items-center justify-center h-full p-8 text-center"
    style={{ background: 'linear-gradient(145deg, rgba(13,16,26,0.98), rgba(7,10,18,0.98))' }}
  >
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
      style={{ background: 'rgba(245,158,11,0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)' }}
    >
      <AlertTriangle size={26} className="text-amber-300" />
    </div>
    <h3 className="text-white font-semibold text-base mb-2">Nao foi possivel carregar</h3>
    <p className="text-white/50 text-sm max-w-xs mb-1 leading-relaxed">
      Este site bloqueou a visualizacao incorporada por politicas de seguranca.
    </p>
    <p className="text-white/25 text-xs mb-6 font-mono truncate max-w-xs">{url}</p>
    <button
      type="button"
      onClick={() => globalThis.open(url, '_blank')}
      className="px-5 py-2 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 liquid-button"
    >
      <ExternalLink size={13} />
      Abrir no navegador
    </button>
  </div>
);

const AccessHint: React.FC<{ url: string }> = ({ url }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.96 }}
    className="absolute right-4 bottom-4 z-20 rounded-2xl p-2 popup-glass"
  >
    <button
      type="button"
      onClick={() => globalThis.open(url, '_blank')}
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
    >
      <ExternalLink size={13} />
      Abrir site
    </button>
  </motion.div>
);

export const AppWindow: React.FC<AppWindowProps> = ({ window: win }) => {
  const {
    closeWindow,
    focusWindow,
    maximizeWindow,
    minimizeWindow,
    toggleFullscreen,
    updateWindowCurrentUrl,
    updateWindowPosition,
    updateWindowSize,
  } = useDesktop();

  const currentUrl = win.currentUrl || win.url;
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [progress, setProgress] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);
  const [showAccessHint, setShowAccessHint] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; wx: number; wy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  useEffect(() => {
    if (win.isInternal) return;
    const showTimer = setTimeout(() => setShowAccessHint(true), 0);
    const hintTimer = setTimeout(() => setShowAccessHint(false), 12_000);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hintTimer);
    };
  }, [currentUrl, iframeKey, win.isInternal]);

  useEffect(() => {
    if (win.isInternal) return;
    if (loadState === 'loading') {
      const t0 = setTimeout(() => setProgress(10), 0);
      const t1 = setTimeout(() => setProgress(45), 300);
      const t2 = setTimeout(() => setProgress(72), 900);
      const t3 = setTimeout(() => setProgress(90), 2000);
      const blocked = setTimeout(() => setLoadState('blocked'), 12_000);
      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(blocked);
      };
    }
    if (loadState === 'loaded' || loadState === 'blocked') {
      const done = setTimeout(() => setProgress(100), 0);
      return () => clearTimeout(done);
    }
  }, [loadState, iframeKey, win.isInternal]);

  const navigate = useCallback((raw: string) => {
    let url = raw.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = url.includes('.') && !url.includes(' ')
        ? 'https://' + url
        : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
    }
    updateWindowCurrentUrl(win.id, url);
    setUrlInput(url);
    setLoadState('loading');
    setProgress(0);
    setIframeKey((k) => k + 1);
    setIsEditingUrl(false);
  }, [win.id, updateWindowCurrentUrl]);

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigate(urlInput);
    if (e.key === 'Escape') {
      setUrlInput(currentUrl);
      setIsEditingUrl(false);
    }
  };

  const handleIframeLoad = useCallback(() => {
    try {
      const href = iframeRef.current?.contentWindow?.location?.href;
      if (!href || href === 'about:blank') {
        setLoadState('blocked');
      } else {
        setLoadState('loaded');
        if (href !== currentUrl) {
          updateWindowCurrentUrl(win.id, href);
        }
      }
    } catch {
      setLoadState('loaded');
    }
  }, [currentUrl, updateWindowCurrentUrl, win.id]);

  const startDrag = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized || win.isFullscreen) return;
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, wx: win.x, wy: win.y };
    focusWindow(win.id);

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      updateWindowPosition(
        win.id,
        dragRef.current.wx + ev.clientX - dragRef.current.sx,
        dragRef.current.wy + ev.clientY - dragRef.current.sy,
      );
    };
    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [focusWindow, updateWindowPosition, win]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: win.width, sh: win.height };

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      updateWindowSize(
        win.id,
        Math.max(520, resizeRef.current.sw + ev.clientX - resizeRef.current.sx),
        Math.max(380, resizeRef.current.sh + ev.clientY - resizeRef.current.sy),
      );
    };
    const onUp = () => {
      resizeRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [updateWindowSize, win]);

  if (win.isMinimized) return null;

  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[win.icon] ?? Icons.Globe;
  const isHttps = currentUrl.startsWith('https://');

  const displayDomain = () => {
    try {
      return new URL(currentUrl).hostname;
    } catch {
      return currentUrl;
    }
  };

  const windowStyle: React.CSSProperties = win.isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: win.zIndex, borderRadius: 0 }
    : win.isMaximized
      ? { position: 'fixed', left: 0, top: 36, right: 0, bottom: 80, zIndex: win.zIndex, borderRadius: 0 }
      : { position: 'fixed', left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex, borderRadius: 18 };

  return (
    <AnimatePresence>
      <motion.div
        className="window-shell"
        key={win.id}
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.88, y: 24 }}
        transition={{ type: 'spring', stiffness: 480, damping: 36 }}
        style={{
          ...windowStyle,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 34px 90px rgba(3,6,18,0.56), 0 0 0 0.5px rgba(255,255,255,0.18)',
        }}
        onClick={() => focusWindow(win.id)}
      >
        <div
          onMouseDown={startDrag}
          className="window-chrome"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            height: win.isInternal ? 42 : 52,
            padding: '0 13px',
            flexShrink: 0,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          <div className="flex items-center gap-1.5 mr-1" onMouseDown={(e) => e.stopPropagation()}>
            <TrafficLight color="red" onClick={() => closeWindow(win.id)} title="Fechar" />
            <TrafficLight color="yellow" onClick={() => minimizeWindow(win.id)} title="Minimizar" />
            <TrafficLight color="green" onClick={() => maximizeWindow(win.id)} title="Maximizar" />
          </div>

          {win.isInternal ? (
            <div className="flex-1 flex items-center justify-center gap-2 pointer-events-none">
              <IconComponent size={13} className="text-white/50" />
              <span className="text-white/70 text-xs font-medium">{win.title}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-0.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                <NavBtn onClick={() => {}} title="Voltar" disabled><ChevronLeft size={15} /></NavBtn>
                <NavBtn onClick={() => {}} title="Avancar" disabled><ChevronRight size={15} /></NavBtn>
              </div>

              <div
                className="flex-1 flex items-center gap-2 px-3 rounded-xl cursor-text mx-1 url-field-glass"
                style={{ height: 32 }}
                onClick={() => {
                  setUrlInput(currentUrl);
                  setIsEditingUrl(true);
                  setTimeout(() => urlInputRef.current?.select(), 0);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isEditingUrl ? (
                  <input
                    ref={urlInputRef}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={handleUrlKeyDown}
                    onBlur={() => {
                      setIsEditingUrl(false);
                      setUrlInput(currentUrl);
                    }}
                    autoFocus
                    className="flex-1 bg-transparent text-white text-xs outline-none font-mono"
                    style={{ userSelect: 'text' }}
                  />
                ) : (
                  <>
                    {isHttps
                      ? <Lock size={10} className="text-emerald-300 flex-shrink-0" />
                      : <Globe size={10} className="text-white/40 flex-shrink-0" />}
                    <span className="flex-1 text-white/60 text-xs truncate text-center">
                      {loadState === 'loading' ? 'Carregando...' : displayDomain()}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                <NavBtn onClick={() => { setLoadState('loading'); setProgress(0); setIframeKey((k) => k + 1); }} title="Recarregar">
                  <RefreshCw size={12} className={loadState === 'loading' ? 'animate-spin' : ''} />
                </NavBtn>
                <NavBtn onClick={() => globalThis.open(currentUrl, '_blank')} title="Abrir em nova aba">
                  <ExternalLink size={12} />
                </NavBtn>
                <NavBtn onClick={() => toggleFullscreen(win.id)} title="Tela cheia">
                  <Maximize2 size={12} />
                </NavBtn>
              </div>
            </>
          )}
        </div>

        {!win.isInternal && (
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #6ee7f9, #60a5fa 45%, #f0abfc)', transformOrigin: 'left' }}
              animate={{ width: `${progress}%`, opacity: loadState === 'loaded' && progress === 100 ? 0 : 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        )}

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: win.isInternal ? undefined : '#fff' }}>
          {win.isInternal ? (
            win.appId === 'settings' ? <SettingsPanel /> : <AdminPanel />
          ) : loadState === 'blocked' ? (
            <BlockedScreen url={currentUrl} />
          ) : (
            <>
              <AnimatePresence>
                {showAccessHint && <AccessHint url={currentUrl} />}
              </AnimatePresence>
              {loadState === 'loading' && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center z-10"
                  style={{ background: 'linear-gradient(145deg, rgba(13,16,26,0.98), rgba(7,10,18,0.98))' }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(145deg, #6ee7f9, #60a5fa 46%, #f0abfc)', boxShadow: '0 12px 34px rgba(96,165,250,0.34)' }}
                  >
                    {win.logoUrl && !logoFailed ? (
                      <img
                        src={win.logoUrl}
                        alt={win.title}
                        width={28}
                        height={28}
                        className="rounded-lg object-contain"
                        onError={() => setLogoFailed(true)}
                      />
                    ) : (
                      <IconComponent size={22} className="text-white" />
                    )}
                  </div>
                  <p className="text-white/40 text-xs">{displayDomain()}</p>
                </div>
              )}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={currentUrl}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                onError={() => setLoadState('blocked')}
                allow="fullscreen; autoplay; clipboard-write; encrypted-media"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads"
                style={{ display: 'block' }}
              />
            </>
          )}
        </div>

        {!win.isMaximized && !win.isFullscreen && (
          <div
            onMouseDown={startResize}
            style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, cursor: 'se-resize' }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};
