import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { ChevronRightIcon } from 'lucide-react';
export function SettingsDangerZone() {
  return (
    <AppLayout>
      <div className="px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Settings</span>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-900">Danger Zone</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Danger Zone</h1>
        <p className="text-gray-500 mb-8">
          Irreversible and destructive actions. Please proceed with caution.
        </p>

        <div className="flex gap-8">
          <SettingsSidebar />
          <div className="flex-1 space-y-6">
            <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-red-600">
                  Delete Project
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Permanently delete this project and all of its data.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Delete Project
              </button>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-red-600">
                  Clear Local Cache
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Permanently clear your local cache and temporary files.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Clear Cache
              </button>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-red-600">
                  Reset All Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Reset all settings to their default values. This action cannot
                  be undone.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Reset Settings
              </button>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-red-600">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Permanently delete your account and all associated data. This
                  action cannot be undone.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Delete Account
              </button>
            </div>

            <div className="bg-white border border-red-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-red-600">
                  Sign Out Everywhere
                </h3>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                  Sign out of your account on all devices and browsers.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">
                Sign Out Everywhere
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}