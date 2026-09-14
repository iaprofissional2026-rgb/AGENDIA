import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Volume2,
  Bell,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  userProfile: UserProfile | null;
  isLoggingIn: boolean;
  onLoginGoogle: () => void;
  onLogoutGoogle: () => void;
  onOpenNewActivityModal: () => void;
  onOpenAlarmSettings: () => void;
  onSyncGoogleCalendar: () => void;
  isSyncing: boolean;
  activitiesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  isLoggingIn,
  onLoginGoogle,
  onLogoutGoogle,
  onOpenNewActivityModal,
  onOpenAlarmSettings,
  onSyncGoogleCalendar,
  isSyncing,
  activitiesCount,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDate(
        now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-2xs">
              <CalendarIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs sm:text-base font-bold text-slate-900 tracking-tight">
                  Agendador
                </span>
                <span className="hidden xs:inline text-xs sm:text-base font-bold text-slate-900 tracking-tight">
                  de Atividades
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Alarme Sonoro
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium capitalize truncate max-w-[130px] sm:max-w-none">
                {currentDate} • <span className="font-mono text-slate-700">{currentTime}</span>
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Alarm Sound Studio Quick Access */}
            <button
              id="btn-open-alarm-settings"
              onClick={onOpenAlarmSettings}
              title="Configurações e Teste de Alarme Sonoro"
              className="inline-flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="hidden md:inline">Testar Alarmes</span>
            </button>

            {/* Google Calendar Auth Control */}
            {userProfile ? (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <button
                  id="btn-sync-calendar"
                  onClick={onSyncGoogleCalendar}
                  disabled={isSyncing}
                  title="Sincronizar com Google Calendar"
                  className="inline-flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden lg:inline">Sincronizar</span>
                </button>

                <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-slate-200">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt={userProfile.displayName || 'Usuário'}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-slate-300 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-medium text-slate-900 truncate max-w-[120px]">
                      {userProfile.displayName || userProfile.email}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Google Calendar
                    </p>
                  </div>
                  <button
                    id="btn-logout-google"
                    onClick={onLogoutGoogle}
                    title="Desconectar do Google Calendar"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-login-google"
                onClick={onLoginGoogle}
                disabled={isLoggingIn}
                className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-all disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden sm:inline">{isLoggingIn ? 'Conectando...' : 'Google Calendar'}</span>
                <span className="sm:hidden">{isLoggingIn ? '...' : 'Google'}</span>
              </button>
            )}

            {/* Create Activity Button */}
            <button
              id="btn-create-activity"
              onClick={onOpenNewActivityModal}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Nova Atividade</span>
              <span className="xs:hidden">Nova</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
