import React, { useCallback, useEffect, useState, useRef } from 'react';
import { X, Minus } from 'lucide-react';
import { useStudio, Track } from '../../store/StudioContext';

export function StudioMixer() {
  const { tracks, updateTrack, masterVolume, setMasterVolume, mixerOpen, setMixerOpen } = useStudio();
  const [position, setPosition] = useState(() => ({
    x: Math.max(20, window.innerWidth - 740),
    y: 80, // start near the top, well clear of transport
  }));
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ active: boolean; offsetX: number; offsetY: number }>({ active: false, offsetX: 0, offsetY: 0 });

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { active: true, offsetX: e.clientX - position.x, offsetY: e.clientY - position.y };
    setDragging(true);
  }, [position.x, position.y]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragRef.current.offsetX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.offsetY)),
      });
    };
    const onUp = () => { dragRef.current.active = false; setDragging(false); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]);

  if (!mixerOpen) return null;

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: position.x, top: position.y, width: Math.min(840, tracks.length * 82 + 160), touchAction: 'none' }}>

      {/* Drag handle */}
      <div
        className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleHeaderPointerDown}
        style={{ touchAction: 'none', userSelect: 'none' }}>
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-0.5">{[0,1,2].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}</div>
          <span className="font-semibold text-sm text-gray-700">Mixer</span>
          <span className="text-[10px] text-gray-400 ml-1">{tracks.length} tracks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-violet-100 rounded-full px-2 py-0.5 pointer-events-none">
            <span className="text-[10px] font-bold text-violet-700">LIVE</span>
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
          </div>
          <button onClick={() => setMinimized(!minimized)} className="text-gray-400 hover:text-gray-600"><Minus className="w-4 h-4" /></button>
          <button onClick={() => setMixerOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {!minimized && (
        <div className="flex p-4 gap-3 overflow-x-auto" style={{ touchAction: 'auto' }}>
          {tracks.map((track) => <MixerChannel key={track.id} track={track} updateTrack={updateTrack} />)}
          <div className="w-px bg-gray-200 mx-1 self-stretch" />
          <MasterChannel masterVolume={masterVolume} setMasterVolume={setMasterVolume} />
        </div>
      )}
    </div>
  );
}

/* ── Pan knob — drag left/right to pan ─────────────────────── */
function PanKnob({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(0);
  const deg = value * 135; // -135° (full left) → 0° (center) → 135° (full right)

  const panLabel = value === 0 ? 'C' : value < 0 ? `L${Math.round(-value * 100)}` : `R${Math.round(value * 100)}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-9 h-9 rounded-full border-2 relative cursor-ew-resize"
        style={{ borderColor: color, touchAction: 'none', userSelect: 'none' }}
        onPointerDown={(e) => {
          isDragging.current = true;
          startX.current = e.clientX;
          startVal.current = value;
          e.currentTarget.setPointerCapture(e.pointerId);
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          if (!isDragging.current) return;
          const delta = (e.clientX - startX.current) * 0.015;
          onChange(Math.max(-1, Math.min(1, startVal.current + delta)));
          e.stopPropagation();
        }}
        onPointerUp={(e) => {
          isDragging.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onDoubleClick={() => onChange(0)} /* double-click to reset */
        title="Pan (drag L/R · double-click to center)">
        {/* Center tick */}
        <div
          className="absolute rounded-full bg-gray-700"
          style={{
            width: 2,
            height: 10,
            top: '50%',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: `translate(-50%, -100%) rotate(${deg}deg)`,
          }}
        />
        {/* Center guide dot */}
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300" />
      </div>
      <span className="text-[9px] font-mono text-gray-500">{panLabel}</span>
    </div>
  );
}

/* ── Vertical fader ─────────────────────────────────────────── */
function VerticalFader({ value, onChange, color, min = 0, max = 1.5 }: {
  value: number; onChange: (v: number) => void; color: string; min?: number; max?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateFromY = useCallback((clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = 1 - (clientY - rect.top) / rect.height;
    onChange(min + Math.max(0, Math.min(1, pct)) * (max - min));
  }, [onChange, min, max]);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      className="relative w-8 flex justify-center cursor-pointer"
      style={{ height: 160, touchAction: 'none', userSelect: 'none' }}
      onPointerDown={(e) => {
        e.stopPropagation();
        isDragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateFromY(e.clientY);
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return;
        e.stopPropagation();
        updateFromY(e.clientY);
      }}
      onPointerUp={(e) => {
        isDragging.current = false;
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }
      }}
      onPointerCancel={(e) => {
        isDragging.current = false;
        try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }
      }}>
      {/* Track rail */}
      <div className="absolute top-1 bottom-1 w-0.5 bg-gray-200 rounded-full">
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute w-2 h-px bg-gray-300" style={{ top: `${p}%`, left: -3 }} />
        ))}
      </div>
      {/* Fader cap */}
      <div
        className="absolute w-8 h-6 bg-white border border-gray-300 shadow-md rounded-md flex items-center justify-center pointer-events-none"
        style={{ bottom: `calc(${pct}% - 12px)` }}>
        <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Per-track channel strip ────────────────────────────────── */
function MixerChannel({ track, updateTrack }: { track: Track; updateTrack: (id: string, updates: Partial<Track>) => void }) {
  const db = ((track.volume - 1) * 12).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 68 }}>
      <span className="text-[10px] font-bold text-gray-900 truncate w-full text-center" title={track.name}>
        {track.name}
      </span>

      {/* M / S buttons */}
      <div className="flex gap-1">
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => updateTrack(track.id, { muted: !track.muted })}
          className={`w-7 h-6 rounded text-xs font-bold transition-colors ${track.muted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          M
        </button>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
          className={`w-7 h-6 rounded text-xs font-bold transition-colors ${track.soloed ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          S
        </button>
      </div>

      {/* Pan knob */}
      <PanKnob
        value={track.pan}
        onChange={(v) => updateTrack(track.id, { pan: v })}
        color={track.color}
      />

      {/* Volume fader */}
      <VerticalFader
        value={track.volume}
        onChange={(v) => updateTrack(track.id, { volume: v })}
        color={track.color}
      />

      {/* dB readout */}
      <div className="w-14 py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">
        {db} dB
      </div>
    </div>
  );
}

/* ── Master channel ─────────────────────────────────────────── */
function MasterChannel({ masterVolume, setMasterVolume }: { masterVolume: number; setMasterVolume: (v: number) => void }) {
  const db = ((masterVolume - 1) * 12).toFixed(1);

  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 68 }}>
      <span className="text-[10px] font-bold text-gray-900 w-full text-center">Master</span>
      <div className="flex gap-1">
        <button className="w-7 h-6 rounded bg-gray-100 text-gray-400 text-xs font-bold cursor-default">M</button>
        <button className="w-7 h-6 rounded bg-gray-100 text-gray-400 text-xs font-bold cursor-default">S</button>
      </div>

      {/* master pan locked to center */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-9 h-9 rounded-full border-2 border-gray-300 relative" title="Master pan (fixed center)">
          <div className="absolute rounded-full bg-gray-400" style={{ width: 2, height: 10, top: '50%', left: '50%', transformOrigin: '50% 100%', transform: 'translate(-50%, -100%) rotate(0deg)' }} />
          <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300" />
        </div>
        <span className="text-[9px] font-mono text-gray-400">C</span>
      </div>

      <div className="relative">
        <div className="absolute -left-7 top-0 bottom-0 flex flex-col justify-between text-[8px] text-gray-400 font-mono pr-1">
          {['+12', '+6', '0', '-6', '-12', '-24', '-∞'].map((l) => <span key={l}>{l}</span>)}
        </div>
        <VerticalFader value={masterVolume} onChange={setMasterVolume} color="#8b5cf6" />
      </div>

      <div className="w-14 py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">
        {db} dB
      </div>
      <span className="text-[9px] text-gray-400">Stereo Out</span>
    </div>
  );
}
