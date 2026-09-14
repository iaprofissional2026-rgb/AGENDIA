import { CustomAudioTrack } from '../types';

const DB_NAME = 'AgendadorAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'custom_tracks';

let dbInstance: IDBDatabase | null = null;
const audioUrlCache = new Map<string, string>();

function getDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Retrieve all custom audio tracks stored on the device
 */
export async function getAllCustomTracks(): Promise<CustomAudioTrack[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as CustomAudioTrack[]) || [];
        // Sort newest first
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('Erro ao carregar faixas de áudio personalizadas:', error);
    return [];
  }
}

/**
 * Save a music / audio file selected from the user's phone / device
 */
export async function saveCustomTrack(file: File): Promise<CustomAudioTrack> {
  const db = await getDB();
  const id = `track_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Clean filename extension if any
  const cleanName = file.name.replace(/\.[^/.]+$/, '');

  const newTrack: CustomAudioTrack = {
    id,
    name: cleanName || 'Música do Celular',
    size: file.size,
    type: file.type || 'audio/mpeg',
    createdAt: Date.now(),
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(newTrack);

    request.onsuccess = () => {
      // Cache URL immediately
      const url = URL.createObjectURL(file);
      audioUrlCache.set(id, url);
      resolve(newTrack);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieve a specific track by ID
 */
export async function getCustomTrack(id: string): Promise<CustomAudioTrack | null> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve((request.result as CustomAudioTrack) || null);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.warn('Erro ao buscar faixa:', error);
    return null;
  }
}

/**
 * Get playable Object URL for a stored custom track
 */
export async function getTrackAudioUrl(id: string): Promise<string | null> {
  if (audioUrlCache.has(id)) {
    return audioUrlCache.get(id)!;
  }

  const track = await getCustomTrack(id);
  if (!track || !track.blob) return null;

  const url = URL.createObjectURL(track.blob);
  audioUrlCache.set(id, url);
  return url;
}

/**
 * Delete a custom track from storage
 */
export async function deleteCustomTrack(id: string): Promise<void> {
  if (audioUrlCache.has(id)) {
    URL.revokeObjectURL(audioUrlCache.get(id)!);
    audioUrlCache.delete(id);
  }

  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}
