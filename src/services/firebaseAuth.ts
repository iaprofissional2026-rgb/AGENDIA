import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Google Calendar events scope for scheduling activities
export const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
provider.addScope(CALENDAR_SCOPE);

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // In some cases token needs re-authentication or popup
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; profile: UserProfile } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso da conta Google.');
    }

    cachedAccessToken = credential.accessToken;
    const profile: UserProfile = {
      uid: result.user.uid,
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
    };

    return { user: result.user, accessToken: cachedAccessToken, profile };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = String(error?.message || '');

    // User closed the popup window or clicked cancel
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorMessage.includes('auth/popup-closed-by-user') ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorMessage.includes('auth/cancelled-popup-request')
    ) {
      // Normal user dismissal, return null cleanly without throwing
      return null;
    }

    // Popup was blocked by browser
    if (
      errorCode === 'auth/popup-blocked' ||
      errorMessage.includes('auth/popup-blocked')
    ) {
      throw new Error('A janela pop-up foi bloqueada pelo navegador. Permita pop-ups para conectar com o Google Calendar.');
    }

    // Network request error
    if (
      errorCode === 'auth/network-request-failed' ||
      errorMessage.includes('network-request-failed')
    ) {
      throw new Error('Falha de conexão com a rede. Verifique sua conexão e tente novamente.');
    }

    console.warn('Aviso de autenticação com Google Calendar:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
};

export const logoutGoogle = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};
