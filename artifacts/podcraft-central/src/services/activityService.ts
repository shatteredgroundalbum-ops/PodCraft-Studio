import { db, type DbActivityEvent } from '../db';

export async function logActivity(
  userId: number,
  type: string,
  entityType: string,
  entityId: string,
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const event: DbActivityEvent = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    type,
    entityType,
    entityId,
    description,
    metadata,
    createdAt: new Date().toISOString(),
  };
  await db.activity_events.add(event);
}

export async function getActivities(userId: number, limit = 50): Promise<DbActivityEvent[]> {
  return db.activity_events
    .where('userId').equals(userId)
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getActivitiesByEntity(userId: number, entityType: string, entityId: string): Promise<DbActivityEvent[]> {
  return db.activity_events
    .where('userId').equals(userId)
    .and((a) => a.entityType === entityType && a.entityId === entityId)
    .reverse()
    .toArray();
}

export async function clearActivities(userId: number): Promise<void> {
  await db.activity_events.where('userId').equals(userId).delete();
}
