import React from 'react';
import { Bell, Clock, CheckCircle, Pause, Volume2, AlertCircle } from 'lucide-react';
import { Activity } from '../types';
import { SOUND_LABELS } from '../services/soundService';

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
  if (!activity) return null;

  const soundInfo = SOUND_LABELS[activity.alarm.soundType] || SOUND_LABELS.digital;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-xl sm:rounded-2xl shadow-2xl border-2 border-rose-400 overflow-hidden text-center p-4 sm:p-8 animate-in zoom-in-95 duration-200">
        
        {/* Animated pulsing rings behind the icon */}
        <div className="relative mx-auto w-14 h-14 sm:w-20 sm:h-20 mb-3 sm:mb-5 flex items-center justify-center">
          <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"></span>
          <span className="absolute inline-flex h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-rose-200 opacity-90 animate-pulse"></span>
          <div className="relative w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
            <Bell className="w-6 h-6 sm:w-8 sm:h-8 animate-bounce" />
          </div>
        </div>

        {/* Alarm Banner */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-2 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5" />
          Alarme em Andamento
        </div>

        {/* Activity Details */}
        <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight mb-1.5 sm:mb-2">
          {activity.title}
        </h2>

        {activity.description && (
          <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4 line-clamp-2">
            {activity.description}
          </p>
        )}

        {/* Metadata Badges */}
        <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-semibold mb-4 sm:mb-6">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-slate-100 text-slate-700">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
            {activity.startTime} {activity.endTime ? `- ${activity.endTime}` : ''}
          </span>
          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
            {activity.category}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            {soundInfo.name}
          </span>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 sm:space-y-2.5">
          <button
            id="btn-dismiss-alarm"
            onClick={() => onDismiss(activity.id)}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4" />
            Parar Alarme Sonoro
          </button>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <button
              id="btn-snooze-alarm"
              onClick={() => onSnooze(activity.id, 5)}
              className="py-2 sm:py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Adiar 5 min
            </button>

            <button
              id="btn-complete-alarm"
              onClick={() => onComplete(activity.id)}
              className="py-2 sm:py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Concluir
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
