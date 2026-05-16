import type { UserRole, UserProfile } from '../types/user';

export const checkFirstUserExists = async (): Promise<boolean> => false;
export const createFirstAccount = async (_u: string, _p: string, _d: string): Promise<UserProfile> => { throw new Error('Firebase desativado.'); };
export const loginWithoutPassword = async (_u: string): Promise<UserProfile> => { throw new Error('Firebase desativado.'); };
export const setUserPassword = async (_p: string): Promise<void> => {};
export const loginWithUsername = async (_u: string, _p: string): Promise<UserProfile> => { throw new Error('Firebase desativado.'); };
export const logoutUser = async (_uid: string): Promise<void> => {};
export const createUserByAdmin = async (_a: string, _d: { username: string; displayName: string; password: string; role: UserRole; active: boolean; theme: 'light' | 'dark' | 'auto'; accentColor: string; avatarUrl?: string }): Promise<UserProfile> => { throw new Error('Firebase desativado.'); };
export const logAudit = async (): Promise<void> => {};
