import { db, type DbUser } from '../db';

export async function getUser(userId: number): Promise<DbUser | undefined> {
  return db.users.get(userId);
}

export async function updateUser(userId: number, updates: Partial<Pick<DbUser, 'name' | 'timezone'>>) {
  await db.users.update(userId, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteUser(userId: number) {
  await db.transaction('rw',
    [db.users, db.sessions, db.profiles, db.projects, db.episodes,
     db.tasks, db.calendar_events, db.templates, db.media_assets,
     db.settings, db.legal_acceptances, db.activity_events],
    async () => {
      await db.users.delete(userId);
      await db.sessions.where('userId').equals(userId).delete();
      await db.profiles.where('userId').equals(userId).delete();
      await db.projects.where('userId').equals(userId).delete();
      await db.episodes.where('userId').equals(userId).delete();
      await db.tasks.where('userId').equals(userId).delete();
      await db.calendar_events.where('userId').equals(userId).delete();
      await db.templates.where('userId').equals(userId).delete();
      await db.media_assets.where('userId').equals(userId).delete();
      await db.settings.where('userId').equals(userId).delete();
      await db.legal_acceptances.where('userId').equals(userId).delete();
      await db.activity_events.where('userId').equals(userId).delete();
    }
  );
}
