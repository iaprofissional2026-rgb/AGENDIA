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
  testAlarmSound: (type: Activity['alarm']['soundType'], volume?: number, customAudioId?: string) => void;
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

  // Listen for actions sent from ServiceWorker or notification clicks
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleWorkerMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'NOTIFICATION_ACTION') {
          const { action, activityId } = event.data;
          if (action === 'stop' && activityId) {
            dismissAlarm(activityId);
          } else if (action === 'snooze' && activityId) {
            snoozeAlarm(activityId, 5);
          }
        }
      };

      navigator.serviceWorker.addEventListener('message', handleWorkerMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleWorkerMessage);
      };
    }
  }, [dismissAlarm, snoozeAlarm]);

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

          // Start continuous alarm with Android Media Notification Bar & Lock Screen controls
          startContinuousAlarm({
            type: act.alarm.soundType,
            volume: act.alarm.volume ?? 0.85,
            customAudioId: act.alarm.customAudioId,
            title: act.title,
            category: act.category,
            onStop: () => dismissAlarm(act.id),
            onSnooze: () => snoozeAlarm(act.id, 5),
          });

          // Show Rich System Notification with interactive action buttons (Parar / Adiar)
          if ('Notification' in window && Notification.permission === 'granted') {
            try {
              const notifOptions: NotificationOptions & {
                renotify?: boolean;
                vibrate?: number[];
                actions?: Array<{ action: string; title: string }>;
              } = {
                body: `⏰ Hora da sua atividade: ${act.startTime} (${act.category})\n${act.description || 'Toque para gerenciar o alarme.'}`,
                icon: '/pwa-192x192.png',
                badge: '/pwa-192x192.png',
                tag: `alarm-${act.id}`,
                requireInteraction: true,
                renotify: true,
                vibrate: [600, 300, 600, 300, 600, 300, 1000],
                data: {
                  activityId: act.id,
                },
                // Action buttons for Android notification bar
                actions: [
                  { action: 'stop', title: '⏹ Parar Alarme' },
                  { action: 'snooze', title: '💤 Adiar 5 Minutos' },
                ],
              };

              if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then((reg) => {
                  reg.showNotification(`⏰ ALARME: ${act.title}`, notifOptions);
                }).catch(() => {
                  new Notification(`⏰ ALARME: ${act.title}`, notifOptions);
                });
              } else {
                new Notification(`⏰ ALARME: ${act.title}`, notifOptions);
              }
            } catch (e) {
              console.warn('Notification error:', e);
            }
          }
          break; // Trigger one alarm modal at a time
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [activities, dismissAlarm, snoozeAlarm]);

  const testAlarmSound = useCallback(
    (type: Activity['alarm']['soundType'], volume: number = 0.8, customAudioId?: string) => {
      unlockAudioContext();
      playSound(type, volume, customAudioId);
    },
    []
  );

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
