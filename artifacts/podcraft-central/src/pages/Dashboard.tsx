import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore } from '../store/MediaStore';
import { useAuth } from '../store/AuthStore';
import {
  PlayIcon, MicIcon, AudioLinesIcon, RadioIcon, FolderIcon, CheckCircleIcon,
  FileAudioIcon, PackageIcon, ClockIcon, AlertCircleIcon, PlusIcon, UploadIcon,
  ArrowRightIcon, CircleIcon, ImageIcon, VideoIcon, FileTextIcon, MusicIcon,
  ActivityIcon, SparklesIcon, WifiOffIcon, PowerIcon,
} from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projects, episodes, tasks, mediaAssets } = useMediaStore();

  const currentProject = projects[projects.length - 1];
  const currentEpisode = currentProject ? episodes.find((e) => e.projectId === currentProject.id) : undefined;
  const currentTask = tasks.find((t) => t.status === 'In Progress') || tasks[0];

  const recordings = mediaAssets.filter((a) => a.source === 'recording').length;
  const masters = mediaAssets.filter((a) => a.source === 'master').length;
  const exports = mediaAssets.filter((a) => a.source === 'export').length;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekFromNow = new Date(today); weekFromNow.setDate(today.getDate() + 7);
  const parseDate = (d: string) => { if (!d) return null; const p = new Date(d); return isNaN(p.getTime()) ? null : p; };

  const upcomingTasks = tasks.filter((t) => { if (t.status === 'Completed') return false; const due = parseDate(t.dueDate); return due && due >= today && due <= weekFromNow; }).slice(0, 5);
  const dueTasks = tasks.filter((t) => { if (t.status === 'Completed') return false; const due = parseDate(t.dueDate); return due && due < today; }).slice(0, 5);
  const recentActivity = tasks.flatMap((t) => t.activity.map((a) => ({ ...a, taskName: t.name }))).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentProjects = [...projects].reverse().slice(0, 3);
  const recentMedia = [...mediaAssets].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6);

  const mediaIconFor = (cat: string) => {
    if (cat === 'audio' || cat === 'studio' || cat === 'sfx') return FileAudioIcon;
    if (cat === 'music') return MusicIcon;
    if (cat === 'images') return ImageIcon;
    if (cat === 'videos') return VideoIcon;
    return FileTextIcon;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout title={`${greeting()}, ${user?.name?.split(' ')[0] || 'Creator'} 👋`}>
      <div className="space-y-8">
        {/* === Continue Working === */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Continue Working</h2>
          {!currentProject ? (
            <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-4">
                <FolderIcon className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No project in progress</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Create your first project to start recording, editing, and publishing podcasts.</p>
              <button onClick={() => navigate('/projects?new=true')} className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-colors">
                <PlusIcon className="w-4 h-4" /> Create Project
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-violet-100 text-xs font-medium uppercase tracking-wider mb-2">
                    <ActivityIcon className="w-4 h-4" /> Current work
                  </div>
                  <h3 className="text-2xl font-bold mb-1 truncate">{currentProject.name}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-violet-100">
                    <span>{currentProject.status}</span>
                    {currentEpisode && <><span className="w-1 h-1 rounded-full bg-violet-300" /><span>Episode: {currentEpisode.title}</span></>}
                    {currentTask && <><span className="w-1 h-1 rounded-full bg-violet-300" /><span>Task: {currentTask.name}</span></>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link to="/studio" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-50 transition-colors">
                    <MicIcon className="w-4 h-4" /> Open Studio
                  </Link>
                  <Link to="/studio" className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 backdrop-blur-sm transition-colors">
                    <PlayIcon className="w-4 h-4" /> Resume Editing
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* === Production Pipeline === */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Production Pipeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Projects', count: projects.length, icon: FolderIcon, href: '/projects' },
              { label: 'Episodes', count: episodes.length, icon: RadioIcon, href: '/projects' },
              { label: 'Tasks', count: tasks.length, icon: CheckCircleIcon, href: '/tasks' },
              { label: 'Recordings', count: recordings, icon: MicIcon, href: '/media-library' },
              { label: 'Masters', count: masters, icon: AudioLinesIcon, href: '/media-library' },
              { label: 'Exports', count: exports, icon: PackageIcon, href: '/media-library' },
            ].map((item) => (
              <Link key={item.label} to={item.href} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-violet-300 hover:shadow-sm transition-all group">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <item.icon className="w-4 h-4 text-violet-600" />
                  <span className="text-xs font-medium uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* === Today's Work === */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Today's Work</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-gray-900 text-sm">Upcoming Tasks</h3>
                <span className="ml-auto text-xs text-gray-400">{upcomingTasks.length}</span>
              </div>
              {upcomingTasks.length === 0 ? <p className="text-xs text-gray-500 py-6 text-center">No upcoming tasks</p> : (
                <ul className="space-y-2">
                  {upcomingTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                      <CircleIcon className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      <span className="truncate flex-1">{t.name}</span>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{t.dueDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircleIcon className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-gray-900 text-sm">Due Tasks</h3>
                <span className="ml-auto text-xs text-gray-400">{dueTasks.length}</span>
              </div>
              {dueTasks.length === 0 ? <p className="text-xs text-gray-500 py-6 text-center">No overdue tasks</p> : (
                <ul className="space-y-2">
                  {dueTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 text-sm text-gray-700 py-1.5">
                      <CircleIcon className="w-3 h-3 text-red-400 flex-shrink-0" />
                      <span className="truncate flex-1">{t.name}</span>
                      <span className="text-xs text-red-500 font-medium whitespace-nowrap">{t.dueDate}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <ActivityIcon className="w-4 h-4 text-violet-600" />
                <h3 className="font-bold text-gray-900 text-sm">Recent Activity</h3>
              </div>
              {recentActivity.length === 0 ? <p className="text-xs text-gray-500 py-6 text-center">No activity yet</p> : (
                <ul className="space-y-3">
                  {recentActivity.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="text-gray-700 leading-snug">{a.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.taskName}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* === Studio Status === */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Studio Status</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                <span className="text-sm font-bold text-gray-900">Studio Idle</span>
              </div>
              <Link to="/studio" className="text-xs font-medium text-violet-600 hover:text-violet-700 inline-flex items-center gap-1">
                Open Studio <ArrowRightIcon className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: WifiOffIcon, label: 'Audio Device', value: 'Not Connected' },
                { icon: MicIcon, label: 'Microphone', value: 'Not Selected' },
                { icon: PowerIcon, label: 'Engine', value: 'Idle' },
                { icon: SparklesIcon, label: 'AI Producer', value: 'Idle' },
              ].map((item) => (
                <div key={item.label} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <item.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === Recent Projects + Recent Media === */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Recent Projects</h2>
              {projects.length > 0 && <Link to="/projects" className="text-xs font-medium text-violet-600 hover:text-violet-700">View all</Link>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {recentProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <FolderIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No Projects Yet</p>
                  <p className="text-xs text-gray-500">Your projects will appear here once created.</p>
                </div>
              ) : recentProjects.map((p) => (
                <Link key={p.id} to="/projects" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <FolderIcon className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.status}</p>
                  </div>
                  <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-violet-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Recent Media</h2>
              {mediaAssets.length > 0 && <Link to="/media-library" className="text-xs font-medium text-violet-600 hover:text-violet-700">View all</Link>}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {recentMedia.length === 0 ? (
                <div className="p-8 text-center">
                  <FileAudioIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">No Media Found</p>
                  <p className="text-xs text-gray-500">Recordings, uploads, and exports will appear here.</p>
                </div>
              ) : recentMedia.map((m) => {
                const Icon = mediaIconFor(m.category);
                return (
                  <Link key={m.id} to="/media-library" className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors group">
                    <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{m.category}</p>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-gray-300 group-hover:text-violet-600" />
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* === Quick Actions === */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'New Project', icon: PlusIcon, onClick: () => navigate('/projects?new=true') },
              { label: 'New Episode', icon: RadioIcon, onClick: () => navigate('/projects') },
              { label: 'Open Studio', icon: MicIcon, onClick: () => navigate('/studio') },
              { label: 'Import Media', icon: UploadIcon, onClick: () => navigate('/media-library') },
            ].map((action) => (
              <button key={action.label} onClick={action.onClick}
                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col items-start gap-2 hover:border-violet-300 hover:shadow-sm transition-all group text-left">
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
                  <action.icon className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm font-semibold text-gray-900">{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
