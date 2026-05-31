import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useScreenInit } from '../useScreenInit';
import {
  CalendarIcon,
  ChevronDownIcon,
  HeadphonesIcon,
  DownloadIcon,
  UsersIcon,
  ClockIcon,
  BarChart3Icon,
  ListIcon,
  UserPlusIcon,
  PercentIcon,
  MapPinIcon,
  PlayIcon,
  HeartIcon,
  MessageCircleIcon,
  Share2Icon,
  RadioIcon,
  InfoIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  MusicIcon } from
'lucide-react';
export function Analytics() {
  const screenInit = useScreenInit();
  const [activeTab, setActiveTab] = useState(screenInit?.tab || 'overview');
  const tabs = [
  {
    id: 'overview',
    label: 'Overview'
  },
  {
    id: 'episodes',
    label: 'Episodes'
  },
  {
    id: 'audience',
    label: 'Audience'
  },
  {
    id: 'engagement',
    label: 'Engagement'
  },
  {
    id: 'platforms',
    label: 'Platforms'
  }];

  return (
    <AppLayout title="Analytics">
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Track your podcast performance and audience insights.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="border-b border-gray-200 mb-8 flex items-center justify-between">
        <div className="flex gap-8">
          {tabs.map((tab) =>
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            
              {tab.label}
            </button>
          )}
        </div>
        <div className="pb-4">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            Last 30 Days
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' &&
        <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Performance Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
            {
              label: 'Total Listens',
              icon: HeadphonesIcon
            },
            {
              label: 'Downloads',
              icon: DownloadIcon
            },
            {
              label: 'Unique Listeners',
              icon: UsersIcon
            },
            {
              label: 'Watch Time',
              icon: ClockIcon
            }].
            map((stat, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
              
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">—</p>
                    <p className="text-xs text-gray-500">No data available</p>
                  </div>
                </div>
            )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-gray-900">Listens Over Time</h3>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Daily <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <BarChart3Icon className="w-8 h-8 text-violet-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    No data to display
                  </h4>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Analytics data will appear here once your episodes start
                    getting listeners.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-gray-900">Top Episodes</h3>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    By Listens <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <ListIcon className="w-8 h-8 text-violet-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    No episodes data
                  </h4>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Your episodes performance will appear here once data is
                    available.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                <UsersIcon className="w-6 h-6 text-violet-500" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                No audience data yet
              </h4>
              <p className="text-sm text-gray-500 max-w-xs">
                Audience demographics and insights will appear here.
              </p>
            </div>
          </>
        }

        {activeTab === 'episodes' &&
        <>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Episodes Performance
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Detailed performance metrics for your episodes.
              </p>

              <div className="flex items-center justify-between mb-12">
                <div className="relative w-72">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                  type="text"
                  placeholder="Search episodes..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
                </div>
                <div className="flex gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <FilterIcon className="w-4 h-4" /> Filter
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    <ArrowUpDownIcon className="w-4 h-4" /> Sort
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="relative mb-6">
                  <div className="w-28 h-28 bg-violet-50 rounded-2xl flex items-center justify-center">
                    <BarChart3Icon className="w-12 h-12 text-violet-400" />
                  </div>
                  <div className="absolute -top-2 -left-2 text-violet-200">
                    ✦
                  </div>
                  <div className="absolute top-4 -right-4 text-violet-200">
                    ✦
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No episode data yet
                </h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Episode performance data will appear here once your episodes
                  start getting listeners.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
            {
              title: 'Top Episodes by Listens',
              icon: HeadphonesIcon,
              desc: 'Your most listened episodes will appear here.'
            },
            {
              title: 'Top Episodes by Downloads',
              icon: DownloadIcon,
              desc: 'Download data will appear here.'
            },
            {
              title: 'Watch Time by Episode',
              icon: ClockIcon,
              desc: 'Watch time data will appear here.'
            },
            {
              title: 'Average Listen Duration',
              icon: ClockIcon,
              desc: 'Average duration data will appear here.'
            }].
            map((card, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-64">
              
                  <h4 className="font-bold text-gray-900 text-sm mb-auto">
                    {card.title}
                  </h4>
                  <div className="flex flex-col items-center text-center mt-4">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                      <card.icon className="w-6 h-6 text-violet-500" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      No data yet
                    </p>
                    <p className="text-xs text-gray-500">{card.desc}</p>
                  </div>
                </div>
            )}
            </div>
          </>
        }

        {activeTab === 'audience' &&
        <>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Audience Overview
              </h2>
              <p className="text-sm text-gray-500">
                Understand who's listening to your podcast.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
            {
              label: 'Total Listeners',
              icon: UsersIcon,
              val: '0'
            },
            {
              label: 'New Listeners',
              icon: UserPlusIcon,
              val: '0'
            },
            {
              label: 'Returning Listeners',
              icon: UsersIcon,
              val: '0'
            },
            {
              label: 'Listener Retention',
              icon: PercentIcon,
              val: '—'
            }].
            map((stat, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
              
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.val}
                    </p>
                    <p className="text-xs text-gray-500">
                      — vs. previous 30 days
                    </p>
                  </div>
                </div>
            )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 flex flex-col min-h-[400px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      Listeners Over Time
                    </h3>
                    <InfoIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    Daily <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Faint Chart Background */}
                <div className="absolute inset-x-0 bottom-0 top-24 pointer-events-none px-6 pb-8 flex flex-col">
                  <div className="flex-1 flex">
                    <div className="w-8 flex flex-col justify-between text-xs text-gray-400 pb-6">
                      <span>100</span>
                      <span>75</span>
                      <span>50</span>
                      <span>25</span>
                      <span>0</span>
                    </div>
                    <div className="flex-1 relative ml-2">
                      <svg
                      className="absolute inset-0 w-full h-[calc(100%-24px)]"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100">
                      
                        <path
                        d="M0,80 Q10,60 20,70 T40,60 T60,80 T80,50 T100,70 L100,100 L0,100 Z"
                        fill="#f3e8ff"
                        opacity="0.4" />
                      
                        <path
                        d="M0,80 Q10,60 20,70 T40,60 T60,80 T80,50 T100,70"
                        fill="none"
                        stroke="#ddd6fe"
                        strokeWidth="2"
                        strokeDasharray="4 4" />
                      
                      </svg>
                      <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-400">
                        <span>Apr 28</span>
                        <span>May 5</span>
                        <span>May 12</span>
                        <span>May 19</span>
                        <span>May 26</span>
                        <span>Jun 2</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <BarChart3Icon className="w-8 h-8 text-violet-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    No data to display
                  </h4>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Audience data will appear here once your episodes start
                    getting listeners.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">Top Countries</h3>
                    <InfoIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    By Listeners <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 flex items-center justify-center gap-8">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f3e8ff"
                      strokeWidth="12" />
                    
                      <circle
                      cx="50"
                      cy="50"
                      r="26"
                      fill="none"
                      stroke="#ddd6fe"
                      strokeWidth="12" />
                    
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-500">
                        No data
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                  {
                    label: 'United States',
                    color: 'bg-violet-700'
                  },
                  {
                    label: 'India',
                    color: 'bg-violet-500'
                  },
                  {
                    label: 'United Kingdom',
                    color: 'bg-violet-300'
                  },
                  {
                    label: 'Canada',
                    color: 'bg-teal-500'
                  },
                  {
                    label: 'Australia',
                    color: 'bg-orange-500'
                  },
                  {
                    label: 'Other',
                    color: 'bg-gray-400'
                  }].
                  map((item, i) =>
                  <div
                    key={i}
                    className="flex items-center justify-between gap-4 text-sm">
                    
                        <div className="flex items-center gap-2">
                          <div
                        className={`w-2.5 h-2.5 rounded-full ${item.color}`}>
                      </div>
                          <span className="text-gray-700 font-medium">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-gray-500">0%</span>
                      </div>
                  )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-72">
                <div className="flex items-center gap-2 mb-auto">
                  <h4 className="font-bold text-gray-900 text-sm">Age Range</h4>
                  <InfoIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <UsersIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">
                    No data yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Age range data will appear here once available.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-72">
                <div className="flex items-center gap-2 mb-auto">
                  <h4 className="font-bold text-gray-900 text-sm">Gender</h4>
                  <InfoIcon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#f3e8ff"
                      strokeWidth="10" />
                    
                      <circle
                      cx="50"
                      cy="50"
                      r="23"
                      fill="none"
                      stroke="#ddd6fe"
                      strokeWidth="10" />
                    
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-500">
                        No data
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-600"></div>
                        <span className="text-gray-700 font-medium">—</span>
                      </div>
                      <span className="text-gray-500">0%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-violet-300"></div>
                        <span className="text-gray-700 font-medium">—</span>
                      </div>
                      <span className="text-gray-500">0%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-72">
                <div className="flex items-center justify-between mb-auto">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm">
                      Listener Locations
                    </h4>
                    <InfoIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    By Listeners <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <MapPinIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="font-bold text-gray-900 text-sm mb-1">
                    No data yet
                  </p>
                  <p className="text-xs text-gray-500">
                    Listener locations will appear here once available.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-sm mt-4">
              <InfoIcon className="w-4 h-4" />
              <p>
                Audience data is aggregated from all available platforms and may
                not update in real-time.
              </p>
            </div>
          </>
        }

        {activeTab === 'engagement' &&
        <>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Engagement Overview
              </h2>
              <p className="text-sm text-gray-500">
                See how your audience interacts with your podcast.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
            {
              label: 'Avg. Completion Rate',
              icon: PlayIcon
            },
            {
              label: 'Likes',
              icon: HeartIcon
            },
            {
              label: 'Comments',
              icon: MessageCircleIcon
            },
            {
              label: 'Shares',
              icon: Share2Icon
            }].
            map((stat, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
              
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <p className="text-sm text-gray-500">{stat.label}</p>
                      <InfoIcon className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">—</p>
                    <p className="text-xs text-gray-500">
                      — vs. previous 30 days
                    </p>
                  </div>
                </div>
            )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col min-h-[400px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      Completion Rate Over Time
                    </h3>
                    <InfoIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    By Episode <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Faint Chart Background */}
                <div className="absolute inset-x-0 bottom-0 top-24 pointer-events-none px-6 pb-8 flex flex-col">
                  <div className="flex-1 flex">
                    <div className="w-10 flex flex-col justify-between text-xs text-gray-400 pb-6">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    <div className="flex-1 relative ml-2">
                      <svg
                      className="absolute inset-0 w-full h-[calc(100%-24px)]"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 100">
                      
                        <path
                        d="M0,80 L20,50 L40,70 L60,40 L80,60 L100,30 L100,100 L0,100 Z"
                        fill="#f3e8ff"
                        opacity="0.4" />
                      
                        <path
                        d="M0,80 L20,50 L40,70 L60,40 L80,60 L100,30"
                        fill="none"
                        stroke="#c4b5fd"
                        strokeWidth="2" />
                      
                        <circle cx="20" cy="50" r="2" fill="#8b5cf6" />
                        <circle cx="40" cy="70" r="2" fill="#8b5cf6" />
                        <circle cx="60" cy="40" r="2" fill="#8b5cf6" />
                        <circle cx="80" cy="60" r="2" fill="#8b5cf6" />
                      </svg>
                      <div className="absolute bottom-0 inset-x-0 flex justify-between text-xs text-gray-400">
                        <span>Apr 28</span>
                        <span>May 5</span>
                        <span>May 12</span>
                        <span>May 19</span>
                        <span>May 26</span>
                        <span>Jun 2</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <BarChart3Icon className="w-8 h-8 text-violet-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">
                    No data to display
                  </h4>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Engagement data will appear here once your episodes start
                    getting listeners.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">
                      Engagement by Episode
                    </h3>
                    <InfoIcon className="w-4 h-4 text-gray-400" />
                  </div>
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    By Completion Rate <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                    <ListIcon className="w-8 h-8 text-violet-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-2">No data yet</h4>
                  <p className="text-sm text-gray-500 max-w-xs">
                    Episode engagement breakdown will appear here once data is
                    available.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
            {
              title: 'Top Episodes by Likes',
              icon: HeartIcon,
              filter: 'By Likes'
            },
            {
              title: 'Top Episodes by Comments',
              icon: MessageCircleIcon,
              filter: 'By Comments'
            },
            {
              title: 'Top Episodes by Shares',
              icon: Share2Icon,
              filter: 'By Shares'
            }].
            map((card, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-72">
              
                  <div className="flex items-center justify-between mb-auto">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 text-sm">
                        {card.title}
                      </h4>
                      <InfoIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <button className="flex items-center gap-1 px-2 py-1 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                      {card.filter} <ChevronDownIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
                      <card.icon className="w-6 h-6 text-violet-500" />
                    </div>
                    <p className="font-bold text-gray-900 text-sm mb-1">
                      No data yet
                    </p>
                    <p className="text-xs text-gray-500">
                      Your most {card.filter.split(' ')[1].toLowerCase()}{' '}
                      episodes will appear here.
                    </p>
                  </div>
                </div>
            )}
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-sm mt-4">
              <InfoIcon className="w-4 h-4" />
              <p>
                Engagement metrics are aggregated across all platforms and may
                not update in real-time.
              </p>
            </div>
          </>
        }

        {activeTab === 'platforms' &&
        <div className="space-y-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Platform Performance
              </h2>
              <p className="text-sm text-gray-500">
                See how your podcast performs across all platforms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
            {
              label: 'Total Listens',
              icon: HeadphonesIcon,
              val: '0'
            },
            {
              label: 'Downloads',
              icon: DownloadIcon,
              val: '0'
            },
            {
              label: 'Unique Listeners',
              icon: UsersIcon,
              val: '0'
            },
            {
              label: 'Watch Time',
              icon: ClockIcon,
              val: '0h 0m'
            }].
            map((stat, i) =>
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
              
                  <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <stat.icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                      {stat.val}
                    </p>
                    <p className="text-xs text-gray-500">
                      — vs. previous 30 days
                    </p>
                  </div>
                </div>
            )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900">
                  Performance by Platform
                </h3>
                <div className="flex gap-3">
                  <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    By Listens <ChevronDownIcon className="w-3 h-3" />
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50">
                    <DownloadIcon className="w-3 h-3" /> Export{' '}
                    <ChevronDownIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="pb-4 font-medium">Platform</th>
                      <th className="pb-4 font-medium text-right">
                        <div className="flex items-center justify-end gap-1">
                          Listens <InfoIcon className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="pb-4 font-medium text-right">
                        <div className="flex items-center justify-end gap-1">
                          Downloads <InfoIcon className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="pb-4 font-medium text-right">
                        <div className="flex items-center justify-end gap-1">
                          Unique Listeners <InfoIcon className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="pb-4 font-medium text-right">
                        <div className="flex items-center justify-end gap-1">
                          Watch Time <InfoIcon className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="pb-4 font-medium text-right w-48">
                        Share of Listens
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[
                  {
                    name: 'Apple Podcasts',
                    icon: RadioIcon,
                    color: 'bg-violet-600 text-white'
                  },
                  {
                    name: 'Spotify',
                    icon: RadioIcon,
                    color: 'bg-green-500 text-white'
                  },
                  {
                    name: 'YouTube',
                    icon: PlayIcon,
                    color: 'bg-red-500 text-white'
                  },
                  {
                    name: 'Google Podcasts',
                    icon: RadioIcon,
                    color: 'bg-gray-100 text-gray-600'
                  },
                  {
                    name: 'Amazon Music',
                    icon: MusicIcon,
                    color: 'bg-blue-500 text-white'
                  },
                  {
                    name: 'Pocket Casts',
                    icon: RadioIcon,
                    color: 'bg-red-500 text-white'
                  },
                  {
                    name: 'Other',
                    icon: RadioIcon,
                    color: 'bg-gray-200 text-gray-500'
                  }].
                  map((platform, i) =>
                  <tr key={i} className="hover:bg-gray-50/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div
                          className={`w-6 h-6 rounded flex items-center justify-center ${platform.color}`}>
                          
                              <platform.icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {platform.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 text-right text-gray-900">0</td>
                        <td className="py-4 text-right text-gray-900">0</td>
                        <td className="py-4 text-right text-gray-900">0</td>
                        <td className="py-4 text-right text-gray-900">0h 0m</td>
                        <td className="py-4">
                          <div className="flex items-center justify-end gap-3">
                            <span className="text-gray-500 w-8 text-right">
                              0%
                            </span>
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full"></div>
                          </div>
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-center">
                <button className="flex items-center gap-1 text-sm font-medium text-violet-600 hover:text-violet-700">
                  Show all platforms <ChevronDownIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <div className="w-6 h-6 text-violet-600">
                    <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round">
                    
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    Platform Insights
                  </h3>
                  <p className="text-sm text-gray-500">
                    Connect more platforms and keep publishing to see detailed
                    insights about where your audience is listening.
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                Manage Distribution
              </button>
            </div>
          </div>
        }
      </div>
    </AppLayout>);

}