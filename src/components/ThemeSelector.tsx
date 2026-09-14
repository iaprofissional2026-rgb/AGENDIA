import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeMode } from '../types';

export const ThemeSelector: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const themes: { id: ThemeMode; label: string; icon: string; short: string }[] = [
    { id: 'masculino', label: 'Masculino', icon: '♂', short: 'Masc' },
    { id: 'feminino', label: 'Feminino', icon: '♀', short: 'Fem' },
    { id: 'neutro', label: 'Neutro', icon: '✦', short: 'Neutro' },
  ];

  return (
    <div
      id="theme-selector-container"
      className="inline-flex items-center p-0.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs shadow-inner"
    >
      {themes.map((t) => {
        const active = theme === t.id;
        return (
          <button
            key={t.id}
            id={`theme-btn-${t.id}`}
            type="button"
            onClick={() => setTheme(t.id)}
            title={`Alternar para tema ${t.label}`}
            className={`px-2 py-1 rounded-md font-medium transition-all flex items-center gap-1 cursor-pointer select-none ${
              active
                ? t.id === 'masculino'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : t.id === 'feminino'
                  ? 'bg-rose-600 text-white shadow-sm font-semibold'
                  : 'bg-indigo-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-[13px] leading-none font-bold">{t.icon}</span>
            <span className="hidden sm:inline text-[11px]">{t.short}</span>
          </button>
        );
      })}
    </div>
  );
};
