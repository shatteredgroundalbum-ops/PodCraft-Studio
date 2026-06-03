import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Sliders, Rewind, Square, Play, Circle, FastForward } from 'lucide-react';
import { StudioProvider } from '../store/StudioContext';
import { useStudio } from '../store/StudioContext';
import { StudioSidebar } from '../components/studio/StudioSidebar';
import { StudioTopBar } from '../components/studio/StudioTopBar';
import { StudioScriptPanel } from '../components/studio/StudioScriptPanel';
import { StudioAIPanel } from '../components/studio/StudioAIPanel';
import { StudioMixer } from '../components/studio/StudioMixer';
import { AudioSetupModal } from '../components/studio/AudioSetupModal';

function StudioPage() {
  const {
    mixerOpen, setMixerOpen,
    mixerDocked,
    audioSetupDone,
    isPlaying, isRecording, togglePlay, toggleRecord, stop, tracks,
  } = useStudio();

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
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 gap-0 pb-16">

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

      {/* ── Fixed Transport Bar — never moves ──────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-[80] h-16 bg-white border-t border-gray-200 shadow-lg flex items-center justify-between px-6">
        {/* Left: mixer toggle (only shown when floating) */}
        {!mixerDocked && (
          <button
            onClick={() => setMixerOpen(!mixerOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              mixerOpen
                ? 'border-violet-400 bg-violet-100 text-violet-700'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}>
            <Sliders className="w-4 h-4" />
            {mixerOpen ? 'Hide Mixer' : 'Open Mixer'}
          </button>
        )}
        {mixerDocked && <div className="min-w-[120px]" />}

        {/* Center: transport controls */}
        <div className="flex items-center gap-2">
          <button onClick={stop} title="Rewind"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm">
            <Rewind className="w-4 h-4" />
          </button>
          <button onClick={stop} title="Stop"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm">
            <Square className="w-4 h-4 fill-current" />
          </button>
          <button onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}
            className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md border-2 transition-all ${
              isPlaying ? 'bg-green-500 border-green-500 text-white' : 'bg-green-50 border-green-400 text-green-600 hover:bg-green-100'
            }`}>
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </button>
          <button onClick={toggleRecord} title={isRecording ? 'Stop Recording' : 'Record'}
            className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md border-2 transition-all ${
              isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-red-50 border-red-400 text-red-600 hover:bg-red-100'
            }`}>
            <Circle className="w-5 h-5 fill-current" />
          </button>
          <button title="Fast Forward"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm">
            <FastForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: armed track status */}
        <div className="text-right text-[11px] leading-tight min-w-[120px]">
          {isRecording && <div className="text-red-500 font-bold animate-pulse mb-0.5">● RECORDING</div>}
          {tracks.filter(t => t.armed).length > 0
            ? <span className="text-red-500 font-semibold">{tracks.filter(t => t.armed).length} track{tracks.filter(t => t.armed).length !== 1 ? 's' : ''} armed</span>
            : <span className="text-gray-400">No tracks armed</span>}
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
