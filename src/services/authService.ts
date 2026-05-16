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

// Primeiro acesso sem senha.
// Estratégia: tenta criar a conta primeiro (Firebase Auth usa domínio diferente do Firestore).
// Se a conta já existe (email-already-in-use), tenta entrar com a senha temporária.
// Só lê/escreve no Firestore DEPOIS que a autenticação passou.
export const loginWithoutPassword = async (username: string): Promise<UserProfile> => {
  if (!auth || !db) throw new Error(ERR);

  const email = `${username}@sistema.local`;

  // Tentativa 1: criar conta nova
  try {
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

  } catch (createErr: unknown) {
    const code = (createErr as { code?: string })?.code ?? '';

    // Conta já existe — seguir para Tentativa 2
    if (code !== 'auth/email-already-in-use') {
      if (code.includes('network') || code.includes('blocked')) {
        throw new Error('Sem conexão com o Firebase. Desative extensões bloqueadoras (ad blocker) e tente novamente.');
      }
      throw new Error('Erro ao criar conta: ' + (createErr instanceof Error ? createErr.message : code));
    }
  }

  // Tentativa 2: conta já existe — entrar com senha temporária (passwordSet === false)
  try {
    const cred = await signInWithEmailAndPassword(auth, email, FIRST_ACCESS_TEMP);

    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) throw new Error('Perfil não encontrado. Contate o administrador.');

    const profile = snap.data() as UserProfile;

    if (profile.passwordSet === true) {
      await signOut(auth);
      throw new Error('Você já definiu uma senha. Use-a para entrar no campo acima.');
    }
    if (!profile.active) {
      await signOut(auth);
      throw new Error('Conta desativada. Contate o administrador.');
    }

    return profile;

  } catch (signInErr: unknown) {
    // Re-lança erros já tratados
    if (signInErr instanceof Error &&
        (signInErr.message.includes('senha') || signInErr.message.includes('desativada') || signInErr.message.includes('Perfil'))) {
      throw signInErr;
    }
    // Senha temporária rejeitada = usuário já trocou a senha
    throw new Error('Você já definiu uma senha. Use-a para entrar no campo acima.');
  }
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
