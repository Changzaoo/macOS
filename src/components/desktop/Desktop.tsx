import React, { useEffect, useState } from 'react';
import { Activity, CalendarDays, CloudSun } from 'lucide-react';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { useAppearance } from '../../contexts/AppearanceContext';
import { useDesktop } from '../../contexts/DesktopContext';
import { getWallpaperById } from '../../lib/wallpapers';

export const Desktop: React.FC = () => {
  const { wallpaperId, blurEnabled, transparencyEnabled } = useAppearance();
  const wallpaper = getWallpaperById(wallpaperId);

  return (
    <div
      className="fixed inset-0 overflow-hidden wallpaper-transition desktop-shell"
      data-blur={blurEnabled ? 'on' : 'off'}
      data-transparency={transparencyEnabled ? 'on' : 'off'}
      style={{ background: wallpaper.gradient }}
    >
      <div className="noise-overlay absolute inset-0 desktop-layer" />

      <TopBar />
      <DesktopWidgets />

      <div className="absolute inset-0 pt-9 pb-[92px]">
        <WindowManager />
      </div>

      <Dock />
    </div>
  );
};

const DesktopWidgets: React.FC = () => {
  const { windows, widgetsVisible, arrangeWindows } = useDesktop();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const day = now.toLocaleDateString('pt-BR', { weekday: 'short' });
  const date = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  const openWindows = windows.filter((win) => !win.isMinimized).length;

  if (!widgetsVisible) return null;

  return (
    <div className="desktop-widgets desktop-layer">
      <button type="button" className="liquid-widget text-left pointer-events-auto">
        <div className="flex items-center justify-between text-white/70">
          <span className="widget-label">Hoje</span>
          <CalendarDays size={16} />
        </div>
        <div className="widget-value mt-3 text-3xl capitalize leading-none">{day}</div>
        <div className="text-white/60 text-sm mt-1 capitalize">{date}</div>
      </button>

      <button type="button" className="liquid-widget text-left pointer-events-auto">
        <div className="flex items-center justify-between text-white/70">
          <span className="widget-label">Tempo</span>
          <CloudSun size={17} />
        </div>
        <div className="widget-value mt-3 text-3xl leading-none">24 C</div>
        <div className="text-white/60 text-sm mt-1">Sao Paulo</div>
      </button>

      <button
        type="button"
        onClick={arrangeWindows}
        className="liquid-widget wide flex items-center justify-between gap-3 text-left pointer-events-auto"
      >
        <div>
          <div className="widget-label">Sessao</div>
          <div className="widget-value text-xl mt-1">{openWindows || 'Pronto'}</div>
        </div>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white"
          style={{ background: 'linear-gradient(145deg, rgba(94,234,212,0.34), rgba(96,165,250,0.2))' }}>
          <Activity size={20} />
        </div>
      </button>
    </div>
  );
};
