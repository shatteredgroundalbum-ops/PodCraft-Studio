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
  muted: boolean;
  soloed: boolean;
  armed: boolean;
  clips: AudioClip[];
}

interface StudioContextType {
  tracks: Track[];
  addTrack: (type: TrackType) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  isPlaying: boolean;
  isRecording: boolean;
  playheadPosition: number;
  setPlayheadPosition: (pos: number) => void;
  togglePlay: () => void;
  toggleRecord: () => void;
  stop: () => void;
  masterVolume: number;
  setMasterVolume: (vol: number) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  inputDevices: MediaDeviceInfo[];
  selectedInputId: string;
  setSelectedInputId: (id: string) => void;
  mixerOpen: boolean;
  setMixerOpen: (open: boolean) => void;
}

const defaultColors = ['#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#ef4444'];
const trackPalette = [
  '#8b5cf6', '#ec4899', '#3b82f6', '#22c55e', '#ef4444',
  '#f59e0b', '#14b8a6', '#6366f1', '#d946ef', '#06b6d4',
  '#84cc16', '#f97316', '#10b981', '#64748b', '#a855f7', '#eab308',
];

const StudioContext = createContext<StudioContextType | null>(null);

export function StudioProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', name: 'Host A',     type: 'mic',   color: defaultColors[0], volume: 1,   muted: false, soloed: false, armed: true,  clips: [] },
    { id: '2', name: 'Host B',     type: 'mic',   color: defaultColors[1], volume: 1,   muted: false, soloed: false, armed: false, clips: [] },
    { id: '3', name: 'Interview',  type: 'mic',   color: defaultColors[2], volume: 1,   muted: false, soloed: false, armed: false, clips: [] },
    { id: '4', name: 'Music Bed',  type: 'music', color: defaultColors[3], volume: 0.8, muted: false, soloed: false, armed: false, clips: [] },
    { id: '5', name: 'SFX',        type: 'sfx',   color: defaultColors[4], volume: 1,   muted: false, soloed: false, armed: false, clips: [] },
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [masterVolume, setMasterVolume] = useState(1);
  const [zoom, setZoom] = useState(50);
  const [mixerOpen, setMixerOpen] = useState(true);
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>('');

  const timerRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const recordStartTimeRef = useRef<number>(0);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      setInputDevices(audioInputs);
      if (audioInputs.length > 0) setSelectedInputId(audioInputs[0].deviceId);
    });
  }, []);

  useEffect(() => {
    if (selectedInputId) engine.requestInput(selectedInputId);
  }, [selectedInputId]);

  const addTrack = (type: TrackType) => {
    if (tracks.length >= 32) return;
    setTracks([...tracks, {
      id: Math.random().toString(36).substr(2, 9),
      name: `Track ${tracks.length + 1}`,
      type,
      color: trackPalette[tracks.length % trackPalette.length],
      volume: 1, muted: false, soloed: false, armed: false, clips: [],
    }]);
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    setTracks(tracks.map((t) => {
      if (t.id !== id) return t;
      const updated = { ...t, ...updates };
      if (updates.volume !== undefined) engine.setTrackVolume(id, updates.volume);
      return updated;
    }));
  };

  const deleteTrack = (id: string) => setTracks(tracks.filter((t) => t.id !== id));

  const updatePlayhead = useCallback(() => {
    if (!isPlaying && !isRecording) return;
    const now = performance.now();
    const delta = (now - lastTimeRef.current) / 1000;
    lastTimeRef.current = now;
    setPlayheadPosition((prev) => prev + delta);
    timerRef.current = requestAnimationFrame(updatePlayhead);
  }, [isPlaying, isRecording]);

  const togglePlay = () => {
    engine.init();
    if (isPlaying) {
      setIsPlaying(false);
      engine.stop();
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    } else {
      setIsPlaying(true);
      lastTimeRef.current = performance.now();
      engine.play(tracks, playheadPosition);
      timerRef.current = requestAnimationFrame(updatePlayhead);
    }
  };

  const toggleRecord = async () => {
    engine.init();
    if (isRecording) {
      setIsRecording(false);
      const blob = await engine.stopRecording();
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      const buffer = await engine.decodeAudioData(blob);
      if (buffer) {
        const newClip: AudioClip = {
          id: Math.random().toString(36).substr(2, 9),
          buffer, startTime: recordStartTimeRef.current, duration: buffer.duration,
        };
        setTracks((prev) => prev.map((t) => t.armed ? { ...t, clips: [...t.clips, newClip] } : t));
      }
    } else {
      const armedTracks = tracks.filter((t) => t.armed);
      if (armedTracks.length === 0) { alert('Please arm at least one track to record.'); return; }
      const started = engine.startRecording(() => {});
      if (started) {
        setIsRecording(true);
        recordStartTimeRef.current = playheadPosition;
        lastTimeRef.current = performance.now();
        timerRef.current = requestAnimationFrame(updatePlayhead);
      }
    }
  };

  const stop = () => {
    if (isPlaying) { setIsPlaying(false); engine.stop(); }
    if (isRecording) toggleRecord();
    setPlayheadPosition(0);
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
  };

  const handleSetMasterVolume = (vol: number) => {
    setMasterVolume(vol);
    engine.setMasterVolume(vol);
  };

  return (
    <StudioContext.Provider value={{
      tracks, addTrack, updateTrack, deleteTrack,
      isPlaying, isRecording, playheadPosition, setPlayheadPosition,
      togglePlay, toggleRecord, stop,
      masterVolume, setMasterVolume: handleSetMasterVolume,
      zoom, setZoom,
      inputDevices, selectedInputId, setSelectedInputId,
      mixerOpen, setMixerOpen,
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
