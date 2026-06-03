import React, { useEffect, useState, useRef, Fragment } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PodCraftLogo } from './PodCraftLogo';
import { useAuth } from '../store/AuthStore';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  HomeIcon, FolderIcon, CalendarIcon, CheckCircleIcon, LayoutTemplateIcon,
  ImageIcon, BarChartIcon, UsersIcon, SettingsIcon, PlusIcon, HelpCircleIcon,
  BellIcon, ChevronDownIcon, MicIcon, LogOutIcon, UserIcon, ShieldIcon,
  PaletteIcon, BookOpenIcon, ScaleIcon, LifeBuoyIcon, InfoIcon, SparklesIcon,
  DownloadIcon, BrainCircuitIcon,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  rightHeader?: React.ReactNode;
}

export function AppLayout({ children, title, breadcrumbs, rightHeader }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { canInstall, isInstalling, install } = usePWAInstall();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) setIsHelpOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
    { label: 'Projects', icon: FolderIcon, href: '/projects' },
    { label: 'Calendar', icon: CalendarIcon, href: '/calendar' },
    { label: 'Tasks', icon: CheckCircleIcon, href: '/tasks' },
    { label: 'Templates', icon: LayoutTemplateIcon, href: '/templates' },
    { label: 'Media Library', icon: ImageIcon, href: '/media-library' },
    { label: 'Studio', icon: MicIcon, href: '/studio' },
    { label: 'AI Producer', icon: SparklesIcon, href: '/ai-producer' },
    { label: 'Analytics', icon: BarChartIcon, href: '/analytics' },
    { label: 'Team', icon: UsersIcon, href: '/team' },
  ];

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'PC';

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full flex-shrink-0">
        <div className="p-5">
          <PodCraftLogo variant="dark" size="sm" />
        </div>
        <div className="px-4 mb-4">
          <button
            onClick={() => navigate('/projects?new=true')}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2.5 px-4 flex items-center justify-center gap-2 font-medium transition-colors shadow-sm text-sm">
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={i}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-violet-50 text-violet-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                {item.label}
              </Link>
            );
          })}
        </div>
        {canInstall && (
          <div className="px-4 pb-2">
            <button
              onClick={install}
              disabled={isInstalling}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200">
              <DownloadIcon className="w-4 h-4 text-violet-500 shrink-0" />
              {isInstalling ? 'Installing…' : 'Install App'}
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-2">
            {breadcrumbs ? (
              <div className="flex items-center gap-2 text-sm">
                {breadcrumbs.map((crumb, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className="text-gray-400">/</span>}
                    {crumb.href ? (
                      <Link to={crumb.href} className="text-gray-500 hover:text-gray-900 font-medium">{crumb.label}</Link>
                    ) : (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    )}
                  </Fragment>
                ))}
              </div>
            ) : title ? (
              <div className="text-xl font-bold text-gray-900 flex items-center gap-2">{title}</div>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            {rightHeader}
            {!rightHeader && (
              <>
                <div className="relative" ref={helpRef}>
                  <button onClick={() => setIsHelpOpen(!isHelpOpen)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                    <HelpCircleIcon className="w-5 h-5" />
                  </button>
                  {isHelpOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                      <h4 className="font-bold text-gray-900 mb-2">Need Help?</h4>
                      <p className="text-sm text-gray-500 mb-3">Find answers in our documentation or contact support.</p>
                      <Link to="/knowledge-base" onClick={() => setIsHelpOpen(false)} className="text-sm font-medium text-violet-600 hover:text-violet-700">View Knowledge Base &rarr;</Link>
                    </div>
                  )}
                </div>

                <div className="relative" ref={notificationsRef}>
                  <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="text-gray-400 hover:text-gray-600 relative transition-colors p-1">
                    <BellIcon className="w-5 h-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                  </button>
                  {isNotificationsOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                      <h4 className="font-bold text-gray-900 mb-3">Notifications</h4>
                      <div className="text-sm text-gray-500 text-center py-4">No new notifications</div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={userMenuRef}>
                  <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 hover:bg-gray-50 p-1 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                      {initials}
                    </div>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100 mb-1">
                        <p className="text-sm font-bold text-gray-900">{user?.name || 'PodCraft User'}</p>
                        <p className="text-xs text-gray-500">{user?.email || ''}</p>
                      </div>
                      <Link to="/settings/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <UserIcon className="w-4 h-4 text-gray-400" /> Profile
                      </Link>
                      <Link to="/settings/account" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <ShieldIcon className="w-4 h-4 text-gray-400" /> Account
                      </Link>
                      <Link to="/settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <SettingsIcon className="w-4 h-4 text-gray-400" /> Settings
                      </Link>
                      <Link to="/ai-settings" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <BrainCircuitIcon className="w-4 h-4 text-gray-400" /> AI
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link to="/knowledge-base" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <BookOpenIcon className="w-4 h-4 text-gray-400" /> Knowledge Base
                      </Link>
                      <Link to="/legal" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <ScaleIcon className="w-4 h-4 text-gray-400" /> Legal & Policies
                      </Link>
                      <Link to="/help" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <LifeBuoyIcon className="w-4 h-4 text-gray-400" /> Help & Support
                      </Link>
                      <Link to="/about" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <InfoIcon className="w-4 h-4 text-gray-400" /> About PodCraft Central
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button type="button" onClick={() => { setIsUserMenuOpen(false); setIsSignOutOpen(true); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left">
                          <LogOutIcon className="w-4 h-4 text-red-500" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Sign Out Modal */}
      {isSignOutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <LogOutIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Sign out of PodCraft Central?</h3>
              <p className="text-sm text-gray-500 mb-6">You'll be returned to the sign-in screen. Any unsaved work in the Studio should be saved first.</p>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsSignOutOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={() => { signOut(); setIsSignOutOpen(false); navigate('/login'); }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
