import React, { useEffect, useRef } from 'react';
import { Play, Square, Circle, Rewind, Mic, Volume2, Headphones } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

export function StudioTransport() {
  const {
    isPlaying, isRecording, togglePlay, toggleRecord, stop,
    masterVolume, setMasterVolume,
    inputGainLevel, setInputGainLevel,
  } = useStudio();

  const inputDb  = gainToDb(inputGainLevel);
  const outputDb = gainToDb(masterVolume);

  return (
    <div className="bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-50 relative"
      style={{ height: 112 }}>

      {/* ── Input section ── */}
      <div className="flex flex-col gap-1 w-[280px]">
        <span className="text-[10px] font-bold text-gray-400 tracking-widest">INPUT  (MIC / LINE)</span>
        <div className="flex items-center gap-3">
          <Mic className="w-5 h-5 text-violet-500 shrink-0" />
          <Knob
            value={inputGainLevel}
            min={0} max={1.5}
            onChange={setInputGainLevel}
            color="#8b5cf6"
            label={`${inputDb} dB`}
          />
          <Meter analyserNode={engine.inputAnalyser} />
          <span className="text-[11px] font-mono text-gray-500 w-14 text-right">{inputDb} dB</span>
        </div>
      </div>

      {/* ── Transport buttons ── */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
          {/* Return to start */}
          <button
            onClick={stop}
            title="Return to start"
            className="w-11 h-11 flex items-center justify-center text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">
            <Rewind className="w-5 h-5" />
          </button>

          {/* Record */}
          <TransportBtn
            onClick={toggleRecord}
            active={isRecording}
            activeClass="bg-red-50 text-red-600 ring-2 ring-red-400 animate-pulse"
            inactiveClass="bg-white text-red-500 hover:bg-red-50 border border-gray-200"
            label="REC">
            <Circle className="w-5 h-5 fill-current" />
          </TransportBtn>

          {/* Stop */}
          <TransportBtn
            onClick={stop}
            active={false}
            activeClass=""
            inactiveClass="bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            label="STOP">
            <Square className="w-5 h-5 fill-current" />
          </TransportBtn>

          {/* Play */}
          <TransportBtn
            onClick={togglePlay}
            active={isPlaying}
            activeClass="bg-green-50 text-green-600 ring-2 ring-green-400"
            inactiveClass="bg-white text-green-600 hover:bg-green-50 border border-gray-200"
            label="PLAY">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </TransportBtn>
        </div>
      </div>

      {/* ── Output section ── */}
      <div className="flex items-center gap-6 w-[280px] justify-end">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 tracking-widest">OUTPUT  (MONITOR)</span>
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-violet-500 shrink-0" />
            <Knob
              value={masterVolume}
              min={0} max={1.5}
              onChange={setMasterVolume}
              color="#8b5cf6"
              label={`${outputDb} dB`}
            />
            <Meter analyserNode={engine.masterAnalyser} />
            <span className="text-[11px] font-mono text-gray-500 w-14 text-right">{outputDb} dB</span>
          </div>
        </div>

        <div className="w-px h-10 bg-gray-200" />

        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-gray-400" />
          <span className="text-[11px] font-mono text-gray-400">Monitor</span>
        </div>
      </div>
    </div>
  );
}

/* ── Helper components ────────────────────────────────────────── */

function TransportBtn({
  onClick, active, activeClass, inactiveClass, label, children,
}: {
  onClick: () => void;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-full transition-all shadow-sm ${active ? activeClass : inactiveClass}`}>
        {children}
      </button>
      <span className="text-[9px] font-bold text-gray-400 tracking-widest">{label}</span>
    </div>
  );
}

function gainToDb(gain: number): string {
  if (gain <= 0) return '-∞';
  const db = 20 * Math.log10(gain);
  return db.toFixed(1);
}

/* ── Rotary knob ─────────────────────────────────────────────── */
function Knob({
  value, min = 0, max = 1.5, onChange, color, label,
}: {
  value: number; min?: number; max?: number;
  onChange: (v: number) => void; color: string; label?: string;
}) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);

  const pct = (value - min) / (max - min);
  const deg = pct * 270 - 135; // -135° (min) → +135° (max)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className="rounded-full border-2 border-gray-200 bg-white relative"
        style={{ width: 32, height: 32, cursor: 'ns-resize', touchAction: 'none', userSelect: 'none' }}
        title={label}
        onPointerDown={(e) => {
          isDragging.current = true;
          startY.current = e.clientY;
          startVal.current = value;
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!isDragging.current) return;
          const delta = (startY.current - e.clientY) * (max - min) * 0.008;
          onChange(Math.max(min, Math.min(max, startVal.current + delta)));
        }}
        onPointerUp={(e) => {
          isDragging.current = false;
          e.currentTarget.releasePointerCapture(e.pointerId);
        }}
        onDoubleClick={() => onChange((min + max) / 2)}>
        {/* Arc indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 3,
            height: 11,
            backgroundColor: color,
            borderRadius: 2,
            transformOrigin: '50% 100%',
            transform: `translate(-50%, -100%) rotate(${deg}deg)`,
          }}
        />
        {/* Center dot */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 4,
            height: 4,
            marginTop: -2,
            marginLeft: -2,
            borderRadius: '50%',
            backgroundColor: '#d1d5db',
          }}
        />
      </div>
    </div>
  );
}

/* ── Level meter ─────────────────────────────────────────────── */
function Meter({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const segments = 14;
    const gap = 2;
    let animId: number;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      let level = 0;

      if (analyserNode) {
        const data = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const db = 20 * Math.log10(Math.max(rms, 0.0001));
        level = Math.max(0, Math.min(1, (db + 60) / 60));
      }

      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      const w = (canvas.width - (segments - 1) * gap) / segments;
      for (let i = 0; i < segments; i++) {
        const x = i * (w + gap);
        ctx2d.fillStyle = level > i / segments
          ? (i > 11 ? '#ef4444' : i > 9 ? '#eab308' : '#22c55e')
          : '#e5e7eb';
        ctx2d.fillRect(x, 0, w, canvas.height);
      }
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [analyserNode]);

  return (
    <div className="flex flex-col gap-0.5">
      <canvas ref={canvasRef} width={120} height={10} className="rounded-sm" />
      <div className="flex justify-between text-[7px] text-gray-400 font-mono">
        {['-60','-48','-36','-24','-12','-6','-3','0'].map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}
