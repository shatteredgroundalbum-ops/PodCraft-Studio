import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import {
  ChevronRightIcon,
  UserIcon,
  ShieldIcon,
  LockIcon,
  XIcon,
  CheckIcon } from
'lucide-react';
type Member = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Pending';
};
type Role = {
  id: number;
  name: string;
  description: string;
  members: number;
};
type Permission = {
  id: number;
  name: string;
  description: string;
  type: 'Read' | 'Write' | 'Admin';
};
export function SettingsTeamPermissions() {
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showPermissionForm, setShowPermissionForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Editor');
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permName, setPermName] = useState('');
  const [permDescription, setPermDescription] = useState('');
  const [permType, setPermType] = useState<'Read' | 'Write' | 'Admin'>('Read');
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;
    setMembers([
    ...members,
    {
      id: Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'Pending'
    }]
    );
    setInviteName('');
    setInviteEmail('');
    setInviteRole('Editor');
    setShowInviteForm(false);
  };
  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    setRoles([
    ...roles,
    {
      id: Date.now(),
      name: roleName.trim(),
      description: roleDescription.trim() || 'No description',
      members: 0
    }]
    );
    setRoleName('');
    setRoleDescription('');
    setShowRoleForm(false);
  };
  const handleCreatePermission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!permName.trim()) return;
    setPermissions([
    ...permissions,
    {
      id: Date.now(),
      name: permName.trim(),
      description: permDescription.trim() || 'No description',
      type: permType
    }]
    );
    setPermName('');
    setPermDescription('');
    setPermType('Read');
    setShowPermissionForm(false);
  };
  const removeMember = (id: number) =>
  setMembers(members.filter((m) => m.id !== id));
  const removeRole = (id: number) => setRoles(roles.filter((r) => r.id !== id));
  const removePermission = (id: number) =>
  setPermissions(permissions.filter((p) => p.id !== id));
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Team & Permissions
        </h1>
        <p className="text-sm text-gray-500">
          Manage your team members, roles, and permissions.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Team Members */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h2>
                <p className="text-sm text-gray-500">
                  Invite and manage your team members.
                </p>
              </div>
              <button
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                
                {showInviteForm ? 'Cancel' : 'Invite Member'}
              </button>
            </div>

            {showInviteForm &&
            <form
              onSubmit={handleInvite}
              className="bg-violet-50/50 border border-violet-100 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              
                <input
                type="text"
                placeholder="Full name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
                <input
                type="email"
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
                <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                
                  <option>Owner</option>
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
                <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                
                  Send Invite
                </button>
              </form>
            }

            {members.length === 0 ?
            <div className="border border-gray-100 rounded-lg">
                <div className="grid grid-cols-5 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <UserIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    No team members added yet.
                  </p>
                  <p className="text-sm text-gray-400">
                    Invite members to get started.
                  </p>
                </div>
              </div> :

            <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  <span>Name</span>
                  <span>Email</span>
                  <span>Role</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                {members.map((m) =>
              <div
                key={m.id}
                className="grid grid-cols-5 px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 items-center">
                
                    <span className="font-medium text-gray-900">{m.name}</span>
                    <span className="text-gray-600">{m.email}</span>
                    <span className="text-gray-700">{m.role}</span>
                    <span>
                      <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${m.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    
                        {m.status}
                      </span>
                    </span>
                    <div className="text-right">
                      <button
                    onClick={() => removeMember(m.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors">
                    
                        <XIcon className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
              )}
              </div>
            }
          </section>

          {/* Roles */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Roles</h2>
                <p className="text-sm text-gray-500">
                  Manage roles and their permissions.
                </p>
              </div>
              <button
                onClick={() => setShowRoleForm(!showRoleForm)}
                className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                
                {showRoleForm ? 'Cancel' : 'Create Role'}
              </button>
            </div>

            {showRoleForm &&
            <form
              onSubmit={handleCreateRole}
              className="bg-violet-50/50 border border-violet-100 rounded-lg p-4 mb-4 space-y-3">
              
                <input
                type="text"
                placeholder="Role name (e.g. Producer)"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
                <input
                type="text"
                placeholder="Description"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
                <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                
                  Create Role
                </button>
              </form>
            }

            {roles.length === 0 ?
            <div className="border border-gray-100 rounded-lg">
                <div className="grid grid-cols-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <span>Role Name</span>
                  <span>Description</span>
                  <span>Members</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <ShieldIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    No roles created yet.
                  </p>
                  <p className="text-sm text-gray-400">
                    Create a role to get started.
                  </p>
                </div>
              </div> :

            <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  <span>Role Name</span>
                  <span>Description</span>
                  <span>Members</span>
                  <span className="text-right">Actions</span>
                </div>
                {roles.map((r) =>
              <div
                key={r.id}
                className="grid grid-cols-4 px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 items-center">
                
                    <span className="font-medium text-gray-900">{r.name}</span>
                    <span className="text-gray-600">{r.description}</span>
                    <span className="text-gray-700">{r.members}</span>
                    <div className="text-right">
                      <button
                    onClick={() => removeRole(r.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors">
                    
                        <XIcon className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
              )}
              </div>
            }
          </section>

          {/* Permissions */}
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Permissions
                </h2>
                <p className="text-sm text-gray-500">
                  Manage permissions for roles and resources.
                </p>
              </div>
              <button
                onClick={() => setShowPermissionForm(!showPermissionForm)}
                className="px-4 py-2 border border-violet-200 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 transition-colors">
                
                {showPermissionForm ? 'Cancel' : 'Manage Permissions'}
              </button>
            </div>

            {showPermissionForm &&
            <form
              onSubmit={handleCreatePermission}
              className="bg-violet-50/50 border border-violet-100 rounded-lg p-4 mb-4 space-y-3">
              
                <input
                type="text"
                placeholder="Permission name (e.g. Edit Episodes)"
                value={permName}
                onChange={(e) => setPermName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
                <input
                type="text"
                placeholder="Description"
                value={permDescription}
                onChange={(e) => setPermDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              
                <select
                value={permType}
                onChange={(e) =>
                setPermType(e.target.value as 'Read' | 'Write' | 'Admin')
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                
                  <option value="Read">Read</option>
                  <option value="Write">Write</option>
                  <option value="Admin">Admin</option>
                </select>
                <button
                type="submit"
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                
                  Add Permission
                </button>
              </form>
            }

            {permissions.length === 0 ?
            <div className="border border-gray-100 rounded-lg">
                <div className="grid grid-cols-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <span>Permission</span>
                  <span>Description</span>
                  <span>Type</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mb-3">
                    <LockIcon className="w-6 h-6 text-violet-500" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium">
                    No permissions configured yet.
                  </p>
                  <p className="text-sm text-gray-400">
                    Configure permissions to get started.
                  </p>
                </div>
              </div> :

            <div className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 px-4 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50">
                  <span>Permission</span>
                  <span>Description</span>
                  <span>Type</span>
                  <span className="text-right">Actions</span>
                </div>
                {permissions.map((p) =>
              <div
                key={p.id}
                className="grid grid-cols-4 px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 items-center">
                
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-600">{p.description}</span>
                    <span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                        {p.type}
                      </span>
                    </span>
                    <div className="text-right">
                      <button
                    onClick={() => removePermission(p.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors">
                    
                        <XIcon className="w-4 h-4 inline" />
                      </button>
                    </div>
                  </div>
              )}
              </div>
            }
          </section>

          <div className="flex justify-end">
            <button className="px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors inline-flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppLayout>);

}