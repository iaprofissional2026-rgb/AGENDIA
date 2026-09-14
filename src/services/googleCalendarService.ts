import { Activity, GoogleCalendarEvent } from '../types';

const BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo';
  } catch {
    return 'UTC';
  }
}

function formatDateTimeForGoogle(dateStr: string, timeStr: string): string {
  // Create a local Date object
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0);

  // Return RFC3339 with timezone offset
  const pad = (n: number) => String(n).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffset = Math.abs(offsetMinutes);
  const offsetHours = pad(Math.floor(absOffset / 60));
  const offsetMins = pad(absOffset % 60);
  const timezoneStr = `${sign}${offsetHours}:${offsetMins}`;

  return `${year}-${pad(month)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00${timezoneStr}`;
}

export async function listGoogleCalendarEvents(
  accessToken: string,
  timeMin?: string,
  timeMax?: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const response = await fetch(`${BASE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Falha ao buscar eventos: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  return (data.items || []) as GoogleCalendarEvent[];
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  activity: Activity
): Promise<GoogleCalendarEvent> {
  const timeZone = getLocalTimezone();
  const startDateTime = formatDateTimeForGoogle(activity.date, activity.startTime);
  const endDateTime = formatDateTimeForGoogle(activity.date, activity.endTime || activity.startTime);

  const reminderMinutes = activity.alarm.enabled ? activity.alarm.triggerOffsetMinutes : 10;

  const eventPayload = {
    summary: activity.title,
    description: `${activity.description || ''}\n\n[Agendado via Agendador de Atividades - Categoria: ${activity.category}, Prioridade: ${activity.priority.toUpperCase()}]`,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: 'popup',
          minutes: reminderMinutes,
        },
      ],
    },
  };

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Falha ao criar evento no Google Calendar: ${response.statusText}`;
    throw new Error(message);
  }

  return (await response.json()) as GoogleCalendarEvent;
}

export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  activity: Activity
): Promise<GoogleCalendarEvent> {
  const timeZone = getLocalTimezone();
  const startDateTime = formatDateTimeForGoogle(activity.date, activity.startTime);
  const endDateTime = formatDateTimeForGoogle(activity.date, activity.endTime || activity.startTime);

  const reminderMinutes = activity.alarm.enabled ? activity.alarm.triggerOffsetMinutes : 10;

  const eventPayload = {
    summary: activity.title,
    description: `${activity.description || ''}\n\n[Atualizado via Agendador de Atividades - Categoria: ${activity.category}, Prioridade: ${activity.priority.toUpperCase()}]`,
    start: {
      dateTime: startDateTime,
      timeZone,
    },
    end: {
      dateTime: endDateTime,
      timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        {
          method: 'popup',
          minutes: reminderMinutes,
        },
      ],
    },
  };

  const response = await fetch(`${BASE_URL}/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Falha ao atualizar evento no Google Calendar: ${response.statusText}`;
    throw new Error(message);
  }

  return (await response.json()) as GoogleCalendarEvent;
}

export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Falha ao excluir evento do Google Calendar: ${response.statusText}`;
    throw new Error(message);
  }
}
