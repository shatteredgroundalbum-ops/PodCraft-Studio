import { db, type DbEpisode } from '../db';

export async function getEpisodes(userId: number): Promise<DbEpisode[]> {
  return db.episodes.where('userId').equals(userId).toArray();
}

export async function getEpisodesByProject(projectId: string): Promise<DbEpisode[]> {
  return db.episodes.where('projectId').equals(projectId).toArray();
}

export async function getEpisode(id: string): Promise<DbEpisode | undefined> {
  return db.episodes.get(id);
}

export async function createEpisode(userId: number, data: Omit<DbEpisode, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<DbEpisode> {
  const now = new Date().toISOString();
  const episode: DbEpisode = {
    ...data,
    id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  await db.episodes.add(episode);
  await db.projects.where('id').equals(data.projectId).modify((p) => {
    if (!p.episodes.includes(episode.id)) p.episodes.push(episode.id);
    p.updatedAt = now;
  });
  return episode;
}

export async function updateEpisode(id: string, updates: Partial<Omit<DbEpisode, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await db.episodes.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteEpisode(id: string): Promise<void> {
  const episode = await db.episodes.get(id);
  await db.episodes.delete(id);
  if (episode) {
    await db.projects.where('id').equals(episode.projectId).modify((p) => {
      p.episodes = p.episodes.filter((eid) => eid !== id);
      p.updatedAt = new Date().toISOString();
    });
  }
}
