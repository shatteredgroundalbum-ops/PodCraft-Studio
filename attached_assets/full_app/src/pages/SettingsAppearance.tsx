import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import { CheckIcon } from 'lucide-react';
export function SettingsAppearance() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [accentColor, setAccentColor] = useState('violet');
  const [fontSize, setFontSize] = useState('Medium');
  const colors = [
  {
    id: 'violet',
    bg: 'bg-violet-600',
    ring: 'ring-violet-200'
  },
  {
    id: 'blue',
    bg: 'bg-blue-500',
    ring: 'ring-blue-200'
  },
  {
    id: 'cyan',
    bg: 'bg-cyan-500',
    ring: 'ring-cyan-200'
  },
  {
    id: 'emerald',
    bg: 'bg-emerald-500',
    ring: 'ring-emerald-200'
  },
  {
    id: 'orange',
    bg: 'bg-orange-500',
    ring: 'ring-orange-200'
  },
  {
    id: 'red',
    bg: 'bg-red-500',
    ring: 'ring-red-200'
  },
  {
    id: 'gray',
    bg: 'bg-gray-500',
    ring: 'ring-gray-200'
  }];

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Appearance</h1>
        <p className="text-sm text-gray-500">
          Customize how Podify looks and feels for you.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Theme */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Theme</h2>
              <p className="text-sm text-gray-500">
                Choose your preferred theme.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setTheme('light')}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${theme === 'light' ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-200 hover:border-violet-300'}`}>
                
                <div className="bg-gray-50 rounded border border-gray-100 h-24 mb-3 p-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="w-1/3 h-2 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/3 h-2 bg-gray-200 rounded"></div>
                    <div className="w-2/3 h-2 bg-gray-200 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-white border border-gray-200 rounded mt-auto"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'light' ? 'border-violet-600 bg-violet-600' : 'border-gray-300 bg-white'}`}>
                    
                    {theme === 'light' &&
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    }
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Light
                  </span>
                </div>
              </div>

              <div
                onClick={() => setTheme('dark')}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${theme === 'dark' ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-200 hover:border-violet-300'}`}>
                
                <div className="bg-gray-900 rounded border border-gray-800 h-24 mb-3 p-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="w-1/3 h-2 bg-gray-700 rounded"></div>
                    <div className="w-2/3 h-2 bg-gray-700 rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-1/3 h-2 bg-gray-700 rounded"></div>
                    <div className="w-2/3 h-2 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-full h-8 bg-gray-800 border border-gray-700 rounded mt-auto"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'dark' ? 'border-violet-600 bg-violet-600' : 'border-gray-300 bg-white'}`}>
                    
                    {theme === 'dark' &&
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    }
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Dark
                  </span>
                </div>
              </div>

              <div
                onClick={() => setTheme('system')}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${theme === 'system' ? 'border-violet-500 ring-1 ring-violet-500' : 'border-gray-200 hover:border-violet-300'}`}>
                
                <div className="flex h-24 mb-3 rounded border border-gray-200 overflow-hidden">
                  <div className="w-1/2 bg-gray-50 p-2 flex flex-col gap-2 border-r border-gray-200">
                    <div className="w-full h-2 bg-gray-200 rounded"></div>
                    <div className="w-full h-2 bg-gray-200 rounded"></div>
                    <div className="w-full h-8 bg-white border border-gray-200 rounded mt-auto"></div>
                  </div>
                  <div className="w-1/2 bg-gray-900 p-2 flex flex-col gap-2">
                    <div className="w-full h-2 bg-gray-700 rounded"></div>
                    <div className="w-full h-2 bg-gray-700 rounded"></div>
                    <div className="w-full h-8 bg-gray-800 border border-gray-700 rounded mt-auto"></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${theme === 'system' ? 'border-violet-600 bg-violet-600' : 'border-gray-300 bg-white'}`}>
                    
                    {theme === 'system' &&
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    }
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    System
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Accent Color */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Accent Color</h2>
              <p className="text-sm text-gray-500">
                Personalize Podify with your favorite color.
              </p>
            </div>
            <div className="flex-1 flex gap-3">
              {colors.map((c) =>
              <div
                key={c.id}
                onClick={() => setAccentColor(c.id)}
                className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center cursor-pointer transition-all ${accentColor === c.id ? `ring-2 ${c.ring} ring-offset-2` : 'hover:scale-110'}`}>
                
                  {accentColor === c.id &&
                <CheckIcon className="w-4 h-4 text-white" />
                }
                </div>
              )}
            </div>
          </div>

          {/* Interface */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Interface</h2>
              <p className="text-sm text-gray-500">
                Adjust the look and feel of the interface.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Compact mode
                  </h3>
                  <p className="text-xs text-gray-500">
                    Reduce spacing and padding for a more compact interface.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Show sidebar icons only
                  </h3>
                  <p className="text-xs text-gray-500">
                    Display only icons in the sidebar to save space.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Hide sidebar by default
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically collapse the sidebar when you start.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Reduce motion
                  </h3>
                  <p className="text-xs text-gray-500">
                    Minimize animations and transitions across the app.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
            </div>
          </div>

          {/* Font & Text */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Font & Text</h2>
              <p className="text-sm text-gray-500">
                Customize text appearance.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Font size
                </h3>
                <select
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Readable font
                  </h3>
                  <p className="text-xs text-gray-500">
                    Optimize font for readability across the app.
                  </p>
                </div>
                <Toggle defaultChecked={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>);

}