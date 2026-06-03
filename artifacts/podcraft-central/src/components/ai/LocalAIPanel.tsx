import React, { useEffect, useState, useRef } from 'react';
import {
  X, Download, Trash2, Zap, AlertTriangle, Loader2,
  HardDrive, Monitor, ChevronDown,
} from 'lucide-react';
import {
  LOCAL_MODELS, LocalModelConfig, LoadedPipeline,
  checkWebGPU, checkStorage, getInstalledModelIds,
  loadLocalModel, deleteLocalModel, formatBytes,
} from '../../utils/localAI';
import { useAIModel, AI_MODULES, AIModuleId } from '../../store/AIModelStore';

type ModelStatus = 'checking' | 'not-installed' | 'installed' | 'downloading' | 'loading' | 'ready' | 'failed' | 'unsupported';
interface ModelState { status: ModelStatus; progress: number; error?: string; }

const CATEGORY_LABELS: Record<string, string> = {
  'small-fast': 'Small / Fast', 'balanced': 'Balanced',
  'higher-quality': 'Higher Quality', 'experimental': 'Experimental',
};

export function LocalAIPanel({ onClose }: { onClose: () => void }) {
  const { registerLocalPipeline, unregisterLocalPipeline, assignModule, loadedLocalModelIds } = useAIModel();
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  const [storage, setStorage] = useState<{ quota: number; usage: number; available: number } | null>(null);
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>({});
  const [assignPickerFor, setAssignPickerFor] = useState<string | null>(null);
  const pipelines = useRef<Record<string, LoadedPipeline>>({});

  useEffect(() => {
    (async () => {
      const [gpu, stor] = await Promise.all([checkWebGPU(), checkStorage()]);
      setHasWebGPU(gpu);
      setStorage(stor);
      const installed = getInstalledModelIds();
      const states: Record<string, ModelState> = {};
      for (const m of LOCAL_MODELS) {
        if (m.requiresWebGPU && !gpu) states[m.id] = { status: 'unsupported', progress: 0, error: 'WebGPU not available in this browser' };
        else if (loadedLocalModelIds.includes(m.id)) states[m.id] = { status: 'ready', progress: 100 };
        else if (installed.includes(m.id)) states[m.id] = { status: 'installed', progress: 0 };
        else states[m.id] = { status: 'not-installed', progress: 0 };
      }
      setModelStates(states);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setS = (id: string, patch: Partial<ModelState>) =>
    setModelStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleDownloadOrLoad = async (model: LocalModelConfig) => {
    const stor = await checkStorage();
    const curStatus = modelStates[model.id]?.status;
    if (curStatus === 'not-installed' && stor.available < model.sizeBytes) {
      setS(model.id, { status: 'failed', progress: 0, error: `Not enough storage: need ${model.sizeLabel}, ${formatBytes(stor.available)} free` });
      return;
    }
    setS(model.id, { status: 'downloading', progress: 0, error: undefined });
    try {
      const pipe = await loadLocalModel(model, info => {
        if (info.status === 'progress' && info.progress !== undefined) setS(model.id, { status: 'downloading', progress: Math.round(info.progress) });
        else if (info.status === 'done') setS(model.id, { status: 'loading', progress: 100 });
      }, hasWebGPU === true);
      pipelines.current[model.id] = pipe;
      setS(model.id, { status: 'ready', progress: 100 });
      registerLocalPipeline(model.id, pipe, model.name);
    } catch (err) {
      setS(model.id, { status: 'failed', progress: 0, error: err instanceof Error ? err.message : 'Failed' });
    }
  };

  const handleAssign = (moduleId: AIModuleId, model: LocalModelConfig) => {
    assignModule(moduleId, { providerId: 'local', modelId: model.id, providerName: 'Local AI', modelName: model.name, isLocal: true });
    setAssignPickerFor(null);
  };

  const handleDelete = async (model: LocalModelConfig) => {
    if (!window.confirm(`Remove ${model.name} from local storage?`)) return;
    await deleteLocalModel(model.id);
    delete pipelines.current[model.id];
    unregisterLocalPipeline(model.id);
    setS(model.id, { status: 'not-installed', progress: 0, error: undefined });
  };

  const categories = ['small-fast', 'balanced', 'higher-quality', 'experimental'] as const;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl border-l border-gray-200 z-[300] flex flex-col">
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 bg-gradient-to-r from-violet-50 to-white">
        <span className="font-bold text-gray-900 text-sm">Local AI</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-4 text-xs flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Monitor className={`w-3.5 h-3.5 ${hasWebGPU ? 'text-green-500' : 'text-orange-400'}`} />
          <span className={hasWebGPU ? 'text-green-700 font-medium' : 'text-orange-600'}>
            WebGPU: {hasWebGPU === null ? 'Checking…' : hasWebGPU ? 'Available' : 'Not available'}
          </span>
        </div>
        {storage && <div className="flex items-center gap-1.5 text-gray-500"><HardDrive className="w-3.5 h-3.5 text-gray-400" /> {formatBytes(storage.available)} free</div>}
      </div>
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => (
          <div key={cat}>
            <div className="px-5 pt-4 pb-1.5 flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{CATEGORY_LABELS[cat]}</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            {LOCAL_MODELS.filter(m => m.category === cat).map(model => {
              const state = modelStates[model.id] ?? { status: 'checking', progress: 0 };
              const isLoaded = state.status === 'ready' || loadedLocalModelIds.includes(model.id);
              const isBusy = state.status === 'downloading' || state.status === 'loading';
              return (
                <div key={model.id} className="px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-sm text-gray-900">{model.name}</span>
                        <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{model.sizeLabel}</span>
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{model.type}</span>
                        {isLoaded && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">● Loaded</span>}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{model.recommendedUse}</p>
                      <div className="mt-1 text-[10px]">
                        {state.status === 'not-installed' && <span className="text-gray-400">Not installed</span>}
                        {state.status === 'installed' && <span className="text-gray-500">Installed · click Load to activate</span>}
                        {state.status === 'downloading' && <div className="space-y-1"><span className="text-blue-500 font-medium">Downloading {state.progress}%</span><div className="h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${state.progress}%` }} /></div></div>}
                        {state.status === 'loading' && <span className="text-violet-500 font-medium">Loading into memory…</span>}
                        {isLoaded && <span className="text-green-600 font-semibold">● Ready — assign to a module to use</span>}
                        {state.status === 'failed' && <span className="text-red-500">{state.error ?? 'Failed'}</span>}
                        {state.status === 'unsupported' && <span className="text-orange-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{state.error}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-shrink-0 relative">
                      {state.status === 'unsupported' && <span className="text-[9px] text-gray-400">Incompatible</span>}
                      {(state.status === 'not-installed' || state.status === 'failed') && (
                        <button onClick={() => handleDownloadOrLoad(model)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                          <Download className="w-3 h-3" /> {state.status === 'failed' ? 'Retry' : 'Download'}
                        </button>
                      )}
                      {state.status === 'installed' && (
                        <button onClick={() => handleDownloadOrLoad(model)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-lg transition-colors">
                          <Zap className="w-3 h-3" /> Load
                        </button>
                      )}
                      {isBusy && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 text-[11px] rounded-lg">
                          <Loader2 className="w-3 h-3 animate-spin" /> {state.status === 'downloading' ? 'Downloading…' : 'Loading…'}
                        </div>
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
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-violet-50 text-gray-700 hover:text-violet-700">
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      {(state.status === 'installed' || isLoaded) && (
                        <button onClick={() => handleDelete(model)}
                          className="flex items-center gap-1 px-2 py-1 text-red-400 hover:text-red-600 text-[10px] rounded hover:bg-red-50">
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
      </div>
    </div>
  );
}
