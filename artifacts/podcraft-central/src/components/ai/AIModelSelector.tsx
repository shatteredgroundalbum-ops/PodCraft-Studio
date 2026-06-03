import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useAIModel } from '../../store/AIModelStore';
import { AISetupPanel } from './AISetupPanel';

export function AIModelSelector() {
  const { providerStates, loadedLocalModelIds, assignments } = useAIModel();
  const [open, setOpen] = useState(false);

  const connectedCount = Object.values(providerStates).filter(s => s.status === 'connected').length
    + loadedLocalModelIds.length;
  const assignedCount = Object.values(assignments).filter(Boolean).length;
  const isActive = connectedCount > 0;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="AI Setup"
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-semibold transition-all ${
          isActive
            ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-600'
        }`}>
        <Zap className="w-3 h-3" />
        {isActive ? `${connectedCount} AI${assignedCount ? ` · ${assignedCount} assigned` : ''}` : 'AI Setup'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/20 z-[290]" onClick={() => setOpen(false)} />
          <AISetupPanel onClose={() => setOpen(false)} />
        </>
      )}
    </>
  );
}
