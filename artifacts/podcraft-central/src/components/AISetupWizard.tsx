import React, { useState, useEffect } from 'react';
import {
  CpuIcon, ZapIcon, LayersIcon, KeyIcon, XCircleIcon,
  ChevronRightIcon, ChevronLeftIcon, CheckCircle2Icon,
  AlertCircleIcon, RefreshCwIcon, EyeIcon, EyeOffIcon,
  SparklesIcon, LoaderIcon,
} from 'lucide-react';
import type { AIProviderMode, ByokProvider } from '../services/ai/types';
import { BYOK_PROVIDER_NAMES, BYOK_PROVIDER_MODELS } from '../services/ai/types';
import { geminiNanoAdapter } from '../services/ai/geminiNanoAdapter';
import { validateByokKey } from '../services/ai/byokProviderAdapter';
import { useAIConfig } from '../store/AIConfigStore';

type Step = 'mode' | 'byok';

interface ModeOption {
  id: AIProviderMode;
  label: string;
  tagline: string;
  detail: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  requiresNano?: boolean;
}

const PROVIDERS = Object.entries(BYOK_PROVIDER_NAMES) as [ByokProvider, string][];

export function AISetupWizard() {
  const { completeSetup } = useAIConfig();

  const [step, setStep] = useState<Step>('mode');
  const [selectedMode, setSelectedMode] = useState<AIProviderMode>('phi3');
  const [nanoStatus, setNanoStatus] = useState<'checking' | 'available' | 'unavailable'>('checking');

  const [byokProvider, setByokProvider] = useState<ByokProvider>('openai');
  const [byokModel, setByokModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validResult, setValidResult] = useState<{ ok: boolean; error?: string } | null>(null);

  useEffect(() => {
    geminiNanoAdapter.checkAvailability().then((avail) => {
      setNanoStatus(avail === 'unavailable' ? 'unavailable' : 'available');
    });
  }, []);

  const MODES: ModeOption[] = [
    {
      id: 'phi3',
      label: 'Phi-3 Mini',
      tagline: 'Built-in Local AI',
      detail: '~2.3 GB download on first use · fully offline · no API key',
      icon: CpuIcon,
      badge: 'Recommended',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      id: 'gemini-nano',
      label: 'Gemini Nano',
      tagline: 'Device AI (Chrome only)',
      detail: nanoStatus === 'checking' ? 'Checking availability…' : nanoStatus === 'available' ? 'Available on this device · instant · no download' : 'Not available on this browser/device',
      icon: ZapIcon,
      badge: nanoStatus === 'checking' ? 'Checking…' : nanoStatus === 'available' ? 'Available' : 'Unavailable',
      badgeColor: nanoStatus === 'available' ? 'bg-green-100 text-green-700' : nanoStatus === 'checking' ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600',
      requiresNano: true,
    },
    {
      id: 'hybrid',
      label: 'Hybrid Mode',
      tagline: 'Phi-3 Mini + Gemini Nano',
      detail: 'Gemini Nano for quick tasks · Phi-3 for complex work',
      icon: LayersIcon,
      badge: nanoStatus === 'available' ? 'Best experience' : 'Needs Gemini Nano',
      badgeColor: nanoStatus === 'available' ? 'bg-violet-100 text-violet-700' : 'bg-amber-50 text-amber-600',
      requiresNano: true,
    },
    {
      id: 'byok',
      label: 'Your API Key',
      tagline: 'Bring Your Own Key',
      detail: 'OpenAI, Anthropic, Groq, Mistral, OpenRouter, Gemini API',
      icon: KeyIcon,
    },
    {
      id: 'none',
      label: 'No AI',
      tagline: 'Continue Without AI',
      detail: 'AI Producer features will be disabled — you can enable later in Settings',
      icon: XCircleIcon,
    },
  ];

  const handleModeNext = () => {
    if (selectedMode === 'byok') {
      setStep('byok');
    } else {
      completeSetup({ mode: selectedMode, setupComplete: true });
    }
  };

  const handleValidate = async () => {
    setValidating(true);
    setValidResult(null);
    const model = byokModel || BYOK_PROVIDER_MODELS[byokProvider][0];
    const result = await validateByokKey(byokProvider, apiKey, model);
    setValidResult(result);
    setValidating(false);
  };

  const handleByokSave = () => {
    if (!validResult?.ok) return;
    completeSetup({
      mode: 'byok',
      byokProvider,
      byokApiKey: apiKey,
      byokModel: byokModel || BYOK_PROVIDER_MODELS[byokProvider][0],
      setupComplete: true,
    });
  };

  const handleSkip = () => {
    completeSetup({ mode: 'none', setupComplete: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-violet-700 px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <SparklesIcon className="w-5 h-5 text-violet-200" />
            <span className="text-xs font-semibold text-violet-200 uppercase tracking-wider">AI Producer Setup</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {step === 'mode' ? 'Choose your AI provider' : `Configure ${BYOK_PROVIDER_NAMES[byokProvider]}`}
          </h1>
          <p className="text-sm text-violet-200 mt-0.5">
            {step === 'mode'
              ? 'AI Producer powers scripting, research, coaching, and mastering suggestions.'
              : 'Enter your API key — it is stored only on your device, never shared.'}
          </p>
        </div>

        <div className="p-6">
          {step === 'mode' && (
            <div className="space-y-2.5">
              {MODES.map((m) => {
                const Icon = m.icon;
                const disabled = m.requiresNano && nanoStatus !== 'available';
                const selected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => !disabled && setSelectedMode(m.id)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? 'border-violet-500 bg-violet-50'
                        : disabled
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${selected ? 'bg-violet-600' : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{m.label}</span>
                        <span className="text-xs text-gray-400">{m.tagline}</span>
                        {m.badge && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{m.detail}</p>
                    </div>
                    {selected && <CheckCircle2Icon className="w-5 h-5 text-violet-600 flex-shrink-0 mt-1" />}
                  </button>
                );
              })}
            </div>
          )}

          {step === 'byok' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Provider</label>
                <select
                  value={byokProvider}
                  onChange={(e) => { setByokProvider(e.target.value as ByokProvider); setByokModel(''); setValidResult(null); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {PROVIDERS.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
                <select
                  value={byokModel}
                  onChange={(e) => { setByokModel(e.target.value); setValidResult(null); }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {BYOK_PROVIDER_MODELS[byokProvider].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => { setApiKey(e.target.value); setValidResult(null); }}
                    placeholder={`Enter your ${BYOK_PROVIDER_NAMES[byokProvider]} API key`}
                    className="w-full pr-10 pl-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Stored locally on your device only. You are responsible for your own usage and billing.
                </p>
              </div>

              <button
                onClick={handleValidate}
                disabled={!apiKey.trim() || validating}
                className="flex items-center gap-2 px-4 py-2 border border-violet-300 text-violet-700 rounded-lg text-sm font-medium hover:bg-violet-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validating ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <RefreshCwIcon className="w-4 h-4" />}
                {validating ? 'Validating…' : 'Validate Key'}
              </button>

              {validResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg text-sm ${validResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {validResult.ok
                    ? <CheckCircle2Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    : <AlertCircleIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <span>{validResult.ok ? 'Key validated successfully.' : validResult.error}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
            Continue without AI
          </button>
          <div className="flex items-center gap-2">
            {step === 'byok' && (
              <button
                onClick={() => setStep('mode')}
                className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <ChevronLeftIcon className="w-4 h-4" /> Back
              </button>
            )}
            {step === 'mode' && (
              <button
                onClick={handleModeNext}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700"
              >
                {selectedMode === 'byok' ? 'Configure Key' : 'Finish Setup'}
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
            {step === 'byok' && (
              <button
                onClick={handleByokSave}
                disabled={!validResult?.ok}
                className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Finish <ChevronRightIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
