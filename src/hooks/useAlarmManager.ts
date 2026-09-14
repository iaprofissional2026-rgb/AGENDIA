import { useState, useEffect, useRef, useCallback } from 'react';
import { Activity } from '../types';
import {
  startContinuousAlarm,
  stopContinuousAlarm,
  playSound,
  unlockAudioContext,
} from '../services/soundService';

export interface UseAlarmManagerReturn {
  activeAlarmActivity: Activity | null;
  dismissAlarm: (activityId: string) => void;
  snoozeAlarm: (activityId: string, minutes?: number) => void;
  markCompletedAndDismiss: (activityId: string) => void;
  testAlarmSound: (type: Activity['alarm']['soundType'], volume?: number) => void;
  requestNotificationPermission: () => Promise<boolean>;
  notificationsAllowed: boolean;
}

export function useAlarmManager(
  activities: Activity[],
  onUpdateActivity: (updated: Activity) => void
): UseAlarmManagerReturn {
  const [activeAlarmActivity, setActiveAlarmActivity] = useState<Activity | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState<boolean>(false);
  const triggeredIdsRef = useRef<Set<string>>(new Set());

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsAllowed(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  // Main alarm checker ticker
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();

      // Find an activity whose alarm should fire right now
      for (const act of activities) {
        if (!act.alarm.enabled) continue;
        if (act.status === 'concluida') continue;
        if (act.alarm.dismissed) continue;

        // Calculate schedule time
        const [year, month, day] = act.date.split('-').map(Number);
        const [hours, minutes] = act.startTime.split(':').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) continue;

        const scheduledTime = new Date(year, month - 1, day, hours, minutes, 0).getTime();
        const offsetMs = (act.alarm.triggerOffsetMinutes || 0) * 60 * 1000;
        const targetAlarmTime = act.alarm.snoozedUntil || (scheduledTime - offsetMs);

        // Check if triggered time has arrived (within a reasonable window of 2 hours)
        const isDue = now >= targetAlarmTime && (now - targetAlarmTime) < 2 * 60 * 60 * 1000;

        const triggerKey = `${act.id}_${targetAlarmTime}`;

        if (isDue && !triggeredIdsRef.current.has(triggerKey)) {
          // Trigger alarm!
          triggeredIdsRef.current.add(triggerKey);
          setActiveAlarmActivity(act);
          startContinuousAlarm(act.alarm.soundType, act.alarm.volume ?? 0.85);

          // Trigger browser notification if permitted
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              new Notification(`⏰ Alarme: ${act.title}`, {
                body: `Início: ${act.startTime} - Categoria: ${act.category}\n${act.description || 'Hora da sua atividade!'}`,
                icon: '/favicon.ico',
                tag: act.id,
              });
            } catch (e) {
              console.warn('Notification error:', e);
            }
          }
          break; // Trigger one alarm modal at a time
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [activities]);

  const dismissAlarm = useCallback(
    (activityId: string) => {
      stopContinuousAlarm();
      setActiveAlarmActivity(null);

      const target = activities.find((a) => a.id === activityId);
      if (target) {
        onUpdateActivity({
          ...target,
          alarm: {
            ...target.alarm,
            dismissed: true,
            snoozedUntil: undefined,
          },
          updatedAt: Date.now(),
        });
      }
    },
    [activities, onUpdateActivity]
  );

  const snoozeAlarm = useCallback(
    (activityId: string, minutes: number = 5) => {
      stopContinuousAlarm();
      setActiveAlarmActivity(null);

      const target = activities.find((a) => a.id === activityId);
      if (target) {
        const snoozeTarget = Date.now() + minutes * 60 * 1000;
        onUpdateActivity({
          ...target,
          alarm: {
            ...target.alarm,
            snoozedUntil: snoozeTarget,
            dismissed: false,
          },
          updatedAt: Date.now(),
        });
      }
    },
    [activities, onUpdateActivity]
  );

  const markCompletedAndDismiss = useCallback(
    (activityId: string) => {
      stopContinuousAlarm();
      setActiveAlarmActivity(null);

      const target = activities.find((a) => a.id === activityId);
      if (target) {
        onUpdateActivity({
          ...target,
          status: 'concluida',
          alarm: {
            ...target.alarm,
            dismissed: true,
            snoozedUntil: undefined,
          },
          updatedAt: Date.now(),
        });
      }
    },
    [activities, onUpdateActivity]
  );

  const testAlarmSound = useCallback((type: Activity['alarm']['soundType'], volume: number = 0.8) => {
    unlockAudioContext();
    playSound(type, volume);
  }, []);

  return {
    activeAlarmActivity,
    dismissAlarm,
    snoozeAlarm,
    markCompletedAndDismiss,
    testAlarmSound,
    requestNotificationPermission,
    notificationsAllowed,
  };
}
