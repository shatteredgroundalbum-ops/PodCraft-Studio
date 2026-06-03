import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, Cloud, Sparkles, X } from 'lucide-react';
import { useAIConfig } from '../store/AIConfigStore';

export function AISetupWizard() {
  const { completeSetup } = useAIConfig();
  const navigate = useNavigate();

  const go = (tab?: string) => {
    completeSetup({ mode: 'none', setupComplete: true });
    if (tab) navigate(`/ai-settings?tab=${tab}`);
  };

  const choices = [
    {
      icon: Cpu,
      label: 'Configure Local AI',
      desc: 'Download and run AI models directly on your device — no API key, fully private.',
      tab: 'llm',
      color: 'violet',
    },
    {
      icon: Cloud,
      label: 'Configure Cloud AI',
      desc: 'Connect OpenAI, Anthropic, Google, Groq, and 9 more providers with your own API key.',
      tab: 'cloud',
      color: 'blue',
    },
    {
      icon: Sparkles,
      label: 'Build Recommended Pipeline',
      desc: 'Let the app recommend which AI should power each feature based on your device and preferences.',
      tab: 'pipeline',
      color: 'purple',
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-violet-200" />
                <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">AI Setup</span>
              </div>
              <h1 className="text-xl font-bold text-white">Configure AI for PodCraft</h1>
              <p className="text-sm text-violet-200 mt-0.5">
                Each app module can use its own AI model. Set up now or skip and configure later.
              </p>
            </div>
            <button onClick={() => go()} className="text-violet-300 hover:text-white transition-colors flex-shrink-0 ml-3 mt-0.5">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-2.5">
          {choices.map(({ icon: Icon, label, desc, tab, color }) => (
            <button
              key={tab}
              onClick={() => go(tab)}
              className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-violet-300 hover:bg-violet-50/50 text-left transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                color === 'violet' ? 'bg-violet-100' : color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
              } group-hover:bg-violet-200 transition-colors`}>
                <Icon className={`w-5 h-5 ${
                  color === 'violet' ? 'text-violet-600' : color === 'blue' ? 'text-blue-600' : 'text-purple-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{label}</div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <X className="w-4 h-4 text-gray-300 rotate-45 flex-shrink-0 mt-1 group-hover:text-violet-400 transition-colors" />
            </button>
          ))}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={() => go()}
            className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
          >
            Skip For Now — configure later from User Menu → AI
          </button>
        </div>
      </div>
    </div>
  );
}
