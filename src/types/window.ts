export type WindowState = {
  id: string;
  appId: string;
  title: string;
  url: string;
  currentUrl: string;
  icon: string;
  logoUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFullscreen: boolean;
  zIndex: number;
  isLoading: boolean;
  isInternal?: boolean;
};

export type CustomApp = {
  id: string;
  name: string;
  url: string;
  canonicalUrl?: string;
  fallbackUrl?: string;
  icon: string;
  logoUrl?: string;
  gradient?: string;
  source?: 'custom' | 'vercel';
  projectId?: string;
  vercelProjectUrl?: string;
  gitRepo?: string;
  createdAt: string;
};
