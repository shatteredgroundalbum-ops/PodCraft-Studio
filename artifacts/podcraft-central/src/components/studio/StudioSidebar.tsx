import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home, Folder, Calendar, CheckSquare, LayoutTemplate,
  Image, Mic, Sparkles, BarChart2, Users, Settings,
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DownloadIcon } from 'lucide-react';

const navItems = [
  { icon: Home,           label: 'Dashboard',    href: '/dashboard' },
  { icon: Folder,         label: 'Projects',     href: '/projects' },
  { icon: Calendar,       label: 'Calendar',     href: '/calendar' },
  { icon: CheckSquare,    label: 'Tasks',        href: '/tasks' },
  { icon: LayoutTemplate, label: 'Templates',    href: '/templates' },
  { icon: Image,          label: 'Media Library',href: '/media-library' },
  { icon: Mic,            label: 'Studio',       href: '/studio' },
  { icon: Sparkles,       label: 'AI Producer',  href: '/ai-producer' },
  { icon: BarChart2,      label: 'Analytics',    href: '/analytics' },
  { icon: Users,          label: 'Team',         href: '/team' },
];

export function StudioSidebar() {
  const location = useLocation();
  const { canInstall, isInstalling, install } = usePWAInstall();

  return (
    <div className="w-[240px] h-full bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
          <div className="flex gap-0.5 items-end h-4">
            <div className="w-0.5 h-2 bg-white rounded-full" />
            <div className="w-0.5 h-4 bg-white rounded-full" />
            <div className="w-0.5 h-3 bg-white rounded-full" />
            <div className="w-0.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>
        <span className="font-bold text-xl text-gray-900 tracking-tight">
          PodCraft
          <br />
          <span className="text-sm font-medium text-gray-500 leading-none block">Central</span>
        </span>
      </div>

      {/* New Project */}
      <div className="px-4 mb-6">
        <Link
          to="/projects?new=true"
          className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors text-sm">
          <span className="text-lg leading-none">+</span> New Project
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                isActive
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-full" />
              )}
              <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        {canInstall && (
          <button
            onClick={install}
            disabled={isInstalling}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200">
            <DownloadIcon className="w-4 h-4 text-violet-500 shrink-0" />
            {isInstalling ? 'Installing…' : 'Install App'}
          </button>
        )}

        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 w-full rounded-lg hover:bg-gray-50 transition-colors">
          <Settings className="w-5 h-5 text-gray-400" />
          Settings
        </Link>

        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-gray-700">Studio ready</span>
          </div>
          <span className="text-xs text-gray-500 ml-4">v2.0</span>
        </div>
      </div>
    </div>
  );
}
