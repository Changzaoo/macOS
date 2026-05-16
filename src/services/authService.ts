import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { defaultPermissionsByRole } from '../types/user';
import type { UserRole, UserProfile } from '../types/user';

const ERR = 'Firebase não configurado. Verifique as variáveis de ambiente.';

export const checkFirstUserExists = async (): Promise<boolean> => {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'system', 'config'));
  return snap.exists() && snap.data()?.firstUserCreated === true;
};

export const createFirstAccount = async (
  username: string,
  password: string,
  displayName: string
): Promise<UserProfile> => {
  if (!auth || !db) throw new Error(ERR);

  const email = `${username}@sistema.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  const now = new Date().toISOString();

  const profile: UserProfile = {
    uid,
    username,
    displayName: displayName || username,
    email,
    role: 'admin',
    active: true,
    theme: 'dark',
    accentColor: '#0A84FF',
    createdAt: now,
    updatedAt: now,
    permissions: defaultPermissionsByRole('admin'),
  };

  await setDoc(doc(db, 'users', uid), profile);
  await setDoc(doc(db, 'system', 'config'), {
    firstUserCreated: true,
    adminUid: uid,
    createdAt: now,
  });
  await logAudit('first_account_created', uid);
  return profile;
};

export const loginWithUsername = async (
  username: string,
  password: string
): Promise<UserProfile> => {
  if (!auth || !db) throw new Error(ERR);

  const email = `${username}@sistema.local`;
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) throw new Error('Usuário não encontrado no sistema.');

  const profile = snap.data() as UserProfile;
  if (!profile.active) throw new Error('Conta desativada. Contate o administrador.');

  await logAudit('login', cred.user.uid);
  return profile;
};

export const logoutUser = async (uid: string): Promise<void> => {
  if (!auth) throw new Error(ERR);
  await logAudit('logout', uid);
  await signOut(auth);
};

export const createUserByAdmin = async (
  actorUid: string,
  data: {
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
  if (!auth || !db) throw new Error(ERR);

  const email = `${data.username}@sistema.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, data.password);
  const uid = cred.user.uid;
  const now = new Date().toISOString();

  const profile: UserProfile = {
    uid,
    username: data.username,
    displayName: data.displayName,
    email,
    role: data.role,
    active: data.active,
    theme: data.theme,
    accentColor: data.accentColor,
    avatarUrl: data.avatarUrl,
    createdAt: now,
    updatedAt: now,
    createdBy: actorUid,
    permissions: defaultPermissionsByRole(data.role),
  };

  await setDoc(doc(db, 'users', uid), profile);
  await logAudit('user_created', actorUid, uid);
  return profile;
};

export const logAudit = async (
  action: string,
  actorUid: string,
  targetUid?: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    if (!db) return;
    const ref = doc(collection(db, 'auditLogs'));
    await setDoc(ref, {
      action,
      actorUid,
      targetUid: targetUid ?? null,
      metadata: metadata ?? null,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // audit failure must not block main flow
  }
};
