import type { Wallpaper } from '../types/appearance';

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'tahoe',
    label: 'Tahoe Glass',
    preview: ['#74e0ff', '#f9a8d4', '#facc15'],
    gradient:
      'linear-gradient(132deg, rgba(255,255,255,0.34) 0%, transparent 18% 72%, rgba(255,255,255,0.18) 100%), conic-gradient(from 214deg at 52% 46%, #37d5f5, #8b7cf6, #f28ac8, #f6c85f, #6ee7b7, #37d5f5), linear-gradient(145deg, #10223f 0%, #1f2a44 48%, #0d1629 100%)',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    preview: ['#38bdf8', '#a78bfa', '#2dd4bf'],
    gradient:
      'linear-gradient(118deg, rgba(56,189,248,0.56), transparent 34%), linear-gradient(206deg, rgba(167,139,250,0.5), transparent 42%), linear-gradient(20deg, rgba(45,212,191,0.38), transparent 54%), linear-gradient(145deg, #08111f 0%, #172033 48%, #07131d 100%)',
  },
  {
    id: 'sonoma',
    label: 'Sonoma',
    preview: ['#fb7185', '#f59e0b', '#38bdf8'],
    gradient:
      'linear-gradient(124deg, rgba(251,113,133,0.66), transparent 36%), linear-gradient(236deg, rgba(245,158,11,0.46), transparent 48%), linear-gradient(18deg, rgba(56,189,248,0.42), transparent 58%), linear-gradient(145deg, #1b1720 0%, #2a2132 50%, #101827 100%)',
  },
  {
    id: 'cosmica',
    label: 'Cosmica',
    preview: ['#818cf8', '#22d3ee', '#f472b6'],
    gradient:
      'conic-gradient(from 140deg at 48% 44%, #111827, #3730a3, #22d3ee, #f472b6, #111827), linear-gradient(155deg, rgba(255,255,255,0.14), transparent 38% 72%, rgba(255,255,255,0.1))',
  },
  {
    id: 'vidro',
    label: 'Vidro Liquido',
    preview: ['#dbeafe', '#60a5fa', '#14b8a6'],
    gradient:
      'linear-gradient(116deg, rgba(219,234,254,0.58), transparent 27%), linear-gradient(230deg, rgba(96,165,250,0.54), transparent 42%), linear-gradient(18deg, rgba(20,184,166,0.42), transparent 62%), linear-gradient(145deg, #071421 0%, #14324a 48%, #06151b 100%)',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    preview: ['#e5e7eb', '#64748b', '#38bdf8'],
    gradient:
      'linear-gradient(130deg, rgba(255,255,255,0.38), transparent 22% 76%, rgba(125,211,252,0.22)), conic-gradient(from 222deg at 48% 52%, #111827, #334155, #e5e7eb, #38bdf8, #111827)',
  },
  {
    id: 'garden',
    label: 'Garden',
    preview: ['#86efac', '#22d3ee', '#fef08a'],
    gradient:
      'linear-gradient(124deg, rgba(134,239,172,0.55), transparent 33%), linear-gradient(232deg, rgba(34,211,238,0.42), transparent 45%), linear-gradient(18deg, rgba(254,240,138,0.34), transparent 62%), linear-gradient(145deg, #071712 0%, #123528 50%, #07111e 100%)',
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    preview: ['#fda4af', '#fbbf24', '#93c5fd'],
    gradient:
      'linear-gradient(122deg, rgba(253,164,175,0.58), transparent 33%), linear-gradient(235deg, rgba(251,191,36,0.48), transparent 49%), linear-gradient(18deg, rgba(147,197,253,0.42), transparent 62%), linear-gradient(145deg, #221520 0%, #352033 48%, #122033 100%)',
  },
];

export const getWallpaperById = (id: string): Wallpaper =>
  WALLPAPERS.find((wallpaper) => wallpaper.id === id) ?? WALLPAPERS[0];
