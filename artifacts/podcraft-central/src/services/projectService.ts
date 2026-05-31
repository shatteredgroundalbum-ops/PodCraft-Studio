import { db, type DbProject } from '../db';

export async function getProjects(userId: number): Promise<DbProject[]> {
  return db.projects.where('userId').equals(userId).toArray();
}

export async function getProject(id: string): Promise<DbProject | undefined> {
  return db.projects.get(id);
}

export async function createProject(userId: number, data: Omit<DbProject, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'tracks' | 'episodes'>): Promise<DbProject> {
  const now = new Date().toISOString();
  const project: DbProject = {
    ...data,
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    tracks: [],
    episodes: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function updateProject(id: string, updates: Partial<Omit<DbProject, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await db.projects.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteProject(id: string): Promise<void> {
  const episodeIds = (await db.episodes.where('projectId').equals(id).toArray()).map((e) => e.id);
  await db.transaction('rw', db.projects, db.episodes, db.tasks, async () => {
    await db.projects.delete(id);
    await db.episodes.where('projectId').equals(id).delete();
    await db.tasks.where('projectId').equals(id).delete();
    if (episodeIds.length) await db.episodes.bulkDelete(episodeIds);
  });
}
