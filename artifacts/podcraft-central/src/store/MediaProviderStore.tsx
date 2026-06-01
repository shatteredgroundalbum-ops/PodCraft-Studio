// ─── Media Provider Store ─────────────────────────────────────────────────────
// React context for media provider configurations + generated asset tracking.
// All data persists in IndexedDB. API keys never leave the device.
//
// WARNINGS enforced in this store:
// - API keys stored in IndexedDB (local device only)
// - External provider costs are the user's responsibility
// - Provider terms apply
// - Commercial rights depend on provider plan

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dbGet, dbPut, dbDelete, dbGetAll } from './db';
import type { MediaProviderConfig, GeneratedMediaAsset, MediaProviderStatus } from '../services/media/types';
import { PROVIDER_REGISTRY } from '../services/media/mediaServicesHub';
import { mediaServicesHub } from '../services/media/mediaServicesHub';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MediaProviderState {
  configs: MediaProviderConfig[];
  assets: GeneratedMediaAsset[];
  loading: boolean;
}

interface MediaProviderContextValue extends MediaProviderState {
  // Provider config management
  getConfig: (id: string) => MediaProviderConfig | undefined;
  getDefaultFor: (category: MediaProviderConfig['category']) => MediaProviderConfig | undefined;
  saveConfig: (config: MediaProviderConfig) => Promise<void>;
  removeConfig: (id: string) => Promise<void>;
  validateProvider: (id: string) => Promise<{ ok: boolean; message: string }>;
  // Generated asset management
  saveAsset: (asset: GeneratedMediaAsset) => Promise<void>;
  confirmAssetRights: (assetId: string, note?: string) => Promise<void>;
  importAssetToLibrary: (assetId: string) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  getAssetsByEpisode: (episodeId: string) => GeneratedMediaAsset[];
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MediaProviderContext = createContext<MediaProviderContextValue | null>(null);

export function useMediaProviders() {
  const ctx = useContext(MediaProviderContext);
  if (!ctx) throw new Error('useMediaProviders must be used inside MediaProviderProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function MediaProviderProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MediaProviderState>({ configs: [], assets: [], loading: true });

  const load = useCallback(async () => {
    try {
      const [configs, assets] = await Promise.all([
        dbGetAll<MediaProviderConfig>('mediaProviderConfigs'),
        dbGetAll<GeneratedMediaAsset>('generatedAssets'),
      ]);
      setState({ configs, assets, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const getConfig = useCallback((id: string) => {
    return state.configs.find(c => c.id === id);
  }, [state.configs]);

  const getDefaultFor = useCallback((category: MediaProviderConfig['category']) => {
    return state.configs.find(c => c.category === category && c.defaultFor?.includes(category) && c.status === 'connected');
  }, [state.configs]);

  const saveConfig = useCallback(async (config: MediaProviderConfig) => {
    const updated = { ...config, updatedAt: new Date().toISOString() };
    await dbPut('mediaProviderConfigs', updated);
    setState(s => ({
      ...s,
      configs: s.configs.some(c => c.id === config.id)
        ? s.configs.map(c => c.id === config.id ? updated : c)
        : [...s.configs, updated],
    }));
  }, []);

  const removeConfig = useCallback(async (id: string) => {
    await dbDelete('mediaProviderConfigs', id);
    setState(s => ({ ...s, configs: s.configs.filter(c => c.id !== id) }));
  }, []);

  const validateProvider = useCallback(async (id: string): Promise<{ ok: boolean; message: string }> => {
    const config = state.configs.find(c => c.id === id);
    if (!config) return { ok: false, message: 'Provider not configured.' };

    // Set validating status
    const validating: MediaProviderConfig = { ...config, status: 'validating', updatedAt: new Date().toISOString() };
    await dbPut('mediaProviderConfigs', validating);
    setState(s => ({ ...s, configs: s.configs.map(c => c.id === id ? validating : c) }));

    const result = await mediaServicesHub.validateProvider(config);

    const newStatus: MediaProviderStatus = result.ok ? 'connected' : (
      result.error?.code === 'invalid-api-key' ? 'error' :
      result.error?.code === 'insufficient-credits' ? 'insufficient-credits' :
      result.error?.code === 'rate-limit-exceeded' ? 'rate-limited' : 'error'
    );

    const updated: MediaProviderConfig = {
      ...config,
      status: newStatus,
      statusMessage: result.ok
        ? `Connected${result.plan ? ` — ${result.plan}` : ''}${result.creditsRemaining ? ` · ${result.creditsRemaining} remaining` : ''}`
        : (result.error?.message ?? 'Validation failed'),
      validatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dbPut('mediaProviderConfigs', updated);
    setState(s => ({ ...s, configs: s.configs.map(c => c.id === id ? updated : c) }));

    return { ok: result.ok, message: updated.statusMessage ?? '' };
  }, [state.configs]);

  const saveAsset = useCallback(async (asset: GeneratedMediaAsset) => {
    await dbPut('generatedAssets', asset);
    setState(s => ({
      ...s,
      assets: s.assets.some(a => a.id === asset.id)
        ? s.assets.map(a => a.id === asset.id ? asset : a)
        : [...s.assets, asset],
    }));
  }, []);

  const confirmAssetRights = useCallback(async (assetId: string, note?: string) => {
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return;
    const updated: GeneratedMediaAsset = {
      ...asset,
      userConfirmedRights: true,
      licenseStatus: 'confirmed',
      commercialRightsStatus: 'confirmed',
      rightsNote: note ?? asset.rightsNote,
    };
    await dbPut('generatedAssets', updated);
    setState(s => ({ ...s, assets: s.assets.map(a => a.id === assetId ? updated : a) }));
  }, [state.assets]);

  const importAssetToLibrary = useCallback(async (assetId: string) => {
    const asset = state.assets.find(a => a.id === assetId);
    if (!asset) return;
    const updated: GeneratedMediaAsset = { ...asset, importedToMediaLibrary: true };
    await dbPut('generatedAssets', updated);
    setState(s => ({ ...s, assets: s.assets.map(a => a.id === assetId ? updated : a) }));
  }, [state.assets]);

  const deleteAsset = useCallback(async (assetId: string) => {
    await dbDelete('generatedAssets', assetId);
    setState(s => ({ ...s, assets: s.assets.filter(a => a.id !== assetId) }));
  }, []);

  const getAssetsByEpisode = useCallback((episodeId: string) => {
    return state.assets.filter(a => a.episodeId === episodeId);
  }, [state.assets]);

  return (
    <MediaProviderContext.Provider value={{
      ...state,
      getConfig, getDefaultFor, saveConfig, removeConfig, validateProvider,
      saveAsset, confirmAssetRights, importAssetToLibrary, deleteAsset, getAssetsByEpisode,
    }}>
      {children}
    </MediaProviderContext.Provider>
  );
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export { PROVIDER_REGISTRY };
