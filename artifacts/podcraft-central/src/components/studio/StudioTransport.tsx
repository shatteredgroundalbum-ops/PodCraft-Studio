import React, { useEffect, useRef, useState } from 'react';
import { Play, Square, Circle, Rewind, Mic, Volume2, Headphones } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

export function StudioTransport() {
  const { isPlaying, isRecording, togglePlay, toggleRecord, stop, masterVolume, setMasterVolume } = useStudio();

  return (
    <div className="h-24 bg-white border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0 z-50 relative">
      {/* Input */}
      <div className="flex items-center gap-4 w-[300px]">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 mb-2">INPUT (MIC/LINE)</span>
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-violet-600" />
            <Knob value={0.8} onChange={() => {}} color="#8b5cf6" />
            <Meter analyserNode={engine.inputAnalyser} />
            <span className="text-xs font-mono text-gray-500 w-12">-12.0 dB</span>
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center gap-4 bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
        <button onClick={stop} className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">
          <Rewind className="w-6 h-6" />
        </button>
        <div className="relative">
          <button onClick={toggleRecord}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-sm ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white text-red-500 hover:bg-red-50 border border-gray-200'}`}>
            <Circle className="w-6 h-6 fill-current" />
          </button>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500 whitespace-nowrap">REC</span>
        </div>
        <div className="relative">
          <button onClick={stop} className="w-14 h-14 flex items-center justify-center rounded-full bg-white text-gray-800 hover:bg-gray-50 border border-gray-200 transition-colors shadow-sm">
            <Square className="w-5 h-5 fill-current" />
          </button>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500">STOP</span>
        </div>
        <div className="relative">
          <button onClick={togglePlay}
            className={`w-14 h-14 flex items-center justify-center rounded-full transition-all shadow-sm ${isPlaying ? 'bg-green-100 text-green-600' : 'bg-white text-green-500 hover:bg-green-50 border border-gray-200'}`}>
            <Play className="w-6 h-6 fill-current ml-1" />
          </button>
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500">PLAY</span>
        </div>
      </div>

      {/* Output */}
      <div className="flex items-center gap-8 w-[300px] justify-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-gray-500 mb-2">OUTPUT (MONITOR)</span>
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-violet-600" />
            <Knob value={masterVolume} onChange={setMasterVolume} color="#8b5cf6" />
            <Meter analyserNode={engine.masterAnalyser} />
            <span className="text-xs font-mono text-gray-500 w-12">-6.0 dB</span>
          </div>
        </div>
        <div className="w-px h-12 bg-gray-200" />
        <div className="flex items-center gap-3">
          <Headphones className="w-6 h-6 text-gray-400" />
          <span className="text-xs font-mono text-gray-500">-10.0 dB</span>
        </div>
      </div>
    </div>
  );
}

function Meter({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!analyserNode || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dataArray = new Uint8Array(analyserNode.frequencyBinCount);
    let animationId: number;
    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyserNode.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const val = (dataArray[i] - 128) / 128;
        sum += val * val;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = 20 * Math.log10(Math.max(rms, 0.0001));
      const level = Math.max(0, Math.min(1, (db + 60) / 60));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const segments = 12;
      const gap = 2;
      const w = (canvas.width - (segments - 1) * gap) / segments;
      for (let i = 0; i < segments; i++) {
        const x = i * (w + gap);
        if (level > i / segments) {
          ctx.fillStyle = i > 9 ? '#ef4444' : i > 7 ? '#eab308' : '#22c55e';
        } else {
          ctx.fillStyle = '#e5e7eb';
        }
        ctx.fillRect(x, 0, w, canvas.height);
      }
    };
    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyserNode]);

  return (
    <div className="flex flex-col gap-1">
      <canvas ref={canvasRef} width={100} height={8} className="rounded-sm" />
      <div className="flex justify-between text-[8px] text-gray-400 font-mono">
        {['-60', '-48', '-36', '-24', '-12', '-6', '-3', '0'].map((l) => <span key={l}>{l}</span>)}
      </div>
    </div>
  );
}

function Knob({ value, onChange, color }: { value: number; onChange: (v: number) => void; color: string }) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(0);
  const deg = (value / 1.5) * 270 - 135;

  return (
    <div
      className="w-8 h-8 rounded-full border-2 border-gray-200 relative cursor-ns-resize touch-none"
      onPointerDown={(e) => {
        setIsDragging(true);
        startY.current = e.clientY;
        startVal.current = value;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!isDragging) return;
        onChange(Math.max(0, Math.min(1.5, startVal.current + (startY.current - e.clientY) * 0.01)));
      }}
      onPointerUp={(e) => {
        setIsDragging(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}>
      <div className="absolute top-1/2 left-1/2 w-1 h-3 bg-gray-400 rounded-full -translate-x-1/2 -translate-y-full origin-bottom"
        style={{ transform: `translate(-50%, -100%) rotate(${deg}deg)`, color }} />
    </div>
  );
}
