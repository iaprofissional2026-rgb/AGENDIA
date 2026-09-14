import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeMode } from '../types';

interface ThemeConfig {
  name: string;
  subtitle: string;
  tag: string;
  primaryBtn: string;
  secondaryBtn: string;
  headerGrad: string;
  accentText: string;
  accentBorder: string;
  accentBg: string;
  badge: string;
  ring: string;
  activeAlarmBg: string;
  tabActive: string;
}

const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  masculino: {
    name: 'Masculino',
    subtitle: 'Navy & Aço',
    tag: '♂',
    primaryBtn: 'bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-950/30 border border-sky-500/30',
    secondaryBtn: 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60',
    headerGrad: 'from-slate-950 via-slate-900 to-sky-950',
    accentText: 'text-sky-400',
    accentBorder: 'border-sky-500/40',
    accentBg: 'bg-sky-950/40',
    badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
    ring: 'focus:ring-sky-500 focus:border-sky-500',
    activeAlarmBg: 'from-sky-950 via-slate-900 to-blue-950',
    tabActive: 'bg-sky-600 text-white shadow-sm',
  },
  feminino: {
    name: 'Feminino',
    subtitle: 'Rosé & Quartzo',
    tag: '♀',
    primaryBtn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/30 border border-rose-500/30',
    secondaryBtn: 'bg-[#291322] hover:bg-[#3b1c31] text-rose-200 border border-rose-900/50',
    headerGrad: 'from-[#190914] via-[#240e1d] to-[#3a132e]',
    accentText: 'text-rose-400',
    accentBorder: 'border-rose-500/40',
    accentBg: 'bg-rose-950/40',
    badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    ring: 'focus:ring-rose-500 focus:border-rose-500',
    activeAlarmBg: 'from-rose-950 via-[#260e1e] to-pink-950',
    tabActive: 'bg-rose-600 text-white shadow-sm',
  },
  neutro: {
    name: 'Neutro',
    subtitle: 'Índigo Clássico',
    tag: '✦',
    primaryBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/30 border border-indigo-500/30',
    secondaryBtn: 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60',
    headerGrad: 'from-slate-950 via-indigo-950 to-slate-900',
    accentText: 'text-indigo-400',
    accentBorder: 'border-indigo-500/40',
    accentBg: 'bg-indigo-950/40',
    badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    ring: 'focus:ring-indigo-500 focus:border-indigo-500',
    activeAlarmBg: 'from-indigo-950 via-slate-900 to-purple-950',
    tabActive: 'bg-indigo-600 text-white shadow-sm',
  },
};

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  config: ThemeConfig;
  isMasculino: boolean;
  isFeminino: boolean;
  isNeutro: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'masculino' || saved === 'feminino' || saved === 'neutro') {
      return saved;
    }
    return 'masculino'; // Modern default as requested by user
  });

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem('app_theme', mode);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);

    // Update browser theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (theme === 'masculino') metaThemeColor.setAttribute('content', '#0f172a');
      else if (theme === 'feminino') metaThemeColor.setAttribute('content', '#240e1d');
      else metaThemeColor.setAttribute('content', '#1e1b4b');
    }
  }, [theme]);

  const config = THEME_CONFIGS[theme];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        config,
        isMasculino: theme === 'masculino',
        isFeminino: theme === 'feminino',
        isNeutro: theme === 'neutro',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
