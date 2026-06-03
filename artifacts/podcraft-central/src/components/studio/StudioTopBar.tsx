import React, { useState } from 'react';
import { HelpCircle, Bell, ChevronDown, Check, Sliders } from 'lucide-react';
import { useStudio } from '../../store/StudioContext';

export function StudioTopBar() {
  const {
    isRecording, playheadPosition,
    inputDevices, selectedInputId, setSelectedInputId,
    mixerOpen, setMixerOpen,
  } = useStudio();
  const [bpm, setBpm] = useState('120');
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(ms).padStart(2, '0')}`;
  };

  const selectedDevice = inputDevices.find((d) => d.deviceId === selectedInputId);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-8">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wider ${
          isRecording ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-violet-500'}`} />
          {isRecording ? 'RECORDING' : 'ON AIR'}
        </div>

        <div className="flex flex-col relative">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Device</span>
          <button
            className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-violet-600"
            onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}>
            {selectedDevice
              ? selectedDevice.label.replace(/\(.*\)/, '').trim() || 'Default Mic'
              : 'No Device'}
            <Check className="w-4 h-4 text-green-500" />
          </button>
          {deviceDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              {inputDevices.map((device) => (
                <button
                  key={device.deviceId}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                  onClick={() => { setSelectedInputId(device.deviceId); setDeviceDropdownOpen(false); }}>
                  <span className="truncate pr-4">
                    {device.label || `Microphone ${device.deviceId.substr(0, 5)}`}
                  </span>
                  {device.deviceId === selectedInputId && <Check className="w-4 h-4 text-violet-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Timer</span>
          <span className="text-sm font-mono font-semibold text-gray-900">{formatTime(playheadPosition)}</span>
        </div>

        <div className="w-px h-8 bg-gray-200" />

        <div className="flex flex-col">
          <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-0.5">Session</span>
          <span className="text-sm font-semibold text-gray-900">New Recording</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-violet-600 bg-violet-50 px-3 py-1.5 rounded-lg">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <input
            type="text"
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className="bg-transparent w-10 text-sm font-bold focus:outline-none" />
          <span className="text-sm font-bold">BPM</span>
        </div>

        <button
          onClick={() => setMixerOpen(!mixerOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            mixerOpen ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}>
          <Sliders className="w-4 h-4" /> Mixer
        </button>

        <div className="flex items-center gap-3">
          <button className="text-gray-400 hover:text-gray-600"><HelpCircle className="w-5 h-5" /></button>
          <button className="text-gray-400 hover:text-gray-600 relative">
            <Bell className="w-5 h-5" />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button className="flex items-center gap-2 bg-violet-100 text-violet-700 pl-3 pr-2 py-1.5 rounded-full hover:bg-violet-200 transition-colors">
            <span className="text-sm font-bold">PC</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
