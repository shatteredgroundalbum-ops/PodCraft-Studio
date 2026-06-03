import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu, Cloud, Sparkles, List, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, AlertCircle, Download, Trash2,
  Loader2, Eye, EyeOff, HardDrive, Zap, RefreshCw,
  ExternalLink, Check, Info, WifiOff, Wifi, Monitor,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import {
  AIModelProvider, useAIModel,
  AI_MODULES, AIModuleId, ModuleAssignment,
} from '../store/AIModelStore';
import { PROVIDER_DEFS, ProviderStatus, fetchOllamaModelList } from '../utils/multiAI';
import {
  LOCAL_MODELS, LocalModelConfig,
  checkWebGPU, checkStorage, getInstalledModelIds,
  loadLocalModel, deleteLocalModel, formatBytes,
} from '../utils/localAI';

/* ── Section types ─────────────────────────────────────────────── */
type Section = 'llm' | 'cloud' | 'pipeline' | 'assignments';
type PipelineMode = 'local' | 'cloud' | 'hybrid';

/* ── Status display maps ───────────────────────────────────────── */
const STATUS_LABEL: Record<ProviderStatus, string> = {
  'not-connected': 'Not Connected', 'validating': 'Validating…',
  'connected': 'Connected', 'invalid-key': 'Invalid Key',
  'connection-failed': 'Connection Failed', 'missing-key': 'Missing Key',
  'unsupported': 'Unsupported',
};
const STATUS_COLOR: Record<ProviderStatus, string> = {
  'not-connected': 'text-gray-400', 'validating': 'text-blue-500 animate-pulse',
  'connected': 'text-green-600 font-semibold', 'invalid-key': 'text-red-500',
  'connection-failed': 'text-red-400', 'missing-key': 'text-orange-500',
  'unsupported': 'text-gray-400',
};

/* ── Exports ───────────────────────────────────────────────────── */
export function AISettings() {
  return (
    <AIModelProvider>
      <AISettingsInner />
    </AIModelProvider>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Inner page (has access to AIModel context)
══════════════════════════════════════════════════════════════════ */
function AISettingsInner() {
  const [params] = useSearchParams();
  const initial = (params.get('tab') as Section | null) ?? 'llm';
  const [section, setSection] = useState<Section>(initial);

  const nav = [
    { id: 'llm',         label: 'LLM',                 icon: Cpu      },
    { id: 'cloud',       label: 'Cloud',                icon: Cloud    },
    { id: 'pipeline',    label: 'Recommended Pipeline', icon: Sparkles },
    { id: 'assignments', label: 'Assignments',          icon: List     },
  ] as const;

  return (
    <AppLayout title="AI Configuration">
      <div className="flex gap-5 min-h-[600px]">
        {/* Left nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-0">
            {nav.map(({ id, label, icon: Icon }) => {
              const active = section === id;
              return (
                <button key={id} onClick={() => setSection(id as Section)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-left border-b border-gray-100 last:border-b-0 transition-colors ${
                    active ? 'bg-violet-50 text-violet-700 border-l-2 border-l-violet-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-violet-600' : 'text-gray-400'}`} />
                  <span className="leading-tight">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {section === 'llm'         && <LLMSection />}
          {section === 'cloud'       && <CloudSection />}
          {section === 'pipeline'    && <PipelineSection />}
          {section === 'assignments' && <AssignmentsSection />}
        </div>
      </div>
    </AppLayout>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LLM Section — local models
══════════════════════════════════════════════════════════════════ */
type LocalModelStatus = 'checking' | 'not-installed' | 'installed' | 'loading' | 'ready' | 'failed' | 'unsupported';
interface LocalModelState { status: LocalModelStatus; progress: number; error?: string; }

const CATEGORY_LABELS: Record<string, string> = {
  'small-fast': 'Small / Fast', 'balanced': 'Balanced',
  'higher-quality': 'Higher Quality', 'experimental': 'Experimental',
};

function LLMSection() {
  const { loadedLocalModelIds, registerLocalPipeline, unregisterLocalPipeline, assignModule } = useAIModel();

  const [hasWebGPU, setHasWebGPU]       = useState<boolean | null>(null);
  const [deviceMemory, setDeviceMemory] = useState<number | null>(null);
  const [storage, setStorage]           = useState<{ quota: number; usage: number; available: number } | null>(null);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [modelStates, setModelStates]   = useState<Record<string, LocalModelState>>({});
  const [assignTarget, setAssignTarget] = useState<string | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    cancelRef.current = false;
    checkWebGPU().then(setHasWebGPU);
    checkStorage().then(setStorage);
    const ids = getInstalledModelIds();
    setInstalledIds(ids);
    setDeviceMemory((navigator as any).deviceMemory ?? null);
    const initial: Record<string, LocalModelState> = {};
    LOCAL_MODELS.forEach(m => {
      if (loadedLocalModelIds.includes(m.id)) {
        initial[m.id] = { status: 'ready', progress: 100 };
      } else if (ids.includes(m.id)) {
        initial[m.id] = { status: 'installed', progress: 100 };
      } else {
        initial[m.id] = { status: 'not-installed', progress: 0 };
      }
    });
    setModelStates(initial);
    return () => { cancelRef.current = true; };
  }, []);

  const setMs = (id: string, patch: Partial<LocalModelState>) =>
    setModelStates(p => ({ ...p, [id]: { ...p[id], ...patch } }));

  const handleLoad = async (model: LocalModelConfig) => {
    if (model.requiresWebGPU && !hasWebGPU) return;
    setMs(model.id, { status: 'loading', progress: 0 });
    try {
      const pipe = await loadLocalModel(model, (info) => {
        if (cancelRef.current) return;
        const pct = info.progress !== undefined ? Math.round(info.progress) : (info.status === 'done' ? 100 : 0);
        setMs(model.id, { status: 'loading', progress: pct });
      }, !!hasWebGPU);
      if (!cancelRef.current) {
        registerLocalPipeline(model.id, pipe, model.name);
        setInstalledIds(getInstalledModelIds());
        setMs(model.id, { status: 'ready', progress: 100 });
      }
    } catch (e: any) {
      if (!cancelRef.current) setMs(model.id, { status: 'failed', progress: 0, error: e?.message ?? 'Load failed' });
    }
  };

  const handleRemove = async (model: LocalModelConfig) => {
    unregisterLocalPipeline(model.id);
    await deleteLocalModel(model.id);
    setInstalledIds(getInstalledModelIds());
    setMs(model.id, { status: 'not-installed', progress: 0 });
  };

  const handleAssign = (modelId: string, modelName: string, moduleId: string) => {
    assignModule(moduleId, { providerId: 'local', modelId, providerName: 'Local AI', modelName, isLocal: true });
    setAssignTarget(null);
  };

  const storageAvailableMb = storage ? Math.round(storage.available / 1024 / 1024) : null;

  const categories = [...new Set(LOCAL_MODELS.map(m => m.category))];

  return (
    <div className="space-y-5">
      {/* Device capability card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Monitor className="w-4 h-4 text-gray-400" /> Device Capability
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CapCell label="WebGPU"
            value={hasWebGPU === null ? 'Checking…' : hasWebGPU ? 'Available' : 'Unavailable'}
            ok={hasWebGPU === true} na={hasWebGPU === null} />
          <CapCell label="RAM (est.)"
            value={deviceMemory !== null ? `≥ ${deviceMemory} GB` : 'Unknown'}
            ok={deviceMemory !== null && deviceMemory >= 4} na={deviceMemory === null} />
          <CapCell label="Storage Free"
            value={storageAvailableMb !== null ? formatBytes(storage!.available) : 'Checking…'}
            ok={storageAvailableMb !== null && storageAvailableMb > 500} na={storageAvailableMb === null} />
          <CapCell label="Browser"
            value={typeof window !== 'undefined' ? (window.crossOriginIsolated ? 'Isolated ✓' : 'Standard') : '—'}
            ok={typeof window !== 'undefined' && window.crossOriginIsolated} na={false} />
        </div>
        {hasWebGPU === false && (
          <p className="text-xs text-amber-600 mt-3 bg-amber-50 rounded-lg px-3 py-2">
            WebGPU is not available — models marked "WebGPU" cannot run. CPU-only models will still work.
          </p>
        )}
      </div>

      {/* Model list by category */}
      {categories.map(cat => {
        const models = LOCAL_MODELS.filter(m => m.category === cat);
        return (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {CATEGORY_LABELS[cat]}
              </span>
            </div>
            <div className="divide-y divide-gray-100">
              {models.map(model => {
                const ms = modelStates[model.id] ?? { status: 'checking', progress: 0 };
                const incompatible = model.requiresWebGPU && hasWebGPU === false;
                const storageTight = storageAvailableMb !== null && storageAvailableMb < model.sizeBytes / 1024 / 1024;
                const isLoaded = ms.status === 'ready';
                const isLoading = ms.status === 'loading';

                return (
                  <div key={model.id} className={`px-5 py-4 flex items-start gap-4 ${incompatible ? 'opacity-50' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{model.name}</span>
                        <span className="text-xs text-gray-400">{model.sizeLabel}</span>
                        {model.requiresWebGPU && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${hasWebGPU ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                            WebGPU
                          </span>
                        )}
                        {isLoaded && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Loaded
                          </span>
                        )}
                        {incompatible && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-red-50 text-red-500">Unsupported</span>}
                        {storageTight && !incompatible && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-50 text-amber-600">Low Storage</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{model.recommendedUse}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Requires: {model.sizeLabel} storage · {model.requiresWebGPU ? 'WebGPU required' : 'CPU/WASM compatible'}
                      </p>

                      {isLoading && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                            <span>Loading…</span><span>{ms.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                            <div className="h-full bg-violet-500 rounded-full transition-all duration-200" style={{ width: `${ms.progress}%` }} />
                          </div>
                        </div>
                      )}
                      {ms.status === 'failed' && (
                        <p className="text-xs text-red-500 mt-1">{ms.error}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Load / Download */}
                      {!incompatible && !isLoading && ms.status !== 'ready' && (
                        <button onClick={() => handleLoad(model)}
                          disabled={storageTight}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                          {ms.status === 'installed' ? <><Zap className="w-3 h-3" /> Load</> : <><Download className="w-3 h-3" /> {ms.status === 'not-installed' ? 'Download & Load' : 'Retry'}</>}
                        </button>
                      )}
                      {isLoading && (
                        <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                      )}

                      {/* Assign */}
                      {isLoaded && (
                        <div className="relative">
                          <button onClick={() => setAssignTarget(assignTarget === model.id ? null : model.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-700 border border-violet-300 rounded-lg hover:bg-violet-50">
                            Assign <ChevronDown className="w-3 h-3" />
                          </button>
                          {assignTarget === model.id && (
                            <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
                              {AI_MODULES.map(mod => (
                                <button key={mod.id} onClick={() => handleAssign(model.id, model.name, mod.id)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 text-gray-700">
                                  {mod.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Remove */}
                      {(ms.status === 'installed' || ms.status === 'ready') && (
                        <button onClick={() => handleRemove(model)} title="Remove model"
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="text-xs text-gray-400 flex items-start gap-1.5 bg-gray-50 rounded-xl p-3">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>Local models are downloaded once and cached in your browser. They run entirely on your device — no data leaves your machine. "Ready" status appears only after a model successfully loads through the runtime.</span>
      </div>
    </div>
  );
}

function CapCell({ label, value, ok, na }: { label: string; value: string; ok: boolean; na: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${na ? 'bg-gray-50 border-gray-200' : ok ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
      <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide mb-0.5">{label}</div>
      <div className={`text-sm font-semibold ${na ? 'text-gray-400' : ok ? 'text-green-700' : 'text-amber-700'}`}>{value}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Cloud Section — provider connections
══════════════════════════════════════════════════════════════════ */
function CloudSection() {
  const { providerStates, connectProvider, disconnectProvider, assignModule } = useAIModel();
  const [expanded,     setExpanded]     = useState<Record<string, boolean>>({});
  const [keyInput,     setKeyInput]     = useState<Record<string, string>>({});
  const [extraInput,   setExtraInput]   = useState<Record<string, Record<string, string>>>({});
  const [showKey,      setShowKey]      = useState<Record<string, boolean>>({});
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [assignOpen,   setAssignOpen]   = useState<string | null>(null); // `${providerId}::${modelId}`

  const handleConnect = async (providerId: string, key: string, extra?: Record<string, string>) => {
    await connectProvider(providerId, key, extra);
  };

  const toggleExpand = async (def: typeof PROVIDER_DEFS[0]) => {
    const next = !expanded[def.id];
    setExpanded(p => ({ ...p, [def.id]: next }));
    if (next && def.id === 'ollama' && ollamaModels.length === 0) {
      const list = await fetchOllamaModelList(extraInput['ollama']?.ollamaUrl ?? 'http://localhost:11434');
      setOllamaModels(list);
    }
  };

  const handleAssignModel = (providerId: string, providerName: string, modelId: string, modelName: string, moduleId: string) => {
    assignModule(moduleId, { providerId, modelId, providerName, modelName, isLocal: false });
    setAssignOpen(null);
  };

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Connect cloud AI providers. API keys are stored locally on your device only. Each connection is validated with a real API call before status is marked Connected.
          </p>
        </div>

        {PROVIDER_DEFS.map(def => {
          const ps = providerStates[def.id];
          const status: ProviderStatus = ps?.status ?? 'not-connected';
          const isConnected = status === 'connected';
          const isValidating = status === 'validating';
          const isOpen = !!expanded[def.id];
          const savedKey = ps?.apiKey ?? '';
          const currentKey = keyInput[def.id] ?? savedKey;
          const currentExtra = extraInput[def.id] ?? {};

          return (
            <div key={def.id} className="border-b border-gray-100 last:border-b-0">
              {/* Provider row */}
              <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer" onClick={() => !def.id.includes('unsupported') && toggleExpand(def)}>
                <button className="text-gray-400 flex-shrink-0" aria-label="toggle">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{def.name}</span>
                    {!def.browserCompatible && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-gray-100 text-gray-500">Proxy Required</span>
                    )}
                    <span className={`text-xs ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{def.recommendedFor}</p>
                </div>
                {isConnected && (
                  <button onClick={e => { e.stopPropagation(); disconnectProvider(def.id); }}
                    className="px-2.5 py-1 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex-shrink-0">
                    Disconnect
                  </button>
                )}
              </div>

              {/* Expanded: key input + models */}
              {isOpen && (
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 space-y-4">
                  {!def.browserCompatible ? (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold mb-0.5">{def.unsupportedNote ?? 'Cannot connect from browser'}</div>
                        <div>This provider requires a server-side proxy. A browser client cannot authenticate directly.</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* API key field */}
                      {def.needsKey && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">API Key</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type={showKey[def.id] ? 'text' : 'password'}
                                value={currentKey}
                                onChange={e => setKeyInput(p => ({ ...p, [def.id]: e.target.value }))}
                                placeholder={def.keyPlaceholder}
                                className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-violet-400 bg-white"
                              />
                              <button type="button" onClick={() => setShowKey(p => ({ ...p, [def.id]: !p[def.id] }))}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showKey[def.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                            <a href={def.docsUrl} target="_blank" rel="noreferrer"
                              className="flex items-center gap-1 px-2.5 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-white">
                              <ExternalLink className="w-3 h-3" /> Get key
                            </a>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">{def.keyHint}</p>
                        </div>
                      )}

                      {/* Extra fields (e.g. Ollama URL) */}
                      {def.extraFields?.map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                          <input
                            type="text"
                            value={currentExtra[f.key] ?? f.defaultValue}
                            onChange={e => setExtraInput(p => ({ ...p, [def.id]: { ...p[def.id], [f.key]: e.target.value } }))}
                            placeholder={f.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-violet-400 bg-white"
                          />
                        </div>
                      ))}

                      {/* Connect button */}
                      {!isConnected && (
                        <button
                          onClick={() => handleConnect(def.id, currentKey, Object.keys(currentExtra).length ? currentExtra : undefined)}
                          disabled={isValidating || (def.needsKey && !currentKey.trim())}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                          {isValidating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</> : <><Wifi className="w-4 h-4" /> Connect</>}
                        </button>
                      )}

                      {/* Error message */}
                      {(status === 'invalid-key' || status === 'connection-failed') && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          {status === 'invalid-key' ? 'API key is invalid or expired. Please check and try again.' : 'Could not reach this provider. Check your network and try again.'}
                        </div>
                      )}

                      {/* Connected: model list */}
                      {isConnected && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">Available Models</div>
                          <div className="space-y-1">
                            {(def.id === 'ollama' ? ollamaModels.map(m => ({ id: m, name: m, recommendedModules: [] })) : def.models).map(model => {
                              const key = `${def.id}::${model.id}`;
                              return (
                                <div key={model.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                                  <div>
                                    <span className="text-sm font-medium text-gray-900">{model.name}</span>
                                    {model.recommendedModules?.length > 0 && (
                                      <span className="text-[10px] text-gray-400 ml-2">{model.recommendedModules.slice(0, 3).join(', ')}</span>
                                    )}
                                  </div>
                                  <div className="relative">
                                    <button onClick={() => setAssignOpen(assignOpen === key ? null : key)}
                                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50">
                                      Assign <ChevronDown className="w-3 h-3" />
                                    </button>
                                    {assignOpen === key && (
                                      <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-y-auto">
                                        {AI_MODULES.map(mod => (
                                          <button key={mod.id} onClick={() => handleAssignModel(def.id, def.name, model.id, model.name, mod.id)}
                                            className="w-full text-left px-3 py-2 text-xs hover:bg-violet-50 text-gray-700">
                                            {mod.label}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                            {def.id === 'ollama' && ollamaModels.length === 0 && (
                              <p className="text-xs text-gray-400 py-2">No Ollama models found at the configured URL.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Pipeline Section — recommendations
══════════════════════════════════════════════════════════════════ */
const HIGH_INTELLIGENCE = new Set(['ai-producer', 'script-writer', 'search-research', 'storyboard', 'pipeline']);
const CLOUD_PREF: Record<string, string[]> = {
  'ai-producer':        ['openai', 'anthropic', 'google', 'groq', 'mistral', 'deepseek', 'xai'],
  'script-writer':      ['anthropic', 'openai', 'google', 'groq', 'mistral'],
  'search-research':    ['openai', 'google', 'anthropic', 'groq'],
  'storyboard':         ['anthropic', 'openai', 'google'],
  'pipeline':           ['openai', 'google', 'anthropic', 'groq'],
  'transcript':         ['openai', 'groq', 'anthropic', 'google'],
  'metadata-generator': ['openai', 'groq', 'anthropic', 'mistral'],
  'chat':               ['openai', 'anthropic', 'groq', 'google'],
  'audio-assistant':    ['openai', 'anthropic', 'google'],
  'global-default':     ['openai', 'anthropic', 'google', 'groq'],
};
const LOCAL_QUALITY = [
  'onnx-community/Qwen2.5-3B-Instruct-q4f16',
  'onnx-community/DeepSeek-R1-Distill-Qwen-1.5B',
  'onnx-community/Llama-3.2-1B-Instruct-q4f16',
  'onnx-community/Qwen2.5-1.5B-Instruct-q4f16',
  'onnx-community/Qwen2.5-0.5B-Instruct',
  'HuggingFaceTB/SmolLM2-360M-Instruct',
  'HuggingFaceTB/SmolLM2-135M-Instruct',
];

interface Rec { assignment: ModuleAssignment | null; note: string; status: 'ready' | 'requires-setup'; setupMsg?: string; }

function buildRecs(
  mode: PipelineMode,
  providerStates: Record<string, any>,
  loadedIds: string[],
): Record<AIModuleId, Rec> {
  const result: Record<string, Rec> = {};
  const connectedProviders = PROVIDER_DEFS.filter(d => providerStates[d.id]?.status === 'connected');
  const bestLocal = LOCAL_QUALITY.find(id => loadedIds.includes(id)) ?? null;
  const bestLocalMeta = bestLocal ? LOCAL_MODELS.find(m => m.id === bestLocal) : null;

  for (const mod of AI_MODULES) {
    const isHigh = HIGH_INTELLIGENCE.has(mod.id);
    let rec: Rec;

    if (mode === 'local') {
      if (bestLocal && bestLocalMeta) {
        rec = { assignment: { providerId: 'local', modelId: bestLocal, providerName: 'Local AI', modelName: bestLocalMeta.name, isLocal: true }, note: `Local: ${bestLocalMeta.name}`, status: 'ready' };
      } else {
        rec = { assignment: null, note: 'No local model loaded', status: 'requires-setup', setupMsg: 'Requires Download & Load' };
      }
    } else if (mode === 'cloud') {
      const pref = CLOUD_PREF[mod.id] ?? ['openai'];
      const provider = connectedProviders.find(p => pref.includes(p.id));
      if (provider) {
        const model = provider.models[0];
        rec = { assignment: { providerId: provider.id, modelId: model.id, providerName: provider.name, modelName: model.name, isLocal: false }, note: `${provider.name} / ${model.name}`, status: 'ready' };
      } else {
        const preferredId = pref[0];
        const preferred = PROVIDER_DEFS.find(p => p.id === preferredId);
        rec = { assignment: null, note: preferred ? `${preferred.name} recommended` : 'No cloud provider connected', status: 'requires-setup', setupMsg: `Requires Connection` };
      }
    } else {
      // hybrid: high intelligence → cloud, low → local
      if (isHigh) {
        const pref = CLOUD_PREF[mod.id] ?? ['openai'];
        const provider = connectedProviders.find(p => pref.includes(p.id));
        if (provider) {
          const model = provider.models[0];
          rec = { assignment: { providerId: provider.id, modelId: model.id, providerName: provider.name, modelName: model.name, isLocal: false }, note: `${provider.name} / ${model.name}`, status: 'ready' };
        } else if (bestLocal && bestLocalMeta) {
          rec = { assignment: { providerId: 'local', modelId: bestLocal, providerName: 'Local AI', modelName: bestLocalMeta.name, isLocal: true }, note: `Local fallback: ${bestLocalMeta.name}`, status: 'ready' };
        } else {
          const pName = PROVIDER_DEFS.find(p => p.id === (CLOUD_PREF[mod.id]?.[0] ?? 'openai'))?.name ?? 'Cloud';
          rec = { assignment: null, note: `${pName} recommended`, status: 'requires-setup', setupMsg: 'Requires Connection or Download' };
        }
      } else {
        if (bestLocal && bestLocalMeta) {
          rec = { assignment: { providerId: 'local', modelId: bestLocal, providerName: 'Local AI', modelName: bestLocalMeta.name, isLocal: true }, note: `Local: ${bestLocalMeta.name}`, status: 'ready' };
        } else {
          const pref = CLOUD_PREF[mod.id] ?? ['openai'];
          const provider = connectedProviders.find(p => pref.includes(p.id));
          if (provider) {
            const model = provider.models[0];
            rec = { assignment: { providerId: provider.id, modelId: model.id, providerName: provider.name, modelName: model.name, isLocal: false }, note: `Cloud fallback: ${provider.name}`, status: 'ready' };
          } else {
            rec = { assignment: null, note: 'No local model loaded', status: 'requires-setup', setupMsg: 'Requires Download or Connection' };
          }
        }
      }
    }

    result[mod.id as AIModuleId] = rec;
  }
  return result as Record<AIModuleId, Rec>;
}

function PipelineSection() {
  const { providerStates, loadedLocalModelIds, assignModule } = useAIModel();
  const [mode, setMode] = useState<PipelineMode>('hybrid');
  const [applied, setApplied] = useState(false);

  const recs = buildRecs(mode, providerStates, loadedLocalModelIds);
  const readyCount = Object.values(recs).filter(r => r.status === 'ready').length;

  const applyAll = () => {
    for (const [moduleId, rec] of Object.entries(recs)) {
      if (rec.assignment) assignModule(moduleId, rec.assignment);
    }
    setApplied(true);
    setTimeout(() => setApplied(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Mode selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Pipeline Mode</h3>
        <p className="text-xs text-gray-500 mb-4">Choose how AI modules are powered across the app.</p>
        <div className="flex gap-2">
          {([['local', 'Local Only', 'Runs entirely on your device'], ['hybrid', 'Hybrid', 'Cloud for complex tasks, Local for simple ones'], ['cloud', 'Cloud Only', 'All modules routed to cloud providers']] as const).map(([id, label, desc]) => (
            <button key={id} onClick={() => { setMode(id); setApplied(false); }}
              className={`flex-1 px-3 py-3 rounded-xl border-2 text-left transition-all ${mode === id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <div className={`text-sm font-semibold ${mode === id ? 'text-violet-700' : 'text-gray-700'}`}>{label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div>
            <span className="text-sm font-bold text-gray-900">Module Recommendations</span>
            <span className="ml-2 text-xs text-gray-400">{readyCount}/{AI_MODULES.length} ready</span>
          </div>
          <button onClick={applyAll}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${applied ? 'bg-green-100 text-green-700' : 'bg-violet-600 text-white hover:bg-violet-700'}`}>
            {applied ? <><Check className="w-4 h-4" /> Applied!</> : <><Sparkles className="w-4 h-4" /> Apply Recommendations</>}
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {AI_MODULES.map(mod => {
            const rec = recs[mod.id as AIModuleId];
            return (
              <div key={mod.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-44 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">{mod.label}</div>
                  <div className="text-[10px] text-gray-400">{mod.description}</div>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium ${rec.status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {rec.status === 'ready' ? <><CheckCircle2 className="w-3 h-3" />{rec.note}</> : <><AlertTriangle className="w-3 h-3" />{rec.setupMsg}</>}
                  </span>
                  {rec.status === 'requires-setup' && rec.note !== rec.setupMsg && (
                    <span className="text-[10px] text-gray-400">{rec.note}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Recommendations are based on your connected providers and loaded local models. Only available options are shown — no fake readiness. Apply assigns all ready modules; modules marked "Requires Setup" are skipped.
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Assignments Section — per-module control
══════════════════════════════════════════════════════════════════ */
function AssignmentsSection() {
  const { providerStates, loadedLocalModelIds, assignments, assignModule, unassignModule } = useAIModel();

  const connectedProviders = PROVIDER_DEFS.filter(d => providerStates[d.id]?.status === 'connected');
  const loadedLocalModels = LOCAL_MODELS.filter(m => loadedLocalModelIds.includes(m.id));
  const hasAny = connectedProviders.length > 0 || loadedLocalModels.length > 0;

  return (
    <div className="space-y-5">
      {!hasAny && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          No AI providers connected and no local models loaded. Connect a provider in Cloud or load a model in LLM first.
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-500">
            Each module can have its own AI model. Unassigned modules fall back to Global Default.
            Multiple providers can be active simultaneously.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {AI_MODULES.map(mod => {
            const a = assignments[mod.id];
            const isGlobal = mod.id === 'global-default';

            return (
              <div key={mod.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-44 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">{mod.label}</div>
                  <div className="text-[10px] text-gray-400">{mod.description}</div>
                </div>
                <div className="flex-1">
                  <select
                    value={a ? `${a.providerId}::${a.modelId}` : '__default__'}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '__default__') { unassignModule(mod.id); return; }
                      const [pId, mId] = val.split('::');
                      if (pId === 'local') {
                        const m = LOCAL_MODELS.find(x => x.id === mId);
                        if (m) assignModule(mod.id, { providerId: 'local', modelId: mId, providerName: 'Local AI', modelName: m.name, isLocal: true });
                      } else {
                        const def = PROVIDER_DEFS.find(d => d.id === pId);
                        const model = def?.models.find(m => m.id === mId) ?? def?.models[0];
                        if (def && model) assignModule(mod.id, { providerId: pId, modelId: model.id, providerName: def.name, modelName: model.name, isLocal: false });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-violet-400 bg-white"
                  >
                    {!isGlobal && <option value="__default__">— Use Global Default —</option>}
                    {isGlobal && <option value="__default__">— Not Configured —</option>}

                    {loadedLocalModels.length > 0 && (
                      <optgroup label="Local AI">
                        {loadedLocalModels.map(m => (
                          <option key={m.id} value={`local::${m.id}`}>{m.name}</option>
                        ))}
                      </optgroup>
                    )}

                    {connectedProviders.map(def => (
                      <optgroup key={def.id} label={def.name}>
                        {def.models.map(m => (
                          <option key={m.id} value={`${def.id}::${m.id}`}>{m.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {a && (
                  <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    {a.isLocal ? 'Local' : a.providerName}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
