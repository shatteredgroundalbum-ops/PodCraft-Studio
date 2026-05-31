import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore } from '../store/MediaStore';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarIcon, ClockIcon, FolderIcon, XIcon } from 'lucide-react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Calendar() {
  const { tasks, projects, episodes } = useMediaStore();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const parseDate = (d: string) => { if (!d || d === 'No date') return null; const p = new Date(d); return isNaN(p.getTime()) ? null : p; };

  const getEventsForDay = (day: number) => {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().slice(0, 10);
    const taskEvents = tasks.filter((t) => {
      const due = parseDate(t.dueDate);
      return due && due.toISOString().slice(0, 10) === dateStr;
    });
    const episodeEvents = episodes.filter((e) => {
      const pub = parseDate(e.publishDate);
      return pub && pub.toISOString().slice(0, 10) === dateStr;
    });
    return { tasks: taskEvents, episodes: episodeEvents };
  };

  const selectedEvents = selectedDay ? getEventsForDay(selectedDay.getDate()) : null;
  const totalEvents = selectedEvents ? selectedEvents.tasks.length + selectedEvents.episodes.length : 0;

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  return (
    <AppLayout title="Calendar">
      <div className="mb-6">
        <p className="text-sm text-gray-500">View and manage your podcast production schedule.</p>
      </div>

      <div className="flex gap-6">
        {/* Calendar Grid */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">{MONTHS[month]} {year}</h2>
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
                className="px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg transition-colors">
                Today
              </button>
              <button onClick={nextMonth} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map((day) => (
              <div key={day} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-100 bg-gray-50/30" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { tasks: dayTasks, episodes: dayEpisodes } = getEventsForDay(day);
              const hasEvents = dayTasks.length > 0 || dayEpisodes.length > 0;
              const isSelected = selectedDay?.getFullYear() === year && selectedDay?.getMonth() === month && selectedDay?.getDate() === day;

              return (
                <div key={day}
                  className={`h-24 border-b border-r border-gray-100 p-2 cursor-pointer transition-colors hover:bg-violet-50/30 ${isSelected ? 'bg-violet-50' : ''}`}
                  onClick={() => setSelectedDay(isSelected ? null : new Date(year, month, day))}>
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1 ${isToday(day) ? 'bg-violet-600 text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayTasks.slice(0, 1).map((t) => (
                      <div key={t.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 truncate">
                        {t.name}
                      </div>
                    ))}
                    {dayEpisodes.slice(0, 1).map((e) => (
                      <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 truncate">
                        {e.title}
                      </div>
                    ))}
                    {(dayTasks.length + dayEpisodes.length) > 2 && (
                      <div className="text-[10px] text-gray-500 px-1">+{dayTasks.length + dayEpisodes.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Selected Day */}
          {selectedDay ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">
                  {MONTHS[selectedDay.getMonth()]} {selectedDay.getDate()}, {selectedDay.getFullYear()}
                </h3>
                <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                {totalEvents === 0 ? (
                  <div className="text-center py-6">
                    <CalendarIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No events on this day.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEvents?.tasks.map((t) => (
                      <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg border border-blue-100 bg-blue-50">
                        <ClockIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-blue-600">Task due</p>
                        </div>
                      </div>
                    ))}
                    {selectedEvents?.episodes.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg border border-violet-100 bg-violet-50">
                        <FolderIcon className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{e.title}</p>
                          <p className="text-xs text-violet-600">Episode publish</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
              <CalendarIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Click on a day to see events.</p>
            </div>
          )}

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">Upcoming This Month</h3>
            {tasks.filter((t) => {
              const due = parseDate(t.dueDate);
              if (!due) return false;
              return due.getFullYear() === year && due.getMonth() === month && t.status !== 'Completed';
            }).length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No upcoming tasks this month.</p>
            ) : (
              <div className="space-y-2">
                {tasks.filter((t) => {
                  const due = parseDate(t.dueDate);
                  if (!due) return false;
                  return due.getFullYear() === year && due.getMonth() === month && t.status !== 'Completed';
                }).slice(0, 6).map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.priority === 'Urgent' ? 'bg-red-500' : t.priority === 'High' ? 'bg-orange-500' : 'bg-violet-400'}`} />
                    <span className="text-xs text-gray-700 truncate flex-1">{t.name}</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{parseDate(t.dueDate)?.getDate()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
