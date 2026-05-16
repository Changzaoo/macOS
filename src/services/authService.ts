import type { UserRole, UserProfile } from '../types/user';

export const checkFirstUserExists = async (): Promise<boolean> => false;

export const createFirstAccount = async (
  _username: string,
  _password: string,
  _displayName: string
): Promise<UserProfile> => {
  throw new Error('Firebase desativado temporariamente.');
};

export const loginWithUsername = async (
  _username: string,
  _password: string
): Promise<UserProfile> => {
  throw new Error('Firebase desativado temporariamente.');
};

export const logoutUser = async (_uid: string): Promise<void> => {};

export const createUserByAdmin = async (
  _actorUid: string,
  _data: {
    username: string;
    displayName: string;
    password: string;
    role: UserRole;
    active: boolean;
    theme: 'light' | 'dark' | 'auto';
    accentColor: string;
    avatarUrl?: string;
  }
): Promise<UserProfile> => {
  throw new Error('Firebase desativado temporariamente.');
};

export const logAudit = async (
  _action: string,
  _actorUid: string,
  _targetUid?: string,
  _metadata?: Record<string, unknown>
): Promise<void> => {};
