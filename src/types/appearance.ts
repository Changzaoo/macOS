export type ThemeMode = 'dark' | 'light' | 'system';

export type Wallpaper = {
  id: string;
  label: string;
  gradient: string;
  preview: string[];
};

export type AppearanceState = {
  wallpaperId: string;
  theme: ThemeMode;
  blurEnabled: boolean;
  transparencyEnabled: boolean;
};
