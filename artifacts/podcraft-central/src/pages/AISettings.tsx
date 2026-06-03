import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Cpu, Cloud, Sparkles, List, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, AlertCircle, Download, Trash2,
  Loader2, Eye, EyeOff, HardDrive, Zap, RefreshCw,
  ExternalLink, Check, Info, WifiOff, Wifi, Monitor, ArrowLeft, Smartphone,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import {
  AIModelProvider, useAIModel,
  AI_MODULES, AIModuleId, ModuleAssignment,
} from '../store/AIModelStore';
import { PROVIDER_DEFS, ProviderDef, ProviderStatus, fetchOllamaModelList } from '../utils/multiAI';
import {
  LOCAL_MODELS, LocalModelConfig,
  checkWebGPU, checkStorage, getInstalledModelIds,
  loadLocalModel, deleteLocalModel, formatBytes, testLocalModelInference,
} from '../utils/localAI';

/* ── Device detection ──────────────────────────────────────────── */
function useIsMobile(): boolean {
  const detect = () => {
    if (typeof window === 'undefined') return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth < 1024 && 'ontouchstart' in window)
    );
  };
  const [isMobile, setIsMobile] = useState(detect);
  useEffect(() => {
    const onResize = () => setIsMobile(detect());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

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
  const isMobile = useIsMobile();

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
      {isMobile && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <div className="text-sm font-bold text-amber-800 mb-1">Desktop / Laptop Only</div>
            <p className="text-xs text-amber-700">Local AI models require significant CPU, RAM, and storage — they cannot run on phones or tablets. Use the Cloud tab to connect a free or paid cloud provider instead.</p>
          </div>
        </div>
      )}

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
                      {!incompatible && !isLoading && ms.status !== 'ready' && !isMobile && (
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
const FREE_CLOUD_IDS = ['groq', 'google', 'openrouter'];

function CloudSection() {
  const { providerStates, connectProvider, disconnectProvider, assignModule } = useAIModel();
  const [expanded,     setExpanded]     = useState<Record<string, boolean>>({});
  const [keyInput,     setKeyInput]     = useState<Record<string, string>>({});
  const [extraInput,   setExtraInput]   = useState<Record<string, Record<string, string>>>({});
  const [showKey,      setShowKey]      = useState<Record<string, boolean>>({});
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [assignOpen,   setAssignOpen]   = useState<string | null>(null);

  const handleConnect = async (providerId: string, key: string, extra?: Record<string, string>) => {
    await connectProvider(providerId, key, extra);
  };

  const toggleExpand = async (def: ProviderDef) => {
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

  const renderProviderRow = (def: ProviderDef) => {
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
        <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer" onClick={() => toggleExpand(def)}>
          <button className="text-gray-400 flex-shrink-0" aria-label="toggle">
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{def.name}</span>
              {!def.browserCompatible && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-gray-100 text-gray-500">Proxy Required</span>
              )}
              {def.freeTier && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-100 text-emerald-700">Free tier</span>
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
                {def.freeTier && (
                  <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold mb-0.5">{def.freeTier.label}</div>
                      {def.freeTier.rateLimit && <div className="text-emerald-600 mt-0.5">{def.freeTier.rateLimit}</div>}
                      <div className="text-emerald-500 mt-0.5">Free does not mean unlimited — rate limits apply.</div>
                    </div>
                  </div>
                )}
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
                        className="flex items-center gap-1 px-2.5 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-white flex-shrink-0">
                        <ExternalLink className="w-3 h-3" /> Get key
                      </a>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{def.keyHint}</p>
                  </div>
                )}
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
                {!isConnected && (
                  <button
                    onClick={() => handleConnect(def.id, currentKey, Object.keys(currentExtra).length ? currentExtra : undefined)}
                    disabled={isValidating || (def.needsKey && !currentKey.trim())}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                    {isValidating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</> : <><Wifi className="w-4 h-4" /> Connect</>}
                  </button>
                )}
                {(status === 'invalid-key' || status === 'connection-failed') && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    {status === 'invalid-key' ? 'API key is invalid or expired. Please check and try again.' : 'Could not reach this provider. Check your network and try again.'}
                  </div>
                )}
                {isConnected && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-2">Available Models</div>
                    <div className="space-y-1">
                      {(def.id === 'ollama' ? ollamaModels.map(m => ({ id: m, name: m, recommendedModules: [] as string[] })) : def.models).map(model => {
                        const mkey = `${def.id}::${model.id}`;
                        return (
                          <div key={model.id} className="flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-900">{model.name}</span>
                              {model.recommendedModules?.length > 0 && (
                                <span className="text-[10px] text-gray-400 ml-2">{model.recommendedModules.slice(0, 3).join(', ')}</span>
                              )}
                            </div>
                            <div className="relative">
                              <button onClick={() => setAssignOpen(assignOpen === mkey ? null : mkey)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-50">
                                Assign <ChevronDown className="w-3 h-3" />
                              </button>
                              {assignOpen === mkey && (
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
  };

  const freeDefs = PROVIDER_DEFS.filter(d => FREE_CLOUD_IDS.includes(d.id));
  const otherDefs = PROVIDER_DEFS.filter(d => !FREE_CLOUD_IDS.includes(d.id));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 px-5 py-3.5">
        <p className="text-xs text-gray-500">
          Connect cloud AI providers. API keys are stored locally on your device only. Each connection is validated with a real API call before status is marked Connected.
        </p>
      </div>

      {/* Free / Low-Cost Cloud AI */}
      <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-emerald-100 bg-emerald-50">
          <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Free / Low-Cost Cloud AI</div>
          <p className="text-[10px] text-emerald-600 mt-0.5">
            These providers offer free tiers or free-tier models. API key required · Rate limits apply · Free does not mean unlimited.
          </p>
        </div>
        {freeDefs.map(renderProviderRow)}
      </div>

      {/* All other providers */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">All Cloud Providers</span>
        </div>
        {otherDefs.map(renderProviderRow)}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Pipeline Section — Real setup: preflight → download/connect → assign
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

/* ── Pipeline types ─────────────────────────────────────────────── */
type PipelinePhase = 'configure' | 'preflight' | 'running' | 'done';

interface ModulePlan {
  moduleId: string; moduleName: string; moduleDesc: string;
  kind: 'ready' | 'load-local' | 'download-local' | 'connect-cloud' | 'unavailable';
  targetAssignment: ModuleAssignment | null;
  localModel?: LocalModelConfig;
  providerId?: string; providerName?: string;
  note: string;
  status: 'pending' | 'running' | 'done' | 'failed' | 'unavailable';
}

interface LocalSetupOp {
  id: string; model: LocalModelConfig; kind: 'download' | 'load';
  status: 'pending' | 'checking-storage' | 'downloading' | 'loading' | 'testing' | 'done' | 'failed';
  progress: number; error?: string;
}

interface CloudSetupOp {
  id: string; providerDef: ProviderDef;
  status: 'pending' | 'validating' | 'connected' | 'failed';
  error?: string;
}

/* ── Configure phase: overview display ──────────────────────────── */
interface Rec { assignment: ModuleAssignment | null; note: string; status: 'ready' | 'requires-setup'; setupMsg?: string; }

function buildRecs(mode: PipelineMode, providerStates: Record<string, any>, loadedIds: string[]): Record<AIModuleId, Rec> {
  const result: Record<string, Rec> = {};
  const connectedProviders = PROVIDER_DEFS.filter(d => providerStates[d.id]?.status === 'connected');
  const bestLocal = LOCAL_QUALITY.find(id => loadedIds.includes(id)) ?? null;
  const bestLocalMeta = bestLocal ? LOCAL_MODELS.find(m => m.id === bestLocal) : null;
  for (const mod of AI_MODULES) {
    const isHigh = HIGH_INTELLIGENCE.has(mod.id);
    let rec: Rec;
    if (mode === 'local') {
      rec = bestLocal && bestLocalMeta
        ? { assignment: { providerId: 'local', modelId: bestLocal, providerName: 'Local AI', modelName: bestLocalMeta.name, isLocal: true }, note: `Local: ${bestLocalMeta.name}`, status: 'ready' }
        : { assignment: null, note: 'No local model loaded', status: 'requires-setup', setupMsg: 'Download Required' };
    } else if (mode === 'cloud') {
      const pref = CLOUD_PREF[mod.id] ?? ['openai'];
      const provider = connectedProviders.find(p => pref.includes(p.id));
      rec = provider
        ? { assignment: { providerId: provider.id, modelId: provider.models[0].id, providerName: provider.name, modelName: provider.models[0].name, isLocal: false }, note: `${provider.name} / ${provider.models[0].name}`, status: 'ready' }
        : { assignment: null, note: `${PROVIDER_DEFS.find(p => p.id === (pref[0] ?? 'openai'))?.name ?? 'Cloud'} recommended`, status: 'requires-setup', setupMsg: 'API Key Required' };
    } else {
      if (isHigh) {
        const pref = CLOUD_PREF[mod.id] ?? ['openai'];
        const provider = connectedProviders.find(p => pref.includes(p.id));
        if (provider) {
          rec = { assignment: { providerId: provider.id, modelId: provider.models[0].id, providerName: provider.name, modelName: provider.models[0].name, isLocal: false }, note: `${provider.name} / ${provider.models[0].name}`, status: 'ready' };
        } else if (bestLocal && bestLocalMeta) {
          rec = { assignment: { providerId: 'local', modelId: bestLocal, providerName: 'Local AI', modelName: bestLocalMeta.name, isLocal: true }, note: `Local fallback: ${bestLocalMeta.name}`, status: 'ready' };
        } else {
          rec = { assignment: null, note: `${PROVIDER_DEFS.find(p => p.id === (CLOUD_PREF[mod.id]?.[0] ?? 'openai'))?.name ?? 'Cloud'} recommended`, status: 'requires-setup', setupMsg: 'API Key Required or Download' };
        }
      } else {
        if (bestLocal && bestLocalMeta) {
          rec = { assignment: { providerId: 'local', modelId: bestLocal, providerName: 'Local AI', modelName: bestLocalMeta.name, isLocal: true }, note: `Local: ${bestLocalMeta.name}`, status: 'ready' };
        } else {
          const pref = CLOUD_PREF[mod.id] ?? ['openai'];
          const provider = connectedProviders.find(p => pref.includes(p.id));
          rec = provider
            ? { assignment: { providerId: provider.id, modelId: provider.models[0].id, providerName: provider.name, modelName: provider.models[0].name, isLocal: false }, note: `Cloud fallback: ${provider.name}`, status: 'ready' }
            : { assignment: null, note: 'No local or cloud available', status: 'requires-setup', setupMsg: 'Download or Connect' };
        }
      }
    }
    result[mod.id as AIModuleId] = rec;
  }
  return result as Record<AIModuleId, Rec>;
}

/* ── Plan builder for execution ─────────────────────────────────── */
function buildModulePlan(
  mode: PipelineMode,
  providerStates: Record<string, any>,
  loadedIds: string[],
  installedIds: string[],
  hasWebGPU: boolean | null,
  isMobile: boolean,
  storage: { available: number } | null,
): { plans: ModulePlan[]; localOps: LocalSetupOp[]; cloudOps: CloudSetupOp[] } {
  const plans: ModulePlan[] = [];
  const localOpsMap = new Map<string, LocalSetupOp>();
  const cloudOpsMap = new Map<string, CloudSetupOp>();
  const connectedProviders = PROVIDER_DEFS.filter(d => providerStates[d.id]?.status === 'connected');
  const bestLoadedId = LOCAL_QUALITY.find(id => loadedIds.includes(id));
  const bestLoaded = bestLoadedId ? (LOCAL_MODELS.find(m => m.id === bestLoadedId) ?? null) : null;

  function pickTargetLocalModel(): LocalModelConfig {
    const fallback = LOCAL_MODELS.find(m => m.id === 'HuggingFaceTB/SmolLM2-135M-Instruct')!;
    for (const id of LOCAL_QUALITY) {
      const m = LOCAL_MODELS.find(x => x.id === id);
      if (!m) continue;
      const compatible = !m.requiresWebGPU || hasWebGPU === true;
      const fits = !storage || storage.available > m.sizeBytes * 1.2;
      if (compatible && fits) return m;
    }
    return fallback;
  }

  for (const mod of AI_MODULES) {
    const isHigh = HIGH_INTELLIGENCE.has(mod.id);
    const base = { moduleId: mod.id, moduleName: mod.label, moduleDesc: mod.description };
    const useLocal = !isMobile && (mode === 'local' || (mode === 'hybrid' && !isHigh));
    let plan: ModulePlan;

    if (useLocal) {
      if (bestLoaded) {
        plan = { ...base, kind: 'ready', targetAssignment: { providerId: 'local', modelId: bestLoaded.id, providerName: 'Local AI', modelName: bestLoaded.name, isLocal: true }, localModel: bestLoaded, note: `Local · ${bestLoaded.name}`, status: 'pending' };
      } else {
        const target = pickTargetLocalModel();
        const compatible = !target.requiresWebGPU || hasWebGPU === true;
        const isLoaded = loadedIds.includes(target.id);
        const isInst = installedIds.includes(target.id);
        if (!compatible) {
          plan = { ...base, kind: 'unavailable', targetAssignment: null, note: 'Unsupported — WebGPU unavailable on this device', status: 'unavailable' };
        } else if (isLoaded) {
          plan = { ...base, kind: 'ready', targetAssignment: { providerId: 'local', modelId: target.id, providerName: 'Local AI', modelName: target.name, isLocal: true }, localModel: target, note: `Local · ${target.name}`, status: 'pending' };
        } else {
          const kind = isInst ? 'load-local' : 'download-local';
          plan = { ...base, kind, targetAssignment: null, localModel: target, note: isInst ? `Load ${target.name}` : `Download · ${target.name} · ${target.sizeLabel}`, status: 'pending' };
          if (!localOpsMap.has(target.id)) {
            localOpsMap.set(target.id, { id: target.id, model: target, kind: isInst ? 'load' : 'download', status: 'pending', progress: 0 });
          }
        }
      }
    } else {
      const pref = CLOUD_PREF[mod.id] ?? ['openai'];
      const conn = connectedProviders.find(p => pref.includes(p.id));
      if (conn) {
        const model = conn.models[0];
        plan = { ...base, kind: 'ready', targetAssignment: { providerId: conn.id, modelId: model.id, providerName: conn.name, modelName: model.name, isLocal: false }, providerId: conn.id, providerName: conn.name, note: `${conn.name} · ${model.name}`, status: 'pending' };
      } else {
        const preferred = PROVIDER_DEFS.find(p => pref.includes(p.id) && p.browserCompatible && p.inferenceCategory !== 'unsupported');
        if (preferred) {
          plan = { ...base, kind: 'connect-cloud', targetAssignment: null, providerId: preferred.id, providerName: preferred.name, note: `Connect ${preferred.name}`, status: 'pending' };
          if (!cloudOpsMap.has(preferred.id)) {
            cloudOpsMap.set(preferred.id, { id: preferred.id, providerDef: preferred, status: 'pending' });
          }
        } else if (mode === 'hybrid' && bestLoaded) {
          plan = { ...base, kind: 'ready', targetAssignment: { providerId: 'local', modelId: bestLoaded.id, providerName: 'Local AI', modelName: bestLoaded.name, isLocal: true }, localModel: bestLoaded, note: `Local fallback · ${bestLoaded.name}`, status: 'pending' };
        } else {
          plan = { ...base, kind: 'unavailable', targetAssignment: null, note: 'No compatible provider available', status: 'unavailable' };
        }
      }
    }
    plans.push(plan);
  }

  return { plans, localOps: Array.from(localOpsMap.values()), cloudOps: Array.from(cloudOpsMap.values()) };
}

/* ── Sub-components ─────────────────────────────────────────────── */
function KindBadge({ kind, status }: { kind: ModulePlan['kind']; status: ModulePlan['status'] }) {
  if (status === 'done')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold"><CheckCircle2 className="w-3 h-3"/>Done</span>;
  if (status === 'failed')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold"><AlertCircle className="w-3 h-3"/>Failed</span>;
  if (status === 'unavailable' || kind === 'unavailable')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"><AlertTriangle className="w-3 h-3"/>Unavailable</span>;
  if (kind === 'ready')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-medium"><CheckCircle2 className="w-3 h-3"/>Ready to assign</span>;
  if (kind === 'download-local')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200"><Download className="w-3 h-3"/>Download required</span>;
  if (kind === 'load-local')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200"><Zap className="w-3 h-3"/>Load required</span>;
  if (kind === 'connect-cloud')
    return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"><Wifi className="w-3 h-3"/>API Key Required</span>;
  return null;
}

function LocalOpRow({ op }: { op: LocalSetupOp }) {
  const LABELS: Record<LocalSetupOp['status'], string> = {
    pending: 'Waiting…', 'checking-storage': 'Checking storage…',
    downloading: 'Downloading…', loading: 'Loading into runtime…',
    testing: 'Testing inference…',
    done: 'Ready ✓', failed: 'Failed',
  };
  const active = op.status === 'downloading' || op.status === 'loading' || op.status === 'testing';
  return (
    <div className="flex flex-col gap-1.5 px-5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {op.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0"/> :
           op.status === 'failed' ? <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0"/> :
           active ? <Loader2 className="w-4 h-4 text-violet-500 animate-spin flex-shrink-0"/> :
           <Download className="w-4 h-4 text-gray-300 flex-shrink-0"/>}
          <span className="text-sm font-semibold text-gray-800 truncate">{op.model.name}</span>
          <span className="text-xs text-gray-400 flex-shrink-0">{op.model.sizeLabel}</span>
        </div>
        <span className={`text-xs flex-shrink-0 font-medium ${op.status === 'done' ? 'text-green-600' : op.status === 'failed' ? 'text-red-500' : active ? 'text-violet-600' : 'text-gray-400'}`}>
          {LABELS[op.status]}{active && op.progress > 0 ? ` ${op.progress}%` : ''}
        </span>
      </div>
      {active && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-6">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-300" style={{ width: `${Math.max(2, op.progress)}%` }}/>
        </div>
      )}
      {op.status === 'failed' && op.error && <p className="text-xs text-red-500 ml-6">{op.error}</p>}
    </div>
  );
}

function CloudOpRow({ op }: { op: CloudSetupOp }) {
  const LABELS: Record<CloudSetupOp['status'], string> = {
    pending: 'Waiting…', validating: 'Validating…', connected: 'Connected', failed: 'Failed',
  };
  return (
    <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2">
        {op.status === 'connected' ? <CheckCircle2 className="w-4 h-4 text-green-500"/> :
         op.status === 'failed' ? <AlertCircle className="w-4 h-4 text-red-500"/> :
         op.status === 'validating' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin"/> :
         <Wifi className="w-4 h-4 text-gray-300"/>}
        <span className="text-sm font-semibold text-gray-800">{op.providerDef.name}</span>
      </div>
      <div className="text-right">
        <span className={`text-xs font-medium ${op.status === 'connected' ? 'text-green-600' : op.status === 'failed' ? 'text-red-500' : op.status === 'validating' ? 'text-blue-500' : 'text-gray-400'}`}>
          {LABELS[op.status]}
        </span>
        {op.status === 'failed' && op.error && <div className="text-[10px] text-red-400 mt-0.5">{op.error}</div>}
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
function PipelineSection() {
  const { providerStates, loadedLocalModelIds, assignModule, connectProvider, registerLocalPipeline } = useAIModel();
  const [mode, setMode] = useState<PipelineMode>('hybrid');
  const [phase, setPhase] = useState<PipelinePhase>('configure');
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  const [storageAvailable, setStorageAvailable] = useState<number | null>(null);
  const [installedIds, setInstalledIds] = useState<string[]>([]);
  const [modulePlans, setModulePlans] = useState<ModulePlan[]>([]);
  const [localSetupOps, setLocalSetupOps] = useState<LocalSetupOp[]>([]);
  const [cloudSetupOps, setCloudSetupOps] = useState<CloudSetupOp[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const plansRef = useRef<ModulePlan[]>([]);
  const localOpsRef = useRef<LocalSetupOp[]>([]);
  const cloudOpsRef = useRef<CloudSetupOp[]>([]);
  const apiKeysRef = useRef<Record<string, string>>({});
  const isRunningRef = useRef(false);

  useEffect(() => {
    checkWebGPU().then(setHasWebGPU);
    checkStorage().then(s => setStorageAvailable(s.available));
    setInstalledIds(getInstalledModelIds());
  }, []);

  const enterPreflight = useCallback(() => {
    const storage = storageAvailable !== null ? { available: storageAvailable } : null;
    const { plans, localOps, cloudOps } = buildModulePlan(mode, providerStates, loadedLocalModelIds, installedIds, hasWebGPU, storage);
    const keys: Record<string, string> = {};
    cloudOps.forEach(op => { keys[op.id] = providerStates[op.id]?.apiKey ?? ''; });
    plansRef.current = plans;
    localOpsRef.current = localOps;
    cloudOpsRef.current = cloudOps;
    apiKeysRef.current = keys;
    setModulePlans(plans);
    setLocalSetupOps(localOps);
    setCloudSetupOps(cloudOps);
    setApiKeys(keys);
    setPhase('preflight');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, providerStates, loadedLocalModelIds, installedIds, hasWebGPU, storageAvailable]);

  const runSetup = async () => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setPhase('running');

    const plans = plansRef.current;
    const keys = apiKeysRef.current;

    const patchPlan = (moduleId: string, patch: Partial<ModulePlan>) =>
      setModulePlans(prev => prev.map(p => p.moduleId === moduleId ? { ...p, ...patch } : p));
    const patchLocal = (id: string, patch: Partial<LocalSetupOp>) =>
      setLocalSetupOps(prev => prev.map(op => op.id === id ? { ...op, ...patch } : op));
    const patchCloud = (id: string, patch: Partial<CloudSetupOp>) =>
      setCloudSetupOps(prev => prev.map(op => op.id === id ? { ...op, ...patch } : op));

    /* 1. Assign already-ready modules immediately */
    plans.filter(p => p.kind === 'ready' && p.targetAssignment).forEach(p => {
      assignModule(p.moduleId, p.targetAssignment!);
      patchPlan(p.moduleId, { status: 'done' });
    });

    /* 2. Cloud provider validation — all in parallel */
    const cloudPromises = cloudOpsRef.current.map(async op => {
      const key = keys[op.id] ?? '';
      if (!key && op.providerDef.needsKey) {
        patchCloud(op.id, { status: 'failed', error: 'No API key provided' });
        plans.filter(p => p.providerId === op.id).forEach(p => patchPlan(p.moduleId, { status: 'failed', note: 'No API key provided — enter key in preflight and retry' }));
        return;
      }
      patchCloud(op.id, { status: 'validating' });
      try {
        const ok = await connectProvider(op.id, key);
        if (ok) {
          patchCloud(op.id, { status: 'connected' });
          const def = PROVIDER_DEFS.find(d => d.id === op.id);
          const model = def?.models[0];
          plans.filter(p => p.providerId === op.id).forEach(p => {
            if (def && model) {
              assignModule(p.moduleId, { providerId: def.id, modelId: model.id, providerName: def.name, modelName: model.name, isLocal: false });
              patchPlan(p.moduleId, { status: 'done', note: `${def.name} · ${model.name}` });
            }
          });
        } else {
          patchCloud(op.id, { status: 'failed', error: 'Invalid key or connection refused' });
          plans.filter(p => p.providerId === op.id).forEach(p => patchPlan(p.moduleId, { status: 'failed', note: 'Provider connection failed' }));
        }
      } catch (e: any) {
        const msg = e?.message ?? 'Network error';
        patchCloud(op.id, { status: 'failed', error: msg });
        plans.filter(p => p.providerId === op.id).forEach(p => patchPlan(p.moduleId, { status: 'failed', note: msg }));
      }
    });

    /* 3. Local model downloads/loads — sequential (one at a time) */
    for (const op of localOpsRef.current) {
      patchLocal(op.id, { status: 'checking-storage' });
      await new Promise(r => setTimeout(r, 350));
      const nowInstalled = getInstalledModelIds().includes(op.id);
      patchLocal(op.id, { status: nowInstalled ? 'loading' : 'downloading', progress: 0 });
      try {
        const pipe = await loadLocalModel(op.model, (info) => {
          const pct = info.progress !== undefined ? Math.round(info.progress) : 0;
          patchLocal(op.id, { progress: pct });
        }, !!hasWebGPU);
        registerLocalPipeline(op.id, pipe, op.model.name);
        setInstalledIds(getInstalledModelIds());
        patchLocal(op.id, { status: 'done', progress: 100 });
        plans.filter(p => p.localModel?.id === op.id).forEach(p => {
          assignModule(p.moduleId, { providerId: 'local', modelId: op.id, providerName: 'Local AI', modelName: op.model.name, isLocal: true });
          patchPlan(p.moduleId, { status: 'done', note: `Local · ${op.model.name}` });
        });
      } catch (e: any) {
        const msg = e?.message ?? 'Load failed';
        patchLocal(op.id, { status: 'failed', error: msg });
        plans.filter(p => p.localModel?.id === op.id).forEach(p => patchPlan(p.moduleId, { status: 'failed', note: msg }));
      }
    }

    await Promise.all(cloudPromises);
    isRunningRef.current = false;
    setPhase('done');
  };

  /* ── Configure ────────────────────────────────────────────────── */
  if (phase === 'configure') {
    const recs = buildRecs(mode, providerStates, loadedLocalModelIds);
    const readyCount = Object.values(recs).filter(r => r.status === 'ready').length;
    const needsSetup = Object.values(recs).filter(r => r.status === 'requires-setup').length;
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-1">Pipeline Mode</h3>
          <p className="text-xs text-gray-500 mb-4">Choose how AI modules are powered across the app.</p>
          <div className="flex gap-2">
            {([['local', 'Local Only', 'Runs entirely on your device'], ['hybrid', 'Hybrid', 'Cloud for complex tasks, Local for simple ones'], ['cloud', 'Cloud Only', 'All modules routed to cloud providers']] as const).map(([id, label, desc]) => (
              <button key={id} onClick={() => setMode(id)}
                className={`flex-1 px-3 py-3 rounded-xl border-2 text-left transition-all ${mode === id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className={`text-sm font-semibold ${mode === id ? 'text-violet-700' : 'text-gray-700'}`}>{label}</div>
                <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <div>
              <span className="text-sm font-bold text-gray-900">Module Recommendations</span>
              <span className="ml-2 text-xs text-gray-400">{readyCount}/{AI_MODULES.length} ready</span>
            </div>
            <button onClick={enterPreflight}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all">
              <Sparkles className="w-4 h-4"/> Apply Recommendations
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
                      {rec.status === 'ready' ? <><CheckCircle2 className="w-3 h-3"/>{rec.note}</> : <><AlertTriangle className="w-3 h-3"/>{rec.setupMsg}</>}
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

        {needsSetup > 0 && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
            {needsSetup} module{needsSetup > 1 ? 's' : ''} need{needsSetup === 1 ? 's' : ''} setup. Click <strong>Apply Recommendations</strong> to see the full plan, enter any required API keys, and start real configuration.
          </div>
        )}
        <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
          Applying runs a preflight check, then downloads/connects/assigns each module for real. Ready only appears after a model loads through the runtime or a provider validates successfully. No simulated states.
        </div>
      </div>
    );
  }

  /* ── Preflight ────────────────────────────────────────────────── */
  if (phase === 'preflight') {
    const dlCount = localSetupOps.filter(op => op.kind === 'download').length;
    const loadCount = localSetupOps.filter(op => op.kind === 'load').length;
    const readyCount = modulePlans.filter(p => p.kind === 'ready').length;
    const unavailCount = modulePlans.filter(p => p.kind === 'unavailable').length;
    const hasActions = readyCount > 0 || localSetupOps.length > 0 || cloudSetupOps.length > 0;

    return (
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => setPhase('configure')} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4"/>
            </button>
            <h3 className="text-sm font-bold text-gray-900">
              Setup Plan — {mode === 'local' ? 'Local Only' : mode === 'cloud' ? 'Cloud Only' : 'Hybrid'} Pipeline
            </h3>
          </div>
          <p className="text-xs text-gray-500 ml-6">Review what will happen before starting. Enter API keys for any cloud providers below.</p>
          <div className="mt-4 flex flex-wrap gap-2 ml-6">
            {readyCount > 0 && <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3"/>{readyCount} already ready</span>}
            {dlCount > 0 && <span className="inline-flex items-center gap-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 px-2.5 py-1 rounded-full"><Download className="w-3 h-3"/>Download {dlCount} local model{dlCount > 1 ? 's' : ''}</span>}
            {loadCount > 0 && <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full"><Zap className="w-3 h-3"/>Load {loadCount} cached model{loadCount > 1 ? 's' : ''}</span>}
            {cloudSetupOps.length > 0 && <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full"><Wifi className="w-3 h-3"/>Connect {cloudSetupOps.length} cloud provider{cloudSetupOps.length > 1 ? 's' : ''}</span>}
            {unavailCount > 0 && <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full"><AlertTriangle className="w-3 h-3"/>{unavailCount} unavailable</span>}
          </div>
        </div>

        {/* Per-module plan */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Module → Planned Action</span>
          </div>
          <div className="divide-y divide-gray-50">
            {modulePlans.map(plan => (
              <div key={plan.moduleId} className="flex items-center gap-3 px-5 py-3">
                <div className="w-40 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">{plan.moduleName}</div>
                  <div className="text-[10px] text-gray-400">{plan.moduleDesc}</div>
                </div>
                <div className="flex-1 text-xs text-gray-500 min-w-0 truncate">{plan.note}</div>
                <div className="flex-shrink-0"><KindBadge kind={plan.kind} status={plan.status}/></div>
              </div>
            ))}
          </div>
        </div>

        {/* API key inputs */}
        {cloudSetupOps.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-0.5">API Keys Required</h4>
              <p className="text-xs text-gray-500">Keys are stored locally on your device and sent only to the respective provider's API for validation.</p>
            </div>
            {cloudSetupOps.map(op => (
              <div key={op.id}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{op.providerDef.name}</label>
                {op.providerDef.needsKey ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showKey[op.id] ? 'text' : 'password'}
                        value={apiKeys[op.id] ?? ''}
                        onChange={e => {
                          const v = e.target.value;
                          apiKeysRef.current = { ...apiKeysRef.current, [op.id]: v };
                          setApiKeys(prev => ({ ...prev, [op.id]: v }));
                        }}
                        placeholder={op.providerDef.keyPlaceholder}
                        className="w-full pr-9 pl-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-violet-400 bg-white"
                      />
                      <button type="button" onClick={() => setShowKey(p => ({ ...p, [op.id]: !p[op.id] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showKey[op.id] ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    {op.providerDef.docsUrl && (
                      <a href={op.providerDef.docsUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 px-2.5 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 flex-shrink-0">
                        <ExternalLink className="w-3 h-3"/> Get key
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-green-600">✓ No key required — will connect automatically</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">{op.providerDef.keyHint}</p>
              </div>
            ))}
            <p className="text-[10px] text-gray-400 border-t border-gray-100 pt-3">Providers without a key will be skipped and marked Failed. You can connect them manually in the Cloud tab.</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button onClick={() => setPhase('configure')}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            <ArrowLeft className="w-4 h-4"/> Back
          </button>
          <button onClick={runSetup} disabled={!hasActions}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
            <Sparkles className="w-4 h-4"/> Start Setup
          </button>
          {!hasActions && <span className="text-xs text-gray-400">No actionable modules — all are unavailable for this configuration.</span>}
        </div>
      </div>
    );
  }

  /* ── Running ──────────────────────────────────────────────────── */
  if (phase === 'running') {
    const doneCount = modulePlans.filter(p => p.status === 'done' || p.status === 'failed').length;
    const actionable = modulePlans.filter(p => p.kind !== 'unavailable').length;
    return (
      <div className="space-y-5">
        {/* Overall progress */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin"/>
              <span className="text-sm font-bold text-gray-900">Setting up pipeline…</span>
            </div>
            <span className="text-xs text-gray-400">{doneCount}/{actionable} modules complete</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${actionable > 0 ? Math.round((doneCount / actionable) * 100) : 0}%` }}/>
          </div>
        </div>

        {/* Local model queue */}
        {localSetupOps.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Local Model Queue</span>
            </div>
            {localSetupOps.map(op => <LocalOpRow key={op.id} op={op}/>)}
          </div>
        )}

        {/* Cloud validations */}
        {cloudSetupOps.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cloud Provider Validation</span>
            </div>
            {cloudSetupOps.map(op => <CloudOpRow key={op.id} op={op}/>)}
          </div>
        )}

        {/* Module assignment status */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Module Assignments</span>
          </div>
          <div className="divide-y divide-gray-50">
            {modulePlans.map(plan => (
              <div key={plan.moduleId} className="flex items-center gap-3 px-5 py-2.5">
                <div className="w-40 flex-shrink-0 text-sm font-medium text-gray-800">{plan.moduleName}</div>
                <div className="flex-1 text-xs text-gray-500 truncate">{plan.note}</div>
                <div className="flex-shrink-0"><KindBadge kind={plan.kind} status={plan.status}/></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Done ─────────────────────────────────────────────────────── */
  const donePlans  = modulePlans.filter(p => p.status === 'done');
  const failPlans  = modulePlans.filter(p => p.status === 'failed');
  const unavPlans  = modulePlans.filter(p => p.kind === 'unavailable');
  const allOk = failPlans.length === 0;

  return (
    <div className="space-y-5">
      {/* Result header */}
      <div className={`rounded-xl border p-5 ${allOk ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-center gap-2">
          {allOk ? <CheckCircle2 className="w-5 h-5 text-green-600"/> : <AlertTriangle className="w-5 h-5 text-amber-600"/>}
          <h3 className="text-sm font-bold text-gray-900">
            {allOk ? 'Pipeline Applied Successfully' : `Pipeline Applied — ${failPlans.length} item${failPlans.length > 1 ? 's' : ''} failed`}
          </h3>
        </div>
        <p className="text-xs text-gray-600 mt-1 ml-7">
          {donePlans.length} module{donePlans.length !== 1 ? 's' : ''} configured{failPlans.length > 0 ? ` · ${failPlans.length} need attention` : ''}{unavPlans.length > 0 ? ` · ${unavPlans.length} unavailable` : ''}.
        </p>
      </div>

      {/* Ready */}
      {donePlans.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-100 bg-gray-50">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wide flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Ready ({donePlans.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {donePlans.map(p => (
              <div key={p.moduleId} className="flex items-center justify-between px-5 py-2.5">
                <span className="text-sm font-medium text-gray-800">{p.moduleName}</span>
                <span className="text-xs text-gray-500">{p.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed */}
      {failPlans.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
          <div className="px-5 py-2.5 border-b border-red-100 bg-red-50">
            <span className="text-xs font-bold text-red-600 uppercase tracking-wide flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Failed ({failPlans.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {failPlans.map(p => (
              <div key={p.moduleId} className="flex items-center justify-between px-5 py-2.5">
                <span className="text-sm font-medium text-gray-800">{p.moduleName}</span>
                <span className="text-xs text-red-500">{p.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable warnings */}
      {unavPlans.length > 0 && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
          <span>{unavPlans.length} module{unavPlans.length > 1 ? 's' : ''} could not be configured ({unavPlans.map(p => p.moduleName).join(', ')}). Check device compatibility or switch to a different pipeline mode.</span>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={() => setPhase('configure')}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
          <ArrowLeft className="w-4 h-4"/> Reconfigure
        </button>
        {failPlans.length > 0 && (
          <button onClick={enterPreflight}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-violet-700 border border-violet-300 bg-violet-50 rounded-lg hover:bg-violet-100 transition-all">
            <RefreshCw className="w-4 h-4"/> Retry Failed
          </button>
        )}
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
