// ─── Media Provider Settings Panel ───────────────────────────────────────────
// Full provider configuration UI. Lives under Settings → Media Providers.
//
// Features:
// - Provider cards grouped by category (Voice, Sound Effects, Music)
// - API key entry (masked), validation, removal
// - Gateway warning labels for third-party integrations
// - Default provider selection per category
// - Required user warnings about costs, rights, and local-only key storage

import React, { useState } from 'react';
import {
  MicIcon, MusicIcon, ZapIcon, KeyIcon, CheckCircle2Icon, XCircleIcon,
  AlertTriangleIcon, ExternalLinkIcon, RefreshCwIcon, LoaderIcon,
  ShieldIcon, InfoIcon, EyeIcon, EyeOffIcon, TrashIcon, StarIcon,
  RadioIcon, WifiIcon, WifiOffIcon,
} from 'lucide-react';
import { useMediaProviders, PROVIDER_REGISTRY } from '../store/MediaProviderStore';
import type { MediaProviderConfig, MediaProviderCategory } from '../services/media/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<MediaProviderCategory, string> = {
  'voice': 'Voice & Narration',
  'sound-effects': 'Sound Effects',
  'music': 'Music Generation',
  'transcription': 'Transcription',
  'audio-cleanup': 'Audio Cleanup',
};

const CATEGORY_ICONS: Record<MediaProviderCategory, React.ElementType> = {
  'voice': MicIcon,
  'sound-effects': ZapIcon,
  'music': MusicIcon,
  'transcription': RadioIcon,
  'audio-cleanup': WifiIcon,
};

const STATUS_COLORS: Record<string, string> = {
  'connected': 'text-green-600',
  'error': 'text-red-600',
  'validating': 'text-amber-600',
  'rate-limited': 'text-amber-600',
  'insufficient-credits': 'text-orange-600',
  'not-configured': 'text-gray-400',
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  'connected': CheckCircle2Icon,
  'error': XCircleIcon,
  'validating': LoaderIcon,
  'rate-limited': AlertTriangleIcon,
  'insufficient-credits': AlertTriangleIcon,
  'not-configured': WifiOffIcon,
};

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
  meta,
  config,
  onSave,
  onRemove,
  onValidate,
  onSetDefault,
}: {
  meta: typeof PROVIDER_REGISTRY[number];
  config: MediaProviderConfig | undefined;
  onSave: (c: MediaProviderConfig) => void;
  onRemove: (id: string) => void;
  onValidate: (id: string) => Promise<{ ok: boolean; message: string }>;
  onSetDefault: (id: string, category: MediaProviderCategory) => void;
}) {
  const [apiKey, setApiKey] = useState(config?.apiKey ?? '');
  const [endpointUrl, setEndpointUrl] = useState(config?.endpointBaseUrl ?? '');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  const isConfigured = !!config?.apiKey;
  const isConnected = config?.status === 'connected';
  const isDefault = config?.defaultFor?.includes(meta.category);
  const StatusIcon = STATUS_ICONS[config?.status ?? 'not-configured'];
  const statusColor = STATUS_COLORS[config?.status ?? 'not-configured'];

  async function handleValidate() {
    if (!apiKey.trim()) return;
    setValidating(true);
    setValidationMsg('');
    const merged: MediaProviderConfig = {
      ...(config ?? {
        id: meta.id,
        name: meta.name,
        category: meta.category,
        isThirdPartyGateway: meta.isThirdPartyGateway,
        isOfficialApi: meta.isOfficialApi,
        termsUrl: meta.termsUrl,
        pricingUrl: meta.pricingUrl,
        status: 'not-configured',
        updatedAt: new Date().toISOString(),
      }),
      apiKey: apiKey.trim(),
      endpointBaseUrl: endpointUrl.trim() || undefined,
    };
    onSave(merged);
    const result = await onValidate(meta.id);
    setValidationMsg(result.message);
    setValidating(false);
  }

  function handleSaveKey() {
    if (!apiKey.trim()) return;
    const merged: MediaProviderConfig = {
      ...(config ?? {
        id: meta.id,
        name: meta.name,
        category: meta.category,
        isThirdPartyGateway: meta.isThirdPartyGateway,
        isOfficialApi: meta.isOfficialApi,
        termsUrl: meta.termsUrl,
        pricingUrl: meta.pricingUrl,
        status: 'not-configured',
        updatedAt: new Date().toISOString(),
      }),
      apiKey: apiKey.trim(),
      endpointBaseUrl: endpointUrl.trim() || undefined,
    };
    onSave(merged);
  }

  return (
    <div className={`border rounded-xl p-4 bg-white ${isConnected ? 'border-green-200' : isConfigured ? 'border-amber-200' : 'border-gray-200'}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">{meta.name}</span>
          {meta.isThirdPartyGateway && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">
              <AlertTriangleIcon className="w-2.5 h-2.5" />
              3rd-Party Gateway
            </span>
          )}
          {meta.isOfficialApi && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wide">
              <ShieldIcon className="w-2.5 h-2.5" />
              Official API
            </span>
          )}
          {isDefault && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 uppercase tracking-wide">
              <StarIcon className="w-2.5 h-2.5" />
              Default
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${statusColor}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config?.status === 'validating' ? 'animate-spin' : ''}`} />
          {config?.status === 'connected' ? 'Connected' :
           config?.status === 'error' ? 'Error' :
           config?.status === 'validating' ? 'Checking…' :
           config?.status === 'rate-limited' ? 'Rate limited' :
           config?.status === 'insufficient-credits' ? 'Low credits' :
           'Not configured'}
        </div>
      </div>

      {/* Third-party gateway warning */}
      {meta.isThirdPartyGateway && (
        <div className="flex items-start gap-2 p-2.5 mb-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            This is a <strong>third-party gateway</strong> — not an official provider API.
            Not affiliated with the original AI music service. Billing goes to your {meta.name} account.
            Commercial rights depend on the gateway's plan. Verify before publishing.
          </span>
        </div>
      )}

      {/* Status message */}
      {config?.statusMessage && config.status !== 'not-configured' && (
        <p className={`text-xs mb-3 ${statusColor}`}>{config.statusMessage}</p>
      )}

      {/* API Key input */}
      {meta.id !== 'manual' && (
        <div className="space-y-2 mb-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={`${meta.name} API key`}
              className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              aria-label={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
            </button>
          </div>
          {/* Custom endpoint for gateway providers */}
          {meta.isThirdPartyGateway && (
            <input
              type="text"
              value={endpointUrl}
              onChange={e => setEndpointUrl(e.target.value)}
              placeholder={`Custom endpoint URL (optional — uses default)`}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <ShieldIcon className="w-3 h-3" />
            API key stored on this device only — never sent to PodCraft servers.
          </p>
        </div>
      )}

      {/* Manual provider info */}
      {meta.id === 'manual' && (
        <div className="flex items-start gap-2 p-2.5 mb-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600">
          <InfoIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          No API key required. AI Producer generates the prompt. You generate audio manually at the provider's website and import it here.
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {meta.id !== 'manual' && (
          <>
            <button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save Key
            </button>
            <button
              onClick={handleValidate}
              disabled={!apiKey.trim() || validating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {validating
                ? <><LoaderIcon className="w-3 h-3 animate-spin" /> Checking…</>
                : <><RefreshCwIcon className="w-3 h-3" /> Validate</>
              }
            </button>
          </>
        )}
        {isConnected && !isDefault && (
          <button
            onClick={() => onSetDefault(meta.id, meta.category)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
          >
            <StarIcon className="w-3 h-3" /> Set as Default
          </button>
        )}
        {isConfigured && meta.id !== 'manual' && (
          <button
            onClick={() => { setApiKey(''); onRemove(meta.id); }}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 ml-auto"
          >
            <TrashIcon className="w-3 h-3" /> Remove Key
          </button>
        )}
        {meta.termsUrl && (
          <a href={meta.termsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600 ml-auto">
            <ExternalLinkIcon className="w-3 h-3" /> Terms
          </a>
        )}
        {meta.pricingUrl && (
          <a href={meta.pricingUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-600">
            <ExternalLinkIcon className="w-3 h-3" /> Pricing
          </a>
        )}
      </div>

      {/* Validation result */}
      {validationMsg && (
        <p className={`text-xs mt-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>{validationMsg}</p>
      )}
    </div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ category }: { category: MediaProviderCategory }) {
  const { configs, saveConfig, removeConfig, validateProvider } = useMediaProviders();
  const Icon = CATEGORY_ICONS[category];
  const providers = PROVIDER_REGISTRY.filter(p => p.category === category);

  async function handleSetDefault(id: string, cat: MediaProviderCategory) {
    const existing = configs.find(c => c.id === id);
    if (!existing) return;
    await saveConfig({ ...existing, defaultFor: [cat] });
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-violet-600" />
        <h3 className="text-sm font-semibold text-gray-900">{CATEGORY_LABELS[category]}</h3>
      </div>
      <div className="space-y-3">
        {providers.map(meta => (
          <ProviderCard
            key={meta.id}
            meta={meta}
            config={configs.find(c => c.id === meta.id)}
            onSave={saveConfig}
            onRemove={removeConfig}
            onValidate={validateProvider}
            onSetDefault={handleSetDefault}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Settings Panel ──────────────────────────────────────────────────────

export function MediaProviderSettings() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Media Providers</h2>
      <p className="text-sm text-gray-500 mb-5">
        Configure external AI providers for voice, sound effects, and music generation.
        All media generation in AI Producer flows through these providers.
      </p>

      {/* Required warnings */}
      <div className="space-y-2 mb-7">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p><strong>External provider costs are your responsibility.</strong> PodCraft Central is not responsible for third-party API charges or billing.</p>
            <p><strong>API keys are stored on this device only.</strong> Keys never leave your browser.</p>
            <p><strong>Commercial rights depend on your provider plan.</strong> Verify rights before publishing any generated media.</p>
            <p><strong>Generated assets must be reviewed before final use.</strong> Rights are marked unconfirmed until you explicitly approve each asset.</p>
          </div>
        </div>
      </div>

      <CategorySection category="voice" />
      <CategorySection category="sound-effects" />
      <CategorySection category="music" />
    </div>
  );
}
