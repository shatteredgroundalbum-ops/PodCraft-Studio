import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Minus, Rewind, Square, Play, Circle, FastForward, Music, Zap, Plus } from 'lucide-react';
import { useStudio, Track } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

/* ── Pad data ─────────────────────────────────────────────────── */
interface PadData {
  id: number;
  label: string;
  buffer: AudioBuffer | null;
  filename: string;
  playing: boolean;
}

const makePads = (): PadData[] =>
  Array.from({ length: 12 }, (_, i) => ({
    id: i,
    label: i < 6 ? `M${i + 1}` : `S${i - 5}`,
    buffer: null,
    filename: '',
    playing: false,
  }));

/* ── Main mixer component ─────────────────────────────────────── */
export function StudioMixer() {
  const {
    tracks, updateTrack, masterVolume, setMasterVolume,
    isPlaying, isRecording, togglePlay, toggleRecord, stop,
    mixerOpen, setMixerOpen,
  } = useStudio();

  const [position, setPosition] = useState(() => ({
    x: Math.max(20, window.innerWidth - 820),
    y: 80,
  }));
  const [minimized, setMinimized] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ active: boolean; ox: number; oy: number }>({ active: false, ox: 0, oy: 0 });

  const handleHeaderPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { active: true, ox: e.clientX - position.x, oy: e.clientY - position.y };
    setDragging(true);
  }, [position.x, position.y]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragRef.current.ox)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.oy)),
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

  const channelW = tracks.length * 82 + 180; // channels + master
  const mixerW = Math.min(1200, Math.max(700, channelW + 280)); // +280 for pads

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: position.x, top: position.y, width: mixerW, touchAction: 'none' }}>

      {/* ── Title bar ── */}
      <div
        className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleHeaderPointerDown}
        style={{ touchAction: 'none', userSelect: 'none' }}>
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-0.5">{[0, 1, 2].map((i) => <div key={i} className="w-1 h-1 rounded-full bg-gray-300" />)}</div>
          <span className="font-semibold text-sm text-gray-700">Mixer</span>
          <span className="text-[10px] text-gray-400 ml-1">{tracks.length} tracks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-violet-100 rounded-full px-2 py-0.5 pointer-events-none">
            <span className="text-[10px] font-bold text-violet-700">LIVE</span>
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
          </div>
          <button onClick={() => setMinimized(!minimized)} className="text-gray-400 hover:text-gray-600 p-0.5"><Minus className="w-4 h-4" /></button>
          <button onClick={() => setMixerOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* ── Channel strips + Pads ── */}
      {!minimized && (
        <div className="flex" style={{ touchAction: 'auto' }}>
          {/* Channel strips */}
          <div className="flex px-4 pt-4 pb-2 gap-3 overflow-x-auto flex-shrink-0">
            {tracks.map((track) => <MixerChannel key={track.id} track={track} updateTrack={updateTrack} />)}
            <div className="w-px bg-gray-200 mx-1 self-stretch" />
            <MasterChannel masterVolume={masterVolume} setMasterVolume={setMasterVolume} />
          </div>

          {/* Divider */}
          <div className="w-px bg-gray-200 my-3 flex-shrink-0" />

          {/* Sound pads */}
          <SoundPadSection />
        </div>
      )}

      {/* ── Transport dock ── */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-center flex-shrink-0">
        <div className="flex items-center gap-2">

          <button onClick={stop} onPointerDown={(e) => e.stopPropagation()} title="Rewind to start"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 shadow-sm transition-all">
            <Rewind className="w-5 h-5" />
          </button>

          <button onClick={stop} onPointerDown={(e) => e.stopPropagation()} title="Stop"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 shadow-sm transition-all">
            <Square className="w-5 h-5 fill-current" />
          </button>

          <button onClick={togglePlay} onPointerDown={(e) => e.stopPropagation()} title={isPlaying ? 'Pause' : 'Play'}
            className={`w-14 h-14 flex items-center justify-center rounded-full shadow-md transition-all border-2 ${
              isPlaying
                ? 'bg-green-500 border-green-500 text-white shadow-green-200'
                : 'bg-green-50 border-green-400 text-green-600 hover:bg-green-100 hover:border-green-500'
            }`}>
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>

          <button onClick={toggleRecord} onPointerDown={(e) => e.stopPropagation()} title={isRecording ? 'Stop Recording' : 'Record'}
            className={`w-14 h-14 flex items-center justify-center rounded-full shadow-md transition-all border-2 ${
              isRecording
                ? 'bg-red-500 border-red-500 text-white shadow-red-200 animate-pulse'
                : 'bg-red-50 border-red-400 text-red-600 hover:bg-red-100 hover:border-red-500'
            }`}>
            <Circle className="w-6 h-6 fill-current" />
          </button>

          <button onPointerDown={(e) => e.stopPropagation()} title="Fast Forward"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300 shadow-sm transition-all">
            <FastForward className="w-5 h-5" />
          </button>

        </div>
      </div>
    </div>
  );
}

/* ── Sound pad section ────────────────────────────────────────── */
function SoundPadSection() {
  const [pads, setPads] = useState<PadData[]>(makePads);
  const [padVolume, setPadVolume] = useState(0.8);
  const padGainRef = useRef<GainNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingPadRef = useRef(-1);
  const activeSources = useRef(new Map<number, AudioBufferSourceNode>());

  const getPadGain = useCallback(() => {
    if (padGainRef.current) return padGainRef.current;
    engine.init();
    if (!engine.ctx || !engine.masterGain) return null;
    const g = engine.ctx.createGain();
    g.gain.value = padVolume;
    g.connect(engine.masterGain);
    padGainRef.current = g;
    return g;
  }, [padVolume]);

  const handlePadClick = (pad: PadData) => {
    if (!pad.buffer) {
      loadingPadRef.current = pad.id;
      fileInputRef.current?.click();
      return;
    }
    engine.init();
    const gain = getPadGain();
    if (!gain || !engine.ctx) return;
    // stop if already playing
    const existing = activeSources.current.get(pad.id);
    if (existing) { try { existing.stop(); } catch { /* ok */ } activeSources.current.delete(pad.id); }
    const src = engine.ctx.createBufferSource();
    src.buffer = pad.buffer;
    src.connect(gain);
    src.start();
    src.onended = () => {
      activeSources.current.delete(pad.id);
      setPads((prev) => prev.map((p) => p.id === pad.id ? { ...p, playing: false } : p));
    };
    activeSources.current.set(pad.id, src);
    setPads((prev) => prev.map((p) => p.id === pad.id ? { ...p, playing: true } : p));
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loadingPadRef.current === -1) return;
    engine.init();
    if (!engine.ctx) return;
    try {
      const buf = await engine.ctx.decodeAudioData(await file.arrayBuffer());
      const padId = loadingPadRef.current;
      const shortName = file.name.replace(/\.[^/.]+$/, '').slice(0, 9);
      setPads((prev) => prev.map((p) => p.id === padId ? { ...p, buffer: buf, filename: file.name, label: shortName } : p));
    } catch { /* unsupported format */ }
    loadingPadRef.current = -1;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearPad = (id: number) => {
    const src = activeSources.current.get(id);
    if (src) { try { src.stop(); } catch { /* ok */ } activeSources.current.delete(id); }
    setPads((prev) => prev.map((p) => p.id === id
      ? { ...p, buffer: null, filename: '', label: p.id < 6 ? `M${p.id + 1}` : `S${p.id - 5}`, playing: false }
      : p));
  };

  const updatePadVolume = (v: number) => {
    setPadVolume(v);
    if (padGainRef.current) padGainRef.current.gain.value = v;
  };

  const musicPads = pads.slice(0, 6);
  const sfxPads = pads.slice(6, 12);
  const padDb = padVolume <= 0 ? '-∞' : (20 * Math.log10(padVolume)).toFixed(1);

  return (
    <div className="flex gap-3 px-3 pt-4 pb-2 flex-shrink-0">
      {/* Pad grids */}
      <div className="flex flex-col gap-3">

        {/* Music row */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Music className="w-3 h-3 text-blue-500" />
            <span className="text-[9px] font-bold text-blue-600 tracking-widest uppercase">Music</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {musicPads.map((pad) => (
              <PadButton key={pad.id} pad={pad} type="music"
                onClick={() => handlePadClick(pad)}
                onClear={() => clearPad(pad.id)} />
            ))}
          </div>
        </div>

        {/* SFX row */}
        <div>
          <div className="flex items-center gap-1 mb-1.5">
            <Zap className="w-3 h-3 text-orange-500" />
            <span className="text-[9px] font-bold text-orange-600 tracking-widest uppercase">SFX</span>
          </div>
          <div className="grid grid-cols-6 gap-1">
            {sfxPads.map((pad) => (
              <PadButton key={pad.id} pad={pad} type="sfx"
                onClick={() => handlePadClick(pad)}
                onClear={() => clearPad(pad.id)} />
            ))}
          </div>
        </div>
      </div>

      {/* Pad volume fader */}
      <div className="flex flex-col items-center gap-1 pl-2 border-l border-gray-100">
        <span className="text-[9px] font-bold text-gray-400 tracking-wider">PAD</span>
        <VerticalFader value={padVolume} onChange={updatePadVolume} color="#f97316" />
        <span className="text-[9px] font-mono text-gray-400">{padDb} dB</span>
      </div>

      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileLoad} />
    </div>
  );
}

/* ── Pad button ───────────────────────────────────────────────── */
function PadButton({ pad, type, onClick, onClear }: {
  pad: PadData; type: 'music' | 'sfx';
  onClick: () => void; onClear: () => void;
}) {
  const loaded = !!pad.buffer;
  const colorLoaded = type === 'music'
    ? `bg-blue-100 border-blue-400 text-blue-800 hover:bg-blue-200 ${pad.playing ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-200' : ''}`
    : `bg-orange-100 border-orange-400 text-orange-800 hover:bg-orange-200 ${pad.playing ? 'ring-2 ring-orange-400 ring-offset-1 bg-orange-200' : ''}`;
  const colorEmpty = 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:bg-gray-100 hover:border-gray-400';

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); if (loaded) onClear(); }}
      title={loaded ? `${pad.filename}\nClick to play · Right-click to clear` : `Click to load audio (${pad.label})`}
      className={`w-[42px] h-[38px] rounded-lg border text-[8px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${loaded ? colorLoaded : colorEmpty}`}>
      {loaded ? (
        <>
          <span className="truncate w-full text-center px-0.5 leading-tight">{pad.label}</span>
          {pad.playing && <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
        </>
      ) : (
        <>
          <Plus className="w-3 h-3" />
          <span>{pad.id < 6 ? `M${pad.id + 1}` : `S${pad.id - 5}`}</span>
        </>
      )}
    </button>
  );
}

/* ── Pan knob ─────────────────────────────────────────────────── */
function PanKnob({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(0);
  const deg = value * 135;
  const panLabel = value === 0 ? 'C' : value < 0 ? `L${Math.round(-value * 100)}` : `R${Math.round(value * 100)}`;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="w-9 h-9 rounded-full border-2 relative"
        style={{ borderColor: color, cursor: 'ew-resize', touchAction: 'none', userSelect: 'none' }}
        onPointerDown={(e) => {
          isDragging.current = true; startX.current = e.clientX; startVal.current = value;
          e.currentTarget.setPointerCapture(e.pointerId); e.stopPropagation();
        }}
        onPointerMove={(e) => {
          if (!isDragging.current) return;
          onChange(Math.max(-1, Math.min(1, startVal.current + (e.clientX - startX.current) * 0.015)));
          e.stopPropagation();
        }}
        onPointerUp={(e) => { isDragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
        onDoubleClick={() => onChange(0)}
        title="Pan — drag L/R · double-click to center">
        <div className="absolute rounded-full bg-gray-700"
          style={{ width: 2, height: 10, top: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${deg}deg)` }} />
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300" />
      </div>
      <span className="text-[9px] font-mono text-gray-500">{panLabel}</span>
    </div>
  );
}

/* ── Vertical fader — FIXED: uses e.currentTarget for pointer capture ── */
function VerticalFader({ value, onChange, color, min = 0, max = 1.5 }: {
  value: number; onChange: (v: number) => void; color: string; min?: number; max?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updateFromY = useCallback((clientY: number) => {
    const el = trackRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    onChange(min + Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)) * (max - min));
  }, [onChange, min, max]);

  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      className="relative w-8 flex justify-center"
      style={{ height: 160, touchAction: 'none', userSelect: 'none', cursor: 'ns-resize' }}
      onPointerDown={(e) => {
        e.stopPropagation();
        isDragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId); // ← fixed: currentTarget not target
        updateFromY(e.clientY);
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return;
        e.stopPropagation();
        updateFromY(e.clientY);
      }}
      onPointerUp={(e) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId); // ← fixed
      }}
      onPointerCancel={(e) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId); // ← fixed
      }}>
      {/* Rail */}
      <div className="absolute top-1 bottom-1 w-0.5 bg-gray-200 rounded-full">
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute w-2 h-px bg-gray-300" style={{ top: `${p}%`, left: -3 }} />
        ))}
      </div>
      {/* Cap */}
      <div
        className="absolute w-8 h-6 bg-white border border-gray-300 shadow-md rounded-md flex items-center justify-center pointer-events-none"
        style={{ bottom: `calc(${pct}% - 12px)` }}>
        <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

/* ── Channel strip ────────────────────────────────────────────── */
function MixerChannel({ track, updateTrack }: { track: Track; updateTrack: (id: string, updates: Partial<Track>) => void }) {
  const db = ((track.volume - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 68 }}>
      <span className="text-[10px] font-bold text-gray-900 truncate w-full text-center" title={track.name}>{track.name}</span>
      <div className="flex gap-1">
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => updateTrack(track.id, { muted: !track.muted })}
          className={`w-7 h-6 rounded text-xs font-bold transition-colors ${track.muted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
          className={`w-7 h-6 rounded text-xs font-bold transition-colors ${track.soloed ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>S</button>
      </div>
      <PanKnob value={track.pan} onChange={(v) => updateTrack(track.id, { pan: v })} color={track.color} />
      <VerticalFader value={track.volume} onChange={(v) => updateTrack(track.id, { volume: v })} color={track.color} />
      <div className="w-14 py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">{db} dB</div>
    </div>
  );
}

/* ── Master channel ───────────────────────────────────────────── */
function MasterChannel({ masterVolume, setMasterVolume }: { masterVolume: number; setMasterVolume: (v: number) => void }) {
  const db = ((masterVolume - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 68 }}>
      <span className="text-[10px] font-bold text-gray-900 w-full text-center">Master</span>
      <div className="flex gap-1">
        <button className="w-7 h-6 rounded bg-gray-100 text-gray-400 text-xs font-bold cursor-default">M</button>
        <button className="w-7 h-6 rounded bg-gray-100 text-gray-400 text-xs font-bold cursor-default">S</button>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <div className="w-9 h-9 rounded-full border-2 border-gray-300 relative" title="Master — fixed center">
          <div className="absolute rounded-full bg-gray-400"
            style={{ width: 2, height: 10, top: '50%', left: '50%', transformOrigin: '50% 100%', transform: 'translate(-50%, -100%) rotate(0deg)' }} />
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
      <div className="w-14 py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">{db} dB</div>
      <span className="text-[9px] text-gray-400">Stereo Out</span>
    </div>
  );
}
