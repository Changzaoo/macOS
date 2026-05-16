import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { UserProfile, UserPermissions } from '../types/user';
import { logAudit } from './authService';

const ERR = 'Firebase não configurado. Verifique as variáveis de ambiente.';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
  if (!db) throw new Error(ERR);
  const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfile);
};

export const updateUserProfile = async (
  actorUid: string,
  targetUid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  if (!db) throw new Error(ERR);
  const data = { ...updates, updatedAt: new Date().toISOString() };
  await updateDoc(doc(db, 'users', targetUid), data as Record<string, unknown>);
  await logAudit('user_updated', actorUid, targetUid, { fields: Object.keys(updates) });
};

export const updateUserPermissions = async (
  actorUid: string,
  targetUid: string,
  permissions: UserPermissions
): Promise<void> => {
  if (!db) throw new Error(ERR);
  await updateDoc(doc(db, 'users', targetUid), {
    permissions,
    updatedAt: new Date().toISOString(),
  });
  await logAudit('permissions_updated', actorUid, targetUid);
};

export const toggleUserActive = async (
  actorUid: string,
  targetUid: string,
  active: boolean
): Promise<void> => {
  if (!db) throw new Error(ERR);
  await updateDoc(doc(db, 'users', targetUid), {
    active,
    updatedAt: new Date().toISOString(),
  });
  await logAudit(active ? 'user_activated' : 'user_deactivated', actorUid, targetUid);
};
