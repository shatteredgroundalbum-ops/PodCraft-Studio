import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UserIcon,
  ShieldCheckIcon,
  BellIcon,
  PaletteIcon,
  Volume2Icon,
  MicIcon,
  CloudIcon,
  PuzzleIcon,
  CodeIcon,
  UsersIcon,
  DownloadIcon,
  SlidersIcon,
  Trash2Icon,
  CreditCardIcon } from
'lucide-react';
export function SettingsSidebar() {
  const location = useLocation();
  const navItems = [
  {
    label: 'Appearance',
    icon: PaletteIcon,
    href: '/settings/appearance'
  },
  {
    label: 'Audio Preferences',
    icon: Volume2Icon,
    href: '/settings/audio'
  },
  {
    label: 'Recording Preferences',
    icon: MicIcon,
    href: '/settings/recording'
  },
  {
    label: 'Notifications',
    icon: BellIcon,
    href: '/settings/notifications'
  },
  {
    label: 'Security',
    icon: ShieldCheckIcon,
    href: '/settings/security'
  },
  {
    label: 'Storage',
    icon: CloudIcon,
    href: '/settings/storage'
  },
  {
    label: 'Integrations',
    icon: PuzzleIcon,
    href: '/settings/integrations'
  },
  {
    label: 'API Keys',
    icon: CodeIcon,
    href: '/settings/api-keys'
  },
  {
    label: 'Billing & Subscriptions',
    icon: CreditCardIcon,
    href: '/settings/billing'
  },
  {
    label: 'Team & Permissions',
    icon: UsersIcon,
    href: '/settings/team-permissions'
  },
  {
    label: 'Import & Export',
    icon: DownloadIcon,
    href: '/settings/import-export'
  },
  {
    label: 'Advanced',
    icon: SlidersIcon,
    href: '/settings/advanced'
  }];

  return (
    <div className="w-64 flex-shrink-0 pr-8 border-r border-gray-200">
      <nav className="space-y-1">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={i}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
              
              <item.icon
                className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
              
              {item.label}
            </Link>);

        })}

        <div className="pt-4 mt-4 border-t border-gray-100">
          <Link
            to="/settings/danger-zone"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === '/settings/danger-zone' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50'}`}>
            
            <Trash2Icon
              className={`w-5 h-5 ${location.pathname === '/settings/danger-zone' ? 'text-red-600' : 'text-red-500'}`} />
            
            Danger Zone
          </Link>
        </div>
      </nav>
    </div>);

}