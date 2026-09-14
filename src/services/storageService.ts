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

function getTodayDateString(offsetDays: number = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeString(hoursFromNow: number = 0, minutesOffset: number = 0): string {
  const d = new Date();
  d.setHours(d.getHours() + hoursFromNow);
  d.setMinutes(d.getMinutes() + minutesOffset);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getInitialActivities(): Activity[] {
  const today = getTodayDateString();

  return [
    {
      id: 'demo-1',
      title: 'Reunião de Alinhamento de Metas',
      description: 'Revisar principais objetivos da semana e cronograma de entregas.',
      date: today,
      startTime: getTimeString(1, 0),
      endTime: getTimeString(2, 0),
      category: 'Trabalho',
      priority: 'alta',
      status: 'pendente',
      alarm: {
        enabled: true,
        soundType: 'chime',
        volume: 0.85,
        triggerOffsetMinutes: 5,
      },
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'demo-2',
      title: 'Estudar TypeScript Avançado & React 19',
      description: 'Praticar hooks modernos, concorrência e tipagem de funções assíncronas.',
      date: today,
      startTime: getTimeString(2, 30),
      endTime: getTimeString(3, 45),
      category: 'Estudo',
      priority: 'media',
      status: 'pendente',
      alarm: {
        enabled: true,
        soundType: 'melodic',
        volume: 0.75,
        triggerOffsetMinutes: 0,
      },
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now() - 7200000,
    },
    {
      id: 'demo-3',
      title: 'Caminhada & Treino Funcional',
      description: 'Sessão de exercícios ao ar livre e hidratação.',
      date: today,
      startTime: getTimeString(4, 0),
      endTime: getTimeString(5, 0),
      category: 'Saúde',
      priority: 'alta',
      status: 'pendente',
      alarm: {
        enabled: true,
        soundType: 'digital',
        volume: 0.9,
        triggerOffsetMinutes: 10,
      },
      createdAt: Date.now() - 10800000,
      updatedAt: Date.now() - 10800000,
    },
    {
      id: 'demo-4',
      title: 'Pausa para Café e Leitura',
      description: 'Momento de descompressão e leitura de artigos de tecnologia.',
      date: today,
      startTime: getTimeString(5, 30),
      endTime: getTimeString(6, 0),
      category: 'Lazer',
      priority: 'baixa',
      status: 'pendente',
      alarm: {
        enabled: false,
        soundType: 'gong',
        volume: 0.6,
        triggerOffsetMinutes: 0,
      },
      createdAt: Date.now() - 14400000,
      updatedAt: Date.now() - 14400000,
    },
  ];
}

export function loadActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = getInitialActivities();
      saveActivities(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Falha ao carregar atividades do localStorage:', e);
    return getInitialActivities();
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
