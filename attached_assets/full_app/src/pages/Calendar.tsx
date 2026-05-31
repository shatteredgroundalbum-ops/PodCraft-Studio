import React from 'react';
import { AppLayout } from '../components/AppLayout';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  CalendarIcon,
  PlusIcon,
  ArrowUpRightIcon } from
'lucide-react';
export function Calendar() {
  const hours = Array.from(
    {
      length: 11
    },
    (_, i) => i + 8
  ); // 8 AM to 6 PM
  return (
    <AppLayout title="Calendar">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          View and manage your podcast schedule.
        </p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Calendar Area */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Calendar Header Controls */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Today
              </button>
              <div className="flex items-center gap-1">
                <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                May 12 – May 18, 2024
                <ChevronDownIcon className="w-4 h-4 text-gray-500" />
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
                  Day
                </button>
                <button className="px-4 py-1.5 text-sm font-medium bg-white text-violet-700 shadow-sm rounded-md">
                  Week
                </button>
                <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md">
                  Month
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <FilterIcon className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto relative min-h-[600px]">
            <div className="flex border-b border-gray-200">
              <div className="w-16 flex-shrink-0 border-r border-gray-200 p-3 flex items-end justify-center text-xs text-gray-500">
                ET
              </div>
              {[
              'SUN 12',
              'MON 13',
              'TUE 14',
              'WED 15',
              'THU 16',
              'FRI 17',
              'SAT 18'].
              map((day, i) =>
              <div
                key={i}
                className="flex-1 border-r border-gray-200 p-3 text-center">
                
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {day.split(' ')[0]}
                  </p>
                  <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-medium ${day.includes('13') ? 'bg-violet-600 text-white' : 'text-gray-900'}`}>
                  
                    {day.split(' ')[1]}
                  </div>
                </div>
              )}
            </div>
            <div className="flex border-b border-gray-200">
              <div className="w-16 flex-shrink-0 border-r border-gray-200 p-2 text-xs text-gray-500 text-center">
                all-day
              </div>
              {Array.from({
                length: 7
              }).map((_, i) =>
              <div key={i} className="flex-1 border-r border-gray-200"></div>
              )}
            </div>

            <div className="relative">
              {/* Grid Lines */}
              {hours.map((hour) =>
              <div key={hour} className="flex border-b border-gray-100 h-16">
                  <div className="w-16 flex-shrink-0 border-r border-gray-200 pr-2 pt-2 text-xs text-gray-500 text-right">
                    {hour > 12 ? hour - 12 : hour} {hour >= 12 ? 'PM' : 'AM'}
                  </div>
                  {Array.from({
                  length: 7
                }).map((_, i) =>
                <div
                  key={i}
                  className="flex-1 border-r border-gray-100 relative">
                  
                      {/* Highlight line for current time on Monday */}
                      {i === 1 && hour === 10 &&
                  <div className="absolute top-1/2 left-0 right-0 border-t-2 border-violet-600 z-10">
                          <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-violet-600"></div>
                        </div>
                  }
                    </div>
                )}
                </div>
              )}

              {/* Empty State Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl flex flex-col items-center text-center shadow-sm border border-gray-100 pointer-events-auto">
                  <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center text-violet-500 mb-4">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No events scheduled
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    You're all caught up!
                  </p>
                  <button className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900">Upcoming Events</h3>
              <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                View all
              </button>
            </div>
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-400 mb-4">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                No upcoming events
              </h4>
              <p className="text-sm text-gray-500 mb-6">
                Schedule your tasks and recording sessions.
              </p>
              <button className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                <PlusIcon className="w-4 h-4" />
                Create Event
              </button>
            </div>
          </div>

          {/* Mini Calendar */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">May 2024</h3>
              <div className="flex items-center gap-1">
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) =>
              <div key={i} className="text-xs font-medium text-gray-500 py-1">
                  {d}
                </div>
              )}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
              {[28, 29, 30].map((d) =>
              <div key={`prev-${d}`} className="py-1.5 text-gray-300">
                  {d}
                </div>
              )}
              {Array.from(
                {
                  length: 31
                },
                (_, i) => i + 1
              ).map((d) =>
              <div
                key={d}
                className={`py-1.5 rounded-full ${d === 13 ? 'bg-violet-600 text-white font-medium' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'}`}>
                
                  {d}
                </div>
              )}
              {[1].map((d) =>
              <div key={`next-${d}`} className="py-1.5 text-gray-300">
                  {d}
                </div>
              )}
            </div>
          </div>

          {/* No Events Selected */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-6">No Events Selected</h3>
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center text-violet-400 mb-4">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <p className="text-sm text-gray-500">
                Select an event to view details here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}
function ChevronDownIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      
      <path d="m6 9 6 6 6-6" />
    </svg>);

}