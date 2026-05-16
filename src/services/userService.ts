import type { UserProfile, UserPermissions } from '../types/user';

export const getUserProfile = async (_uid: string): Promise<UserProfile | null> => null;

export const getAllUsers = async (): Promise<UserProfile[]> => [];

export const updateUserProfile = async (
  _actorUid: string,
  _targetUid: string,
  _updates: Partial<UserProfile>
): Promise<void> => {};

export const updateUserPermissions = async (
  _actorUid: string,
  _targetUid: string,
  _permissions: UserPermissions
): Promise<void> => {};

export const toggleUserActive = async (
  _actorUid: string,
  _targetUid: string,
  _active: boolean
): Promise<void> => {};
