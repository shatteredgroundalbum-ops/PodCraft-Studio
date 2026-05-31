import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { ChevronRightIcon, CheckIcon } from 'lucide-react';
import { Toggle } from '../components/Toggle';
export function SettingsAdvanced() {
  const [devMode, setDevMode] = useState(false);
  const [debugLog, setDebugLog] = useState(false);
  const [expFeatures, setExpFeatures] = useState(false);
  const [bgProcessing, setBgProcessing] = useState(false);
  return (
    <AppLayout>
      <div className="px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>Settings</span>
          <ChevronRightIcon className="w-4 h-4" />
          <span className="text-gray-900">Advanced</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Advanced</h1>
        <p className="text-gray-500 mb-8">
          Configure advanced settings and system preferences.
        </p>

        <div className="flex gap-8">
          <SettingsSidebar />

          <div className="flex-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Developer Mode
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enable developer mode for advanced tools and experimental
                  capabilities.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {devMode ? 'On' : 'Off'}
                </span>
                <Toggle defaultChecked={devMode} onChange={setDevMode} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Debug Logging
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Enable detailed debug logging for troubleshooting.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {debugLog ? 'On' : 'Off'}
                </span>
                <Toggle defaultChecked={debugLog} onChange={setDebugLog} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Experimental Features
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Access upcoming features that are under development.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {expFeatures ? 'On' : 'Off'}
                </span>
                <Toggle
                  defaultChecked={expFeatures}
                  onChange={setExpFeatures} />
                
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Background Processing
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Allow background tasks for importing, rendering, and other
                  long-running operations.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  {bgProcessing ? 'On' : 'Off'}
                </span>
                <Toggle
                  defaultChecked={bgProcessing}
                  onChange={setBgProcessing} />
                
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  OpenDAW Headless Engine
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Configure the OpenDAW headless engine and related options.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500">Not configured</span>
                <button className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                  Configure
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Local Cache Controls
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Manage locally cached files and temporary data.
                </p>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500">No cache to clear</span>
                <button className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                  Clear Cache
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors inline-flex items-center gap-2">
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}