export type AppConfig = {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  defaultSize: { width: number; height: number };
  permissionKey: keyof import('./user').AppPermissions;
  isInternal?: boolean;
};
