import React from 'react';
import { TopBar } from './TopBar';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { useDesktop } from '../../contexts/DesktopContext';

const WALLPAPERS: Record<string, string> = {
  'gradient-1':
    'radial-gradient(ellipse at 20% 50%, #1a1a6e 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #3b0764 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, #0c4a6e 0%, transparent 50%), linear-gradient(160deg, #0f0f1a 0%, #1a0a2e 40%, #0a1628 100%)',
  'gradient-2':
    'radial-gradient(ellipse at 30% 70%, #1e1b4b 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, #312e81 0%, transparent 55%), linear-gradient(135deg, #0f0c29 0%, #1e1b4b 100%)',
  'gradient-3':
    'radial-gradient(ellipse at 50% 50%, #164e63 0%, transparent 70%), linear-gradient(135deg, #0c1445 0%, #164e63 50%, #0f2027 100%)',
  'gradient-4':
    'radial-gradient(ellipse at 30% 40%, #14532d 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, #052e16 0%, transparent 55%), linear-gradient(135deg, #052e16 0%, #166534 100%)',
  'gradient-5':
    'radial-gradient(ellipse at 40% 60%, #7c3aed 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #db2777 0%, transparent 50%), linear-gradient(135deg, #1a0533 0%, #2d1b69 100%)',
};

export const Desktop: React.FC = () => {
  const { wallpaper } = useDesktop();
  const bg = WALLPAPERS[wallpaper] ?? WALLPAPERS['gradient-1'];

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: bg }}
    >
      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ opacity: 0.025, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundSize: '128px' }}
      />

      <TopBar />

      <div className="absolute inset-0 pt-9 pb-[88px]">
        <WindowManager />
      </div>

      <Dock />
    </div>
  );
};
