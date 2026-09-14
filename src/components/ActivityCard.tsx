import React from 'react';
import {
  Clock,
  CheckCircle2,
  Circle,
  Bell,
  BellOff,
  Edit2,
  Trash2,
  ExternalLink,
  Play,
  Volume2,
} from 'lucide-react';
import { Activity, CategoryType } from '../types';
import { SOUND_LABELS } from '../services/soundService';

interface ActivityCardProps {
  activity: Activity;
  onToggleStatus: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onTestSound: (soundType: Activity['alarm']['soundType'], volume?: number) => void;
}

const CATEGORY_STYLES: Record<CategoryType, { bg: string; text: string; border: string }> = {
  Trabalho: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Estudo: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Saúde: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Lazer: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Pessoal: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Outro: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  onToggleStatus,
  onEdit,
  onDelete,
  onTestSound,
}) => {
  const isDone = activity.status === 'concluida';
  const categoryStyle = CATEGORY_STYLES[activity.category] || CATEGORY_STYLES.Outro;
  const soundLabel = SOUND_LABELS[activity.alarm.soundType]?.name || 'Alarme';

  const formatOffset = (mins: number) => {
    if (mins === 0) return 'No horário';
    if (mins < 60) return `${mins}m antes`;
    return '1h antes';
  };

  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-200 p-3 sm:p-4 hover:shadow-md ${
        isDone
          ? 'border-slate-200 bg-slate-50/50 opacity-75'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        {/* Checkbox status toggle */}
        <button
          onClick={() => onToggleStatus(activity)}
          title={isDone ? 'Reabrir atividade' : 'Marcar como concluída'}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 p-0.5"
        >
          {isDone ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : (
            <Circle className="w-5 h-5 hover:scale-110 transition-transform" />
          )}
        </button>

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-1.5 mb-1">
            {/* Category tag */}
            <span
              className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-semibold border ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border}`}
            >
              {activity.category}
            </span>

            {/* Priority dot */}
            <span
              className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium ${
                activity.priority === 'alta'
                  ? 'text-rose-600'
                  : activity.priority === 'media'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activity.priority === 'alta'
                    ? 'bg-rose-500'
                    : activity.priority === 'media'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
              {activity.priority === 'alta' ? 'Alta' : activity.priority === 'media' ? 'Média' : 'Baixa'}
            </span>

            {/* Google Calendar sync tag */}
            {activity.googleCalendarEventId && (
              <span
                title="Sincronizado com Google Calendar"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Google
                {activity.googleCalendarLink && (
                  <a
                    href={activity.googleCalendarLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5 inline" />
                  </a>
                )}
              </span>
            )}
          </div>

          <h3
            className={`text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words ${
              isDone ? 'line-through text-slate-500' : ''
            }`}
          >
            {activity.title}
          </h3>

          {activity.description && (
            <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 sm:mt-1 line-clamp-2 break-words">
              {activity.description}
            </p>
          )}

          {/* Time & Alarm info footer */}
          <div className="flex items-center flex-wrap gap-x-2 sm:gap-x-4 gap-y-1 mt-2 pt-2 border-t border-slate-100 text-[11px] sm:text-xs text-slate-600">
            {/* Schedule time */}
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
              {activity.startTime} {activity.endTime ? `- ${activity.endTime}` : ''}
            </span>

            {/* Alarm indicator */}
            {activity.alarm.enabled ? (
              <div className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md bg-indigo-50/80 text-indigo-700 text-[10px] sm:text-[11px] font-medium border border-indigo-100">
                <Bell className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">{soundLabel} ({formatOffset(activity.alarm.triggerOffsetMinutes)})</span>
                <button
                  type="button"
                  onClick={() => onTestSound(activity.alarm.soundType, activity.alarm.volume)}
                  title="Testar som deste alarme"
                  className="p-0.5 hover:text-indigo-900 rounded transition-colors"
                >
                  <Play className="w-2.5 h-2.5 fill-indigo-600" />
                </button>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400">
                <BellOff className="w-3 h-3" />
                Sem alarme
              </span>
            )}

            {activity.alarm.snoozedUntil && Date.now() < activity.alarm.snoozedUntil && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] sm:text-[10px] font-semibold border border-amber-200">
                Adiado até {new Date(activity.alarm.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-0.5 shrink-0 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(activity)}
            title="Editar Atividade"
            className="p-1.5 sm:p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(activity)}
            title="Excluir Atividade"
            className="p-1.5 sm:p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
