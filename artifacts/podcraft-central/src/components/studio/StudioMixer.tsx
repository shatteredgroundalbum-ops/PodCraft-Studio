import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Minus, Rewind, Square, Play, Circle, FastForward, Music, Zap, Plus } from 'lucide-react';
import { useStudio, Track } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

/* ── Pad data ─────────────────────────────────────────────────── */
interface PadData {
  id: number;           // 0-5 = music, 6-11 = sfx
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

/* ── Helper: format dB ────────────────────────────────────────── */
const toDb = (v: number) => (v <= 0 ? '-∞' : (20 * Math.log10(v)).toFixed(1));

/* ─────────────────────────────────────────────────────────────── */
/*  StudioMixer                                                    */
/* ─────────────────────────────────────────────────────────────── */
export function StudioMixer() {
  const {
    tracks, updateTrack, masterVolume, setMasterVolume,
    isPlaying, isRecording, togglePlay, toggleRecord, stop,
    mixerOpen, setMixerOpen,
  } = useStudio();

  /* Pad gain nodes + volumes — lifted here so Master area faders can control them */
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef   = useRef<GainNode | null>(null);
  const [musicPadVol, setMusicPadVol] = useState(0.8);
  const [sfxPadVol,   setSfxPadVol]   = useState(0.8);

  const handleMusicPadVol = useCallback((v: number) => {
    setMusicPadVol(v);
    if (musicGainRef.current) musicGainRef.current.gain.value = v;
  }, []);
  const handleSfxPadVol = useCallback((v: number) => {
    setSfxPadVol(v);
    if (sfxGainRef.current) sfxGainRef.current.gain.value = v;
  }, []);

  /* Drag state */
  const [position, setPosition] = useState(() => ({
    x: Math.max(20, window.innerWidth - 920),
    y: 80,
  }));
  const [minimized, setMinimized] = useState(false);
  const [dragging,  setDragging]  = useState(false);
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
        x: Math.max(0, Math.min(window.innerWidth  - 200, e.clientX - dragRef.current.ox)),
        y: Math.max(0, Math.min(window.innerHeight - 60,  e.clientY - dragRef.current.oy)),
      });
    };
    const onUp = () => { dragRef.current.active = false; setDragging(false); };
    window.addEventListener('pointermove',  onMove);
    window.addEventListener('pointerup',    onUp);
    window.addEventListener('pointercancel',onUp);
    return () => {
      window.removeEventListener('pointermove',  onMove);
      window.removeEventListener('pointerup',    onUp);
      window.removeEventListener('pointercancel',onUp);
    };
  }, [dragging]);

  if (!mixerOpen) return null;

  /* Width: track channels + expanded master (3 faders) + pad section */
  const mixerW = Math.min(1300, Math.max(900, tracks.length * 82 + 540));

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
          <button onClick={() => setMixerOpen(false)}      className="text-gray-400 hover:text-gray-600 p-0.5"><X     className="w-4 h-4" /></button>
        </div>
      </div>

      {/* ── Body: channel strips | master+pad faders | pads ── */}
      {!minimized && (
        <div className="flex" style={{ touchAction: 'auto' }}>

          {/* ① Track channel strips */}
          <div className="flex px-4 pt-4 pb-3 gap-3 overflow-x-auto flex-shrink-0">
            {tracks.map((track) => (
              <MixerChannel key={track.id} track={track} updateTrack={updateTrack} />
            ))}
          </div>

          {/* ② Divider */}
          <div className="w-px bg-gray-200 my-3 flex-shrink-0" />

          {/* ③ Master + Music Bed + SFX faders */}
          <MasterSection
            masterVolume={masterVolume}
            setMasterVolume={setMasterVolume}
            musicPadVol={musicPadVol}
            onMusicPadVol={handleMusicPadVol}
            sfxPadVol={sfxPadVol}
            onSfxPadVol={handleSfxPadVol}
          />

          {/* ④ Divider */}
          <div className="w-px bg-gray-200 my-3 flex-shrink-0" />

          {/* ⑤ Sound pads — NO fader here */}
          <SoundPadSection
            musicGainRef={musicGainRef}
            sfxGainRef={sfxGainRef}
            musicVolume={musicPadVol}
            sfxVolume={sfxPadVol}
          />
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

/* ─────────────────────────────────────────────────────────────── */
/*  MasterSection — Master + Music Bed + SFX faders               */
/* ─────────────────────────────────────────────────────────────── */
function MasterSection({
  masterVolume, setMasterVolume,
  musicPadVol,  onMusicPadVol,
  sfxPadVol,    onSfxPadVol,
}: {
  masterVolume: number;  setMasterVolume: (v: number) => void;
  musicPadVol: number;   onMusicPadVol:   (v: number) => void;
  sfxPadVol: number;     onSfxPadVol:     (v: number) => void;
}) {
  return (
    <div className="flex pt-4 pb-3 px-3 gap-4 flex-shrink-0">
      {/* Master */}
      <FaderChannel
        label="Master"
        sublabel="Stereo Out"
        color="#8b5cf6"
        value={masterVolume}
        onChange={setMasterVolume}
        showScale
      />
      <div className="w-px bg-gray-100 self-stretch" />
      {/* Music Bed fader — controls music pad gain */}
      <FaderChannel
        label="Music Bed"
        sublabel="Pads →"
        color="#3b82f6"
        value={musicPadVol}
        onChange={onMusicPadVol}
      />
      {/* SFX fader — controls sfx pad gain */}
      <FaderChannel
        label="SFX"
        sublabel="Pads →"
        color="#f97316"
        value={sfxPadVol}
        onChange={onSfxPadVol}
      />
    </div>
  );
}

/* Single labeled fader column */
function FaderChannel({
  label, sublabel, color, value, onChange, showScale = false,
}: {
  label: string; sublabel: string; color: string;
  value: number; onChange: (v: number) => void; showScale?: boolean;
}) {
  const db = ((value - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 62 }}>
      <span className="text-[10px] font-bold text-gray-800 truncate w-full text-center" title={label}>{label}</span>
      {/* placeholder M/S buttons to align with channel strips */}
      <div className="flex gap-1">
        <div className="w-7 h-6 rounded bg-gray-50 border border-gray-100" />
        <div className="w-7 h-6 rounded bg-gray-50 border border-gray-100" />
      </div>
      {/* Spacer matching pan knob height */}
      <div style={{ height: 42 }} />
      <div className="relative">
        {showScale && (
          <div className="absolute -left-7 top-0 bottom-0 flex flex-col justify-between text-[8px] text-gray-400 font-mono pr-1 pointer-events-none">
            {['+12', '+6', '0', '-6', '-12', '-24', '-∞'].map((l) => <span key={l}>{l}</span>)}
          </div>
        )}
        <VerticalFader value={value} onChange={onChange} color={color} />
      </div>
      <div className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">{db} dB</div>
      <span className="text-[9px] text-gray-400">{sublabel}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  SoundPadSection — 2×3 Music pads / separator / 2×3 SFX pads  */
/*  NO fader inside — faders live in MasterSection                */
/* ─────────────────────────────────────────────────────────────── */
function SoundPadSection({
  musicGainRef, sfxGainRef, musicVolume, sfxVolume,
}: {
  musicGainRef: React.MutableRefObject<GainNode | null>;
  sfxGainRef:   React.MutableRefObject<GainNode | null>;
  musicVolume: number;
  sfxVolume: number;
}) {
  const [pads, setPads] = useState<PadData[]>(makePads);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const loadingPadRef = useRef(-1);
  const activeSources = useRef(new Map<number, AudioBufferSourceNode>());

  /* Create (or return) the appropriate gain node for music vs sfx */
  const getGain = useCallback((isMusic: boolean): GainNode | null => {
    const ref = isMusic ? musicGainRef : sfxGainRef;
    const vol = isMusic ? musicVolume  : sfxVolume;
    if (ref.current) return ref.current;
    engine.init();
    if (!engine.ctx || !engine.masterGain) return null;
    const g = engine.ctx.createGain();
    g.gain.value = vol;
    g.connect(engine.masterGain);
    ref.current = g;
    return g;
  }, [musicGainRef, sfxGainRef, musicVolume, sfxVolume]);

  const handlePadClick = (pad: PadData) => {
    if (!pad.buffer) {
      loadingPadRef.current = pad.id;
      fileInputRef.current?.click();
      return;
    }
    engine.init();
    if (!engine.ctx) return;
    const gain = getGain(pad.id < 6);
    if (!gain) return;

    /* Stop if already playing */
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
      const buf       = await engine.ctx.decodeAudioData(await file.arrayBuffer());
      const padId     = loadingPadRef.current;
      const shortName = file.name.replace(/\.[^/.]+$/, '').slice(0, 10);
      setPads((prev) => prev.map((p) => p.id === padId ? { ...p, buffer: buf, filename: file.name, label: shortName } : p));
    } catch { /* unsupported format — silent */ }
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

  const musicPads = pads.slice(0, 6);
  const sfxPads   = pads.slice(6, 12);

  return (
    <div className="flex flex-col justify-center px-4 pt-4 pb-3 gap-0 flex-shrink-0">

      {/* ── Music Bed section ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Music className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-[10px] font-bold text-blue-700 tracking-widest uppercase">Music Bed</span>
        </div>
        {/* 2 rows × 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {musicPads.map((pad) => (
            <PadButton key={pad.id} pad={pad} type="music"
              onClick={() => handlePadClick(pad)}
              onClear={() => clearPad(pad.id)} />
          ))}
        </div>
      </div>

      {/* ── Separator ── */}
      <div className="flex items-center gap-2 my-3">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-[9px] text-gray-400 font-semibold tracking-widest uppercase">SFX</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* ── Sound Effects section ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-[10px] font-bold text-orange-700 tracking-widest uppercase">Sound Effects</span>
        </div>
        {/* 2 rows × 3 columns */}
        <div className="grid grid-cols-3 gap-2">
          {sfxPads.map((pad) => (
            <PadButton key={pad.id} pad={pad} type="sfx"
              onClick={() => handlePadClick(pad)}
              onClear={() => clearPad(pad.id)} />
          ))}
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileLoad} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  PadButton — large, usable performance pad                      */
/* ─────────────────────────────────────────────────────────────── */
function PadButton({ pad, type, onClick, onClear }: {
  pad: PadData; type: 'music' | 'sfx';
  onClick: () => void; onClear: () => void;
}) {
  const loaded = !!pad.buffer;

  const loadedStyle = type === 'music'
    ? `bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200${pad.playing ? ' ring-2 ring-blue-500 ring-offset-1 !bg-blue-300' : ''}`
    : `bg-orange-100 border-orange-400 text-orange-900 hover:bg-orange-200${pad.playing ? ' ring-2 ring-orange-500 ring-offset-1 !bg-orange-300' : ''}`;

  const emptyStyle = 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:bg-gray-100 hover:border-gray-400';

  return (
    <button
      onClick={onClick}
      onPointerDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); if (loaded) onClear(); }}
      title={loaded
        ? `${pad.filename}\nClick to play  ·  Right-click to clear`
        : `Click to load audio file (${pad.label})`}
      className={`w-20 h-16 rounded-xl border-2 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${loaded ? loadedStyle : emptyStyle}`}>
      {loaded ? (
        <>
          <span className="truncate w-full text-center px-1 leading-tight text-[11px]">{pad.label}</span>
          {pad.playing
            ? <div className="flex gap-0.5">{[0,1,2].map(i=><div key={i} className="w-1 h-3 bg-current rounded-sm animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
            : <div className="text-[9px] opacity-50">▶ play</div>}
        </>
      ) : (
        <>
          <Plus className="w-4 h-4" />
          <span className="text-[9px]">{pad.id < 6 ? `M${pad.id + 1}` : `S${pad.id - 5}`}</span>
        </>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Pan knob                                                       */
/* ─────────────────────────────────────────────────────────────── */
function PanKnob({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const isDragging = useRef(false);
  const startX     = useRef(0);
  const startVal   = useRef(0);
  const deg        = value * 135;
  const panLabel   = value === 0 ? 'C' : value < 0 ? `L${Math.round(-value * 100)}` : `R${Math.round(value * 100)}`;

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

/* ─────────────────────────────────────────────────────────────── */
/*  Vertical fader — pointer capture on currentTarget (not target) */
/* ─────────────────────────────────────────────────────────────── */
function VerticalFader({ value, onChange, color, min = 0, max = 1.5 }: {
  value: number; onChange: (v: number) => void; color: string; min?: number; max?: number;
}) {
  const trackRef   = useRef<HTMLDivElement>(null);
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
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromY(e.clientY);
      }}
      onPointerMove={(e) => {
        if (!isDragging.current) return;
        e.stopPropagation();
        updateFromY(e.clientY);
      }}
      onPointerUp={(e) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={(e) => {
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
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

/* ─────────────────────────────────────────────────────────────── */
/*  MixerChannel — track channel strip                             */
/* ─────────────────────────────────────────────────────────────── */
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
