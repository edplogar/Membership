import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Firebase Auth Password Reset Email Helper
export async function sendFirebasePasswordResetEmail(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (err: unknown) {
    const errObj = err as Error & { code?: string };
    console.warn('Firebase Password Reset Notice:', errObj?.message || err);
    return {
      success: false,
      error: errObj?.code === 'auth/user-not-found'
        ? 'Alamat email tidak terdaftar di sistem autentikasi Firebase.'
        : errObj?.code === 'auth/invalid-email'
        ? 'Format alamat email tidak valid.'
        : errObj?.message || 'Gagal mengirim email reset kata sandi.',
      code: errObj?.code,
    };
  }
}

// Google Account Authentication Helper
export async function signInWithGoogleAccount() {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return {
      success: true,
      user: result.user,
      error: null,
    };
  } catch (err: unknown) {
    const errObj = err as Error & { code?: string };
    console.warn('Google Sign-In Error:', errObj?.message || err);
    return {
      success: false,
      user: null,
      error: errObj?.code === 'auth/popup-closed-by-user'
        ? 'Jendela verifikasi Google ditutup sebelum proses selesai.'
        : errObj?.code === 'auth/popup-blocked'
        ? 'Jendela pop-up Google diblokir browser. Harap izinkan pop-up untuk situs ini.'
        : errObj?.message || 'Gagal melakukan verifikasi akun Google.',
    };
  }
}

// Validation test connection to Firestore as required by Firebase skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline notice:', error.message);
    }
    return false;
  }
}

// Error handling helper as required by Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
