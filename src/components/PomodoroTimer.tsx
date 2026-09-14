import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Coffee,
  Brain,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { playSound, unlockAudioContext } from '../services/soundService';

interface PomodoroTimerProps {
  activityTitle: string;
  onCompleteActivity?: () => void;
}

type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

interface ModeConfig {
  label: string;
  minutes: number;
  icon: typeof Brain;
  color: string;
  badgeBg: string;
}

const MODES: Record<PomodoroMode, ModeConfig> = {
  work: {
    label: 'Foco Total',
    minutes: 25,
    icon: Brain,
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  shortBreak: {
    label: 'Pausa Curta',
    minutes: 5,
    icon: Coffee,
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  longBreak: {
    label: 'Pausa Longa',
    minutes: 15,
    icon: Coffee,
    color: 'text-blue-600',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
  },
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  activityTitle,
  onCompleteActivity,
}) => {
  const [mode, setMode] = useState<PomodoroMode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(MODES.work.minutes * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [autoStartBreak, setAutoStartBreak] = useState<boolean>(false);
  const [cycleSuccessMessage, setCycleSuccessMessage] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  const totalTimeForMode = MODES[mode].minutes * 60;
  const progressPercent = Math.min(
    100,
    Math.max(0, ((totalTimeForMode - timeLeft) / totalTimeForMode) * 100)
  );

  // Switch mode helper
  const handleSelectMode = (newMode: PomodoroMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].minutes * 60);
    setCycleSuccessMessage(null);
  };

  // Reset current timer
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODES[mode].minutes * 60);
    setCycleSuccessMessage(null);
  };

  // Toggle start / pause
  const handleTogglePlay = () => {
    unlockAudioContext();
    setIsRunning((prev) => !prev);
  };

  // Countdown effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            clearInterval(timerRef.current!);
            setIsRunning(false);

            // Play notification tone
            if (mode === 'work') {
              playSound('chime', 0.9);
              const nextCycles = completedCycles + 1;
              setCompletedCycles(nextCycles);
              setCycleSuccessMessage(
                `Excelente! Ciclo de foco concluído (${nextCycles}º ciclo). Hora de descansar!`
              );

              // Next is break
              const nextMode: PomodoroMode = nextCycles % 4 === 0 ? 'longBreak' : 'shortBreak';
              if (autoStartBreak) {
                setMode(nextMode);
                setTimeLeft(MODES[nextMode].minutes * 60);
                setIsRunning(true);
              } else {
                setMode(nextMode);
                setTimeLeft(MODES[nextMode].minutes * 60);
              }
            } else {
              // Break finished
              playSound('melodic', 0.9);
              setCycleSuccessMessage('Pausa concluída! Pronto para retomar o foco?');
              setMode('work');
              setTimeLeft(MODES.work.minutes * 60);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, completedCycles, autoStartBreak]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const CurrentIcon = MODES[mode].icon;

  return (
    <div className="border border-indigo-200/80 rounded-2xl bg-linear-to-b from-indigo-50/70 to-white p-4 sm:p-5 space-y-4 shadow-2xs">
      
      {/* Header with Mode Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-indigo-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-slate-900">Temporizador Pomodoro</span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                <Sparkles className="w-2.5 h-2.5" /> Foco Ativo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {activityTitle.trim() ? `Executando: "${activityTitle}"` : 'Foco na atividade atual'}
            </p>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          {(Object.keys(MODES) as PomodoroMode[]).map((mKey) => {
            const mConfig = MODES[mKey];
            const isCurrent = mode === mKey;
            return (
              <button
                key={mKey}
                type="button"
                onClick={() => handleSelectMode(mKey)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mConfig.label} ({mConfig.minutes}m)
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Countdown & Progress Card */}
      <div className="flex flex-col items-center justify-center py-3">
        {/* Circular / Large Digital Display */}
        <div className="relative flex flex-col items-center">
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 font-mono">
            {formatTime(timeLeft)}
          </div>
          <span className="mt-1 text-xs font-semibold text-indigo-600 tracking-wide uppercase">
            {MODES[mode].label} {isRunning ? '• Em Andamento' : '• Pausado'}
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full max-w-sm mt-3 bg-slate-200/80 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              mode === 'work'
                ? 'bg-indigo-600'
                : mode === 'shortBreak'
                ? 'bg-emerald-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Controls: Play/Pause, Reset, Complete */}
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleTogglePlay}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                Pausar Foco
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                Iniciar Ciclo
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleReset}
            title="Reiniciar temporizador"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onCompleteActivity && (
            <button
              type="button"
              onClick={onCompleteActivity}
              title="Marcar atividade como concluída"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Concluir Tarefa
            </button>
          )}
        </div>
      </div>

      {/* Cycle message alert if any */}
      {cycleSuccessMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{cycleSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setCycleSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-[11px] font-bold ml-2"
          >
            Dispensar
          </button>
        </div>
      )}

      {/* Footer Info & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-100/70 text-[11px] text-slate-500">
        <div className="flex items-center space-x-3">
          <span>
            Ciclos completados:{' '}
            <strong className="text-slate-800 font-bold">{completedCycles}</strong>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-indigo-600" />
            Alarme sonoro ao término do ciclo
          </span>
        </div>

        <label className="inline-flex items-center space-x-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoStartBreak}
            onChange={(e) => setAutoStartBreak(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
          />
          <span className="text-[11px] text-slate-600">Iniciar pausas automaticamente</span>
        </label>
      </div>

    </div>
  );
};
