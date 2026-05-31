import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { useScreenInit } from '../useScreenInit';
import { CalendarIcon, ChevronDownIcon, HeadphonesIcon, DownloadIcon, UsersIcon, ClockIcon, BarChart3Icon, UserPlusIcon, PercentIcon, MapPinIcon, PlayIcon, HeartIcon, MessageCircleIcon, Share2Icon, RadioIcon } from 'lucide-react';

export function Analytics() {
  const screenInit = useScreenInit();
  const [activeTab, setActiveTab] = useState(screenInit?.tab || 'overview');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'episodes', label: 'Episodes' },
    { id: 'audience', label: 'Audience' },
    { id: 'engagement', label: 'Engagement' },
    { id: 'platforms', label: 'Platforms' },
  ];

  const StatCard = ({ label, icon: Icon }: { label: string; icon: React.ElementType }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-violet-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mb-1">—</p>
        <p className="text-xs text-gray-500">No data available</p>
      </div>
    </div>
  );

  return (
    <AppLayout title="Analytics">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Track your podcast performance and audience insights.</p>
      </div>

      <div className="border-b border-gray-200 mb-8 flex items-center justify-between">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pb-4">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            Last 30 Days
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'overview' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatCard label="Total Listens" icon={HeadphonesIcon} />
              <StatCard label="Downloads" icon={DownloadIcon} />
              <StatCard label="Unique Listeners" icon={UsersIcon} />
              <StatCard label="Watch Time" icon={ClockIcon} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <BarChart3Icon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">No Analytics Data Yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">Analytics data will appear here once you start publishing episodes. Connect your distribution platforms to see real-time listener insights.</p>
            </div>
          </>
        )}

        {activeTab === 'episodes' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Episode Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard label="Total Episodes" icon={RadioIcon} />
              <StatCard label="Avg. Listens per Episode" icon={HeadphonesIcon} />
              <StatCard label="Avg. Completion Rate" icon={PercentIcon} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <RadioIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">No Episodes Published</h3>
              <p className="text-sm text-gray-500">Publish your first episode to see episode-level analytics.</p>
            </div>
          </>
        )}

        {activeTab === 'audience' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Audience Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatCard label="New Subscribers" icon={UserPlusIcon} />
              <StatCard label="Returning Listeners" icon={UsersIcon} />
              <StatCard label="Geographic Reach" icon={MapPinIcon} />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <UsersIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="font-bold text-gray-900 mb-2">Audience Data Unavailable</h3>
              <p className="text-sm text-gray-500">Connect your podcast to distribution platforms to collect audience data.</p>
            </div>
          </>
        )}

        {activeTab === 'engagement' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <StatCard label="Total Plays" icon={PlayIcon} />
              <StatCard label="Likes & Reactions" icon={HeartIcon} />
              <StatCard label="Comments" icon={MessageCircleIcon} />
              <StatCard label="Shares" icon={Share2Icon} />
            </div>
          </>
        )}

        {activeTab === 'platforms' && (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Platform Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Spotify', 'Apple Podcasts', 'Google Podcasts', 'Amazon Music', 'Overcast', 'Pocket Casts'].map((platform) => (
                <div key={platform} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{platform}</p>
                    <p className="text-xs text-gray-500">Not connected</p>
                  </div>
                  <button className="px-3 py-1.5 border border-violet-200 text-violet-600 rounded-lg text-xs font-medium hover:bg-violet-50 transition-colors">Connect</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
