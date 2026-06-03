import React, { useCallback, useEffect, useState, useRef } from 'react';
import { X, Minus } from 'lucide-react';
import { useStudio, Track } from '../../store/StudioContext';

export function StudioMixer() {
  const { tracks, updateTrack, masterVolume, setMasterVolume, mixerOpen, setMixerOpen } = useStudio();
  const [position, setPosition] = useState(() => ({
    x: Math.max(20, window.innerWidth - 700),
    y: Math.max(20, window.innerHeight - 560),
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
    const handleMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragRef.current.offsetX)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.offsetY)),
      });
    };
    const handleUp = () => { dragRef.current.active = false; setDragging(false); };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragging]);

  if (!mixerOpen) return null;

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: position.x, top: position.y, width: Math.min(820, tracks.length * 80 + 140), touchAction: 'none' }}>
      <div
        className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 select-none ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleHeaderPointerDown}
        style={{ touchAction: 'none' }}>
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}
          </div>
          <span className="font-semibold text-sm text-gray-700">Mixer</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-violet-100 rounded-full px-2 py-0.5">
            <span className="text-[10px] font-bold text-violet-700">ON</span>
            <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
          </div>
          <button onClick={() => setMinimized(!minimized)} className="text-gray-400 hover:text-gray-600">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => setMixerOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="flex p-4 gap-2 overflow-x-auto" style={{ touchAction: 'auto' }}>
          {tracks.map((track) => <MixerChannel key={track.id} track={track} updateTrack={updateTrack} />)}
          <div className="w-px bg-gray-200 mx-2" />
          <MasterChannel masterVolume={masterVolume} setMasterVolume={setMasterVolume} />
        </div>
      )}
    </div>
  );
}

function VerticalFader({ value, onChange, color, min = 0, max = 1.5 }: {
  value: number; onChange: (v: number) => void; color: string; min?: number; max?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const updateFromY = useCallback((clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = 1 - (clientY - rect.top) / rect.height;
    onChange(min + Math.max(0, Math.min(1, pct)) * (max - min));
  }, [onChange, min, max]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateFromY(e.clientY);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    updateFromY(e.clientY);
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ }
  };

  const pct = (value - min) / (max - min) * 100;
  return (
    <div ref={trackRef} className="relative h-48 w-8 flex justify-center cursor-pointer touch-none"
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}>
      <div className="absolute top-1 bottom-1 w-0.5 bg-gray-200 rounded-full">
        {[0, 20, 40, 60, 80, 100].map((p) => (
          <div key={p} className="absolute w-3 h-px bg-gray-300 -left-[5px]" style={{ top: `${p}%` }} />
        ))}
      </div>
      <div className="absolute w-8 h-6 bg-white border border-gray-300 shadow-md rounded flex flex-col justify-center items-center pointer-events-none"
        style={{ bottom: `calc(${pct}% - 12px)` }}>
        <div className="w-6 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function MixerChannel({ track, updateTrack }: { track: Track; updateTrack: (id: string, updates: Partial<Track>) => void }) {
  return (
    <div className="w-16 flex flex-col items-center flex-shrink-0">
      <span className="text-[10px] font-bold text-gray-900 mb-2 truncate w-full text-center" title={track.name}>{track.name}</span>
      <div className="flex gap-1 mb-4">
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => updateTrack(track.id, { muted: !track.muted })}
          className={`w-6 h-6 rounded text-xs font-bold transition-colors ${track.muted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
          className={`w-6 h-6 rounded text-xs font-bold transition-colors ${track.soloed ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>S</button>
      </div>
      <div className="w-8 h-8 rounded-full border-2 relative mb-6" style={{ borderColor: track.color }}>
        <div className="absolute top-1/2 left-1/2 w-1 h-3 bg-gray-400 rounded-full -translate-x-1/2 -translate-y-full" />
      </div>
      <div className="mb-4">
        <VerticalFader value={track.volume} onChange={(v) => updateTrack(track.id, { volume: v })} color={track.color} />
      </div>
      <div className="w-12 py-1 bg-white border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">
        {((track.volume - 1) * 12).toFixed(1)}
      </div>
    </div>
  );
}

function MasterChannel({ masterVolume, setMasterVolume }: { masterVolume: number; setMasterVolume: (v: number) => void }) {
  return (
    <div className="w-16 flex flex-col items-center flex-shrink-0">
      <span className="text-[10px] font-bold text-gray-900 mb-2 truncate w-full text-center">Master</span>
      <div className="flex gap-1 mb-4">
        <button className="w-6 h-6 rounded bg-gray-100 text-gray-400 text-xs font-bold">M</button>
        <button className="w-6 h-6 rounded bg-gray-100 text-gray-400 text-xs font-bold">S</button>
      </div>
      <div className="w-8 h-8 rounded-full border-2 border-gray-200 relative mb-6">
        <div className="absolute top-1/2 left-1/2 w-1 h-3 bg-gray-400 rounded-full -translate-x-1/2 -translate-y-full" />
      </div>
      <div className="mb-4 relative">
        <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-[8px] text-gray-400 font-mono">
          {['+12', '+6', '0', '-6', '-12', '-24', '-∞'].map((l) => <span key={l}>{l}</span>)}
        </div>
        <VerticalFader value={masterVolume} onChange={setMasterVolume} color="#8b5cf6" />
      </div>
      <div className="w-12 py-1 bg-white border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">
        {((masterVolume - 1) * 12).toFixed(1)}
      </div>
      <span className="text-[10px] text-gray-500 mt-2">Stereo Out</span>
    </div>
  );
}
