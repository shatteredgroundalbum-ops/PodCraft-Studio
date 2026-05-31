import React from 'react';
import { AppLayout } from '../components/AppLayout';
import { PodCraftLogo } from '../components/PodCraftLogo';
import { MicIcon, AudioLinesIcon, FolderIcon, CheckCircleIcon, UsersIcon, BarChart3Icon, ShieldIcon, ZapIcon } from 'lucide-react';

export function About() {
  const features = [
    { icon: MicIcon, title: 'Studio Recording', desc: 'Professional recording with the MediaRecorder API and real-time level metering.' },
    { icon: AudioLinesIcon, title: 'AI Mastering', desc: 'Automated mastering with multiple style presets for broadcast-ready audio.' },
    { icon: FolderIcon, title: 'Project Management', desc: 'Organize projects, seasons, and episodes with full lifecycle tracking.' },
    { icon: CheckCircleIcon, title: 'Task Tracking', desc: 'Detailed task management with checklists, comments, and activity logs.' },
    { icon: UsersIcon, title: 'Team Collaboration', desc: 'Role-based team management for podcast production crews.' },
    { icon: BarChart3Icon, title: 'Analytics', desc: 'Track performance and audience insights across all platforms.' },
  ];

  return (
    <AppLayout title="About PodCraft Central">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 to-violet-900 rounded-2xl p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200')] bg-cover bg-center opacity-20" />
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <PodCraftLogo variant="light" size="md" animated />
            </div>
            <p className="text-violet-100 text-lg max-w-md mx-auto">
              The complete podcast production workspace for creators who demand quality.
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">About This App</h2>
          <div className="prose prose-sm text-gray-600 space-y-3">
            <p>
              PodCraft Central is a fully-featured podcast production suite that runs entirely in your browser.
              From planning and recording to editing, mastering, and publishing — everything you need is in one place.
            </p>
            <p>
              All your data is stored locally using IndexedDB. Nothing leaves your device unless you choose to export it.
              This means complete privacy, full control, and offline capability.
            </p>
            <p>
              Built with React, TypeScript, and the Web Audio API, PodCraft Central uses native browser capabilities
              for recording (MediaRecorder API), storage (IndexedDB), and audio processing (Web Audio API).
            </p>
          </div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-5 flex gap-4">
                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldIcon className="w-5 h-5 text-violet-600" />
            <h2 className="text-xl font-bold text-gray-900">Privacy First</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            {[
              'All data stored locally in your browser',
              'No telemetry or tracking',
              'No external API calls for core features',
              'Microphone access only when recording',
              'You control your data completely',
              'Clear data anytime from browser settings',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Version */}
        <div className="text-center text-sm text-gray-400 pb-4">
          PodCraft Central v1.0.0 · Built with React, TypeScript & Web Audio API · May 2026
        </div>
      </div>
    </AppLayout>
  );
}
