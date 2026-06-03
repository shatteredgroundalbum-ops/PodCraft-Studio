import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Minus, Mic, Volume2, Rewind, Square, Play, Circle, FastForward } from 'lucide-react';
import { useStudio, Track } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

export function StudioMixer() {
  const {
    tracks, updateTrack, masterVolume, setMasterVolume,
    inputGainLevel, setInputGainLevel,
    isPlaying, isRecording, togglePlay, toggleRecord, stop,
    mixerOpen, setMixerOpen,
  } = useStudio();

  const [position, setPosition] = useState(() => ({
    x: Math.max(20, window.innerWidth - 740),
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

  const mixerW = Math.min(960, tracks.length * 82 + 180);

  return (
    <div
      className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col z-[100] overflow-hidden select-none"
      style={{ left: position.x, top: position.y, width: mixerW, touchAction: 'none' }}>

      {/* ── Drag handle / title bar ── */}
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
          <button onClick={() => setMinimized(!minimized)} className="text-gray-400 hover:text-gray-600 p-0.5">
            <Minus className="w-4 h-4" />
          </button>
          <button onClick={() => setMixerOpen(false)} className="text-gray-400 hover:text-gray-600 p-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Channel strips ── */}
      {!minimized && (
        <div className="flex px-4 pt-4 pb-2 gap-3 overflow-x-auto" style={{ touchAction: 'auto' }}>
          {tracks.map((track) => <MixerChannel key={track.id} track={track} updateTrack={updateTrack} />)}
          <div className="w-px bg-gray-200 mx-1 self-stretch" />
          <MasterChannel masterVolume={masterVolume} setMasterVolume={setMasterVolume} />
        </div>
      )}

      {/* ── Transport dock (always visible) ── */}
      <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-between gap-4 flex-shrink-0">

        {/* Input volume */}
        <div className="flex items-center gap-2 min-w-[140px]">
          <Mic className="w-4 h-4 text-violet-500 shrink-0" />
          <IOKnob value={inputGainLevel} onChange={setInputGainLevel} color="#8b5cf6" analyser={engine.inputAnalyser} label="IN" />
        </div>

        {/* Transport buttons — order: Rewind · Stop · Play · Rec · FF */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-5 py-2 shadow-sm">
          <TBtn onClick={stop} title="Rewind to start">
            <Rewind className="w-4 h-4" />
          </TBtn>

          <TBtn onClick={stop} title="Stop">
            <Square className="w-4 h-4 fill-current" />
          </TBtn>

          <TBtn
            onClick={togglePlay}
            title="Play"
            active={isPlaying}
            activeClass="bg-green-500 text-white shadow-md shadow-green-300"
            size="lg">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </TBtn>

          <TBtn
            onClick={toggleRecord}
            title="Record"
            active={isRecording}
            activeClass="bg-red-500 text-white shadow-md shadow-red-300 animate-pulse">
            <Circle className="w-4 h-4 fill-current" />
          </TBtn>

          <TBtn onClick={() => {}} title="Fast Forward">
            <FastForward className="w-4 h-4" />
          </TBtn>
        </div>

        {/* Output volume */}
        <div className="flex items-center gap-2 min-w-[140px] justify-end">
          <IOKnob value={masterVolume} onChange={setMasterVolume} color="#8b5cf6" analyser={engine.masterAnalyser} label="OUT" />
          <Volume2 className="w-4 h-4 text-violet-500 shrink-0" />
        </div>
      </div>
    </div>
  );
}

/* ── Transport button ──────────────────────────────────────────── */
function TBtn({
  onClick, title, active = false,
  activeClass = '',
  size = 'sm',
  children,
}: {
  onClick: () => void; title: string;
  active?: boolean; activeClass?: string;
  size?: 'sm' | 'lg';
  children: React.ReactNode;
}) {
  const base = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  return (
    <button
      onClick={onClick}
      title={title}
      onPointerDown={(e) => e.stopPropagation()}
      className={`${base} flex items-center justify-center rounded-full transition-all duration-150 ${active ? activeClass : 'text-gray-600 hover:bg-gray-100'}`}>
      {children}
    </button>
  );
}

/* ── I/O knob + meter strip ────────────────────────────────────── */
function IOKnob({
  value, onChange, color, analyser, label,
}: {
  value: number; onChange: (v: number) => void; color: string;
  analyser: AnalyserNode | null; label: string;
}) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);
  const pct = Math.max(0, Math.min(1, value / 1.5));
  const deg = pct * 270 - 135;
  const db = value <= 0 ? '-∞' : (20 * Math.log10(value)).toFixed(1);

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] font-bold text-gray-400 tracking-widest">{label}</span>
        <div
          className="rounded-full border-2 border-gray-200 bg-white relative"
          style={{ width: 30, height: 30, cursor: 'ns-resize', touchAction: 'none', userSelect: 'none' }}
          title={`${label}: ${db} dB — drag up/down`}
          onPointerDown={(e) => {
            isDragging.current = true;
            startY.current = e.clientY;
            startVal.current = value;
            e.currentTarget.setPointerCapture(e.pointerId);
            e.stopPropagation();
          }}
          onPointerMove={(e) => {
            if (!isDragging.current) return;
            const delta = (startY.current - e.clientY) * 0.012;
            onChange(Math.max(0, Math.min(1.5, startVal.current + delta)));
            e.stopPropagation();
          }}
          onPointerUp={(e) => {
            isDragging.current = false;
            e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onDoubleClick={() => onChange(1)}>
          <div
            style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 2, height: 9, backgroundColor: color,
              borderRadius: 2, transformOrigin: '50% 100%',
              transform: `translate(-50%, -100%) rotate(${deg}deg)`,
            }}
          />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 4, height: 4, marginTop: -2, marginLeft: -2, borderRadius: '50%', backgroundColor: '#d1d5db' }} />
        </div>
        <span className="text-[9px] font-mono text-gray-400">{db} dB</span>
      </div>
      <MeterBar analyser={analyser} />
    </div>
  );
}

/* ── Vertical mini meter ───────────────────────────────────────── */
function MeterBar({ analyser }: { analyser: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      let level = 0;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        level = Math.max(0, Math.min(1, (20 * Math.log10(Math.max(rms, 0.0001)) + 60) / 60));
      }
      const segs = 10, gap = 1;
      const h = (canvas.height - (segs - 1) * gap) / segs;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < segs; i++) {
        const y = canvas.height - i * (h + gap) - h;
        ctx.fillStyle = level > i / segs ? (i > 8 ? '#ef4444' : i > 6 ? '#eab308' : '#22c55e') : '#e5e7eb';
        ctx.fillRect(0, y, canvas.width, h);
      }
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [analyser]);
  return <canvas ref={canvasRef} width={6} height={56} className="rounded-sm" />;
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
        title="Pan — drag L/R, double-click to center">
        <div className="absolute rounded-full bg-gray-700" style={{ width: 2, height: 10, top: '50%', left: '50%', transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${deg}deg)` }} />
        <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gray-300" />
      </div>
      <span className="text-[9px] font-mono text-gray-500">{panLabel}</span>
    </div>
  );
}

/* ── Vertical fader ───────────────────────────────────────────── */
function VerticalFader({ value, onChange, color, min = 0, max = 1.5 }: { value: number; onChange: (v: number) => void; color: string; min?: number; max?: number }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const updateFromY = useCallback((clientY: number) => {
    const el = trackRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    onChange(min + Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)) * (max - min));
  }, [onChange, min, max]);
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div ref={trackRef} className="relative w-8 flex justify-center" style={{ height: 160, touchAction: 'none', userSelect: 'none', cursor: 'pointer' }}
      onPointerDown={(e) => { e.stopPropagation(); isDragging.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); updateFromY(e.clientY); }}
      onPointerMove={(e) => { if (!isDragging.current) return; e.stopPropagation(); updateFromY(e.clientY); }}
      onPointerUp={(e) => { isDragging.current = false; try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ } }}
      onPointerCancel={(e) => { isDragging.current = false; try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ok */ } }}>
      <div className="absolute top-1 bottom-1 w-0.5 bg-gray-200 rounded-full">
        {[0, 25, 50, 75, 100].map((p) => <div key={p} className="absolute w-2 h-px bg-gray-300" style={{ top: `${p}%`, left: -3 }} />)}
      </div>
      <div className="absolute w-8 h-6 bg-white border border-gray-300 shadow-md rounded-md flex items-center justify-center pointer-events-none" style={{ bottom: `calc(${pct}% - 12px)` }}>
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
      <div className="w-14 py-1 bg-gray-50 border border-gray-200 rounded text-center text-[10px] font-mono text-gray-600">{db} dB</div>
      <span className="text-[9px] text-gray-400">Stereo Out</span>
    </div>
  );
}
