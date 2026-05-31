import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { CameraIcon } from 'lucide-react';
export function SettingsProfile() {
  return (
    <AppLayout title="Profile">
      <div className="mb-8">
        <p className="text-sm text-gray-500">
          Manage your personal information and how you appear in Podify.
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b border-gray-100">
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 mb-1">
                Profile Information
              </h2>
              <p className="text-sm text-gray-500">
                Update your personal details and how others see you on Podify.
              </p>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Profile Photo
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                JPG, PNG or WebP. Max size 2MB.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                  <CameraIcon className="w-6 h-6 text-gray-400" />
                </div>
                <button className="px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                  Change Photo
                </button>
              </div>
            </div>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Display Name
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  This is how your name will appear in Podify.
                </p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Full Name
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Your full name (optional).
                </p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Email Address
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Your email address.
                </p>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Phone Number
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Your phone number (optional).
                </p>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Bio
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Tell others a little bit about yourself (optional).
              </p>
              <textarea
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none">
              </textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Website
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Your website or portfolio (optional).
                </p>
                <input
                  type="url"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500" />
                
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Location / Time Zone
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Select your time zone.
                </p>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white">
                  <option></option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Social Links
              </label>
              <p className="text-xs text-gray-500 mb-4">
                Add links to your social media profiles.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Website"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12" />
                      
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="X (Twitter)"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="20"
                        rx="5"
                        ry="5"
                        strokeWidth="2" />
                      
                      <path
                        d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"
                        strokeWidth="2" />
                      
                      <line
                        x1="17.5"
                        y1="6.5"
                        x2="17.51"
                        y2="6.5"
                        strokeWidth="2" />
                      
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Instagram"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24">
                      
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="YouTube"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                  
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
                
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>);

}