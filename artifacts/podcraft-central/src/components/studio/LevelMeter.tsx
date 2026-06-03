import { useEffect, useRef } from 'react';

interface LevelMeterProps {
  analyser: AnalyserNode | null;
  height?: number;
  width?: number;
}

/**
 * Real-time vertical level meter.
 * Reads RMS from AnalyserNode via requestAnimationFrame.
 * Green → yellow → orange → red gradient with peak hold.
 */
export function LevelMeter({ analyser, height = 140, width = 8 }: LevelMeterProps) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const rafRef     = useRef(0);
  const peakLvl    = useRef(0);
  const peakExpiry = useRef(0); // frame count when peak starts decaying
  const frame      = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;

    // cache gradient so it's only created when dimensions change
    let grad: CanvasGradient | null = null;
    const makeGrad = () => {
      grad = g.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0,    '#22c55e'); // green
      grad.addColorStop(0.6,  '#eab308'); // yellow
      grad.addColorStop(0.82, '#f97316'); // orange
      grad.addColorStop(1,    '#ef4444'); // red
    };
    makeGrad();

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      frame.current++;
      const w = canvas.width, h = canvas.height;

      let level = 0;
      if (analyser) {
        const buf = new Float32Array(analyser.fftSize);
        analyser.getFloatTimeDomainData(buf);
        const rms = Math.sqrt(buf.reduce((s, v) => s + v * v, 0) / buf.length);
        const db  = 20 * Math.log10(Math.max(rms, 1e-7));
        level = Math.max(0, Math.min(1, (db + 60) / 60));
      }

      // Peak hold: hold 80 frames then decay
      if (level >= peakLvl.current) {
        peakLvl.current    = level;
        peakExpiry.current = frame.current + 80;
      } else if (frame.current > peakExpiry.current) {
        peakLvl.current = Math.max(0, peakLvl.current - 0.007);
      }

      // Draw
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#e5e7eb';
      g.fillRect(0, 0, w, h);

      if (level > 0 && grad) {
        const barH = Math.round(level * h);
        g.fillStyle = grad;
        g.fillRect(0, h - barH, w, barH);
      }

      // Peak tick
      if (peakLvl.current > 0.01) {
        const py = Math.round(h - peakLvl.current * h);
        g.fillStyle = peakLvl.current > 0.9 ? '#ef4444' : '#6b7280';
        g.fillRect(0, py, w, 2);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-sm flex-shrink-0"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
