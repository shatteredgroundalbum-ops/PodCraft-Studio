import { db, type DbTask, type DbChecklistItem, type DbComment, type DbAttachment } from '../db';

export async function getTasks(userId: number): Promise<DbTask[]> {
  return db.tasks.where('userId').equals(userId).toArray();
}

export async function getTasksByProject(projectId: string): Promise<DbTask[]> {
  return db.tasks.where('projectId').equals(projectId).toArray();
}

export async function getTask(id: string): Promise<DbTask | undefined> {
  return db.tasks.get(id);
}

export async function createTask(userId: number, data: Omit<DbTask, 'id' | 'userId' | 'checklist' | 'attachments' | 'comments' | 'activity' | 'createdAt' | 'updatedAt'>): Promise<DbTask> {
  const now = new Date().toISOString();
  const task: DbTask = {
    ...data,
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    checklist: [],
    attachments: [],
    comments: [],
    activity: [{ id: `act_${Date.now()}`, text: 'Task created', createdAt: now }],
    createdAt: now,
    updatedAt: now,
  };
  await db.tasks.add(task);
  return task;
}

export async function updateTask(id: string, updates: Partial<Omit<DbTask, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await db.tasks.update(id, { ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function addChecklistItem(taskId: string, text: string): Promise<void> {
  const item: DbChecklistItem = { id: `chk_${Date.now()}`, text, done: false };
  await db.tasks.where('id').equals(taskId).modify((t) => {
    t.checklist.push(item);
    t.updatedAt = new Date().toISOString();
  });
}

export async function toggleChecklistItem(taskId: string, itemId: string): Promise<void> {
  await db.tasks.where('id').equals(taskId).modify((t) => {
    const item = t.checklist.find((c) => c.id === itemId);
    if (item) item.done = !item.done;
    t.updatedAt = new Date().toISOString();
  });
}

export async function addComment(taskId: string, author: string, text: string): Promise<void> {
  const comment: DbComment = { id: `cmt_${Date.now()}`, author, text, createdAt: new Date().toISOString() };
  await db.tasks.where('id').equals(taskId).modify((t) => {
    t.comments.push(comment);
    t.updatedAt = new Date().toISOString();
  });
}

export async function addAttachment(taskId: string, attachment: Omit<DbAttachment, 'id'>): Promise<void> {
  const att: DbAttachment = { ...attachment, id: `att_${Date.now()}` };
  await db.tasks.where('id').equals(taskId).modify((t) => {
    t.attachments.push(att);
    t.updatedAt = new Date().toISOString();
  });
}

export async function logTaskActivity(taskId: string, text: string): Promise<void> {
  await db.tasks.where('id').equals(taskId).modify((t) => {
    t.activity.unshift({ id: `act_${Date.now()}`, text, createdAt: new Date().toISOString() });
    t.updatedAt = new Date().toISOString();
  });
}
