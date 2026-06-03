import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Mic } from 'lucide-react';
import { StudioProvider, useStudio } from '../store/StudioContext';
import type { RoomProfileSettings } from '../store/StudioContext';
import { AIModelProvider } from '../store/AIModelStore';
import { StudioSidebar } from '../components/studio/StudioSidebar';
import { StudioTopBar } from '../components/studio/StudioTopBar';
import { StudioScriptPanel } from '../components/studio/StudioScriptPanel';
import { StudioAIPanel } from '../components/studio/StudioAIPanel';
import { StudioMixer } from '../components/studio/StudioMixer';
import { AudioSetupModal } from '../components/studio/AudioSetupModal';
import { ProjectSetupWizard } from '../components/studio/ProjectSetupWizard';

/* ── Session storage key ──────────────────────────────────────── */
const LAST_PROFILE_KEY = 'podcraft_last_room_profile_v2';

function hasStoredSession(): boolean {
  try { return !!localStorage.getItem(LAST_PROFILE_KEY); } catch { return false; }
}

/* ── Session entry prompt ─────────────────────────────────────── */
function SessionEntryPrompt({
  hasLastSession,
  onNew,
  onResume,
}: {
  hasLastSession: boolean;
  onNew: () => void;
  onResume: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px] p-8 text-center">
        <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Mic className="w-7 h-7 text-violet-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome to Studio</h2>
        <p className="text-sm text-gray-500 mb-8">
          Start a new recording session or pick up where you left off.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onNew}
            className="w-full py-3.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors"
          >
            New Session
          </button>

          <button
            onClick={onResume}
            disabled={!hasLastSession}
            className="w-full py-3.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Resume Session
            {!hasLastSession && (
              <span className="block text-xs font-normal text-gray-400 mt-0.5">
                No previous session found
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Studio page (inside providers) ──────────────────────── */
type SessionChoice = 'pending' | 'new' | 'resume';

function StudioPage() {
  const { mixerDocked, audioSetupDone, setAudioSetupDone, applyRoomProfile } = useStudio();

  /* Session prompt state */
  const [sessionChoice, setSessionChoice] = useState<SessionChoice>('pending');
  const [showProjectSetup, setShowProjectSetup] = useState(false);
  const hasLastSession = useMemo(() => hasStoredSession(), []);

  const handleNewSession = useCallback(() => {
    /* Clear setup flag so the setup wizard shows again */
    try { localStorage.removeItem('podcraft_audio_setup'); } catch { /* ignore */ }
    setAudioSetupDone(false);
    setSessionChoice('new');
  }, [setAudioSetupDone]);

  const handleResumeSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(LAST_PROFILE_KEY);
      if (stored) {
        const saved = JSON.parse(stored) as {
          roomType: string;
          measurements: { noiseFloorDb: number; reverbMs: number } | null;
          appliedSettings: Omit<RoomProfileSettings, 'roomType' | 'noiseFloorDb' | 'reverbMs'>;
        };
        const profile: RoomProfileSettings = {
          roomType:     saved.roomType,
          noiseFloorDb: saved.measurements?.noiseFloorDb ?? -60,
          reverbMs:     saved.measurements?.reverbMs     ?? 0,
          ...saved.appliedSettings,
        };
        applyRoomProfile(profile);
      }
    } catch { /* ignore parse errors */ }
    setAudioSetupDone(true);
    setSessionChoice('resume');
  }, [applyRoomProfile, setAudioSetupDone]);

  /* Resizer — Script panel height (only when mixer is docked) */
  const [scriptHeight, setScriptHeight] = useState(300);
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

  /* Resizer — AI panel width */
  const [aiWidth, setAiWidth]         = useState(360);
  const [aiCollapsed, setAiCollapsed] = useState(false);
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
          {/* Center column */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 gap-0">
            <div style={{ height: mixerDocked ? scriptHeight : undefined, flex: mixerDocked ? undefined : '1 1 auto', minHeight: 120 }}>
              <StudioScriptPanel height={mixerDocked ? scriptHeight : undefined} />
            </div>

            {mixerDocked && (
              <div
                onPointerDown={handleScriptResizeDown}
                className="h-2 my-1 flex items-center justify-center cursor-row-resize group flex-shrink-0"
                style={{ touchAction: 'none' }}>
                <div className="w-12 h-1 bg-gray-300 rounded-full group-hover:bg-violet-500 transition-colors" />
              </div>
            )}

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

      {/* Session entry prompt — shown first, before setup modal */}
      {sessionChoice === 'pending' && (
        <SessionEntryPrompt
          hasLastSession={hasLastSession}
          onNew={handleNewSession}
          onResume={handleResumeSession}
        />
      )}

      {/* Audio setup wizard — shown after "New Session" if setup not yet done */}
      {sessionChoice !== 'pending' && !audioSetupDone && !showProjectSetup && (
        <AudioSetupModal onProceedToProject={() => setShowProjectSetup(true)} />
      )}

      {/* Project setup wizard — shown after audio setup completes */}
      {showProjectSetup && !audioSetupDone && (
        <ProjectSetupWizard
          onDone={() => { setAudioSetupDone(true); setShowProjectSetup(false); }}
          onSkip={() => { setAudioSetupDone(true); setShowProjectSetup(false); }}
        />
      )}
    </div>
  );
}

export function Studio() {
  return (
    <StudioProvider>
      <AIModelProvider>
        <StudioPage />
      </AIModelProvider>
    </StudioProvider>
  );
}
