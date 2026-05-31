import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import { MicIcon, PlayIcon } from 'lucide-react';
export function SettingsAudio() {
  const [inputDevice, setInputDevice] = useState(
    'Default - MacBook Pro Microphone'
  );
  const [outputDevice, setOutputDevice] = useState(
    'Default - MacBook Pro Speakers'
  );
  const [sampleRate, setSampleRate] = useState('48000 Hz');
  const [bitDepth, setBitDepth] = useState('24-bit');
  const [recordingQuality, setRecordingQuality] = useState('High (WAV)');
  const [exportQuality, setExportQuality] = useState('High (MP3 320kbps)');
  const [noiseReduction, setNoiseReduction] = useState(50);
  const [targetLoudness, setTargetLoudness] = useState('-16 LUFS (Podcasts)');
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Audio Preferences
        </h1>
        <p className="text-sm text-gray-500">
          Configure your audio settings for recording, playback, and monitoring.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Audio Devices */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Audio Devices</h2>
              <p className="text-sm text-gray-500">
                Choose your input and output devices.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Input Device (Microphone)
                </label>
                <select
                  value={inputDevice}
                  onChange={(e) => setInputDevice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>Default - MacBook Pro Microphone</option>
                  <option>External USB Microphone</option>
                  <option>Virtual Audio Cable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Output Device (Playback)
                </label>
                <select
                  value={outputDevice}
                  onChange={(e) => setOutputDevice(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>Default - MacBook Pro Speakers</option>
                  <option>External Headphones</option>
                  <option>Studio Monitors</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Input Level
                </label>
                <div className="flex items-center gap-2">
                  <MicIcon className="w-4 h-4 text-gray-400" />
                  <div className="flex-1 flex gap-1 h-4">
                    {[...Array(20)].map((_, i) =>
                    <div
                      key={i}
                      className="flex-1 bg-gray-200 rounded-sm">
                    </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Test Your Microphone
                </label>
                <button className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                  <PlayIcon className="w-4 h-4" />
                  Start Test
                </button>
              </div>
            </div>
          </div>

          {/* Audio Quality */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Audio Quality</h2>
              <p className="text-sm text-gray-500">
                Set the default quality for recordings and exports.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Sample Rate
                </label>
                <select
                  value={sampleRate}
                  onChange={(e) => setSampleRate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>44100 Hz</option>
                  <option>48000 Hz</option>
                  <option>96000 Hz</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Bit Depth
                </label>
                <select
                  value={bitDepth}
                  onChange={(e) => setBitDepth(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>16-bit</option>
                  <option>24-bit</option>
                  <option>32-bit float</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Default Recording Quality
                </label>
                <select
                  value={recordingQuality}
                  onChange={(e) => setRecordingQuality(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>High (WAV)</option>
                  <option>Medium (FLAC)</option>
                  <option>Standard (MP3)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Default Export Quality
                </label>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>High (MP3 320kbps)</option>
                  <option>Standard (MP3 192kbps)</option>
                  <option>Lossless (WAV)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Monitoring */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Monitoring</h2>
              <p className="text-sm text-gray-500">
                Configure how you monitor audio during recording and playback.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable input monitoring (hear yourself)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Listen to your microphone while recording.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable playback monitoring (hear playback)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Listen to playback audio while recording.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable direct monitoring (zero latency)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Use direct monitoring for reduced latency.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
            </div>
          </div>

          {/* Noise Control */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Noise Control</h2>
              <p className="text-sm text-gray-500">
                Reduce background noise and enhance audio clarity.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable Noise Reduction
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically reduce background noise.
                  </p>
                </div>
                <Toggle defaultChecked={true} />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm font-semibold text-gray-900 w-48">
                  Noise Reduction Strength
                </label>
                <div className="flex-1 relative flex items-center h-6">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={noiseReduction}
                    onChange={(e) =>
                    setNoiseReduction(parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2" />
                  
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {noiseReduction}%
                </span>
              </div>
            </div>
          </div>

          {/* Loudness Normalization */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">
                Loudness Normalization
              </h2>
              <p className="text-sm text-gray-500">
                Normalize audio levels for consistent playback.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable Loudness Normalization
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically normalize audio to a consistent loudness
                    level.
                  </p>
                </div>
                <Toggle defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-900">
                  Target Loudness (LUFS)
                </label>
                <select
                  value={targetLoudness}
                  onChange={(e) => setTargetLoudness(e.target.value)}
                  className="w-48 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>-14 LUFS (Spotify/YouTube)</option>
                  <option>-16 LUFS (Podcasts)</option>
                  <option>-23 LUFS (Broadcast)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </AppLayout>);

}