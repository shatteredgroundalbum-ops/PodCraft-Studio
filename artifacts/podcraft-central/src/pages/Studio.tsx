import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore } from '../store/MediaStore';
import type { MediaAsset } from '../store/MediaStore';
import { useAuth } from '../store/AuthStore';
import { useOpenDAW } from '../hooks/useOpenDAW';
import { useAIProducer } from '../hooks/useAIProducer';
import {
  MicIcon, SquareIcon, SaveIcon, DownloadIcon, SlidersHorizontalIcon,
  ActivityIcon, UploadIcon, Wand2Icon, SparklesIcon,
  FileTextIcon, MusicIcon, Music2Icon, AudioWaveformIcon,
  XIcon, CheckCircle2Icon, AlertCircleIcon, ZapIcon,
  PlayIcon, PauseIcon, SkipBackIcon, SkipForwardIcon,
  Volume2Icon, BrainIcon, SendIcon, LoaderIcon, CopyIcon,
  RefreshCwIcon, InfoIcon, CheckIcon, Settings2Icon, SearchIcon,
  ListIcon, FolderOpenIcon, ClipboardListIcon, MessageSquareIcon,
} from 'lucide-react';

type StudioMode = 'recording' | 'mastering';
type NavSection = 'Record' | 'Script' | 'AI Producer' | 'Sounds' | 'Music' | 'Effects' | 'Mastering';
type AITab = 'prepare' | 'research' | 'script' | 'coach' | 'mastering';

const EFFECTS_CONFIG = [
  { key: 'noiseGate', label: 'Noise Gate', desc: 'Reduces background noise between speech', detail: 'Threshold: −40 dBFS, Hold: 50 ms' },
  { key: 'compressor', label: 'Compressor', desc: 'Evens out volume differences', detail: 'Ratio: 3:1, Attack: 10 ms, Release: 100 ms' },
  { key: 'eq', label: 'EQ', desc: 'Shapes tone and frequency response', detail: 'High-pass 80 Hz, Presence +2 dB @ 3 kHz' },
  { key: 'deEsser', label: 'De-Esser', desc: 'Tames harsh sibilance (s / sh sounds)', detail: 'Target: 5–8 kHz, Moderate' },
  { key: 'limiter', label: 'Limiter', desc: 'Prevents clipping on loud peaks', detail: 'Ceiling: −1 dBTP, True-peak' },
  { key: 'reverb', label: 'Reverb', desc: 'Adds room ambience', detail: 'Room size: Small, Mix: 10 %' },
];

const MASTERING_STYLES = [
  { name: 'Natural', desc: 'Subtle enhancement, preserves original dynamics.' },
  { name: 'Broadcast', desc: 'Loud and punchy, standard for most podcasts.' },
  { name: 'Warm', desc: 'Enhanced low-end for a rich, intimate sound.' },
  { name: 'Clear', desc: 'Crisp highs, great for interviews and dialogue.' },
  { name: 'Radio', desc: 'Heavy compression, classic radio announcer feel.' },
];

export function Studio() {
  const navigate = useNavigate();
  const { mediaAssets, episodes, addAsset } = useMediaStore();
  const { user } = useAuth();
  const daw = useOpenDAW();
  const ai = useAIProducer();

  // Core state
  const [mode, setMode] = useState<StudioMode>('recording');
  const [activeSection, setActiveSection] = useState<NavSection>('Record');
  const [aiTab, setAiTab] = useState<AITab>('prepare');

  // Device / setup
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');
  const [permissionError, setPermissionError] = useState('');

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [inputLevel, setInputLevel] = useState<number[]>(Array(20).fill(0));
  const [inputVolume, setInputVolume] = useState(80);
  const [rawMeterPeak, setRawMeterPeak] = useState(0);
  const [rawMeterRms, setRawMeterRms] = useState(0);

  // Script
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptText, setScriptText] = useState('');

  // Effects / Tools
  const [tools, setTools] = useState({ noiseGate: false, compressor: false, eq: false, deEsser: false, limiter: false, reverb: false });

  // Mastering
  const [masteringStyle, setMasteringStyle] = useState<string | null>(null);
  const [isMastering, setIsMastering] = useState(false);
  const [masteringProgress, setMasteringProgress] = useState(0);

  // AI Producer UI state
  const [aiInput, setAiInput] = useState('');
  const [aiResearchTopic, setAiResearchTopic] = useState('');
  const [aiResearchNotes, setAiResearchNotes] = useState('');
  const [aiResearch, setAiResearch] = useState<{outline: string[]; researchQuestions: string[]; keyPoints: string[]; suggestedAngle: string} | null>(null);
  const [aiScriptTopic, setAiScriptTopic] = useState('');
  const [aiScriptStyle, setAiScriptStyle] = useState('conversational');
  const [aiScriptOutline, setAiScriptOutline] = useState('');
  const [aiScriptResult, setAiScriptResult] = useState('');
  const [aiRecordingTip, setAiRecordingTip] = useState('');
  const [aiMasteringNotes, setAiMasteringNotes] = useState('');
  const [aiMasteringResult, setAiMasteringResult] = useState('');
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [clipCount, setClipCount] = useState(0);
  const [masteringAIRec, setMasteringAIRec] = useState<ReturnType<typeof ai.getMasteringRecommendation> | null>(null);

  // Sounds search
  const [soundsSearch, setSoundsSearch] = useState('');
  const [musicSearch, setMusicSearch] = useState('');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<number>(0);
  const silenceTimerRef = useRef<number>(0);
  const aiMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const engineReady = daw.status === 'ready';

  const displayMeterBars = engineReady ? daw.meterBars : inputLevel;
  const meterPeak = engineReady ? daw.meterPeak : rawMeterPeak;
  const meterRms = engineReady ? daw.meterRms : rawMeterRms;
  const micReadiness = ai.analyzeMicLevel(meterPeak, meterRms);

  const displayDevices = engineReady && daw.devices.length > 0
    ? daw.devices.map((d) => ({ deviceId: d.deviceId, label: d.label, kind: 'audioinput' as MediaDeviceKind, groupId: '', toJSON: () => ({}) } as MediaDeviceInfo))
    : devices;

  const soundAssets = mediaAssets.filter((a: MediaAsset) => {
    const cat = (a.category ?? '').toLowerCase();
    const tags = (a.tags ?? []).map((t: string) => t.toLowerCase());
    return cat === 'sfx' || cat === 'sounds' || tags.includes('sfx') || tags.includes('sound');
  }).filter((a: MediaAsset) => !soundsSearch || a.name.toLowerCase().includes(soundsSearch.toLowerCase()));

  const musicAssets = mediaAssets.filter((a: MediaAsset) => {
    const cat = (a.category ?? '').toLowerCase();
    const tags = (a.tags ?? []).map((t: string) => t.toLowerCase());
    return cat === 'music' || tags.includes('music') || tags.includes('intro') || tags.includes('outro');
  }).filter((a: MediaAsset) => !musicSearch || a.name.toLowerCase().includes(musicSearch.toLowerCase()));

  // Effects
  useEffect(() => {
    if (!engineReady) {
      navigator.mediaDevices?.enumerateDevices().then((devs) => {
        setDevices(devs.filter((d) => d.kind === 'audioinput'));
      }).catch(() => {});
    }
    return () => {
      stopStream();
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerRef.current);
      clearInterval(silenceTimerRef.current);
      if (engineReady) {
        daw.stopMeterMonitoring();
        daw.stopEngineRecording();
      }
    };
  }, [engineReady]);

  // Track silence for live feedback
  useEffect(() => {
    if (isRecording && meterPeak < 0.05) {
      setSilenceTimer((prev) => prev + 1);
    } else {
      setSilenceTimer(0);
    }
    if (meterPeak > 0.95) {
      setClipCount((prev) => prev + 1);
    }
  }, [isRecording, meterPeak]);

  // Scroll AI messages
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ai.messages, ai.streamingText]);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (gainNodeRef.current) { try { gainNodeRef.current.disconnect(); } catch { /* ignore */ } gainNodeRef.current = null; }
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    setInputLevel(Array(20).fill(0));
    setRawMeterPeak(0);
    setRawMeterRms(0);
    if (engineReady) daw.stopMeterMonitoring();
  };

  const animateMeter = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const bars = Array(20).fill(0).map((_, i) => {
        const idx = Math.floor((i / 20) * data.length);
        return data[idx] / 255;
      });
      setInputLevel(bars);
      const peak = Math.max(...bars);
      const rms = Math.sqrt(bars.reduce((s, v) => s + v * v, 0) / bars.length);
      setRawMeterPeak(peak);
      setRawMeterRms(rms);
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const requestMic = async (deviceId?: string): Promise<MediaStream | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      });
      setPermissionError('');
      return stream;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') setPermissionError('Microphone access denied. Please allow microphone access in your browser settings.');
        else if (err.name === 'NotFoundError') setPermissionError('No microphone found. Please connect a microphone and try again.');
        else setPermissionError('Could not access microphone: ' + err.message);
      }
      return null;
    }
  };

  const handleOpenSetup = async () => {
    if (engineReady) {
      await daw.requestMicPermission().catch(() => {});
      setIsSetupOpen(true);
    } else {
      const stream = await requestMic();
      if (!stream) { setIsSetupOpen(true); return; }
      stream.getTracks().forEach((t) => t.stop());
      const devs = await navigator.mediaDevices.enumerateDevices();
      setDevices(devs.filter((d) => d.kind === 'audioinput'));
      setIsSetupOpen(true);
    }
  };

  const handleSetupConfirm = () => {
    if (!selectedDeviceId && displayDevices.length > 0) {
      const first = displayDevices[0];
      setSelectedDeviceId(first.deviceId);
      setDeviceLabel(first.label || 'Default Microphone');
    }
    setIsSetupOpen(false);
  };

  const handleInputVolume = (val: number) => {
    setInputVolume(val);
    if (engineReady) {
      daw.setInputGain(val / 100);
    } else if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = val / 100;
    }
  };

  const handleRecord = async () => {
    if (!deviceLabel && displayDevices.length === 0) { await handleOpenSetup(); return; }
    if (!deviceLabel) { setIsSetupOpen(true); return; }

    const stream = await requestMic(selectedDeviceId || undefined);
    if (!stream) return;
    streamRef.current = stream;

    let recordingStream = stream;

    if (engineReady) {
      daw.startMeterMonitoring(selectedDeviceId || undefined);
      daw.startEngineRecording();
    } else {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = inputVolume / 100;
      gainNodeRef.current = gainNode;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(gainNode);
      gainNode.connect(analyser);
      analyserRef.current = analyser;
      animateMeter(analyser);

      // Route through gain for recording
      const dest = audioCtx.createMediaStreamDestination();
      gainNode.connect(dest);
      recordingStream = dest.stream;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
    const mr = new MediaRecorder(recordingStream, { mimeType });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      const url = URL.createObjectURL(blob);
      setRecordingUrl(url);
      const name = `Recording_${new Date().toISOString().slice(0, 10)}_${Date.now()}.webm`;
      addAsset({ name, category: 'studio', source: 'recording', size: blob.size, type: mr.mimeType, addedBy: user?.name || 'Studio Creator', tags: ['raw'], description: `Raw recording (${formatTime(recordingTime)})` });
      setHasRecordedAudio(true);
      setMode('mastering');
      setActiveSection('Mastering');
      stopStream();
    };
    mr.start(250);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setRecordingTime(0);
    setClipCount(0);
    setSilenceTimer(0);
    timerRef.current = window.setInterval(() => setRecordingTime((p) => p + 1), 1000);
  };

  const handleStop = () => {
    if (!isRecording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
    if (engineReady) daw.stopEngineRecording();
  };

  const handlePlay = () => {
    if (engineReady) {
      daw.play();
    }
  };

  const handleEngineStop = () => {
    if (engineReady) daw.stop();
  };

  const handleStartMastering = () => {
    if (!masteringStyle) { return; }
    setIsMastering(true);
    setMasteringProgress(0);
    if (masteringStyle) {
      setMasteringAIRec(ai.getMasteringRecommendation(masteringStyle));
    }
    const interval = setInterval(() => {
      setMasteringProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMastering(false);
          const name = `Mastered_${masteringStyle}_${Date.now()}.webm`;
          addAsset({ name, category: 'studio', source: 'master', size: 0, type: 'audio/webm', addedBy: user?.name || 'Studio Creator', tags: ['master', masteringStyle.toLowerCase()], description: `Mastered audio — ${masteringStyle} style` });
          return 100;
        }
        return prev + 4;
      });
    }, 150);
  };

  const toggleTool = (tool: keyof typeof tools) => setTools((p) => ({ ...p, [tool]: !p[tool] }));

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `00:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text).catch(() => {});

  const wordCount = scriptText.trim() ? scriptText.trim().split(/\s+/).length : 0;
  const readingMinutes = Math.round(wordCount / 130);

  const navItems: { id: NavSection; icon: React.ElementType }[] = [
    { id: 'Record', icon: MicIcon },
    { id: 'Script', icon: FileTextIcon },
    { id: 'AI Producer', icon: SparklesIcon },
    { id: 'Sounds', icon: MusicIcon },
    { id: 'Music', icon: Music2Icon },
    { id: 'Effects', icon: Settings2Icon },
    { id: 'Mastering', icon: SlidersHorizontalIcon },
  ];

  // ─── Transport Panel ───────────────────────────────────────────────────────
  const renderTransport = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Position display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 font-medium">Position</span>
            <span className="font-mono text-lg font-bold text-gray-900 tabular-nums">
              {formatTime(engineReady ? Math.floor(daw.positionSeconds) : 0)}
            </span>
          </div>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-full border border-red-200">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-mono text-sm font-bold text-red-600">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
        {engineReady && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>{daw.bpm} BPM</span>
            {daw.cpuLoad > 0 && <span>CPU {Math.round(daw.cpuLoad * 100)}%</span>}
          </div>
        )}
      </div>

      {/* Main 3-column transport row */}
      <div className="grid grid-cols-3 items-center gap-4">
        {/* Left: Meter + Input Volume */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MicIcon className={`w-4 h-4 flex-shrink-0 ${deviceLabel ? 'text-violet-600' : 'text-gray-300'}`} />
            <div className="flex gap-0.5 flex-1 h-5 items-end">
              {displayMeterBars.map((v, i) => (
                <div key={i} className="flex-1 rounded-sm transition-all duration-75"
                  style={{ backgroundColor: v > 0.01 ? (v > 0.8 ? '#ef4444' : v > 0.6 ? '#facc15' : '#22c55e') : '#f3f4f6', height: `${Math.max(2, v * 20)}px` }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Volume2Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="range" min={0} max={100} value={inputVolume}
              onChange={(e) => handleInputVolume(Number(e.target.value))}
              className="flex-1 h-1.5 accent-violet-600 cursor-pointer"
              title={`Input Volume: ${inputVolume}%`}
            />
            <span className="text-xs text-gray-400 w-7 text-right tabular-nums">{inputVolume}%</span>
          </div>
        </div>

        {/* Center: 7 Transport Buttons */}
        <div className="flex justify-center items-center gap-1.5">
          {/* Skip to Start */}
          <button
            onClick={() => engineReady && daw.seekToStart()}
            title="Skip to start"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${engineReady ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-200 cursor-default'}`}>
            <SkipBackIcon className="w-4 h-4" />
            <span className="text-[9px] font-medium uppercase tracking-wide">Start</span>
          </button>
          {/* Rewind 10s */}
          <button
            onClick={() => engineReady && daw.seekBackward()}
            title="Rewind 10 seconds"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${engineReady ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-200 cursor-default'}`}>
            <div className="flex items-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.53" /><text x="8" y="16" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">10</text>
              </svg>
            </div>
            <span className="text-[9px] font-medium uppercase tracking-wide">−10s</span>
          </button>
          {/* Play / Pause */}
          <button
            onClick={handlePlay}
            title={daw.isPlaying ? 'Pause' : 'Play'}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${engineReady ? 'text-gray-700 hover:bg-violet-50 hover:text-violet-700' : 'text-gray-200 cursor-default'}`}>
            {daw.isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
            <span className="text-[9px] font-medium uppercase tracking-wide">{daw.isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          {/* Stop */}
          <button
            onClick={handleEngineStop}
            title="Stop and return to start"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${engineReady ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-200 cursor-default'}`}>
            <SquareIcon className="w-5 h-5" />
            <span className="text-[9px] font-medium uppercase tracking-wide">Stop</span>
          </button>
          {/* Record */}
          {isRecording ? (
            <button onClick={handleStop} title="Stop recording"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50">
              <div className="w-5 h-5 rounded-full border-2 border-red-500 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-wide text-red-500">Stop</span>
            </button>
          ) : (
            <button onClick={handleRecord} title="Start recording"
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
              <div className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-red-500">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <span className="text-[9px] font-medium uppercase tracking-wide">Rec</span>
            </button>
          )}
          {/* Forward 10s */}
          <button
            onClick={() => engineReady && daw.seekForward()}
            title="Forward 10 seconds"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${engineReady ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-200 cursor-default'}`}>
            <div className="flex items-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-.49-3.53" /><text x="8" y="16" fontSize="8" fill="currentColor" stroke="none" fontWeight="bold">10</text>
              </svg>
            </div>
            <span className="text-[9px] font-medium uppercase tracking-wide">+10s</span>
          </button>
          {/* Skip Forward 30s */}
          <button
            onClick={() => engineReady && daw.seekForwardLarge()}
            title="Fast forward 30 seconds"
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${engineReady ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' : 'text-gray-200 cursor-default'}`}>
            <SkipForwardIcon className="w-4 h-4" />
            <span className="text-[9px] font-medium uppercase tracking-wide">+30s</span>
          </button>
        </div>

        {/* Right: Save / Download */}
        <div className="flex gap-2 justify-end items-center">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
            <SaveIcon className="w-3.5 h-3.5" /> Save
          </button>
          {recordingUrl && (
            <a href={recordingUrl} download="recording.webm"
              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors">
              <DownloadIcon className="w-3.5 h-3.5" /> Download
            </a>
          )}
        </div>
      </div>

      {/* Quick Tools */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-400 mb-2">Quick Effects</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(tools).map(([tool, active]) => (
            <button key={tool} onClick={() => toggleTool(tool as keyof typeof tools)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${active ? 'bg-violet-100 text-violet-700 border border-violet-300' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}>
              {tool === 'noiseGate' ? 'Noise Gate' : tool === 'deEsser' ? 'De-Esser' : tool === 'eq' ? 'EQ' : tool.charAt(0).toUpperCase() + tool.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!engineReady && (
        <p className="mt-3 text-xs text-gray-400 text-center">
          Playback controls require the OpenDAW engine — recording works in all modes.
        </p>
      )}
    </div>
  );

  // ─── Record Section ────────────────────────────────────────────────────────
  const renderRecord = () => (
    <>
      {/* Live recording feedback */}
      {isRecording && (meterPeak > 0.9 || silenceTimer > 8) && (
        <div className={`rounded-lg p-3 flex items-center gap-3 border text-sm ${meterPeak > 0.9 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
          {meterPeak > 0.9 ? 'Clipping detected — lower your microphone gain' : `${silenceTimer}s of silence detected — are you still recording?`}
        </div>
      )}

      {/* Script Panel */}
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: 180 }}>
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Script</h3>
          <div className="flex gap-2">
            <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 cursor-pointer transition-colors">
              <UploadIcon className="w-3 h-3" /> Import
              <input type="file" accept=".txt,.md,.docx" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => { setScriptText(ev.target?.result as string ?? ''); setScriptTitle(file.name.replace(/\.[^.]+$/, '')); };
                reader.readAsText(file);
              }} />
            </label>
            <button onClick={() => { setActiveSection('AI Producer'); setAiTab('script'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-violet-200 text-violet-700 bg-violet-50 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
              <Wand2Icon className="w-3 h-3" /> AI Write
            </button>
          </div>
        </div>
        <textarea
          className="flex-1 w-full p-5 resize-none focus:outline-none text-gray-700 leading-relaxed text-sm"
          style={{ minHeight: 130 }}
          placeholder="Start typing your script here, or use AI Write to generate one..."
          value={scriptText}
          onChange={(e) => setScriptText(e.target.value)}
        />
      </div>

      {/* Transport */}
      {renderTransport()}
    </>
  );

  // ─── Script Section ────────────────────────────────────────────────────────
  const renderScript = () => (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileTextIcon className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold text-gray-900">Script Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          {scriptText && (
            <button onClick={() => copyToClipboard(scriptText)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
              <CopyIcon className="w-3 h-3" /> Copy
            </button>
          )}
          {scriptText && (
            <a href={`data:text/plain;charset=utf-8,${encodeURIComponent(scriptText)}`}
              download={`${scriptTitle || 'script'}.txt`}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50">
              <DownloadIcon className="w-3 h-3" /> Export
            </a>
          )}
          <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 cursor-pointer">
            <UploadIcon className="w-3 h-3" /> Import
            <input type="file" accept=".txt,.md" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => { setScriptText(ev.target?.result as string ?? ''); setScriptTitle(file.name.replace(/\.[^.]+$/, '')); };
              reader.readAsText(file);
            }} />
          </label>
          <button onClick={() => { setActiveSection('AI Producer'); setAiTab('script'); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700">
            <SparklesIcon className="w-3 h-3" /> AI Write
          </button>
        </div>
      </div>
      <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-4">
        <input
          className="flex-1 text-lg font-bold text-gray-900 focus:outline-none placeholder:text-gray-300"
          placeholder="Episode title..."
          value={scriptTitle}
          onChange={(e) => setScriptTitle(e.target.value)}
        />
        <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
          <span>{wordCount} words</span>
          <span>~{readingMinutes || '<1'} min read</span>
          {scriptText && <button onClick={() => { if (confirm('Clear script?')) { setScriptText(''); setScriptTitle(''); }}} className="text-red-400 hover:text-red-600">Clear</button>}
        </div>
      </div>
      <textarea
        className="flex-1 w-full p-6 resize-none focus:outline-none text-gray-700 leading-relaxed"
        style={{ minHeight: 300 }}
        placeholder={`Write your episode script here.\n\nTips:\n• Start with a strong hook in the first 30 seconds\n• Break into clear segments with transitions\n• Write how you speak, not how you write\n• Use ellipses... for natural pauses\n\nOr click "AI Write" to generate a script from your topic.`}
        value={scriptText}
        onChange={(e) => setScriptText(e.target.value)}
      />
    </div>
  );

  // ─── AI Producer Section ───────────────────────────────────────────────────
  const renderAIProducer = () => {
    const aiTabs: { id: AITab; label: string; icon: React.ElementType }[] = [
      { id: 'prepare', label: 'Prepare', icon: CheckIcon },
      { id: 'research', label: 'Research', icon: SearchIcon },
      { id: 'script', label: 'Script', icon: FileTextIcon },
      { id: 'coach', label: 'Coach', icon: MessageSquareIcon },
      { id: 'mastering', label: 'Mastering', icon: SlidersHorizontalIcon },
    ];

    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-gray-900">AI Producer</h2>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${
            ai.availability === 'available' ? 'bg-green-50 border-green-200 text-green-700'
            : ai.availability === 'requires-download' ? 'bg-blue-50 border-blue-200 text-blue-700'
            : ai.availability === 'checking' ? 'bg-gray-50 border-gray-200 text-gray-500'
            : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              ai.availability === 'available' ? 'bg-green-500'
              : ai.availability === 'requires-download' ? 'bg-blue-500 animate-pulse'
              : ai.availability === 'checking' ? 'bg-gray-400 animate-pulse'
              : 'bg-amber-400'
            }`} />
            {ai.availability === 'available' ? 'Chrome AI ready' : ai.availability === 'requires-download' ? 'Downloading model…' : ai.availability === 'checking' ? 'Checking…' : 'AI unavailable'}
          </div>
        </div>

        {/* AI unavailable notice */}
        {ai.availability === 'unavailable' && (
          <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <InfoIcon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 mb-1">Chrome AI (Gemini Nano) not detected</p>
                <p className="text-xs text-amber-700 mb-2">AI Producer uses Chrome's built-in Gemini Nano model — no API key or internet required.</p>
                <details className="text-xs text-amber-700">
                  <summary className="cursor-pointer font-medium hover:text-amber-900">How to enable →</summary>
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    <li>Open Chrome 127 or later</li>
                    <li>Visit <code className="bg-amber-100 px-1 rounded">chrome://flags</code></li>
                    <li>Enable "Prompt API for Gemini Nano"</li>
                    <li>Enable "Optimization Guide On Device Model"</li>
                    <li>Restart Chrome and reload this page</li>
                  </ol>
                </details>
              </div>
            </div>
          </div>
        )}

        {/* Sub-tabs */}
        <div className="flex border-b border-gray-100 px-6 gap-1 pt-2">
          {aiTabs.map((tab) => (
            <button key={tab.id} onClick={() => setAiTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${aiTab === tab.id ? 'border-violet-600 text-violet-700 bg-violet-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* PREPARE TAB */}
          {aiTab === 'prepare' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><MicIcon className="w-4 h-4 text-violet-600" /> Microphone Readiness</h3>
                <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                  micReadiness.status === 'ready' ? 'bg-green-50 border-green-200'
                  : micReadiness.status === 'no-signal' ? 'bg-gray-50 border-gray-200'
                  : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    micReadiness.status === 'ready' ? 'bg-green-100'
                    : micReadiness.status === 'clipping' ? 'bg-red-100'
                    : 'bg-amber-100'
                  }`}>
                    {micReadiness.status === 'ready' ? <CheckCircle2Icon className="w-5 h-5 text-green-600" /> : <AlertCircleIcon className={`w-5 h-5 ${micReadiness.status === 'clipping' ? 'text-red-600' : 'text-amber-600'}`} />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${micReadiness.status === 'ready' ? 'text-green-800' : micReadiness.status === 'clipping' ? 'text-red-800' : 'text-amber-800'}`}>{micReadiness.message}</p>
                    {micReadiness.suggestion && <p className="text-xs text-gray-600 mt-0.5">{micReadiness.suggestion}</p>}
                    {micReadiness.status === 'no-signal' && (
                      <button onClick={handleOpenSetup} className="mt-2 text-xs font-medium text-violet-600 hover:text-violet-700">Configure microphone →</button>
                    )}
                  </div>
                  <div className="ml-auto text-xs text-gray-400">{Math.round(meterPeak * 100)}%</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><ClipboardListIcon className="w-4 h-4 text-violet-600" /> Pre-Recording Checklist</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Microphone connected and selected', done: !!deviceLabel },
                    { label: 'Input level in green zone (30–75%)', done: micReadiness.status === 'ready' },
                    { label: 'Episode selected', done: !!selectedEpisodeId },
                    { label: 'Script ready', done: scriptText.length > 50 },
                    { label: 'Quiet recording environment', done: micReadiness.status !== 'noise-high' && !!deviceLabel },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${item.done ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                        {item.done && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={`text-xs ${item.done ? 'text-green-800' : 'text-gray-600'}`}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><BrainIcon className="w-4 h-4 text-violet-600" /> AI Recording Tip</h3>
                  <button disabled={!ai.isAvailable || ai.isLoading}
                    onClick={async () => { const tip = await ai.getRecordingTip(scriptTitle || 'podcast episode'); setAiRecordingTip(tip); }}
                    className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 disabled:opacity-40">
                    <RefreshCwIcon className="w-3 h-3" /> {ai.isLoading ? 'Thinking…' : 'Get tip'}
                  </button>
                </div>
                {aiRecordingTip ? (
                  <div className="p-3 bg-violet-50 rounded-lg border border-violet-100 text-sm text-violet-800">{aiRecordingTip}</div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-400">
                    {ai.isAvailable ? 'Click "Get tip" for an AI recording tip.' : 'Enable Chrome AI to get recording tips.'}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RESEARCH TAB */}
          {aiTab === 'research' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Episode Topic</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. The history of jazz in New Orleans" value={aiResearchTopic}
                  onChange={(e) => setAiResearchTopic(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Your Notes (optional)</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={3} placeholder="Add any existing notes or context..." value={aiResearchNotes}
                  onChange={(e) => setAiResearchNotes(e.target.value)} />
              </div>
              <button disabled={!ai.isAvailable || !aiResearchTopic.trim() || ai.isLoading}
                onClick={async () => { const r = await ai.generateResearch(aiResearchTopic, aiResearchNotes || undefined); if (r) setAiResearch(r); }}
                className="w-full py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center gap-2">
                {ai.isLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Researching…</> : <><SparklesIcon className="w-4 h-4" /> Generate Research</>}
              </button>
              {!ai.isAvailable && <p className="text-xs text-amber-600 text-center">Enable Chrome AI to use research assistance.</p>}
              {ai.lastError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{ai.lastError}</p>}
              {aiResearch && (
                <div className="space-y-4">
                  <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                    <p className="text-xs font-bold text-violet-700 uppercase mb-2">Suggested Angle</p>
                    <p className="text-sm text-violet-800">{aiResearch.suggestedAngle}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Episode Outline</p>
                    <ol className="space-y-1">
                      {aiResearch.outline.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-700">
                          <span className="text-violet-500 font-bold flex-shrink-0">{i + 1}.</span>{item}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Research Questions</p>
                    <ul className="space-y-1">
                      {aiResearch.researchQuestions.map((q, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-600"><span className="text-gray-400">•</span>{q}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">Key Points for Listeners</p>
                    <ul className="space-y-1">
                      {aiResearch.keyPoints.map((p, i) => (
                        <li key={i} className="flex gap-2 text-sm text-gray-600"><CheckIcon className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />{p}</li>
                      ))}
                    </ul>
                  </div>
                  <button onClick={() => { setAiScriptTopic(aiResearchTopic); setAiScriptOutline(aiResearch.outline.join('\n')); setAiTab('script'); }}
                    className="text-xs text-violet-600 hover:text-violet-700 font-medium">
                    Use this outline to generate a script →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCRIPT TAB */}
          {aiTab === 'script' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Episode Topic</label>
                <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="e.g. How sleep affects creativity" value={aiScriptTopic}
                  onChange={(e) => setAiScriptTopic(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Outline / Key Points (one per line)</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  rows={4} placeholder="Intro hook&#10;Main point 1&#10;Main point 2&#10;Outro CTA" value={aiScriptOutline}
                  onChange={(e) => setAiScriptOutline(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Style</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" value={aiScriptStyle} onChange={(e) => setAiScriptStyle(e.target.value)}>
                  <option value="conversational">Conversational</option>
                  <option value="educational">Educational</option>
                  <option value="storytelling">Storytelling</option>
                  <option value="interview">Interview-style</option>
                  <option value="narrative">Narrative documentary</option>
                </select>
              </div>
              <button disabled={!ai.isAvailable || !aiScriptTopic.trim() || ai.isLoading}
                onClick={async () => {
                  const outline = aiScriptOutline.trim().split('\n').filter(Boolean);
                  const draft = await ai.generateScript(aiScriptTopic, outline, aiScriptStyle);
                  if (draft) {
                    const full = draft.sections.map((s) => `## ${s.title}\n\n${s.content}`).join('\n\n---\n\n');
                    setAiScriptResult(full);
                  }
                }}
                className="w-full py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center gap-2">
                {ai.isLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Writing script…</> : <><SparklesIcon className="w-4 h-4" /> Generate Script</>}
              </button>
              {!ai.isAvailable && <p className="text-xs text-amber-600 text-center">Enable Chrome AI to generate scripts.</p>}
              {ai.lastError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded">{ai.lastError}</p>}
              {aiScriptResult && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-600 uppercase">Generated Script</p>
                    <div className="flex gap-2">
                      <button onClick={() => copyToClipboard(aiScriptResult)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><CopyIcon className="w-3 h-3" /> Copy</button>
                      <button onClick={() => { setScriptText(aiScriptResult); setScriptTitle(aiScriptTopic); setActiveSection('Script'); }}
                        className="text-xs font-medium text-violet-600 hover:text-violet-700">Use in Script Editor →</button>
                    </div>
                  </div>
                  <pre className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">{aiScriptResult}</pre>
                </div>
              )}
            </div>
          )}

          {/* COACH TAB */}
          {aiTab === 'coach' && (
            <div className="space-y-5">
              {/* Live feedback during recording */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-violet-600" /> Live Recording Status
                  {isRecording && <span className="text-xs font-normal text-red-500 animate-pulse ml-1">● Recording</span>}
                </h3>
                {isRecording ? (
                  <div className="space-y-2">
                    {ai.generateLiveFeedback(meterPeak, meterRms, silenceTimer, clipCount).map((fb) => (
                      <div key={fb.id} className={`flex items-start gap-3 p-3 rounded-lg border ${fb.severity === 'error' ? 'bg-red-50 border-red-200' : fb.severity === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                        <AlertCircleIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${fb.severity === 'error' ? 'text-red-600' : fb.severity === 'warning' ? 'text-amber-600' : 'text-blue-600'}`} />
                        <span className={`text-sm ${fb.severity === 'error' ? 'text-red-700' : fb.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'}`}>{fb.message}</span>
                      </div>
                    ))}
                    {ai.generateLiveFeedback(meterPeak, meterRms, silenceTimer, clipCount).length === 0 && (
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2Icon className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700">Recording looks good — keep going!</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Live coaching appears here during recording.</p>
                    <button onClick={handleRecord} className="mt-3 text-xs font-medium text-violet-600 hover:text-violet-700">Start recording →</button>
                  </div>
                )}
              </div>

              {/* AI Chat */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><BrainIcon className="w-4 h-4 text-violet-600" /> Ask AI Producer</h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="p-4 max-h-64 overflow-y-auto space-y-3 min-h-[80px]">
                    {ai.messages.length === 0 && !ai.streamingText && (
                      <p className="text-xs text-gray-400 text-center py-4">
                        {ai.isAvailable ? 'Ask anything about recording, pacing, mic technique, or production…' : 'Enable Chrome AI to chat with AI Producer.'}
                      </p>
                    )}
                    {ai.messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {ai.streamingText && (
                      <div className="flex justify-start">
                        <div className="max-w-[85%] px-3 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm leading-relaxed">
                          {ai.streamingText}<span className="animate-pulse">▌</span>
                        </div>
                      </div>
                    )}
                    {ai.isLoading && !ai.streamingText && (
                      <div className="flex justify-start">
                        <div className="px-3 py-2 rounded-lg bg-gray-100">
                          <LoaderIcon className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      </div>
                    )}
                    <div ref={aiMessagesEndRef} />
                  </div>
                  <div className="border-t border-gray-100 p-3 flex gap-2">
                    <input
                      className="flex-1 text-sm focus:outline-none px-2"
                      placeholder={ai.isAvailable ? 'Ask AI Producer…' : 'AI unavailable'}
                      value={aiInput}
                      disabled={!ai.isAvailable || ai.isLoading}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && aiInput.trim()) { ai.sendMessage(aiInput); setAiInput(''); } }}
                    />
                    <button disabled={!ai.isAvailable || !aiInput.trim() || ai.isLoading}
                      onClick={() => { ai.sendMessage(aiInput); setAiInput(''); }}
                      className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40">
                      <SendIcon className="w-3.5 h-3.5" />
                    </button>
                    {ai.messages.length > 0 && <button onClick={ai.clearMessages} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50" title="Clear chat"><XIcon className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MASTERING TAB */}
          {aiTab === 'mastering' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">AI Mastering Recommendations</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {MASTERING_STYLES.map((style) => (
                    <button key={style.name} onClick={() => { setMasteringStyle(style.name); setMasteringAIRec(ai.getMasteringRecommendation(style.name)); setAiMasteringResult(''); }}
                      className={`p-3 rounded-lg border text-left transition-all ${masteringStyle === style.name ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-gray-200 hover:border-violet-300'}`}>
                      <p className={`text-sm font-bold ${masteringStyle === style.name ? 'text-violet-900' : 'text-gray-900'}`}>{style.name}</p>
                      <p className={`text-xs mt-0.5 ${masteringStyle === style.name ? 'text-violet-700' : 'text-gray-500'}`}>{style.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {masteringAIRec && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-700 uppercase mb-3">{masteringStyle} — Recommended Settings</p>
                  {[
                    { label: 'EQ', value: masteringAIRec.eq },
                    { label: 'Compression', value: masteringAIRec.compression },
                    { label: 'De-Essing', value: masteringAIRec.deEssing },
                    { label: 'Limiting', value: masteringAIRec.limiting },
                    { label: 'Noise Reduction', value: masteringAIRec.noiseReduction },
                    { label: 'Target Loudness', value: `${masteringAIRec.targetLUFS} LUFS` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex gap-3 text-xs">
                      <span className="w-28 font-medium text-gray-500 flex-shrink-0">{label}</span>
                      <span className="text-gray-700">{value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-violet-700 bg-violet-50 p-2 rounded mt-2">{masteringAIRec.summary}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Your recording notes (for personalised advice)</label>
                <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none resize-none"
                  rows={3} placeholder="e.g. recorded in a bathroom, noisy HVAC, dynamic mic..."
                  value={aiMasteringNotes} onChange={(e) => setAiMasteringNotes(e.target.value)} />
              </div>
              <button disabled={!ai.isAvailable || !masteringStyle || ai.isLoading}
                onClick={async () => { const r = await ai.getPersonalisedMastering(masteringStyle!, aiMasteringNotes); setAiMasteringResult(r); }}
                className="w-full py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-40 flex items-center justify-center gap-2">
                {ai.isLoading ? <><LoaderIcon className="w-4 h-4 animate-spin" /> Analysing…</> : <><SparklesIcon className="w-4 h-4" /> Get Personalised Advice</>}
              </button>
              {!ai.isAvailable && <p className="text-xs text-amber-600 text-center">Enable Chrome AI for personalised mastering advice.</p>}
              {aiMasteringResult && (
                <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-violet-700 uppercase">AI Recommendation</p>
                    <button onClick={() => copyToClipboard(aiMasteringResult)} className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"><CopyIcon className="w-3 h-3" /> Copy</button>
                  </div>
                  <p className="text-sm text-violet-800 whitespace-pre-wrap leading-relaxed">{aiMasteringResult}</p>
                  <p className="text-xs text-violet-500 mt-3 italic">All changes require your review and approval before applying.</p>
                </div>
              )}
              <button onClick={() => setActiveSection('Mastering')} className="text-xs text-violet-600 hover:text-violet-700 font-medium">Go to Mastering section to apply →</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Sounds & Music Sections ───────────────────────────────────────────────
  const renderMediaSection = (
    title: string, icon: React.ElementType, items: MediaAsset[],
    search: string, onSearch: (v: string) => void,
    emptyMsg: string, emptyHint: string, category: string
  ) => {
    const Icon = icon;
    return (
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <SearchIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-violet-500" placeholder="Search…" value={search} onChange={(e) => onSearch(e.target.value)} />
            </div>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 cursor-pointer">
              <UploadIcon className="w-3 h-3" /> Import
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                addAsset({ name: file.name, category, source: 'upload', size: file.size, type: file.type, addedBy: user?.name || 'Studio', tags: [category], description: '' });
              }} />
            </label>
          </div>
        </div>
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Icon className="w-7 h-7 text-gray-300" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">{emptyMsg}</h3>
            <p className="text-sm text-gray-500 max-w-xs">{emptyHint}</p>
            <label className="mt-5 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 cursor-pointer">
              Import {title}
              <input type="file" accept="audio/*" multiple className="hidden" onChange={(e) => {
                Array.from(e.target.files ?? []).forEach((file) => {
                  addAsset({ name: file.name, category, source: 'upload', size: file.size, type: file.type, addedBy: user?.name || 'Studio', tags: [category], description: '' });
                });
              }} />
            </label>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 gap-2 overflow-y-auto">
            {items.map((a: MediaAsset) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 group">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                  <p className="text-xs text-gray-400">{a.type} · {a.size > 0 ? `${(a.size / 1024 / 1024).toFixed(1)} MB` : 'Imported'}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-gray-400 hover:text-violet-600 rounded" title="Add to session"><FolderOpenIcon className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Effects Section ───────────────────────────────────────────────────────
  const renderEffects = () => (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <Settings2Icon className="w-5 h-5 text-violet-600" />
        <h2 className="text-lg font-bold text-gray-900">Audio Effects</h2>
      </div>
      <div className="p-5 grid grid-cols-2 gap-3">
        {EFFECTS_CONFIG.map(({ key, label, desc, detail }) => {
          const active = tools[key as keyof typeof tools];
          return (
            <div key={key} onClick={() => toggleTool(key as keyof typeof tools)}
              className={`p-4 rounded-xl border cursor-pointer transition-all select-none ${active ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-gray-200 hover:border-violet-300 bg-white'}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-bold text-sm ${active ? 'text-violet-900' : 'text-gray-900'}`}>{label}</h4>
                <div className={`w-8 h-4 rounded-full transition-colors flex items-center px-0.5 ${active ? 'bg-violet-600' : 'bg-gray-200'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${active ? 'translate-x-4' : ''}`} />
                </div>
              </div>
              <p className={`text-xs mb-1 ${active ? 'text-violet-700' : 'text-gray-500'}`}>{desc}</p>
              <p className={`text-xs font-mono ${active ? 'text-violet-500' : 'text-gray-400'}`}>{detail}</p>
            </div>
          );
        })}
      </div>
      <div className="px-5 pb-5">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700"><strong>Note:</strong> Effects settings apply to recording and mastering chains. They are processed in the order shown — gate → compress → eq → de-ess → limit → reverb.</p>
        </div>
      </div>
    </div>
  );

  // ─── Mastering Section ─────────────────────────────────────────────────────
  const renderMastering = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-8 flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <SlidersHorizontalIcon className="w-6 h-6 text-violet-600" />
        <h2 className="text-2xl font-bold text-gray-900">Mastering</h2>
        <button onClick={() => { setActiveSection('AI Producer'); setAiTab('mastering'); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-violet-200 text-violet-700 bg-violet-50 rounded-lg text-xs font-medium hover:bg-violet-100">
          <SparklesIcon className="w-3.5 h-3.5" /> AI Recommendations
        </button>
      </div>
      {!hasRecordedAudio ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <AudioWaveformIcon className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Audio to Master</h3>
          <p className="text-gray-500 text-sm max-w-sm">Record some audio first, then come back here to apply mastering.</p>
          <button onClick={() => setActiveSection('Record')} className="mt-6 px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700">Go to Record</button>
        </div>
      ) : (
        <div className="max-w-2xl">
          {recordingUrl && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Your Recording</p>
              <audio controls src={recordingUrl} className="w-full" />
            </div>
          )}
          {masteringAIRec && (
            <div className="mb-6 p-4 bg-violet-50 rounded-xl border border-violet-200">
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-violet-600" />
                <p className="text-sm font-bold text-violet-800">AI Recommendation — {masteringStyle}</p>
              </div>
              <p className="text-sm text-violet-700">{masteringAIRec.summary}</p>
              <p className="text-xs text-violet-500 mt-1">Target: {masteringAIRec.targetLUFS} LUFS</p>
            </div>
          )}
          <p className="text-gray-600 mb-6">Select a mastering style to enhance your recording for podcast distribution.</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {MASTERING_STYLES.map((style) => (
              <button key={style.name} onClick={() => { setMasteringStyle(style.name); setMasteringAIRec(ai.getMasteringRecommendation(style.name)); }}
                className={`p-4 rounded-xl border text-left transition-all ${masteringStyle === style.name ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-gray-200 hover:border-violet-300 bg-white'}`}>
                <h4 className={`font-bold mb-1 ${masteringStyle === style.name ? 'text-violet-900' : 'text-gray-900'}`}>{style.name}</h4>
                <p className={`text-xs ${masteringStyle === style.name ? 'text-violet-700' : 'text-gray-500'}`}>{style.desc}</p>
              </button>
            ))}
          </div>
          {!masteringStyle && <p className="text-sm text-gray-400 text-center mb-4">Select a mastering style above to continue.</p>}
          {isMastering ? (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
              <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                <span>Applying {masteringStyle} Mastering…</span>
                <span>{masteringProgress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-violet-600 transition-all duration-150" style={{ width: `${masteringProgress}%` }} />
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center animate-pulse">Analysing loudness and applying dynamics processing…</p>
            </div>
          ) : masteringProgress === 100 ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
              <CheckCircle2Icon className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Mastering complete! File saved to Media Library.</p>
              {recordingUrl && (
                <a href={recordingUrl} download={`mastered_${masteringStyle}.webm`}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                  <DownloadIcon className="w-3 h-3" /> Download
                </a>
              )}
            </div>
          ) : (
            <button onClick={handleStartMastering} disabled={!masteringStyle}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg disabled:opacity-40 transition-colors shadow-sm flex items-center justify-center gap-2">
              <SparklesIcon className="w-5 h-5" /> Start Mastering
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ─── Main render ───────────────────────────────────────────────────────────
  return (
    <AppLayout title={<div><h1 className="text-xl font-bold text-gray-900">Studio</h1><p className="text-sm font-normal text-gray-500 mt-0.5">Record, mix, and master your podcast.</p></div>}>
      <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>

        {/* Status Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 gap-4">
          <div className="flex items-center gap-5 h-full overflow-x-auto">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border flex-shrink-0 ${isRecording ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-xs font-bold tracking-wider">ON AIR</span>
            </div>
            <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col cursor-pointer group flex-shrink-0" onClick={handleOpenSetup}>
              <span className="text-xs text-gray-400">Device</span>
              <span className={`text-sm font-semibold ${deviceLabel ? 'text-gray-900' : 'text-gray-400'}`}>{deviceLabel || 'Not Connected'}</span>
            </div>
            <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col flex-shrink-0">
              <span className="text-xs text-gray-400">Timer</span>
              <span className="text-sm font-mono font-bold text-gray-900">{formatTime(recordingTime)}</span>
            </div>
            <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col flex-shrink-0">
              <span className="text-xs text-gray-400">Episode</span>
              <select className="appearance-none bg-transparent text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer"
                value={selectedEpisodeId || ''} onChange={(e) => setSelectedEpisodeId(e.target.value)}>
                <option value="">None</option>
                {episodes.map((ep) => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
              </select>
            </div>
            {engineReady && (
              <>
                <div className="h-6 w-px bg-gray-200 flex-shrink-0" />
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <ZapIcon className="w-3.5 h-3.5 text-violet-500" />
                  <span className="text-xs font-medium text-violet-600">{daw.bpm} BPM</span>
                  {daw.cpuLoad > 0 && <span className="text-xs text-gray-400 ml-1">CPU {Math.round(daw.cpuLoad * 100)}%</span>}
                </div>
              </>
            )}
          </div>
          <button onClick={() => navigate('/projects')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex-shrink-0">
            Exit Studio
          </button>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Nav */}
          <div className="w-44 bg-white border-r border-gray-200 flex flex-col py-3 flex-shrink-0">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${activeSection === item.id ? 'bg-violet-50 text-violet-700 border-r-2 border-violet-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-2 border-transparent'}`}>
                <item.icon className={`w-4 h-4 ${activeSection === item.id ? 'text-violet-600' : 'text-gray-400'}`} />
                {item.id}
              </button>
            ))}
            <div className="mt-auto px-4 pb-3">
              {daw.status === 'initializing' && <div className="flex items-center gap-1.5 text-xs text-gray-400"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />Engine loading…</div>}
              {daw.status === 'ready' && <div className="flex items-center gap-1.5 text-xs text-violet-600"><div className="w-1.5 h-1.5 rounded-full bg-violet-500" />openDAW ready</div>}
              {daw.status === 'unsupported' && <div className="flex items-center gap-1.5 text-xs text-amber-600"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" />Basic mode</div>}
              {daw.status === 'error' && <div className="flex items-center gap-1.5 text-xs text-red-500"><div className="w-1.5 h-1.5 rounded-full bg-red-400" />Engine error</div>}
            </div>
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col overflow-y-auto p-5 gap-4">
            {/* Global alerts */}
            {permissionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
                <AlertCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-700">Microphone Access Issue</p>
                  <p className="text-sm text-red-600 mt-0.5">{permissionError}</p>
                </div>
                <button onClick={() => setPermissionError('')} className="text-red-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
              </div>
            )}
            {(daw.status === 'unsupported' || daw.status === 'error') && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
                <ZapIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">{daw.status === 'unsupported' ? 'Running in basic recording mode' : 'Audio engine failed to start'}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{daw.status === 'unsupported' ? 'Open the app in a standalone browser tab for full OpenDAW features.' : daw.error}</p>
                </div>
                <button onClick={() => window.open(window.location.href, '_blank')} className="flex-shrink-0 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700">Open standalone</button>
              </div>
            )}

            {activeSection === 'Record' && renderRecord()}
            {activeSection === 'Script' && renderScript()}
            {activeSection === 'AI Producer' && renderAIProducer()}
            {activeSection === 'Sounds' && renderMediaSection('Sound Effects', MusicIcon, soundAssets, soundsSearch, setSoundsSearch, 'No Sound Effects', 'Import audio files to use as sound effects, stingers, or transitions in your episodes.', 'sfx')}
            {activeSection === 'Music' && renderMediaSection('Music Library', Music2Icon, musicAssets, musicSearch, setMusicSearch, 'No Music Tracks', 'Import music tracks for intros, outros, and background music. Use royalty-free or original music only.', 'music')}
            {activeSection === 'Effects' && renderEffects()}
            {activeSection === 'Mastering' && renderMastering()}
          </div>
        </div>
      </div>

      {/* Setup Dialog */}
      {isSetupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Audio Setup</h3>
              <button onClick={() => setIsSetupOpen(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {permissionError && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{permissionError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audio Input Device</label>
                {displayDevices.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">No microphones detected. Make sure a microphone is connected.</p>
                ) : (
                  <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={selectedDeviceId}
                    onChange={(e) => { const d = displayDevices.find((dev) => dev.deviceId === e.target.value); setSelectedDeviceId(e.target.value); setDeviceLabel(d?.label || 'Microphone'); }}>
                    <option value="">Select a microphone…</option>
                    {displayDevices.map((d) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 8)}`}</option>)}
                  </select>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button className="text-sm font-medium text-violet-600 hover:text-violet-700" onClick={() => requestMic(selectedDeviceId || undefined)}>Test Microphone</button>
                <div className="flex gap-3">
                  <button onClick={() => setIsSetupOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSetupConfirm} disabled={displayDevices.length === 0 && !selectedDeviceId} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">Continue</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
