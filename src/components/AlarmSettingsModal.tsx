import React, { useState } from 'react';
import {
  X,
  Volume2,
  Bell,
  Play,
  Check,
  Radio,
  Sparkles,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { AlarmSoundType } from '../types';
import { SOUND_LABELS, playSound, unlockAudioContext } from '../services/soundService';

interface AlarmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerTestAlarm: (soundType: AlarmSoundType, volume: number) => void;
  notificationsAllowed: boolean;
  onRequestNotifications: () => Promise<boolean>;
}

export const AlarmSettingsModal: React.FC<AlarmSettingsModalProps> = ({
  isOpen,
  onClose,
  onTriggerTestAlarm,
  notificationsAllowed,
  onRequestNotifications,
}) => {
  const [selectedSound, setSelectedSound] = useState<AlarmSoundType>('chime');
  const [testVolume, setTestVolume] = useState<number>(0.85);
  const [countdown, setCountdown] = useState<number | null>(null);

  if (!isOpen) return null;

  const handlePreviewSound = (type: AlarmSoundType) => {
    unlockAudioContext();
    playSound(type, testVolume);
  };

  const handleSimulateCountdown = () => {
    unlockAudioContext();
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onTriggerTestAlarm(selectedSound, testVolume);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-6 sm:py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Ajustes de Alarmes Sonoros
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500">
                Tons, volumes e teste do alarme
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

        {/* Body */}
        <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Audio Synthesizer Info */}
          <div className="flex items-start gap-2.5 p-2.5 sm:p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs mb-0.5">Sintetizador Web Audio</p>
              <p className="text-[11px] text-indigo-700 leading-relaxed">
                Alarmes gerados diretamente pelo navegador, garantindo precisão e volume cristalino em qualquer dispositivo.
              </p>
            </div>
          </div>

          {/* Sound Types list */}
          <div>
            <label className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Selecione o Som para Testar
            </label>
            <div className="space-y-1.5 sm:space-y-2">
              {(Object.keys(SOUND_LABELS) as AlarmSoundType[]).map((key) => {
                const info = SOUND_LABELS[key];
                const isSelected = selectedSound === key;
                return (
                  <div
                    key={key}
                    onClick={() => setSelectedSound(key)}
                    className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'border border-slate-300 text-transparent'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{info.name}</h4>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">{info.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreviewSound(key);
                      }}
                      className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50 transition-colors flex items-center gap-1 shadow-2xs shrink-0 ml-2"
                    >
                      <Play className="w-3 h-3 fill-indigo-700" />
                      <span className="hidden xs:inline">Ouvir</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Volume Control */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                Volume Geral
              </span>
              <span className="font-mono text-indigo-600">{Math.round(testVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={testVolume}
              onChange={(e) => setTestVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 sm:h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          {/* Browser Notification Permission */}
          <div className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-slate-200 bg-white gap-2">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Notificações</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  {notificationsAllowed
                    ? 'Permissão concedida para alertar em segundo plano.'
                    : 'Receba alertas na tela quando a hora chegar.'}
                </p>
              </div>
            </div>

            {notificationsAllowed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                Ativas
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequestNotifications}
                className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
              >
                Ativar
              </button>
            )}
          </div>

          {/* Test Real Alarm Simulation Button */}
          <div className="pt-1 sm:pt-2">
            <button
              type="button"
              onClick={handleSimulateCountdown}
              disabled={countdown !== null}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-75"
            >
              {countdown !== null ? (
                <>
                  <Timer className="w-4 h-4 animate-spin" />
                  <span>Disparando em {countdown}...</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>Simular Disparo Real (em 3s)</span>
                </>
              )}
            </button>
            <p className="text-[10px] sm:text-[11px] text-center text-slate-500 mt-1.5 sm:mt-2">
              Testa a tela cheia de alarme com opções de parar ou adiar.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-3.5 py-2.5 sm:px-6 sm:py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
