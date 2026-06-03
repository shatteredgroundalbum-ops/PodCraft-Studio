import React, { useEffect, useRef, useState } from 'react';
import { Mic, Headphones, ChevronRight, Check, Activity, AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useStudio, RoomProfileSettings } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

/* ─── Room options ──────────────────────────────────────────── */
const ROOM_TYPES = [
  'Treated Room', 'Bedroom', 'Office', 'Living Room', 'Kitchen',
  'Hallway', 'Bathroom / Reflective Room', 'Garage', 'Warehouse',
  'Vehicle', 'Semi-truck', 'Van', 'Noisy Environment', 'Custom / Unknown',
];

/* ─── Room → engine preset settings ─────────────────────────── */
type ProfileBase = Omit<RoomProfileSettings, 'roomType' | 'noiseFloorDb' | 'reverbMs'>;
const ROOM_PROFILES: Record<string, ProfileBase> = {
  'Treated Room':               { eq:{low:-2,mid:2,high:2},  gain:0.85, gateEnabled:false, gateThresholdDb:-50, compEnabled:true,  limiterEnabled:false, recommendedPreset:'Broadcast Clarity'     },
  'Bedroom':                    { eq:{low:-1,mid:1,high:0},  gain:0.80, gateEnabled:false, gateThresholdDb:-45, compEnabled:true,  limiterEnabled:false, recommendedPreset:'Podcast Voice - Warm'  },
  'Office':                     { eq:{low:-1,mid:2,high:1},  gain:0.85, gateEnabled:false, gateThresholdDb:-44, compEnabled:true,  limiterEnabled:false, recommendedPreset:'Podcast Voice - Clean' },
  'Living Room':                { eq:{low: 0,mid:0,high:0},  gain:0.80, gateEnabled:false, gateThresholdDb:-43, compEnabled:true,  limiterEnabled:false, recommendedPreset:'Podcast Voice - Clean' },
  'Kitchen':                    { eq:{low:-1,mid:1,high:1},  gain:0.80, gateEnabled:true,  gateThresholdDb:-42, compEnabled:true,  limiterEnabled:false, recommendedPreset:'Podcast Voice - Clean' },
  'Hallway':                    { eq:{low: 1,mid:-1,high:0}, gain:0.75, gateEnabled:true,  gateThresholdDb:-40, compEnabled:true,  limiterEnabled:false, recommendedPreset:'Untreated Room'        },
  'Bathroom / Reflective Room': { eq:{low: 2,mid:-2,high:1}, gain:0.70, gateEnabled:true,  gateThresholdDb:-38, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Untreated Room'        },
  'Garage':                     { eq:{low:-3,mid:0,high:-1}, gain:0.75, gateEnabled:true,  gateThresholdDb:-37, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Noisy Room'            },
  'Warehouse':                  { eq:{low:-4,mid:-1,high:-2},gain:0.70, gateEnabled:true,  gateThresholdDb:-35, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Noisy Room'            },
  'Vehicle':                    { eq:{low:-5,mid:1,high:-2}, gain:0.70, gateEnabled:true,  gateThresholdDb:-35, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Vehicle/Noise Control' },
  'Semi-truck':                 { eq:{low:-6,mid:1,high:-3}, gain:0.65, gateEnabled:true,  gateThresholdDb:-32, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Vehicle/Noise Control' },
  'Van':                        { eq:{low:-5,mid:1,high:-2}, gain:0.70, gateEnabled:true,  gateThresholdDb:-35, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Vehicle/Noise Control' },
  'Noisy Environment':          { eq:{low:-4,mid:2,high:-2}, gain:0.70, gateEnabled:true,  gateThresholdDb:-32, compEnabled:true,  limiterEnabled:true,  recommendedPreset:'Noisy Room'            },
  'Custom / Unknown':           { eq:{low: 0,mid:0,high:0},  gain:0.80, gateEnabled:false, gateThresholdDb:-40, compEnabled:false, limiterEnabled:false, recommendedPreset:'Custom'                },
};

/* ─── Room classification (primary + alternates) ─────────────── */
function classifyRoom(noiseFloorDb: number, reverbMs: number, spectralLow: number, spectralHigh: number): string {
  if (noiseFloorDb > -22) return 'Noisy Environment';
  if (reverbMs > 550) {
    if (spectralHigh > 35) return 'Bathroom / Reflective Room';
    if (spectralLow > 50) return 'Warehouse';
    return 'Hallway';
  }
  if (reverbMs > 350) {
    if (spectralLow > 45) return 'Garage';
    return 'Hallway';
  }
  if (reverbMs > 200) {
    if (spectralHigh > 30) return 'Kitchen';
    return 'Living Room';
  }
  if (reverbMs > 80) {
    if (spectralHigh > 32) return 'Office';
    return 'Bedroom';
  }
  return 'Treated Room';
}

const ROOM_SECONDARY: Record<string, [string, string]> = {
  'Treated Room':               ['Bedroom',                    'Office'              ],
  'Bedroom':                    ['Office',                     'Living Room'         ],
  'Office':                     ['Bedroom',                    'Living Room'         ],
  'Living Room':                ['Bedroom',                    'Kitchen'             ],
  'Kitchen':                    ['Living Room',                'Office'              ],
  'Hallway':                    ['Bathroom / Reflective Room', 'Garage'              ],
  'Bathroom / Reflective Room': ['Hallway',                    'Kitchen'             ],
  'Garage':                     ['Warehouse',                  'Hallway'             ],
  'Warehouse':                  ['Garage',                     'Hallway'             ],
  'Vehicle':                    ['Van',                        'Noisy Environment'   ],
  'Semi-truck':                 ['Van',                        'Vehicle'             ],
  'Van':                        ['Vehicle',                    'Semi-truck'          ],
  'Noisy Environment':          ['Vehicle',                    'Garage'              ],
  'Custom / Unknown':           ['Bedroom',                    'Office'              ],
};

function classifyRoomTop3(
  noiseFloorDb: number, reverbMs: number,
  spectralLow: number, spectralHigh: number,
): [string, string, string] {
  const primary = classifyRoom(noiseFloorDb, reverbMs, spectralLow, spectralHigh);
  const [second, third] = ROOM_SECONDARY[primary] ?? ['Bedroom', 'Office'];
  return [primary, second, third];
}

/* ─── Select options ─────────────────────────────────────────── */
const INTERFACE_OPTIONS = [
  'Built-in / Laptop','Focusrite Scarlett Solo','Focusrite Scarlett 2i2','Focusrite Scarlett 4i4',
  'SSL 2','SSL 2+','MOTU M2','Universal Audio Volt 1','Universal Audio Volt 176',
  'PreSonus AudioBox USB 96','Behringer U-Phoria UM2','Audient iD4',
  'RØDECaster Pro II','Zoom PodTrak P4','Custom',
];
const COMMON_MICS = [
  'System Default','Shure SM7B','Rode PodMic','Rode NT-USB','Audio-Technica AT2020',
  'Blue Yeti','Blue Yeti X','Elgato Wave 3','HyperX QuadCast','Sony ZV-1 (built-in)',
  'Laptop Built-in','Custom',
];
const HEADPHONE_OPTIONS = [
  'System Default / Speakers','Sony MDR-7506','Audio-Technica ATH-M50x',
  'Beyerdynamic DT 770 Pro','Sennheiser HD 280 Pro','AKG K240',
  'Shure SRH840','AirPods / Wireless','Custom',
];

/* ─── Step types ─────────────────────────────────────────────── */
type Step = 'interface' | 'mic' | 'headphones' | 'roomtest' | 'confirm';
const STEPS: Step[] = ['interface', 'mic', 'headphones', 'roomtest', 'confirm'];
const STEP_LABELS = ['Interface', 'Mic', 'Headphones', 'Room Test', 'Confirm'];

/* ─── Room test state ─────────────────────────────────────────── */
type TestPhase = 'idle' | 'requesting' | 'noise' | 'voice' | 'analyzing' | 'done' | 'error';

interface RoomMeasurements {
  noiseFloorDb: number;
  peakInputDb: number;
  reverbMs: number;
  spectralLow: number;
  spectralMid: number;
  spectralHigh: number;
  detectedRoom: string;
}

const NOISE_DURATION_MS  = 4000;
const VOICE_DURATION_MS  = 6000;
const SAMPLE_INTERVAL_MS = 50;

/* ─── Persistent storage key ─────────────────────────────────── */
const LAST_PROFILE_KEY    = 'podcraft_last_room_profile_v2';
const PROFILE_HISTORY_KEY = 'podcraft_room_profile_history';

/* ─── Main component ─────────────────────────────────────────── */
export function AudioSetupModal({ onProceedToProject }: { onProceedToProject?: () => void } = {}) {
  const { setAudioSetupDone, applyRoomProfile } = useStudio();

  /* Step state */
  const [step,   setStep]   = useState<Step>('interface');
  const [iface,  setIface]  = useState('Built-in / Laptop');
  const [mic,    setMic]    = useState('System Default');
  const [phones, setPhones] = useState('System Default / Speakers');

  /* Room test state */
  const [testPhase,     setTestPhase]     = useState<TestPhase>('idle');
  const [testProgress,  setTestProgress]  = useState(0);
  const [currentRmsDb,  setCurrentRmsDb]  = useState(-90);
  const [measurements,  setMeasurements]  = useState<RoomMeasurements | null>(null);
  const [roomGuesses,   setRoomGuesses]   = useState<[string, string, string]>(['Bedroom', 'Office', 'Living Room']);
  const [overrideRoom,  setOverrideRoom]  = useState('');
  const [customRoomName, setCustomRoomName] = useState('');
  const [testError,     setTestError]     = useState('');

  const streamRef   = useRef<MediaStream | null>(null);
  const actxRef     = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const cancelRef   = useRef(false);

  useEffect(() => { engine.init(); }, []);

  useEffect(() => () => { cancelRef.current = true; cleanupTestAudio(); }, []);

  const cleanupTestAudio = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (actxRef.current?.state !== 'closed') actxRef.current?.close().catch(() => {});
    actxRef.current = null;
    analyserRef.current = null;
  };

  /* ── Room test runner ──────────────────────────────────────── */
  const runRoomTest = async () => {
    cancelRef.current = false;
    setTestError('');
    setMeasurements(null);
    setTestPhase('requesting');
    setTestProgress(0);

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      setTestPhase('error');
      setTestError('Microphone access denied. Please allow microphone permission and try again.');
      return;
    }
    if (cancelRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

    streamRef.current = stream;
    const actx = new AudioContext({ sampleRate: 48000 });
    actxRef.current = actx;
    const source = actx.createMediaStreamSource(stream);
    const analyser = actx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.15;
    source.connect(analyser);
    analyserRef.current = analyser;

    const floatBuf = new Float32Array(analyser.fftSize);
    const freqBuf  = new Uint8Array(analyser.frequencyBinCount);

    const getRms = () => {
      analyser.getFloatTimeDomainData(floatBuf);
      let sq = 0;
      for (let i = 0; i < floatBuf.length; i++) sq += floatBuf[i] * floatBuf[i];
      return Math.sqrt(sq / floatBuf.length);
    };

    const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

    /* Phase 1: Noise floor — 4 seconds of silence */
    setTestPhase('noise');
    const noiseSamples: number[] = [];
    const noiseSteps = Math.floor(NOISE_DURATION_MS / SAMPLE_INTERVAL_MS);
    for (let i = 0; i < noiseSteps; i++) {
      if (cancelRef.current) { cleanupTestAudio(); return; }
      const rms = getRms();
      noiseSamples.push(rms);
      const dbVal = rms > 0 ? 20 * Math.log10(Math.max(rms, 1e-10)) : -90;
      setCurrentRmsDb(dbVal);
      setTestProgress(Math.round((i / noiseSteps) * 50));
      await sleep(SAMPLE_INTERVAL_MS);
    }
    const sorted = [...noiseSamples].sort((a, b) => a - b);
    const noiseFloorRms = sorted[Math.max(0, Math.floor(sorted.length * 0.1))];
    const noiseFloorDb  = noiseFloorRms > 0 ? 20 * Math.log10(Math.max(noiseFloorRms, 1e-10)) : -90;

    /* Phase 2: Voice + decay — 6 seconds */
    setTestPhase('voice');
    const voiceSamples: number[] = [];
    const voiceSteps = Math.floor(VOICE_DURATION_MS / SAMPLE_INTERVAL_MS);
    let peakRms = 0;
    let peakIdx = 0;
    let capturedFreqBuf: Uint8Array | null = null;

    for (let i = 0; i < voiceSteps; i++) {
      if (cancelRef.current) { cleanupTestAudio(); return; }
      const rms = getRms();
      voiceSamples.push(rms);
      if (rms > peakRms) { peakRms = rms; peakIdx = i; }
      const dbVal = rms > 0 ? 20 * Math.log10(Math.max(rms, 1e-10)) : -90;
      setCurrentRmsDb(dbVal);
      setTestProgress(50 + Math.round((i / voiceSteps) * 45));
      if (rms === peakRms && !capturedFreqBuf) {
        analyser.getByteFrequencyData(freqBuf);
        capturedFreqBuf = new Uint8Array(freqBuf);
      }
      await sleep(SAMPLE_INTERVAL_MS);
    }

    /* Phase 3: Analyze */
    setTestPhase('analyzing');
    setTestProgress(95);
    await sleep(300);

    const peakInputDb = peakRms > 0 ? 20 * Math.log10(Math.max(peakRms, 1e-10)) : -90;

    const decayThresholdRms = noiseFloorRms * 6;
    let decaySampleCount = 0;
    for (let i = peakIdx + 1; i < voiceSamples.length; i++) {
      if (voiceSamples[i] > decayThresholdRms) decaySampleCount++;
      else break;
    }
    const reverbMs = Math.min(decaySampleCount * SAMPLE_INTERVAL_MS, 800);

    const fft = capturedFreqBuf ?? freqBuf;
    analyser.getByteFrequencyData(freqBuf);
    const sampleRate = actx.sampleRate;
    const binCount   = analyser.frequencyBinCount;
    const lowMax     = Math.floor(500  / (sampleRate / 2) * binCount);
    const midMax     = Math.floor(4000 / (sampleRate / 2) * binCount);
    let lowSum = 0, midSum = 0, highSum = 0;
    for (let i = 0;      i < lowMax;   i++) lowSum  += fft[i];
    for (let i = lowMax; i < midMax;   i++) midSum  += fft[i];
    for (let i = midMax; i < binCount; i++) highSum += fft[i];
    const total = (lowSum + midSum + highSum) || 1;
    const spectralLow  = Math.round((lowSum  / total) * 100);
    const spectralMid  = Math.round((midSum  / total) * 100);
    const spectralHigh = Math.round((highSum / total) * 100);

    const guesses = classifyRoomTop3(noiseFloorDb, reverbMs, spectralLow, spectralHigh);

    cleanupTestAudio();
    setTestProgress(100);

    const result: RoomMeasurements = {
      noiseFloorDb, peakInputDb, reverbMs,
      spectralLow, spectralMid, spectralHigh,
      detectedRoom: guesses[0],
    };
    setMeasurements(result);
    setRoomGuesses(guesses);
    setOverrideRoom(guesses[0]);
    setTestPhase('done');
  };

  /* ── Finish: apply room profile + persist + close ──────────── */
  const handleFinish = () => {
    const isCustom = overrideRoom === 'Custom / Unknown';
    const chosenRoom = overrideRoom || measurements?.detectedRoom || 'Custom / Unknown';
    const base = ROOM_PROFILES[chosenRoom] ?? ROOM_PROFILES['Custom / Unknown'];

    const roomLabel = isCustom && customRoomName.trim()
      ? customRoomName.trim()
      : chosenRoom;

    const profile: RoomProfileSettings = {
      roomType:     roomLabel,
      noiseFloorDb: measurements?.noiseFloorDb ?? -60,
      reverbMs:     measurements?.reverbMs     ?? 0,
      ...base,
    };
    applyRoomProfile(profile);

    /* Store rich profile for Resume Session + future reference */
    const richProfile = {
      id:           Date.now().toString(),
      timestamp:    new Date().toISOString(),
      roomType:     roomLabel,
      customRoomName: isCustom ? customRoomName.trim() || undefined : undefined,
      audioInterface: iface,
      microphone:   mic,
      monitoring:   phones,
      measurements: measurements
        ? {
            noiseFloorDb:  measurements.noiseFloorDb,
            peakInputDb:   measurements.peakInputDb,
            reverbMs:      measurements.reverbMs,
            spectralLow:   measurements.spectralLow,
            spectralMid:   measurements.spectralMid,
            spectralHigh:  measurements.spectralHigh,
          }
        : null,
      unsupportedMeasurements: [
        'echoMs',             // echo/reflection: estimated via decay only, not directly measured
        'backgroundHumDb',    // hum/noise frequency: not separately measured
        'voiceClarity',       // no voice quality scoring implemented
      ],
      appliedSettings: { ...base },
    };

    try {
      localStorage.setItem(LAST_PROFILE_KEY, JSON.stringify(richProfile));
      const history: unknown[] = JSON.parse(localStorage.getItem(PROFILE_HISTORY_KEY) ?? '[]');
      history.unshift(richProfile);
      localStorage.setItem(PROFILE_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
    } catch { /* ignore storage errors */ }

    if (onProceedToProject) {
      onProceedToProject();
    } else {
      setAudioSetupDone(true);
    }
  };

  /* ── Navigation ───────────────────────────────────────────── */
  const stepIdx = STEPS.indexOf(step);
  const isLast  = step === 'confirm';

  const canNext =
    step === 'interface'    ? !!iface
    : step === 'mic'        ? !!mic
    : step === 'headphones' ? !!phones
    : step === 'roomtest'   ? testPhase === 'done'
    : true;

  const handleNext = () => {
    if (step === 'roomtest' && testPhase !== 'done') return;
    if (!isLast) { setStep(STEPS[stepIdx + 1]); return; }
    handleFinish();
  };

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[520px] flex flex-col overflow-hidden max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5 shrink-0">
          <h2 className="text-lg font-bold text-white">Audio Setup</h2>
          <p className="text-violet-200 text-sm mt-0.5">Configure your recording environment.</p>
          <div className="flex gap-1.5 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`w-full h-1.5 rounded-full transition-all ${i <= stepIdx ? 'bg-white' : 'bg-white/25'}`}/>
                <span className={`text-[9px] font-medium tracking-wide ${i <= stepIdx ? 'text-white' : 'text-white/40'}`}>
                  {STEP_LABELS[i].toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1 overflow-y-auto">
          {step === 'interface' && (
            <StepSelect
              icon={<span className="text-xl">🎛️</span>} color="violet"
              title="Audio Interface"
              description="Select the interface connected to your microphone."
              options={INTERFACE_OPTIONS} value={iface} onChange={setIface}/>
          )}

          {step === 'mic' && (
            <StepSelect
              icon={<Mic className="w-4 h-4 text-red-600"/>} color="red"
              title="Microphone"
              description="Select your microphone model for gain staging defaults."
              options={COMMON_MICS} value={mic} onChange={setMic}/>
          )}

          {step === 'headphones' && (
            <StepSelect
              icon={<Headphones className="w-4 h-4 text-blue-600"/>} color="blue"
              title="Monitoring / Headphones"
              description="Select your headphones or monitoring output."
              options={HEADPHONE_OPTIONS} value={phones} onChange={setPhones}/>
          )}

          {step === 'roomtest' && (
            <RoomTestStep
              phase={testPhase} progress={testProgress} rmsDb={currentRmsDb}
              measurements={measurements} error={testError} onStart={runRoomTest}/>
          )}

          {step === 'confirm' && (
            <ConfirmStep
              measurements={measurements ?? null}
              overrideRoom={overrideRoom || (measurements?.detectedRoom ?? 'Custom / Unknown')}
              onOverride={setOverrideRoom}
              roomGuesses={roomGuesses}
              customRoomName={customRoomName}
              onCustomRoomName={setCustomRoomName}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400">Step {stepIdx + 1} of {STEPS.length}</span>
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button onClick={() => setStep(STEPS[stepIdx - 1])}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                Back
              </button>
            )}
            <button onClick={() => setAudioSetupDone(true)}
              className="px-4 py-2 text-sm text-gray-400 hover:text-gray-600">
              Skip
            </button>
            <button onClick={handleNext} disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {isLast
                ? onProceedToProject
                  ? <>Next: Project Setup <ChevronRight className="w-4 h-4"/></>
                  : <><Check className="w-4 h-4"/> Apply &amp; Finish</>
                : <>Next <ChevronRight className="w-4 h-4"/></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── StepSelect ─────────────────────────────────────────────── */
function StepSelect({ icon, color, title, description, options, value, onChange }: {
  icon: React.ReactNode; color: string; title: string; description: string;
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  const bg: Record<string, string> = { violet: 'bg-violet-100', red: 'bg-red-100', blue: 'bg-blue-100' };
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-9 h-9 ${bg[color] ?? 'bg-gray-100'} rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{title}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-violet-400 bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* ─── RoomTestStep ───────────────────────────────────────────── */
function RoomTestStep({ phase, progress, rmsDb, measurements, error, onStart }: {
  phase: TestPhase; progress: number; rmsDb: number;
  measurements: RoomMeasurements | null; error: string; onStart: () => void;
}) {
  const meterPct   = Math.max(0, Math.min(100, (rmsDb + 90) / 90 * 100));
  const meterColor = rmsDb > -12 ? 'bg-red-500' : rmsDb > -24 ? 'bg-yellow-400' : 'bg-green-500';

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
          <Activity className="w-4 h-4 text-green-600"/>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">Room Environment Test</div>
          <div className="text-xs text-gray-500">Real-time analysis using your microphone — no fake results.</div>
        </div>
      </div>

      {phase === 'idle' && (
        <div className="text-center py-4">
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-4 py-4 mb-5 text-left">
            <p className="text-sm text-violet-900 leading-relaxed">
              Stand or sit in your normal recording position. Then speak at a normal volume.
              If possible, also speak once from the middle of the room away from the microphone
              so the system can listen to the room profile.
            </p>
          </div>
          <p className="text-xs text-gray-400 mb-5">Takes about 10 seconds. The system will listen and estimate your room type.</p>
          <button onClick={onStart}
            className="px-6 py-2.5 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700">
            Start Mic Check
          </button>
        </div>
      )}

      {phase === 'requesting' && (
        <div className="text-center py-6">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-sm text-gray-600">Requesting microphone access…</p>
        </div>
      )}

      {(phase === 'noise' || phase === 'voice') && (
        <div className="space-y-4">
          <div className={`rounded-xl px-4 py-3 text-sm font-medium ${phase === 'noise' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
            {phase === 'noise'
              ? '🔇  Remain completely silent for 4 seconds…'
              : '🎙  Speak at a normal volume, then walk to the middle of the room and speak again.'}
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>Input level</span>
              <span>{rmsDb < -89 ? '—' : `${rmsDb.toFixed(1)} dBFS`}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-75 ${meterColor}`} style={{ width: `${meterPct}%` }}/>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{phase === 'noise' ? 'Silence measurement' : 'Voice measurement'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full transition-all duration-100" style={{ width: `${progress}%` }}/>
            </div>
          </div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="text-center py-6">
          <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mx-auto mb-3"/>
          <p className="text-sm text-gray-600">Analyzing room acoustics…</p>
        </div>
      )}

      {phase === 'done' && measurements && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="text-sm font-semibold text-green-800 mb-0.5">✓ Analysis complete</div>
            <div className="text-xs text-green-700">Best guess: <span className="font-bold">{measurements.detectedRoom}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Metric label="Noise Floor"   value={`${measurements.noiseFloorDb.toFixed(1)} dBFS`}
              note={measurements.noiseFloorDb > -30 ? 'High — gate recommended' : 'Good'}
              warn={measurements.noiseFloorDb > -30}/>
            <Metric label="Peak Input"    value={`${measurements.peakInputDb.toFixed(1)} dBFS`}
              note="Measured during voice phase" warn={false}/>
            <Metric label="Reverb Est."   value={`~${measurements.reverbMs} ms`}
              note="Estimated from speech decay" warn={false} approx/>
            <Metric label="Echo / Hum"    value="Unavailable"
              note="Not directly measurable in browser" warn={false} unavailable/>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-[10px] text-gray-500 font-semibold mb-2 uppercase tracking-wide">
              Spectral Balance (estimated)
            </div>
            <SpectralBar low={measurements.spectralLow} mid={measurements.spectralMid} high={measurements.spectralHigh}/>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-[10px] text-gray-400 space-y-0.5">
            <div className="font-semibold text-gray-500 uppercase tracking-wide mb-1">Unavailable measurements</div>
            <div>• Echo / reflection depth — not directly measurable via Web Audio API</div>
            <div>• Background hum frequency analysis — not implemented</div>
            <div>• Voice clarity score — no speech quality model present</div>
          </div>

          <button onClick={onStart}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-600 mt-1">
            <RefreshCw className="w-3 h-3"/> Re-run mic check
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm text-red-700 font-medium">Test failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button onClick={onStart} className="text-xs text-red-600 underline mt-2">Try again</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── ConfirmStep ────────────────────────────────────────────── */
function ConfirmStep({
  measurements,
  overrideRoom,
  onOverride,
  roomGuesses,
  customRoomName,
  onCustomRoomName,
}: {
  measurements: RoomMeasurements | null;
  overrideRoom: string;
  onOverride: (room: string) => void;
  roomGuesses: [string, string, string];
  customRoomName: string;
  onCustomRoomName: (name: string) => void;
}) {
  const isCustomSelected = overrideRoom === 'Custom / Unknown';
  const choiceLabels: Array<{ key: string; label: string; sub: string }> = [
    { key: roomGuesses[0], label: roomGuesses[0], sub: 'Best match' },
    { key: roomGuesses[1], label: roomGuesses[1], sub: 'Second possibility' },
    { key: roomGuesses[2], label: roomGuesses[2], sub: 'Third possibility' },
    { key: 'Custom / Unknown', label: 'Custom / Other', sub: 'Enter your own room name' },
  ];

  const base = ROOM_PROFILES[overrideRoom] ?? ROOM_PROFILES['Custom / Unknown'];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
          <Home className="w-4 h-4 text-violet-600"/>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">Detected Room Profile</div>
          <div className="text-xs text-gray-500">
            {measurements ? 'Select the best match or enter a custom name.' : 'No test data — choose the room type manually.'}
          </div>
        </div>
      </div>

      {/* 4-choice room picker */}
      <div className="space-y-2 mb-4">
        {choiceLabels.map(({ key, label, sub }) => {
          const selected = overrideRoom === key;
          return (
            <button
              key={key}
              onClick={() => onOverride(key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                selected
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                selected ? 'border-violet-600' : 'border-gray-300'
              }`}>
                {selected && <div className="w-2 h-2 bg-violet-600 rounded-full"/>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{label}</div>
                <div className={`text-xs mt-0.5 ${selected && key !== 'Custom / Unknown' && sub === 'Best match' ? 'text-violet-600 font-medium' : 'text-gray-400'}`}>
                  {sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom name input */}
      {isCustomSelected && (
        <div className="mb-4">
          <label className="block text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1.5">
            Room / Environment Name
          </label>
          <input
            type="text"
            value={customRoomName}
            onChange={e => onCustomRoomName(e.target.value)}
            placeholder="e.g. Basement, Shipping Container, Podcast Booth…"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-violet-400 bg-white"
            autoFocus
          />
        </div>
      )}

      {/* Settings preview */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">
          Settings that will be applied
        </div>
        <SettingRow label="Input Gain"  value={`${Math.round(base.gain * 100)}%`}/>
        <SettingRow label="Mic EQ Low"  value={fmtDb(base.eq.low)}/>
        <SettingRow label="Mic EQ Mid"  value={fmtDb(base.eq.mid)}/>
        <SettingRow label="Mic EQ High" value={fmtDb(base.eq.high)}/>
        <SettingRow label="Noise Gate"  value={base.gateEnabled ? `On (${base.gateThresholdDb} dBFS)` : 'Off'} highlight={base.gateEnabled}/>
        <SettingRow label="Compressor"  value={base.compEnabled    ? 'On' : 'Off'} highlight={base.compEnabled}/>
        <SettingRow label="Limiter"     value={base.limiterEnabled ? 'On' : 'Off'} highlight={base.limiterEnabled}/>
        <SettingRow label="Track Preset" value={base.recommendedPreset}/>
      </div>

      {/* Unavailable effects note */}
      <div className="mt-3 text-[11px] text-gray-400 space-y-0.5">
        <div>Unavailable: AI noise reduction, de-reverberation — no model running.</div>
        <div>These are starting points — adjust all effects in the Mixer at any time.</div>
      </div>
    </div>
  );
}

/* ─── Helper components ──────────────────────────────────────── */
function Metric({ label, value, note, warn, approx, unavailable }: {
  label: string; value: string; note: string; warn: boolean; approx?: boolean; unavailable?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 border ${warn ? 'bg-yellow-50 border-yellow-200' : unavailable ? 'bg-gray-50 border-dashed border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide">{label}</span>
        {approx && <span className="text-[9px] text-gray-400">(est.)</span>}
      </div>
      <div className={`text-sm font-bold mt-0.5 ${warn ? 'text-yellow-700' : unavailable ? 'text-gray-400 italic' : 'text-gray-800'}`}>{value}</div>
      <div className={`text-[10px] mt-0.5 ${warn ? 'text-yellow-600' : 'text-gray-400'}`}>{note}</div>
    </div>
  );
}

function SpectralBar({ low, mid, high }: { low: number; mid: number; high: number }) {
  return (
    <div className="space-y-1.5">
      {([['Low (< 500 Hz)', low, 'bg-purple-400'], ['Mid (0.5–4 kHz)', mid, 'bg-violet-500'], ['High (> 4 kHz)', high, 'bg-blue-400']] as const).map(([lbl, pct, cls]) => (
        <div key={lbl} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-28 shrink-0">{lbl}</span>
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }}/>
          </div>
          <span className="text-[10px] text-gray-500 w-7 text-right">{pct}%</span>
        </div>
      ))}
    </div>
  );
}

function SettingRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-violet-700' : 'text-gray-700'}`}>{value}</span>
    </div>
  );
}

function fmtDb(val: number): string {
  if (val === 0) return '0 dB';
  return val > 0 ? `+${val} dB` : `${val} dB`;
}
