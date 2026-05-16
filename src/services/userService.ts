import type { UserProfile, UserPermissions } from '../types/user';

export const getUserProfile = async (_uid: string): Promise<UserProfile | null> => null;
export const getAllUsers = async (): Promise<UserProfile[]> => [];
export const updateUserProfile = async (_a: string, _t: string, _u: Partial<UserProfile>): Promise<void> => {};
export const updateUserPermissions = async (_a: string, _t: string, _p: UserPermissions): Promise<void> => {};
export const toggleUserActive = async (_a: string, _t: string, _active: boolean): Promise<void> => {};
