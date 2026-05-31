import React, { useState, useEffect } from 'react';
import { AppLayout } from '../components/AppLayout';
import {
  CalendarIcon, ChevronDownIcon, RadioIcon, BarChart3Icon,
  CheckCircle2Icon, ClockIcon, FolderIcon, FileTextIcon,
  AlertCircleIcon, TrendingUpIcon, HardDriveIcon, LayersIcon,
  ListChecksIcon, MicIcon,
} from 'lucide-react';
import { useAuth } from '../store/AuthStore';
import { useMediaStore } from '../store/MediaStore';
import { getProductionStats, type ProductionStats } from '../services/analyticsService';

const TASK_STATUS_COLORS: Record<string, string> = {
  'To Do': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'In Review': 'bg-amber-500',
  'Completed': 'bg-green-500',
};

const TASK_STATUS_TEXT: Record<string, string> = {
  'To Do': 'text-gray-600 bg-gray-50 border-gray-200',
  'In Progress': 'text-blue-700 bg-blue-50 border-blue-200',
  'In Review': 'text-amber-700 bg-amber-50 border-amber-200',
  'Completed': 'text-green-700 bg-green-50 border-green-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-300',
  Medium: 'bg-blue-400',
  High: 'bg-orange-500',
  Urgent: 'bg-red-600',
};

function StatCard({ label, value, sub, icon: Icon, color = 'violet' }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  const colorMap: Record<string, string> = {
    violet: 'bg-violet-50 text-violet-600',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-500',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color] ?? colorMap.violet}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right">{value}</span>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const s = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${s[i]}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ENTITY_ICONS: Record<string, React.ElementType> = {
  project: FolderIcon,
  episode: RadioIcon,
  task: ListChecksIcon,
  template: FileTextIcon,
  media: MicIcon,
};

export function Analytics() {
  const { user } = useAuth();
  const { projects, episodes, tasks } = useMediaStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    getProductionStats(user.userId).then((s) => {
      setStats(s);
      setIsLoading(false);
    });
  }, [user?.userId, projects.length, episodes.length, tasks.length]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'episodes', label: 'Episodes' },
    { id: 'activity', label: 'Activity' },
    { id: 'storage', label: 'Storage' },
  ];

  const isEmpty = stats && stats.totalProjects === 0 && stats.totalEpisodes === 0 && stats.totalTasks === 0;

  return (
    <AppLayout title="Analytics">
      <div className="mb-6">
        <p className="text-sm text-gray-500">Your local production metrics — computed from your real workspace data.</p>
      </div>

      <div className="border-b border-gray-200 mb-8 flex items-center justify-between">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isEmpty ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3Icon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No production data yet</h2>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Create your first project, add some episodes, and track tasks to start seeing your production analytics here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'overview' && stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Projects" value={stats.totalProjects} icon={FolderIcon} color="violet"
                  sub={`${stats.projectsInProduction} in production`} />
                <StatCard label="Total Episodes" value={stats.totalEpisodes} icon={RadioIcon} color="blue"
                  sub={`${stats.episodesByStatus['Production'] ?? 0} recording`} />
                <StatCard label="Total Tasks" value={stats.totalTasks} icon={ListChecksIcon} color="green"
                  sub={`${stats.completedTasks} completed`} />
                <StatCard label="Completion Rate" value={`${stats.taskCompletionRate}%`} icon={TrendingUpIcon}
                  color={stats.taskCompletionRate >= 70 ? 'green' : stats.taskCompletionRate >= 40 ? 'orange' : 'red'}
                  sub="task completion" />
              </div>

              {stats.overdueTaskCount > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
                  <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-red-800">
                    {stats.overdueTaskCount} overdue {stats.overdueTaskCount === 1 ? 'task' : 'tasks'} — check the Tasks page.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Task Pipeline</h3>
                  {Object.keys(stats.tasksByStatus).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No tasks yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.tasksByStatus).map(([status, count]) => (
                        <ProgressBar key={status} label={status} value={count} max={stats.totalTasks}
                          color={TASK_STATUS_COLORS[status] ?? 'bg-gray-400'} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Task Priority Breakdown</h3>
                  {Object.keys(stats.tasksByPriority).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No tasks yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(stats.tasksByPriority).map(([priority, count]) => (
                        <ProgressBar key={priority} label={priority} value={count} max={stats.totalTasks}
                          color={PRIORITY_COLORS[priority] ?? 'bg-gray-400'} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'tasks' && stats && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Tasks" value={stats.totalTasks} icon={ListChecksIcon} color="violet" />
                <StatCard label="Completed" value={stats.completedTasks} icon={CheckCircle2Icon} color="green" />
                <StatCard label="Overdue" value={stats.overdueTaskCount} icon={AlertCircleIcon} color={stats.overdueTaskCount > 0 ? 'red' : 'gray'} />
                <StatCard label="Completion Rate" value={`${stats.taskCompletionRate}%`} icon={TrendingUpIcon} color="blue" />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-5">Tasks by Status</h3>
                <div className="space-y-4">
                  {['To Do', 'In Progress', 'In Review', 'Completed'].map((status) => {
                    const count = stats.tasksByStatus[status] ?? 0;
                    return (
                      <div key={status} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${TASK_STATUS_COLORS[status]}`} />
                          <span className="text-sm font-medium text-gray-700">{status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${TASK_STATUS_COLORS[status]}`}
                              style={{ width: stats.totalTasks > 0 ? `${(count / stats.totalTasks) * 100}%` : '0%' }} />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${TASK_STATUS_TEXT[status]}`}>
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {activeTab === 'episodes' && stats && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <StatCard label="Total Episodes" value={stats.totalEpisodes} icon={RadioIcon} color="violet" />
                <StatCard label="In Production" value={stats.episodesByStatus['Production'] ?? 0} icon={MicIcon} color="blue" />
                <StatCard label="Projects Active" value={stats.projectsInProduction} icon={FolderIcon} color="green"
                  sub="in production or later" />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-5">Episodes by Status</h3>
                {Object.keys(stats.episodesByStatus).length === 0 ? (
                  <div className="text-center py-8">
                    <RadioIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No episodes created yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.episodesByStatus).map(([status, count]) => (
                      <ProgressBar key={status} label={status} value={count} max={stats.totalEpisodes}
                        color="bg-violet-500" />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'activity' && stats && (
            <>
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">Recent Activity</h3>
                </div>
                {stats.recentActivity.length === 0 ? (
                  <div className="p-8 text-center">
                    <ClockIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity yet. Start creating projects, episodes, and tasks.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {stats.recentActivity.map((a, i) => {
                      const Icon = ENTITY_ICONS[a.entityType] ?? LayersIcon;
                      return (
                        <div key={i} className="flex items-start gap-4 px-6 py-4">
                          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800">{a.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(a.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'storage' && stats && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <StatCard label="Media Files" value={stats.totalMediaAssets} icon={HardDriveIcon} color="violet"
                  sub="stored locally in browser" />
                <StatCard label="Storage Used" value={formatSize(stats.totalMediaSizeBytes)} icon={HardDriveIcon}
                  color="blue" sub="IndexedDB local storage" />
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle2Icon className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">All data is stored locally</p>
                    <p className="text-xs text-gray-500">Nothing is uploaded to external servers.</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  {[
                    'Projects, episodes, tasks, and templates live in IndexedDB',
                    'Audio recordings are stored as browser Object URLs',
                    'Media assets are indexed locally with metadata only',
                    'User settings and preferences are persisted per-user',
                    'Legal acceptances are timestamped and stored locally',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
}
