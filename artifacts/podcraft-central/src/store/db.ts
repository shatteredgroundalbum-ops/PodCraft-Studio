const DB_NAME = 'podcraft-central';
const DB_VERSION = 2;   // bumped: adds mediaProviderConfigs + generatedAssets stores

export interface DBSchema {
  users: { email: string; passwordHash: string; name: string; timezone: string; createdAt: string };
  projects: object;
  episodes: object;
  tasks: object;
  mediaAssets: object;
  templates: object;
  mediaProviderConfigs: object;   // API keys + provider settings (local device only)
  generatedAssets: object;        // AI-generated media assets + rights metadata
}

let dbInstance: IDBDatabase | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Version 1 stores (idempotent — safe whether fresh install or upgrade)
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'email' });
      }
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('episodes')) {
        db.createObjectStore('episodes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('mediaAssets')) {
        db.createObjectStore('mediaAssets', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }

      // Version 2 stores — Media Services Hub
      if (!db.objectStoreNames.contains('mediaProviderConfigs')) {
        db.createObjectStore('mediaProviderConfigs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('generatedAssets')) {
        const assetStore = db.createObjectStore('generatedAssets', { keyPath: 'id' });
        assetStore.createIndex('byEpisode', 'episodeId', { unique: false });
        assetStore.createIndex('byProject', 'projectId', { unique: false });
        assetStore.createIndex('byType', 'assetType', { unique: false });
      }
    };
    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error);
  });
}

export function dbGetAll<T>(storeName: string): Promise<T[]> {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbGet<T>(storeName: string, key: string): Promise<T | undefined> {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbPut(storeName: string, value: object): Promise<void> {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })
  );
}

export function dbDelete(storeName: string, key: string): Promise<void> {
  return openDB().then((db) =>
    new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    })
  );
}

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

export async function createUser(name: string, email: string, password: string, timezone: string): Promise<{ ok: boolean; error?: string }> {
  const existing = await dbGet<object>('users', email);
  if (existing) return { ok: false, error: 'An account with this email already exists.' };
  await dbPut('users', {
    email,
    passwordHash: hashPassword(password),
    name,
    timezone,
    createdAt: new Date().toISOString(),
  });
  return { ok: true };
}

export async function validateUser(email: string, password: string): Promise<{ ok: boolean; name?: string; error?: string }> {
  const user = await dbGet<{ email: string; passwordHash: string; name: string }>('users', email);
  if (!user) return { ok: false, error: 'No account found with this email address.' };
  if (user.passwordHash !== hashPassword(password)) return { ok: false, error: 'Incorrect password.' };
  return { ok: true, name: user.name };
}
