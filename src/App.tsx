import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CalendarTimeline } from './components/CalendarTimeline';
import { ActivityModal } from './components/ActivityModal';
import { ActiveAlarmModal } from './components/ActiveAlarmModal';
import { AlarmSettingsModal } from './components/AlarmSettingsModal';
import { ConfirmDestructiveModal } from './components/ConfirmDestructiveModal';
import { PWAInstallModal } from './components/PWAInstallModal';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Activity, GoogleCalendarEvent, UserProfile, AlarmSoundType } from './types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  loadCachedAccessToken,
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

function AppContent() {
  const { config, isFeminino, isMasculino } = useTheme();

  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isAlarmSettingsOpen, setIsAlarmSettingsOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);

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
    triggerTestSimulation,
    requestNotificationPermission,
    notificationsAllowed,
  } = useAlarmManager(activities, handleUpdateActivity);

  // Sync Google Calendar events
  const fetchGoogleEvents = useCallback(async (token: string) => {
    if (!navigator.onLine) return;
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
      console.warn('Aviso ao sincronizar eventos do Google Calendar:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Sync any pending activities when online
  const syncPendingActivities = useCallback(async (token: string) => {
    if (!navigator.onLine) return;
    setActivities((prev) => {
      const pending = prev.filter((a) => a.syncPending);
      if (pending.length === 0) return prev;

      (async () => {
        let updatedCount = 0;
        const updatedList = [...prev];
        for (const act of pending) {
          try {
            const evt = await createGoogleCalendarEvent(token, act);
            if (evt) {
              const idx = updatedList.findIndex((item) => item.id === act.id);
              if (idx !== -1) {
                updatedList[idx] = {
                  ...updatedList[idx],
                  googleCalendarEventId: evt.id,
                  googleCalendarLink: evt.htmlLink,
                  syncPending: false,
                  updatedAt: Date.now(),
                };
                updatedCount++;
              }
            }
          } catch {
            // will retry next sync
          }
        }
        if (updatedCount > 0) {
          setActivities(updatedList);
          saveActivities(updatedList);
          showToast(`${updatedCount} atividade(s) sincronizada(s) com o Google Calendar!`, 'success');
        }
      })();

      return prev;
    });
  }, [showToast]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Conexão restabelecida! Online e sincronizado.', 'success');
      const token = loadCachedAccessToken();
      if (token) {
        fetchGoogleEvents(token);
        syncPendingActivities(token);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast(
        'Você está offline. O aplicativo, temas, músicas e alarmes continuam funcionando 100% no seu aparelho.',
        'info'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchGoogleEvents, syncPendingActivities, showToast]);

  // Init Firebase Auth (with offline support)
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setUserProfile({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        });
        if (token && navigator.onLine) {
          fetchGoogleEvents(token);
          syncPendingActivities(token);
        }
      },
      () => {
        setUserProfile(null);
        setGoogleEvents([]);
      }
    );
    return () => unsubscribe();
  }, [fetchGoogleEvents, syncPendingActivities]);

  // Request notifications and unlock audio on initial user touch
  useEffect(() => {
    const handleInitialTouch = () => {
      unlockAudioContext();
      setAudioUnlocked(true);
      window.removeEventListener('click', handleInitialTouch);
      window.removeEventListener('touchstart', handleInitialTouch);
    };

    window.addEventListener('click', handleInitialTouch);
    window.addEventListener('touchstart', handleInitialTouch);

    return () => {
      window.removeEventListener('click', handleInitialTouch);
      window.removeEventListener('touchstart', handleInitialTouch);
    };
  }, []);

  // Manual Google Calendar Login
  const handleLoginGoogle = async () => {
    if (!navigator.onLine) {
      showToast(
        'Você está offline no momento. Conecte-se à internet para realizar o primeiro login com a conta Google.',
        'info'
      );
      return;
    }
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (!result) {
        // User closed popup
        return;
      }
      const { user, accessToken, profile } = result;
      setUserProfile(profile);
      if (accessToken) {
        await fetchGoogleEvents(accessToken);
        await syncPendingActivities(accessToken);
      }
      showToast(`Bem-vindo, ${profile.displayName || profile.email || 'Usuário'}! Login realizado com sucesso.`, 'success');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (
        errorMessage.includes('auth/popup-closed-by-user') ||
        errorMessage.includes('popup-closed') ||
        errorMessage.includes('cancelled-popup-request')
      ) {
        // User closed the popup, silent
      } else {
        showToast(`Erro ao autenticar com o Google: ${errorMessage}`, 'error');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout Google
  const handleLogoutGoogle = async () => {
    try {
      await logoutGoogle();
      setUserProfile(null);
      setGoogleEvents([]);
      showToast('Desconectado do Google Calendar.', 'info');
    } catch {
      showToast('Erro ao desconectar.', 'error');
    }
  };

  // Manual Sync
  const handleManualSync = async () => {
    const token = await (await import('./services/firebaseAuth')).getAccessToken();
    if (!token) {
      showToast('Faça login com sua conta Google primeiro.', 'info');
      return;
    }
    await fetchGoogleEvents(token);
    showToast('Eventos do Google Calendar sincronizados!', 'success');
  };

  // Toggle activity status
  const handleToggleStatus = (activity: Activity) => {
    const newStatus = activity.status === 'concluida' ? 'pendente' : 'concluida';
    const updated: Activity = {
      ...activity,
      status: newStatus,
      updatedAt: Date.now(),
    };

    setActivities((prev) => {
      const next = prev.map((a) => (a.id === updated.id ? updated : a));
      saveActivities(next);
      return next;
    });

    showToast(
      newStatus === 'concluida'
        ? `Atividade "${activity.title}" marcada como concluída!`
        : `Atividade "${activity.title}" reaberta.`,
      'success'
    );
  };

  // Open modal for new activity
  const handleOpenNewModal = () => {
    setEditingActivity(null);
    setIsActivityModalOpen(true);
  };

  // Open modal for editing
  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
    setIsActivityModalOpen(true);
  };

  // Confirm delete activity
  const handleDeleteActivity = (activity: Activity) => {
    setConfirmModal({
      isOpen: true,
      actionType: 'delete',
      activity,
    });
  };

  // Execute Destructive Action
  const handleConfirmDestructiveAction = async () => {
    const { actionType, activity, pendingUpdateData } = confirmModal;
    if (!activity) return;

    setIsProcessingDestructive(true);

    try {
      if (actionType === 'delete') {
        if (activity.googleCalendarEventId) {
          const token = await (await import('./services/firebaseAuth')).getAccessToken();
          if (token) {
            try {
              await deleteGoogleCalendarEvent(token, activity.googleCalendarEventId);
            } catch (e) {
              console.warn('Google event delete skipped/failed:', e);
            }
          }
        }

        setActivities((prev) => {
          const next = prev.filter((a) => a.id !== activity.id);
          saveActivities(next);
          return next;
        });

        showToast(`Atividade "${activity.title}" excluída com sucesso.`, 'success');
      } else if (actionType === 'update' && pendingUpdateData) {
        let googleEvent: GoogleCalendarEvent | null = null;
        if (activity.googleCalendarEventId) {
          const token = await (await import('./services/firebaseAuth')).getAccessToken();
          if (token) {
            try {
              googleEvent = await updateGoogleCalendarEvent(
                token,
                activity.googleCalendarEventId,
                {
                  ...activity,
                  ...pendingUpdateData,
                }
              );
            } catch (e) {
              console.warn('Google event update failed:', e);
            }
          }
        }

        const updatedActivity: Activity = {
          ...activity,
          ...pendingUpdateData,
          googleCalendarEventId: googleEvent?.id || activity.googleCalendarEventId,
          googleCalendarLink: googleEvent?.htmlLink || activity.googleCalendarLink,
          updatedAt: Date.now(),
        };

        setActivities((prev) => {
          const next = prev.map((a) => (a.id === updatedActivity.id ? updatedActivity : a));
          saveActivities(next);
          return next;
        });

        showToast(`Atividade "${updatedActivity.title}" atualizada com sucesso!`, 'success');
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Erro ao processar ação.', 'error');
    } finally {
      setIsProcessingDestructive(false);
      setConfirmModal({ isOpen: false, actionType: 'delete', activity: null });
    }
  };

  // Save or update activity from modal
  const handleSaveActivity = async (
    activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>,
    syncToGoogle: boolean
  ) => {
    if (editingActivity) {
      if (editingActivity.googleCalendarEventId) {
        setConfirmModal({
          isOpen: true,
          actionType: 'update',
          activity: editingActivity,
          pendingUpdateData: activityData,
        });
        return;
      }

      const updatedActivity: Activity = {
        ...editingActivity,
        ...activityData,
        updatedAt: Date.now(),
      };

      setActivities((prev) => {
        const next = prev.map((a) => (a.id === updatedActivity.id ? updatedActivity : a));
        saveActivities(next);
        return next;
      });

      showToast(`Atividade "${updatedActivity.title}" atualizada com sucesso!`, 'success');
    } else {
      let googleEvent: GoogleCalendarEvent | null = null;
      if (syncToGoogle && userProfile) {
        const token = await (await import('./services/firebaseAuth')).getAccessToken();
        if (token) {
          try {
            googleEvent = await createGoogleCalendarEvent(
              token,
              {
                ...activityData,
                id: 'temp',
                createdAt: Date.now(),
                updatedAt: Date.now(),
              }
            );
          } catch (e) {
            console.warn('Falha ao criar evento no Google Calendar:', e);
            showToast('Aviso: Atividade salva localmente, falha no Google Calendar.', 'info');
          }
        }
      }

      const newActivity: Activity = {
        ...activityData,
        id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        googleCalendarEventId: googleEvent?.id || undefined,
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

  // Trigger test simulation without creating fake activities
  const handleTriggerTestAlarm = (
    soundType: AlarmSoundType,
    volume: number,
    customAudioId?: string
  ) => {
    setIsAlarmSettingsOpen(false);
    triggerTestSimulation(soundType, volume, customAudioId);
  };

  return (
    <div
      className={`min-h-screen ${
        isFeminino ? 'bg-[#150a12] text-rose-100' : 'bg-slate-950 text-slate-100'
      } flex flex-col font-sans transition-colors duration-300`}
    >
      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile}
        isLoggingIn={isLoggingIn}
        isOnline={isOnline}
        onLoginGoogle={handleLoginGoogle}
        onLogoutGoogle={handleLogoutGoogle}
        onOpenNewActivityModal={handleOpenNewModal}
        onOpenAlarmSettings={() => setIsAlarmSettingsOpen(true)}
        onSyncGoogleCalendar={handleManualSync}
        isSyncing={isSyncing}
        activitiesCount={activities.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 lg:px-8 py-3.5 sm:py-5">
        {/* Offline notification banner if offline */}
        {!isOnline && (
          <div className="mb-3 p-2.5 sm:p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <span>
                <strong>Modo Offline Ativo:</strong> Suas atividades, horários e alarmes continuam tocando normalmente no aparelho.
                {userProfile && ' Sua conta Google continua conectada localmente.'}
              </span>
            </div>
          </div>
        )}

        {/* Unlocked audio banner if needed */}
        {!audioUnlocked && (
          <div className="mb-3 p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>Áudio do Dispositivo:</strong> Toque para liberar o sintetizador e reprodutor de músicas do celular.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                unlockAudioContext();
                setAudioUnlocked(true);
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 cursor-pointer ${config.primaryBtn}`}
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
      <footer className="bg-slate-950 border-t border-slate-800/80 py-3 text-center text-xs text-slate-500">
        <p className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-2">
          <span>Agendador de Atividades Pro</span>
          <span>•</span>
          <span>Google Calendar API & Sintetizador de Alarme</span>
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
        onOpenPwaModal={() => setIsPwaModalOpen(true)}
      />

      <PWAInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
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
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in max-w-sm">
          <div
            className={`px-3.5 py-2.5 rounded-xl shadow-xl border text-xs font-semibold flex items-center space-x-2 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950 text-emerald-100 border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-rose-950 text-rose-100 border-rose-700'
                : 'bg-slate-900 text-slate-100 border-slate-700'
            }`}
          >
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span className="leading-tight">{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
