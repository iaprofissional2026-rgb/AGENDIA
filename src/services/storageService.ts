import { Activity, AlarmSoundType } from '../types';

const STORAGE_KEY = 'agendador_atividades_list_v1';
const SETTINGS_KEY = 'agendador_settings_v1';

export interface AppSettings {
  defaultSound: AlarmSoundType;
  defaultVolume: number;
  defaultOffsetMinutes: number;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultSound: 'chime',
  defaultVolume: 0.8,
  defaultOffsetMinutes: 0,
  soundEnabled: true,
  notificationsEnabled: false,
};

// No fake or mock data: real user data only
export function getInitialActivities(): Activity[] {
  return [];
}

export function loadActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out any leftover mock or demo activities
    const realActivities: Activity[] = parsed.filter(
      (a: any) =>
        a &&
        typeof a.id === 'string' &&
        !a.id.startsWith('demo-') &&
        !a.id.startsWith('test_simulation_')
    );

    // If fake activities were present, clean the storage immediately
    if (realActivities.length !== parsed.length) {
      saveActivities(realActivities);
    }

    return realActivities;
  } catch (e) {
    console.error('Falha ao carregar atividades do localStorage:', e);
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch (e) {
    console.error('Falha ao salvar atividades no localStorage:', e);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Falha ao salvar configurações:', e);
  }
}
