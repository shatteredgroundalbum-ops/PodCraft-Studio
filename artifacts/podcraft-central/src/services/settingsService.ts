import { db } from '../db';

function settingId(userId: number, key: string) {
  return `${userId}_${key}`;
}

export async function getSetting<T = unknown>(userId: number, key: string): Promise<T | undefined> {
  const row = await db.settings.get(settingId(userId, key));
  return row?.value as T | undefined;
}

export async function setSetting(userId: number, key: string, value: unknown): Promise<void> {
  const id = settingId(userId, key);
  await db.settings.put({ id, userId, key, value, updatedAt: new Date().toISOString() });
}

export async function getAllSettings(userId: number): Promise<Record<string, unknown>> {
  const rows = await db.settings.where('userId').equals(userId).toArray();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function deleteSetting(userId: number, key: string): Promise<void> {
  await db.settings.delete(settingId(userId, key));
}
