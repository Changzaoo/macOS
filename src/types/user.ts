export type UserRole = 'owner' | 'admin' | 'manager' | 'user' | 'guest';

export type AppPermissions = {
  crescer: boolean;
  gardenz: boolean;
  criptoHub: boolean;
  bitrade: boolean;
  trade: boolean;
  betintel: boolean;
  yield: boolean;
  aura: boolean;
};

export type UserPermissions = {
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManagePermissions: boolean;
  canAccessSettings: boolean;
  canOpenApps: boolean;
  canUseFullscreen: boolean;
  canCustomizeDesktop: boolean;
  apps: AppPermissions;
};

export type UserProfile = {
  uid: string;
  username: string;
  displayName: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  passwordSet?: boolean;
  active: boolean;
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  permissions: UserPermissions;
};

export const defaultPermissionsByRole = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'owner':
      return {
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canManagePermissions: true,
        canAccessSettings: true,
        canOpenApps: true,
        canUseFullscreen: true,
        canCustomizeDesktop: true,
        apps: {
          crescer: true, gardenz: true, criptoHub: true,
          bitrade: true, trade: true, betintel: true, yield: true, aura: true,
        },
      };
    case 'admin':
      return {
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: false,
        canManagePermissions: true,
        canAccessSettings: true,
        canOpenApps: true,
        canUseFullscreen: true,
        canCustomizeDesktop: true,
        apps: {
          crescer: true, gardenz: true, criptoHub: true,
          bitrade: true, trade: true, betintel: true, yield: true, aura: true,
        },
      };
    case 'manager':
      return {
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManagePermissions: false,
        canAccessSettings: true,
        canOpenApps: true,
        canUseFullscreen: true,
        canCustomizeDesktop: false,
        apps: {
          crescer: true, gardenz: true, criptoHub: true,
          bitrade: true, trade: true, betintel: false, yield: true, aura: false,
        },
      };
    case 'user':
      return {
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManagePermissions: false,
        canAccessSettings: false,
        canOpenApps: true,
        canUseFullscreen: false,
        canCustomizeDesktop: false,
        apps: {
          crescer: true, gardenz: true, criptoHub: false,
          bitrade: false, trade: false, betintel: false, yield: false, aura: false,
        },
      };
    case 'guest':
    default:
      return {
        canCreateUsers: false,
        canEditUsers: false,
        canDeleteUsers: false,
        canManagePermissions: false,
        canAccessSettings: false,
        canOpenApps: false,
        canUseFullscreen: false,
        canCustomizeDesktop: false,
        apps: {
          crescer: false, gardenz: false, criptoHub: false,
          bitrade: false, trade: false, betintel: false, yield: false, aura: false,
        },
      };
  }
};
