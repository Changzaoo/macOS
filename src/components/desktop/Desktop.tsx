import React from 'react';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { useAppearance } from '../../contexts/AppearanceContext';
import { getWallpaperById } from '../../lib/wallpapers';

export const Desktop: React.FC = () => {
  const { wallpaperId } = useAppearance();
  const wallpaper = getWallpaperById(wallpaperId);

  return (
    <div
      className="fixed inset-0 overflow-hidden wallpaper-transition"
      style={{ background: wallpaper.gradient }}
    >
      <div className="noise-overlay absolute inset-0" />

      <TopBar />

      <div className="absolute inset-0 pt-9 pb-[92px]">
        <WindowManager />
      </div>

      <Dock />
    </div>
  );
};
