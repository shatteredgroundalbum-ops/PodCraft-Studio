import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import {
  LinkIcon,
  PuzzleIcon,
  CodeIcon,
  ShieldIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  CheckIcon } from
'lucide-react';
interface ConnectedService {
  id: string;
  name: string;
  description: string;
}
interface CustomIntegration {
  id: string;
  name: string;
  endpoint: string;
}
const AVAILABLE = [
{
  id: 'slack',
  name: 'Slack',
  desc: 'Get notifications in your team channels.'
},
{
  id: 'notion',
  name: 'Notion',
  desc: 'Sync show notes and episode briefs.'
},
{
  id: 'zapier',
  name: 'Zapier',
  desc: 'Automate workflows across 5000+ apps.'
},
{
  id: 'dropbox',
  name: 'Dropbox',
  desc: 'Back up recordings to your Dropbox.'
},
{
  id: 'gdrive',
  name: 'Google Drive',
  desc: 'Store and share exports in Google Drive.'
},
{
  id: 'github',
  name: 'GitHub',
  desc: 'Track episode tasks alongside issues.'
}];

export function SettingsIntegrations() {
  const [connected, setConnected] = useState<ConnectedService[]>([]);
  const [showBrowse, setShowBrowse] = useState(false);
  const [customs, setCustoms] = useState<CustomIntegration[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [readPerm, setReadPerm] = useState(true);
  const [writePerm, setWritePerm] = useState(false);
  const [deletePerm, setDeletePerm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const connect = (id: string) => {
    const svc = AVAILABLE.find((s) => s.id === id);
    if (!svc) return;
    if (connected.some((c) => c.id === id)) return;
    setConnected((prev) => [
    ...prev,
    {
      id: svc.id,
      name: svc.name,
      description: svc.desc
    }]
    );
  };
  const disconnect = (id: string) => {
    setConnected((prev) => prev.filter((c) => c.id !== id));
  };
  const addCustom = () => {
    if (!customName.trim() || !customEndpoint.trim()) return;
    setCustoms((prev) => [
    ...prev,
    {
      id: Math.random().toString(36).slice(2),
      name: customName.trim(),
      endpoint: customEndpoint.trim()
    }]
    );
    setCustomName('');
    setCustomEndpoint('');
    setShowAddCustom(false);
  };
  const removeCustom = (id: string) =>
  setCustoms((prev) => prev.filter((c) => c.id !== id));
  const logs = [
  ...connected.map((c) => ({
    id: `conn-${c.id}`,
    msg: `Connected to ${c.name}`,
    ts: 'Just now'
  })),
  ...customs.map((c) => ({
    id: `cust-${c.id}`,
    msg: `Added custom integration "${c.name}"`,
    ts: 'Just now'
  }))];

  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Integrations</h1>
        <p className="text-sm text-gray-500">
          Connect and manage third-party services and integrations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-5xl space-y-6">
          {/* Connected Services */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">
                Connected Services
              </h2>
              <p className="text-sm text-gray-500">
                Manage your connected accounts and services.
              </p>
            </div>
            <div className="flex-1">
              {connected.length === 0 ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <LinkIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No connected services yet.
                  </p>
                  <p className="text-xs text-gray-500">
                    Connect a service to get started.
                  </p>
                </div> :

              <div className="space-y-2">
                  {connected.map((svc) =>
                <div
                  key={svc.id}
                  className="flex items-center gap-4 border border-gray-100 rounded-lg p-3">
                  
                      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                        <CheckIcon className="w-5 h-5 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {svc.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {svc.description}
                        </p>
                      </div>
                      <button
                    onClick={() => disconnect(svc.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                    
                        Disconnect
                      </button>
                    </div>
                )}
                </div>
              }
            </div>
          </div>

          {/* Available Integrations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">
                Available Integrations
              </h2>
              <p className="text-sm text-gray-500">
                Browse and connect available integrations.
              </p>
            </div>
            <div className="flex-1">
              {!showBrowse ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <PuzzleIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No integrations added yet.
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Browse integrations to get started.
                  </p>
                  <button
                  onClick={() => setShowBrowse(true)}
                  className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                  
                    Browse Integrations
                  </button>
                </div> :

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {AVAILABLE.map((svc) => {
                  const isConnected = connected.some((c) => c.id === svc.id);
                  return (
                    <div
                      key={svc.id}
                      className="border border-gray-100 rounded-lg p-3 flex items-center gap-3">
                      
                        <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                          <PuzzleIcon className="w-4 h-4 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">
                            {svc.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {svc.desc}
                          </p>
                        </div>
                        <button
                        onClick={() =>
                        isConnected ? disconnect(svc.id) : connect(svc.id)
                        }
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isConnected ? 'text-gray-600 border border-gray-200 hover:bg-gray-50' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}>
                        
                          {isConnected ? 'Connected' : 'Connect'}
                        </button>
                      </div>);

                })}
                </div>
              }
            </div>
          </div>

          {/* Custom Integrations */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">
                Custom Integrations
              </h2>
              <p className="text-sm text-gray-500">
                Add and manage custom integrations.
              </p>
            </div>
            <div className="flex-1">
              {showAddCustom &&
              <div className="border border-violet-200 bg-violet-50/30 rounded-lg p-4 mb-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Name
                    </label>
                    <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="My Custom Webhook"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Endpoint URL
                    </label>
                    <input
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://api.example.com/webhook"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                    onClick={() => setShowAddCustom(false)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    
                      Cancel
                    </button>
                    <button
                    onClick={addCustom}
                    className="px-3 py-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                    
                      Add
                    </button>
                  </div>
                </div>
              }

              {customs.length === 0 && !showAddCustom ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <CodeIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No custom integrations yet.
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Add a custom integration to get started.
                  </p>
                  <button
                  onClick={() => setShowAddCustom(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                  
                    <PlusIcon className="w-4 h-4" /> Add Custom Integration
                  </button>
                </div> :
              customs.length > 0 ?
              <div className="space-y-2">
                  {customs.map((c) =>
                <div
                  key={c.id}
                  className="flex items-center gap-4 border border-gray-100 rounded-lg p-3">
                  
                      <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                        <CodeIcon className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {c.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {c.endpoint}
                        </p>
                      </div>
                      <button
                    onClick={() => removeCustom(c.id)}
                    aria-label="Remove"
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                )}
                  {!showAddCustom &&
                <button
                  onClick={() => setShowAddCustom(true)}
                  className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                  
                      <PlusIcon className="w-4 h-4" /> Add another
                    </button>
                }
                </div> :
              null}
            </div>
          </div>

          {/* Integration Permissions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">
                Integration Permissions
              </h2>
              <p className="text-sm text-gray-500">
                Manage permissions for connected integrations.
              </p>
            </div>
            <div className="flex-1">
              {connected.length === 0 && customs.length === 0 ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <ShieldIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No permissions configured yet.
                  </p>
                  <p className="text-xs text-gray-500">
                    Permissions will appear here.
                  </p>
                </div> :

              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        Read access
                      </h3>
                      <p className="text-xs text-gray-500">
                        Allow integrations to read your data.
                      </p>
                    </div>
                    <Toggle checked={readPerm} onChange={setReadPerm} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        Write access
                      </h3>
                      <p className="text-xs text-gray-500">
                        Allow integrations to create and update data.
                      </p>
                    </div>
                    <Toggle checked={writePerm} onChange={setWritePerm} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        Delete access
                      </h3>
                      <p className="text-xs text-gray-500">
                        Allow integrations to delete data.
                      </p>
                    </div>
                    <Toggle checked={deletePerm} onChange={setDeletePerm} />
                  </div>
                </div>
              }
            </div>
          </div>

          {/* Integration Logs */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Integration Logs</h2>
              <p className="text-sm text-gray-500">
                View activity and logs for integrations.
              </p>
            </div>
            <div className="flex-1">
              {logs.length === 0 ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <FileTextIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    No logs available.
                  </p>
                  <p className="text-xs text-gray-500">
                    Logs will appear here.
                  </p>
                </div> :

              <div className="border border-gray-100 rounded-lg divide-y divide-gray-100">
                  {logs.map((log) =>
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3">
                  
                      <p className="text-sm text-gray-900">{log.msg}</p>
                      <p className="text-xs text-gray-500">{log.ts}</p>
                    </div>
                )}
                </div>
              }
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