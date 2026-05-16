import { useAuth } from '../contexts/AuthContext';
import type { AppPermissions, UserPermissions } from '../types/user';

export const usePermissions = () => {
  const { user } = useAuth();
  const can = (_key: keyof Omit<UserPermissions, 'apps'>): boolean => true;
  const canOpenApp = (_appId: keyof AppPermissions): boolean => true;
  return { can, canOpenApp, isOwner: true, isAdmin: true, isManager: true, user };
};
