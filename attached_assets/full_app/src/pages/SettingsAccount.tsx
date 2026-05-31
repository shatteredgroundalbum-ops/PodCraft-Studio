import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Toggle } from '../components/Toggle';
export function SettingsAccount() {
  return (
    <AppLayout title="Account">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Manage your account settings and security.
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          {/* Account Information */}
          <section>
            <h2 className="font-bold text-gray-900 mb-1">
              Account Information
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Update your account details and manage your login.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Username
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This is your unique username.
                </p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Email Address
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This is the email associated with your account.
                </p>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
            </div>
          </section>

          {/* Password */}
          <section className="pt-8 border-t border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Password</h2>
                <p className="text-sm text-gray-500">
                  Keep your account secure by using a strong password.
                </p>
              </div>
              <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                Change Password
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password
              </label>
              <div className="flex gap-4">
                <input
                  type="password"
                  value="••••••••"
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 focus:outline-none" />
                
                <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                  Change Password
                </button>
              </div>
            </div>
          </section>

          {/* 2FA */}
          <section className="pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">
                  Two-Factor Authentication (2FA)
                </h2>
                <p className="text-sm text-gray-500">
                  Add an extra layer of security to your account.
                </p>
              </div>
              <Toggle defaultChecked={false} />
            </div>
          </section>

          {/* Connected Accounts */}
          <section className="pt-8 border-t border-gray-100">
            <h2 className="font-bold text-gray-900 mb-1">Connected Accounts</h2>
            <p className="text-sm text-gray-500 mb-4">
              Connect third-party accounts to sign in faster.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4" />
                  
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853" />
                  
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05" />
                  
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335" />
                  
                </svg>
                Connect Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor">
                  
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Connect Apple
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor">
                  
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                Connect GitHub
              </button>
            </div>
          </section>

          {/* Sign Out */}
          <section className="pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Sign Out</h2>
                <p className="text-sm text-gray-500">
                  Sign out from your current session.
                </p>
              </div>
              <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                Sign Out
              </button>
            </div>
          </section>

          {/* Delete Account */}
          <section className="pt-8 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-red-600 mb-1">Delete Account</h2>
                <p className="text-sm text-gray-500">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <button className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">
                Delete Account
              </button>
            </div>
          </section>
        </div>
      </div>
    </AppLayout>);

}