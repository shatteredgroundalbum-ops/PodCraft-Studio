import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Minus, Music, Zap, Sparkles, Plus, Trash2, MoreHorizontal, Settings } from 'lucide-react';
import { useStudio, Track, TrackType, TRACK_PRESETS } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';
import { LevelMeter } from './LevelMeter';

/* ── Types ─────────────────────────────────────────────────────── */
interface PadData { id: number; label: string; buffer: AudioBuffer | null; filename: string; playing: boolean }
interface EQState  { low: number; mid: number; high: number }

/* ── Constants ─────────────────────────────────────────────────── */
const MIXER_KEY = 'podcraft_mixer_v3';
const DEF_EQ    = (): EQState => ({ low: 0, mid: 0, high: 0 });
const makePads  = (): PadData[] => Array.from({ length: 12 }, (_, i) => ({
  id: i, label: i < 6 ? `M${i + 1}` : `S${i - 5}`, buffer: null, filename: '', playing: false,
}));
const PRESET_NAMES = Object.keys(TRACK_PRESETS);

function ls(): Record<string, unknown> {
  try { return JSON.parse(localStorage.getItem(MIXER_KEY) ?? '{}'); } catch { return {}; }
}
const num = (v: unknown, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);
const bln = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d);
const eqs = (v: unknown): EQState => {
  if (!v || typeof v !== 'object') return DEF_EQ();
  const o = v as Record<string, unknown>;
  return { low: num(o.low, 0), mid: num(o.mid, 0), high: num(o.high, 0) };
};

/* ── Track-type options for Add Track modal ──────────────────────── */
const TRACK_TYPES: { label: string; type: TrackType; icon: string }[] = [
  { label: 'Host',       type: 'mic', icon: '🎙' },
  { label: 'Interview',  type: 'mic', icon: '🎤' },
  { label: 'Guest',      type: 'mic', icon: '👤' },
  { label: 'Voiceover',  type: 'mic', icon: '🗣' },
  { label: 'Custom',     type: 'mic', icon: '⚙️' },
];

/* ════════════════════════════════════════════════════════════════ */
export function StudioMixer() {
  const {
    tracks, addTrack, updateTrack, deleteTrack, applyTrackPreset,
    masterVolume, setMasterVolume,
    mixerOpen, setMixerOpen,
    mixerDocked, setMixerDocked,
    setAudioSetupDone,
    roomProfile,
  } = useStudio();

  /* ── Floating drag ──────────────────────────────────────────── */
  const [pos,      setPos]      = useState(() => ({ x: Math.max(20, window.innerWidth - 1100), y: 72 }));
  const [minimized,setMinimized]= useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ active: boolean; ox: number; oy: number }>({ active: false, ox: 0, oy: 0 });

  const onHeaderDown = useCallback((e: React.PointerEvent) => {
    if (mixerDocked) return;
    if ((e.target as HTMLElement).closest('button,select')) return;
    e.preventDefault();
    dragRef.current = { active: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    setDragging(true);
  }, [pos.x, pos.y, mixerDocked]);

  useEffect(() => {
    if (!dragging) return;
    const mv = (e: PointerEvent) => { if (!dragRef.current.active) return; setPos({ x: Math.max(0, e.clientX - dragRef.current.ox), y: Math.max(0, e.clientY - dragRef.current.oy) }); };
    const up = () => { dragRef.current.active = false; setDragging(false); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [dragging]);

  /* ── 3-dot menu ──────────────────────────────────────────────── */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, []);

  /* ── Load persisted state ───────────────────────────────────── */
  const S = useRef(ls()).current;

  /* Bus state */
  const [micTrim,        setMicTrim]        = useState(() => num(S.micTrim,        0.8));
  const [micGainVal,     setMicGainVal]      = useState(() => num(S.micGainVal,     1.0));
  const [micPan,         setMicPan]          = useState(() => num(S.micPan,         0));
  const [micEQ,          setMicEQ]           = useState(() => eqs(S.micEQ));
  const [musicBedVol,    setMusicBedVol]     = useState(() => num(S.musicBedVol,    0.8));
  const [musicBedPan,    setMusicBedPan]     = useState(() => num(S.musicBedPan,    0));
  const [musicBedMuted,  setMusicBedMuted]   = useState(() => bln(S.musicBedMuted,  false));
  const [duckEnabled,    setDuckEnabled]     = useState(() => bln(S.duckEnabled,    false));
  const [sfxVol,         setSfxVol]          = useState(() => num(S.sfxVol,         0.8));
  const [sfxPan,         setSfxPan]          = useState(() => num(S.sfxPan,         0));
  const [sfxMuted,       setSfxMuted]        = useState(() => bln(S.sfxMuted,       false));
  const [monitorVol,     setMonitorVol]      = useState(() => num(S.monitorVol,     0.8));
  const [masterMuted,    setMasterMuted]     = useState(() => bln(S.masterMuted,    false));
  const [compEnabled,    setCompEnabled]     = useState(() => bln(S.compEnabled,    false));
  const [reverbEnabled,  setReverbEnabled]   = useState(() => bln(S.reverbEnabled,  false));
  const [delayEnabled,   setDelayEnabled]    = useState(() => bln(S.delayEnabled,   false));
  const [gateEnabled,    setGateEnabled]     = useState(() => bln(S.gateEnabled,    false));
  const [limiterEnabled, setLimiterEnabled]  = useState(() => bln(S.limiterEnabled, false));

  /* ── Room profile sync from context ────────────────────────── */
  useEffect(() => {
    if (!roomProfile) return;
    /* Sync React state — engine effects already applied by applyRoomProfile in context */
    setGateEnabled(roomProfile.gateEnabled);
    setLimiterEnabled(roomProfile.limiterEnabled);
    setCompEnabled(roomProfile.compEnabled);
    setMicTrim(roomProfile.gain);
    setMicEQ({ low: roomProfile.eq.low, mid: roomProfile.eq.mid, high: roomProfile.eq.high });
  }, [roomProfile]);

  /* Pad state */
  const [pads,       setPads]       = useState<PadData[]>(makePads);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadingPad   = useRef(-1);
  const activeSrc    = useRef(new Map<number, AudioBufferSourceNode>());

  /* Add Track modal */
  const [showAddTrack, setShowAddTrack] = useState(false);

  /* Duck refs */
  const musicBedVolRef   = useRef(musicBedVol);
  const musicBedMutedRef = useRef(musicBedMuted);
  useEffect(() => { musicBedVolRef.current   = musicBedVol;   }, [musicBedVol]);
  useEffect(() => { musicBedMutedRef.current = musicBedMuted; }, [musicBedMuted]);

  /* ── Apply saved state to engine on mount ───────────────────── */
  useEffect(() => {
    engine.init();
    engine.setInputGain(micTrim);
    engine.setMicFaderVolume(micGainVal);
    engine.setMicPan(micPan);
    engine.setMicEQ('low', micEQ.low); engine.setMicEQ('mid', micEQ.mid); engine.setMicEQ('high', micEQ.high);
    engine.setMusicBusVolume(musicBedMuted ? 0 : musicBedVol);
    engine.setMusicBusPan(musicBedPan);
    engine.setSfxBusVolume(sfxMuted ? 0 : sfxVol);
    engine.setSfxBusPan(sfxPan);
    engine.setMonitorVolume(monitorVol);
    engine.setCompressor(compEnabled);
    engine.setReverbEnabled(reverbEnabled);
    engine.setDelayEnabled(delayEnabled);
    engine.setLimiterEnabled(limiterEnabled);
    if (gateEnabled) engine.setNoiseGateEnabled(true);
    if (masterMuted) engine.setMasterVolume(0); else engine.setMasterVolume(masterVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Persist state ──────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(MIXER_KEY, JSON.stringify({
      micTrim, micGainVal, micPan, micEQ,
      musicBedVol, musicBedPan, musicBedMuted, duckEnabled,
      sfxVol, sfxPan, sfxMuted, monitorVol, masterMuted, compEnabled,
      reverbEnabled, delayEnabled, gateEnabled, limiterEnabled,
    })), 700);
    return () => clearTimeout(t);
  }, [micTrim, micGainVal, micPan, micEQ, musicBedVol, musicBedPan, musicBedMuted, duckEnabled, sfxVol, sfxPan, sfxMuted, monitorVol, masterMuted, compEnabled, reverbEnabled, delayEnabled, gateEnabled, limiterEnabled]);

  /* ── Duck loop ──────────────────────────────────────────────── */
  useEffect(() => {
    if (!duckEnabled) {
      if (engine.musicBusGain && engine.ctx && !musicBedMutedRef.current)
        engine.musicBusGain.gain.setTargetAtTime(musicBedVolRef.current, engine.ctx.currentTime, 0.05);
      return;
    }
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!engine.inputAnalyser || !engine.musicBusGain || !engine.ctx || musicBedMutedRef.current) return;
      const buf = new Float32Array(engine.inputAnalyser.fftSize);
      engine.inputAnalyser.getFloatTimeDomainData(buf);
      const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
      engine.musicBusGain.gain.setTargetAtTime(
        rms > 0.04 ? musicBedVolRef.current * 0.18 : musicBedVolRef.current,
        engine.ctx.currentTime, 0.1,
      );
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [duckEnabled]);

  /* ── Bus handlers ───────────────────────────────────────────── */
  const h = {
    micTrim:      (v: number) => { setMicTrim(v);      engine.setInputGain(v); },
    micGain:      (v: number) => { setMicGainVal(v);   engine.setMicFaderVolume(v); },
    micPan:       (v: number) => { setMicPan(v);       engine.setMicPan(v); },
    musicBedVol:  (v: number) => { setMusicBedVol(v);  if (!musicBedMuted && !duckEnabled) engine.setMusicBusVolume(v); },
    musicBedPan:  (v: number) => { setMusicBedPan(v);  engine.setMusicBusPan(v); },
    musicBedMute: ()          => { const m=!musicBedMuted; setMusicBedMuted(m); engine.setMusicBusVolume(m ? 0 : musicBedVol); },
    sfxVol:       (v: number) => { setSfxVol(v);       if (!sfxMuted) engine.setSfxBusVolume(v); },
    sfxPan:       (v: number) => { setSfxPan(v);       engine.setSfxBusPan(v); },
    sfxMute:      ()          => { const m=!sfxMuted;   setSfxMuted(m);   engine.setSfxBusVolume(m ? 0 : sfxVol); },
    monitorVol:   (v: number) => { setMonitorVol(v);   engine.setMonitorVolume(v); },
    masterVol:    (v: number) => { setMasterVolume(v); if (!masterMuted) engine.setMasterVolume(v); },
    masterMute:   ()          => { const m=!masterMuted; setMasterMuted(m); engine.setMasterVolume(m ? 0 : masterVolume); },
    comp:         ()          => { const e=!compEnabled;  setCompEnabled(e);  engine.setCompressor(e); },
    duck:         ()          => setDuckEnabled(d=>!d),
    reverb:       ()          => { const e=!reverbEnabled; setReverbEnabled(e); engine.setReverbEnabled(e); },
    delay:        ()          => { const e=!delayEnabled;  setDelayEnabled(e);  engine.setDelayEnabled(e); },
    gate:         ()          => { const e=!gateEnabled;   setGateEnabled(e);   engine.setNoiseGateEnabled(e); },
    limiter:      ()          => { const e=!limiterEnabled; setLimiterEnabled(e); engine.setLimiterEnabled(e); },
  };

  /* ── Add Track ──────────────────────────────────────────────── */
  const handleAddTrack = (type: TrackType, name: string) => { addTrack(type, name); setShowAddTrack(false); };

  /* ── Pad handlers ───────────────────────────────────────────── */
  const handlePadClick = (pad: PadData) => {
    if (!pad.buffer) { loadingPad.current = pad.id; fileInputRef.current?.click(); return; }
    engine.init();
    if (!engine.ctx) return;
    const bus = pad.id < 6 ? engine.musicBusGain : engine.sfxBusGain;
    if (!bus) return;
    const ex = activeSrc.current.get(pad.id);
    if (ex) { try { ex.stop(); } catch { /**/ } activeSrc.current.delete(pad.id); }
    const src = engine.ctx.createBufferSource();
    src.buffer = pad.buffer; src.connect(bus); src.start();
    src.onended = () => { activeSrc.current.delete(pad.id); setPads(p=>p.map(pp=>pp.id===pad.id?{...pp,playing:false}:pp)); };
    activeSrc.current.set(pad.id, src);
    setPads(p=>p.map(pp=>pp.id===pad.id?{...pp,playing:true}:pp));
  };

  const handleFileLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || loadingPad.current === -1) return;
    engine.init();
    if (!engine.ctx) return;
    try {
      const buf = await engine.ctx.decodeAudioData(await file.arrayBuffer());
      const id = loadingPad.current;
      setPads(p=>p.map(pp=>pp.id===id?{...pp,buffer:buf,filename:file.name,label:file.name.replace(/\.[^/.]+$/,'').slice(0,10)}:pp));
    } catch { /**/ }
    loadingPad.current = -1;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearPad = (id: number) => {
    const s = activeSrc.current.get(id); if (s) { try { s.stop(); } catch { /**/ } activeSrc.current.delete(id); }
    setPads(p=>p.map(pp=>pp.id===id?{...pp,buffer:null,filename:'',label:pp.id<6?`M${pp.id+1}`:`S${pp.id-5}`,playing:false}:pp));
  };

  /* ── Effects pad definitions ────────────────────────────────── */
  const effectPads = [
    { id: 0, label: 'Reverb',     available: true, active: reverbEnabled,   onToggle: h.reverb,  desc: 'Synthetic room reverb on mic channel (ConvolverNode)' },
    { id: 1, label: 'Delay',      available: true, active: delayEnabled,    onToggle: h.delay,   desc: '120 ms delay on mic channel (DelayNode)' },
    { id: 2, label: 'Compressor', available: true, active: compEnabled,     onToggle: h.comp,    desc: 'Master bus compressor — 4:1 ratio, -24 dB threshold' },
    { id: 3, label: 'Noise Gate', available: true, active: gateEnabled,     onToggle: h.gate,    desc: 'Mic noise gate — opens above -40 dB RMS, closes below' },
    { id: 4, label: 'Ducking',    available: true, active: duckEnabled,     onToggle: h.duck,    desc: 'Auto-duck music when voice detected (RAF envelope)' },
    { id: 5, label: 'Limiter',    available: true, active: limiterEnabled,  onToggle: h.limiter, desc: 'Master brick-wall limiter — -1 dBFS ceiling, 20:1 ratio' },
  ];

  /* ── Mic tracks only in strip ───────────────────────────────── */
  const micTracks = tracks.filter(t => t.type === 'mic');

  /* ── Visibility logic ───────────────────────────────────────── */
  // Docked: always visible. Floating: respect mixerOpen.
  if (!mixerDocked && !mixerOpen) return null;

  /* ── Inner body (shared between docked/floating) ─────────────── */
  const titleBar = (
    <div
      className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 ${!mixerDocked && dragging ? 'cursor-grabbing' : !mixerDocked ? 'cursor-grab' : 'cursor-default'}`}
      onPointerDown={onHeaderDown}
      style={{ touchAction: 'none', userSelect: 'none' }}>
      {/* Left: title + add track */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pointer-events-none">
          {!mixerDocked && <div className="flex gap-0.5">{[0,1,2].map(i=><div key={i} className="w-1 h-1 rounded-full bg-gray-400"/>)}</div>}
          <span className="font-bold text-sm text-gray-800">Digital Mixer</span>
          <span className="text-[10px] text-gray-400">{micTracks.length} track{micTracks.length!==1?'s':''}</span>
        </div>
        <button onClick={()=>setShowAddTrack(true)} onPointerDown={e=>e.stopPropagation()}
          className="flex items-center gap-1 px-2.5 h-6 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-[10px] font-bold hover:bg-violet-100 transition-all">
          <Plus className="w-3 h-3"/> Add Track
        </button>
      </div>

      {/* Right: LIVE badge + dock + minimize + 3-dot */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">LIVE</span>

        {/* Dock/Undock button */}
        <button
          onClick={() => setMixerDocked(!mixerDocked)} onPointerDown={e=>e.stopPropagation()}
          title={mixerDocked ? 'Undock mixer (float)' : 'Dock mixer'}
          className="text-[9px] font-bold text-gray-500 hover:text-violet-600 bg-gray-100 hover:bg-violet-50 px-2 py-1 rounded border border-gray-200 hover:border-violet-300 transition-all">
          {mixerDocked ? 'UD' : 'D'}
        </button>

        {!mixerDocked && (
          <button onClick={()=>setMinimized(!minimized)} onPointerDown={e=>e.stopPropagation()} className="text-gray-400 hover:text-gray-600 p-1"><Minus className="w-3.5 h-3.5"/></button>
        )}
        {!mixerDocked && (
          <button onClick={()=>setMixerOpen(false)} onPointerDown={e=>e.stopPropagation()} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-3.5 h-3.5"/></button>
        )}

        {/* 3-dot menu */}
        <div className="relative" ref={menuRef}>
          <button onClick={()=>setMenuOpen(m=>!m)} onPointerDown={e=>e.stopPropagation()}
            className="text-gray-400 hover:text-gray-600 p-1" title="Mixer options">
            <MoreHorizontal className="w-4 h-4"/>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-[200]">
              <MenuItem label={mixerDocked ? 'Undock Mixer' : 'Dock Mixer'} onClick={()=>{ setMixerDocked(!mixerDocked); setMenuOpen(false); }}/>
              <MenuItem label="Reset Mixer Layout" onClick={()=>{ setPos({ x: Math.max(20, window.innerWidth - 1100), y: 72 }); setMenuOpen(false); }}/>
              <div className="my-1 border-t border-gray-100"/>
              <MenuItem label="Add Track" onClick={()=>{ setShowAddTrack(true); setMenuOpen(false); }}/>
              <MenuItem label="Audio Setup" onClick={()=>{ setAudioSetupDone(false); setMenuOpen(false); }} icon={<Settings className="w-3.5 h-3.5"/>}/>
              <div className="my-1 border-t border-gray-100"/>
              <div className="px-3 py-1.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Engine Status</div>
              <div className="px-3 pb-2 text-[10px] text-gray-500 leading-relaxed">
                Reverb: {reverbEnabled ? <span className="text-green-600">✓ On</span> : 'Off'}<br/>
                Delay: {delayEnabled ? <span className="text-green-600">✓ On</span> : 'Off'}<br/>
                Compressor: {compEnabled ? <span className="text-green-600">✓ On</span> : 'Off'}<br/>
                Noise Gate: {gateEnabled ? <span className="text-green-600">✓ On</span> : 'Off'}<br/>
                Ducking: {duckEnabled ? <span className="text-green-600">✓ On</span> : 'Off'}<br/>
                Limiter: {limiterEnabled ? <span className="text-green-600">✓ On</span> : 'Off'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const body = (
    <div className="flex overflow-hidden flex-shrink-0" style={{ height: 368 }}>

      {/* ① Static: Input ──────────────────────────────────────── */}
      <div className="flex-shrink-0 flex flex-col items-center gap-2 px-2 py-3 overflow-y-auto" style={{ width: 88 }}>
        <span className="text-[10px] font-bold text-gray-800 tracking-wide uppercase">Input</span>
        {/* Trim */}
        <div className="w-full">
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[7px] font-bold text-gray-400 uppercase">Trim</span>
            <span className="text-[7px] font-mono text-gray-400">{(20*Math.log10(Math.max(micTrim,1e-7))).toFixed(1)}dB</span>
          </div>
          <input type="range" min={0} max={2} step={0.01} value={micTrim}
            onChange={e=>h.micTrim(parseFloat(e.target.value))}
            onPointerDown={e=>e.stopPropagation()}
            className="w-full h-1.5 accent-gray-500 cursor-pointer"/>
        </div>
        {/* Pan */}
        <PanKnob value={micPan} onChange={h.micPan} color="#6b7280" size="sm"/>
        {/* Channel fader + meter */}
        <div className="flex gap-1 items-end">
          <VerticalFader value={micGainVal} onChange={h.micGain} color="#374151" height={152}/>
          <LevelMeter analyser={engine.micAnalyser} height={152} width={9}/>
        </div>
        <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">
          {((micGainVal-1)*12).toFixed(1)} dB
        </div>
      </div>

      <div className="w-px bg-gray-200 my-2 flex-shrink-0"/>

      {/* ② Scrollable: Track strips (mic-type only) ─────────── */}
      <div className="overflow-x-auto overflow-y-hidden flex-shrink-0" style={{ width: 350 }}>
        <div className="flex flex-row gap-2 px-3 py-3 h-full items-start" style={{ minWidth: 'max-content' }}>
          {micTracks.length === 0 && (
            <div className="flex flex-col items-center justify-center text-gray-400 text-[11px] text-center gap-2 px-6 py-8">
              <Plus className="w-6 h-6 text-gray-300"/>
              <span>No tracks yet<br/>Add a track to start</span>
            </div>
          )}
          {micTracks.map(track => (
            <MixerChannel key={track.id} track={track} updateTrack={updateTrack} deleteTrack={deleteTrack}
              applyPreset={applyTrackPreset} analyser={engine.getTrackAnalyser(track.id)??null}/>
          ))}
        </div>
      </div>

      <div className="w-px bg-gray-200 my-2 flex-shrink-0"/>

      {/* ③ Static: Bus faders ────────────────────────────────── */}
      <div className="flex flex-row flex-shrink-0 gap-2 px-2 py-3 overflow-y-auto">
        <CompactBusStrip
          label="Music Bed" color="#3b82f6"
          analyser={engine.musicBusAnalyser}
          vol={musicBedVol} onVol={h.musicBedVol}
          pan={musicBedPan} onPan={h.musicBedPan}
          muted={musicBedMuted} onMute={h.musicBedMute}
          showDuck duckEnabled={duckEnabled} onDuck={h.duck}/>

        <CompactBusStrip
          label="Sound FX" color="#f97316"
          analyser={engine.sfxBusAnalyser}
          vol={sfxVol} onVol={h.sfxVol}
          pan={sfxPan} onPan={h.sfxPan}
          muted={sfxMuted} onMute={h.sfxMute}/>

        <div className="w-px bg-gray-200 self-stretch my-0 flex-shrink-0"/>

        <CompactBusStrip
          label="Monitor" color="#14b8a6"
          analyser={engine.monitorAnalyser}
          vol={monitorVol} onVol={h.monitorVol}
          pan={0} onPan={()=>{}}
          muted={false} onMute={()=>{}}
          panDisabled/>

        {/* Master */}
        <div className="flex flex-col items-center gap-2" style={{ width: 68 }}>
          <span className="text-[10px] font-bold text-gray-900">Master</span>
          <div className="flex gap-1">
            <button onPointerDown={e=>e.stopPropagation()} onClick={h.masterMute}
              className={`w-8 h-6 rounded text-xs font-bold ${masterMuted?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
            <button onPointerDown={e=>e.stopPropagation()} onClick={h.comp} title="Master DynamicsCompressorNode (-24dB threshold, 4:1 ratio)"
              className={`w-8 h-6 rounded text-[9px] font-bold ${compEnabled?'bg-violet-500 text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>CMP</button>
          </div>
          <PanKnob value={0} onChange={()=>{}} color="#8b5cf6" disabled size="sm"/>
          <div className="flex gap-1 items-end">
            <div className="relative">
              <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                {['+12','+6','0','-6','-∞'].map(l=>(
                  <span key={l} className="text-[6px] font-mono text-gray-400 leading-none">{l}</span>
                ))}
              </div>
              <VerticalFader value={masterVolume} onChange={h.masterVol} color="#8b5cf6" height={152}/>
            </div>
            <LevelMeter analyser={engine.masterAnalyser} height={152} width={10}/>
          </div>
          <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">
            {((masterVolume-1)*12).toFixed(1)} dB
          </div>
        </div>
      </div>

      <div className="w-px bg-gray-200 my-2 flex-shrink-0"/>

      {/* ④ Static: Pad Bank ───────────────────────────────────── */}
      <div className="flex-shrink-0 overflow-y-auto" style={{ width: 288 }}>
        <div className="px-3 py-3 flex flex-col gap-0">
          <PadSection icon={<Music className="w-3 h-3 text-blue-500"/>} label="Loops" color="text-blue-700">
            <div className="grid grid-cols-3 gap-1.5">
              {pads.slice(0,6).map(pad=>(
                <MusicPadButton key={pad.id} pad={pad} type="music"
                  onClick={()=>handlePadClick(pad)} onClear={()=>clearPad(pad.id)}/>
              ))}
            </div>
          </PadSection>
          <PadDivider/>
          <PadSection icon={<Zap className="w-3 h-3 text-orange-500"/>} label="Sounds" color="text-orange-700">
            <div className="grid grid-cols-3 gap-1.5">
              {pads.slice(6,12).map(pad=>(
                <MusicPadButton key={pad.id} pad={pad} type="sfx"
                  onClick={()=>handlePadClick(pad)} onClear={()=>clearPad(pad.id)}/>
              ))}
            </div>
          </PadSection>
          <PadDivider/>
          <PadSection icon={<Sparkles className="w-3 h-3 text-violet-500"/>} label="Effects" color="text-violet-700">
            <div className="grid grid-cols-3 gap-1.5">
              {effectPads.map(ep=>(
                <EffectPadButton key={ep.id} label={ep.label} available={ep.available}
                  active={ep.active} onToggle={ep.onToggle} desc={ep.desc}/>
              ))}
            </div>
          </PadSection>
        </div>
      </div>
    </div>
  );

  /* ── Add Track Modal ──────────────────────────────────────────── */
  const addTrackModal = showAddTrack && (
    <AddTrackModal onAdd={handleAddTrack} onClose={()=>setShowAddTrack(false)}/>
  );

  /* ── Render: docked vs floating ──────────────────────────────── */
  if (mixerDocked) {
    return (
      <div className="w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white flex-shrink-0 select-none">
        <div style={{ width: 1080, minWidth: 1080 }} className="flex flex-col">
          {titleBar}
          {body}
        </div>
        {addTrackModal}
        <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileLoad}/>
      </div>
    );
  }

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: pos.x, top: pos.y, width: 1080, touchAction: 'none' }}>
      {titleBar}
      {!minimized && body}
      {addTrackModal}
      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileLoad}/>
    </div>
  );
}

/* ── MenuItem ────────────────────────────────────────────────────── */
function MenuItem({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left flex items-center gap-2">
      {icon}{label}
    </button>
  );
}

/* ── Add Track Modal ─────────────────────────────────────────────── */
function AddTrackModal({ onAdd, onClose }: { onAdd: (type: TrackType, name: string) => void; onClose: () => void }) {
  const [selected,   setSelected]   = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const chosen = TRACK_TYPES.find(t=>t.label===selected);
  const handleAdd = () => {
    if (!chosen) return;
    const name = chosen.label==='Custom' ? (customName.trim()||'Custom Track') : chosen.label;
    onAdd(chosen.type, name);
  };
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25"
      onPointerDown={e=>{ e.stopPropagation(); onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-[360px]"
        onPointerDown={e=>e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-900 mb-1">Add Track</h3>
        <p className="text-[11px] text-gray-500 mb-4">Select a track type — mic-type tracks support ARM and recording.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {TRACK_TYPES.map(t => (
            <button key={t.label} onClick={()=>setSelected(t.label)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                selected===t.label ? 'border-violet-500 bg-violet-50 text-violet-800 font-semibold' : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}>
              <span className="text-base">{t.icon}</span>
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
        {selected==='Custom' && (
          <input className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:border-violet-400"
            placeholder="Enter track name…" value={customName} onChange={e=>setCustomName(e.target.value)} autoFocus
            onKeyDown={e=>{ if(e.key==='Enter' && chosen) handleAdd(); }}/>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
          <button onClick={handleAdd} disabled={!chosen||(chosen.label==='Custom'&&!customName.trim())}
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Add Track
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MixerChannel (mic track strip) ─────────────────────────────── */
function MixerChannel({ track, updateTrack, deleteTrack, applyPreset, analyser }: {
  track: Track;
  updateTrack: (id: string, u: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  applyPreset: (trackId: string, preset: string) => void;
  analyser: AnalyserNode | null;
}) {
  const [hovered, setHovered] = useState(false);
  const db = ((track.volume - 1) * 12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0 relative" style={{ width: 68 }}
      onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
      {/* Name + remove button */}
      <div className="relative w-full flex items-center justify-center">
        <span className="text-[9px] font-bold text-gray-800 truncate text-center leading-tight pr-3" title={track.name}>{track.name}</span>
        {hovered && (
          <button onPointerDown={e=>e.stopPropagation()}
            onClick={()=>{ if(window.confirm(`Remove "${track.name}"?`)) deleteTrack(track.id); }}
            title="Remove track"
            className="absolute right-0 top-0 w-4 h-4 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all">
            <Trash2 className="w-2.5 h-2.5"/>
          </button>
        )}
      </div>

      {/* M / S buttons */}
      <div className="flex gap-1">
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{muted:!track.muted})}
          className={`w-7 h-5 rounded text-[9px] font-bold ${track.muted?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{soloed:!track.soloed})}
          className={`w-7 h-5 rounded text-[9px] font-bold ${track.soloed?'bg-yellow-400 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>S</button>
      </div>

      <PanKnob value={track.pan} onChange={v=>updateTrack(track.id,{pan:v})} color={track.color} size="sm"/>

      {/* Fader + meter */}
      <div className="flex gap-1 items-end">
        <VerticalFader value={track.volume} onChange={v=>updateTrack(track.id,{volume:v})} color={track.color} height={130}/>
        <LevelMeter analyser={analyser} height={130} width={8}/>
      </div>
      <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">{db} dB</div>

      {/* Preset dropdown */}
      <select
        value={track.preset || 'Custom'}
        onChange={e=>{ e.stopPropagation(); applyPreset(track.id, e.target.value); }}
        onPointerDown={e=>e.stopPropagation()}
        title="Apply audio processing preset"
        className="w-full text-[8px] border border-gray-200 rounded px-1 py-0.5 bg-white text-gray-700 cursor-pointer focus:outline-none focus:border-violet-400 truncate">
        {PRESET_NAMES.map(p=><option key={p} value={p}>{p}</option>)}
      </select>

      {/* ARM button */}
      <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{armed:!track.armed})}
        title={track.armed?'Disarm track':'Arm track for recording'}
        className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${
          track.armed ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 border border-dashed border-gray-300'
        }`}>
        {track.armed ? '● ARM' : 'ARM'}
      </button>
    </div>
  );
}

/* ── CompactBusStrip ─────────────────────────────────────────────── */
function CompactBusStrip({ label, color, analyser, vol, onVol, pan, onPan, muted, onMute, showDuck=false, duckEnabled=false, onDuck, panDisabled=false }: {
  label: string; color: string; analyser: AnalyserNode|null;
  vol: number; onVol: (v:number)=>void;
  pan: number; onPan: (v:number)=>void;
  muted: boolean; onMute: ()=>void;
  showDuck?: boolean; duckEnabled?: boolean; onDuck?: ()=>void;
  panDisabled?: boolean;
}) {
  const db = ((vol-1)*12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 66 }}>
      <span className="text-[9px] font-bold truncate w-full text-center" style={{ color }}>{label}</span>
      <div className="flex gap-1">
        <button onPointerDown={e=>e.stopPropagation()} onClick={onMute}
          className={`w-7 h-5 rounded text-[9px] font-bold ${muted?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        {showDuck?(
          <button onPointerDown={e=>e.stopPropagation()} onClick={onDuck}
            title="Auto-duck music under voice"
            className={`w-7 h-5 rounded text-[8px] font-bold ${duckEnabled?'bg-blue-500 text-white':'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>DK</button>
        ):(
          <div className="w-7 h-5 rounded bg-gray-50 border border-gray-100"/>
        )}
      </div>
      <PanKnob value={pan} onChange={onPan} color={color} disabled={panDisabled} size="sm"/>
      <div className="flex gap-1 items-end">
        <VerticalFader value={vol} onChange={onVol} color={color} height={152}/>
        <LevelMeter analyser={analyser} height={152} width={8}/>
      </div>
      <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">{db} dB</div>
    </div>
  );
}

/* ── PadSection / PadDivider / MusicPadButton / EffectPadButton ─── */
function PadSection({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">{icon}<span className={`text-[10px] font-bold tracking-widest uppercase ${color}`}>{label}</span></div>
      {children}
    </div>
  );
}
function PadDivider() {
  return <div className="flex items-center gap-2 my-3"><div className="flex-1 h-px bg-gray-300"/><div className="w-1 h-1 rounded-full bg-gray-300"/><div className="flex-1 h-px bg-gray-300"/></div>;
}
function MusicPadButton({ pad, type, onClick, onClear }: { pad:PadData; type:'music'|'sfx'; onClick:()=>void; onClear:()=>void }) {
  const loaded = !!pad.buffer;
  const base   = type==='music'
    ? `bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200${pad.playing?' ring-2 ring-blue-400 bg-blue-300':''}`
    : `bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200${pad.playing?' ring-2 ring-orange-400 bg-orange-300':''}`;
  return (
    <button onClick={onClick} onPointerDown={e=>e.stopPropagation()}
      onContextMenu={e=>{ e.preventDefault(); if(loaded) onClear(); }}
      title={loaded?`${pad.filename}\nClick to play · Right-click to clear`:`Click to load audio`}
      className={`w-full h-[48px] rounded-xl border-2 text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
        loaded?base:'bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:bg-gray-100 hover:border-gray-400'
      }`}>
      {loaded ? (
        <>
          <span className="truncate w-full text-center px-1 text-[10px] font-bold leading-tight">{pad.label}</span>
          {pad.playing
            ? <div className="flex gap-0.5">{[0,1,2].map(i=><div key={i} className="w-0.5 h-2.5 bg-current rounded-sm animate-bounce" style={{animationDelay:`${i*0.1}s`}}/>)}</div>
            : <span className="text-[8px] opacity-40">▶</span>}
        </>
      ) : (
        <><Plus className="w-3 h-3"/><span className="text-[8px]">{pad.id<6?`M${pad.id+1}`:`S${pad.id-5}`}</span></>
      )}
    </button>
  );
}
function EffectPadButton({ label, available, active, onToggle, desc }: { label:string; available:boolean; active:boolean; onToggle:()=>void; desc:string }) {
  if (!available) {
    return (
      <div title={desc}
        className="w-full h-[48px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-0.5 opacity-50 cursor-not-allowed">
        <span className="text-[9px] font-bold text-gray-400">{label}</span>
        <span className="text-[7px] text-gray-400">Unavailable</span>
      </div>
    );
  }
  return (
    <button onClick={onToggle} onPointerDown={e=>e.stopPropagation()} title={desc}
      className={`w-full h-[48px] rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold transition-all ${
        active ? 'border-violet-500 bg-violet-100 text-violet-800 shadow-sm ring-2 ring-violet-300'
               : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600'
      }`}>
      <span className="text-[10px] font-bold">{label}</span>
      <span className={`text-[7px] font-semibold ${active?'text-violet-600':'text-gray-400'}`}>{active?'ON':'OFF'}</span>
    </button>
  );
}

/* ── PanKnob ─────────────────────────────────────────────────────── */
function PanKnob({ value, onChange, color, disabled=false, size='md' }: { value:number; onChange:(v:number)=>void; color:string; disabled?:boolean; size?:'sm'|'md' }) {
  const isDragging = useRef(false); const startX = useRef(0); const startVal = useRef(0);
  const deg = value*135;
  const lbl = value===0?'C':value<0?`L${Math.round(-value*100)}`:`R${Math.round(value*100)}`;
  const sz  = size==='sm' ? 'w-7 h-7' : 'w-9 h-9';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className={`${sz} rounded-full border-2 relative`}
        style={{ borderColor:disabled?'#d1d5db':color, cursor:disabled?'default':'ew-resize', touchAction:'none', userSelect:'none' }}
        onPointerDown={e=>{ if(disabled) return; isDragging.current=true; startX.current=e.clientX; startVal.current=value; e.currentTarget.setPointerCapture(e.pointerId); e.stopPropagation(); }}
        onPointerMove={e=>{ if(!isDragging.current||disabled) return; onChange(Math.max(-1,Math.min(1,startVal.current+(e.clientX-startX.current)*0.018))); e.stopPropagation(); }}
        onPointerUp={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}
        onDoubleClick={()=>{ if(!disabled) onChange(0); }}
        title={disabled?'Center (fixed)':'Pan — drag L/R · double-click to center'}>
        <div className="absolute rounded-full" style={{ width:2,height:size==='sm'?8:10,top:'50%',left:'50%',transformOrigin:'50% 100%',transform:`translate(-50%,-100%) rotate(${deg}deg)`,backgroundColor:disabled?'#9ca3af':'#374151' }}/>
      </div>
      <span className="text-[8px] font-mono text-gray-500">{lbl}</span>
    </div>
  );
}

/* ── VerticalFader ───────────────────────────────────────────────── */
function VerticalFader({ value, onChange, color, height=140, min=0, max=1.5 }: { value:number; onChange:(v:number)=>void; color:string; height?:number; min?:number; max?:number }) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const updateY    = useCallback((clientY:number)=>{
    const el=trackRef.current; if(!el) return;
    const rect=el.getBoundingClientRect();
    onChange(min+Math.max(0,Math.min(1,1-(clientY-rect.top)/rect.height))*(max-min));
  },[onChange,min,max]);
  const pct = ((value-min)/(max-min))*100;
  return (
    <div ref={trackRef} className="relative w-7 flex justify-center"
      style={{ height, touchAction:'none', userSelect:'none', cursor:'ns-resize' }}
      onPointerDown={e=>{ e.stopPropagation(); isDragging.current=true; e.currentTarget.setPointerCapture(e.pointerId); updateY(e.clientY); }}
      onPointerMove={e=>{ if(!isDragging.current) return; e.stopPropagation(); updateY(e.clientY); }}
      onPointerUp={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}
      onPointerCancel={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}>
      <div className="absolute top-1 bottom-1 w-0.5 bg-gray-200 rounded-full">
        {[0,25,50,75,100].map(p=><div key={p} className="absolute w-1.5 h-px bg-gray-300" style={{top:`${p}%`,left:-2}}/>)}
      </div>
      <div className="absolute w-7 h-5 bg-white border border-gray-300 shadow-md rounded flex items-center justify-center pointer-events-none"
        style={{ bottom:`calc(${pct}% - 10px)` }}>
        <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor:color }}/>
      </div>
    </div>
  );
}
