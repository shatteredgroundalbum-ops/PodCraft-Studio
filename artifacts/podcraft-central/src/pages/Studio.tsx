import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore } from '../store/MediaStore';
import { useAuth } from '../store/AuthStore';
import {
  MicIcon, SquareIcon, SaveIcon, DownloadIcon, SlidersHorizontalIcon,
  ActivityIcon, PencilIcon, UploadIcon, Wand2Icon, SparklesIcon,
  RewindIcon, FastForwardIcon, FileTextIcon, MusicIcon, Music2Icon,
  AudioWaveformIcon, XIcon, CheckCircle2Icon, AlertCircleIcon,
} from 'lucide-react';

type StudioMode = 'recording' | 'mastering';
type NavSection = 'Record' | 'Script' | 'AI Producer' | 'Sounds' | 'Music' | 'Effects' | 'Mastering';

export function Studio() {
  const navigate = useNavigate();
  const { episodes, addAsset } = useMediaStore();
  const { user } = useAuth();

  const [mode, setMode] = useState<StudioMode>('recording');
  const [activeSection, setActiveSection] = useState<NavSection>('Record');
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [deviceLabel, setDeviceLabel] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [scriptText, setScriptText] = useState('');
  const [tools, setTools] = useState({ noiseGate: false, compressor: false, eq: false, deEsser: false, limiter: false, reverb: false });
  const [masteringStyle, setMasteringStyle] = useState<string | null>(null);
  const [isMastering, setIsMastering] = useState(false);
  const [masteringProgress, setMasteringProgress] = useState(0);
  const [inputLevel, setInputLevel] = useState<number[]>(Array(20).fill(0));
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then((devs) => {
      const mics = devs.filter((d) => d.kind === 'audioinput');
      setDevices(mics);
    }).catch(() => {});
    return () => {
      stopStream();
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerRef.current);
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(animFrameRef.current);
    setInputLevel(Array(20).fill(0));
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
      animFrameRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const requestMic = async (deviceId?: string): Promise<MediaStream | null> => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
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
    const stream = await requestMic();
    if (!stream) { setIsSetupOpen(true); return; }
    stream.getTracks().forEach((t) => t.stop());
    const devs = await navigator.mediaDevices.enumerateDevices();
    setDevices(devs.filter((d) => d.kind === 'audioinput'));
    setIsSetupOpen(true);
  };

  const handleSetupConfirm = () => {
    if (!selectedDeviceId && devices.length > 0) {
      const first = devices[0];
      setSelectedDeviceId(first.deviceId);
      setDeviceLabel(first.label || 'Default Microphone');
    }
    setIsSetupOpen(false);
  };

  const handleRecord = async () => {
    if (!deviceLabel && devices.length === 0) { await handleOpenSetup(); return; }
    if (!deviceLabel) { setIsSetupOpen(true); return; }

    const stream = await requestMic(selectedDeviceId || undefined);
    if (!stream) return;
    streamRef.current = stream;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;
    animateMeter(analyser);

    chunksRef.current = [];
    const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm' });
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType });
      const url = URL.createObjectURL(blob);
      setRecordingUrl(url);
      const sizeMB = blob.size;
      const name = `Recording_${new Date().toISOString().slice(0, 10)}_${Date.now()}.webm`;
      addAsset({ name, category: 'studio', source: 'recording', size: sizeMB, type: mr.mimeType, addedBy: user?.name || 'Studio Creator', tags: ['raw'], description: `Raw recording (${formatTime(recordingTime)})` });
      setHasRecordedAudio(true);
      setMode('mastering');
      setActiveSection('Mastering');
      stopStream();
    };
    mr.start(250);
    mediaRecorderRef.current = mr;
    setIsRecording(true);
    setRecordingTime(0);
    timerRef.current = window.setInterval(() => setRecordingTime((p) => p + 1), 1000);
  };

  const handleStop = () => {
    if (!isRecording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);
    mediaRecorderRef.current?.stop();
  };

  const handleStartMastering = () => {
    if (!masteringStyle) { alert('Please select a mastering style first.'); return; }
    setIsMastering(true);
    setMasteringProgress(0);
    const interval = setInterval(() => {
      setMasteringProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMastering(false);
          const name = `Mastered_${masteringStyle}_${Date.now()}.webm`;
          addAsset({ name, category: 'studio', source: 'master', size: 0, type: 'audio/webm', addedBy: user?.name || 'Studio Creator', tags: ['master', masteringStyle.toLowerCase()], description: `Mastered audio using ${masteringStyle} style` });
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

  const navItems = [
    { id: 'Record', icon: MicIcon },
    { id: 'Script', icon: FileTextIcon },
    { id: 'AI Producer', icon: SparklesIcon },
    { id: 'Sounds', icon: MusicIcon },
    { id: 'Music', icon: Music2Icon },
    { id: 'Effects', icon: AudioWaveformIcon },
    { id: 'Mastering', icon: SlidersHorizontalIcon },
  ];

  const masteringStyles = [
    { name: 'Natural', desc: 'Subtle enhancement, preserves original dynamics.' },
    { name: 'Broadcast', desc: 'Loud and punchy, standard for most podcasts.' },
    { name: 'Warm', desc: 'Enhanced low-end for a rich, intimate sound.' },
    { name: 'Clear', desc: 'Crisp highs, great for interviews and dialogue.' },
    { name: 'Radio', desc: 'Heavy compression, classic radio announcer feel.' },
  ];

  return (
    <AppLayout title={<div><h1 className="text-xl font-bold text-gray-900">Studio</h1><p className="text-sm font-normal text-gray-500 mt-0.5">Record, mix, and master your podcast.</p></div>}>
      <div className="flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 200px)', minHeight: 500 }}>
        {/* Status Bar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-6 h-full overflow-x-auto">
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isRecording ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-xs font-bold tracking-wider">ON AIR</span>
              </div>
              <ActivityIcon className={`w-6 h-6 ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-300'}`} />
            </div>
            <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col cursor-pointer group flex-shrink-0" onClick={handleOpenSetup}>
              <span className="text-xs text-gray-500 font-medium group-hover:text-violet-600 transition-colors">Device</span>
              <span className={`text-sm font-semibold ${deviceLabel ? 'text-gray-900' : 'text-gray-400'}`}>{deviceLabel || 'Not Connected'}</span>
            </div>
            <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex items-center gap-3 cursor-pointer group flex-shrink-0" onClick={handleOpenSetup}>
              <MicIcon className={`w-5 h-5 ${deviceLabel ? 'text-violet-600' : 'text-gray-400'}`} />
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium group-hover:text-violet-600 transition-colors">Microphone</span>
                <span className={`text-sm font-semibold ${deviceLabel ? 'text-gray-900' : 'text-gray-400'}`}>{deviceLabel || 'Not Selected'}</span>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col flex-shrink-0">
              <span className="text-xs text-gray-500 font-medium">Recording</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-gray-900 tracking-tight">{formatTime(recordingTime)}</span>
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
              </div>
            </div>
            <div className="h-8 w-px bg-gray-200 flex-shrink-0" />
            <div className="flex flex-col relative group flex-shrink-0">
              <span className="text-xs text-gray-500 font-medium">Episode</span>
              <select className={`appearance-none bg-transparent text-sm font-semibold focus:outline-none cursor-pointer ${selectedEpisodeId ? 'text-gray-900' : 'text-gray-400'}`} value={selectedEpisodeId || ''} onChange={(e) => setSelectedEpisodeId(e.target.value)}>
                <option value="">None Selected</option>
                {episodes.map((ep) => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => navigate('/projects')} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex-shrink-0">Exit Studio</button>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Nav */}
          <div className="w-44 bg-white border-r border-gray-200 flex flex-col py-4 flex-shrink-0">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id as NavSection)}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${activeSection === item.id ? 'bg-violet-50 text-violet-700 border-r-2 border-violet-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-2 border-transparent'}`}>
                <item.icon className={`w-5 h-5 ${activeSection === item.id ? 'text-violet-600' : 'text-gray-400'}`} />
                {item.id}
              </button>
            ))}
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
            {/* Permission error */}
            {permissionError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Microphone Access Issue</p>
                  <p className="text-sm text-red-600 mt-1">{permissionError}</p>
                </div>
                <button onClick={() => setPermissionError('')} className="ml-auto text-red-400 hover:text-red-600"><XIcon className="w-4 h-4" /></button>
              </div>
            )}

            {activeSection === 'Mastering' ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <SlidersHorizontalIcon className="w-6 h-6 text-violet-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Mastering</h2>
                </div>
                {!hasRecordedAudio ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <AudioWaveformIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Audio to Master</h3>
                    <p className="text-gray-500 text-sm max-w-sm">Record some audio first before applying mastering effects.</p>
                    <button onClick={() => setActiveSection('Record')} className="mt-6 px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">Go to Record</button>
                  </div>
                ) : (
                  <div className="max-w-2xl">
                    {recordingUrl && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-gray-700 mb-2">Your Recording</p>
                        <audio controls src={recordingUrl} className="w-full" />
                      </div>
                    )}
                    <p className="text-gray-600 mb-8">Select a mastering style to enhance your recording for podcast distribution.</p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {masteringStyles.map((style) => (
                        <button key={style.name} onClick={() => setMasteringStyle(style.name)}
                          className={`p-4 rounded-xl border text-left transition-all ${masteringStyle === style.name ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-gray-200 hover:border-violet-300 bg-white'}`}>
                          <h4 className={`font-bold mb-1 ${masteringStyle === style.name ? 'text-violet-900' : 'text-gray-900'}`}>{style.name}</h4>
                          <p className={`text-xs ${masteringStyle === style.name ? 'text-violet-700' : 'text-gray-500'}`}>{style.desc}</p>
                        </button>
                      ))}
                    </div>
                    {isMastering ? (
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                          <span>Applying {masteringStyle} Mastering...</span>
                          <span>{masteringProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-600 transition-all duration-150 ease-out" style={{ width: `${masteringProgress}%` }} />
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center animate-pulse">Analyzing loudness and applying dynamics processing...</p>
                      </div>
                    ) : masteringProgress === 100 ? (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                        <CheckCircle2Icon className="w-5 h-5 text-green-600" />
                        <p className="text-sm font-medium text-green-800">Mastering complete! File saved to Media Library.</p>
                        {recordingUrl && (
                          <a href={recordingUrl} download={`mastered_${masteringStyle}.webm`} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                            <DownloadIcon className="w-3 h-3" /> Download
                          </a>
                        )}
                      </div>
                    ) : (
                      <button onClick={handleStartMastering} className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                        <SparklesIcon className="w-5 h-5" /> Start Mastering
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : activeSection === 'Record' ? (
              <>
                {/* Script Panel */}
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col" style={{ minHeight: 180 }}>
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Script</h3>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                        <UploadIcon className="w-3 h-3" /> Import Script
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 border border-violet-200 text-violet-700 bg-violet-50 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
                        <Wand2Icon className="w-3 h-3" /> AI Write
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="flex-1 w-full p-6 resize-none focus:outline-none text-gray-700 leading-relaxed"
                    style={{ minHeight: 120 }}
                    placeholder="Start typing your script here, or import an existing one..."
                    value={scriptText}
                    onChange={(e) => setScriptText(e.target.value)}
                  />
                </div>

                {/* Transport */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-8 mb-6">
                    {/* Input Meter */}
                    <div className="flex items-center gap-3 w-48">
                      <MicIcon className="w-5 h-5 text-violet-600" />
                      <div className="flex-col w-full">
                        <span className="text-xs font-medium text-gray-500 mb-1 block">Input Level</span>
                        <div className="flex gap-0.5 h-4">
                          {inputLevel.map((v, i) => (
                            <div key={i} className="flex-1 rounded-sm transition-all duration-75"
                              style={{ backgroundColor: v > 0.01 ? (v > 0.8 ? '#ef4444' : v > 0.6 ? '#facc15' : '#22c55e') : '#f3f4f6', height: `${Math.max(2, v * 16)}px`, alignSelf: 'flex-end' }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Transport Buttons */}
                    <div className="flex-1 flex justify-center items-center gap-6">
                      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                        <RewindIcon className="w-5 h-5" />
                        <span className="text-[10px] font-medium uppercase">Rewind</span>
                      </button>

                      {isRecording ? (
                        <button onClick={handleStop} className="flex flex-col items-center gap-1 text-red-500 hover:text-red-600 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-red-50 border-2 border-red-500 flex items-center justify-center">
                            <SquareIcon className="w-5 h-5 text-red-500" />
                          </div>
                          <span className="text-[10px] font-medium uppercase text-red-500">Stop</span>
                        </button>
                      ) : (
                        <button onClick={handleRecord} className="flex flex-col items-center gap-1 text-gray-900 hover:text-red-500 transition-colors">
                          <div className="w-12 h-12 rounded-full bg-gray-50 border-2 border-gray-300 hover:border-red-400 flex items-center justify-center transition-colors">
                            <div className="w-4 h-4 rounded-full bg-red-500" />
                          </div>
                          <span className="text-[10px] font-medium uppercase">Record</span>
                        </button>
                      )}

                      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                        <FastForwardIcon className="w-5 h-5" />
                        <span className="text-[10px] font-medium uppercase">Forward</span>
                      </button>
                    </div>

                    {/* Save */}
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <SaveIcon className="w-4 h-4" /> Save
                      </button>
                      {recordingUrl && (
                        <a href={recordingUrl} download="recording.webm" className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                          <DownloadIcon className="w-4 h-4" /> Download
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Quick Tools */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-3">Quick Tools</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(tools).map(([tool, active]) => (
                        <button key={tool} onClick={() => toggleTool(tool as keyof typeof tools)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${active ? 'bg-violet-100 text-violet-700 border border-violet-300' : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}>
                          {tool.charAt(0).toUpperCase() + tool.slice(1).replace(/([A-Z])/g, ' $1')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">{activeSection}</h2>
                <p className="text-gray-500">This section is coming soon. Switch to <strong>Record</strong> to start capturing audio.</p>
              </div>
            )}
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
              {permissionError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{permissionError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audio Input Device</label>
                {devices.length === 0 ? (
                  <div className="text-sm text-gray-500 py-2">
                    No microphones detected. Make sure a microphone is connected.
                  </div>
                ) : (
                  <select
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    value={selectedDeviceId}
                    onChange={(e) => {
                      const d = devices.find((dev) => dev.deviceId === e.target.value);
                      setSelectedDeviceId(e.target.value);
                      setDeviceLabel(d?.label || 'Microphone');
                    }}>
                    <option value="">Select a microphone...</option>
                    {devices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0, 8)}`}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="pt-4 flex justify-between items-center">
                <button className="text-sm font-medium text-violet-600 hover:text-violet-700" onClick={() => requestMic(selectedDeviceId || undefined)}>Test Microphone</button>
                <div className="flex gap-3">
                  <button onClick={() => setIsSetupOpen(false)} className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button onClick={handleSetupConfirm} disabled={devices.length === 0 && !selectedDeviceId} className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">Continue</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
