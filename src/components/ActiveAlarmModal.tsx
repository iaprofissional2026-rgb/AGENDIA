import React from 'react';
import { Bell, Clock, CheckCircle, Pause, Volume2, AlertCircle, Smartphone } from 'lucide-react';
import { Activity } from '../types';
import { SOUND_LABELS } from '../services/soundService';
import { useTheme } from '../context/ThemeContext';

interface ActiveAlarmModalProps {
  activity: Activity | null;
  onDismiss: (activityId: string) => void;
  onSnooze: (activityId: string, minutes?: number) => void;
  onComplete: (activityId: string) => void;
}

export const ActiveAlarmModal: React.FC<ActiveAlarmModalProps> = ({
  activity,
  onDismiss,
  onSnooze,
  onComplete,
}) => {
  const { config, isFeminino } = useTheme();

  if (!activity) return null;

  const isCustom = activity.alarm.soundType === 'custom';
  const soundName = isCustom
    ? activity.alarm.customAudioName || 'Música do Celular'
    : (SOUND_LABELS[activity.alarm.soundType] || SOUND_LABELS.digital).name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-md bg-gradient-to-b ${config.activeAlarmBg} rounded-2xl shadow-2xl border-2 ${
        isFeminino ? 'border-rose-500/80' : 'border-sky-500/80'
      } overflow-hidden text-center p-5 sm:p-7 text-white`}>
        
        {/* Animated pulsing rings behind the bell icon */}
        <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 mb-3 sm:mb-4 flex items-center justify-center">
          <span className={`absolute inline-flex h-full w-full rounded-full ${
            isFeminino ? 'bg-rose-500' : 'bg-sky-500'
          } opacity-75 animate-ping`}></span>
          <span className={`absolute inline-flex h-12 w-12 sm:h-16 sm:w-16 rounded-full ${
            isFeminino ? 'bg-rose-700' : 'bg-sky-700'
          } opacity-90 animate-pulse`}></span>
          <div className={`relative w-12 h-12 sm:w-16 sm:h-16 rounded-full ${
            isFeminino ? 'bg-rose-600' : 'bg-sky-600'
          } text-white flex items-center justify-center shadow-lg`}>
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
          </div>
        </div>

        {/* Alarm Banner */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider mb-2 border border-white/20">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          Alarme em Andamento
        </div>

        {/* Activity Details */}
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-1">
          {activity.title}
        </h2>

        {activity.description && (
          <p className="text-xs sm:text-sm text-slate-300 mb-3 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold mb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 text-slate-200 border border-white/10">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {activity.startTime} {activity.endTime ? `- ${activity.endTime}` : ''}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">
            {activity.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 text-white border border-white/10">
            <Volume2 className="w-3.5 h-3.5 text-amber-300" />
            {soundName}
          </span>
        </div>

        {/* Notification bar indicator */}
        <div className="mb-4 py-1.5 px-2.5 rounded-lg bg-black/30 border border-white/10 flex items-center justify-center gap-1.5 text-[11px] text-slate-300">
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Ativo também na <strong>Barra de Notificação do Android</strong></span>
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          <button
            id="btn-dismiss-alarm"
            onClick={() => onDismiss(activity.id)}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isFeminino
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                : 'bg-sky-600 hover:bg-sky-500 shadow-sky-950/50'
            }`}
          >
            <Pause className="w-4 h-4" />
            Parar Alarme
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-snooze-alarm"
              onClick={() => onSnooze(activity.id, 5)}
              className="py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Adiar 5 min
            </button>

            <button
              id="btn-complete-alarm"
              onClick={() => onComplete(activity.id)}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Concluir Tarefa
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
