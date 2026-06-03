import React, { useCallback, useEffect, useState, useRef } from 'react';
import { StudioProvider } from '../store/StudioContext';
import { useStudio } from '../store/StudioContext';
import { StudioSidebar } from '../components/studio/StudioSidebar';
import { StudioTopBar } from '../components/studio/StudioTopBar';
import { StudioScriptPanel } from '../components/studio/StudioScriptPanel';
import { StudioAIPanel } from '../components/studio/StudioAIPanel';
import { StudioMixer } from '../components/studio/StudioMixer';
import { AudioSetupModal } from '../components/studio/AudioSetupModal';

function StudioPage() {
  const { mixerDocked, audioSetupDone } = useStudio();

  const [scriptHeight, setScriptHeight] = useState(300);
  const [aiWidth,      setAiWidth]      = useState(360);
  const [aiCollapsed,  setAiCollapsed]  = useState(false);

  /* Vertical resizer — Script panel height (only active when docked) */
  const scriptDragRef = useRef<{ active: boolean; startY: number; startH: number }>({ active: false, startY: 0, startH: 0 });
  const handleScriptResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    scriptDragRef.current = { active: true, startY: e.clientY, startH: scriptHeight };
  };
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!scriptDragRef.current.active) return;
      setScriptHeight(Math.max(120, Math.min(600, scriptDragRef.current.startH + e.clientY - scriptDragRef.current.startY)));
    };
    const onUp = () => { scriptDragRef.current.active = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);

  /* Horizontal resizer — AI panel width */
  const aiDragRef = useRef<{ active: boolean; startX: number; startW: number }>({ active: false, startX: 0, startW: 0 });
  const handleAiResizeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    aiDragRef.current = { active: true, startX: e.clientX, startW: aiWidth };
  };
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!aiDragRef.current.active) return;
      setAiWidth(Math.max(260, Math.min(640, aiDragRef.current.startW + aiDragRef.current.startX - e.clientX)));
    };
    const onUp = () => { aiDragRef.current.active = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, []);

  const toggleAiCollapsed = useCallback(() => setAiCollapsed((c) => !c), []);

  return (
    <div className="flex w-full h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <StudioSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <StudioTopBar />

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Center column — pb-16 for fixed transport bar */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 gap-0">

            {/* Script panel — fixed height when docked, fills remaining space when floating */}
            <div style={{ height: mixerDocked ? scriptHeight : undefined, flex: mixerDocked ? undefined : '1 1 auto', minHeight: 120 }}>
              <StudioScriptPanel height={mixerDocked ? scriptHeight : undefined} />
            </div>

            {/* Resize handle — only visible when docked */}
            {mixerDocked && (
              <div
                onPointerDown={handleScriptResizeDown}
                className="h-2 my-1 flex items-center justify-center cursor-row-resize group flex-shrink-0"
                style={{ touchAction: 'none' }}>
                <div className="w-12 h-1 bg-gray-300 rounded-full group-hover:bg-violet-500 transition-colors" />
              </div>
            )}

            {/* Mixer renders here — when docked it is a block element; when floating it is position:fixed */}
            <StudioMixer />
          </div>

          {/* AI panel resize handle */}
          {!aiCollapsed && (
            <div
              onPointerDown={handleAiResizeDown}
              className="w-1.5 cursor-col-resize bg-transparent hover:bg-violet-300 transition-colors flex-shrink-0"
              style={{ touchAction: 'none' }} />
          )}

          <StudioAIPanel width={aiWidth} collapsed={aiCollapsed} onToggleCollapsed={toggleAiCollapsed} />
        </div>
      </div>


      {/* Audio Setup modal — shown on first entry */}
      {!audioSetupDone && <AudioSetupModal />}
    </div>
  );
}

export function Studio() {
  return (
    <StudioProvider>
      <StudioPage />
    </StudioProvider>
  );
}
