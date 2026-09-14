import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarTimeline } from './components/CalendarTimeline';
import { ActivityModal } from './components/ActivityModal';
import { ActiveAlarmModal } from './components/ActiveAlarmModal';
import { AlarmSettingsModal } from './components/AlarmSettingsModal';
import { ConfirmDestructiveModal } from './components/ConfirmDestructiveModal';
import { Activity, GoogleCalendarEvent, UserProfile, AlarmSoundType } from './types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
} from './services/firebaseAuth';
import {
  listGoogleCalendarEvents,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from './services/googleCalendarService';
import { loadActivities, saveActivities } from './services/storageService';
import { useAlarmManager } from './hooks/useAlarmManager';
import { unlockAudioContext } from './services/soundService';
import { Volume2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function App() {
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState<boolean>(false);

  // Destructive Confirmation Modal state (Mandatory for Workspace Integration)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: 'delete' | 'update';
    activity: Activity | null;
    pendingUpdateData?: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>;
  }>({
    isOpen: false,
    actionType: 'delete',
    activity: null,
  });
  const [isProcessingDestructive, setIsProcessingDestructive] = useState<boolean>(false);

  // Audio unlocked state banner
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);

  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  }, []);

  // Update activity callback for Alarm Manager
  const handleUpdateActivity = useCallback((updated: Activity) => {
    setActivities((prev) => {
      const next = prev.map((a) => (a.id === updated.id ? updated : a));
      saveActivities(next);
      return next;
    });
  }, []);

  // Alarm Manager Hook
  const {
    activeAlarmActivity,
    dismissAlarm,
    snoozeAlarm,
    markCompletedAndDismiss,
    testAlarmSound,
    requestNotificationPermission,
    notificationsAllowed,
  } = useAlarmManager(activities, handleUpdateActivity);

  // Sync Google Calendar events
  const fetchGoogleEvents = useCallback(async (token: string) => {
    setIsSyncing(true);
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const timeMin = now.toISOString();

      const future = new Date();
      future.setDate(future.getDate() + 30);
      const timeMax = future.toISOString();

      const events = await listGoogleCalendarEvents(token, timeMin, timeMax);
      setGoogleEvents(events);
    } catch (err) {
      console.error('Erro ao sincronizar eventos do Google Calendar:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Init Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setUserProfile({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        if (token) {
          fetchGoogleEvents(token);
        }
      },
      () => {
        setUserProfile(null);
        setGoogleEvents([]);
      }
    );

    return () => unsubscribe();
  }, [fetchGoogleEvents]);

  // Unlock AudioContext on first user click anywhere
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      setAudioUnlocked(true);
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Login handler
  const handleLoginGoogle = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUserProfile(res.profile);
        showToast('Google Calendar conectado com sucesso!', 'success');
        if (res.accessToken) {
          await fetchGoogleEvents(res.accessToken);
        }
      }
    } catch (err: unknown) {
      console.error('Falha de login Google:', err);
      showToast(
        err instanceof Error ? err.message : 'Falha na autenticação com o Google.',
        'error'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogoutGoogle = async () => {
    try {
      await logoutGoogle();
      setUserProfile(null);
      setGoogleEvents([]);
      showToast('Desconectado do Google Calendar.', 'info');
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  };

  // Manual Sync trigger
  const handleManualSync = async () => {
    const token = await getAccessToken();
    if (token) {
      await fetchGoogleEvents(token);
      showToast('Google Calendar sincronizado!', 'success');
    } else {
      handleLoginGoogle();
    }
  };

  // Toggle activity status
  const handleToggleStatus = (activity: Activity) => {
    const newStatus = activity.status === 'concluida' ? 'pendente' : 'concluida';
    const updated: Activity = {
      ...activity,
      status: newStatus,
      alarm: {
        ...activity.alarm,
        // If re-opened, re-enable alarm if originally configured
        dismissed: newStatus === 'concluida' ? true : false,
      },
      updatedAt: Date.now(),
    };
    handleUpdateActivity(updated);
    showToast(
      newStatus === 'concluida' ? 'Atividade marcada como concluída!' : 'Atividade reaberta.',
      'success'
    );
  };

  // Open Create Modal
  const handleOpenNewModal = () => {
    setEditingActivity(null);
    setIsActivityModalOpen(true);
  };

  // Open Edit Modal
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsActivityModalOpen(true);
  };

  // Delete Request (checks if destructive dialog needed)
  const handleDeleteActivity = (activity: Activity) => {
    // If synced with Google Calendar, must show confirmation dialog as required by skill
    if (activity.googleCalendarEventId) {
      setConfirmModal({
        isOpen: true,
        actionType: 'delete',
        activity,
      });
    } else {
      // Local only delete
      setActivities((prev) => {
        const next = prev.filter((a) => a.id !== activity.id);
        saveActivities(next);
        return next;
      });
      showToast('Atividade excluída.', 'info');
    }
  };

  // Confirm destructive action (Delete or Update in Google Calendar)
  const handleConfirmDestructiveAction = async () => {
    const { actionType, activity, pendingUpdateData } = confirmModal;
    if (!activity) return;

    setIsProcessingDestructive(true);
    const token = await getAccessToken();

    try {
      if (actionType === 'delete') {
        if (activity.googleCalendarEventId && token) {
          try {
            await deleteGoogleCalendarEvent(token, activity.googleCalendarEventId);
          } catch (e) {
            console.warn('Google Calendar delete error:', e);
          }
        }

        setActivities((prev) => {
          const next = prev.filter((a) => a.id !== activity.id);
          saveActivities(next);
          return next;
        });

        showToast('Atividade excluída com sucesso da sua agenda.', 'success');
      } else if (actionType === 'update' && pendingUpdateData) {
        let googleEvent = null;
        if (activity.googleCalendarEventId && token) {
          try {
            googleEvent = await updateGoogleCalendarEvent(token, activity.googleCalendarEventId, {
              ...activity,
              ...pendingUpdateData,
            });
          } catch (e) {
            console.warn('Google Calendar update error:', e);
          }
        }

        const updated: Activity = {
          ...activity,
          ...pendingUpdateData,
          googleCalendarEventId: googleEvent ? googleEvent.id : activity.googleCalendarEventId,
          googleCalendarLink: googleEvent?.htmlLink || activity.googleCalendarLink,
          updatedAt: Date.now(),
        };

        handleUpdateActivity(updated);
        showToast('Atividade e Google Calendar atualizados!', 'success');
      }

      setConfirmModal({ isOpen: false, actionType: 'delete', activity: null });
    } catch (err: unknown) {
      console.error(err);
      showToast('Falha na sincronização com o Google Calendar.', 'error');
    } finally {
      setIsProcessingDestructive(false);
    }
  };

  // Save Activity (Create or Update)
  const handleSaveActivity = async (
    activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>,
    syncToGoogle: boolean
  ) => {
    const token = await getAccessToken();

    if (editingActivity) {
      // Editing existing
      if (editingActivity.googleCalendarEventId && syncToGoogle) {
        // Requires user confirmation dialog before destructive Google Calendar update!
        setConfirmModal({
          isOpen: true,
          actionType: 'update',
          activity: editingActivity,
          pendingUpdateData: activityData,
        });
        return;
      }

      // If user decided to add sync now
      let googleEvent = null;
      if (!editingActivity.googleCalendarEventId && syncToGoogle && token) {
        try {
          const tempAct: Activity = {
            ...editingActivity,
            ...activityData,
          };
          googleEvent = await createGoogleCalendarEvent(token, tempAct);
        } catch (e) {
          console.warn('Erro ao criar evento Google:', e);
        }
      }

      const updated: Activity = {
        ...editingActivity,
        ...activityData,
        googleCalendarEventId: googleEvent ? googleEvent.id : editingActivity.googleCalendarEventId,
        googleCalendarLink: googleEvent?.htmlLink || editingActivity.googleCalendarLink,
        updatedAt: Date.now(),
      };

      handleUpdateActivity(updated);
      showToast('Atividade atualizada com sucesso!', 'success');
    } else {
      // Create new activity
      const newId = 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      let googleEvent = null;

      if (syncToGoogle && token) {
        try {
          const tempAct: Activity = {
            id: newId,
            ...activityData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          googleEvent = await createGoogleCalendarEvent(token, tempAct);
        } catch (err) {
          console.error('Falha ao sincronizar com Google Calendar:', err);
          showToast('Atividade criada localmente, mas não foi possível enviar ao Google Calendar.', 'info');
        }
      }

      const newActivity: Activity = {
        id: newId,
        ...activityData,
        googleCalendarEventId: googleEvent ? googleEvent.id : undefined,
        googleCalendarLink: googleEvent?.htmlLink || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setActivities((prev) => {
        const next = [newActivity, ...prev];
        saveActivities(next);
        return next;
      });

      showToast(
        googleEvent
          ? 'Atividade agendada e sincronizada no Google Calendar!'
          : 'Atividade agendada com alarme configurado!',
        'success'
      );
    }
  };

  // Import event from Google Calendar tab
  const handleImportGoogleEvent = (evt: GoogleCalendarEvent) => {
    const startStr = evt.start?.dateTime || evt.start?.date || '';
    const endStr = evt.end?.dateTime || evt.end?.date || '';

    let date = selectedDate;
    let startTime = '09:00';
    let endTime = '10:00';

    if (startStr) {
      const d = new Date(startStr);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split('T')[0];
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        startTime = `${h}:${m}`;
      }
    }

    if (endStr) {
      const d = new Date(endStr);
      if (!isNaN(d.getTime())) {
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        endTime = `${h}:${m}`;
      }
    }

    // Pre-populate modal
    setEditingActivity({
      id: '',
      title: evt.summary || 'Evento do Google Calendar',
      description: evt.description || '',
      date,
      startTime,
      endTime,
      category: 'Trabalho',
      priority: 'media',
      status: 'pendente',
      alarm: {
        enabled: true,
        soundType: 'chime',
        volume: 0.85,
        triggerOffsetMinutes: 5,
      },
      googleCalendarEventId: evt.id,
      googleCalendarLink: evt.htmlLink,
      googleCalendarSync: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    setIsActivityModalOpen(true);
  };

  // Trigger test simulation
  const handleTriggerTestAlarm = (soundType: AlarmSoundType, volume: number) => {
    setIsAlarmSettingsOpen(false);
    const sampleActivity: Activity = {
      id: 'test_simulation',
      title: 'Teste de Alarme Sonoro',
      description: 'Demonstração do disparo do alarme sonoro configurável.',
      date: new Date().toISOString().split('T')[0],
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      endTime: '',
      category: 'Lazer',
      priority: 'alta',
      status: 'pendente',
      alarm: {
        enabled: true,
        soundType,
        volume,
        triggerOffsetMinutes: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Trigger through the hook
    testAlarmSound(soundType, volume);
    // Open Active Alarm Modal simulation
    // We can update the state to show the modal
    handleUpdateActivity(sampleActivity);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile}
        isLoggingIn={isLoggingIn}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onOpenNewActivityModal={handleOpenNewModal}
        onOpenAlarmSettings={() => setIsAlarmSettingsOpen(true)}
        onSyncGoogleCalendar={handleManualSync}
        isSyncing={isSyncing}
        activitiesCount={activities.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Unlocked audio banner if needed */}
        {!audioUnlocked && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                <strong>Áudio Pronto:</strong> Clique em qualquer ponto da tela para liberar o sintetizador de alarmes sonoros.
              </span>
            </div>
            <button
              onClick={() => {
                unlockAudioContext();
                setAudioUnlocked(true);
              }}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Ativar Som
            </button>
          </div>
        )}

        {/* Calendar and Activities Timeline */}
        <CalendarTimeline
          activities={activities}
          googleEvents={googleEvents}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
          onTestSound={testAlarmSound}
          onOpenNewActivityModal={handleOpenNewModal}
          isGoogleConnected={Boolean(userProfile)}
          onImportGoogleEvent={handleImportGoogleEvent}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <p className="max-w-7xl mx-auto px-4">
          Agendador de Atividades • Sintetizador de Alarme Web Audio e Integração com Google Calendar API
        </p>
      </footer>

      {/* Modals */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
        initialActivity={editingActivity}
        selectedDate={selectedDate}
        isGoogleConnected={Boolean(userProfile)}
        onConnectGoogle={handleLoginGoogle}
        onMarkActivityCompleted={(actId) => {
          const targetAct = activities.find((a) => a.id === actId);
          if (targetAct && targetAct.status !== 'concluida') {
            handleToggleStatus(targetAct);
          }
        }}
      />

      <ActiveAlarmModal
        activity={activeAlarmActivity}
        onDismiss={dismissAlarm}
        onSnooze={snoozeAlarm}
        onComplete={markCompletedAndDismiss}
      />

      <AlarmSettingsModal
        isOpen={isAlarmSettingsOpen}
        onClose={() => setIsAlarmSettingsOpen(false)}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        notificationsAllowed={notificationsAllowed}
        onRequestNotifications={requestNotificationPermission}
      />

      <ConfirmDestructiveModal
        isOpen={confirmModal.isOpen}
        actionType={confirmModal.actionType}
        activityTitle={confirmModal.activity?.title || ''}
        isSyncedWithGoogle={Boolean(confirmModal.activity?.googleCalendarEventId)}
        onConfirm={handleConfirmDestructiveAction}
        onCancel={() => setConfirmModal({ isOpen: false, actionType: 'delete', activity: null })}
        isLoading={isProcessingDestructive}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center space-x-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-900 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

    </div>
  );
}
