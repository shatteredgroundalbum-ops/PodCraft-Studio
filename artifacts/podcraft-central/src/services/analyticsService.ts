import { db } from '../db';

export interface ProductionStats {
  totalProjects: number;
  totalEpisodes: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  episodesByStatus: Record<string, number>;
  completedTasks: number;
  taskCompletionRate: number;
  overdueTaskCount: number;
  recentActivity: Array<{ text: string; createdAt: string; entityType: string }>;
  projectsInProduction: number;
  totalMediaAssets: number;
  totalMediaSizeBytes: number;
}

export async function getProductionStats(userId: number): Promise<ProductionStats> {
  const [projects, episodes, tasks, assets, activities] = await Promise.all([
    db.projects.where('userId').equals(userId).toArray(),
    db.episodes.where('userId').equals(userId).toArray(),
    db.tasks.where('userId').equals(userId).toArray(),
    db.media_assets.where('userId').equals(userId).toArray(),
    db.activity_events.where('userId').equals(userId).reverse().limit(20).toArray(),
  ]);

  const tasksByStatus: Record<string, number> = {};
  const tasksByPriority: Record<string, number> = {};
  let overdueTaskCount = 0;
  const now = new Date();

  for (const task of tasks) {
    tasksByStatus[task.status] = (tasksByStatus[task.status] ?? 0) + 1;
    tasksByPriority[task.priority] = (tasksByPriority[task.priority] ?? 0) + 1;
    if (task.dueDate && task.status !== 'Completed') {
      const due = new Date(task.dueDate);
      if (!isNaN(due.getTime()) && due < now) overdueTaskCount++;
    }
  }

  const episodesByStatus: Record<string, number> = {};
  for (const ep of episodes) {
    episodesByStatus[ep.status] = (episodesByStatus[ep.status] ?? 0) + 1;
  }

  const completedTasks = tasksByStatus['Completed'] ?? 0;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const projectsInProduction = projects.filter((p) =>
    p.status === 'Production' || p.status === 'Post-Production' || p.status === 'Mastering'
  ).length;

  return {
    totalProjects: projects.length,
    totalEpisodes: episodes.length,
    totalTasks: tasks.length,
    tasksByStatus,
    tasksByPriority,
    episodesByStatus,
    completedTasks,
    taskCompletionRate,
    overdueTaskCount,
    recentActivity: activities.map((a) => ({
      text: a.description,
      createdAt: a.createdAt,
      entityType: a.entityType,
    })),
    projectsInProduction,
    totalMediaAssets: assets.length,
    totalMediaSizeBytes: assets.reduce((s, a) => s + a.size, 0),
  };
}
