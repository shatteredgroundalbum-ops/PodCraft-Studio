import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import {
  EyeIcon,
  LockIcon,
  SmartphoneIcon,
  ShieldCheckIcon,
  MonitorIcon,
  ClockIcon } from
'lucide-react';
export function SettingsSecurity() {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Security</h1>
        <p className="text-sm text-gray-500">
          Manage your password, authentication, and account security.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Change Password
                </h2>
                <p className="text-sm text-gray-500">
                  Choose a strong password to keep your account secure.
                </p>
              </div>
              <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                Change Password
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 text-sm" />
                  
                  <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 text-sm" />
                  
                  <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 pr-10 text-sm" />
                  
                  <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Two-Factor Authentication (2FA)
                </h2>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <Toggle defaultChecked={false} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <LockIcon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enhanced Security
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Protect your account with an additional verification step.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <SmartphoneIcon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Secure Login
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Even if someone gets your password, your account stays safe.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Easy to Use
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Quick and simple setup with authenticator apps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Active Sessions
                </h2>
                <p className="text-sm text-gray-500">
                  Manage your active sessions across different devices.
                </p>
              </div>
              <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                Sign Out All Other Sessions
              </button>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-medium">Device</th>
                    <th className="py-3 px-4 font-medium">Location</th>
                    <th className="py-3 px-4 font-medium">IP Address</th>
                    <th className="py-3 px-4 font-medium">Last Active</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
              </table>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <MonitorIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  No active sessions found.
                </h4>
                <p className="text-sm text-gray-500">
                  You're currently not signed in on any other devices.
                </p>
              </div>
            </div>
          </div>

          {/* Login Activity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Login Activity</h2>
                <p className="text-sm text-gray-500">
                  Review your recent login activity.
                </p>
              </div>
              <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                View All Activity
              </button>
            </div>

            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-medium">Device</th>
                    <th className="py-3 px-4 font-medium">Location</th>
                    <th className="py-3 px-4 font-medium">IP Address</th>
                    <th className="py-3 px-4 font-medium">Date & Time</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                  </tr>
                </thead>
              </table>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <ClockIcon className="w-6 h-6 text-gray-400" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  No login activity to show.
                </h4>
                <p className="text-sm text-gray-500">
                  Your recent login activity will appear here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}