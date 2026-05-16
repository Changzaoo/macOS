import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { defaultPermissionsByRole } from '../types/user';
import type { UserRole, UserProfile } from '../types/user';

const ERR = 'Firebase não configurado. Verifique as variáveis de ambiente.';

// Senha temporária usada quando o usuário ainda não definiu a própria.
// Não é exposta na UI e é substituída pelo usuário no primeiro acesso.
const FIRST_ACCESS_TEMP = 'FIRST_ACCESS_PLACEHOLDER_KEY_2024';

export const checkFirstUserExists = async (): Promise<boolean> => {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'system', 'config'));
  return snap.exists() && snap.data()?.firstUserCreated === true;
};

// Cria o primeiro administrador com senha conhecida
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
    passwordSet: true,
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

// Primeiro acesso sem senha: cria a conta (se for o primeiro usuário)
// ou entra com a senha temporária (se a conta já existe e passwordSet === false)
export const loginWithoutPassword = async (username: string): Promise<UserProfile> => {
  if (!auth || !db) throw new Error(ERR);

  const email = `${username}@sistema.local`;
  const firstExists = await checkFirstUserExists();

  if (!firstExists) {
    // Criar primeiro admin com senha temporária
    const cred = await createUserWithEmailAndPassword(auth, email, FIRST_ACCESS_TEMP);
    const uid = cred.user.uid;
    const now = new Date().toISOString();

    const profile: UserProfile = {
      uid,
      username,
      displayName: username,
      email,
      role: 'admin',
      active: true,
      theme: 'dark',
      accentColor: '#0A84FF',
      createdAt: now,
      updatedAt: now,
      passwordSet: false,
      permissions: defaultPermissionsByRole('admin'),
    };

    await setDoc(doc(db, 'users', uid), profile);
    await setDoc(doc(db, 'system', 'config'), {
      firstUserCreated: true,
      adminUid: uid,
      createdAt: now,
    });
    await logAudit('first_access_create', uid);
    return profile;
  }

  // Usuário já existe — tentar entrar com senha temporária
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email, FIRST_ACCESS_TEMP);
  } catch {
    throw new Error('Usuário não encontrado ou já possui senha definida. Use sua senha para entrar.');
  }

  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) throw new Error('Perfil de usuário não encontrado.');

  const profile = snap.data() as UserProfile;
  if (profile.passwordSet === true) throw new Error('Este usuário já definiu uma senha. Use-a para entrar.');
  if (!profile.active) throw new Error('Conta desativada. Contate o administrador.');

  return profile;
};

// Define a senha do usuário logado e marca passwordSet: true
export const setUserPassword = async (newPassword: string): Promise<void> => {
  if (!auth || !db) throw new Error(ERR);
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Nenhum usuário logado.');

  await updatePassword(currentUser, newPassword);
  await updateDoc(doc(db, 'users', currentUser.uid), {
    passwordSet: true,
    updatedAt: new Date().toISOString(),
  });
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
    passwordSet: true,
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
