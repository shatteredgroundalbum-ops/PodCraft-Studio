import React, { useEffect, useState } from 'react';
import { Mic, Headphones, Home, ChevronRight, Check } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';
import { engine } from '../../utils/studioAudioEngine';

const ROOM_OPTIONS = [
  'Bedroom', 'Bathroom', 'Hallway', 'Living Room', 'Kitchen',
  'Garage', 'Office', 'Warehouse', 'Vehicle', 'Semi-truck', 'Van', 'Other',
];

/* Room → mic EQ offsets applied on the input chain */
const ROOM_EQ: Record<string, { low: number; mid: number; high: number }> = {
  'Bedroom':     { low: -1, mid:  1, high:  0 },
  'Bathroom':    { low:  2, mid: -2, high:  1 },
  'Hallway':     { low:  1, mid: -1, high:  0 },
  'Living Room': { low:  0, mid:  0, high:  0 },
  'Kitchen':     { low: -1, mid:  1, high:  1 },
  'Garage':      { low: -3, mid:  0, high: -1 },
  'Office':      { low: -1, mid:  2, high:  1 },
  'Warehouse':   { low: -4, mid: -1, high: -2 },
  'Vehicle':     { low: -5, mid:  1, high: -2 },
  'Semi-truck':  { low: -6, mid:  1, high: -3 },
  'Van':         { low: -5, mid:  1, high: -2 },
  'Other':       { low:  0, mid:  0, high:  0 },
};

/* Room → initial gain staging */
const ROOM_GAIN: Record<string, number> = {
  'Bedroom': 0.8, 'Bathroom': 0.7, 'Hallway': 0.75, 'Living Room': 0.8,
  'Kitchen': 0.8, 'Garage': 0.75, 'Office': 0.85, 'Warehouse': 0.7,
  'Vehicle': 0.7, 'Semi-truck': 0.65, 'Van': 0.7, 'Other': 0.8,
};

const INTERFACE_OPTIONS = [
  'Built-in / Laptop',
  'Focusrite Scarlett Solo',
  'Focusrite Scarlett 2i2',
  'Focusrite Scarlett 4i4',
  'SSL 2',
  'SSL 2+',
  'MOTU M2',
  'Universal Audio Volt 1',
  'Universal Audio Volt 176',
  'PreSonus AudioBox USB 96',
  'Behringer U-Phoria UM2',
  'Audient iD4',
  'RØDECaster Pro II',
  'Zoom PodTrak P4',
  'Custom',
];

const COMMON_MICS = [
  'System Default',
  'Shure SM7B',
  'Rode PodMic',
  'Rode NT-USB',
  'Audio-Technica AT2020',
  'Blue Yeti',
  'Blue Yeti X',
  'Elgato Wave 3',
  'HyperX QuadCast',
  'Sony ZV-1 (built-in)',
  'Laptop Built-in',
  'Custom',
];

const HEADPHONE_OPTIONS = [
  'System Default / Speakers',
  'Sony MDR-7506',
  'Audio-Technica ATH-M50x',
  'Beyerdynamic DT 770 Pro',
  'Sennheiser HD 280 Pro',
  'AKG K240',
  'Shure SRH840',
  'AirPods / Wireless',
  'Custom',
];

type Step = 'interface' | 'mic' | 'headphones' | 'room';
const STEPS: Step[] = ['interface', 'mic', 'headphones', 'room'];

export function AudioSetupModal() {
  const { setAudioSetupDone, inputDevices, setSelectedInputId } = useStudio();
  const [step, setStep] = useState<Step>('interface');
  const [iface, setIface]  = useState('Built-in / Laptop');
  const [mic,   setMic]    = useState('System Default');
  const [phones,setPhones] = useState('System Default / Speakers');
  const [room,  setRoom]   = useState('');

  useEffect(() => { engine.init(); }, []);

  const stepIdx  = STEPS.indexOf(step);
  const isLast   = step === 'room';

  const handleNext = () => {
    if (!isLast) {
      setStep(STEPS[stepIdx + 1]);
      return;
    }
    handleFinish();
  };

  const handleFinish = () => {
    /* Apply selected mic device */
    if (inputDevices.length > 0) {
      const chosen = inputDevices[0];
      setSelectedInputId(chosen.deviceId);
    }
    /* Apply room EQ to mic input chain */
    const selectedRoom = room || 'Other';
    const eq = ROOM_EQ[selectedRoom] ?? { low: 0, mid: 0, high: 0 };
    const gain = ROOM_GAIN[selectedRoom] ?? 0.8;
    engine.init();
    engine.setInputGain(gain);
    engine.setMicEQ('low',  eq.low);
    engine.setMicEQ('mid',  eq.mid);
    engine.setMicEQ('high', eq.high);
    setAudioSetupDone(true);
  };

  const canNext = step === 'interface' ? !!iface
    : step === 'mic'        ? !!mic
    : step === 'headphones' ? !!phones
    : !!room;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[480px] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
          <h2 className="text-lg font-bold text-white">Audio Setup</h2>
          <p className="text-violet-200 text-sm mt-0.5">Configure your recording environment before you start.</p>
          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${i <= stepIdx ? 'bg-white' : 'bg-white/30'}`}/>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex-1">

          {step === 'interface' && (
            <StepSelect
              icon={<div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center"><span className="text-violet-600 text-base">🎛</span></div>}
              title="Audio Interface"
              description="Select the audio interface connected to your microphone."
              options={INTERFACE_OPTIONS}
              value={iface}
              onChange={setIface}/>
          )}

          {step === 'mic' && (
            <StepSelect
              icon={<div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center"><Mic className="w-4 h-4 text-red-600"/></div>}
              title="Microphone"
              description="Select your microphone model for accurate gain staging defaults."
              options={COMMON_MICS}
              value={mic}
              onChange={setMic}/>
          )}

          {step === 'headphones' && (
            <StepSelect
              icon={<div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Headphones className="w-4 h-4 text-blue-600"/></div>}
              title="Monitoring / Headphones"
              description="Select your headphones or monitoring output device."
              options={HEADPHONE_OPTIONS}
              value={phones}
              onChange={setPhones}/>
          )}

          {step === 'room' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><Home className="w-4 h-4 text-green-600"/></div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Recording Environment</div>
                  <div className="text-xs text-gray-500">Select your room type — this sets initial EQ and gain staging.</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ROOM_OPTIONS.map(r => (
                  <button key={r} onClick={() => setRoom(r)}
                    className={`px-3 py-2.5 rounded-xl border text-sm text-center transition-all font-medium ${
                      room === r
                        ? 'border-violet-500 bg-violet-50 text-violet-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Step {stepIdx + 1} of {STEPS.length}
          </div>
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button onClick={() => setStep(STEPS[stepIdx - 1])}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200">
                Back
              </button>
            )}
            <button onClick={() => setAudioSetupDone(true)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
              Skip
            </button>
            <button onClick={handleNext} disabled={!canNext}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
              {isLast ? <><Check className="w-4 h-4"/> Finish</> : <>Next <ChevronRight className="w-4 h-4"/></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepSelect({ icon, title, description, options, value, onChange }: {
  icon: React.ReactNode; title: string; description: string;
  options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <div>
          <div className="font-semibold text-gray-900 text-sm">{title}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm text-gray-800 focus:outline-none focus:border-violet-400 bg-white">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="mt-2 text-[11px] text-gray-400">
        {title === 'Audio Interface' && 'This sets initial routing and gain defaults.'}
        {title === 'Microphone' && 'This influences gain staging recommendations.'}
        {title === 'Monitoring / Headphones' && 'This sets your monitor output preference.'}
      </div>
    </div>
  );
}
