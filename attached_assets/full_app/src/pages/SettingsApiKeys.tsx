import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import {
  LinkIcon,
  ShieldIcon,
  TargetIcon,
  WebhookIcon,
  BookOpenIcon,
  FileTextIcon,
  LockIcon,
  PlusIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon } from
'lucide-react';
interface ApiKey {
  id: string;
  name: string;
  description: string;
  key: string;
  permissions: string[];
  lastUsed: string;
  active: boolean;
  createdAt: number;
}
interface Webhook {
  id: string;
  url: string;
  event: string;
}
const ALL_PERMS = [
'read:projects',
'write:projects',
'read:episodes',
'write:episodes',
'read:analytics'];

function generateKey() {
  return (
    'pod_' +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2));

}
export function SettingsApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPerms, setNewPerms] = useState<string[]>(['read:projects']);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('episode.published');
  const [rateLimit, setRateLimit] = useState(true);
  const [ipAllowlist, setIpAllowlist] = useState(false);
  const [logRequests, setLogRequests] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const togglePerm = (perm: string) => {
    setNewPerms((prev) =>
    prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };
  const createKey = () => {
    if (!newName.trim()) return;
    setKeys((prev) => [
    ...prev,
    {
      id: Math.random().toString(36).slice(2),
      name: newName.trim(),
      description: newDesc.trim(),
      key: generateKey(),
      permissions: newPerms,
      lastUsed: 'Never',
      active: true,
      createdAt: Date.now()
    }]
    );
    setNewName('');
    setNewDesc('');
    setNewPerms(['read:projects']);
    setShowCreate(false);
  };
  const removeKey = (id: string) =>
  setKeys((prev) => prev.filter((k) => k.id !== id));
  const toggleActive = (id: string) =>
  setKeys((prev) =>
  prev.map((k) =>
  k.id === id ?
  {
    ...k,
    active: !k.active
  } :
  k
  )
  );
  const copyKey = async (key: ApiKey) => {
    try {
      await navigator.clipboard.writeText(key.key);
    } catch (e) {

      /* ignore */}
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 1500);
  };
  const addWebhook = () => {
    if (!webhookUrl.trim()) return;
    setWebhooks((prev) => [
    ...prev,
    {
      id: Math.random().toString(36).slice(2),
      url: webhookUrl.trim(),
      event: webhookEvent
    }]
    );
    setWebhookUrl('');
    setShowAddWebhook(false);
  };
  const removeWebhook = (id: string) =>
  setWebhooks((prev) => prev.filter((w) => w.id !== id));
  const totalRequests = keys.length * 142; // simulated
  const handleSave = () => {
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">API Keys</h1>
        <p className="text-sm text-gray-500">
          Manage API keys for secure access to the Podify API.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-5xl space-y-6">
          {/* API Key Management */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  API Key Management
                </h2>
                <p className="text-sm text-gray-500">
                  View, create, and manage your API keys.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                
                <PlusIcon className="w-4 h-4" /> Create API Key
              </button>
            </div>

            {showCreate &&
            <div className="border border-violet-200 bg-violet-50/30 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Name
                    </label>
                    <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Production server"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-900 mb-1">
                      Description
                    </label>
                    <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Used by backend"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-900 mb-2">
                    Permissions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_PERMS.map((p) => {
                    const checked = newPerms.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePerm(p)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${checked ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:border-violet-300'}`}>
                        
                          {p}
                        </button>);

                  })}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                  
                    Cancel
                  </button>
                  <button
                  onClick={createKey}
                  className="px-3 py-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                  
                    Create Key
                  </button>
                </div>
              </div>
            }

            {keys.length === 0 ?
            <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                  <LinkIcon className="w-7 h-7 text-violet-500" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  No API keys created yet.
                </p>
                <p className="text-xs text-gray-500">
                  Create an API key to get started.
                </p>
              </div> :

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="py-3 pr-4 font-medium">Name</th>
                      <th className="py-3 pr-4 font-medium">Description</th>
                      <th className="py-3 pr-4 font-medium">Key</th>
                      <th className="py-3 pr-4 font-medium">Permissions</th>
                      <th className="py-3 pr-4 font-medium">Last Used</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {keys.map((k) => {
                    const revealed = revealedId === k.id;
                    return (
                      <tr key={k.id}>
                          <td className="py-3 pr-4 font-semibold text-gray-900">
                            {k.name}
                          </td>
                          <td className="py-3 pr-4 text-gray-500">
                            {k.description || '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                                {revealed ?
                              k.key :
                              k.key.slice(0, 6) + '••••••••'}
                              </code>
                              <button
                              onClick={() =>
                              setRevealedId(revealed ? null : k.id)
                              }
                              aria-label="Toggle visibility"
                              className="p-1 text-gray-400 hover:text-violet-600">
                              
                                {revealed ?
                              <EyeOffIcon className="w-4 h-4" /> :

                              <EyeIcon className="w-4 h-4" />
                              }
                              </button>
                              <button
                              onClick={() => copyKey(k)}
                              aria-label="Copy"
                              className="p-1 text-gray-400 hover:text-violet-600">
                              
                                {copiedId === k.id ?
                              <CheckIcon className="w-4 h-4 text-emerald-500" /> :

                              <CopyIcon className="w-4 h-4" />
                              }
                              </button>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {k.permissions.map((p) =>
                            <span
                              key={p}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 font-medium">
                              
                                  {p}
                                </span>
                            )}
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-500">
                            {k.lastUsed}
                          </td>
                          <td className="py-3 pr-4">
                            <Toggle
                            checked={k.active}
                            onChange={() => toggleActive(k.id)} />
                          
                          </td>
                          <td className="py-3 text-right">
                            <button
                            onClick={() => removeKey(k.id)}
                            aria-label="Delete"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            
                              <Trash2Icon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>);

                  })}
                  </tbody>
                </table>
              </div>
            }
          </div>

          {/* API Permissions & Usage row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-1">API Permissions</h2>
              <p className="text-sm text-gray-500 mb-4">
                Manage permissions for your API keys.
              </p>
              {keys.length === 0 ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center text-center">
                  <ShieldIcon className="w-8 h-8 text-violet-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    No permissions configured yet.
                  </p>
                  <p className="text-xs text-gray-500">
                    Permissions will appear here.
                  </p>
                </div> :

              <div className="space-y-2">
                  {ALL_PERMS.map((p) => {
                  const count = keys.filter((k) =>
                  k.permissions.includes(p)
                  ).length;
                  return (
                    <div
                      key={p}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      
                        <code className="font-mono text-xs text-gray-700">
                          {p}
                        </code>
                        <span className="text-xs text-gray-500">
                          {count} {count === 1 ? 'key' : 'keys'}
                        </span>
                      </div>);

                })}
                </div>
              }
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-1">API Usage</h2>
              <p className="text-sm text-gray-500 mb-4">
                Monitor your API usage and limits.
              </p>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#f3f4f6"
                      strokeWidth="8"
                      fill="none" />
                    
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#7c3aed"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray="251.33"
                      strokeDashoffset={
                      251.33 - 251.33 * Math.min(totalRequests, 1000) / 1000
                      }
                      strokeLinecap="round" />
                    
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">
                      {totalRequests}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      Total Requests
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    {keys.length === 0 ?
                    'No usage data available.' :
                    `${totalRequests} requests this month`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {keys.length === 0 ?
                    'Usage statistics will appear here.' :
                    'Limit: 1,000 requests / month'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* API Scopes & Webhooks row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-1">API Scopes</h2>
              <p className="text-sm text-gray-500 mb-4">
                Define scopes for your API access.
              </p>
              <div className="space-y-2">
                {ALL_PERMS.length === 0 ?
                <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center text-center">
                    <TargetIcon className="w-8 h-8 text-violet-400 mb-2" />
                    <p className="text-sm font-medium text-gray-900">
                      No scopes defined yet.
                    </p>
                  </div> :

                ALL_PERMS.map((p) =>
                <div
                  key={p}
                  className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  
                      <div className="w-7 h-7 rounded bg-violet-50 flex items-center justify-center">
                        <TargetIcon className="w-3.5 h-3.5 text-violet-600" />
                      </div>
                      <code className="font-mono text-xs text-gray-700 flex-1">
                        {p}
                      </code>
                      <span className="text-xs text-gray-500">
                        {p.startsWith('read') ? 'Read' : 'Write'}
                      </span>
                    </div>
                )
                }
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-bold text-gray-900 mb-1">Webhooks</h2>
                  <p className="text-sm text-gray-500">
                    Manage webhook endpoints and subscriptions.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddWebhook(true)}
                  aria-label="Add webhook"
                  className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg">
                  
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
              {showAddWebhook &&
              <div className="border border-violet-200 bg-violet-50/30 rounded-lg p-3 mb-3 space-y-2">
                  <input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.example.com/hook"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
                  <select
                  value={webhookEvent}
                  onChange={(e) => setWebhookEvent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                  
                    <option>episode.published</option>
                    <option>episode.updated</option>
                    <option>project.created</option>
                    <option>upload.completed</option>
                  </select>
                  <div className="flex gap-2 justify-end">
                    <button
                    onClick={() => setShowAddWebhook(false)}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg">
                    
                      Cancel
                    </button>
                    <button
                    onClick={addWebhook}
                    className="px-3 py-1.5 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                    
                      Add
                    </button>
                  </div>
                </div>
              }
              {webhooks.length === 0 ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center text-center">
                  <WebhookIcon className="w-8 h-8 text-violet-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    No webhooks configured yet.
                  </p>
                  <p className="text-xs text-gray-500">
                    Webhooks will appear here.
                  </p>
                </div> :

              <div className="space-y-2">
                  {webhooks.map((w) =>
                <div
                  key={w.id}
                  className="flex items-center gap-3 border border-gray-100 rounded-lg p-3">
                  
                      <div className="w-8 h-8 rounded bg-violet-50 flex items-center justify-center">
                        <WebhookIcon className="w-4 h-4 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {w.url}
                        </p>
                        <p className="text-xs text-gray-500">{w.event}</p>
                      </div>
                      <button
                    onClick={() => removeWebhook(w.id)}
                    aria-label="Remove"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                    
                        <Trash2Icon className="w-4 h-4" />
                      </button>
                    </div>
                )}
                </div>
              }
            </div>
          </div>

          {/* API Documentation & Activity Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-1">
                API Documentation
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Resources and documentation for the Podify API.
              </p>
              <div className="space-y-2">
                {[
                {
                  name: 'Getting Started',
                  href: '#'
                },
                {
                  name: 'API Reference',
                  href: '#'
                },
                {
                  name: 'Authentication Guide',
                  href: '#'
                },
                {
                  name: 'Webhook Events',
                  href: '#'
                }].
                map((doc) =>
                <a
                  key={doc.name}
                  href={doc.href}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  
                    <div className="w-8 h-8 rounded bg-violet-50 flex items-center justify-center">
                      <BookOpenIcon className="w-4 h-4 text-violet-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {doc.name}
                    </span>
                  </a>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-1">Activity Logs</h2>
              <p className="text-sm text-gray-500 mb-4">
                View API key activity and events.
              </p>
              {keys.length === 0 ?
              <div className="border-2 border-dashed border-gray-200 rounded-lg py-8 flex flex-col items-center text-center">
                  <FileTextIcon className="w-8 h-8 text-violet-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900">
                    No activity logs yet.
                  </p>
                  <p className="text-xs text-gray-500">
                    Activity logs will appear here.
                  </p>
                </div> :

              <div className="space-y-2">
                  {keys.slice(0, 5).map((k) =>
                <div
                  key={k.id}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Key created: {k.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(k.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                )}
                </div>
              }
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-1">Security Settings</h2>
            <p className="text-sm text-gray-500 mb-6">
              Configure security settings for your API keys.
            </p>
            {keys.length === 0 ?
            <div className="border-2 border-dashed border-gray-200 rounded-lg py-10 flex flex-col items-center text-center">
                <LockIcon className="w-8 h-8 text-violet-400 mb-2" />
                <p className="text-sm font-medium text-gray-900">
                  No security settings configured yet.
                </p>
                <p className="text-xs text-gray-500">
                  Security settings will appear here.
                </p>
              </div> :

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      Rate limiting
                    </h3>
                    <p className="text-xs text-gray-500">
                      Enforce request rate limits per key.
                    </p>
                  </div>
                  <Toggle checked={rateLimit} onChange={setRateLimit} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      IP allowlist
                    </h3>
                    <p className="text-xs text-gray-500">
                      Restrict API access to approved IP addresses.
                    </p>
                  </div>
                  <Toggle checked={ipAllowlist} onChange={setIpAllowlist} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                      Log all requests
                    </h3>
                    <p className="text-xs text-gray-500">
                      Keep an audit log of every API call.
                    </p>
                  </div>
                  <Toggle checked={logRequests} onChange={setLogRequests} />
                </div>
              </div>
            }
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