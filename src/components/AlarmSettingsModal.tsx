import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Volume2,
  Bell,
  Play,
  Square,
  Check,
  Radio,
  Sparkles,
  ShieldCheck,
  Timer,
  Music,
  Plus,
  Trash2,
  Smartphone,
} from 'lucide-react';
import { AlarmSoundType, CustomAudioTrack } from '../types';
import { SOUND_LABELS, playSound, unlockAudioContext } from '../services/soundService';
import { getAllCustomTracks, saveCustomTrack, deleteCustomTrack } from '../services/customAudioService';
import { useTheme } from '../context/ThemeContext';

interface AlarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTestAlarm: (soundType: AlarmSoundType, volume: number, customAudioId?: string) => void;
  notificationsAllowed: boolean;
  onRequestNotifications: () => Promise<boolean>;
  onOpenPwaModal?: () => void;
}

export const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({
  isOpen,
  onClose,
  onTriggerTestAlarm,
  notificationsAllowed,
  onRequestNotifications,
  onOpenPwaModal,
}) => {
  const { config, isMasculino, isFeminino } = useTheme();
  const [selectedSound, setSelectedSound] = useState<AlarmSoundType>('chime');
  const [selectedCustomTrackId, setSelectedCustomTrackId] = useState<string | undefined>();
  const [customTracks, setCustomTracks] = useState<CustomAudioTrack[]>([]);
  const [testVolume, setTestVolume] = useState<number>(0.85);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load custom tracks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCustomTracks();
    }
    return () => {
      stopPreview();
    };
  }, [isOpen]);

  const loadCustomTracks = async () => {
    const tracks = await getAllCustomTracks();
    setCustomTracks(tracks);
    if (tracks.length > 0 && selectedSound === 'custom' && !selectedCustomTrackId) {
      setSelectedCustomTrackId(tracks[0].id);
    }
  };

  const stopPreview = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
      previewAudioRef.current = null;
    }
    setIsPlayingPreview(null);
  };

  if (!isOpen) return null;

  const handlePreviewBuiltInSound = (type: AlarmSoundType) => {
    stopPreview();
    unlockAudioContext();
    playSound(type, testVolume);
    setIsPlayingPreview(type);
    setTimeout(() => setIsPlayingPreview(null), 1500);
  };

  const handlePreviewCustomTrack = (trackId: string) => {
    if (isPlayingPreview === trackId) {
      stopPreview();
      return;
    }
    stopPreview();
    unlockAudioContext();
    playSound('custom', testVolume, trackId);
    setIsPlayingPreview(trackId);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    try {
      const newTrack = await saveCustomTrack(file);
      await loadCustomTracks();
      setSelectedSound('custom');
      setSelectedCustomTrackId(newTrack.id);
    } catch (err) {
      console.warn('Erro ao salvar áudio do celular:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteTrack = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    stopPreview();
    await deleteCustomTrack(id);
    const remaining = customTracks.filter((t) => t.id !== id);
    setCustomTracks(remaining);
    if (selectedCustomTrackId === id) {
      if (remaining.length > 0) {
        setSelectedCustomTrackId(remaining[0].id);
      } else {
        setSelectedSound('chime');
        setSelectedCustomTrackId(undefined);
      }
    }
  };

  const handleSimulateCountdown = () => {
    stopPreview();
    unlockAudioContext();
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onTriggerTestAlarm(selectedSound, testVolume, selectedCustomTrackId);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 text-slate-100 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-gradient-to-r ${config.headerGrad}`}>
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center shrink-0 shadow-inner">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight">
                Laboratório de Alarmes & Músicas
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-300">
                Toques do sistema, músicas do celular e barra de notificação
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* APK & Notification Bar Banner */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-slate-200 text-xs">Barra de Alarme no Celular / APK</p>
                <p className="text-[11px] text-slate-400 truncate">
                  Toca com botões de Parar e Soneca na central de notificações.
                </p>
              </div>
            </div>
            {onOpenPwaModal && (
              <button
                type="button"
                onClick={() => {
                  stopPreview();
                  onClose();
                  onOpenPwaModal();
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-medium shrink-0 cursor-pointer transition"
              >
                Como Gerar APK
              </button>
            )}
          </div>

          {/* Section: Musics from Device */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-sky-400" />
                Músicas do seu Celular
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${config.primaryBtn}`}
              >
                <Plus className="w-3 h-3" />
                {isUploading ? 'Carregando...' : 'Adicionar Música'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {customTracks.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-xl border border-dashed border-slate-700 bg-slate-800/30 text-center cursor-pointer hover:border-slate-600 transition"
              >
                <Music className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                <p className="text-slate-300 font-medium text-xs">Nenhuma música importada ainda</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Toque para escolher arquivos MP3, WAV ou M4A do seu celular.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {customTracks.map((track) => {
                  const isSelected = selectedSound === 'custom' && selectedCustomTrackId === track.id;
                  const isPlaying = isPlayingPreview === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => {
                        setSelectedSound('custom');
                        setSelectedCustomTrackId(track.id);
                      }}
                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? isFeminino
                            ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500/30'
                            : 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/30'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                            isSelected
                              ? isFeminino
                                ? 'bg-rose-500 text-white'
                                : 'bg-sky-500 text-white'
                              : 'border border-slate-600 text-transparent'
                          }`}
                        >
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-100 truncate">{track.name}</h4>
                          <p className="text-[10px] text-slate-400">
                            {(track.size / (1024 * 1024)).toFixed(1)} MB • Armazenada localmente
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewCustomTrack(track.id);
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                            isPlaying
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                          }`}
                        >
                          {isPlaying ? (
                            <>
                              <Square className="w-3 h-3 fill-current" />
                              <span>Parar</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 fill-current" />
                              <span>Ouvir</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrack(track.id, e)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                          title="Remover música"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sound Types list (Built-in synthesizer) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Sons Sintéticos do Sistema
            </label>
            <div className="space-y-1.5">
              {(['chime', 'digital', 'melodic', 'urgent', 'gong'] as AlarmSoundType[]).map((key) => {
                const info = SOUND_LABELS[key];
                const isSelected = selectedSound === key;
                const isPlaying = isPlayingPreview === key;
                return (
                  <div
                    key={key}
                    onClick={() => {
                      setSelectedSound(key);
                      setSelectedCustomTrackId(undefined);
                    }}
                    className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? isFeminino
                          ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500/30'
                          : 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/30'
                        : 'border-slate-800 hover:border-slate-700 bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                          isSelected
                            ? isFeminino
                              ? 'bg-rose-500 text-white'
                              : 'bg-sky-500 text-white'
                            : 'border border-slate-600 text-transparent'
                        }`}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 truncate">{info.name}</h4>
                        <p className="text-[10px] text-slate-400 truncate">{info.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewBuiltInSound(key);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shrink-0 ml-2 ${
                        isPlaying
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Ouvir</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume Control */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                Volume do Alarme
              </span>
              <span className="font-mono text-sky-400">{Math.round(testVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={testVolume}
              onChange={(e) => setTestVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* Browser Notification Permission */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-800/40 gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200">Notificações do Sistema</h4>
                <p className="text-[10px] text-slate-400">
                  {notificationsAllowed
                    ? 'Ativas para tocar alarme em segundo plano.'
                    : 'Receba o alarme na barra de notificações do celular.'}
                </p>
              </div>
            </div>

            {notificationsAllowed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                Ativas
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequestNotifications}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer ${config.primaryBtn}`}
              >
                Permitir
              </button>
            )}
          </div>

          {/* Test Real Alarm Simulation Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSimulateCountdown}
              disabled={countdown !== null}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer ${config.primaryBtn}`}
            >
              {countdown !== null ? (
                <>
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>Disparando em {countdown}...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Testar Alarme na Barra de Notificações (em 3s)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-500 mt-1">
              Ativa o som selecionado, vibração e controles de Parar/Soneca.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
