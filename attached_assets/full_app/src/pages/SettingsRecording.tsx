import React, { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { SettingsSidebar } from '../components/SettingsSidebar';
import { Toggle } from '../components/Toggle';
import { MicIcon, PlayIcon } from 'lucide-react';
export function SettingsRecording() {
  const [inputDevice, setInputDevice] = useState(
    'Default - MacBook Pro Microphone'
  );
  const [sampleRate, setSampleRate] = useState('48000 Hz');
  const [bitDepth, setBitDepth] = useState('24-bit');
  const [recordingQuality, setRecordingQuality] = useState('High (WAV)');
  const [channels, setChannels] = useState('Stereo');
  const [fileFormat, setFileFormat] = useState('WAV');
  const [namingConvention, setNamingConvention] = useState('Project_Date_Time');
  const [saveLocation, setSaveLocation] = useState(
    '/Users/username/Podify/Recordings'
  );
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Recording Preferences
        </h1>
        <p className="text-sm text-gray-500">
          Configure how your recordings are captured and saved.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <SettingsSidebar />

        <div className="flex-1 max-w-4xl space-y-6">
          {/* Recording Source */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Recording Source</h2>
              <p className="text-sm text-gray-500">
                Select and configure your recording source.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
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
              <div className="flex items-end justify-end">
                <button className="flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 hover:bg-violet-50 rounded-lg text-sm font-medium transition-colors">
                  <PlayIcon className="w-4 h-4" />
                  Start Test
                </button>
              </div>
            </div>
          </div>

          {/* Recording Quality */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">
                Recording Quality
              </h2>
              <p className="text-sm text-gray-500">
                Configure the quality settings for your recordings.
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
                  Recording Quality
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
                  Channels
                </label>
                <select
                  value={channels}
                  onChange={(e) => setChannels(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>Mono</option>
                  <option>Stereo</option>
                </select>
              </div>
            </div>
          </div>

          {/* File Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">File Settings</h2>
              <p className="text-sm text-gray-500">
                Set file format and naming preferences.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  File Format
                </label>
                <select
                  value={fileFormat}
                  onChange={(e) => setFileFormat(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>WAV</option>
                  <option>FLAC</option>
                  <option>MP3</option>
                  <option>AAC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Naming Convention
                </label>
                <select
                  value={namingConvention}
                  onChange={(e) => setNamingConvention(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>Project_Date_Time</option>
                  <option>Date_Project_Track</option>
                  <option>Custom...</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Save Location
                </label>
                <select
                  value={saveLocation}
                  onChange={(e) => setSaveLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none bg-white text-sm text-gray-900">
                  
                  <option>/Users/username/Podify/Recordings</option>
                  <option>/Volumes/ExternalDrive/Podify</option>
                  <option>Choose custom location...</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pre-Recording */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Pre-Recording</h2>
              <p className="text-sm text-gray-500">
                Configure options to prepare before recording.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable Countdown
                  </h3>
                  <p className="text-xs text-gray-500">
                    Show a countdown before recording starts.
                  </p>
                </div>
                <Toggle defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable Auto-normalization
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically normalize audio levels after recording.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable Noise Gate
                  </h3>
                  <p className="text-xs text-gray-500">
                    Reduce background noise during recording.
                  </p>
                </div>
                <Toggle defaultChecked={true} />
              </div>
            </div>
          </div>

          {/* Post-Recording */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row gap-8">
            <div className="w-48 flex-shrink-0">
              <h2 className="font-bold text-gray-900 mb-1">Post-Recording</h2>
              <p className="text-sm text-gray-500">
                Configure options to apply after recording.
              </p>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Enable Automatic Save
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically save the recording when stopped.
                  </p>
                </div>
                <Toggle defaultChecked={true} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    Open in Editor After Recording
                  </h3>
                  <p className="text-xs text-gray-500">
                    Automatically open the recording in the editor.
                  </p>
                </div>
                <Toggle defaultChecked={false} />
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