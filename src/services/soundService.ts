import { AlarmSoundType } from '../types';

let audioCtx: AudioContext | null = null;
let currentAlarmInterval: number | null = null;
let isAlarmCurrentlyPlaying = false;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function unlockAudioContext(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (e) {
    console.warn('AudioContext unlock attempt:', e);
  }
}

/**
 * Play a single sequence of the chosen sound type
 */
export function playSound(type: AlarmSoundType, volume: number = 0.8): void {
  try {
    const ctx = getAudioContext();
    const clampedVol = Math.max(0.01, Math.min(1, volume));
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(clampedVol, now);
    masterGain.connect(ctx.destination);

    switch (type) {
      case 'digital': {
        // Classic electronic alarm beep: 3 quick beeps
        const beeps = [0, 0.15, 0.3];
        beeps.forEach((startOffset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now + startOffset); // A5
          osc.frequency.setValueAtTime(987.77, now + startOffset + 0.05); // B5

          gain.gain.setValueAtTime(0, now + startOffset);
          gain.gain.linearRampToValueAtTime(0.3 * clampedVol, now + startOffset + 0.01);
          gain.gain.setValueAtTime(0.3 * clampedVol, now + startOffset + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + 0.12);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + startOffset);
          osc.stop(now + startOffset + 0.13);
        });
        break;
      }

      case 'chime': {
        // Harmonic bell chime
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          const startTime = now + idx * 0.08;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.35 * clampedVol, startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime);
          osc.stop(startTime + 1.3);
        });
        break;
      }

      case 'melodic': {
        // Cheerful ascending arpeggio: F4, A4, C5, E5, G5
        const notes = [
          { f: 349.23, t: 0 },
          { f: 440.0, t: 0.12 },
          { f: 523.25, t: 0.24 },
          { f: 659.25, t: 0.36 },
          { f: 783.99, t: 0.48 },
        ];
        notes.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0, now + t);
          gain.gain.linearRampToValueAtTime(0.4 * clampedVol, now + t + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.45);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + t);
          osc.stop(now + t + 0.5);
        });
        break;
      }

      case 'urgent': {
        // Pulsing urgent siren: 2 cycles of siren sweep
        for (let i = 0; i < 2; i++) {
          const offset = i * 0.35;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';

          osc.frequency.setValueAtTime(600, now + offset);
          osc.frequency.linearRampToValueAtTime(1200, now + offset + 0.15);
          osc.frequency.linearRampToValueAtTime(600, now + offset + 0.3);

          gain.gain.setValueAtTime(0, now + offset);
          gain.gain.linearRampToValueAtTime(0.25 * clampedVol, now + offset + 0.03);
          gain.gain.setValueAtTime(0.25 * clampedVol, now + offset + 0.27);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.32);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now + offset);
          osc.stop(now + offset + 0.33);
        }
        break;
      }

      case 'gong': {
        // Deep calming meditation gong
        const baseFreq = 146.83; // D3
        const harmonics = [1, 2.01, 2.76, 3.42];
        harmonics.forEach((h, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(baseFreq * h, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime((0.45 / (idx + 1)) * clampedVol, now + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 2.3);
        });
        break;
      }
    }
  } catch (err) {
    console.error('Error playing sound:', err);
  }
}

/**
 * Start repeating loop for an active alarm until stopped
 */
export function startContinuousAlarm(type: AlarmSoundType, volume: number = 0.9): () => void {
  stopContinuousAlarm();
  unlockAudioContext();
  isAlarmCurrentlyPlaying = true;

  // Play immediately
  playSound(type, volume);

  const loopIntervalMs = type === 'gong' ? 2600 : type === 'chime' ? 1800 : 1200;

  currentAlarmInterval = window.setInterval(() => {
    playSound(type, volume);
  }, loopIntervalMs);

  return stopContinuousAlarm;
}

export function stopContinuousAlarm(): void {
  if (currentAlarmInterval !== null) {
    clearInterval(currentAlarmInterval);
    currentAlarmInterval = null;
  }
  isAlarmCurrentlyPlaying = false;
}

export function isAlarmPlaying(): boolean {
  return isAlarmCurrentlyPlaying;
}

export const SOUND_LABELS: Record<AlarmSoundType, { name: string; description: string; icon: string }> = {
  digital: {
    name: 'Beep Digital',
    description: 'Bipes eletrônicos clássicos e dinâmicos',
    icon: 'Cpu',
  },
  chime: {
    name: 'Sino Harmônico',
    description: 'Campainha cristalina e agradável',
    icon: 'Bell',
  },
  melodic: {
    name: 'Melodia Alegre',
    description: 'Acordes ascendentes revigorantes',
    icon: 'Music',
  },
  urgent: {
    name: 'Alerta Urgente',
    description: 'Sirene pulsante para alta prioridade',
    icon: 'AlertTriangle',
  },
  gong: {
    name: 'Gongo Suave',
    description: 'Ressonância profunda e tranquila',
    icon: 'Disc',
  },
};
