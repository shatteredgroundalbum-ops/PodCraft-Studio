export type StorageProvider = 'local';

export interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  provider: StorageProvider;
  createdAt: string;
}

const objectURLs = new Map<string, string>();

export async function saveFile(file: File): Promise<StoredFile> {
  const id = `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const url = URL.createObjectURL(file);
  objectURLs.set(id, url);
  return {
    id,
    name: file.name,
    size: file.size,
    type: file.type,
    url,
    provider: 'local',
    createdAt: new Date().toISOString(),
  };
}

export async function revokeFile(id: string): Promise<void> {
  const url = objectURLs.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectURLs.delete(id);
  }
}

export function getFileUrl(id: string): string | undefined {
  return objectURLs.get(id);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
