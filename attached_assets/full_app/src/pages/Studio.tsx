import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/AppLayout';
import { useMediaStore } from '../store/MediaStore';
import {
  MicIcon,
  PlayIcon,
  SquareIcon,
  SaveIcon,
  DownloadIcon,
  SlidersHorizontalIcon,
  ActivityIcon,
  ChevronDownIcon,
  PencilIcon,
  UploadIcon,
  Wand2Icon,
  MessageSquareIcon,
  SendIcon,
  RewindIcon,
  FastForwardIcon,
  Volume2Icon,
  MusicIcon,
  Music2Icon,
  AudioWaveformIcon,
  Settings2Icon,
  PlusIcon,
  XIcon,
  FileTextIcon,
  SparklesIcon,
  CheckCircle2Icon } from
'lucide-react';
type StudioMode = 'recording' | 'mastering';
type NavSection =
'Record' |
'Script' |
'AI Producer' |
'Sounds' |
'Music' |
'Effects' |
'Mastering';
export function Studio() {
  const navigate = useNavigate();
  const { episodes, addAsset } = useMediaStore();
  // --- State ---
  const [mode, setMode] = useState<StudioMode>('recording');
  const [activeSection, setActiveSection] = useState<NavSection>('Record');
  // Device & Setup
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [microphone, setMicrophone] = useState<string | null>(null);
  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(
    null
  );
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  // Script
  const [scriptText, setScriptText] = useState('');
  // Quick Tools
  const [tools, setTools] = useState({
    noiseGate: false,
    compressor: false,
    eq: false,
    deEsser: false,
    limiter: false,
    reverb: false
  });
  // Mastering
  const [masteringStyle, setMasteringStyle] = useState<string | null>(null);
  const [isMastering, setIsMastering] = useState(false);
  const [masteringProgress, setMasteringProgress] = useState(0);
  // --- Effects ---
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRecording]);
  // --- Handlers ---
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `00:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  const handleRecord = () => {
    if (!device || !microphone) {
      setIsSetupOpen(true);
      return;
    }
    setIsRecording(true);
  };
  const handleStop = () => {
    if (!isRecording) return;
    setIsRecording(false);
    setHasRecordedAudio(true);
    // Save raw recording to store
    const name = `Raw_Recording_${new Date().getTime()}.wav`;
    addAsset({
      name,
      category: 'studio',
      source: 'recording',
      size: Math.floor(Math.random() * 50000000) + 1000000,
      type: 'audio/wav',
      addedBy: 'Studio Creator',
      tags: ['raw'],
      description: `Raw recording (${formatTime(recordingTime)})`
    });
    // Transition to mastering
    setMode('mastering');
    setActiveSection('Mastering');
  };
  const handleStartMastering = () => {
    if (!masteringStyle) {
      alert('Please select a mastering style first.');
      return;
    }
    setIsMastering(true);
    setMasteringProgress(0);
    // Simulate mastering progress
    const interval = setInterval(() => {
      setMasteringProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMastering(false);
          // Save master to store
          const name = `Mastered_${masteringStyle}_${new Date().getTime()}.wav`;
          addAsset({
            name,
            category: 'studio',
            source: 'master',
            size: Math.floor(Math.random() * 40000000) + 1000000,
            type: 'audio/wav',
            addedBy: 'Studio Creator',
            tags: ['master', masteringStyle.toLowerCase()],
            description: `Mastered audio using ${masteringStyle} style`
          });
          alert('Mastering complete! File saved to Media Library.');
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };
  const toggleTool = (tool: keyof typeof tools) => {
    setTools((prev) => ({
      ...prev,
      [tool]: !prev[tool]
    }));
  };
  // --- Render Helpers ---
  const renderSetupDialog = () =>
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Audio Setup</h3>
          <button
          onClick={() => setIsSetupOpen(false)}
          className="text-gray-400 hover:text-gray-600">
          
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audio Input Device
            </label>
            <select
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            onChange={(e) => {
              setDevice(e.target.value);
              setMicrophone(e.target.value); // Simplify for mock
            }}
            value={device || ''}>
            
              <option value="">Select a device...</option>
              <option value="Scarlett 2i2 USB">Scarlett 2i2 USB</option>
              <option value="MacBook Pro Microphone">
                MacBook Pro Microphone
              </option>
              <option value="External USB Mic">External USB Mic</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audio Output Device
            </label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
              <option>MacBook Pro Speakers</option>
              <option>External Headphones</option>
            </select>
          </div>
          <div className="pt-4 flex justify-between items-center">
            <button className="text-sm font-medium text-violet-600 hover:text-violet-700">
              Test Microphone
            </button>
            <div className="flex gap-3">
              <button
              onClick={() => setIsSetupOpen(false)}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              
                Cancel
              </button>
              <button
              onClick={() => setIsSetupOpen(false)}
              disabled={!device}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
              
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;

  return (
    <AppLayout
      title={
      <div>
          <h1 className="text-xl font-bold text-gray-900">Studio</h1>
          <p className="text-sm font-normal text-gray-500 mt-0.5">
            Record, mix, and edit your podcast with AI assistance.
          </p>
        </div>
      }>
      
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden font-sans shadow-sm">
        {/* Top Status Bar (ON AIR Strip) */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-8 h-full">
            {/* ON AIR */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isRecording ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                
                <div
                  className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}>
                </div>
                <span className="text-xs font-bold tracking-wider">ON AIR</span>
              </div>
              {isRecording ?
              <ActivityIcon className="w-6 h-6 text-red-500 animate-pulse" /> :

              <ActivityIcon className="w-6 h-6 text-gray-300" />
              }
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Device */}
            <div
              className="flex flex-col cursor-pointer group"
              onClick={() => setIsSetupOpen(true)}>
              
              <span className="text-xs text-gray-500 font-medium group-hover:text-violet-600 transition-colors">
                Device
              </span>
              <span
                className={`text-sm font-semibold ${device ? 'text-gray-900' : 'text-gray-400'}`}>
                
                {device || 'Not Connected'}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Microphone */}
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsSetupOpen(true)}>
              
              <MicIcon
                className={`w-5 h-5 ${microphone ? 'text-violet-600' : 'text-gray-400'}`} />
              
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 font-medium group-hover:text-violet-600 transition-colors">
                  Microphone
                </span>
                <span
                  className={`text-sm font-semibold ${microphone ? 'text-gray-900' : 'text-gray-400'}`}>
                  
                  {microphone || 'Not Selected'}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Timer */}
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">
                Recording
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-gray-900 tracking-tight">
                  {formatTime(recordingTime)}
                </span>
                <div
                  className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}>
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            {/* Episode */}
            <div className="flex flex-col relative group">
              <span className="text-xs text-gray-500 font-medium">Episode</span>
              <div className="flex items-center gap-2 cursor-pointer">
                <select
                  className={`appearance-none bg-transparent text-sm font-semibold focus:outline-none cursor-pointer pr-4 ${selectedEpisodeId ? 'text-gray-900' : 'text-gray-400'}`}
                  value={selectedEpisodeId || ''}
                  onChange={(e) => setSelectedEpisodeId(e.target.value)}>
                  
                  <option value="">None Selected</option>
                  {episodes.map((ep) =>
                  <option key={ep.id} value={ep.id}>
                      {ep.title}
                    </option>
                  )}
                </select>
                <PencilIcon className="w-3 h-3 text-gray-400 group-hover:text-violet-600 transition-colors absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            
            Exit Studio
          </button>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Nav */}
          <div className="w-48 bg-white border-r border-gray-200 flex flex-col py-4 flex-shrink-0">
            {[
            {
              id: 'Record',
              icon: MicIcon
            },
            {
              id: 'Script',
              icon: FileTextIcon
            },
            {
              id: 'AI Producer',
              icon: SparklesIcon
            },
            {
              id: 'Sounds',
              icon: MusicIcon
            },
            {
              id: 'Music',
              icon: Music2Icon
            },
            {
              id: 'Effects',
              icon: AudioWaveformIcon
            },
            {
              id: 'Mastering',
              icon: SlidersHorizontalIcon
            }].
            map((item) =>
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as NavSection)}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${activeSection === item.id ? 'bg-violet-50 text-violet-700 border-r-2 border-violet-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-2 border-transparent'}`}>
              
                <item.icon
                className={`w-5 h-5 ${activeSection === item.id ? 'text-violet-600' : 'text-gray-400'}`} />
              
                {item.id}
              </button>
            )}
          </div>

          {/* Center Content */}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
            {activeSection === 'Mastering' ?
            <div className="bg-white rounded-xl border border-gray-200 p-8 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <SlidersHorizontalIcon className="w-6 h-6 text-violet-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Mastering
                  </h2>
                </div>

                {!hasRecordedAudio ?
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <AudioWaveformIcon className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      No Audio to Master
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                      Record some audio first before applying mastering effects.
                    </p>
                    <button
                  onClick={() => setActiveSection('Record')}
                  className="mt-6 px-6 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors">
                  
                      Go to Record
                    </button>
                  </div> :

              <div className="max-w-2xl">
                    <p className="text-gray-600 mb-8">
                      Select a mastering style to automatically enhance your
                      recording for podcast distribution.
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      {['Natural', 'Broadcast', 'Warm', 'Clear', 'Radio'].map(
                    (style) =>
                    <button
                      key={style}
                      onClick={() => setMasteringStyle(style)}
                      className={`p-4 rounded-xl border text-left transition-all ${masteringStyle === style ? 'border-violet-600 bg-violet-50 ring-1 ring-violet-600' : 'border-gray-200 hover:border-violet-300 bg-white'}`}>
                      
                            <h4
                        className={`font-bold mb-1 ${masteringStyle === style ? 'text-violet-900' : 'text-gray-900'}`}>
                        
                              {style}
                            </h4>
                            <p
                        className={`text-xs ${masteringStyle === style ? 'text-violet-700' : 'text-gray-500'}`}>
                        
                              {style === 'Broadcast' ?
                        'Loud and punchy, standard for most podcasts.' :
                        style === 'Warm' ?
                        'Enhanced low-end for a rich, intimate sound.' :
                        style === 'Clear' ?
                        'Crisp highs, great for interviews and dialogue.' :
                        style === 'Radio' ?
                        'Heavy compression, classic radio announcer feel.' :
                        'Subtle enhancement, preserves original dynamics.'}
                            </p>
                          </button>

                  )}
                    </div>

                    {isMastering ?
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="flex justify-between text-sm font-medium text-gray-900 mb-2">
                          <span>Applying {masteringStyle} Mastering...</span>
                          <span>{masteringProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                      className="h-full bg-violet-600 transition-all duration-200 ease-out"
                      style={{
                        width: `${masteringProgress}%`
                      }}>
                    </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3 text-center animate-pulse">
                          Analyzing loudness and applying dynamics processing...
                        </p>
                      </div> :

                <button
                  onClick={handleStartMastering}
                  className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                  
                        <SparklesIcon className="w-5 h-5" />
                        Start Mastering
                      </button>
                }
                  </div>
              }
              </div> :

            <>
                {/* Script Panel */}
                <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 min-h-[300px]">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Script</h3>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                        <UploadIcon className="w-3 h-3" />
                        Import Script
                      </button>
                      <button className="flex items-center gap-2 px-3 py-1.5 border border-violet-200 text-violet-700 bg-violet-50 rounded-lg text-xs font-medium hover:bg-violet-100 transition-colors">
                        <Wand2Icon className="w-3 h-3" />
                        AI Write
                      </button>
                    </div>
                  </div>
                  <textarea
                  className="flex-1 w-full p-6 resize-none focus:outline-none text-gray-700 text-lg leading-relaxed"
                  placeholder="Start typing your script here, or import an existing one..."
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)} />
                
                </div>

                {/* Transport & Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center gap-8 mb-6">
                    {/* Input Level */}
                    <div className="flex items-center gap-3 w-48">
                      <MicIcon className="w-5 h-5 text-violet-600" />
                      <div className="flex-col w-full">
                        <span className="text-xs font-medium text-gray-500 mb-1 block">
                          Input Level
                        </span>
                        <div className="flex gap-0.5 h-2">
                          {Array.from({
                          length: 20
                        }).map((_, i) => {
                          // Simulate meter if recording
                          const isActive =
                          isRecording && Math.random() > i / 20;
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-sm ${isActive ? i > 16 ? 'bg-red-500' : i > 12 ? 'bg-yellow-400' : 'bg-green-500' : 'bg-gray-100'}`}>
                            </div>);

                        })}
                        </div>
                      </div>
                    </div>
                    {/* Transport Buttons */}
                    <div className="flex-1 flex justify-center items-center gap-4">
                      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                        <RewindIcon className="w-5 h-5" />
                        <span className="text-[10px] font-medium uppercase">
                          Rewind
                        </span>
                      </button>
                      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                        <div className="relative">
                          <RewindIcon className="w-5 h-5" />
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">
                            10
                          </span>
                        </div>
                        <span className="text-[10px] font-medium uppercase">
                          -10s
                        </span>
                      </button>

                      <button
                      onClick={handleRecord}
                      className={`flex flex-col items-center gap-1 transition-colors ${isRecording ? 'text-red-500' : 'text-gray-900 hover:text-red-500'}`}>
                      
                        <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isRecording ? 'border-red-500 bg-red-50' : 'border-gray-900'}`}>
                        
                          <div
                          className={`w-4 h-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-900'}`}>
                        </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase text-gray-900">
                          Record
                        </span>
                      </button>

                      <button
                      onClick={handleStop}
                      disabled={!isRecording && !hasRecordedAudio}
                      className={`flex flex-col items-center gap-1 transition-colors ${!isRecording && !hasRecordedAudio ? 'text-gray-300' : 'text-gray-900 hover:text-gray-600'}`}>
                      
                        <div
                        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${!isRecording && !hasRecordedAudio ? 'border-gray-200' : 'border-gray-900'}`}>
                        
                          <SquareIcon className="w-4 h-4 fill-current" />
                        </div>
                        <span
                        className={`text-[10px] font-bold uppercase ${!isRecording && !hasRecordedAudio ? 'text-gray-300' : 'text-gray-900'}`}>
                        
                          Stop
                        </span>
                      </button>

                      <button
                      disabled={!hasRecordedAudio}
                      className={`flex flex-col items-center gap-1 transition-colors ${!hasRecordedAudio ? 'text-gray-300' : 'text-gray-400 hover:text-gray-900'}`}>
                      
                        <PlayIcon className="w-5 h-5 fill-current" />
                        <span className="text-[10px] font-medium uppercase">
                          Play
                        </span>
                      </button>
                      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                        <div className="relative">
                          <FastForwardIcon className="w-5 h-5" />
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mt-0.5">
                            10
                          </span>
                        </div>
                        <span className="text-[10px] font-medium uppercase">
                          +10s
                        </span>
                      </button>
                      <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors">
                        <FastForwardIcon className="w-5 h-5" />
                        <span className="text-[10px] font-medium uppercase">
                          Forward
                        </span>
                      </button>
                    </div>
                    <div className="w-48"></div> {/* Spacer for balance */}
                  </div>

                  {/* Timeline */}
                  <div className="relative pt-6 pb-2">
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-2 absolute top-0 w-full">
                      <span>00:00</span>
                      <span>00:15</span>
                      <span>00:30</span>
                      <span>00:45</span>
                      <span>01:00</span>
                      <span>01:15</span>
                      <span>01:30</span>
                      <span>01:45</span>
                      <span>02:00</span>
                    </div>
                    <div className="h-16 bg-gray-50 border border-gray-100 rounded-lg relative overflow-hidden">
                      {/* Playhead */}
                      <div
                      className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                      style={{
                        left: '10%'
                      }}>
                    </div>
                      {/* Simulated waveform if recorded */}
                      {hasRecordedAudio &&
                    <div className="absolute inset-y-0 left-0 bg-violet-100 w-[10%] flex items-center gap-0.5 px-1">
                          {Array.from({
                        length: 20
                      }).map((_, i) =>
                      <div
                        key={i}
                        className="flex-1 bg-violet-400 rounded-full"
                        style={{
                          height: `${Math.random() * 80 + 20}%`
                        }}>
                      </div>
                      )}
                        </div>
                    }
                    </div>
                  </div>

                  {/* Voice Track Row */}
                  <div className="flex items-center gap-4 mt-4 py-2">
                    <div className="flex items-center gap-3 w-48">
                      <MicIcon className="w-5 h-5 text-violet-600" />
                      <span className="text-sm font-bold text-gray-900">
                        Voice Track
                      </span>
                    </div>
                    <Volume2Icon className="w-4 h-4 text-gray-400" />
                    <div className="flex gap-1">
                      <button className="w-8 h-8 rounded bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">
                        M
                      </button>
                      <button className="w-8 h-8 rounded bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">
                        S
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sound Effects Strip */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <div className="flex items-center gap-3 w-48 border-r border-gray-100 pr-4">
                    <MusicIcon className="w-5 h-5 text-gray-400" />
                    <div className="flex-col w-full">
                      <span className="text-xs font-bold text-gray-900 mb-1 block">
                        Sound Effects
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5 h-1.5 flex-1">
                          {Array.from({
                          length: 10
                        }).map((_, i) =>
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gray-200">
                        </div>
                        )}
                        </div>
                        <Volume2Icon className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                    {[
                  'Applause',
                  'Laughter',
                  'Whoosh',
                  'Bell',
                  'Chime',
                  'Ding',
                  'Transition'].
                  map((sfx) =>
                  <button
                    key={sfx}
                    className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                    
                        {sfx}
                      </button>
                  )}
                    <button className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 whitespace-nowrap">
                      + More
                    </button>
                  </div>
                </div>

                {/* Bottom Strip */}
                <div className="flex items-center gap-8 px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Recording Quality
                    </span>
                    <span className="text-xs text-gray-400">—</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2Icon className="w-3 h-3 text-violet-600" />
                    <span className="text-xs text-gray-500 font-medium">
                      Auto Save
                    </span>
                    <span className="text-xs text-gray-900 font-medium">
                      Off
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">
                      Project Backup
                    </span>
                    <span className="text-xs text-gray-400">—</span>
                  </div>
                </div>
              </>
            }
          </div>

          {/* Right Sidebar */}
          <div className="w-80 border-l border-gray-200 flex flex-col p-6 gap-6 overflow-y-auto bg-gray-50/30">
            {/* AI Producer */}
            <div className="bg-white rounded-xl border border-gray-200 flex flex-col flex-1 min-h-[400px]">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">AI Producer</h3>
                <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-[10px] font-bold rounded uppercase tracking-wider">
                  Producer
                </span>
              </div>

              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <ActivityIcon className="w-4 h-4 text-violet-500" />
                  {isRecording ?
                  'Listening and analyzing...' :
                  'Waiting for recording...'}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h4 className="text-xs font-bold text-gray-900 mb-3">
                  Live Feedback
                </h4>
                <div className="flex-1 border border-gray-100 rounded-lg bg-gray-50 flex flex-col items-center justify-center text-center p-6">
                  {isRecording ?
                  <div className="space-y-3 w-full">
                      <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-left">
                        <span className="font-bold text-green-600 block mb-1">
                          Good pacing
                        </span>
                        Your speaking rate is steady at ~140 wpm.
                      </div>
                    </div> :

                  <>
                      <MessageSquareIcon className="w-6 h-6 text-gray-300 mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        No feedback available.
                      </p>
                      <p className="text-xs text-gray-500">
                        Start recording to get AI insights.
                      </p>
                    </>
                  }
                </div>
              </div>

              <div className="p-4 border-t border-gray-100">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask AI anything..."
                    className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-colors" />
                  
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-gray-200 text-gray-500 rounded hover:bg-violet-600 hover:text-white transition-colors">
                    <SendIcon className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Quick Tools</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                {
                  id: 'noiseGate',
                  label: 'Noise Gate',
                  icon: AudioWaveformIcon
                },
                {
                  id: 'compressor',
                  label: 'Compressor',
                  icon: Settings2Icon
                },
                {
                  id: 'eq',
                  label: 'EQ',
                  icon: SlidersHorizontalIcon
                },
                {
                  id: 'deEsser',
                  label: 'De-Esser',
                  icon: MicIcon
                },
                {
                  id: 'limiter',
                  label: 'Limiter',
                  icon: ActivityIcon
                },
                {
                  id: 'reverb',
                  label: 'Reverb',
                  icon: SparklesIcon
                }].
                map((tool) => {
                  const isActive = tools[tool.id as keyof typeof tools];
                  return (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id as keyof typeof tools)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${isActive ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-gray-200 bg-white text-gray-600 hover:border-violet-300'}`}>
                      
                      <tool.icon
                        className={`w-5 h-5 mb-2 ${isActive ? 'text-violet-600' : 'text-violet-600'}`} />
                      
                      <span
                        className={`text-[10px] font-bold text-center ${isActive ? 'text-violet-900' : 'text-gray-900'}`}>
                        
                        {tool.label}
                      </span>
                      <span
                        className={`text-[9px] mt-0.5 ${isActive ? 'text-violet-600' : 'text-gray-400'}`}>
                        
                        {isActive ? 'On' : 'Off'}
                      </span>
                    </button>);

                })}
                <button className="col-span-3 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-xs font-medium">
                  <PlusIcon className="w-4 h-4" />
                  Add Effect
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSetupOpen && renderSetupDialog()}
    </AppLayout>);

}