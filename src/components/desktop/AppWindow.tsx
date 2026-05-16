import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ExternalLink, RefreshCw, ChevronLeft, ChevronRight,
  Lock, Globe, Maximize2, AlertTriangle,
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
  const bg = { red: '#FF5F57', yellow: '#FFBD2E', green: '#28CA41' }[color];
  const hover = { red: '#E0443C', yellow: '#DFA020', green: '#20A832' }[color];
  const [hovered, setHovered] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-3 h-3 rounded-full flex items-center justify-center transition-colors"
      style={{ background: hovered ? hover : bg }}
    >
      {hovered && (
        <span style={{ fontSize: 8, lineHeight: 1, color: 'rgba(0,0,0,0.5)', fontWeight: 900 }}>
          {color === 'red' ? '×' : color === 'yellow' ? '−' : '+'}
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
    title={title}
    onClick={onClick}
    disabled={disabled}
    className="w-6 h-6 flex items-center justify-center rounded-md transition-colors text-white/35 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-default"
  >
    {children}
  </button>
);

const BlockedScreen: React.FC<{ url: string }> = ({ url }) => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center"
    style={{ background: 'rgba(10,10,14,0.98)' }}>
    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
      style={{ background: 'rgba(245,158,11,0.12)' }}>
      <AlertTriangle size={26} className="text-amber-400" />
    </div>
    <h3 className="text-white font-semibold text-base mb-2">Não foi possível carregar</h3>
    <p className="text-white/40 text-sm max-w-xs mb-1 leading-relaxed">
      Este site bloqueou a visualização incorporada por políticas de segurança.
    </p>
    <p className="text-white/20 text-xs mb-6 font-mono truncate max-w-xs">{url}</p>
    <button
      onClick={() => globalThis.open(url, '_blank')}
      className="px-5 py-2 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2 liquid-button"
    >
      <ExternalLink size={13} />
      Abrir no navegador
    </button>
  </div>
);

export const AppWindow: React.FC<AppWindowProps> = ({ window: win }) => {
  const {
    closeWindow, minimizeWindow, maximizeWindow, toggleFullscreen,
    focusWindow, updateWindowPosition, updateWindowSize, updateWindowCurrentUrl,
  } = useDesktop();

  const currentUrl = win.currentUrl || win.url;
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [progress, setProgress] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ sx: number; sy: number; wx: number; wy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; sw: number; sh: number } | null>(null);

  useEffect(() => {
    if (!isEditingUrl) setUrlInput(currentUrl);
  }, [currentUrl, isEditingUrl]);

  useEffect(() => {
    if (win.isInternal) return;
    if (loadState === 'loading') {
      setProgress(10);
      const t1 = setTimeout(() => setProgress(45), 300);
      const t2 = setTimeout(() => setProgress(72), 900);
      const t3 = setTimeout(() => setProgress(90), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    if (loadState === 'loaded' || loadState === 'blocked') setProgress(100);
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
    if (e.key === 'Escape') { setUrlInput(currentUrl); setIsEditingUrl(false); }
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
          if (!isEditingUrl) setUrlInput(href);
        }
      }
    } catch {
      setLoadState('loaded');
    }
  }, [currentUrl, win.id, isEditingUrl, updateWindowCurrentUrl]);

  const startDrag = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized || win.isFullscreen) return;
    e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, wx: win.x, wy: win.y };
    focusWindow(win.id);
    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      updateWindowPosition(win.id, dragRef.current.wx + ev.clientX - dragRef.current.sx, dragRef.current.wy + ev.clientY - dragRef.current.sy);
    };
    const onUp = () => { dragRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win, focusWindow, updateWindowPosition]);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, sw: win.width, sh: win.height };
    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      updateWindowSize(win.id, Math.max(520, resizeRef.current.sw + ev.clientX - resizeRef.current.sx), Math.max(380, resizeRef.current.sh + ev.clientY - resizeRef.current.sy));
    };
    const onUp = () => { resizeRef.current = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [win, updateWindowSize]);

  if (win.isMinimized) return null;

  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[win.icon] ?? Icons.Globe;
  const isHttps = currentUrl.startsWith('https://');

  const displayDomain = () => {
    try { return new URL(currentUrl).hostname; }
    catch { return currentUrl; }
  };

  const windowStyle: React.CSSProperties = win.isFullscreen
    ? { position: 'fixed', inset: 0, zIndex: win.zIndex, borderRadius: 0 }
    : win.isMaximized
    ? { position: 'fixed', left: 0, top: 36, right: 0, bottom: 80, zIndex: win.zIndex, borderRadius: 0 }
    : { position: 'fixed', left: win.x, top: win.y, width: win.width, height: win.height, zIndex: win.zIndex, borderRadius: 14 };

  return (
    <AnimatePresence>
      <motion.div
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
          boxShadow: '0 40px 100px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(255,255,255,0.08)',
        }}
        onClick={() => focusWindow(win.id)}
      >
        {/* Title / Browser bar */}
        <div
          onMouseDown={startDrag}
          className="window-chrome"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            height: win.isInternal ? 40 : 50,
            padding: '0 12px',
            flexShrink: 0,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5 mr-1" onMouseDown={(e) => e.stopPropagation()}>
            <TrafficLight color="red" onClick={() => closeWindow(win.id)} title="Fechar" />
            <TrafficLight color="yellow" onClick={() => minimizeWindow(win.id)} title="Minimizar" />
            <TrafficLight color="green" onClick={() => maximizeWindow(win.id)} title="Maximizar" />
          </div>

          {win.isInternal ? (
            <div className="flex-1 flex items-center justify-center gap-2 pointer-events-none">
              <IconComponent size={13} className="text-white/40" />
              <span className="text-white/55 text-xs font-medium">{win.title}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-0.5 flex-shrink-0" onMouseDown={(e) => e.stopPropagation()}>
                <NavBtn onClick={() => {}} title="Voltar" disabled><ChevronLeft size={15} /></NavBtn>
                <NavBtn onClick={() => {}} title="Avançar" disabled><ChevronRight size={15} /></NavBtn>
              </div>

              {/* URL bar */}
              <div
                className="flex-1 flex items-center gap-2 px-3 rounded-lg cursor-text mx-1"
                style={{
                  height: 32,
                  background: 'rgba(255,255,255,0.055)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => { setIsEditingUrl(true); setTimeout(() => urlInputRef.current?.select(), 0); }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {isEditingUrl ? (
                  <input
                    ref={urlInputRef}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={handleUrlKeyDown}
                    onBlur={() => { setIsEditingUrl(false); setUrlInput(currentUrl); }}
                    autoFocus
                    className="flex-1 bg-transparent text-white text-xs outline-none font-mono"
                    style={{ userSelect: 'text' }}
                  />
                ) : (
                  <>
                    {isHttps
                      ? <Lock size={10} className="text-green-400 flex-shrink-0" />
                      : <Globe size={10} className="text-white/25 flex-shrink-0" />
                    }
                    <span className="flex-1 text-white/50 text-xs truncate text-center">
                      {loadState === 'loading' ? 'Carregando…' : displayDomain()}
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

        {/* Progress bar */}
        {!win.isInternal && (
          <div style={{ height: 2, background: 'rgba(255,255,255,0.03)', flexShrink: 0 }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, #60a5fa, #818cf8)', transformOrigin: 'left' }}
              animate={{ width: `${progress}%`, opacity: loadState === 'loaded' && progress === 100 ? 0 : 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: win.isInternal ? undefined : '#fff' }}>
          {win.isInternal ? (
            win.appId === 'settings' ? <SettingsPanel /> : <AdminPanel />
          ) : loadState === 'blocked' ? (
            <BlockedScreen url={currentUrl} />
          ) : (
            <>
              {loadState === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
                  style={{ background: 'rgba(12,12,18,0.97)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(145deg, #3b82f6, #6366f1)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
                    <IconComponent size={22} className="text-white" />
                  </div>
                  <p className="text-white/30 text-xs">{displayDomain()}</p>
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

        {/* Resize handle */}
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
