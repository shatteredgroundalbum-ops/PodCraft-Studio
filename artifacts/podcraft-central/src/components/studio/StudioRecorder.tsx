import React, { useEffect, useState, useRef } from 'react';
import {
  Mic, Music, Volume2, Plus, Settings2, MoreHorizontal,
  ChevronDown, Scissors, Copy, Clipboard, Trash2, Split, Pause,
} from 'lucide-react';
import { useStudio, TrackType, Track } from '../../store/StudioContext';

export function StudioRecorder() {
  const { tracks, addTrack, updateTrack, deleteTrack, playheadPosition, setPlayheadPosition, zoom, setZoom } = useStudio();
  const timelineRef = useRef<HTMLDivElement>(null);
  const [editToolsOpen, setEditToolsOpen] = useState(false);
  const [addTrackOpen, setAddTrackOpen] = useState(false);
  const [markers, setMarkers] = useState<{ id: string; time: number }[]>([]);
  const editRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditToolsOpen(false);
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddTrackOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    setPlayheadPosition(Math.max(0, x / zoom));
  };

  const renderRuler = () => {
    const duration = Math.max(300, playheadPosition + 60);
    return Array.from({ length: Math.floor(duration / 5) + 1 }, (_, i) => i * 5).map((i) => {
      const isMajor = i % 15 === 0;
      return (
        <div key={i} className="absolute top-0 bottom-0 border-l border-gray-200" style={{ left: i * zoom }}>
          {isMajor && (
            <span className="absolute -top-6 -left-3 text-[10px] text-gray-500 font-mono">
              {String(Math.floor(i / 60)).padStart(2, '0')}:{String(i % 60).padStart(2, '0')}
            </span>
          )}
        </div>
      );
    });
  };

  const canAddMore = tracks.length < 32;

  const editTools = [
    { icon: Scissors, label: 'Cut', shortcut: '⌘X' },
    { icon: Copy, label: 'Copy', shortcut: '⌘C' },
    { icon: Clipboard, label: 'Paste', shortcut: '⌘V' },
    { icon: Split, label: 'Split at Playhead', shortcut: 'S' },
    { icon: Pause, label: 'Fade In' },
    { icon: Pause, label: 'Fade Out' },
    { icon: Trash2, label: 'Delete', shortcut: 'Del', danger: true },
  ];

  return (
    <div className="flex-1 min-h-[420px] flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-white z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-violet-600" />
          <h2 className="font-semibold text-gray-900">Recorder</h2>
          <span className="text-xs font-medium text-gray-400 ml-2">{tracks.length} / 32 tracks</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit Tools */}
          <div className="relative" ref={editRef}>
            <button onClick={() => setEditToolsOpen(!editToolsOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md border border-gray-200">
              <Settings2 className="w-4 h-4" /> Edit Tools <ChevronDown className="w-4 h-4" />
            </button>
            {editToolsOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                {editTools.map((tool, i) => (
                  <button key={i} onClick={() => setEditToolsOpen(false)}
                    className={`w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 ${tool.danger ? 'text-red-600' : 'text-gray-700'}`}>
                    <span className="flex items-center gap-2"><tool.icon className="w-4 h-4" />{tool.label}</span>
                    {tool.shortcut && <span className="text-[10px] text-gray-400 font-mono">{tool.shortcut}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setMarkers([...markers, { id: Math.random().toString(36).substr(2, 9), time: playheadPosition }])}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-md">
            <Plus className="w-4 h-4" /> Marker
          </button>

          {/* Add Track */}
          <div className="relative" ref={addRef}>
            <button disabled={!canAddMore} onClick={() => setAddTrackOpen(!addTrackOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4" /> Add Track
            </button>
            {addTrackOpen && canAddMore && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                {([['mic', 'Microphone Track', Mic, 'text-violet-600'], ['music', 'Music Track', Music, 'text-green-600'], ['sfx', 'SFX Track', Volume2, 'text-red-600']] as const).map(([type, label, Icon, color]) => (
                  <button key={type} onClick={() => { addTrack(type as TrackType); setAddTrackOpen(false); }}
                    className="w-full px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                    <Icon className={`w-4 h-4 ${color}`} /> {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="text-lg text-gray-400">-</span>
            <input type="range" min="10" max="200" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 accent-violet-600" />
            <span className="text-lg text-gray-400">+</span>
          </div>
        </div>
      </div>

      {/* Timeline & Tracks */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Track Headers */}
        <div className="w-[240px] flex-shrink-0 border-r border-gray-200 bg-white z-20 overflow-y-auto">
          <div className="h-8 border-b border-gray-100 bg-gray-50 sticky top-0" />
          {tracks.map((track) => (
            <TrackHeader key={track.id} track={track} updateTrack={updateTrack} deleteTrack={deleteTrack} />
          ))}
          <div className="p-3">
            <button onClick={() => addTrack('mic')} disabled={!canAddMore}
              className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> Add Track
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div ref={timelineRef} className="flex-1 overflow-auto relative bg-gray-50">
          <div className="h-8 border-b border-gray-200 bg-white sticky top-0 z-10">
            <div className="relative h-full" style={{ width: Math.max(3000, (playheadPosition + 60) * zoom) }}>
              {renderRuler()}
              {markers.map((m) => (
                <div key={m.id} className="absolute top-0 bottom-0 w-px bg-amber-500" style={{ left: m.time * zoom }}>
                  <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-amber-500 rotate-45" />
                </div>
              ))}
            </div>
          </div>

          <div className="relative" style={{ width: Math.max(3000, (playheadPosition + 60) * zoom) }}>
            {tracks.map((track) => (
              <div key={track.id} className="h-[88px] border-b border-gray-200 relative group hover:bg-gray-100/30 transition-colors">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ backgroundImage: 'linear-gradient(90deg, transparent 99%, rgba(0,0,0,0.05) 100%)', backgroundSize: `${zoom}px 100%` }} />
                {track.clips.map((clip) => (
                  <div key={clip.id} className="absolute top-2 bottom-2 rounded-md border border-black/10 shadow-sm overflow-hidden cursor-move"
                    style={{ left: clip.startTime * zoom, width: clip.duration * zoom, backgroundColor: track.color }}>
                    <Waveform buffer={clip.buffer} color="rgba(255,255,255,0.85)" />
                  </div>
                ))}
              </div>
            ))}
            <div className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none" style={{ left: playheadPosition * zoom }}>
              <div className="absolute -top-3 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
            </div>
          </div>

          <div className="absolute top-0 left-0 right-0 bottom-0 z-20 cursor-text" onClick={handleTimelineClick} />
        </div>
      </div>
    </div>
  );
}

function TrackHeader({ track, updateTrack, deleteTrack }: {
  track: Track;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = track.type === 'mic' ? Mic : track.type === 'music' ? Music : Volume2;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="h-[88px] border-b border-gray-200 p-3 flex flex-col justify-between bg-white group relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: track.color }} />
          <input type="text" value={track.name}
            onChange={(e) => updateTrack(track.id, { name: e.target.value })}
            className="text-sm font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-violet-500 rounded px-1 w-28" />
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
              <button onClick={() => { updateTrack(track.id, { armed: !track.armed }); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-gray-700 text-left">
                {track.armed ? 'Disarm' : 'Arm for Record'}
              </button>
              <button onClick={() => { deleteTrack(track.id); setMenuOpen(false); }}
                className="w-full px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2 text-left">
                <Trash2 className="w-3.5 h-3.5" /> Delete Track
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex bg-gray-100 rounded p-0.5">
          <button onClick={() => updateTrack(track.id, { muted: !track.muted })}
            className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${track.muted ? 'bg-red-500 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>M</button>
          <button onClick={() => updateTrack(track.id, { soloed: !track.soloed })}
            className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-colors ${track.soloed ? 'bg-yellow-400 text-white' : 'text-gray-600 hover:bg-gray-200'}`}>S</button>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <Volume2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <input type="range" min="0" max="1.5" step="0.01" value={track.volume}
            onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: track.color }} />
        </div>
        {track.type === 'mic' && (
          <button onClick={() => updateTrack(track.id, { armed: !track.armed })}
            title={track.armed ? 'Armed for record' : 'Arm for record'}
            className={`w-3 h-3 rounded-full border-2 transition-colors ${track.armed ? 'bg-red-500 border-red-500' : 'border-gray-300 hover:border-red-400'}`} />
        )}
      </div>
    </div>
  );
}

function Waveform({ buffer, color }: { buffer: AudioBuffer; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !buffer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  }, [buffer, color]);
  return <canvas ref={canvasRef} className="w-full h-full opacity-90" width={1000} height={100} />;
}
