import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Volume2,
  Calendar,
  Clock,
  Tag,
  Play,
  Check,
  Timer,
  Edit3,
} from 'lucide-react';
import { Activity, AlarmSoundType, CategoryType, PriorityType, StatusType } from '../types';
import { SOUND_LABELS, playSound, unlockAudioContext } from '../services/soundService';
import { PomodoroTimer } from './PomodoroTimer';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>, syncToGoogle: boolean) => Promise<void>;
  initialActivity?: Activity | null;
  selectedDate?: string;
  isGoogleConnected: boolean;
  onConnectGoogle?: () => void;
  onMarkActivityCompleted?: (activityId: string) => void;
}

const CATEGORIES: CategoryType[] = ['Trabalho', 'Estudo', 'Saúde', 'Lazer', 'Pessoal', 'Outro'];
const PRIORITIES: { value: PriorityType; label: string; color: string }[] = [
  { value: 'baixa', label: 'Baixa', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'media', label: 'Média', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'alta', label: 'Alta', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const OFFSET_OPTIONS = [
  { value: 0, label: 'No momento exato' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
];

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialActivity,
  selectedDate,
  isGoogleConnected,
  onConnectGoogle,
  onMarkActivityCompleted,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<CategoryType>('Trabalho');
  const [priority, setPriority] = useState<PriorityType>('media');
  const [status, setStatus] = useState<StatusType>('pendente');

  // Alarm settings
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [soundType, setSoundType] = useState<AlarmSoundType>('chime');
  const [volume, setVolume] = useState(0.8);
  const [triggerOffsetMinutes, setTriggerOffsetMinutes] = useState(5);

  // Google Calendar sync toggle
  const [syncToGoogle, setSyncToGoogle] = useState(isGoogleConnected);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active tab inside modal: 'details' or 'pomodoro'
  const [activeTab, setActiveTab] = useState<'details' | 'pomodoro'>('details');

  useEffect(() => {
    if (initialActivity) {
      setTitle(initialActivity.title);
      setDescription(initialActivity.description || '');
      setDate(initialActivity.date);
      setStartTime(initialActivity.startTime);
      setEndTime(initialActivity.endTime || '');
      setCategory(initialActivity.category);
      setPriority(initialActivity.priority);
      setStatus(initialActivity.status);
      setAlarmEnabled(initialActivity.alarm.enabled);
      setSoundType(initialActivity.alarm.soundType);
      setVolume(initialActivity.alarm.volume ?? 0.8);
      setTriggerOffsetMinutes(initialActivity.alarm.triggerOffsetMinutes ?? 5);
      setSyncToGoogle(Boolean(initialActivity.googleCalendarEventId || (isGoogleConnected && initialActivity.googleCalendarSync)));
    } else {
      const todayStr = selectedDate || new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setDate(todayStr);

      const now = new Date();
      now.setHours(now.getHours() + 1);
      const startH = String(now.getHours()).padStart(2, '0');
      setStartTime(`${startH}:00`);

      now.setHours(now.getHours() + 1);
      const endH = String(now.getHours()).padStart(2, '0');
      setEndTime(`${endH}:00`);

      setCategory('Trabalho');
      setPriority('media');
      setStatus('pendente');
      setAlarmEnabled(true);
      setSoundType('chime');
      setVolume(0.8);
      setTriggerOffsetMinutes(5);
      setSyncToGoogle(isGoogleConnected);
    }
    setActiveTab('details');
    setErrorMsg('');
  }, [initialActivity, selectedDate, isOpen, isGoogleConnected]);

  if (!isOpen) return null;

  const handleTestSound = (typeToTest: AlarmSoundType) => {
    unlockAudioContext();
    playSound(typeToTest, volume);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('O título da atividade é obrigatório.');
      return;
    }

    if (!date || !startTime) {
      setErrorMsg('Por favor informe a data e o horário de início.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      await onSave(
        {
          title: title.trim(),
          description: description.trim(),
          date,
          startTime,
          endTime,
          category,
          priority,
          status,
          alarm: {
            enabled: alarmEnabled,
            soundType,
            volume,
            triggerOffsetMinutes,
            dismissed: false,
          },
          googleCalendarSync: syncToGoogle,
        },
        syncToGoogle
      );
      onClose();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : 'Ocorreu um erro ao salvar a atividade.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 sm:my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {initialActivity ? 'Editar Atividade' : 'Agendar Nova Atividade'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Preencha os detalhes e configure o alarme sonoro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Details vs Pomodoro Timer) */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-3.5 sm:px-6 pt-1.5 sm:pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Detalhes & Alarme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pomodoro')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pomodoro'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Timer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pomodoro</span>
            <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-700">
              Foco
            </span>
          </button>
        </div>

        {/* Pomodoro View Tab */}
        {activeTab === 'pomodoro' ? (
          <div className="p-3.5 sm:p-6 space-y-3 sm:space-y-4 max-h-[80vh] overflow-y-auto">
            <PomodoroTimer
              activityTitle={title || initialActivity?.title || 'Atividade'}
              onCompleteActivity={
                initialActivity && onMarkActivityCompleted
                  ? () => {
                      onMarkActivityCompleted(initialActivity.id);
                      onClose();
                    }
                  : undefined
              }
            />
            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form Body */
          <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-5 max-h-[80vh] sm:max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-2.5 sm:p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Título da Atividade *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reunião, Treino, Estudo..."
              className="w-full px-3 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Início *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Término
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
                Prioridade
              </label>
              <div className="grid grid-cols-3 gap-1">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={`py-1 px-1.5 text-[11px] font-semibold rounded-lg border text-center transition-all ${
                      priority === p.value
                        ? 'ring-2 ring-indigo-600 font-bold ' + p.color
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] sm:text-xs font-semibold text-slate-700 mb-1">
              Descrição ou Notas (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione tópicos, links ou instruções relevantes..."
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* POMODORO QUICK LAUNCH BANNER */}
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between p-2.5 sm:p-3.5 rounded-xl border border-indigo-200 bg-linear-to-r from-indigo-50 via-white to-indigo-50/50 gap-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Timer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Ciclo de Foco Pomodoro
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Temporizador com avisos sonoros
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('pomodoro')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors shrink-0 self-end xs:self-auto"
            >
              <Timer className="w-3.5 h-3.5" />
              Iniciar Foco
            </button>
          </div>

          {/* ALARM CONFIGURATION BOX */}
          <div className="border border-indigo-100 rounded-xl p-3 sm:p-4 bg-indigo-50/40 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900">Alarme Sonoro</span>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">Toque de áudio sintetizado no navegador</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={alarmEnabled}
                  onChange={(e) => setAlarmEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {alarmEnabled && (
              <div className="space-y-2.5 sm:space-y-3 pt-2 border-t border-indigo-100/70">
                {/* Antecedencia */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-slate-700 mb-1">
                    Disparar Alarme:
                  </label>
                  <select
                    value={triggerOffsetMinutes}
                    onChange={(e) => setTriggerOffsetMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {OFFSET_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sound Type Selection with Play Preview */}
                <div>
                  <label className="block text-[11px] sm:text-xs font-medium text-slate-700 mb-1">
                    Tipo de Som:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                    {(Object.keys(SOUND_LABELS) as AlarmSoundType[]).map((key) => {
                      const item = SOUND_LABELS[key];
                      const isSelected = soundType === key;
                      return (
                        <div
                          key={key}
                          onClick={() => setSoundType(key)}
                          className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/20 shadow-2xs'
                              : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-1.5 min-w-0">
                            <div
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isSelected ? <Check className="w-2.5 h-2.5" /> : null}
                            </div>
                            <div className="text-left min-w-0">
                              <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                                {item.name}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-none truncate">
                                {item.description}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestSound(key);
                            }}
                            title="Ouvir demonstração"
                            className="p-1 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors shrink-0 ml-1"
                          >
                            <Play className="w-3 h-3 fill-indigo-600" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Volume Slider */}
                <div>
                  <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-slate-700 mb-1">
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-indigo-600" />
                      Volume: {Math.round(volume * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTestSound(soundType)}
                      className="text-[10px] sm:text-[11px] text-indigo-600 font-semibold hover:underline"
                    >
                      Testar Volume
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* GOOGLE CALENDAR SYNC SECTION */}
          <div className="border border-slate-200 rounded-xl p-3 sm:p-4 bg-slate-50/60">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Sincronizar com Google
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    Cria ou atualiza evento no Google Calendar
                  </p>
                </div>
              </div>

              {isGoogleConnected ? (
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={syncToGoogle}
                    onChange={(e) => setSyncToGoogle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              ) : (
                <button
                  type="button"
                  onClick={onConnectGoogle}
                  className="px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shrink-0"
                >
                  Conectar
                </button>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Salvando...' : initialActivity ? 'Atualizar' : 'Agendar'}
            </button>
          </div>
        </form>
        )}

      </div>
    </div>
  );
};
