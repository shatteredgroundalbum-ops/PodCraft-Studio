---
name: Multi-AI Provider Architecture
description: Multi-provider + multi-module AI assignment system — 13 providers, 10 modules, per-module routing
---

## Overview
A real multi-provider, multi-module AI system. Multiple providers can be connected simultaneously. Each AI module (AI Producer, Script Writer, Pipeline, etc.) gets an independent assignment. No cross-over unless explicitly configured.

## Files
- `src/utils/multiAI.ts` — 13 provider defs + curated model lists + inference functions + validation
- `src/utils/localAI.ts` — Transformers.js v4 utilities (unchanged)
- `src/store/AIModelStore.tsx` — multi-provider + multi-module state; localStorage persistence; `sendMessage(moduleId, history)`
- `src/components/ai/AISetupPanel.tsx` — unified 3-tab panel: LOCAL AI | CLOUD AI | ASSIGNMENTS
- `src/components/ai/AIModelSelector.tsx` — button that opens AISetupPanel
- `src/components/ai/LocalAIPanel.tsx` — standalone local AI panel (standalone; no longer opened by AIModelSelector)

## Architecture

### Store: AIModelStore.tsx
- `providerStates: Record<string, ProviderState>` — cloud provider connection states (persisted to localStorage)
- `assignments: Record<string, ModuleAssignment | null>` — per-module AI assignments (persisted to localStorage)
- `loadedLocalModelIds: string[]` — IDs of pipelines in the module-level `pipelineRegistry`
- Module-level `pipelineRegistry: Record<string, {pipeline, modelName}>` — non-React, not in state

### LocalStorage keys
- `podcraft_provider_key_${id}` — API key per provider
- `podcraft_provider_extra_${id}` — JSON extra config (ollamaUrl, customUrl, etc.)
- `podcraft_connected_providers_v2` — JSON array of connected provider IDs
- `podcraft_ai_assignments_v2` — JSON map of module assignments

### AI Modules (10)
ai-producer, script-writer, pipeline, storyboard, audio-assistant, metadata-generator, transcript, search-research, chat, global-default

### Provider list (13)
openai, anthropic, google, bedrock (unsupported—AWS Sig V4), together, groq, fireworks, openrouter, cohere, mistral, deepseek, xai, ollama, custom

### Inference routing
`sendMessage(moduleId, history)`:
1. Look up `assignments[moduleId]` → fall back to `assignments['global-default']`
2. If `assignment.isLocal`: find pipeline in `pipelineRegistry[modelId]`; call `localInfer(pipeline, messages)`
3. If cloud: find `PROVIDER_DEFS` entry; get `apiKey` from `providerStatesRef.current`; call `callProviderInference(def, modelId, key, messages, extra)`
4. Prepends module-specific system prompt from `MODULE_SYSTEM_PROMPTS[moduleId]`

### Inference categories
- `openai-compatible`: OpenAI, Together, Groq, Fireworks, OpenRouter, Cohere (compat API), Mistral, DeepSeek, xAI, Ollama, Custom — all use same function with different base URL
- `anthropic`: Anthropic — uses `/v1/messages` with x-api-key + anthropic-dangerous-direct-browser-access
- `gemini`: Google — uses `/v1beta/models/{model}:generateContent?key=...`
- `unsupported`: Amazon Bedrock — shows "Proxy Required", cannot connect from browser

## Validation
`validateProviderConnection(def, apiKey, extra)` → makes real HTTP call to provider's models endpoint.
Status: `connected` ONLY after real 200 response. `invalid-key` on 401/403. `connection-failed` on network error. Never faked.

## UI flow
1. Click **AI Setup** button in any panel → opens AISetupPanel overlay
2. **CLOUD AI tab**: 13 expandable accordion sections → Enter API key → Connect → Validation call → If connected, see model list with Assign buttons → Click Assign → pick module from popover
3. **LOCAL AI tab**: Download/load local models (Transformers.js) → "Assign" button → pick module
4. **ASSIGNMENTS tab**: All 10 modules listed → dropdown per module shows connected providers+models → select → saved immediately

## Key decisions

**Why module-level pipelineRegistry (not React state)?**
Local AI pipelines are non-serializable objects. Storing them in React state causes re-render issues and can't be persisted. Module-level map is stable and fast.

**Why fall back to global-default?**
Unassigned modules still work without requiring every module to be configured. Power users can assign granularly; casual users just configure global-default.

**How to add a new module:**
Add entry to `AI_MODULES` in `AIModelStore.tsx` and a system prompt to `MODULE_SYSTEM_PROMPTS` in `multiAI.ts`.

**How to add a new provider:**
Add entry to `PROVIDER_DEFS` in `multiAI.ts`. If it's OpenAI-compatible, set `inferenceCategory: 'openai-compatible'` — no inference code needed. If new format, add a new inference function and a case in `callProviderInference`.

**StudioAIPanel uses moduleId 'ai-producer':**
`ai.sendMessage('ai-producer', history)` routes to the AI Producer assignment or falls back to global-default.
