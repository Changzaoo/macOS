import React from 'react';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { useDesktop } from '../../contexts/DesktopContext';

const wallpapers: Record<string, string> = {
  'gradient-1': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)',
  'gradient-2': 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'gradient-3': 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
  'gradient-4': 'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
  'gradient-5': 'linear-gradient(135deg, #2c3e50 0%, #4ca1af 100%)',
};

export const Desktop: React.FC = () => {
  const { wallpaper } = useDesktop();
  const bg = wallpapers[wallpaper] ?? wallpapers['gradient-1'];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: bg }}
    >
      <TopBar />
      <div className="absolute inset-0 pt-9 pb-20">
        <WindowManager />
      </div>
      <Dock />
    </div>
  );
};
