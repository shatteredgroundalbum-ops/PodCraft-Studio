import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import {
  FolderIcon,
  SettingsIcon,
  PlusIcon,
  Trash2Icon,
  HardDriveIcon,
  CloudIcon } from
'lucide-react';
interface StorageLocation {
  id: string;
  name: string;
  type: 'local' | 'cloud';
  path: string;
  size: number; // GB
}
export function SettingsStorage() {
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPath, setNewPath] = useState('');
  const [newType, setNewType] = useState<'local' | 'cloud'>('local');
  const [newSize, setNewSize] = useState('100');
  const [autoCleanup, setAutoCleanup] = useState(false);
  const [compressOldFiles, setCompressOldFiles] = useState(true);
  const [warnAtThreshold, setWarnAtThreshold] = useState(true);
  const [retention, setRetention] = useState('30 days');
  const [warnPercent, setWarnPercent] = useState('80%');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const totalStorage = locations.reduce((s, l) => s + l.size, 0);
  const usedStorage = locations.reduce((s, l) => s + l.size * 0.4, 0); // simulate 40% usage
  const availableStorage = totalStorage - usedStorage;
  const addLocation = () => {
    if (!newName.trim() || !newPath.trim()) return;
    setLocations((prev) => [
    ...prev,
    {
      id: Math.random().toString(36).slice(2),
      name: newName.trim(),
      type: newType,
      path: newPath.trim(),
      size: parseInt(newSize) || 100
    }]
    );
    setNewName('');
    setNewPath('');
    setNewSize('100');
    setNewType('local');
    setShowAddForm(false);
  };
  const removeLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
  };
  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Storage</h1>
        <p className="text-sm text-gray-500">
          Manage your storage settings, locations, and preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-5xl space-y-6">
          {/* Storage Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-6">Storage Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
              {
                label: 'Total Storage',
                value: totalStorage,
                color: 'text-violet-600'
              },
              {
                label: 'Used Storage',
                value: usedStorage,
                color: 'text-orange-500'
              },
              {
                label: 'Available Storage',
                value: availableStorage,
                color: 'text-emerald-500'
              }].
              map((stat, i) => {
                const pct =
                totalStorage > 0 ? stat.value / totalStorage * 100 : 0;
                const dashOffset = 175.93 - 175.93 * pct / 100;
                return (
                  <div
                    key={i}
                    className="border border-gray-100 rounded-lg p-5">
                    
                    <p className="text-sm font-semibold text-gray-900 mb-4">
                      {stat.label}
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16">
                        <svg
                          className="w-16 h-16 -rotate-90"
                          viewBox="0 0 64 64">
                          
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="#f3f4f6"
                            strokeWidth="6"
                            fill="none" />
                          
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray="175.93"
                            strokeDashoffset={dashOffset}
                            className={stat.color}
                            strokeLinecap="round" />
                          
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                          {totalStorage === 0 ? '—' : `${Math.round(pct)}%`}
                        </div>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {stat.value.toFixed(1)} GB
                        </p>
                        <p className="text-xs text-gray-500">
                          {totalStorage === 0 ?
                          'No data' :
                          `of ${totalStorage.toFixed(1)} GB`}
                        </p>
                      </div>
                    </div>
                  </div>);

              })}
            </div>
          </div>

          {/* Storage Locations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Storage Locations
                </h2>
                <p className="text-sm text-gray-500">
                  Manage and configure your storage locations.
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                
                <PlusIcon className="w-4 h-4" /> Add Location
              </button>
            </div>

            {showAddForm &&
            <div className="border border-violet-200 bg-violet-50/30 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Name
                    </label>
                    <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Main Drive"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Type
                    </label>
                    <select
                    value={newType}
                    onChange={(e) =>
                    setNewType(e.target.value as 'local' | 'cloud')
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                    
                      <option value="local">Local</option>
                      <option value="cloud">Cloud</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Path / URL
                    </label>
                    <input
                    value={newPath}
                    onChange={(e) => setNewPath(e.target.value)}
                    placeholder={
                    newType === 'local' ?
                    '/Users/me/Podcast' :
                    's3://my-bucket'
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Capacity (GB)
                    </label>
                    <input
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    type="number"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                  
                    Cancel
                  </button>
                  <button
                  onClick={addLocation}
                  className="px-3 py-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                  
                    Add
                  </button>
                </div>
              </div>
            }

            {locations.length === 0 ?
            <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <FolderIcon className="w-7 h-7 text-violet-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  No storage locations added yet.
                </p>
                <p className="text-xs text-gray-500">
                  Add a location to get started.
                </p>
              </div> :

            <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                {locations.map((loc) =>
              <div key={loc.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      {loc.type === 'cloud' ?
                  <CloudIcon className="w-5 h-5 text-violet-600" /> :

                  <HardDriveIcon className="w-5 h-5 text-violet-600" />
                  }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">
                        {loc.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {loc.path}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {loc.size} GB
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {loc.type}
                      </p>
                    </div>
                    <button
                  onClick={() => removeLocation(loc.id)}
                  aria-label="Remove location"
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </div>
              )}
              </div>
            }
          </div>

          {/* Storage Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="font-bold text-gray-900 mb-1">Storage Settings</h2>
              <p className="text-sm text-gray-500">
                Configure how storage is used and managed.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Auto-cleanup old recordings
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically delete unused recordings after retention
                    period.
                  </p>
                </div>
                <Toggle checked={autoCleanup} onChange={setAutoCleanup} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Compress old files
                  </h3>
                  <p className="text-xs text-gray-500">
                    Compress files older than 30 days to save space.
                  </p>
                </div>
                <Toggle
                  checked={compressOldFiles}
                  onChange={setCompressOldFiles} />
                
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Warn when nearing capacity
                  </h3>
                  <p className="text-xs text-gray-500">
                    Get notified when a storage location is almost full.
                  </p>
                </div>
                <Toggle
                  checked={warnAtThreshold}
                  onChange={setWarnAtThreshold} />
                
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <label className="text-sm font-semibold text-gray-900">
                  Retention period
                </label>
                <select
                  value={retention}
                  onChange={(e) => setRetention(e.target.value)}
                  className="w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-sm">
                  
                  <option>7 days</option>
                  <option>30 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                  <option>Forever</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  Capacity warning at
                </label>
                <select
                  value={warnPercent}
                  onChange={(e) => setWarnPercent(e.target.value)}
                  className="w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-sm">
                  
                  <option>70%</option>
                  <option>80%</option>
                  <option>90%</option>
                  <option>95%</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center gap-3">
            {saveStatus === 'saved' &&
            <span className="text-sm text-emerald-600 font-medium">
                Changes saved
              </span>
            }
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
              
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppLayout>);

}