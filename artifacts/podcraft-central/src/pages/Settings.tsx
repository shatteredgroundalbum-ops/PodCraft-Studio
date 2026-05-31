import React, { useState } from 'react';
import { Link, useLocation, Outlet, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useAuth } from '../store/AuthStore';
import {
  UserIcon, ShieldIcon, BellIcon, PaletteIcon, KeyIcon, CreditCardIcon,
  GlobeIcon, MicIcon, PlugIcon, TrashIcon, LogOutIcon, ChevronRightIcon,
  CheckCircle2Icon, SaveIcon,
} from 'lucide-react';

const NAV = [
  { label: 'Profile', href: '/settings/profile', icon: UserIcon },
  { label: 'Account', href: '/settings/account', icon: ShieldIcon },
  { label: 'Notifications', href: '/settings/notifications', icon: BellIcon },
  { label: 'Appearance', href: '/settings/appearance', icon: PaletteIcon },
  { label: 'Audio', href: '/settings/audio', icon: MicIcon },
  { label: 'Privacy & Security', href: '/settings/privacy', icon: KeyIcon },
  { label: 'Billing', href: '/settings/billing', icon: CreditCardIcon },
  { label: 'Integrations', href: '/settings/integrations', icon: PlugIcon },
];

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
            <Route path="*" element={<Navigate to="profile" replace />} />
          </Routes>
        </div>
      </div>
    </AppLayout>
  );
}
