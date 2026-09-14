import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  List,
  Search,
  CheckCircle,
  Bell,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Activity, CategoryType, GoogleCalendarEvent, StatusType } from '../types';
import { ActivityCard } from './ActivityCard';
import { useTheme } from '../context/ThemeContext';

interface CalendarTimelineProps {
  activities: Activity[];
  googleEvents: GoogleCalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleStatus: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onTestSound: (soundType: Activity['alarm']['soundType'], volume?: number, customAudioId?: string) => void;
  onOpenNewActivityModal: () => void;
  isGoogleConnected: boolean;
  onImportGoogleEvent: (event: GoogleCalendarEvent) => void;
}

type ViewMode = 'timeline' | 'list' | 'google';

export const CalendarTimeline: React.FC<CalendarTimelineProps> = ({
  activities,
  googleEvents,
  selectedDate,
  onSelectDate,
  onToggleStatus,
  onEdit,
  onDelete,
  onTestSound,
  onOpenNewActivityModal,
  isGoogleConnected,
  onImportGoogleEvent,
}) => {
  const { config, isFeminino } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter activities for current view
  const filteredActivities = activities.filter((act) => {
    // In timeline mode, filter strictly by selectedDate
    if (viewMode === 'timeline' && act.date !== selectedDate) {
      return false;
    }

    // In list mode, filter by status and category
    if (statusFilter !== 'all' && act.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && act.category !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = act.title.toLowerCase().includes(q);
      const matchDesc = act.description?.toLowerCase().includes(q);
      const matchCat = act.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    return true;
  });

  // Sort activities by time
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.startTime.localeCompare(b.startTime);
  });

  // Stats
  const totalCount = activities.length;
  const completedCount = activities.filter((a) => a.status === 'concluida').length;
  const alarmsActiveCount = activities.filter((a) => a.alarm.enabled && a.status !== 'concluida').length;
  const syncedGoogleCount = activities.filter((a) => a.googleCalendarEventId).length;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Total</span>
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-100">{totalCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">atividades registradas</p>
        </div>

        <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Concluídas</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-400">{completedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            {totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}% de taxa` : '0%'}
          </p>
        </div>

        <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Alarmes Ativos</span>
            <Bell className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-400">{alarmsActiveCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">com aviso sonoro</p>
        </div>

        <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-0.5">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Google Agenda</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            </svg>
          </div>
          <p className="text-lg sm:text-xl font-bold text-sky-400">{syncedGoogleCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
            {isGoogleConnected ? 'sincronizados' : 'desconectado'}
          </p>
        </div>
      </div>

      {/* Navigation & Controls Bar */}
      <div className="bg-slate-900/80 p-2.5 sm:p-3.5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 sm:gap-3">
        {/* Date Selector and Jump Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="flex-1 sm:flex-initial px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-950 text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />

          <button
            type="button"
            onClick={() => onSelectDate(todayStr)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              selectedDate === todayStr
                ? isFeminino
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-sky-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Hoje
          </button>

          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              onSelectDate(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Amanhã
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg w-full md:w-auto border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? isFeminino
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden xs:inline">Linha do Tempo</span>
            <span className="xs:hidden">Linha</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all cursor-pointer ${
              viewMode === 'list'
                ? isFeminino
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden xs:inline">Todas ({activities.length})</span>
            <span className="xs:hidden">Lista</span>
          </button>

          {isGoogleConnected && (
            <button
              type="button"
              onClick={() => setViewMode('google')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'google'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              </svg>
              <span>Agenda ({googleEvents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters (when in List Mode) */}
      {viewMode === 'list' && (
        <div className="bg-slate-900/80 p-2.5 sm:p-3 rounded-xl border border-slate-800 shadow-sm flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, notas ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | StatusType)}
              className="flex-1 sm:flex-initial px-2 py-1.5 text-[11px] sm:text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none"
            >
              <option value="all">Status: Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="concluida">Concluídas</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | CategoryType)}
              className="flex-1 sm:flex-initial px-2 py-1.5 text-[11px] sm:text-xs rounded-lg border border-slate-700 bg-slate-950 text-slate-200 focus:outline-none"
            >
              <option value="all">Categorias: Todas</option>
              <option value="Trabalho">Trabalho</option>
              <option value="Estudo">Estudo</option>
              <option value="Saúde">Saúde</option>
              <option value="Lazer">Lazer</option>
              <option value="Pessoal">Pessoal</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>
      )}

      {/* VIEW CONTENT */}

      {/* 1. TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-slate-900/60 rounded-xl sm:rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {sortedActivities.length} atividade(s)
            </span>
          </div>

          <div className="p-2.5 sm:p-4 space-y-2.5">
            {sortedActivities.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2.5 border border-slate-700">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                  Nenhuma atividade para esta data
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5 mb-3">
                  Agende tarefas com alarmes que tocam na barra do celular e com músicas locais.
                </p>
                <button
                  type="button"
                  onClick={onOpenNewActivityModal}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer ${config.primaryBtn}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar Atividade
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onToggleStatus={onToggleStatus}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onTestSound={onTestSound}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {sortedActivities.length === 0 ? (
            <div className="text-center py-8 bg-slate-900/60 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400">Nenhuma atividade corresponde aos filtros selecionados.</p>
            </div>
          ) : (
            sortedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onTestSound={onTestSound}
              />
            ))
          )}
        </div>
      )}

      {/* 3. GOOGLE CALENDAR VIEW */}
      {viewMode === 'google' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-blue-950/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              </svg>
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                  Eventos do Google Calendar
                </h3>
                <p className="text-[11px] text-slate-400">
                  Importe qualquer evento para vincular alarme sonoro e músicas
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {googleEvents.length} eventos
            </span>
          </div>

          <div className="p-3 sm:p-4">
            {googleEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-400">
                  Nenhum evento futuro encontrado no seu Google Calendar para o período.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {googleEvents.map((evt) => {
                  const startStr = evt.start?.dateTime || evt.start?.date || '';
                  const dateObj = startStr ? new Date(startStr) : null;
                  const formattedDate = dateObj
                    ? dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Data não informada';
                  const formattedTime = dateObj
                    ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '';

                  const alreadyImported = activities.some(
                    (a) => a.googleCalendarEventId === evt.id
                  );

                  return (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between hover:border-slate-700 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-500/30">
                            <Clock className="w-3 h-3" />
                            {formattedDate} {formattedTime ? `às ${formattedTime}` : ''}
                          </span>
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-sky-400 transition-colors"
                              title="Abrir no Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                          {evt.summary || '(Sem título)'}
                        </h4>

                        {evt.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                        {alreadyImported ? (
                          <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Alarme já vinculado
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onImportGoogleEvent(evt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-500/30 rounded-lg transition-colors cursor-pointer"
                          >
                            <Bell className="w-3 h-3 text-sky-400" />
                            Vincular Alarme
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
