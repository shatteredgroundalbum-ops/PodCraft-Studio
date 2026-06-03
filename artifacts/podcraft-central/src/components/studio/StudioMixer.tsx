import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Minus, Rewind, Square, Play, Circle, FastForward,
  Music, Zap, Plus, Download, Disc,
} from 'lucide-react';
import { useStudio, Track } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';
import { LevelMeter } from './LevelMeter';

/* ── Types ──────────────────────────────────────────────────────── */
interface PadData { id: number; label: string; buffer: AudioBuffer | null; filename: string; playing: boolean }
interface EQState  { low: number; mid: number; high: number }

/* ── Constants ──────────────────────────────────────────────────── */
const MIXER_KEY  = 'podcraft_mixer_v1';
const defaultEQ  = (): EQState => ({ low: 0, mid: 0, high: 0 });
const makePads   = (): PadData[] => Array.from({ length: 12 }, (_, i) => ({
  id: i, label: i < 6 ? `M${i + 1}` : `S${i - 5}`, buffer: null, filename: '', playing: false,
}));

function loadState(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(MIXER_KEY) ?? '{}'); } catch { return {}; }
}
function n(v: unknown, fallback: number): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}
function b(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}
function eq(v: unknown): EQState {
  const d = defaultEQ();
  if (!v || typeof v !== 'object') return d;
  const o = v as Record<string, unknown>;
  return { low: n(o.low, 0), mid: n(o.mid, 0), high: n(o.high, 0) };
}

/* ════════════════════════════════════════════════════════════════ */
/*  StudioMixer                                                     */
/* ════════════════════════════════════════════════════════════════ */
export function StudioMixer() {
  const {
    tracks, updateTrack, masterVolume, setMasterVolume,
    isPlaying, isRecording, togglePlay, toggleRecord, stop,
    mixerOpen, setMixerOpen,
  } = useStudio();

  /* ── Drag state ─────────────────────────────────────────────── */
  const [position, setPosition] = useState(() => ({ x: Math.max(20, window.innerWidth - 960), y: 72 }));
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
      setPosition({ x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragRef.current.ox)), y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragRef.current.oy)) });
    };
    const onUp = () => { dragRef.current.active = false; setDragging(false); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); };
  }, [dragging]);

  /* ── Mixer state (loaded from localStorage) ─────────────────── */
  const saved = useRef(loadState());
  const S = saved.current;

  const [masterMuted,   setMasterMuted]   = useState(() => b(S.masterMuted,  false));
  const [compEnabled,   setCompEnabled]   = useState(() => b(S.compEnabled,  false));
  const [micTrim,       setMicTrim]       = useState(() => n(S.micTrim,      0.8));
  const [micGainVal,    setMicGainVal]    = useState(() => n(S.micGainVal,   1.0));
  const [micPan,        setMicPan]        = useState(() => n(S.micPan,       0));
  const [micMuted,      setMicMuted]      = useState(() => b(S.micMuted,     false));
  const [micEQ,         setMicEQ]         = useState(() => eq(S.micEQ));
  const [musicBedVol,   setMusicBedVol]   = useState(() => n(S.musicBedVol,  0.8));
  const [musicBedPan,   setMusicBedPan]   = useState(() => n(S.musicBedPan,  0));
  const [musicBedMuted, setMusicBedMuted] = useState(() => b(S.musicBedMuted,false));
  const [musicBedEQ,    setMusicBedEQ]    = useState(() => eq(S.musicBedEQ));
  const [duckEnabled,   setDuckEnabled]   = useState(() => b(S.duckEnabled,  false));
  const [sfxVol,        setSfxVol]        = useState(() => n(S.sfxVol,       0.8));
  const [sfxPan,        setSfxPan]        = useState(() => n(S.sfxPan,       0));
  const [sfxMuted,      setSfxMuted]      = useState(() => b(S.sfxMuted,     false));
  const [sfxEQ,         setSfxEQ]         = useState(() => eq(S.sfxEQ));
  const [monitorVol,    setMonitorVol]    = useState(() => n(S.monitorVol,   0.8));

  /* ── Pad state ──────────────────────────────────────────────── */
  const [pads, setPads]           = useState<PadData[]>(makePads);
  const fileInputRef              = useRef<HTMLInputElement>(null);
  const loadingPadRef             = useRef(-1);
  const activeSources             = useRef(new Map<number, AudioBufferSourceNode>());

  /* ── Mix-recording state ────────────────────────────────────── */
  const [isMixRec,  setIsMixRec]  = useState(false);
  const [mixBlob,   setMixBlob]   = useState<Blob | null>(null);

  /* ── Refs for duck loop ─────────────────────────────────────── */
  const musicBedVolRef    = useRef(musicBedVol);
  const musicBedMutedRef  = useRef(musicBedMuted);
  useEffect(() => { musicBedVolRef.current  = musicBedVol;   }, [musicBedVol]);
  useEffect(() => { musicBedMutedRef.current= musicBedMuted; }, [musicBedMuted]);

  /* ── Apply saved state to engine on first load ──────────────── */
  useEffect(() => {
    engine.init();
    engine.setInputGain(micTrim);
    engine.setMicFaderVolume(micMuted ? 0 : micGainVal);
    engine.setMicPan(micPan);
    engine.setMicEQ('low', micEQ.low); engine.setMicEQ('mid', micEQ.mid); engine.setMicEQ('high', micEQ.high);
    engine.setMusicBusVolume(musicBedMuted ? 0 : musicBedVol);
    engine.setMusicBusPan(musicBedPan);
    engine.setMusicBusEQ('low', musicBedEQ.low); engine.setMusicBusEQ('mid', musicBedEQ.mid); engine.setMusicBusEQ('high', musicBedEQ.high);
    engine.setSfxBusVolume(sfxMuted ? 0 : sfxVol);
    engine.setSfxBusPan(sfxPan);
    engine.setSfxBusEQ('low', sfxEQ.low); engine.setSfxBusEQ('mid', sfxEQ.mid); engine.setSfxBusEQ('high', sfxEQ.high);
    engine.setMonitorVolume(monitorVol);
    engine.setCompressor(compEnabled);
    if (masterMuted) engine.setMasterVolume(0); else engine.setMasterVolume(masterVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Persist state to localStorage (debounced 600ms) ───────── */
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(MIXER_KEY, JSON.stringify({
      masterMuted, compEnabled, micTrim, micGainVal, micPan, micMuted, micEQ,
      musicBedVol, musicBedPan, musicBedMuted, musicBedEQ, duckEnabled,
      sfxVol, sfxPan, sfxMuted, sfxEQ, monitorVol,
    })), 600);
    return () => clearTimeout(t);
  }, [masterMuted, compEnabled, micTrim, micGainVal, micPan, micMuted, micEQ, musicBedVol, musicBedPan, musicBedMuted, musicBedEQ, duckEnabled, sfxVol, sfxPan, sfxMuted, sfxEQ, monitorVol]);

  /* ── Duck loop ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!duckEnabled) {
      if (engine.musicBusGain && engine.ctx && !musicBedMutedRef.current)
        engine.musicBusGain.gain.setTargetAtTime(musicBedVolRef.current, engine.ctx.currentTime, 0.05);
      return;
    }
    let rafId = 0;
    const loop = () => {
      rafId = requestAnimationFrame(loop);
      if (!engine.inputAnalyser || !engine.musicBusGain || !engine.ctx) return;
      if (musicBedMutedRef.current) { engine.musicBusGain.gain.value = 0; return; }
      const buf = new Float32Array(engine.inputAnalyser.fftSize);
      engine.inputAnalyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
      const target = rms > 0.04 ? musicBedVolRef.current * 0.18 : musicBedVolRef.current;
      engine.musicBusGain.gain.setTargetAtTime(target, engine.ctx.currentTime, 0.1);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [duckEnabled]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleMicTrim    = (v: number) => { setMicTrim(v);    engine.setInputGain(v); };
  const handleMicGain    = (v: number) => { setMicGainVal(v); if (!micMuted)      engine.setMicFaderVolume(v); };
  const handleMicPan     = (v: number) => { setMicPan(v);     engine.setMicPan(v); };
  const toggleMicMute    = ()          => { const m = !micMuted;    setMicMuted(m);     engine.setMicFaderVolume(m ? 0 : micGainVal); };
  const handleMicEQ      = (band: keyof EQState, v: number) => { setMicEQ(p => ({ ...p, [band]: v })); engine.setMicEQ(band, v); };

  const handleMusicBedVol   = (v: number) => { setMusicBedVol(v);   if (!musicBedMuted && !duckEnabled) engine.setMusicBusVolume(v); };
  const handleMusicBedPan   = (v: number) => { setMusicBedPan(v);   engine.setMusicBusPan(v); };
  const toggleMusicBedMute  = ()          => { const m = !musicBedMuted; setMusicBedMuted(m); engine.setMusicBusVolume(m ? 0 : musicBedVol); };
  const handleMusicBedEQ    = (band: keyof EQState, v: number) => { setMusicBedEQ(p => ({ ...p, [band]: v })); engine.setMusicBusEQ(band, v); };

  const handleSfxVol    = (v: number) => { setSfxVol(v);   if (!sfxMuted) engine.setSfxBusVolume(v); };
  const handleSfxPan    = (v: number) => { setSfxPan(v);   engine.setSfxBusPan(v); };
  const toggleSfxMute   = ()          => { const m = !sfxMuted; setSfxMuted(m); engine.setSfxBusVolume(m ? 0 : sfxVol); };
  const handleSfxEQ     = (band: keyof EQState, v: number) => { setSfxEQ(p => ({ ...p, [band]: v })); engine.setSfxBusEQ(band, v); };

  const handleMonitorVol  = (v: number) => { setMonitorVol(v); engine.setMonitorVolume(v); };
  const handleMasterVol   = (v: number) => { setMasterVolume(v); if (!masterMuted) engine.setMasterVolume(v); };
  const toggleMasterMute  = ()          => { const m = !masterMuted; setMasterMuted(m); engine.setMasterVolume(m ? 0 : masterVolume); };
  const toggleComp        = ()          => { const e2 = !compEnabled; setCompEnabled(e2); engine.setCompressor(e2); };
  const toggleDuck        = ()          => setDuckEnabled(d => !d);

  /* ── Mix recording ──────────────────────────────────────────── */
  const handleMixRec = async () => {
    engine.init();
    if (isMixRec) {
      setIsMixRec(false);
      const blob = await engine.stopMixRecording();
      if (blob.size > 0) setMixBlob(blob);
    } else {
      setMixBlob(null);
      const ok = engine.startMixRecording(() => {});
      if (ok) setIsMixRec(true);
    }
  };
  const downloadMix = () => {
    if (!mixBlob) return;
    const url = URL.createObjectURL(mixBlob);
    const a = document.createElement('a');
    a.href = url; a.download = `mix-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    a.click(); URL.revokeObjectURL(url);
  };

  /* ── Pad handlers ───────────────────────────────────────────── */
  const handlePadClick = (pad: PadData) => {
    if (!pad.buffer) { loadingPadRef.current = pad.id; fileInputRef.current?.click(); return; }
    engine.init();
    if (!engine.ctx) return;
    const bus = pad.id < 6 ? engine.musicBusGain : engine.sfxBusGain;
    if (!bus) return;
    const existing = activeSources.current.get(pad.id);
    if (existing) { try { existing.stop(); } catch { /**/ } activeSources.current.delete(pad.id); }
    const src = engine.ctx.createBufferSource();
    src.buffer = pad.buffer; src.connect(bus); src.start();
    src.onended = () => { activeSources.current.delete(pad.id); setPads(prev => prev.map(p => p.id === pad.id ? { ...p, playing: false } : p)); };
    activeSources.current.set(pad.id, src);
    setPads(prev => prev.map(p => p.id === pad.id ? { ...p, playing: true } : p));
  };
  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loadingPadRef.current === -1) return;
    engine.init();
    if (!engine.ctx) return;
    try {
      const buf = await engine.ctx.decodeAudioData(await file.arrayBuffer());
      const id  = loadingPadRef.current;
      setPads(prev => prev.map(p => p.id === id ? { ...p, buffer: buf, filename: file.name, label: file.name.replace(/\.[^/.]+$/, '').slice(0, 10) } : p));
    } catch { /**/ }
    loadingPadRef.current = -1;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const clearPad = (id: number) => {
    const s = activeSources.current.get(id); if (s) { try { s.stop(); } catch { /**/ } activeSources.current.delete(id); }
    setPads(prev => prev.map(p => p.id === id ? { ...p, buffer: null, filename: '', label: p.id < 6 ? `M${p.id + 1}` : `S${p.id - 5}`, playing: false } : p));
  };

  if (!mixerOpen) return null;

  const mixerW = Math.min(1360, Math.max(980, tracks.length * 82 + 700));

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: position.x, top: position.y, width: mixerW, touchAction: 'none' }}>

      {/* ── Title bar ── */}
      <div
        className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onPointerDown={handleHeaderPointerDown} style={{ touchAction: 'none', userSelect: 'none' }}>
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-0.5">{[0,1,2].map(i=><div key={i} className="w-1 h-1 rounded-full bg-gray-300"/>)}</div>
          <span className="font-semibold text-sm text-gray-700">Digital Mixer</span>
          <span className="text-[10px] text-gray-400 ml-1">{tracks.length} tracks</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-violet-100 rounded-full px-2 py-0.5 pointer-events-none">
            <span className="text-[10px] font-bold text-violet-700">LIVE</span>
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"/>
          </div>
          <button onClick={()=>setMinimized(!minimized)} className="text-gray-400 hover:text-gray-600 p-0.5"><Minus className="w-4 h-4"/></button>
          <button onClick={()=>setMixerOpen(false)}      className="text-gray-400 hover:text-gray-600 p-0.5"><X     className="w-4 h-4"/></button>
        </div>
      </div>

      {/* ── Channel strips ── */}
      {!minimized && (
        <div className="flex overflow-x-auto" style={{ touchAction: 'auto' }}>

          {/* ① Timeline track strips */}
          <div className="flex px-3 pt-4 pb-3 gap-3 flex-shrink-0">
            {tracks.map(track => (
              <MixerChannel key={track.id} track={track} updateTrack={updateTrack}
                analyser={engine.getTrackAnalyser(track.id) ?? null} />
            ))}
          </div>

          <Divider />

          {/* ② Mic In strip */}
          <div className="px-3 pt-4 pb-3 flex-shrink-0">
            <MicInputStrip
              trim={micTrim} onTrim={handleMicTrim}
              gain={micGainVal} onGain={handleMicGain}
              pan={micPan} onPan={handleMicPan}
              muted={micMuted} onMute={toggleMicMute}
              eq={micEQ} onEQ={handleMicEQ}
            />
          </div>

          <Divider />

          {/* ③ Music Bed bus strip */}
          <div className="px-3 pt-4 pb-3 flex-shrink-0">
            <BusStrip
              label="Music Bed" color="#3b82f6"
              analyser={engine.musicBusAnalyser}
              vol={musicBedVol}   onVol={handleMusicBedVol}
              pan={musicBedPan}   onPan={handleMusicBedPan}
              muted={musicBedMuted} onMute={toggleMusicBedMute}
              eq={musicBedEQ} onEQ={handleMusicBedEQ}
              showDuck duckEnabled={duckEnabled} onDuck={toggleDuck}
            />
          </div>

          {/* ④ SFX bus strip */}
          <div className="px-3 pt-4 pb-3 flex-shrink-0">
            <BusStrip
              label="Sound FX" color="#f97316"
              analyser={engine.sfxBusAnalyser}
              vol={sfxVol}   onVol={handleSfxVol}
              pan={sfxPan}   onPan={handleSfxPan}
              muted={sfxMuted} onMute={toggleSfxMute}
              eq={sfxEQ} onEQ={handleSfxEQ}
            />
          </div>

          <Divider />

          {/* ⑤ Master + Monitor */}
          <div className="flex px-3 pt-4 pb-3 gap-3 flex-shrink-0">
            {/* Master */}
            <div className="flex flex-col items-center gap-2" style={{ width: 72 }}>
              <span className="text-[10px] font-bold text-gray-900 w-full text-center">Master</span>
              <div className="flex gap-1">
                <button onPointerDown={e=>e.stopPropagation()} onClick={toggleMasterMute}
                  className={`w-7 h-6 rounded text-xs font-bold ${masterMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
                <button onPointerDown={e=>e.stopPropagation()} onClick={toggleComp}
                  title="Dynamics Compressor"
                  className={`w-7 h-6 rounded text-[9px] font-bold ${compEnabled ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>CMP</button>
              </div>
              <PanKnob value={0} onChange={()=>{}} color="#8b5cf6" disabled />
              <div className="flex gap-1 items-end">
                <div className="relative">
                  <div className="absolute -left-7 top-0 bottom-0 flex flex-col justify-between text-[7px] text-gray-400 font-mono pr-1 pointer-events-none">
                    {['+12','+6','0','-6','-∞'].map(l=><span key={l}>{l}</span>)}
                  </div>
                  <VerticalFader value={masterVolume} onChange={handleMasterVol} color="#8b5cf6" />
                </div>
                <LevelMeter analyser={engine.masterAnalyser} height={160} width={10} />
              </div>
              <div className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono">
                {((masterVolume - 1) * 12).toFixed(1)} dB
              </div>
              <span className="text-[8px] text-gray-400">Stereo Out</span>
            </div>

            {/* Monitor */}
            <div className="flex flex-col items-center gap-2" style={{ width: 64 }}>
              <span className="text-[10px] font-bold text-teal-700 w-full text-center">Monitor</span>
              <div className="flex gap-1">
                <div className="w-7 h-6 rounded bg-gray-50 border border-gray-100"/>
                <div className="w-7 h-6 rounded bg-gray-50 border border-gray-100"/>
              </div>
              <PanKnob value={0} onChange={()=>{}} color="#14b8a6" disabled />
              <div className="flex gap-1 items-end">
                <VerticalFader value={monitorVol} onChange={handleMonitorVol} color="#14b8a6" />
                <LevelMeter analyser={engine.monitorAnalyser} height={160} width={8} />
              </div>
              <div className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono">
                {((monitorVol - 1) * 12).toFixed(1)} dB
              </div>
              <span className="text-[8px] text-gray-400">Headphones</span>
            </div>
          </div>

          <Divider />

          {/* ⑥ Sound Pads — 2×3 Music + separator + 2×3 SFX, NO fader */}
          <div className="flex flex-col justify-center px-4 pt-4 pb-3 gap-0 flex-shrink-0">
            {/* Music Bed pads */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Music className="w-3.5 h-3.5 text-blue-500"/>
                <span className="text-[10px] font-bold text-blue-700 tracking-widest uppercase">Music Bed</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {pads.slice(0, 6).map(pad => (
                  <PadButton key={pad.id} pad={pad} type="music" onClick={()=>handlePadClick(pad)} onClear={()=>clearPad(pad.id)}/>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="flex items-center gap-2 my-3">
              <div className="flex-1 h-px bg-gray-300"/>
              <Zap className="w-3 h-3 text-orange-400"/>
              <div className="flex-1 h-px bg-gray-300"/>
            </div>

            {/* SFX pads */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3.5 h-3.5 text-orange-500"/>
                <span className="text-[10px] font-bold text-orange-700 tracking-widest uppercase">Sound Effects</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {pads.slice(6, 12).map(pad => (
                  <PadButton key={pad.id} pad={pad} type="sfx" onClick={()=>handlePadClick(pad)} onClear={()=>clearPad(pad.id)}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Transport + Mix Rec dock ── */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 flex items-center justify-between flex-shrink-0">
        {/* Mix recording controls */}
        <div className="flex items-center gap-2">
          <button onClick={handleMixRec} onPointerDown={e=>e.stopPropagation()}
            title={isMixRec ? 'Stop mix recording' : 'Record master mix for export'}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-lg border text-xs font-bold transition-all ${
              isMixRec ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500'
            }`}>
            <Disc className="w-3.5 h-3.5"/>
            {isMixRec ? 'STOP MIX' : 'MIX REC'}
          </button>
          {mixBlob && (
            <button onClick={downloadMix} onPointerDown={e=>e.stopPropagation()}
              title="Download recorded mix"
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-green-400 bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-all">
              <Download className="w-3.5 h-3.5"/>Export Mix
            </button>
          )}
        </div>

        {/* Transport */}
        <div className="flex items-center gap-2">
          <button onClick={stop} onPointerDown={e=>e.stopPropagation()} title="Rewind"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm transition-all">
            <Rewind className="w-5 h-5"/>
          </button>
          <button onClick={stop} onPointerDown={e=>e.stopPropagation()} title="Stop"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm transition-all">
            <Square className="w-5 h-5 fill-current"/>
          </button>
          <button onClick={togglePlay} onPointerDown={e=>e.stopPropagation()} title={isPlaying ? 'Pause' : 'Play'}
            className={`w-14 h-14 flex items-center justify-center rounded-full shadow-md border-2 transition-all ${isPlaying ? 'bg-green-500 border-green-500 text-white' : 'bg-green-50 border-green-400 text-green-600 hover:bg-green-100'}`}>
            <Play className="w-6 h-6 fill-current ml-0.5"/>
          </button>
          <button onClick={toggleRecord} onPointerDown={e=>e.stopPropagation()} title={isRecording ? 'Stop Recording' : 'Record'}
            className={`w-14 h-14 flex items-center justify-center rounded-full shadow-md border-2 transition-all ${isRecording ? 'bg-red-500 border-red-500 text-white animate-pulse' : 'bg-red-50 border-red-400 text-red-600 hover:bg-red-100'}`}>
            <Circle className="w-6 h-6 fill-current"/>
          </button>
          <button onPointerDown={e=>e.stopPropagation()} title="Fast Forward"
            className="w-11 h-11 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm transition-all">
            <FastForward className="w-5 h-5"/>
          </button>
        </div>

        <div className="w-32"/> {/* spacer to center transport */}
      </div>

      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileLoad}/>
    </div>
  );
}

/* ── Divider ────────────────────────────────────────────────────── */
function Divider() {
  return <div className="w-px bg-gray-200 my-3 flex-shrink-0"/>;
}

/* ── MicInputStrip ──────────────────────────────────────────────── */
function MicInputStrip({ trim, onTrim, gain, onGain, pan, onPan, muted, onMute, eq, onEQ }: {
  trim: number; onTrim: (v: number) => void;
  gain: number; onGain: (v: number) => void;
  pan: number;  onPan:  (v: number) => void;
  muted: boolean; onMute: () => void;
  eq: EQState; onEQ: (band: keyof EQState, v: number) => void;
}) {
  const db = ((gain - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 76 }}>
      <span className="text-[10px] font-bold text-gray-700 w-full text-center">Mic In</span>
      <div className="flex gap-1">
        <button onPointerDown={e=>e.stopPropagation()} onClick={onMute}
          className={`w-7 h-6 rounded text-xs font-bold ${muted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        <div className="w-7 h-6 rounded bg-gray-50 border border-gray-100"/>
      </div>
      <PanKnob value={pan} onChange={onPan} color="#6b7280"/>
      {/* Input trim */}
      <div className="w-full flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[7px] text-gray-400 font-bold uppercase tracking-wide">Trim</span>
          <span className="text-[7px] font-mono text-gray-400">{(20*Math.log10(Math.max(trim,1e-7))).toFixed(1)}dB</span>
        </div>
        <input type="range" min={0} max={2} step={0.01} value={trim}
          onChange={e=>onTrim(parseFloat(e.target.value))}
          onPointerDown={e=>e.stopPropagation()}
          className="w-full h-1.5 accent-gray-500 cursor-pointer"/>
      </div>
      {/* Channel fader + meter */}
      <div className="flex gap-1 items-end">
        <VerticalFader value={gain} onChange={onGain} color="#374151"/>
        <LevelMeter analyser={engine.micAnalyser} height={160} width={9}/>
      </div>
      <div className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono">{db} dB</div>
      {/* 3-band EQ */}
      <EQRow eq={eq} onEQ={onEQ}/>
    </div>
  );
}

/* ── BusStrip (Music Bed / SFX) ────────────────────────────────── */
function BusStrip({ label, color, analyser, vol, onVol, pan, onPan, muted, onMute, eq, onEQ, showDuck = false, duckEnabled = false, onDuck }: {
  label: string; color: string; analyser: AnalyserNode | null;
  vol: number; onVol: (v: number) => void;
  pan: number; onPan: (v: number) => void;
  muted: boolean; onMute: () => void;
  eq: EQState; onEQ: (band: keyof EQState, v: number) => void;
  showDuck?: boolean; duckEnabled?: boolean; onDuck?: () => void;
}) {
  const db = ((vol - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 76 }}>
      <span className="text-[10px] font-bold truncate w-full text-center" style={{ color }}>{label}</span>
      <div className="flex gap-1">
        <button onPointerDown={e=>e.stopPropagation()} onClick={onMute}
          className={`w-7 h-6 rounded text-xs font-bold ${muted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        {showDuck ? (
          <button onPointerDown={e=>e.stopPropagation()} onClick={onDuck}
            title="Auto-duck music under voice (voice activates when mic is loud)"
            className={`w-7 h-6 rounded text-[8px] font-bold ${duckEnabled ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>DK</button>
        ) : (
          <div className="w-7 h-6 rounded bg-gray-50 border border-gray-100"/>
        )}
      </div>
      <PanKnob value={pan} onChange={onPan} color={color}/>
      <div className="flex gap-1 items-end">
        <VerticalFader value={vol} onChange={onVol} color={color}/>
        <LevelMeter analyser={analyser} height={160} width={9}/>
      </div>
      <div className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono">{db} dB</div>
      <EQRow eq={eq} onEQ={onEQ}/>
    </div>
  );
}

/* ── EQ row (3 knobs: L / M / H) ───────────────────────────────── */
function EQRow({ eq, onEQ }: { eq: EQState; onEQ: (band: keyof EQState, v: number) => void }) {
  return (
    <div className="flex gap-2 pt-1 border-t border-gray-100 w-full justify-center">
      <EQKnob label="L" value={eq.low}  onChange={v => onEQ('low',  v)}/>
      <EQKnob label="M" value={eq.mid}  onChange={v => onEQ('mid',  v)}/>
      <EQKnob label="H" value={eq.high} onChange={v => onEQ('high', v)}/>
    </div>
  );
}

/* ── EQ Knob ────────────────────────────────────────────────────── */
function EQKnob({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const isDragging = useRef(false); const startY = useRef(0); const startVal = useRef(0);
  const deg = (value / 12) * 135;
  return (
    <div className="flex flex-col items-center">
      <div className="w-5 h-5 rounded-full border border-gray-400 bg-gray-100 relative"
        style={{ cursor: 'ns-resize', touchAction: 'none', userSelect: 'none' }}
        onPointerDown={e => { isDragging.current = true; startY.current = e.clientY; startVal.current = value; e.currentTarget.setPointerCapture(e.pointerId); e.stopPropagation(); }}
        onPointerMove={e => { if (!isDragging.current) return; onChange(Math.max(-12, Math.min(12, startVal.current + (startY.current - e.clientY) * 0.22))); e.stopPropagation(); }}
        onPointerUp={e => { isDragging.current = false; e.currentTarget.releasePointerCapture(e.pointerId); }}
        onDoubleClick={() => onChange(0)}
        title={`${label} EQ: ${value >= 0 ? '+' : ''}${value.toFixed(1)} dB  ·  Double-click to reset`}>
        <div className="absolute rounded-full bg-gray-600"
          style={{ width: 1.5, height: 7, top: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${deg}deg)` }}/>
      </div>
      <span className="text-[7px] text-gray-500">{label}</span>
      <span className="text-[6px] font-mono text-gray-400 leading-none">{value >= 0 ? '+' : ''}{value.toFixed(0)}</span>
    </div>
  );
}

/* ── Pad Button ─────────────────────────────────────────────────── */
function PadButton({ pad, type, onClick, onClear }: { pad: PadData; type: 'music'|'sfx'; onClick: ()=>void; onClear: ()=>void }) {
  const loaded = !!pad.buffer;
  const cls = type === 'music'
    ? `bg-blue-100 border-blue-400 text-blue-900 hover:bg-blue-200${pad.playing ? ' ring-2 ring-blue-500 !bg-blue-300' : ''}`
    : `bg-orange-100 border-orange-400 text-orange-900 hover:bg-orange-200${pad.playing ? ' ring-2 ring-orange-500 !bg-orange-300' : ''}`;
  return (
    <button onClick={onClick} onPointerDown={e=>e.stopPropagation()}
      onContextMenu={e=>{ e.preventDefault(); if (loaded) onClear(); }}
      title={loaded ? `${pad.filename}\nClick to play  ·  Right-click to clear` : `Click to load audio (${pad.label})`}
      className={`w-20 h-16 rounded-xl border-2 text-[10px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${loaded ? cls : 'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:bg-gray-100 hover:border-gray-400'}`}>
      {loaded ? (
        <>
          <span className="truncate w-full text-center px-1 leading-tight text-[11px]">{pad.label}</span>
          {pad.playing
            ? <div className="flex gap-0.5">{[0,1,2].map(i=><div key={i} className="w-1 h-3 bg-current rounded-sm animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
            : <div className="text-[8px] opacity-40">▶ play</div>}
        </>
      ) : (
        <><Plus className="w-4 h-4"/><span className="text-[9px]">{pad.id < 6 ? `M${pad.id+1}` : `S${pad.id-5}`}</span></>
      )}
    </button>
  );
}

/* ── Pan Knob ───────────────────────────────────────────────────── */
function PanKnob({ value, onChange, color, disabled = false }: { value: number; onChange: (v: number) => void; color: string; disabled?: boolean }) {
  const isDragging = useRef(false); const startX = useRef(0); const startVal = useRef(0);
  const deg = value * 135;
  const lbl = value === 0 ? 'C' : value < 0 ? `L${Math.round(-value*100)}` : `R${Math.round(value*100)}`;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="w-9 h-9 rounded-full border-2 relative"
        style={{ borderColor: disabled ? '#d1d5db' : color, cursor: disabled ? 'default' : 'ew-resize', touchAction: 'none', userSelect: 'none' }}
        onPointerDown={e=>{ if (disabled) return; isDragging.current=true; startX.current=e.clientX; startVal.current=value; e.currentTarget.setPointerCapture(e.pointerId); e.stopPropagation(); }}
        onPointerMove={e=>{ if (!isDragging.current || disabled) return; onChange(Math.max(-1,Math.min(1,startVal.current+(e.clientX-startX.current)*0.015))); e.stopPropagation(); }}
        onPointerUp={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}
        onDoubleClick={()=>{ if (!disabled) onChange(0); }}
        title={disabled ? 'Center (fixed)' : 'Pan — drag L/R  ·  double-click to center'}>
        <div className="absolute rounded-full" style={{ width:2, height:10, top:'50%', left:'50%', transformOrigin:'50% 100%', transform:`translate(-50%,-100%) rotate(${deg}deg)`, backgroundColor: disabled ? '#9ca3af' : '#374151' }}/>
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300"/>
      </div>
      <span className="text-[9px] font-mono text-gray-500">{lbl}</span>
    </div>
  );
}

/* ── Vertical Fader ─────────────────────────────────────────────── */
function VerticalFader({ value, onChange, color, min=0, max=1.5 }: { value: number; onChange: (v:number)=>void; color: string; min?: number; max?: number }) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const updateFromY = useCallback((clientY: number) => {
    const el = trackRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    onChange(min + Math.max(0, Math.min(1, 1-(clientY-rect.top)/rect.height)) * (max-min));
  }, [onChange, min, max]);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div ref={trackRef} className="relative w-8 flex justify-center"
      style={{ height: 160, touchAction: 'none', userSelect: 'none', cursor: 'ns-resize' }}
      onPointerDown={e=>{ e.stopPropagation(); isDragging.current=true; e.currentTarget.setPointerCapture(e.pointerId); updateFromY(e.clientY); }}
      onPointerMove={e=>{ if (!isDragging.current) return; e.stopPropagation(); updateFromY(e.clientY); }}
      onPointerUp={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}
      onPointerCancel={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}>
      <div className="absolute top-1 bottom-1 w-0.5 bg-gray-200 rounded-full">
        {[0,25,50,75,100].map(p=><div key={p} className="absolute w-2 h-px bg-gray-300" style={{top:`${p}%`,left:-3}}/>)}
      </div>
      <div className="absolute w-8 h-6 bg-white border border-gray-300 shadow-md rounded-md flex items-center justify-center pointer-events-none"
        style={{ bottom: `calc(${pct}% - 12px)` }}>
        <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }}/>
      </div>
    </div>
  );
}

/* ── Track channel strip (with level meter) ─────────────────────── */
function MixerChannel({ track, updateTrack, analyser }: { track: Track; updateTrack: (id:string,u:Partial<Track>)=>void; analyser: AnalyserNode | null }) {
  const db = ((track.volume - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 68 }}>
      <span className="text-[10px] font-bold text-gray-900 truncate w-full text-center" title={track.name}>{track.name}</span>
      <div className="flex gap-1">
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{muted:!track.muted})}
          className={`w-7 h-6 rounded text-xs font-bold ${track.muted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{soloed:!track.soloed})}
          className={`w-7 h-6 rounded text-xs font-bold ${track.soloed ? 'bg-yellow-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>S</button>
      </div>
      <PanKnob value={track.pan} onChange={v=>updateTrack(track.id,{pan:v})} color={track.color}/>
      <div className="flex gap-1 items-end">
        <VerticalFader value={track.volume} onChange={v=>updateTrack(track.id,{volume:v})} color={track.color}/>
        <LevelMeter analyser={analyser} height={160} width={8}/>
      </div>
      <div className="w-full py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">{db} dB</div>
    </div>
  );
}
