import React, { useCallback, useEffect, useState, useRef, createContext, useContext } from 'react';
import { engine } from '../utils/studioAudioEngine';

export type TrackType = 'mic' | 'music' | 'sfx';

export interface AudioClip {
  id: string;
  buffer: AudioBuffer;
  startTime: number;
  duration: number;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  color: string;
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  preset: string;
  clips: AudioClip[];
}

export interface TrackPresetDef {
  gain: number;
  eq: { low: number; mid: number; high: number };
  compressor: { enabled: boolean; threshold: number; ratio: number };
  reverb?: boolean;
}

export const TRACK_PRESETS: Record<string, TrackPresetDef> = {
  'Podcast Voice - Clean':  { gain: 1.0, eq: { low: -1, mid: 2,  high: 1  }, compressor: { enabled: true,  threshold: -18, ratio: 3 } },
  'Podcast Voice - Warm':   { gain: 1.0, eq: { low: 3,  mid: 1,  high: -1 }, compressor: { enabled: true,  threshold: -18, ratio: 4 } },
  'Broadcast Clarity':      { gain: 1.0, eq: { low: -2, mid: 3,  high: 2  }, compressor: { enabled: true,  threshold: -20, ratio: 4 } },
  'Interview Remote':       { gain: 1.1, eq: { low: -3, mid: 2,  high: 2  }, compressor: { enabled: true,  threshold: -15, ratio: 6 } },
  'Vehicle/Noise Control':  { gain: 1.0, eq: { low: -6, mid: 1,  high: -2 }, compressor: { enabled: true,  threshold: -12, ratio: 8 } },
  'Untreated Room':         { gain: 1.0, eq: { low: 0,  mid: 0,  high: 0  }, compressor: { enabled: false, threshold: 0,   ratio: 1 } },
  'Noisy Room':             { gain: 1.0, eq: { low: -4, mid: 2,  high: -2 }, compressor: { enabled: true,  threshold: -12, ratio: 6 } },
  'Custom':                 { gain: 1.0, eq: { low: 0,  mid: 0,  high: 0  }, compressor: { enabled: false, threshold: 0,   ratio: 1 } },
};

interface StudioContextType {
  tracks: Track[];
  addTrack: (type: TrackType, name?: string) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  applyTrackPreset: (trackId: string, preset: string) => void;
  isPlaying: boolean;
  isRecording: boolean;
  playheadPosition: number;
  setPlayheadPosition: (pos: number) => void;
  togglePlay: () => void;
  toggleRecord: () => void;
  stop: () => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  inputGainLevel: number;
  setInputGainLevel: (v: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  inputDevices: MediaDeviceInfo[];
  selectedInputId: string;
  setSelectedInputId: (id: string) => void;
  mixerOpen: boolean;
  setMixerOpen: (open: boolean) => void;
  mixerDocked: boolean;
  setMixerDocked: (docked: boolean) => void;
  audioSetupDone: boolean;
  setAudioSetupDone: (done: boolean) => void;
}

const trackPalette = [
  '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#ef4444',
  '#f59e0b', '#14b8a6', '#6366f1', '#d946ef', '#06b6d4',
  '#84cc16', '#f97316', '#10b981', '#64748b', '#a855f7', '#eab308',
];

const StudioContext = createContext<StudioContextType | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [masterVolume, setMasterVolumeState] = useState(1);
  const [inputGainLevel, setInputGainLevelState] = useState(0.8);
  const [zoom, setZoom] = useState(50);
  const [mixerOpen, setMixerOpen] = useState(true);
  const [mixerDocked, setMixerDocked] = useState(true);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState('');
  const [audioSetupDone, setAudioSetupDoneState] = useState(() => {
    try { return localStorage.getItem('podcraft_audio_setup') === 'done'; } catch { return false; }
  });

  const timerRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const recordStartRef = useRef(0);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const inputs = devices.filter((d) => d.kind === 'audioinput');
      setInputDevices(inputs);
      if (inputs.length > 0) setSelectedInputId(inputs[0].deviceId);
    });
  }, []);

  useEffect(() => {
    if (selectedInputId) engine.requestInput(selectedInputId);
  }, [selectedInputId]);

  const setAudioSetupDone = (done: boolean) => {
    setAudioSetupDoneState(done);
    if (done) localStorage.setItem('podcraft_audio_setup', 'done');
  };

  const addTrack = (type: TrackType, name?: string) => {
    if (tracks.length >= 32) return;
    setTracks((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: name ?? `Track ${prev.length + 1}`,
        type,
        color: trackPalette[prev.length % trackPalette.length],
        volume: 1, pan: 0, muted: false, soloed: false,
        armed: type === 'mic',
        preset: 'Custom',
        clips: [],
      },
    ]);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        if (updates.volume !== undefined) engine.setTrackVolume(id, updates.volume);
        if (updates.pan !== undefined) engine.setTrackPan(id, updates.pan);
        return { ...t, ...updates };
      }),
    );
  };

  const deleteTrack = (id: string) => setTracks((prev) => prev.filter((t) => t.id !== id));

  const applyTrackPreset = (trackId: string, presetName: string) => {
    const p = TRACK_PRESETS[presetName];
    if (!p) return;
    engine.setTrackEQ(trackId, 'low', p.eq.low);
    engine.setTrackEQ(trackId, 'mid', p.eq.mid);
    engine.setTrackEQ(trackId, 'high', p.eq.high);
    engine.setTrackCompressor(trackId, p.compressor.enabled, p.compressor.threshold, p.compressor.ratio);
    updateTrack(trackId, { volume: p.gain, preset: presetName });
  };

  const tick = useCallback(() => {
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    setPlayheadPosition((prev) => prev + delta);
    timerRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTimer = () => { if (timerRef.current) { cancelAnimationFrame(timerRef.current); timerRef.current = null; } };
  const startTimer = () => { lastTimeRef.current = performance.now(); timerRef.current = requestAnimationFrame(tick); };

  const togglePlay = () => {
    engine.init();
    if (isPlaying) {
      setIsPlaying(false);
      engine.stop();
      stopTimer();
    } else {
      setIsPlaying(true);
      engine.play(tracks, playheadPosition);
      startTimer();
    }
  };

  const toggleRecord = async () => {
    engine.init();
    if (isRecording) {
      setIsRecording(false);
      stopTimer();
      const blob = await engine.stopRecording();
      const buffer = await engine.decodeAudioData(blob);
      if (buffer) {
        const newClip: AudioClip = {
          id: Math.random().toString(36).substr(2, 9),
          buffer, startTime: recordStartRef.current, duration: buffer.duration,
        };
        setTracks((prev) => prev.map((t) => t.armed ? { ...t, clips: [...t.clips, newClip] } : t));
      }
    } else {
      const armedTracks = tracks.filter((t) => t.armed);
      if (armedTracks.length === 0) { alert('Please arm at least one track to record.'); return; }
      if (!engine.stream) await engine.requestInput(selectedInputId || undefined);
      const started = engine.startRecording(() => {});
      if (started) {
        setIsRecording(true);
        recordStartRef.current = playheadPosition;
        startTimer();
      } else {
        alert('Could not access microphone. Please allow microphone permission and try again.');
      }
    }
  };

  const stop = () => {
    setIsPlaying(false);
    setIsRecording(false);
    setPlayheadPosition(0);
    engine.stop();
    stopTimer();
    if (engine.mediaRecorder && engine.mediaRecorder.state !== 'inactive') {
      engine.mediaRecorder.stop();
    }
  };

  const setMasterVolume = (vol: number) => {
    setMasterVolumeState(vol);
    engine.setMasterVolume(vol);
  };

  const setInputGainLevel = (v: number) => {
    setInputGainLevelState(v);
    engine.setInputGain(v);
  };

  return (
    <StudioContext.Provider value={{
      tracks, addTrack, updateTrack, deleteTrack, applyTrackPreset,
      isPlaying, isRecording, playheadPosition, setPlayheadPosition,
      togglePlay, toggleRecord, stop,
      masterVolume, setMasterVolume,
      inputGainLevel, setInputGainLevel,
      zoom, setZoom,
      inputDevices, selectedInputId, setSelectedInputId,
      mixerOpen, setMixerOpen,
      mixerDocked, setMixerDocked,
      audioSetupDone, setAudioSetupDone,
    }}>
      {children}
    </StudioContext.Provider>
  );
}

export const useStudio = () => {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
};
