import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { PlusIcon, UsersIcon, MailIcon, UserIcon, ShieldIcon, Edit2Icon, Trash2Icon, XIcon } from 'lucide-react';

type TeamRole = 'Owner' | 'Producer' | 'Editor' | 'Guest';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatar?: string;
  joinedAt: string;
}

const ROLE_COLORS: Record<TeamRole, string> = {
  Owner: 'bg-violet-100 text-violet-700',
  Producer: 'bg-blue-100 text-blue-700',
  Editor: 'bg-green-100 text-green-700',
  Guest: 'bg-gray-100 text-gray-700',
};

export function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const handleInvite = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = fd.get('name') as string;
    const email = fd.get('email') as string;
    const role = (fd.get('role') as TeamRole) || 'Guest';
    setMembers((prev) => [...prev, {
      id: `member_${Date.now()}`,
      name,
      email,
      role,
      joinedAt: new Date().toLocaleDateString(),
    }]);
    setIsInviteOpen(false);
  };

  const removeMemember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <AppLayout title="Team">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-500">Collaborate with your podcast production team.</p>
        <button onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors">
          <PlusIcon className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
            <UsersIcon className="w-8 h-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No team members yet</h2>
          <p className="text-gray-500 text-sm max-w-sm mb-6">Invite collaborators to join your podcast production workflow. Share tasks, projects, and notes with your team.</p>
          <button onClick={() => setIsInviteOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
            <PlusIcon className="w-5 h-5" />
            Invite Your First Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">{members.length} {members.length === 1 ? 'Member' : 'Members'}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}>
                  {member.role}
                </span>
                <span className="text-xs text-gray-400">Joined {member.joinedAt}</span>
                <button onClick={() => removeMemember(member.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Legend */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Team Roles</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { role: 'Owner', desc: 'Full access — manage all projects, team, and settings.' },
            { role: 'Producer', desc: 'Create and manage projects, episodes, and recordings.' },
            { role: 'Editor', desc: 'Edit and review content; no project creation.' },
            { role: 'Guest', desc: 'View-only access to shared content.' },
          ] as { role: TeamRole; desc: string }[]).map((item) => (
            <div key={item.role} className="p-4 border border-gray-100 rounded-xl">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mb-2 ${ROLE_COLORS[item.role]}`}>{item.role}</span>
              <p className="text-xs text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Invite Team Member</h3>
              <button onClick={() => setIsInviteOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="name" required autoFocus type="text" placeholder="Jane Smith"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input name="email" required type="email" placeholder="jane@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="relative">
                  <ShieldIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select name="role" className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option>Producer</option>
                    <option>Editor</option>
                    <option>Guest</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
