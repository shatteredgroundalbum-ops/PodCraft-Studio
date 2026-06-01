import React, { useState, useCallback } from 'react';
import { Link, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../store/AuthStore';
import {
  UserIcon, ShieldIcon, BellIcon, PaletteIcon, KeyIcon, CreditCardIcon,
  GlobeIcon, MicIcon, PlugIcon, TrashIcon, LogOutIcon, ChevronRightIcon,
  CheckCircle2Icon, SaveIcon, SparklesIcon, CpuIcon, ZapIcon, LayersIcon,
  XCircleIcon, AlertCircleIcon, RefreshCwIcon, LoaderIcon, SendIcon,
} from 'lucide-react';
import { useAIConfig } from '../store/AIConfigStore';
import { phi3MiniAdapter, PHI3_SIZE_MB } from '../services/ai/phi3MiniAdapter';
import { aiProviderService } from '../services/ai/aiProviderService';
import { BYOK_PROVIDER_NAMES } from '../services/ai/types';
import type { AIProviderMode } from '../services/ai/types';
import { MediaProviderSettings } from '../components/MediaProviderSettings';

const NAV = [
  { label: 'Profile', href: '/settings/profile', icon: UserIcon },
  { label: 'Account', href: '/settings/account', icon: ShieldIcon },
  { label: 'Notifications', href: '/settings/notifications', icon: BellIcon },
  { label: 'Appearance', href: '/settings/appearance', icon: PaletteIcon },
  { label: 'Audio', href: '/settings/audio', icon: MicIcon },
  { label: 'AI Producer', href: '/settings/ai', icon: SparklesIcon },
  { label: 'Media Providers', href: '/settings/media-providers', icon: MicIcon },
  { label: 'Privacy & Security', href: '/settings/privacy', icon: KeyIcon },
  { label: 'Billing', href: '/settings/billing', icon: CreditCardIcon },
  { label: 'Integrations', href: '/settings/integrations', icon: PlugIcon },
];

const MODE_ICONS: Record<AIProviderMode, React.ElementType> = {
  phi3: CpuIcon,
  'gemini-nano': ZapIcon,
  hybrid: LayersIcon,
  byok: KeyIcon,
  none: XCircleIcon,
};

const MODE_LABELS: Record<AIProviderMode, string> = {
  phi3: 'Phi-3 Mini (Local)',
  'gemini-nano': 'Gemini Nano',
  hybrid: 'Hybrid (Phi-3 + Gemini Nano)',
  byok: 'Your API Key',
  none: 'No AI',
};

function AISettingsPage() {
  const { config, openWizard } = useAIConfig();
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');
  const [phi3Progress, setPhi3Progress] = useState(0);
  const [phi3Status, setPhi3Status] = useState('');
  const [phi3Loading, setPhi3Loading] = useState(false);

  const ModeIcon = MODE_ICONS[config.mode];
  const avail = aiProviderService.availability;

  const availBadge = {
    available: 'bg-green-100 text-green-700',
    'requires-download': 'bg-amber-100 text-amber-700',
    checking: 'bg-gray-100 text-gray-600',
    unavailable: 'bg-red-50 text-red-600',
  }[avail] ?? 'bg-gray-100 text-gray-600';

  const availLabel = {
    available: 'Ready',
    'requires-download': 'Download Required',
    checking: 'Checking…',
    unavailable: 'Not Available',
  }[avail] ?? avail;

  const handleTest = useCallback(async () => {
    if (!testInput.trim()) return;
    setTesting(true);
    setTestResult('');
    setTestError('');
    try {
      const result = await aiProviderService.prompt([{ role: 'user', content: testInput }]);
      setTestResult(result);
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Test failed.');
    } finally {
      setTesting(false);
    }
  }, [testInput]);

  const handleLoadPhi3 = useCallback(async () => {
    setPhi3Loading(true);
    setPhi3Progress(0);
    setPhi3Status('Preparing download…');
    try {
      await phi3MiniAdapter.loadModel((pct, status) => {
        setPhi3Progress(pct);
        setPhi3Status(status);
      });
      setPhi3Status('Phi-3 Mini is ready!');
    } catch (e) {
      setPhi3Status(e instanceof Error ? e.message : 'Download failed.');
    } finally {
      setPhi3Loading(false);
    }
  }, []);

  return (
    <div className="space-y-5">
      {/* Current Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Producer</h2>
            <p className="text-sm text-gray-500 mt-0.5">Configure which AI powers your podcast assistant.</p>
          </div>
          <button onClick={openWizard}
            className="flex items-center gap-2 px-4 py-2 border border-violet-300 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50">
            <RefreshCwIcon className="w-3.5 h-3.5" /> Reconfigure
          </button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.mode === 'none' ? 'bg-gray-200' : 'bg-violet-100'}`}>
            <ModeIcon className={`w-6 h-6 ${config.mode === 'none' ? 'text-gray-400' : 'text-violet-600'}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{MODE_LABELS[config.mode]}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${availBadge}`}>{availLabel}</span>
            </div>
            {config.mode === 'byok' && config.byokProvider && (
              <p className="text-sm text-gray-500 mt-0.5">
                Provider: {BYOK_PROVIDER_NAMES[config.byokProvider]}
                {config.byokModel && <> · Model: {config.byokModel}</>}
              </p>
            )}
            {config.mode === 'phi3' && (
              <p className="text-sm text-gray-500 mt-0.5">
                {phi3MiniAdapter.isLoaded ? 'Model loaded and ready.' : `Model not loaded — ~${PHI3_SIZE_MB} MB download required.`}
              </p>
            )}
          </div>
        </div>

        {/* Phi-3 Download Section */}
        {(config.mode === 'phi3' || config.mode === 'hybrid') && !phi3MiniAdapter.isLoaded && (
          <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Phi-3 Mini model not loaded</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  The model requires a ~{PHI3_SIZE_MB.toLocaleString()} MB one-time download and is cached in your browser.
                </p>
                {phi3Loading ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
                      <span>{phi3Status}</span>
                      <span>{phi3Progress}%</span>
                    </div>
                    <div className="w-full bg-amber-200 rounded-full h-2">
                      <div className="bg-amber-600 h-2 rounded-full transition-all" style={{ width: `${phi3Progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <button onClick={handleLoadPhi3}
                    className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700">
                    <LoaderIcon className="w-3.5 h-3.5" /> Download Phi-3 Mini
                  </button>
                )}
                {phi3Status && !phi3Loading && (
                  <p className="text-xs text-amber-700 mt-2">{phi3Status}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Panel */}
      {config.mode !== 'none' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-1">Test AI Producer</h3>
          <p className="text-sm text-gray-500 mb-4">Send a test prompt to verify your AI provider is working.</p>
          <div className="flex gap-2">
            <input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTest()}
              placeholder="e.g. Give me a quick podcast recording tip"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button onClick={handleTest} disabled={!testInput.trim() || testing}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              {testing ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
              {testing ? 'Running…' : 'Test'}
            </button>
          </div>
          {testResult && (
            <div className="mt-3 p-3 bg-violet-50 rounded-lg text-sm text-gray-800 border border-violet-100 whitespace-pre-wrap">
              {testResult}
            </div>
          )}
          {testError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-700 border border-red-100">
              <AlertCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {testError}
            </div>
          )}
        </div>
      )}

      {/* No AI state */}
      {config.mode === 'none' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <XCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-bold text-gray-900 mb-1">AI Producer is disabled</h3>
          <p className="text-sm text-gray-500 mb-4">Enable AI to get help with scripting, research, coaching, and mastering.</p>
          <button onClick={openWizard}
            className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700">
            Set Up AI Producer
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsNav() {
  const location = useLocation();
  return (
    <div className="w-56 flex-shrink-0">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {NAV.map((item) => {
          const isActive = location.pathname === item.href || (item.href !== '/settings' && location.pathname.startsWith(item.href));
          return (
            <Link key={item.href} to={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm border-l-2 transition-colors ${isActive ? 'bg-violet-50 text-violet-700 border-l-violet-600 font-medium' : 'text-gray-700 border-l-transparent hover:bg-gray-50'}`}>
              <item.icon className={`w-4 h-4 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Profile</h2>
      <p className="text-sm text-gray-500 mb-6">Manage your personal information and public profile.</p>
      <form onSubmit={handleSave} className="space-y-6 max-w-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl">
            {(name || user?.name || 'P').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{name || user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={user?.email || ''} disabled
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
            placeholder="A short bio about yourself..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">
            <SaveIcon className="w-4 h-4" />
            Save Changes
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle2Icon className="w-4 h-4" />
              Saved!
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

function SimpleSettingsPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-6">{description}</p>
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-sm text-gray-500">Settings for {title} will be available soon.</p>
      </div>
    </div>
  );
}

export function Settings() {
  const location = useLocation();

  return (
    <AppLayout title="Settings">
      <div className="flex gap-6">
        <SettingsNav />
        <div className="flex-1">
          <Routes>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="account" element={<SimpleSettingsPage title="Account" description="Manage your account security and authentication." />} />
            <Route path="notifications" element={<SimpleSettingsPage title="Notifications" description="Control how and when you receive notifications." />} />
            <Route path="appearance" element={<SimpleSettingsPage title="Appearance" description="Customize the look and feel of PodCraft Central." />} />
            <Route path="audio" element={<SimpleSettingsPage title="Audio Settings" description="Configure default audio settings for recording and playback." />} />
            <Route path="privacy" element={<SimpleSettingsPage title="Privacy & Security" description="Manage your privacy settings and data." />} />
            <Route path="billing" element={<SimpleSettingsPage title="Billing" description="Manage your subscription and billing information." />} />
            <Route path="integrations" element={<SimpleSettingsPage title="Integrations" description="Connect PodCraft Central with other tools and platforms." />} />
            <Route path="ai" element={<AISettingsPage />} />
            <Route path="media-providers" element={<MediaProviderSettings />} />
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </div>
      </div>
    </AppLayout>
  );
}
