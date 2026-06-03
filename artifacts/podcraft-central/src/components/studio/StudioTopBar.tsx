import React, { useEffect, useRef, useState } from 'react';
import { HelpCircle, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthStore';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'PC';
}

export function StudioTopBar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const initials = user ? getInitials(user.name) : 'PC';

  return (
    <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-end px-5 flex-shrink-0 gap-3">
      <button className="text-gray-400 hover:text-gray-600 transition-colors" title="Help">
        <HelpCircle className="w-5 h-5" />
      </button>

      <button className="text-gray-400 hover:text-gray-600 transition-colors relative" title="Notifications">
        <Bell className="w-5 h-5" />
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-1.5 bg-violet-100 text-violet-700 pl-3 pr-2 py-1.5 rounded-full hover:bg-violet-200 transition-colors"
          title="Account"
        >
          <span className="text-sm font-bold">{initials}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {user && (
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                <div className="text-xs text-gray-500 truncate mt-0.5">{user.email}</div>
              </div>
            )}

            <button
              onClick={() => { setMenuOpen(false); navigate('/settings/profile'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              Profile
            </button>

            <button
              onClick={() => { setMenuOpen(false); navigate('/settings'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-gray-400 shrink-0" />
              Settings
            </button>

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={() => { setMenuOpen(false); signOut(); navigate('/'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
