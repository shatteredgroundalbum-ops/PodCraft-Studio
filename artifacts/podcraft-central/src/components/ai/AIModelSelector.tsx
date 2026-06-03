import React, { useState, useRef, useEffect } from 'react';
import { Cpu, Cloud, ChevronRight, Zap, XCircle } from 'lucide-react';
import { useAIModel } from '../../store/AIModelStore';
import { LocalAIPanel } from './LocalAIPanel';
import { CloudAIPanel } from './CloudAIPanel';

type Panel = 'local' | 'cloud' | null;

export function AIModelSelector() {
  const { aiMode, runtime, modelName, activeStatus, deactivate } = useAIModel();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPanel = (p: Panel) => {
    setOpen(false);
    setPanel(p);
  };

  const isActive = activeStatus === 'ready' || activeStatus === 'connected';

  return (
    <>
      {/* Trigger button */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          title="Configure AI Model"
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${
            isActive
              ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
          }`}>
          {aiMode === 'local' ? <Cpu className="w-3 h-3" /> : aiMode === 'cloud' ? <Cloud className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
          {isActive ? (modelName ?? 'AI Active') : 'AI Setup'}
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-gray-200 rounded-2xl shadow-2xl py-2 z-[500]">
            <div className="px-3 pb-2 pt-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Mode</p>
              {isActive && (
                <div className="mt-1.5 p-2 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-[10px] text-green-700 font-semibold">
                    {aiMode === 'local' ? 'Local' : 'Cloud'} · {runtime} · {modelName}
                  </div>
                  <div className="text-[9px] text-green-500 capitalize">{activeStatus}</div>
                </div>
              )}
            </div>

            <button onClick={() => openPanel('local')}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Local AI</div>
                  <div className="text-[10px] text-gray-400">Run in browser · no API key</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>

            <button onClick={() => openPanel('cloud')}
              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Cloud AI</div>
                  <div className="text-[10px] text-gray-400">OpenAI · Anthropic · Gemini · Ollama</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>

            {isActive && (
              <>
                <div className="mx-3 my-1 border-t border-gray-100" />
                <button onClick={() => { deactivate(); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
                  <XCircle className="w-4 h-4" /> Disconnect AI
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Slide-out panels */}
      {panel === 'local' && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[290]" onClick={() => setPanel(null)} />
          <LocalAIPanel onClose={() => setPanel(null)} />
        </>
      )}
      {panel === 'cloud' && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[290]" onClick={() => setPanel(null)} />
          <CloudAIPanel onClose={() => setPanel(null)} />
        </>
      )}
    </>
  );
}
