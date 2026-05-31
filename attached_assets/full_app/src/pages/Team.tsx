import React from 'react';
import { AppLayout } from '../components/AppLayout';
import {
  UsersIcon,
  ShieldCheckIcon,
  LockIcon,
  Users2Icon,
  UserPlusIcon,
  InfoIcon } from
'lucide-react';
export function Team() {
  const rightHeader =
  <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
      <UserPlusIcon className="w-4 h-4" />
      Invite Member
    </button>;

  return (
    <AppLayout title="Team" rightHeader={rightHeader}>
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Manage your team members and their access.
        </p>
      </div>

      <div className="space-y-6">
        {/* How Team Access Works */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-6">
            How Team Access Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                <UsersIcon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Collaborate Together
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Invite team members to collaborate on projects and manage your
                  podcast workflow.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheckIcon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Role-Based Permissions
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Assign roles to control access levels and ensure everyone has
                  the right permissions.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-violet-50 flex items-center justify-center flex-shrink-0">
                <LockIcon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Secure & Private
                </h4>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Your team and projects are private and secure. Only invited
                  members can access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-1">Team Members</h3>
            <p className="text-sm text-gray-500">
              View and manage your team members and their roles.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4 font-medium">Member</th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      Role <InfoIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      Access Level <InfoIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      Joined <InfoIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1">
                      Last Active <InfoIcon className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
            </table>
          </div>

          <div className="flex flex-col items-center justify-center py-16 text-center border-b border-gray-100">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center mb-4">
              <Users2Icon className="w-8 h-8 text-violet-500" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">
              No team members yet
            </h4>
            <p className="text-sm text-gray-500 mb-6">
              Invite your team to start collaborating on your podcast projects.
            </p>
            <button className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
              <UserPlusIcon className="w-4 h-4" />
              Invite Member
            </button>
          </div>
        </div>
      </div>
    </AppLayout>);

}