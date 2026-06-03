import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X, Minus, Rewind, Square, Play, Circle, FastForward, Music, Zap, Sparkles, Plus,
} from 'lucide-react';
import { useStudio, Track, TrackType } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';
import { LevelMeter } from './LevelMeter';

/* ── Types ─────────────────────────────────────────────────────── */
interface PadData { id: number; label: string; buffer: AudioBuffer | null; filename: string; playing: boolean }
interface EQState  { low: number; mid: number; high: number }

/* ── Constants ─────────────────────────────────────────────────── */
const MIXER_KEY = 'podcraft_mixer_v2';
const DEF_EQ    = (): EQState => ({ low: 0, mid: 0, high: 0 });
const makePads  = (): PadData[] => Array.from({ length: 12 }, (_, i) => ({
  id: i, label: i < 6 ? `M${i + 1}` : `S${i - 5}`, buffer: null, filename: '', playing: false,
}));

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
const TRACK_TYPES: { label: string; type: TrackType; icon: string; recordable: boolean }[] = [
  { label: 'Host',         type: 'mic',   icon: '🎙',  recordable: true  },
  { label: 'Interview',    type: 'mic',   icon: '🎤',  recordable: true  },
  { label: 'Guest',        type: 'mic',   icon: '👤',  recordable: true  },
  { label: 'Voiceover',    type: 'mic',   icon: '🗣',  recordable: true  },
  { label: 'Music Track',  type: 'music', icon: '🎵',  recordable: false },
  { label: 'SFX Track',    type: 'sfx',   icon: '🔊',  recordable: false },
  { label: 'Custom Track', type: 'mic',   icon: '⚙️', recordable: true, },
];

/* ════════════════════════════════════════════════════════════════ */
/*  Main StudioMixer component                                      */
/* ════════════════════════════════════════════════════════════════ */
export function StudioMixer() {
  const {
    tracks, addTrack, updateTrack, masterVolume, setMasterVolume,
    isPlaying, isRecording, togglePlay, toggleRecord, stop,
    mixerOpen, setMixerOpen,
  } = useStudio();

  /* ── Drag ───────────────────────────────────────────────────── */
  const [pos,      setPos]      = useState(() => ({ x: Math.max(20, window.innerWidth - 1100), y: 72 }));
  const [minimized,setMinimized]= useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ active: boolean; ox: number; oy: number }>({ active: false, ox: 0, oy: 0 });

  const onHeaderDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = { active: true, ox: e.clientX - pos.x, oy: e.clientY - pos.y };
    setDragging(true);
  }, [pos.x, pos.y]);

  useEffect(() => {
    if (!dragging) return;
    const mv = (e: PointerEvent) => { if (!dragRef.current.active) return; setPos({ x: Math.max(0, e.clientX - dragRef.current.ox), y: Math.max(0, e.clientY - dragRef.current.oy) }); };
    const up = () => { dragRef.current.active = false; setDragging(false); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [dragging]);

  /* ── Load persisted state ───────────────────────────────────── */
  const S = useRef(ls()).current;

  /* Bus state */
  const [micTrim,        setMicTrim]        = useState(() => num(S.micTrim,        0.8));
  const [micGainVal,     setMicGainVal]      = useState(() => num(S.micGainVal,     1.0));
  const [micPan,         setMicPan]          = useState(() => num(S.micPan,         0));
  const [micMuted,       setMicMuted]        = useState(() => bln(S.micMuted,       false));
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

  /* Effects state */
  const [reverbEnabled,   setReverbEnabled]   = useState(() => bln(S.reverbEnabled,   false));
  const [delayEnabled,    setDelayEnabled]    = useState(() => bln(S.delayEnabled,    false));
  const [eqPresetEnabled, setEqPresetEnabled] = useState(() => bln(S.eqPresetEnabled, false));
  const prePresetEQ = useRef<EQState | null>(null);

  /* Pads */
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
    engine.setMicFaderVolume(micMuted ? 0 : micGainVal);
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
    if (masterMuted) engine.setMasterVolume(0); else engine.setMasterVolume(masterVolume);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Persist state ──────────────────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => localStorage.setItem(MIXER_KEY, JSON.stringify({
      micTrim, micGainVal, micPan, micMuted, micEQ,
      musicBedVol, musicBedPan, musicBedMuted, duckEnabled,
      sfxVol, sfxPan, sfxMuted, monitorVol, masterMuted, compEnabled,
      reverbEnabled, delayEnabled, eqPresetEnabled,
    })), 700);
    return () => clearTimeout(t);
  }, [micTrim, micGainVal, micPan, micMuted, micEQ, musicBedVol, musicBedPan, musicBedMuted, duckEnabled, sfxVol, sfxPan, sfxMuted, monitorVol, masterMuted, compEnabled, reverbEnabled, delayEnabled, eqPresetEnabled]);

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
    micTrim:        (v: number) => { setMicTrim(v);        engine.setInputGain(v); },
    micGain:        (v: number) => { setMicGainVal(v);     if (!micMuted)     engine.setMicFaderVolume(v); },
    micPan:         (v: number) => { setMicPan(v);         engine.setMicPan(v); },
    micMute:        ()          => { const m=!micMuted;     setMicMuted(m);     engine.setMicFaderVolume(m ? 0 : micGainVal); },
    micEQ:          (band: keyof EQState, v: number) => {
      setMicEQ(p=>({...p,[band]:v}));
      if (!eqPresetEnabled) engine.setMicEQ(band, v);
    },
    musicBedVol:    (v: number) => { setMusicBedVol(v);    if (!musicBedMuted && !duckEnabled) engine.setMusicBusVolume(v); },
    musicBedPan:    (v: number) => { setMusicBedPan(v);    engine.setMusicBusPan(v); },
    musicBedMute:   ()          => { const m=!musicBedMuted; setMusicBedMuted(m); engine.setMusicBusVolume(m ? 0 : musicBedVol); },
    sfxVol:         (v: number) => { setSfxVol(v);         if (!sfxMuted) engine.setSfxBusVolume(v); },
    sfxPan:         (v: number) => { setSfxPan(v);         engine.setSfxBusPan(v); },
    sfxMute:        ()          => { const m=!sfxMuted;     setSfxMuted(m);     engine.setSfxBusVolume(m ? 0 : sfxVol); },
    monitorVol:     (v: number) => { setMonitorVol(v);     engine.setMonitorVolume(v); },
    masterVol:      (v: number) => { setMasterVolume(v);   if (!masterMuted) engine.setMasterVolume(v); },
    masterMute:     ()          => { const m=!masterMuted;  setMasterMuted(m);  engine.setMasterVolume(m ? 0 : masterVolume); },
    comp:           ()          => { const e=!compEnabled;  setCompEnabled(e);  engine.setCompressor(e); },
    duck:           ()          => setDuckEnabled(d=>!d),
    reverb:         ()          => { const e=!reverbEnabled; setReverbEnabled(e); engine.setReverbEnabled(e); },
    delay:          ()          => { const e=!delayEnabled;  setDelayEnabled(e);  engine.setDelayEnabled(e); },
    eqPreset:       ()          => {
      const en = !eqPresetEnabled;
      setEqPresetEnabled(en);
      if (en) {
        prePresetEQ.current = { ...micEQ };
        engine.setMicEQ('low', -1); engine.setMicEQ('mid', 3); engine.setMicEQ('high', 2);
      } else {
        const p = prePresetEQ.current;
        if (p) { engine.setMicEQ('low', p.low); engine.setMicEQ('mid', p.mid); engine.setMicEQ('high', p.high); }
      }
    },
  };

  /* ── Add Track ──────────────────────────────────────────────── */
  const handleAddTrack = (type: TrackType, name: string) => {
    addTrack(type, name);
    setShowAddTrack(false);
  };

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

  if (!mixerOpen) return null;

  /* ── Effects pad definitions ────────────────────────────────── */
  const effectPads = [
    { id: 0, label: 'Reverb',     available: true,  active: reverbEnabled,   onToggle: h.reverb,   desc: 'Synthetic room reverb on mic (ConvolverNode)' },
    { id: 1, label: 'Delay',      available: true,  active: delayEnabled,    onToggle: h.delay,    desc: '120ms delay on mic (DelayNode)' },
    { id: 2, label: 'Compressor', available: true,  active: compEnabled,     onToggle: h.comp,     desc: 'Master bus compressor (DynamicsCompressorNode)' },
    { id: 3, label: 'EQ',         available: true,  active: eqPresetEnabled, onToggle: h.eqPreset, desc: 'Voice presence boost preset on mic EQ' },
    { id: 4, label: 'Ducking',    available: true,  active: duckEnabled,     onToggle: h.duck,     desc: 'Auto-duck music when voice is detected' },
    { id: 5, label: 'Noise Gate', available: false, active: false,           onToggle: ()=>{},     desc: 'Unavailable — requires AudioWorklet (not implemented)' },
  ];

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: pos.x, top: pos.y, width: 1080, touchAction: 'none' }}>

      {/* ── Title bar ─────────────────────────────────────────── */}
      <div
        className={`h-10 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 ${dragging?'cursor-grabbing':'cursor-grab'}`}
        onPointerDown={onHeaderDown} style={{ touchAction:'none', userSelect:'none' }}>
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="flex gap-0.5">{[0,1,2].map(i=><div key={i} className="w-1 h-1 rounded-full bg-gray-400"/>)}</div>
          <span className="font-bold text-sm text-gray-800">Digital Mixer</span>
          <span className="text-[10px] text-gray-400">{tracks.length} track{tracks.length!==1?'s':''}</span>
          {isRecording && <span className="text-[10px] font-bold text-red-500 animate-pulse ml-1">● REC</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">LIVE</span>
          <button onClick={()=>setMinimized(!minimized)} className="text-gray-400 hover:text-gray-600 p-1"><Minus className="w-3.5 h-3.5"/></button>
          <button onClick={()=>setMixerOpen(false)}      className="text-gray-400 hover:text-gray-600 p-1"><X     className="w-3.5 h-3.5"/></button>
        </div>
      </div>

      {/* ── Main body (4 static + 1 scrollable column) ─────────── */}
      {!minimized && (
        <div className="flex overflow-hidden flex-shrink-0" style={{ height: 368 }}>

          {/* ① Static: Mic In ──────────────────────────────────── */}
          <div className="flex-shrink-0 flex flex-col items-center gap-2 px-2 py-3 overflow-y-auto" style={{ width: 92 }}>
            <span className="text-[10px] font-bold text-gray-800 tracking-wide uppercase">Input</span>
            <button onPointerDown={e=>e.stopPropagation()} onClick={h.micMute}
              className={`w-full h-6 rounded text-xs font-bold ${micMuted?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {micMuted ? '✕ MUTE' : 'MUTE'}
            </button>
            <PanKnob value={micPan} onChange={h.micPan} color="#6b7280" size="sm"/>
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
            {/* Channel fader + meter */}
            <div className="flex gap-1 items-end">
              <VerticalFader value={micGainVal} onChange={h.micGain} color="#374151" height={140}/>
              <LevelMeter analyser={engine.micAnalyser} height={140} width={9}/>
            </div>
            <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">
              {((micGainVal-1)*12).toFixed(1)} dB
            </div>
            {/* 3-band EQ */}
            <EQRow eq={micEQ} onEQ={h.micEQ} dimmed={eqPresetEnabled}/>
          </div>

          <div className="w-px bg-gray-200 my-2 flex-shrink-0"/>

          {/* ② Scrollable: Track strips ──────────────────────── */}
          <div className="overflow-x-auto overflow-y-hidden flex-shrink-0" style={{ width: 346 }}>
            <div className="flex flex-row gap-2 px-3 py-3 h-full items-start" style={{ minWidth:'max-content' }}>
              {tracks.map(track => (
                <MixerChannel key={track.id} track={track} updateTrack={updateTrack}
                  analyser={engine.getTrackAnalyser(track.id)??null}/>
              ))}
            </div>
          </div>

          <div className="w-px bg-gray-200 my-2 flex-shrink-0"/>

          {/* ③ Static: Bus faders ────────────────────────────── */}
          <div className="flex flex-row flex-shrink-0 gap-2 px-2 py-3 overflow-y-auto">

            {/* Music Bed bus */}
            <CompactBusStrip
              label="Music Bed" color="#3b82f6"
              analyser={engine.musicBusAnalyser}
              vol={musicBedVol} onVol={h.musicBedVol}
              pan={musicBedPan} onPan={h.musicBedPan}
              muted={musicBedMuted} onMute={h.musicBedMute}
              showDuck duckEnabled={duckEnabled} onDuck={h.duck}/>

            {/* SFX bus */}
            <CompactBusStrip
              label="Sound FX" color="#f97316"
              analyser={engine.sfxBusAnalyser}
              vol={sfxVol} onVol={h.sfxVol}
              pan={sfxPan} onPan={h.sfxPan}
              muted={sfxMuted} onMute={h.sfxMute}/>

            <div className="w-px bg-gray-200 self-stretch my-0 flex-shrink-0"/>

            {/* Monitor */}
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
                <button onPointerDown={e=>e.stopPropagation()} onClick={h.comp} title="Dynamics Compressor (-24dB threshold, 4:1 ratio)"
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
                  <VerticalFader value={masterVolume} onChange={h.masterVol} color="#8b5cf6" height={140}/>
                </div>
                <LevelMeter analyser={engine.masterAnalyser} height={140} width={10}/>
              </div>
              <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">
                {((masterVolume-1)*12).toFixed(1)} dB
              </div>
            </div>
          </div>

          <div className="w-px bg-gray-200 my-2 flex-shrink-0"/>

          {/* ④ Static: Pad Bank ───────────────────────────────── */}
          <div className="flex-shrink-0 overflow-y-auto" style={{ width: 288 }}>
            <div className="px-3 py-3 flex flex-col gap-0">

              {/* Music Bed pads */}
              <PadSection icon={<Music className="w-3 h-3 text-blue-500"/>} label="Music Bed" color="text-blue-700">
                <div className="grid grid-cols-3 gap-1.5">
                  {pads.slice(0,6).map(pad=>(
                    <MusicPadButton key={pad.id} pad={pad} type="music"
                      onClick={()=>handlePadClick(pad)} onClear={()=>clearPad(pad.id)}/>
                  ))}
                </div>
              </PadSection>

              <PadDivider/>

              {/* SFX pads */}
              <PadSection icon={<Zap className="w-3 h-3 text-orange-500"/>} label="Sound Effects" color="text-orange-700">
                <div className="grid grid-cols-3 gap-1.5">
                  {pads.slice(6,12).map(pad=>(
                    <MusicPadButton key={pad.id} pad={pad} type="sfx"
                      onClick={()=>handlePadClick(pad)} onClear={()=>clearPad(pad.id)}/>
                  ))}
                </div>
              </PadSection>

              <PadDivider/>

              {/* Effects pads */}
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
      )}

      {/* ── Transport dock ─────────────────────────────────────── */}
      <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        {/* Add Track button */}
        <button onClick={()=>setShowAddTrack(true)} onPointerDown={e=>e.stopPropagation()}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-violet-300 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-all">
          <Plus className="w-3.5 h-3.5"/> Add Track
        </button>

        {/* Transport */}
        <div className="flex items-center gap-2">
          <button onClick={stop}        onPointerDown={e=>e.stopPropagation()} title="Rewind"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm">
            <Rewind className="w-4 h-4"/>
          </button>
          <button onClick={stop}        onPointerDown={e=>e.stopPropagation()} title="Stop"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 shadow-sm">
            <Square className="w-4 h-4 fill-current"/>
          </button>
          <button onClick={togglePlay}  onPointerDown={e=>e.stopPropagation()} title={isPlaying?'Pause':'Play'}
            className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md border-2 transition-all ${isPlaying?'bg-green-500 border-green-500 text-white':'bg-green-50 border-green-400 text-green-600 hover:bg-green-100'}`}>
            <Play className="w-5 h-5 fill-current ml-0.5"/>
          </button>
          <button onClick={toggleRecord} onPointerDown={e=>e.stopPropagation()} title={isRecording?'Stop Recording':'Record (arms required)'}
            className={`w-12 h-12 flex items-center justify-center rounded-full shadow-md border-2 transition-all ${isRecording?'bg-red-500 border-red-500 text-white animate-pulse':'bg-red-50 border-red-400 text-red-600 hover:bg-red-100'}`}>
            <Circle className="w-5 h-5 fill-current"/>
          </button>
          <button onPointerDown={e=>e.stopPropagation()} title="Fast Forward"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 shadow-sm">
            <FastForward className="w-4 h-4"/>
          </button>
        </div>

        <div className="text-[10px] text-gray-400 text-right leading-tight">
          {tracks.filter(t=>t.armed).length > 0
            ? <span className="text-red-500 font-bold">{tracks.filter(t=>t.armed).length} track{tracks.filter(t=>t.armed).length!==1?'s':''} armed</span>
            : <span>No tracks armed<br/>ARM a track to record</span>}
        </div>
      </div>

      {/* ── Add Track Modal ────────────────────────────────────── */}
      {showAddTrack && (
        <AddTrackModal onAdd={handleAddTrack} onClose={()=>setShowAddTrack(false)}/>
      )}

      <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileLoad}/>
    </div>
  );
}

/* ── Add Track Modal ─────────────────────────────────────────────── */
function AddTrackModal({ onAdd, onClose }: { onAdd: (type: TrackType, name: string) => void; onClose: () => void }) {
  const [selected,    setSelected]    = useState<string | null>(null);
  const [customName,  setCustomName]  = useState('');

  const chosen = TRACK_TYPES.find(t=>t.label===selected);

  const handleAdd = () => {
    if (!chosen) return;
    const name = chosen.label==='Custom Track' ? (customName.trim()||'Custom Track') : chosen.label;
    onAdd(chosen.type, name);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/25"
      onPointerDown={e=>{ e.stopPropagation(); onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-[360px]"
        onPointerDown={e=>e.stopPropagation()}>
        <h3 className="text-base font-bold text-gray-900 mb-1">Add Track</h3>
        <p className="text-[11px] text-gray-500 mb-4">Choose what kind of track to add to the mixer.</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {TRACK_TYPES.map(t => (
            <button key={t.label} onClick={()=>setSelected(t.label)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all ${
                selected===t.label
                  ? 'border-violet-500 bg-violet-50 text-violet-800 font-semibold'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}>
              <span className="text-base">{t.icon}</span>
              <div>
                <div className="text-xs font-semibold leading-tight">{t.label}</div>
                <div className="text-[9px] text-gray-400 leading-tight">{t.recordable?'Recordable':'Playback'}</div>
              </div>
            </button>
          ))}
        </div>

        {selected==='Custom Track' && (
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm mb-4 focus:outline-none focus:border-violet-400"
            placeholder="Enter track name…"
            value={customName} onChange={e=>setCustomName(e.target.value)}
            autoFocus
            onKeyDown={e=>{ if(e.key==='Enter' && chosen) handleAdd(); }}/>
        )}

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
            Cancel
          </button>
          <button onClick={handleAdd}
            disabled={!chosen||(chosen.label==='Custom Track'&&!customName.trim())}
            className="flex-1 px-4 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Add Track
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── MixerChannel (scrollable track strip item) ──────────────────── */
function MixerChannel({ track, updateTrack, analyser }: { track: Track; updateTrack: (id:string,u:Partial<Track>)=>void; analyser: AnalyserNode|null }) {
  const isRecordable = track.type === 'mic';
  const db = ((track.volume-1)*12).toFixed(1);
  return (
    <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ width: 64 }}>
      <span className="text-[9px] font-bold text-gray-800 truncate w-full text-center leading-tight" title={track.name}>{track.name}</span>
      <div className="flex gap-1">
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{muted:!track.muted})}
          className={`w-7 h-5 rounded text-[9px] font-bold ${track.muted?'bg-red-500 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>M</button>
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{soloed:!track.soloed})}
          className={`w-7 h-5 rounded text-[9px] font-bold ${track.soloed?'bg-yellow-400 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>S</button>
      </div>
      <PanKnob value={track.pan} onChange={v=>updateTrack(track.id,{pan:v})} color={track.color} size="sm"/>
      <div className="flex gap-1 items-end">
        <VerticalFader value={track.volume} onChange={v=>updateTrack(track.id,{volume:v})} color={track.color} height={140}/>
        <LevelMeter analyser={analyser} height={140} width={8}/>
      </div>
      <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">{db} dB</div>
      {/* ARM button — only for recordable (mic) tracks */}
      {isRecordable && (
        <button onPointerDown={e=>e.stopPropagation()} onClick={()=>updateTrack(track.id,{armed:!track.armed})}
          title={track.armed?'Disarm track':'Arm track for recording'}
          className={`w-full py-0.5 rounded text-[9px] font-bold transition-all ${
            track.armed ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 border border-dashed border-gray-300'
          }`}>
          {track.armed ? '● ARM' : 'ARM'}
        </button>
      )}
    </div>
  );
}

/* ── CompactBusStrip (Music Bed, SFX, Monitor) ───────────────────── */
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
        <VerticalFader value={vol} onChange={onVol} color={color} height={140}/>
        <LevelMeter analyser={analyser} height={140} width={8}/>
      </div>
      <div className="w-full py-0.5 bg-gray-50 border border-gray-200 rounded text-center text-[9px] font-mono">{db} dB</div>
    </div>
  );
}

/* ── PadSection wrapper ─────────────────────────────────────────── */
function PadSection({ icon, label, color, children }: { icon: React.ReactNode; label: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <div className={`flex items-center gap-1.5 mb-2`}>
        {icon}
        <span className={`text-[10px] font-bold tracking-widest uppercase ${color}`}>{label}</span>
      </div>
      {children}
    </div>
  );
}

/* ── Pad divider ─────────────────────────────────────────────────── */
function PadDivider() {
  return <div className="flex items-center gap-2 my-3"><div className="flex-1 h-px bg-gray-300"/><div className="w-1 h-1 rounded-full bg-gray-300"/><div className="flex-1 h-px bg-gray-300"/></div>;
}

/* ── Music Pad Button (one-shot trigger) ─────────────────────────── */
function MusicPadButton({ pad, type, onClick, onClear }: { pad:PadData; type:'music'|'sfx'; onClick:()=>void; onClear:()=>void }) {
  const loaded = !!pad.buffer;
  const base   = type==='music'
    ? `bg-blue-100 border-blue-300 text-blue-900 hover:bg-blue-200${pad.playing?' ring-2 ring-blue-400 bg-blue-300':''}`
    : `bg-orange-100 border-orange-300 text-orange-900 hover:bg-orange-200${pad.playing?' ring-2 ring-orange-400 bg-orange-300':''}`;
  return (
    <button onClick={onClick} onPointerDown={e=>e.stopPropagation()}
      onContextMenu={e=>{ e.preventDefault(); if(loaded) onClear(); }}
      title={loaded?`${pad.filename}\nClick to play · Right-click to clear`:`Click to load audio`}
      className={`w-full h-[52px] rounded-xl border-2 text-[9px] font-bold flex flex-col items-center justify-center gap-1 transition-all ${
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

/* ── Effect Pad Button (toggle) ──────────────────────────────────── */
function EffectPadButton({ label, available, active, onToggle, desc }: { label:string; available:boolean; active:boolean; onToggle:()=>void; desc:string }) {
  if (!available) {
    return (
      <div title={desc}
        className="w-full h-[52px] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-0.5 opacity-50 cursor-not-allowed">
        <span className="text-[9px] font-bold text-gray-400">{label}</span>
        <span className="text-[7px] text-gray-400 text-center px-1 leading-tight">Unavailable</span>
      </div>
    );
  }
  return (
    <button onClick={onToggle} onPointerDown={e=>e.stopPropagation()} title={desc}
      className={`w-full h-[52px] rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 font-bold transition-all ${
        active
          ? 'border-violet-500 bg-violet-100 text-violet-800 shadow-sm ring-2 ring-violet-300'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600'
      }`}>
      <span className="text-[10px] font-bold">{label}</span>
      <span className={`text-[7px] font-semibold ${active?'text-violet-600':'text-gray-400'}`}>{active?'ON':'OFF'}</span>
    </button>
  );
}

/* ── EQ Row ─────────────────────────────────────────────────────── */
function EQRow({ eq, onEQ, dimmed=false }: { eq:EQState; onEQ:(band:keyof EQState,v:number)=>void; dimmed?:boolean }) {
  return (
    <div className={`flex gap-1.5 pt-1 border-t border-gray-100 w-full justify-center transition-opacity ${dimmed?'opacity-40':''}`}>
      <EQKnob label="L" value={eq.low}  onChange={v=>onEQ('low',v)}  disabled={dimmed}/>
      <EQKnob label="M" value={eq.mid}  onChange={v=>onEQ('mid',v)}  disabled={dimmed}/>
      <EQKnob label="H" value={eq.high} onChange={v=>onEQ('high',v)} disabled={dimmed}/>
    </div>
  );
}

/* ── EQ Knob ────────────────────────────────────────────────────── */
function EQKnob({ label, value, onChange, disabled=false }: { label:string; value:number; onChange:(v:number)=>void; disabled?:boolean }) {
  const isDragging = useRef(false); const startY = useRef(0); const startVal = useRef(0);
  const deg = (value/12)*135;
  return (
    <div className="flex flex-col items-center">
      <div className="w-5 h-5 rounded-full border border-gray-400 bg-gray-100 relative"
        style={{ cursor: disabled?'default':'ns-resize', touchAction:'none', userSelect:'none' }}
        onPointerDown={e=>{ if(disabled) return; isDragging.current=true; startY.current=e.clientY; startVal.current=value; e.currentTarget.setPointerCapture(e.pointerId); e.stopPropagation(); }}
        onPointerMove={e=>{ if(!isDragging.current||disabled) return; onChange(Math.max(-12,Math.min(12,startVal.current+(startY.current-e.clientY)*0.22))); e.stopPropagation(); }}
        onPointerUp={e=>{ isDragging.current=false; e.currentTarget.releasePointerCapture(e.pointerId); }}
        onDoubleClick={()=>{ if(!disabled) onChange(0); }}
        title={disabled?'EQ preset active — disable EQ effect to adjust':`${label}: ${value>=0?'+':''}${value.toFixed(1)} dB · Double-click to reset`}>
        <div className="absolute rounded-full bg-gray-600"
          style={{ width:1.5,height:7,top:'50%',left:'50%',transformOrigin:'50% 100%',transform:`translate(-50%,-100%) rotate(${deg}deg)` }}/>
      </div>
      <span className="text-[7px] text-gray-500">{label}</span>
      <span className="text-[6px] font-mono text-gray-400 leading-none">{value>=0?'+':''}{value.toFixed(0)}</span>
    </div>
  );
}

/* ── Pan Knob ───────────────────────────────────────────────────── */
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

/* ── Vertical Fader ─────────────────────────────────────────────── */
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
