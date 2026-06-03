---
name: AI Model Selection System
description: Architecture and key decisions for the Local AI + Cloud AI selection system in the Studio
---

## Overview
A real (no fakes) AI model selection system layered on top of the existing StudioAIPanel.

## Files
- `src/utils/localAI.ts` — Transformers.js v4 wrapper: model catalog, checkWebGPU, checkStorage, loadLocalModel, localInfer, deleteLocalModel, formatBytes
- `src/utils/cloudAI.ts` — Cloud inference + real API key validation for OpenAI/Anthropic/Gemini/Ollama
- `src/store/AIModelStore.tsx` — AIModelProvider context; `activateLocal`, `activateCloud`, `deactivate`, `sendMessage`, `isActive`
- `src/components/ai/LocalAIPanel.tsx` — slide-out panel, model list by category, real download/load/delete
- `src/components/ai/CloudAIPanel.tsx` — slide-out panel, provider tabs, real API validation, key storage
- `src/components/ai/AIModelSelector.tsx` — dropdown button in AI panel header, opens either slide-out panel

## Key decisions

**Why AIModelStore context (not prop-drilling):**
Panels (LocalAIPanel, CloudAIPanel) call `activateLocal`/`activateCloud` with a real `inferFn` closure.
StudioAIPanel reads `sendMessage` from context. No direct coupling.

**Why Transformers.js (not WebLLM):**
`@huggingface/transformers` v4.2.0 was already installed. COOP/COEP headers already present via vite-plugin-cross-origin-isolation.

**Local model install tracking:**
localStorage key `podcraft_local_ai_installed_v2` (array of model IDs). Set on successful `loadLocalModel`, cleared on delete. Cache deletion via Cache API is best-effort.

**Cloud key storage:**
`podcraft_cloud_key_{providerId}` in localStorage. Session-persistent, not encrypted. UI clearly warns the user.

**Status rules (enforced in code):**
- Local: `ready` ONLY after `loadLocalModel()` pipeline resolves successfully
- Cloud: `connected` ONLY after `validateProvider()` returns `ok: true` from a real HTTP call
- No status is set optimistically

**AIModelProvider placement:**
Wraps `<StudioPage>` inside `<StudioProvider>` in `Studio.tsx`. Not app-wide (AI is Studio-only for now).

**How to add to app-wide AI:**
Move `<AIModelProvider>` to `src/App.tsx` or `src/main.tsx`.
