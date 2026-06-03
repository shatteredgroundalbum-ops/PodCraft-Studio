import React, { useEffect, useState, useRef } from 'react';
import {
  X, Download, Trash2, Zap, CheckCircle2, AlertTriangle, Loader2,
  HardDrive, Monitor, Cpu, ChevronRight,
} from 'lucide-react';
import {
  LOCAL_MODELS, LocalModelConfig, LoadedPipeline,
  checkWebGPU, checkStorage, getInstalledModelIds,
  loadLocalModel, localInfer, deleteLocalModel, formatBytes,
} from '../../utils/localAI';
import { useAIModel } from '../../store/AIModelStore';

type ModelStatus = 'checking' | 'not-installed' | 'installed' | 'downloading' | 'loading' | 'ready' | 'failed' | 'unsupported';

interface ModelState {
  status: ModelStatus;
  progress: number;
  error?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'small-fast': 'Small / Fast',
  'balanced': 'Balanced',
  'higher-quality': 'Higher Quality',
  'experimental': 'Experimental',
};

const SYSTEM_PROMPT =
  'You are an AI podcast producer assistant inside PodCraft Central. Help with show notes, episode titles, guest research, interview questions, scripting, production decisions, and audio quality tips. Be concise and actionable.';

export function LocalAIPanel({ onClose }: { onClose: () => void }) {
  const { activateLocal, deactivate, aiMode, modelName } = useAIModel();
  const [hasWebGPU, setHasWebGPU] = useState<boolean | null>(null);
  const [storage, setStorage] = useState<{ quota: number; usage: number; available: number } | null>(null);
  const [modelStates, setModelStates] = useState<Record<string, ModelState>>({});
  const [activeModelId, setActiveModelId] = useState<string | null>(
    aiMode === 'local' ? (LOCAL_MODELS.find(m => m.name === modelName)?.id ?? null) : null,
  );
  const pipelines = useRef<Record<string, LoadedPipeline>>({});

  useEffect(() => {
    (async () => {
      const [gpu, stor] = await Promise.all([checkWebGPU(), checkStorage()]);
      setHasWebGPU(gpu);
      setStorage(stor);

      const installed = getInstalledModelIds();
      const states: Record<string, ModelState> = {};
      for (const m of LOCAL_MODELS) {
        if (m.requiresWebGPU && !gpu) {
          states[m.id] = { status: 'unsupported', progress: 0, error: 'WebGPU not available in this browser' };
        } else if (installed.includes(m.id)) {
          states[m.id] = { status: 'installed', progress: 0 };
        } else {
          states[m.id] = { status: 'not-installed', progress: 0 };
        }
      }
      setModelStates(states);
    })();
  }, []);

  const set = (id: string, patch: Partial<ModelState>) =>
    setModelStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleDownload = async (model: LocalModelConfig) => {
    const stor = await checkStorage();
    if (stor.available < model.sizeBytes) {
      set(model.id, {
        status: 'failed',
        progress: 0,
        error: `Not enough storage: need ${model.sizeLabel}, ${formatBytes(stor.available)} available`,
      });
      return;
    }

    set(model.id, { status: 'downloading', progress: 0, error: undefined });

    try {
      const pipe = await loadLocalModel(model, (info) => {
        if (info.status === 'progress' && info.progress !== undefined) {
          set(model.id, { status: 'downloading', progress: Math.round(info.progress) });
        } else if (info.status === 'done') {
          set(model.id, { status: 'loading', progress: 100 });
        }
      }, hasWebGPU === true);

      pipelines.current[model.id] = pipe;
      set(model.id, { status: 'ready', progress: 100 });
    } catch (err) {
      set(model.id, { status: 'failed', progress: 0, error: err instanceof Error ? err.message : 'Download failed' });
    }
  };

  const handleLoad = async (model: LocalModelConfig) => {
    if (pipelines.current[model.id]) {
      activate(model, pipelines.current[model.id]);
      return;
    }
    set(model.id, { status: 'loading', progress: 0, error: undefined });
    try {
      const pipe = await loadLocalModel(model, (info) => {
        if (info.status === 'ready') set(model.id, { status: 'loading', progress: 100 });
      }, hasWebGPU === true);
      pipelines.current[model.id] = pipe;
      set(model.id, { status: 'ready', progress: 100 });
      activate(model, pipe);
    } catch (err) {
      set(model.id, { status: 'failed', progress: 0, error: err instanceof Error ? err.message : 'Load failed' });
    }
  };

  const activate = (model: LocalModelConfig, pipe: LoadedPipeline) => {
    setActiveModelId(model.id);
    activateLocal('Transformers.js', model.name, async (history) =>
      localInfer(pipe, [{ role: 'system', content: SYSTEM_PROMPT }, ...history]),
    );
  };

  const handleDeactivate = () => {
    setActiveModelId(null);
    deactivate();
  };

  const handleDelete = async (model: LocalModelConfig) => {
    if (!window.confirm(`Remove ${model.name} from local storage?`)) return;
    try {
      await deleteLocalModel(model.id);
      delete pipelines.current[model.id];
      if (activeModelId === model.id) handleDeactivate();
      set(model.id, { status: 'not-installed', progress: 0, error: undefined });
    } catch (err) {
      set(model.id, { status: 'failed', progress: 0, error: err instanceof Error ? err.message : 'Remove failed' });
    }
  };

  const categories = ['small-fast', 'balanced', 'higher-quality', 'experimental'] as const;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[520px] bg-white shadow-2xl border-l border-gray-200 z-[300] flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-5 flex-shrink-0 bg-gradient-to-r from-violet-50 to-white">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-violet-600" />
          <div>
            <span className="font-bold text-gray-900 text-sm">Local AI</span>
            <div className="text-[10px] text-gray-500">Transformers.js · runs entirely in your browser</div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* System info bar */}
      <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Monitor className={`w-3.5 h-3.5 ${hasWebGPU ? 'text-green-500' : hasWebGPU === false ? 'text-orange-400' : 'text-gray-300'}`} />
            <span className={hasWebGPU ? 'text-green-700 font-medium' : hasWebGPU === false ? 'text-orange-600' : 'text-gray-400'}>
              WebGPU: {hasWebGPU === null ? 'Checking…' : hasWebGPU ? 'Available' : 'Not available'}
            </span>
          </div>
          {storage && (
            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-gray-500">{formatBytes(storage.available)} free</span>
            </div>
          )}
        </div>
        <span className="text-[9px] text-gray-400">Cached in browser storage</span>
      </div>

      {/* Active model banner */}
      {activeModelId && (
        <div className="mx-4 mt-3 mb-1 rounded-xl bg-green-50 border border-green-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-green-800">Active: </span>
              <span className="text-green-700">{LOCAL_MODELS.find(m => m.id === activeModelId)?.name}</span>
              <span className="text-green-500 ml-1">· Transformers.js · Ready</span>
            </div>
          </div>
          <button onClick={handleDeactivate} className="text-[10px] text-green-600 hover:text-red-600 font-semibold px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
            Disconnect
          </button>
        </div>
      )}

      {/* Model list */}
      <div className="flex-1 overflow-y-auto">
        {categories.map(cat => {
          const models = LOCAL_MODELS.filter(m => m.category === cat);
          return (
            <div key={cat}>
              <div className="px-5 pt-4 pb-1.5 flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{CATEGORY_LABELS[cat]}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-0">
                {models.map(model => (
                  <ModelRow
                    key={model.id}
                    model={model}
                    state={modelStates[model.id] ?? { status: 'checking', progress: 0 }}
                    isActive={activeModelId === model.id}
                    onDownload={() => handleDownload(model)}
                    onLoad={() => handleLoad(model)}
                    onDelete={() => handleDelete(model)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        <div className="px-5 py-4 text-[10px] text-gray-400 leading-relaxed border-t border-gray-100 mt-2">
          <strong>Note:</strong> Models are stored in browser Cache Storage. "Remove" clears the record and attempts to delete cached files; some browser-cached data may remain until manually cleared via browser settings.
        </div>
      </div>
    </div>
  );
}

function ModelRow({
  model, state, isActive, onDownload, onLoad, onDelete,
}: {
  model: LocalModelConfig;
  state: ModelState;
  isActive: boolean;
  onDownload: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const { status, progress, error } = state;
  const isBusy = status === 'downloading' || status === 'loading';

  return (
    <div className={`px-5 py-3.5 border-b border-gray-100 transition-colors ${isActive ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-semibold text-sm text-gray-900">{model.name}</span>
            <span className="text-[9px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{model.sizeLabel}</span>
            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-medium">{model.type}</span>
            {isActive && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">● ACTIVE</span>}
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">{model.recommendedUse}</p>

          {/* Status line */}
          <div className="mt-1">
            {status === 'checking' && <span className="text-[10px] text-gray-400">Checking…</span>}
            {status === 'not-installed' && <span className="text-[10px] text-gray-400">Not installed</span>}
            {status === 'installed' && <span className="text-[10px] text-gray-500">Installed · click Use Model to load</span>}
            {status === 'downloading' && (
              <div className="space-y-1">
                <span className="text-[10px] text-blue-500 font-medium">Downloading {progress}%</span>
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden w-full">
                  <div className="h-full bg-blue-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {status === 'loading' && <span className="text-[10px] text-violet-500 font-medium">Loading into memory…</span>}
            {status === 'ready' && !isActive && <span className="text-[10px] text-green-600 font-semibold">Loaded · ready to use</span>}
            {status === 'ready' && isActive && <span className="text-[10px] text-green-700 font-bold">● Ready</span>}
            {status === 'failed' && <span className="text-[10px] text-red-500 font-medium">{error ?? 'Failed'}</span>}
            {status === 'unsupported' && (
              <span className="text-[10px] text-orange-500 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {error}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
          {status === 'unsupported' && (
            <span className="text-[9px] text-gray-400 font-medium">Incompatible</span>
          )}
          {(status === 'not-installed') && (
            <button onClick={onDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-lg transition-colors shadow-sm">
              <Download className="w-3 h-3" /> Download
            </button>
          )}
          {status === 'installed' && (
            <button onClick={onLoad}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold rounded-lg transition-colors shadow-sm">
              <Zap className="w-3 h-3" /> Use Model
            </button>
          )}
          {isBusy && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 text-[11px] rounded-lg">
              <Loader2 className="w-3 h-3 animate-spin" />
              {status === 'downloading' ? 'Downloading…' : 'Loading…'}
            </div>
          )}
          {status === 'ready' && !isActive && (
            <button onClick={onLoad}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold rounded-lg transition-colors shadow-sm">
              <Zap className="w-3 h-3" /> Use Model
            </button>
          )}
          {status === 'failed' && (
            <button onClick={onDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 text-[11px] font-semibold rounded-lg transition-colors">
              <Download className="w-3 h-3" /> Retry
            </button>
          )}
          {(status === 'installed' || status === 'ready') && (
            <button onClick={onDelete}
              className="flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-500 text-[10px] font-medium rounded-lg border border-red-100 transition-colors">
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
