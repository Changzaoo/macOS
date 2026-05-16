export type WindowState = {
  id: string;
  appId: string;
  title: string;
  url: string;
  currentUrl: string;
  icon: string;
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
  icon: string;
  createdAt: string;
};
