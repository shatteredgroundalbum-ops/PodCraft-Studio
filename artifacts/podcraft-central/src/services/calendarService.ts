import { db, type DbCalendarEvent } from '../db';

export async function getEvents(userId: number): Promise<DbCalendarEvent[]> {
  return db.calendar_events.where('userId').equals(userId).toArray();
}

export async function getEventsForMonth(userId: number, year: number, month: number): Promise<DbCalendarEvent[]> {
  const start = new Date(year, month, 1).toISOString().slice(0, 10);
  const end = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return db.calendar_events
    .where('userId').equals(userId)
    .and((e) => e.date >= start && e.date <= end)
    .toArray();
}

export async function createEvent(userId: number, data: Omit<DbCalendarEvent, 'id' | 'userId' | 'createdAt'>): Promise<DbCalendarEvent> {
  const event: DbCalendarEvent = {
    ...data,
    id: `cal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    createdAt: new Date().toISOString(),
  };
  await db.calendar_events.add(event);
  return event;
}

export async function updateEvent(id: string, updates: Partial<Omit<DbCalendarEvent, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await db.calendar_events.update(id, updates);
}

export async function deleteEvent(id: string): Promise<void> {
  await db.calendar_events.delete(id);
}
