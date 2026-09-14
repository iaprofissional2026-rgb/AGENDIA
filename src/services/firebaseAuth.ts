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

const USER_PROFILE_KEY = 'agendador_google_user_v1';
const ACCESS_TOKEN_KEY = 'agendador_google_token_v1';

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const loadCachedUserProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveCachedUserProfile = (profile: UserProfile, token?: string): void => {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    if (token) {
      cachedAccessToken = token;
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  } catch (e) {
    console.error('Falha ao salvar sessão do usuário no localStorage:', e);
  }
};

export const loadCachedAccessToken = (): string | null => {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    cachedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    return cachedAccessToken;
  } catch {
    return null;
  }
};

export const clearCachedAuth = (): void => {
  cachedAccessToken = null;
  try {
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch (e) {
    console.error('Falha ao limpar sessão do usuário:', e);
  }
};

export const initAuth = (
  onAuthSuccess?: (user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null }, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  // 1. Immediately hydrate from cache if available (Offline-First)
  const cachedProfile = loadCachedUserProfile();
  const cachedToken = loadCachedAccessToken();

  if (cachedProfile && onAuthSuccess) {
    onAuthSuccess(cachedProfile, cachedToken);
  }

  // 2. Listen to Firebase auth state if online
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const profile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
      };
      saveCachedUserProfile(profile);

      const token = loadCachedAccessToken();
      if (onAuthSuccess) {
        onAuthSuccess(profile, token);
      }
    } else {
      // If user is offline, DO NOT wipe their session! They are simply offline.
      if (!navigator.onLine) {
        const profile = loadCachedUserProfile();
        if (profile && onAuthSuccess) {
          onAuthSuccess(profile, loadCachedAccessToken());
          return;
        }
      }

      // If online and no user, only wipe if there was no active cached session
      const existingProfile = loadCachedUserProfile();
      if (!existingProfile) {
        clearCachedAuth();
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; profile: UserProfile } | null> => {
  // Check if device is offline
  if (!navigator.onLine) {
    throw new Error(
      'Você está offline no momento. Conecte-se à internet para realizar a autenticação com sua conta Google.'
    );
  }

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

    saveCachedUserProfile(profile, cachedAccessToken);

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
      return null;
    }

    // Popup was blocked by browser
    if (
      errorCode === 'auth/popup-blocked' ||
      errorMessage.includes('auth/popup-blocked')
    ) {
      throw new Error(
        'A janela de login do Google foi bloqueada pelo navegador. Permita pop-ups para fazer login.'
      );
    }

    // Network request error
    if (
      errorCode === 'auth/network-request-failed' ||
      errorMessage.includes('network-request-failed')
    ) {
      throw new Error(
        'Falha de conexão com a rede. Verifique sua conexão com a internet e tente novamente.'
      );
    }

    console.warn('Aviso de autenticação com Google:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return loadCachedAccessToken();
};

export const setCachedAccessToken = (token: string | null): void => {
  cachedAccessToken = token;
  if (token) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }
};

export const logoutGoogle = async (): Promise<void> => {
  clearCachedAuth();
  try {
    if (navigator.onLine) {
      await signOut(auth);
    }
  } catch (e) {
    console.warn('Erro ao sair do Firebase:', e);
  }
};
