import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  List,
  Search,
  Filter,
  CheckCircle,
  Bell,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Activity, CategoryType, GoogleCalendarEvent, StatusType } from '../types';
import { ActivityCard } from './ActivityCard';

interface CalendarTimelineProps {
  activities: Activity[];
  googleEvents: GoogleCalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onToggleStatus: (activity: Activity) => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  onTestSound: (soundType: Activity['alarm']['soundType'], volume?: number) => void;
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
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StatusType>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter activities for current view
  const filteredActivities = activities.filter((act) => {
    // In timeline mode, we filter strictly by selectedDate
    if (viewMode === 'timeline' && act.date !== selectedDate) {
      return false;
    }

    // In list mode, if search or filters are applied:
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

  // Timeline hours (06:00 to 22:00)
  const timelineHours = Array.from({ length: 17 }, (_, i) => i + 6);

  return (
    <div className="space-y-3 sm:space-y-5">
      
      {/* Top Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-0.5 sm:mb-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Total</span>
            <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900">{totalCount}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">atividades</p>
        </div>

        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 mb-0.5 sm:mb-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Concluídas</span>
            <CheckCircle className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-700">{completedCount}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
            {totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}% feito` : '0%'}
          </p>
        </div>

        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 mb-0.5 sm:mb-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Alarmes</span>
            <Bell className="w-3.5 h-3.5" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-700">{alarmsActiveCount}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">toques ativos</p>
        </div>

        <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-blue-600 mb-0.5 sm:mb-1">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Google</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 48 48">
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            </svg>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-700">{syncedGoogleCount}</p>
          <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
            {isGoogleConnected ? 'sincronizados' : 'não conectado'}
          </p>
        </div>
      </div>

      {/* Navigation & Controls Bar */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-4">
        
        {/* Date Selector and Jump Buttons */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onSelectDate(e.target.value)}
            className="flex-1 sm:flex-initial px-2 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <button
            onClick={() => onSelectDate(todayStr)}
            className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedDate === todayStr
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Hoje
          </button>

          <button
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              onSelectDate(d.toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Amanhã
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg w-full md:w-auto">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${
              viewMode === 'timeline'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden xs:inline">Linha do Tempo</span>
            <span className="xs:hidden">Linha</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="hidden xs:inline">Lista Completa</span>
            <span className="xs:hidden">Lista</span>
          </button>

          {isGoogleConnected && (
            <button
              onClick={() => setViewMode('google')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-all ${
                viewMode === 'google'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-blue-600'
              }`}
            >
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              </svg>
              <span>Agenda ({googleEvents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters (when in List Mode) */}
      {viewMode === 'list' && (
        <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar atividades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | StatusType)}
              className="flex-1 sm:flex-initial px-2 py-1.5 text-[11px] sm:text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Status: Todos</option>
              <option value="pendente">Pendentes</option>
              <option value="concluida">Concluídas</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'all' | CategoryType)}
              className="flex-1 sm:flex-initial px-2 py-1.5 text-[11px] sm:text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Categorias: Todas</option>
              <option value="Trabalho">Trabalho</option>
              <option value="Estudo">Estudo</option>
              <option value="Saúde">Saúde</option>
              <option value="Lazer">Lazer</option>
              <option value="Pessoal">Pessoal</option>
            </select>
          </div>
        </div>
      )}

      {/* VIEW CONTENT */}

      {/* 1. TIMELINE VIEW */}
      {viewMode === 'timeline' && (
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-1">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
              </h3>
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-slate-500">
              {sortedActivities.length} atividade(s)
            </span>
          </div>

          <div className="p-2.5 sm:p-6 space-y-2 sm:space-y-3">
            {sortedActivities.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                  Nenhuma atividade agendada
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto mt-0.5 mb-3">
                  Agende sua primeira atividade com alarme sonoro configurável.
                </p>
                <button
                  onClick={onOpenNewActivityModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agendar Atividade
                </button>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
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
        <div className="space-y-3">
          {sortedActivities.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-sm font-bold text-slate-800">Nenhuma atividade encontrada</p>
              <p className="text-xs text-slate-500 mt-1">
                Tente ajustar os filtros ou agende uma nova atividade.
              </p>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-blue-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Eventos Importados do seu Google Calendar
                </h3>
                <p className="text-[11px] text-slate-500">
                  Importe qualquer compromisso da sua agenda para configurar um alarme sonoro
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {googleEvents.length} eventos
            </span>
          </div>

          <div className="p-4 sm:p-6">
            {googleEvents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">
                  Nenhum evento futuro encontrado no seu Google Calendar para o período.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {googleEvents.map((evt) => {
                  const startStr = evt.start?.dateTime || evt.start?.date || '';
                  const dateObj = startStr ? new Date(startStr) : null;
                  const formattedDate = dateObj
                    ? dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : 'Data não informada';
                  const formattedTime = dateObj
                    ? dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : '';

                  // Check if already in local activities
                  const alreadyImported = activities.some(
                    (a) => a.googleCalendarEventId === evt.id
                  );

                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between hover:bg-white hover:border-blue-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            <Clock className="w-3 h-3" />
                            {formattedDate} {formattedTime ? `às ${formattedTime}` : ''}
                          </span>
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                              title="Abrir no Google Calendar"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {evt.summary || '(Sem título)'}
                        </h4>

                        {evt.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                            {evt.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                        {alreadyImported ? (
                          <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            Já agendado com alarme
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onImportGoogleEvent(evt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                          >
                            <Bell className="w-3 h-3 text-indigo-600" />
                            Vincular Alarme Sonoro
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
