export type CategoryType = 'Trabalho' | 'Estudo' | 'Saúde' | 'Lazer' | 'Pessoal' | 'Outro';

export type PriorityType = 'baixa' | 'media' | 'alta';

export type StatusType = 'pendente' | 'em_andamento' | 'concluida';

export type BuiltInSoundType = 'digital' | 'chime' | 'melodic' | 'urgent' | 'gong';
export type AlarmSoundType = BuiltInSoundType | 'custom';

export type ThemeMode = 'masculino' | 'feminino' | 'neutro';

export interface CustomAudioTrack {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: number;
  duration?: number;
  blob?: Blob;
}

export interface AlarmConfig {
  enabled: boolean;
  soundType: AlarmSoundType;
  customAudioId?: string;
  customAudioName?: string;
  volume: number; // 0 to 1
  triggerOffsetMinutes: number; // 0 = at time, 5 = 5 min before, etc.
  snoozedUntil?: number; // timestamp ms
  dismissed?: boolean;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: CategoryType;
  priority: PriorityType;
  status: StatusType;
  alarm: AlarmConfig;
  googleCalendarEventId?: string;
  googleCalendarSync?: boolean;
  googleCalendarLink?: string;
  syncPending?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  htmlLink?: string;
  status?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
