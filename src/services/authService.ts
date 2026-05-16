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
import { auth, db } from '../config/firebase';
import { defaultPermissionsByRole } from '../types/user';
import type { UserRole, UserProfile } from '../types/user';

const ERR_NOT_CONFIGURED = 'Firebase não configurado. Verifique as variáveis de ambiente.';

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
  if (!auth || !db) throw new Error(ERR_NOT_CONFIGURED);

  const email = `${username}@sistema.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const permissions = defaultPermissionsByRole('owner');
  const profile: UserProfile = {
    uid,
    username,
    displayName,
    email,
    role: 'owner',
    active: true,
    theme: 'dark',
    accentColor: '#0A84FF',
    createdAt: new Date().toISOString(),
    permissions,
  };

  await setDoc(doc(db, 'users', uid), profile);
  await setDoc(doc(db, 'system', 'config'), {
    firstUserCreated: true,
    ownerUid: uid,
    createdAt: new Date().toISOString(),
  });

  await logAudit('first_account_created', uid);
  return profile;
};

export const loginWithUsername = async (
  username: string,
  password: string
): Promise<UserProfile> => {
  if (!auth || !db) throw new Error(ERR_NOT_CONFIGURED);

  const email = `${username}@sistema.local`;
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) throw new Error('Usuário não encontrado no sistema.');

  const profile = snap.data() as UserProfile;
  if (!profile.active) throw new Error('Conta desativada. Contate o administrador.');

  await logAudit('login', uid);
  return profile;
};

export const logoutUser = async (uid: string): Promise<void> => {
  if (!auth) throw new Error(ERR_NOT_CONFIGURED);
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
  if (!auth || !db) throw new Error(ERR_NOT_CONFIGURED);

  const email = `${data.username}@sistema.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, data.password);
  const uid = cred.user.uid;

  const permissions = defaultPermissionsByRole(data.role);
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
    createdAt: new Date().toISOString(),
    createdBy: actorUid,
    permissions,
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
) => {
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
    // audit failure should not block main flow
  }
};
