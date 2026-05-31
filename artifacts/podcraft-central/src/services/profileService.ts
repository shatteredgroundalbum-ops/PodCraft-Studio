import { db, type DbProfile } from '../db';

export async function getProfile(userId: number): Promise<DbProfile | undefined> {
  return db.profiles.where('userId').equals(userId).first();
}

export async function upsertProfile(userId: number, data: Partial<Omit<DbProfile, 'id' | 'userId'>>) {
  const existing = await db.profiles.where('userId').equals(userId).first();
  const now = new Date().toISOString();
  if (existing) {
    await db.profiles.update(existing.id!, { ...data, updatedAt: now });
  } else {
    await db.profiles.add({
      userId,
      displayName: data.displayName ?? '',
      bio: data.bio ?? '',
      timezone: data.timezone ?? '',
      avatarUrl: data.avatarUrl ?? '',
      updatedAt: now,
      ...data,
    });
  }
}
