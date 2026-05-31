import { db, type DbTemplate } from '../db';

export async function getTemplates(userId: number): Promise<DbTemplate[]> {
  return db.templates.where('userId').equals(userId).toArray();
}

export async function getTemplate(id: string): Promise<DbTemplate | undefined> {
  return db.templates.get(id);
}

export async function createTemplate(userId: number, data: Omit<DbTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<DbTemplate> {
  const now = new Date().toISOString();
  const template: DbTemplate = {
    ...data,
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  await db.templates.add(template);
  return template;
}

export async function updateTemplate(id: string, updates: Partial<Omit<DbTemplate, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await db.templates.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteTemplate(id: string): Promise<void> {
  await db.templates.delete(id);
}
