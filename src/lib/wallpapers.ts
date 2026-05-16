import type { Wallpaper } from '../types/appearance';

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'aurora',
    label: 'Aurora Azul',
    preview: ['#1a1a6e', '#3b0764', '#0c4a6e'],
    gradient:
      'radial-gradient(ellipse at 20% 50%, #1a1a6e 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #3b0764 0%, transparent 55%), radial-gradient(ellipse at 60% 80%, #0c4a6e 0%, transparent 50%), linear-gradient(160deg, #0f0f1a 0%, #1a0a2e 40%, #0a1628 100%)',
  },
  {
    id: 'sonoma',
    label: 'Sonoma',
    preview: ['#7c2d12', '#9a3412', '#1e1b4b'],
    gradient:
      'radial-gradient(ellipse at 60% 20%, #c2410c 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, #7c3aed 0%, transparent 60%), radial-gradient(ellipse at 90% 90%, #1e3a5f 0%, transparent 50%), linear-gradient(150deg, #1c1917 0%, #292524 50%, #1e1b4b 100%)',
  },
  {
    id: 'cosmica',
    label: 'Noite Cósmica',
    preview: ['#0f0c29', '#302b63', '#24243e'],
    gradient:
      'radial-gradient(ellipse at 30% 70%, #1e1b4b 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, #312e81 0%, transparent 55%), radial-gradient(ellipse at 50% 50%, #4c1d95 0%, transparent 40%), linear-gradient(135deg, #0f0c29 0%, #1e1b4b 100%)',
  },
  {
    id: 'vidro',
    label: 'Vidro Líquido',
    preview: ['#0f172a', '#1e3a5f', '#0c4a6e'],
    gradient:
      'radial-gradient(ellipse at 50% 50%, #164e63 0%, transparent 70%), radial-gradient(ellipse at 80% 80%, #0f2027 0%, transparent 50%), linear-gradient(135deg, #0c1445 0%, #164e63 50%, #0f2027 100%)',
  },
  {
    id: 'oceano',
    label: 'Mar Profundo',
    preview: ['#0c4a6e', '#065f46', '#1e3a8a'],
    gradient:
      'radial-gradient(ellipse at 30% 30%, #0c4a6e 0%, transparent 60%), radial-gradient(ellipse at 80% 70%, #065f46 0%, transparent 55%), linear-gradient(160deg, #020617 0%, #0c2340 50%, #042f1d 100%)',
  },
  {
    id: 'silver',
    label: 'Minimal Silver',
    preview: ['#1e293b', '#334155', '#475569'],
    gradient:
      'radial-gradient(ellipse at 40% 40%, #334155 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, #1e293b 0%, transparent 55%), linear-gradient(145deg, #0f172a 0%, #1e293b 60%, #334155 100%)',
  },
  {
    id: 'sunset',
    label: 'Sunset Pro',
    preview: ['#7f1d1d', '#dc2626', '#9333ea'],
    gradient:
      'radial-gradient(ellipse at 40% 60%, #7c3aed 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, #db2777 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, #dc2626 0%, transparent 50%), linear-gradient(135deg, #1a0533 0%, #2d1b69 100%)',
  },
  {
    id: 'forest',
    label: 'Forest Dark',
    preview: ['#052e16', '#166534', '#14532d'],
    gradient:
      'radial-gradient(ellipse at 30% 40%, #14532d 0%, transparent 60%), radial-gradient(ellipse at 70% 70%, #052e16 0%, transparent 55%), radial-gradient(ellipse at 60% 20%, #065f46 0%, transparent 45%), linear-gradient(135deg, #020c08 0%, #052e16 50%, #166534 100%)',
  },
];

export const getWallpaperById = (id: string): Wallpaper =>
  WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
