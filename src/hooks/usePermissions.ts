import { useAuth } from '../contexts/AuthContext';
import type { AppPermissions, UserPermissions } from '../types/user';

export const usePermissions = () => {
  const { user } = useAuth();

  const can = (key: keyof Omit<UserPermissions, 'apps'>): boolean => {
    if (!user) return false;
    return user.permissions[key] === true;
  };

  const canOpenApp = (appId: keyof AppPermissions): boolean => {
    if (!user) return false;
    return user.permissions.canOpenApps && user.permissions.apps[appId] === true;
  };

  const isOwner = user?.role === 'owner';
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';
  const isManager = user?.role === 'manager' || isAdmin;

  return { can, canOpenApp, isOwner, isAdmin, isManager, user };
};
