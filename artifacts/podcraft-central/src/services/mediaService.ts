import { db, type DbMediaAsset } from '../db';

export async function getAssets(userId: number): Promise<DbMediaAsset[]> {
  return db.media_assets.where('userId').equals(userId).toArray();
}

export async function getAssetsByCategory(userId: number, category: string): Promise<DbMediaAsset[]> {
  return db.media_assets
    .where('userId').equals(userId)
    .and((a) => a.category === category)
    .toArray();
}

export async function getAsset(id: string): Promise<DbMediaAsset | undefined> {
  return db.media_assets.get(id);
}

export async function createAsset(userId: number, data: Omit<DbMediaAsset, 'id' | 'userId' | 'createdAt'>): Promise<DbMediaAsset> {
  const asset: DbMediaAsset = {
    ...data,
    id: `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    createdAt: new Date().toISOString(),
  };
  await db.media_assets.add(asset);
  return asset;
}

export async function updateAsset(id: string, updates: Partial<Omit<DbMediaAsset, 'id' | 'userId' | 'createdAt'>>): Promise<void> {
  await db.media_assets.update(id, updates);
}

export async function deleteAsset(id: string): Promise<void> {
  await db.media_assets.delete(id);
}

export async function getStorageStats(userId: number): Promise<{ totalFiles: number; totalSize: number }> {
  const assets = await getAssets(userId);
  return {
    totalFiles: assets.length,
    totalSize: assets.reduce((sum, a) => sum + a.size, 0),
  };
}
