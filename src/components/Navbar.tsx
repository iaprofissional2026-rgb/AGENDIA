import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Volume2,
  LogOut,
  RefreshCw,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { UserProfile } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  userProfile: UserProfile | null;
  isLoggingIn: boolean;
  isOnline: boolean;
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
  isOnline,
  onLoginGoogle,
  onLogoutGoogle,
  onOpenNewActivityModal,
  onOpenAlarmSettings,
  onSyncGoogleCalendar,
  isSyncing,
}) => {
  const { config } = useTheme();
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
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 shrink-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${config.primaryBtn} flex items-center justify-center text-white shadow-md`}>
              <CalendarIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs sm:text-base font-bold text-white tracking-tight">
                  Agendador
                </span>
                <span className="hidden xs:inline text-xs sm:text-base font-bold text-white tracking-tight">
                  Pro
                </span>
                <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.badge}`}>
                  Agenda & Alarme
                </span>
                {/* Online / Offline status badge */}
                {!isOnline ? (
                  <span
                    title="Modo offline ativo: suas atividades e alarmes continuam funcionando normalmente no aparelho."
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30"
                  >
                    <WifiOff className="w-2.5 h-2.5" />
                    Offline
                  </span>
                ) : (
                  <span
                    title="Conectado à internet"
                    className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                  >
                    <Wifi className="w-2.5 h-2.5" />
                    Online
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium capitalize truncate max-w-[120px] sm:max-w-none">
                {currentDate} • <span className="font-mono text-slate-300">{currentTime}</span>
              </p>
            </div>
          </div>

          {/* Center / Right controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            
            {/* Theme Selector Pill */}
            <ThemeSelector />

            {/* Alarm Sound Studio Quick Access */}
            <button
              id="btn-open-alarm-settings"
              type="button"
              onClick={onOpenAlarmSettings}
              title="Ajustes de Som, Músicas do Celular e Teste"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-lg text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="hidden md:inline">Músicas & Alarme</span>
            </button>

            {/* Google Login / Account Control */}
            {userProfile ? (
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {isOnline && (
                  <button
                    id="btn-sync-calendar"
                    type="button"
                    onClick={onSyncGoogleCalendar}
                    disabled={isSyncing}
                    title="Sincronizar eventos do Google Calendar"
                    className="inline-flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden lg:inline">Sincronizar</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 pl-1 border-l border-slate-800">
                  <div className="relative">
                    {userProfile.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt={userProfile.displayName || 'Usuário'}
                        className="w-7 h-7 rounded-full border border-slate-700 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 font-bold flex items-center justify-center text-xs border border-slate-700">
                        {(userProfile.displayName || userProfile.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    {/* Status dot: Green for online, Amber for offline */}
                    <span
                      title={isOnline ? 'Online - Conta conectada' : 'Offline - Sessão Google salva no aparelho'}
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                        isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>

                  <span className="hidden xl:inline text-xs font-medium text-slate-300 max-w-[110px] truncate">
                    {userProfile.displayName || userProfile.email?.split('@')[0]}
                  </span>

                  <button
                    id="btn-logout-google"
                    type="button"
                    onClick={onLogoutGoogle}
                    title="Desconectar conta Google"
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-login-google"
                type="button"
                onClick={onLoginGoogle}
                disabled={isLoggingIn}
                title={isOnline ? 'Fazer login com a Conta Google' : 'Conecte-se à internet para o primeiro login'}
                className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span className="hidden xs:inline">{isLoggingIn ? 'Entrando...' : 'Entrar com Google'}</span>
                <span className="xs:hidden">{isLoggingIn ? '...' : 'Entrar'}</span>
              </button>
            )}

            {/* Create Activity Button */}
            <button
              id="btn-create-activity"
              type="button"
              onClick={onOpenNewActivityModal}
              className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer ${config.primaryBtn}`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Agendar</span>
              <span className="xs:hidden">+</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
