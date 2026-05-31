import Dexie, { type Table } from 'dexie';

export interface DbUser {
  id?: number;
  email: string;
  passwordHash: string;
  name: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbSession {
  id?: number;
  userId: number;
  token: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbProfile {
  id?: number;
  userId: number;
  displayName: string;
  bio: string;
  timezone: string;
  avatarUrl: string;
  updatedAt: string;
}

export interface DbProject {
  id: string;
  userId: number;
  name: string;
  description: string;
  status: string;
  season: string;
  duration: string;
  lastSaved: string;
  microphone: string;
  audioInterface: string;
  sampleRate: string;
  bitDepth: string;
  recordingNotes: string;
  tracks: unknown[];
  episodes: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DbEpisode {
  id: string;
  userId: number;
  projectId: string;
  title: string;
  status: string;
  duration: string;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbChecklistItem { id: string; text: string; done: boolean }
export interface DbAttachment { id: string; name: string; size: string }
export interface DbComment { id: string; author: string; text: string; createdAt: string }
export interface DbActivityEntry { id: string; text: string; createdAt: string }

export interface DbTask {
  id: string;
  userId: number;
  name: string;
  description: string;
  projectId: string;
  assignedTo: string;
  dueDate: string;
  startDate: string;
  status: string;
  priority: string;
  type: string;
  tags: string[];
  estimatedTime: string;
  checklist: DbChecklistItem[];
  attachments: DbAttachment[];
  comments: DbComment[];
  activity: DbActivityEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface DbCalendarEvent {
  id: string;
  userId: number;
  title: string;
  type: 'task' | 'episode' | 'custom';
  date: string;
  relatedId?: string;
  notes: string;
  color?: string;
  createdAt: string;
}

export interface DbTemplate {
  id: string;
  userId: number;
  name: string;
  description: string;
  category: string;
  tags: string[];
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbMediaAsset {
  id: string;
  userId: number;
  name: string;
  category: string;
  source: string;
  size: number;
  type: string;
  duration?: string;
  description: string;
  tags: string[];
  url?: string;
  addedBy: string;
  createdAt: string;
}

export interface DbSetting {
  id: string;
  userId: number;
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface DbLegalAcceptance {
  id: string;
  userId: number;
  documentName: string;
  documentVersion: string;
  acceptedAt: string;
}

export interface DbActivityEvent {
  id: string;
  userId: number;
  type: string;
  entityType: string;
  entityId: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

class PodCraftDB extends Dexie {
  users!: Table<DbUser, number>;
  sessions!: Table<DbSession, number>;
  profiles!: Table<DbProfile, number>;
  projects!: Table<DbProject, string>;
  episodes!: Table<DbEpisode, string>;
  tasks!: Table<DbTask, string>;
  calendar_events!: Table<DbCalendarEvent, string>;
  templates!: Table<DbTemplate, string>;
  media_assets!: Table<DbMediaAsset, string>;
  settings!: Table<DbSetting, string>;
  legal_acceptances!: Table<DbLegalAcceptance, string>;
  activity_events!: Table<DbActivityEvent, string>;

  constructor() {
    super('podcraft-v2');
    this.version(1).stores({
      users:              '++id, &email',
      sessions:           '++id, userId, token, expiresAt',
      profiles:           '++id, &userId',
      projects:           'id, userId, status',
      episodes:           'id, userId, projectId, status',
      tasks:              'id, userId, projectId, status, dueDate, priority',
      calendar_events:    'id, userId, date, type',
      templates:          'id, userId, category',
      media_assets:       'id, userId, category, source',
      settings:           'id, userId',
      legal_acceptances:  'id, userId, documentName',
      activity_events:    'id, userId, entityType, entityId',
    });
  }
}

export const db = new PodCraftDB();
