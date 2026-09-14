import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Bell,
  Volume2,
  Calendar,
  Clock,
  Tag,
  Play,
  Square,
  Check,
  Timer,
  Edit3,
  Music,
  Plus,
  Trash2,
} from 'lucide-react';
import { Activity, AlarmSoundType, CategoryType, PriorityType, StatusType, CustomAudioTrack } from '../types';
import { SOUND_LABELS, playSound, unlockAudioContext } from '../services/soundService';
import { getAllCustomTracks, saveCustomTrack, deleteCustomTrack } from '../services/customAudioService';
import { PomodoroTimer } from './PomodoroTimer';
import { useTheme } from '../context/ThemeContext';

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
  const { config, isFeminino, isMasculino } = useTheme();

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
  const [customAudioId, setCustomAudioId] = useState<string | undefined>();
  const [customAudioName, setCustomAudioName] = useState<string | undefined>();
  const [volume, setVolume] = useState(0.8);
  const [triggerOffsetMinutes, setTriggerOffsetMinutes] = useState(5);

  // Custom tracks from phone
  const [customTracks, setCustomTracks] = useState<CustomAudioTrack[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewPlayingId, setPreviewPlayingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Calendar sync toggle
  const [syncToGoogle, setSyncToGoogle] = useState(isGoogleConnected);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Active tab inside modal: 'details' or 'pomodoro'
  const [activeTab, setActiveTab] = useState<'details' | 'pomodoro'>('details');

  const refreshCustomTracks = async () => {
    try {
      const list = await getAllCustomTracks();
      setCustomTracks(list);
    } catch (e) {
      console.warn('Erro ao carregar faixas personalizadas:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCustomTracks();
    }
  }, [isOpen]);

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
      setCustomAudioId(initialActivity.alarm.customAudioId);
      setCustomAudioName(initialActivity.alarm.customAudioName);
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
      setCustomAudioId(undefined);
      setCustomAudioName(undefined);
      setVolume(0.8);
      setTriggerOffsetMinutes(5);
      setSyncToGoogle(isGoogleConnected);
    }
    setActiveTab('details');
    setErrorMsg('');
  }, [initialActivity, selectedDate, isOpen, isGoogleConnected]);

  if (!isOpen) return null;

  const handleTestSound = (typeToTest: AlarmSoundType, trackId?: string) => {
    unlockAudioContext();
    playSound(typeToTest, volume, trackId || customAudioId);
    setPreviewPlayingId(trackId || typeToTest);
    setTimeout(() => setPreviewPlayingId(null), 1500);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    try {
      const track = await saveCustomTrack(file);
      await refreshCustomTracks();
      setSoundType('custom');
      setCustomAudioId(track.id);
      setCustomAudioName(track.name);
    } catch (err) {
      console.warn('Erro ao salvar áudio:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteCustomTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCustomTrack(id);
    const remaining = customTracks.filter((t) => t.id !== id);
    setCustomTracks(remaining);
    if (customAudioId === id) {
      if (remaining.length > 0) {
        setCustomAudioId(remaining[0].id);
        setCustomAudioName(remaining[0].name);
      } else {
        setSoundType('chime');
        setCustomAudioId(undefined);
        setCustomAudioName(undefined);
      }
    }
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
            customAudioId: soundType === 'custom' ? customAudioId : undefined,
            customAudioName: soundType === 'custom' ? customAudioName : undefined,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 text-slate-100 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-2 sm:my-6">
        
        {/* Header */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-gradient-to-r ${config.headerGrad}`}>
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 shadow-inner">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                {initialActivity ? 'Editar Atividade' : 'Agendar Nova Atividade'}
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300">
                Alarmes na barra de notificação e músicas do celular
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation (Details vs Pomodoro Timer) */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-3.5 sm:px-6 pt-1.5 sm:pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'details'
                ? isFeminino
                  ? 'border-rose-500 text-rose-400'
                  : 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Detalhes & Alarme</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pomodoro')}
            className={`flex items-center gap-1.5 pb-2 px-2.5 sm:px-3 text-[11px] sm:text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'pomodoro'
                ? isFeminino
                  ? 'border-rose-500 text-rose-400'
                  : 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Pomodoro</span>
            <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
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
            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          /* Form Tab */
          <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 max-h-[82vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1">
                Título da Atividade *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reunião de Alinhamento, Treino na Academia..."
                className={`w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${config.ring}`}
              />
            </div>

            {/* Date & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Data *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 ${config.ring}`}
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Início *
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 ${config.ring}`}
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Término (opcional)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 ${config.ring}`}
                />
              </div>
            </div>

            {/* Category & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className={`w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-2 ${config.ring}`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1">
                  Prioridade
                </label>
                <div className="flex gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        priority === p.value
                          ? 'bg-slate-800 text-white border-sky-400 font-semibold shadow-inner'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900'
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
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 mb-1">
                Descrição ou Notas (opcional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalhes, checklist ou lembretes adicionais..."
                className={`w-full px-3 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${config.ring}`}
              />
            </div>

            {/* ALARM CONFIGURATION BOX */}
            <div className="border border-slate-800 rounded-xl p-3 sm:p-4 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-7 h-7 rounded-lg ${config.primaryBtn} flex items-center justify-center shrink-0`}>
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-100">Alarme & Notificação</span>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">
                      Toca na barra do celular e tela de bloqueio
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={alarmEnabled}
                    onChange={(e) => setAlarmEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${
                    isFeminino ? 'peer-checked:bg-rose-600' : 'peer-checked:bg-sky-600'
                  }`}></div>
                </label>
              </div>

              {alarmEnabled && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  {/* Antecedencia */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-slate-300 mb-1">
                      Disparar Alarme:
                    </label>
                    <select
                      value={triggerOffsetMinutes}
                      onChange={(e) => setTriggerOffsetMinutes(Number(e.target.value))}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 ${config.ring}`}
                    >
                      {OFFSET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CUSTOM PHONE MUSICS SECTION */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-sky-400" />
                        Música do Celular
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition ${config.primaryBtn}`}
                      >
                        <Plus className="w-3 h-3" />
                        {isUploading ? 'Carregando...' : '+ Importar Música'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>

                    {customTracks.length > 0 && (
                      <div className="space-y-1 mb-2">
                        {customTracks.map((tr) => {
                          const isSelected = soundType === 'custom' && customAudioId === tr.id;
                          return (
                            <div
                              key={tr.id}
                              onClick={() => {
                                setSoundType('custom');
                                setCustomAudioId(tr.id);
                                setCustomAudioName(tr.name);
                              }}
                              className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? isFeminino
                                    ? 'border-rose-500 bg-rose-950/40'
                                    : 'border-sky-500 bg-sky-950/40'
                                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                                    isSelected
                                      ? isFeminino
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-sky-500 text-white'
                                      : 'border border-slate-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-100 truncate">{tr.name}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {(tr.size / (1024 * 1024)).toFixed(1)} MB (No Celular)
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTestSound('custom', tr.id);
                                  }}
                                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition"
                                  title="Testar"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteCustomTrack(tr.id, e)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-400 transition"
                                  title="Remover"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Built-in Sound Type Selection */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-medium text-slate-400 mb-1">
                      Ou Toques do Sistema:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                      {(['chime', 'digital', 'melodic', 'urgent', 'gong'] as AlarmSoundType[]).map((key) => {
                        const item = SOUND_LABELS[key];
                        const isSelected = soundType === key;
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setSoundType(key);
                              setCustomAudioId(undefined);
                              setCustomAudioName(undefined);
                            }}
                            className={`flex items-center justify-between p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? isFeminino
                                  ? 'bg-rose-950/30 border-rose-500'
                                  : 'bg-sky-950/30 border-sky-500'
                                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <div
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0 ${
                                  isSelected
                                    ? isFeminino
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-sky-500 text-white'
                                    : 'border border-slate-600'
                                }`}
                              >
                                {isSelected ? <Check className="w-2.5 h-2.5" /> : null}
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-xs font-semibold text-slate-200 leading-tight truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-slate-400 leading-none truncate">
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
                              className="p-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shrink-0 ml-1"
                            >
                              <Play className="w-3 h-3 fill-current" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Volume Slider */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-medium text-slate-300 mb-1">
                      <span className="flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                        Volume: {Math.round(volume * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTestSound(soundType, customAudioId)}
                        className={`text-[10px] sm:text-[11px] font-semibold hover:underline cursor-pointer ${config.accentText}`}
                      >
                        Ouvir Agora
                      </button>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* GOOGLE CALENDAR SYNC SECTION */}
            <div className="border border-slate-800 rounded-xl p-3 sm:p-4 bg-slate-950/40">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2">
                  <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      Sincronizar com Google Agenda
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">
                      Cria ou atualiza evento no seu Google Calendar
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
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                ) : (
                  <button
                    type="button"
                    onClick={onConnectGoogle}
                    className="px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-sky-400 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 rounded-lg transition-colors shrink-0 cursor-pointer"
                  >
                    Conectar
                  </button>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-4 py-1.5 sm:px-5 sm:py-2 text-xs font-semibold rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer ${config.primaryBtn}`}
              >
                {isSaving ? 'Salvando...' : initialActivity ? 'Atualizar Atividade' : 'Agendar Atividade'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
