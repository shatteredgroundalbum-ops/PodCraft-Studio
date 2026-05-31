---
name: OpenDAW integration
description: How the OpenDAW headless engine is wired into the PodCraft Studio page — architecture, gotchas, and initialization flow.
---

## Architecture

Service layer in `src/services/daw/`:
- `types.ts` — EngineStatus union, DawState interface
- `openDawEngine.ts` — module-level singleton; async init, observable subscriptions, MeterWorklet metering
- `index.ts` — barrel re-export

React hook in `src/hooks/useOpenDAW.ts` — subscribes to singleton state, exposes transport/recording/meter controls.

Studio.tsx consumes the hook and branches on `engineReady = daw.status === 'ready'` for metering and devices; always falls back to native Web Audio / navigator.mediaDevices when engine is not ready.

## Cross-origin isolation (critical)

The OpenDAW engine hard-asserts `crossOriginIsolated === true` at init time.

Fix: `vite-plugin-cross-origin-isolation` added to `vite.config.ts` plugins — sends:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
on every dev server response. Confirmed working via curl. Version pinned at `^0.1.6`.

**Why:** Without these headers `window.crossOriginIsolated` is `false` and Workers.install() will throw. The engine silently degrades to `status: 'unsupported'` and Studio falls back to native recording.

**How to apply:** Any new Vite artifact that uses OpenDAW must add this same plugin to its config.

## Worker / Worklet URL imports

Vite static imports at top of `openDawEngine.ts`:
```ts
import WorkersUrl from "@opendaw/studio-core/workers-main.js?worker&url";
import WorkletsUrl from "@opendaw/studio-core/processors.js?url";
```
Both paths are confirmed exports of `@opendaw/studio-core`. Must stay at module top level (Vite static analysis requirement).

## Package versions in use

- `@opendaw/studio-sdk@0.0.150` (the SDK itself only exports `OPENDAW_SDK_VERSION`)
- `@opendaw/studio-core@0.0.148` — actual engine, Project, Workers, AudioWorklets, AudioDevices, MeterWorklet
- `@opendaw/lib-dsp@0.0.84` — PPQN constants (`PPQN.Quarter = 960`, `PPQN.secondsToPulses(s, bpm)`)
- `vite-plugin-cross-origin-isolation@0.1.6`

## Key API notes

- `ObservableValue.subscribe(obs => obs.getValue())` — observer receives the ObservableValue, not raw T
- `ObservableValue.catchupAndSubscribe(obs => obs.getValue())` — fires immediately with current value
- `MeterWorklet.subscribe(({ peak, rms }) => ...)` — Observer<PeakSchema> fires directly (not observable pattern)
- `Project.new(env: ProjectEnv)` — env requires: audioContext, audioWorklets, sampleManager, soundfontManager, sampleService, soundfontService
- `SampleService(audioContext)` and `SoundfontService()` are instantiatable directly
- `engine.stop(reset?: boolean)` — `stop(true)` resets position, `stop(false)` pauses

## Transport layout fix

Changed Studio.tsx transport bar from `flex items-center gap-8` to `grid grid-cols-3 items-center gap-4` so meter (left), transport buttons (center), and save actions (right) are always perfectly centered regardless of column content widths.
