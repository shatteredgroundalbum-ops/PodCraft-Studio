import React, { useState, useEffect } from 'react';
import {
  X, Cloud, Key, Wifi, WifiOff, Loader2, CheckCircle2,
  AlertTriangle, ChevronDown, ExternalLink, Eye, EyeOff, RefreshCw,
} from 'lucide-react';
import {
  CLOUD_PROVIDERS, CloudProviderDef, CloudProviderId, CloudStatus,
  getStoredKey, storeKey, clearKey,
  getOllamaUrl, setOllamaUrl, getOllamaModel, setOllamaModel,
  validateProvider, fetchOllamaModels, cloudInfer,
} from '../../utils/cloudAI';
import { useAIModel } from '../../store/AIModelStore';

interface ProviderState {
  status: CloudStatus;
  error?: string;
}

interface OllamaExtra {
  url: string;
  model: string;
  availableModels: string[];
  fetchingModels: boolean;
}

const STATUS_LABEL: Record<CloudStatus, string> = {
  'not-connected': 'Not Connected',
  'validating': 'Validating…',
  'connected': 'Connected',
  'invalid-key': 'Invalid Key',
  'connection-failed': 'Connection Failed',
  'missing-key': 'Missing API Key',
  'unsupported': 'Unsupported',
};

const STATUS_COLOR: Record<CloudStatus, string> = {
  'not-connected': 'text-gray-400',
  'validating': 'text-blue-500',
  'connected': 'text-green-600 font-semibold',
  'invalid-key': 'text-red-500 font-semibold',
  'connection-failed': 'text-red-500',
  'missing-key': 'text-orange-500',
  'unsupported': 'text-gray-400',
};

export function CloudAIPanel({ onClose }: { onClose: () => void }) {
  const { activateCloud, deactivate, aiMode, runtime: activeRuntime, modelName: activeModel } = useAIModel();

  const [selectedProvider, setSelectedProvider] = useState<CloudProviderId>('openai');
  const [selectedModelId, setSelectedModelId] = useState<Record<CloudProviderId, string>>({
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-haiku-20240307',
    gemini: 'gemini-1.5-flash',
    ollama: getOllamaModel(),
  });
  const [apiKeys, setApiKeys] = useState<Record<string, string>>(() => {
    const keys: Record<string, string> = {};
    for (const p of CLOUD_PROVIDERS) keys[p.id] = getStoredKey(p.id as CloudProviderId);
    return keys;
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>(() => {
    const s: Record<string, ProviderState> = {};
    for (const p of CLOUD_PROVIDERS) s[p.id] = { status: 'not-connected' };
    return s;
  });
  const [ollama, setOllama] = useState<OllamaExtra>({
    url: getOllamaUrl(),
    model: getOllamaModel(),
    availableModels: [],
    fetchingModels: false,
  });

  const activeConnectionKey = aiMode === 'cloud' ? `${activeRuntime}::${activeModel}` : null;

  const setProviderState = (id: string, patch: Partial<ProviderState>) =>
    setProviderStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleConnect = async (provider: CloudProviderDef) => {
    const key = apiKeys[provider.id] ?? '';
    const ollamaUrl = provider.id === 'ollama' ? ollama.url : undefined;

    setProviderState(provider.id, { status: 'validating', error: undefined });

    const result = await validateProvider(provider.id as CloudProviderId, key, ollamaUrl);
    setProviderState(provider.id, { status: result.status, error: result.error });

    if (result.ok) {
      if (provider.needsKey) storeKey(provider.id as CloudProviderId, key);
      if (provider.id === 'ollama') {
        setOllamaUrl(ollama.url);
        setOllamaModel(ollama.model);
      }

      const modelId = provider.id === 'ollama' ? ollama.model : selectedModelId[provider.id as CloudProviderId];
      const modelDef = provider.models.find(m => m.id === modelId);
      const displayName = modelDef?.name ?? modelId;
      const ollamaUrlFinal = ollama.url;

      activateCloud(provider.name, displayName, async (history) =>
        cloudInfer(provider.id as CloudProviderId, modelId, key, history, ollamaUrlFinal),
      );
    }
  };

  const handleDisconnect = (provider: CloudProviderDef) => {
    setProviderState(provider.id, { status: 'not-connected', error: undefined });
    clearKey(provider.id as CloudProviderId);
    if (aiMode === 'cloud' && activeRuntime === provider.name) deactivate();
  };

  const handleFetchOllamaModels = async () => {
    setOllama(prev => ({ ...prev, fetchingModels: true, availableModels: [] }));
    const models = await fetchOllamaModels(ollama.url);
    setOllama(prev => ({ ...prev, fetchingModels: false, availableModels: models }));
  };

  const prov = CLOUD_PROVIDERS.find(p => p.id === selectedProvider)!;
  const provState = providerStates[selectedProvider] ?? { status: 'not-connected' };
  const isConnected = provState.status === 'connected';
  const isValidating = provState.status === 'validating';

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl border-l border-gray-200 z-[300] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-blue-600" />
          <div>
            <span className="font-bold text-gray-900 text-sm">Cloud AI</span>
            <div className="text-[10px] text-gray-500">Connect a real API provider</div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active connection banner */}
      {aiMode === 'cloud' && (
        <div className="mx-4 mt-3 mb-1 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-green-800">Active: </span>
              <span className="text-green-700">{activeRuntime}</span>
              <span className="text-green-500 ml-1">· {activeModel} · Connected</span>
            </div>
          </div>
          <button onClick={deactivate} className="text-[10px] text-green-600 hover:text-red-600 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
            Disconnect
          </button>
        </div>
      )}

      {/* Provider tabs */}
      <div className="flex px-4 pt-3 gap-1 flex-shrink-0">
        {CLOUD_PROVIDERS.map(p => {
          const st = providerStates[p.id]?.status ?? 'not-connected';
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProvider(p.id as CloudProviderId)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all relative ${
                selectedProvider === p.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
              }`}>
              {p.name.split(' ')[0]}
              {st === 'connected' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Provider details */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4 space-y-4">

        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {provState.status === 'connected' ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : provState.status === 'validating' ? (
              <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            ) : (
              <WifiOff className="w-4 h-4 text-gray-300" />
            )}
            <span className={`text-sm ${STATUS_COLOR[provState.status]}`}>
              {STATUS_LABEL[provState.status]}
            </span>
            {provState.error && (
              <span className="text-xs text-red-400">— {provState.error}</span>
            )}
          </div>
          <a href={prov.docsUrl} target="_blank" rel="noreferrer"
            className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5">
            Get key <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>

        {/* Model selector (non-Ollama) */}
        {prov.id !== 'ollama' && prov.models.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600">Model</label>
            <div className="space-y-1.5">
              {prov.models.map(model => (
                <label
                  key={model.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedModelId[prov.id as CloudProviderId] === model.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-200'
                  }`}>
                  <input
                    type="radio"
                    name={`model-${prov.id}`}
                    value={model.id}
                    checked={selectedModelId[prov.id as CloudProviderId] === model.id}
                    onChange={() => setSelectedModelId(prev => ({ ...prev, [prov.id]: model.id }))}
                    className="mt-0.5 accent-blue-600 flex-shrink-0"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{model.name}</div>
                    <div className="text-[11px] text-gray-500 leading-relaxed">{model.recommendedUse}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* API key input (non-Ollama) */}
        {prov.needsKey && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-600 flex items-center gap-1">
              <Key className="w-3 h-3" /> API Key
            </label>
            <div className="relative">
              <input
                type={showKeys[prov.id] ? 'text' : 'password'}
                value={apiKeys[prov.id] ?? ''}
                onChange={e => setApiKeys(prev => ({ ...prev, [prov.id]: e.target.value }))}
                placeholder={prov.keyPlaceholder}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono bg-gray-50"
              />
              <button
                type="button"
                onClick={() => setShowKeys(prev => ({ ...prev, [prov.id]: !prev[prov.id] }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showKeys[prov.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
              Stored in browser localStorage · session-persistent · not encrypted
            </p>
          </div>
        )}

        {/* Ollama-specific */}
        {prov.id === 'ollama' && (
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 text-xs text-blue-800 space-y-1.5">
              <p className="font-semibold">Run Ollama on your machine — no API key needed</p>
              <ol className="list-decimal ml-4 space-y-0.5 text-blue-700">
                <li>Download &amp; install Ollama from ollama.com</li>
                <li>Pull a model: <code className="bg-blue-100 px-1 rounded">ollama pull llama3.2</code></li>
                <li>Allow browser access: <code className="bg-blue-100 px-1 rounded">OLLAMA_ORIGINS=* ollama serve</code></li>
              </ol>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Ollama URL</label>
              <input
                value={ollama.url}
                onChange={e => setOllama(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono bg-gray-50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Model</label>
              <div className="flex gap-2">
                {ollama.availableModels.length > 0 ? (
                  <select
                    value={ollama.model}
                    onChange={e => setOllama(prev => ({ ...prev, model: e.target.value }))}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50">
                    {ollama.availableModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    value={ollama.model}
                    onChange={e => setOllama(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="llama3.2"
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono bg-gray-50"
                  />
                )}
                <button onClick={handleFetchOllamaModels} disabled={ollama.fetchingModels}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 disabled:opacity-50 transition-colors"
                  title="Fetch available models">
                  <RefreshCw className={`w-4 h-4 ${ollama.fetchingModels ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {ollama.availableModels.length === 0 && (
                <p className="text-[10px] text-gray-400">Click ↻ to fetch available models from Ollama</p>
              )}
            </div>
          </div>
        )}

        {/* Connect / Disconnect */}
        <div className="flex gap-2 pt-1">
          {!isConnected ? (
            <button
              onClick={() => handleConnect(prov)}
              disabled={isValidating || (prov.needsKey && !(apiKeys[prov.id]?.length > 8))}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
              {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              {isValidating ? 'Validating…' : 'Connect'}
            </button>
          ) : (
            <button onClick={() => handleDisconnect(prov)}
              className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" /> Disconnect
            </button>
          )}
        </div>

        {/* All providers summary */}
        <div className="border border-gray-100 rounded-xl overflow-hidden mt-2">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All Providers</span>
          </div>
          {CLOUD_PROVIDERS.map(p => {
            const st = providerStates[p.id]?.status ?? 'not-connected';
            return (
              <button key={p.id} onClick={() => setSelectedProvider(p.id as CloudProviderId)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${selectedProvider === p.id ? 'bg-blue-50' : ''}`}>
                <span className="text-xs font-medium text-gray-700">{p.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] ${STATUS_COLOR[st]}`}>{STATUS_LABEL[st]}</span>
                  {st === 'connected' && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
