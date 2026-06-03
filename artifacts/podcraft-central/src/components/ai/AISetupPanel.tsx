import React, { useState, useEffect, useRef } from 'react';
import {
  X, Cpu, Cloud, List, ChevronRight, ChevronDown, Wifi, WifiOff,
  Loader2, CheckCircle2, AlertTriangle, Download, Trash2, Zap,
  Monitor, HardDrive, Eye, EyeOff, ExternalLink, RefreshCw, Info,
} from 'lucide-react';
import { PROVIDER_DEFS, ProviderDef, ProviderStatus, fetchOllamaModelList } from '../../utils/multiAI';
import {
  LOCAL_MODELS, LocalModelConfig, LoadedPipeline,
  checkWebGPU, checkStorage, getInstalledModelIds,
  loadLocalModel, deleteLocalModel, formatBytes,
} from '../../utils/localAI';
import { useAIModel, AI_MODULES, AIModuleId, ModuleAssignment } from '../../store/AIModelStore';

type Tab = 'local' | 'cloud' | 'assign';

const STATUS_LABEL: Record<ProviderStatus, string> = {
  'not-connected': 'Not Connected', 'validating': 'Validating…', 'connected': 'Connected',
  'invalid-key': 'Invalid Key', 'connection-failed': 'Connection Failed',
  'missing-key': 'Missing Key', 'unsupported': 'Unsupported',
};
const STATUS_COLOR: Record<ProviderStatus, string> = {
  'not-connected': 'text-gray-400', 'validating': 'text-blue-500 animate-pulse',
  'connected': 'text-green-600 font-semibold', 'invalid-key': 'text-red-500',
  'connection-failed': 'text-red-400', 'missing-key': 'text-orange-500', 'unsupported': 'text-gray-400',
};

/* ═══════════════════════════════════════════════════════════════ */
/*  Main panel                                                     */
/* ═══════════════════════════════════════════════════════════════ */
export function AISetupPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('cloud');
  const { providerStates, assignments } = useAIModel();

  const connectedCount = Object.values(providerStates).filter(s => s.status === 'connected').length;
  const assignedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[600px] bg-white shadow-2xl border-l border-gray-200 z-[300] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 bg-gradient-to-r from-violet-50 to-white">
        <span className="font-bold text-gray-900">AI Setup</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {([
          { id: 'local', icon: <Cpu className="w-3.5 h-3.5" />, label: 'Local AI' },
          { id: 'cloud', icon: <Cloud className="w-3.5 h-3.5" />, label: `Cloud AI${connectedCount ? ` · ${connectedCount} connected` : ''}` },
          { id: 'assign', icon: <List className="w-3.5 h-3.5" />, label: `Assignments${assignedCount ? ` · ${assignedCount}` : ''}` },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${tab === t.id ? 'border-violet-600 text-violet-600 bg-violet-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {tab === 'local' && <LocalAITab />}
        {tab === 'cloud' && <CloudAITab />}
        {tab === 'assign' && <AssignmentsTab />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  LOCAL AI tab                                                   */
/* ═══════════════════════════════════════════════════════════════ */
type LocalModelStatus = 'checking' | 'not-installed' | 'installed' | 'downloading' | 'loading' | 'ready' | 'failed' | 'unsupported';
interface LocalModelState { status: LocalModelStatus; progress: number; error?: string; }
const LOCAL_CATEGORY_LABELS: Record<string, string> = {
  'small-fast': 'Small / Fast', 'balanced': 'Balanced',
  'higher-quality': 'Higher Quality', 'experimental': 'Experimental',
};

function LocalAITab() {
  const { registerLocalPipeline, unregisterLocalPipeline, assignModule, loadedLocalModelIds } = useAIModel();
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  const [storage, setStorage] = useState<{ available: number; quota: number } | null>(null);
  const [modelStates, setModelStates] = useState<Record<string, LocalModelState>>({});
  const [assignPickerFor, setAssignPickerFor] = useState<string | null>(null); // modelId waiting for assignment
  const pipelines = useRef<Record<string, LoadedPipeline>>({});

  useEffect(() => {
    (async () => {
      const [gpu, stor] = await Promise.all([checkWebGPU(), checkStorage()]);
      setHasWebGPU(gpu);
      setStorage(stor);
      const installed = getInstalledModelIds();
      const states: Record<string, LocalModelState> = {};
      for (const m of LOCAL_MODELS) {
        if (m.requiresWebGPU && !gpu) states[m.id] = { status: 'unsupported', progress: 0, error: 'WebGPU not available' };
        else if (installed.includes(m.id)) states[m.id] = { status: 'installed', progress: 0 };
        else states[m.id] = { status: 'not-installed', progress: 0 };
        /* Restore pipeline reference if it's already in the registry */
        if (loadedLocalModelIds.includes(m.id)) {
          states[m.id] = { status: 'ready', progress: 100 };
        }
      }
      setModelStates(states);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMS = (id: string, patch: Partial<LocalModelState>) =>
    setModelStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleDownloadOrLoad = async (model: LocalModelConfig) => {
    const stor = await checkStorage();
    const currentStatus = modelStates[model.id]?.status;
    if (currentStatus === 'not-installed' && stor.available < model.sizeBytes) {
      setMS(model.id, { status: 'failed', progress: 0, error: `Insufficient storage: need ${model.sizeLabel}, ${formatBytes(stor.available)} free` });
      return;
    }
    setMS(model.id, { status: 'downloading', progress: 0, error: undefined });
    try {
      const pipe = await loadLocalModel(model, info => {
        if (info.status === 'progress' && info.progress !== undefined) setMS(model.id, { status: 'downloading', progress: Math.round(info.progress) });
        else if (info.status === 'done') setMS(model.id, { status: 'loading', progress: 100 });
      }, hasWebGPU === true);
      pipelines.current[model.id] = pipe;
      setMS(model.id, { status: 'ready', progress: 100 });
      registerLocalPipeline(model.id, pipe, model.name);
    } catch (err) {
      setMS(model.id, { status: 'failed', progress: 0, error: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleDelete = async (model: LocalModelConfig) => {
    if (!window.confirm(`Remove ${model.name} from local storage?`)) return;
    await deleteLocalModel(model.id);
    delete pipelines.current[model.id];
    unregisterLocalPipeline(model.id);
    setMS(model.id, { status: 'not-installed', progress: 0, error: undefined });
  };

  const handleAssign = (moduleId: AIModuleId, model: LocalModelConfig) => {
    const pipe = pipelines.current[model.id];
    if (!pipe) { setAssignPickerFor(null); return; }
    registerLocalPipeline(model.id, pipe, model.name);
    assignModule(moduleId, { providerId: 'local', modelId: model.id, providerName: 'Local AI', modelName: model.name, isLocal: true });
    setAssignPickerFor(null);
  };

  const categories = ['small-fast', 'balanced', 'higher-quality', 'experimental'] as const;

  return (
    <div>
      {/* System bar */}
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Monitor className={`w-3.5 h-3.5 ${hasWebGPU ? 'text-green-500' : 'text-orange-400'}`} />
            <span className={hasWebGPU ? 'text-green-700 font-medium' : 'text-orange-600'}>
              WebGPU: {hasWebGPU === null ? 'Checking…' : hasWebGPU ? 'Available' : 'Not available'}
            </span>
          </div>
          {storage && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <HardDrive className="w-3.5 h-3.5 text-gray-400" /> {formatBytes(storage.available)} free
            </div>
          )}
        </div>
        <span className="text-[9px] text-gray-400">Stored in browser Cache Storage</span>
      </div>

      {categories.map(cat => (
        <div key={cat}>
          <div className="px-5 pt-3.5 pb-1 flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{LOCAL_CATEGORY_LABELS[cat]}</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>
          {LOCAL_MODELS.filter(m => m.category === cat).map(model => {
            const state = modelStates[model.id] ?? { status: 'checking', progress: 0 };
            const isLoaded = state.status === 'ready';
            const isBusy = state.status === 'downloading' || state.status === 'loading';
            const isInstalled = state.status === 'installed';
            return (
              <div key={model.id} className="px-5 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-sm text-gray-900">{model.name}</span>
                      <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{model.sizeLabel}</span>
                      <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{model.type}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{model.recommendedUse}</p>
                    <div className="mt-1 text-[10px]">
                      {state.status === 'not-installed' && <span className="text-gray-400">Not installed</span>}
                      {state.status === 'installed' && <span className="text-gray-500">Installed · click Use to load</span>}
                      {state.status === 'downloading' && <div className="space-y-1"><span className="text-blue-500 font-medium">Downloading {state.progress}%</span><div className="h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${state.progress}%` }} /></div></div>}
                      {state.status === 'loading' && <span className="text-violet-500 font-medium">Loading into memory…</span>}
                      {state.status === 'ready' && <span className="text-green-600 font-semibold">● Ready</span>}
                      {state.status === 'failed' && <span className="text-red-500">{state.error ?? 'Failed'}</span>}
                      {state.status === 'unsupported' && <span className="text-orange-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{state.error}</span>}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 flex-shrink-0 relative">
                    {state.status === 'unsupported' && <span className="text-[9px] text-gray-400">Incompatible</span>}
                    {(state.status === 'not-installed' || state.status === 'failed') && (
                      <button onClick={() => handleDownloadOrLoad(model)} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                        <Download className="w-3 h-3" /> Download
                      </button>
                    )}
                    {isBusy && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-400 text-[11px] rounded-lg">
                        <Loader2 className="w-3 h-3 animate-spin" /> {state.status === 'downloading' ? 'Downloading…' : 'Loading…'}
                      </div>
                    )}
                    {isInstalled && (
                      <button onClick={() => handleDownloadOrLoad(model)} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                        <Zap className="w-3 h-3" /> Load
                      </button>
                    )}
                    {isLoaded && (
                      <div className="relative">
                        <button onClick={() => setAssignPickerFor(assignPickerFor === model.id ? null : model.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                          <Zap className="w-3 h-3" /> Assign <ChevronDown className="w-2.5 h-2.5" />
                        </button>
                        {assignPickerFor === model.id && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-2xl py-1 z-50">
                            <p className="px-3 py-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Assign to module</p>
                            {AI_MODULES.map(m => (
                              <button key={m.id} onClick={() => handleAssign(m.id, model)}
                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-violet-50 text-gray-700 hover:text-violet-700 transition-colors">
                                {m.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {(isInstalled || isLoaded) && (
                      <button onClick={() => handleDelete(model)} className="flex items-center gap-1 px-2 py-1 text-red-400 hover:text-red-600 text-[10px] rounded hover:bg-red-50 transition-colors">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
      <p className="px-5 py-3 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100">
        Models cached in browser storage via Transformers.js. "Remove" clears the record; full cache cleanup via browser settings.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  CLOUD AI tab                                                   */
/* ═══════════════════════════════════════════════════════════════ */
function CloudAITab() {
  const { providerStates, connectProvider, disconnectProvider, assignModule } = useAIModel();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [keys, setKeys] = useState<Record<string, string>>(() => {
    const k: Record<string, string> = {};
    for (const p of PROVIDER_DEFS) k[p.id] = localStorage.getItem(`podcraft_provider_key_${p.id}`) ?? '';
    return k;
  });
  const [extras, setExtras] = useState<Record<string, Record<string, string>>>(() => {
    const e: Record<string, Record<string, string>> = {};
    for (const p of PROVIDER_DEFS) {
      const stored = localStorage.getItem(`podcraft_provider_extra_${p.id}`);
      if (stored) { try { e[p.id] = JSON.parse(stored); } catch { /**/ } }
      if (!e[p.id] && p.extraFields) {
        e[p.id] = Object.fromEntries(p.extraFields.map(f => [f.key, f.defaultValue]));
      }
    }
    return e;
  });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [assignPickerFor, setAssignPickerFor] = useState<{ providerId: string; modelId: string; modelName: string; providerName: string } | null>(null);

  const handleConnect = async (def: ProviderDef) => {
    const key = keys[def.id] ?? '';
    const extra = extras[def.id];
    await connectProvider(def.id, key, extra);
    setExpanded(def.id);
  };

  const handleFetchOllamaModels = async () => {
    const url = extras['ollama']?.ollamaUrl ?? 'http://localhost:11434';
    const models = await fetchOllamaModelList(url);
    setOllamaModels(models);
  };

  const handleAssign = (moduleId: AIModuleId) => {
    if (!assignPickerFor) return;
    const { providerId, modelId, modelName, providerName } = assignPickerFor;
    assignModule(moduleId, { providerId, modelId, providerName, modelName, isLocal: false });
    setAssignPickerFor(null);
  };

  return (
    <div className="relative">
      {/* Floating assign picker overlay */}
      {assignPickerFor && (
        <div className="fixed inset-0 z-[400]" onClick={() => setAssignPickerFor(null)}>
          <div className="absolute right-[600px] top-32 w-56 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2" onClick={e => e.stopPropagation()}>
            <p className="px-4 py-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100 mb-1">
              Assign <span className="text-violet-600">{assignPickerFor.modelName}</span> to
            </p>
            {AI_MODULES.map(m => (
              <button key={m.id} onClick={() => handleAssign(m.id)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-violet-50 text-gray-700 hover:text-violet-700 transition-colors">
                {m.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {PROVIDER_DEFS.map(def => {
        const state = providerStates[def.id];
        const status: ProviderStatus = state?.status ?? 'not-connected';
        const isConnected = status === 'connected';
        const isValidating = status === 'validating';
        const isUnsupported = !def.browserCompatible;
        const isExpanded = expanded === def.id;

        return (
          <div key={def.id} className="border-b border-gray-100">
            {/* Provider header row */}
            <div className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : def.id)}>
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <button className="text-gray-400 flex-shrink-0">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <span className="font-semibold text-sm text-gray-800">{def.name}</span>
                {isUnsupported && <span className="text-[9px] bg-orange-50 text-orange-500 px-1.5 py-0.5 rounded border border-orange-100 font-medium">Proxy Required</span>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isValidating && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
                {isConnected && <span className="w-2 h-2 rounded-full bg-green-500" />}
                <span className={`text-[11px] ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
                {!isConnected && !isUnsupported && (
                  <button onClick={e => { e.stopPropagation(); setExpanded(def.id); }}
                    className="ml-2 px-2.5 py-1 bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-semibold rounded-lg transition-colors">
                    Connect
                  </button>
                )}
                {isConnected && (
                  <button onClick={e => { e.stopPropagation(); disconnectProvider(def.id); }}
                    className="ml-2 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-semibold rounded-lg border border-red-100 transition-colors">
                    Disconnect
                  </button>
                )}
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-5 pb-4 pt-1 bg-gray-50 border-t border-gray-100 space-y-3">
                {isUnsupported ? (
                  <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-orange-700">
                      <p className="font-semibold mb-0.5">Not supported in browser mode</p>
                      <p>{def.unsupportedNote}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Recommended for */}
                    <p className="text-[10px] text-gray-500 italic">{def.recommendedFor}</p>

                    {/* API key field */}
                    {def.needsKey && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">API Key</label>
                        <div className="relative">
                          <input type={showKey[def.id] ? 'text' : 'password'}
                            value={keys[def.id] ?? ''}
                            onChange={e => setKeys(prev => ({ ...prev, [def.id]: e.target.value }))}
                            placeholder={def.keyPlaceholder}
                            className="w-full px-3 py-2 pr-9 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono bg-white" />
                          <button type="button"
                            onClick={() => setShowKey(prev => ({ ...prev, [def.id]: !prev[def.id] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            {showKey[def.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-[9px] text-gray-400 flex items-center gap-1">
                          <Info className="w-2.5 h-2.5 flex-shrink-0" />
                          Stored in localStorage · not encrypted · session-persistent
                          {def.docsUrl && <><span>·</span><a href={def.docsUrl} target="_blank" rel="noreferrer" className="text-violet-500 hover:underline flex items-center gap-0.5">{def.keyHint}<ExternalLink className="w-2 h-2" /></a></>}
                        </p>
                      </div>
                    )}

                    {/* Extra fields (Ollama URL, Custom URL, etc.) */}
                    {def.extraFields?.map(field => (
                      <div key={field.key} className="space-y-1">
                        <label className="text-xs font-semibold text-gray-600">{field.label}</label>
                        <input
                          value={extras[def.id]?.[field.key] ?? field.defaultValue}
                          onChange={e => setExtras(prev => ({ ...prev, [def.id]: { ...prev[def.id], [field.key]: e.target.value } }))}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 font-mono bg-white" />
                      </div>
                    ))}

                    {/* Ollama instructions */}
                    {def.id === 'ollama' && (
                      <div className="bg-blue-50 rounded-lg p-2.5 border border-blue-100 text-[11px] text-blue-800 space-y-1">
                        <p className="font-semibold">Run Ollama locally</p>
                        <ol className="list-decimal ml-4 space-y-0.5 text-blue-700">
                          <li>Install from <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className="underline font-medium">ollama.com</a></li>
                          <li>Pull a model: <code className="bg-blue-100 px-1 rounded">ollama pull llama3.2</code></li>
                          <li>Allow browser: <code className="bg-blue-100 px-1 rounded">OLLAMA_ORIGINS=* ollama serve</code></li>
                        </ol>
                      </div>
                    )}

                    {/* Ollama model fetch */}
                    {def.id === 'ollama' && isConnected && (
                      <div className="flex gap-2 items-center">
                        <button onClick={handleFetchOllamaModels} className="flex items-center gap-1 text-[11px] text-violet-600 hover:underline">
                          <RefreshCw className="w-3 h-3" /> Fetch available models
                        </button>
                        {ollamaModels.length > 0 && <span className="text-[10px] text-gray-400">{ollamaModels.length} found</span>}
                      </div>
                    )}

                    {/* Connect button (if not connected) */}
                    {!isConnected && !isValidating && (
                      <button onClick={() => handleConnect(def)}
                        disabled={def.needsKey && !(keys[def.id]?.length > 4)}
                        className="w-full py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                        <Wifi className="w-4 h-4" /> Connect
                      </button>
                    )}
                    {isValidating && (
                      <div className="w-full py-2 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Validating…
                      </div>
                    )}
                    {state?.error && (
                      <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> {state.error}</p>
                    )}

                    {/* Model list (shown when connected) */}
                    {isConnected && def.models.length > 0 && (
                      <div className="space-y-1.5 mt-1">
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Models</p>
                        {def.models.map(model => (
                          <div key={model.id}
                            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-800">{model.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{model.recommendedModules.map(m => AI_MODULES.find(am => am.id === m)?.label).filter(Boolean).join(' · ')}</div>
                            </div>
                            <button
                              onClick={() => setAssignPickerFor({ providerId: def.id, modelId: model.id, modelName: model.name, providerName: def.name })}
                              className="ml-3 flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 text-[11px] font-semibold rounded-lg border border-violet-200 transition-colors">
                              Assign <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                        {/* Ollama dynamic models */}
                        {def.id === 'ollama' && ollamaModels.map(m => (
                          <div key={m} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-sm font-semibold text-gray-800 font-mono">{m}</span>
                            <button
                              onClick={() => setAssignPickerFor({ providerId: 'ollama', modelId: m, modelName: m, providerName: 'Ollama' })}
                              className="ml-3 flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-600 text-[11px] font-semibold rounded-lg border border-violet-200 transition-colors">
                              Assign <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
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
  );
}

/* ═══════════════════════════════════════════════════════════════ */
/*  ASSIGNMENTS tab                                               */
/* ═══════════════════════════════════════════════════════════════ */
function AssignmentsTab() {
  const { providerStates, assignments, assignModule, unassignModule, loadedLocalModelIds } = useAIModel();

  type Option = { label: string; assignment: ModuleAssignment };
  const options: Option[] = [];

  /* Connected cloud providers */
  for (const def of PROVIDER_DEFS) {
    if (providerStates[def.id]?.status === 'connected') {
      for (const model of def.models) {
        options.push({ label: `${def.name} → ${model.name}`, assignment: { providerId: def.id, modelId: model.id, providerName: def.name, modelName: model.name, isLocal: false } });
      }
      /* Ollama: would need loaded model list, skip for now since user picks in Cloud tab */
    }
  }

  /* Loaded local models */
  for (const modelId of loadedLocalModelIds) {
    const m = LOCAL_MODELS.find(lm => lm.id === modelId);
    if (m) options.push({ label: `Local AI → ${m.name}`, assignment: { providerId: 'local', modelId, providerName: 'Local AI', modelName: m.name, isLocal: true } });
  }

  const noOptions = options.length === 0;

  return (
    <div>
      {noOptions && (
        <div className="px-8 py-12 text-center space-y-2">
          <Cloud className="w-10 h-10 text-gray-200 mx-auto" />
          <p className="text-sm font-semibold text-gray-400">No AI providers connected yet</p>
          <p className="text-xs text-gray-400">Connect a cloud provider or load a local model first, then assign it here.</p>
        </div>
      )}

      {!noOptions && AI_MODULES.map(module => {
        const current = assignments[module.id];
        const isFallback = !current && !!assignments['global-default'] && module.id !== 'global-default';

        return (
          <div key={module.id} className="px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800">{module.label}</div>
                <div className="text-[11px] text-gray-400">{module.description}</div>
                {current && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="text-[11px] text-green-700 font-medium">{current.providerName} → {current.modelName}</span>
                  </div>
                )}
                {isFallback && !current && (
                  <span className="text-[10px] text-gray-400 italic mt-0.5 block">→ uses Global Default</span>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0 items-end min-w-[160px]">
                <select
                  value={current ? `${current.providerId}::${current.modelId}` : ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) { unassignModule(module.id); return; }
                    const opt = options.find(o => `${o.assignment.providerId}::${o.assignment.modelId}` === val);
                    if (opt) assignModule(module.id, opt.assignment);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white">
                  <option value="">{module.id === 'global-default' ? '— None —' : '— Use Global Default —'}</option>
                  {options.map(o => (
                    <option key={`${o.assignment.providerId}::${o.assignment.modelId}`} value={`${o.assignment.providerId}::${o.assignment.modelId}`}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {current && (
                  <button onClick={() => unassignModule(module.id)} className="text-[10px] text-red-400 hover:text-red-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      <div className="px-5 py-3 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100">
        Assignments are saved to browser storage. Each module runs its AI independently — changing one does not affect others.
      </div>
    </div>
  );
}
