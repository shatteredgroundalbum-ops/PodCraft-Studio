import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import {
  MailIcon,
  MessageSquareIcon,
  AtSignIcon,
  UsersIcon,
  CloudIcon,
  BellIcon,
  GlobeIcon,
  InfoIcon,
  ClockIcon } from
'lucide-react';
export function SettingsNotifications() {
  const [emailSettings, setEmailSettings] = useState([
  {
    id: 'project',
    icon: MailIcon,
    title: 'Project Updates',
    desc: 'Get notified about project activity and changes.',
    instant: true,
    digest: false
  },
  {
    id: 'comments',
    icon: MessageSquareIcon,
    title: 'Comments',
    desc: 'Notifications for comments on your projects.',
    instant: true,
    digest: true
  },
  {
    id: 'mentions',
    icon: AtSignIcon,
    title: 'Mentions',
    desc: 'When someone mentions you in a comment.',
    instant: true,
    digest: false
  },
  {
    id: 'team',
    icon: UsersIcon,
    title: 'Team Invitations',
    desc: "When you're invited to join a team or project.",
    instant: true,
    digest: false
  },
  {
    id: 'uploads',
    icon: CloudIcon,
    title: 'Uploads & Exports',
    desc: 'When your files are ready or export is complete.',
    instant: false,
    digest: true
  },
  {
    id: 'system',
    icon: BellIcon,
    title: 'System Updates',
    desc: 'Important updates and announcements from Podify.',
    instant: false,
    digest: true
  }]
  );
  const toggleEmailSetting = (id: string, type: 'instant' | 'digest') => {
    setEmailSettings((prev) =>
    prev.map((setting) => {
      if (setting.id === id) {
        return {
          ...setting,
          [type]: !setting[type]
        };
      }
      return setting;
    })
    );
  };
  const [startTime, setStartTime] = useState('10:00 PM');
  const [endTime, setEndTime] = useState('8:00 AM');
  const [timezone, setTimezone] = useState('(GMT-5) Eastern Time (US & Canada)');
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Notifications</h1>
        <p className="text-sm text-gray-500">
          Choose how and when you want to be notified about activity in Podify.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Email Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Email Notifications
                </h2>
                <p className="text-sm text-gray-500">
                  Receive notifications via email.
                </p>
              </div>
              <Toggle defaultChecked={true} />
            </div>

            <div className="grid grid-cols-12 gap-4 mb-4">
              <div className="col-span-8"></div>
              <div className="col-span-2 text-center">
                <p className="text-sm font-semibold text-gray-900">Instant</p>
                <p className="text-xs text-gray-500">Real-time emails</p>
              </div>
              <div className="col-span-2 text-center">
                <p className="text-sm font-semibold text-gray-900">Digest</p>
                <p className="text-xs text-gray-500">Daily summary</p>
              </div>
            </div>

            <div className="space-y-6">
              {emailSettings.map((item) =>
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 items-center">
                
                  <div className="col-span-8 flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                    onClick={() => toggleEmailSetting(item.id, 'instant')}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.instant ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white hover:border-violet-400'}`}>
                    
                      {item.instant &&
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      
                          <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7" />
                      
                        </svg>
                    }
                    </button>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                    onClick={() => toggleEmailSetting(item.id, 'digest')}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${item.digest ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white hover:border-violet-400'}`}>
                    
                      {item.digest &&
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      
                          <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7" />
                      
                        </svg>
                    }
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Push Notifications
                </h2>
                <p className="text-sm text-gray-500">
                  Receive notifications in your browser.
                </p>
              </div>
              <Toggle defaultChecked={true} />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <GlobeIcon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Browser Push Notifications
                  </h3>
                  <p className="text-xs text-gray-500">
                    Get real-time notifications even when you're not in Podify.
                  </p>
                </div>
              </div>
              <Toggle defaultChecked={true} />
            </div>
          </div>

          {/* Quiet Hours */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Quiet Hours</h2>
                <p className="text-sm text-gray-500">
                  Pause non-urgent notifications during these hours.
                </p>
              </div>
              <Toggle defaultChecked={true} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Start Time
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm">
                    
                    <option>8:00 PM</option>
                    <option>9:00 PM</option>
                    <option>10:00 PM</option>
                    <option>11:00 PM</option>
                    <option>12:00 AM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  End Time
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm">
                    
                    <option>6:00 AM</option>
                    <option>7:00 AM</option>
                    <option>8:00 AM</option>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Your time zone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>(GMT-5) Eastern Time (US & Canada)</option>
                  <option>(GMT-6) Central Time (US & Canada)</option>
                  <option>(GMT-7) Mountain Time (US & Canada)</option>
                  <option>(GMT-8) Pacific Time (US & Canada)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <InfoIcon className="w-4 h-4" />
              <p>
                Urgent notifications like team invites and security alerts will
                still be sent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}