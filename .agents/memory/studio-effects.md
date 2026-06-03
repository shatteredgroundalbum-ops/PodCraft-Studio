---
name: Studio effects wiring
description: How Noise Gate and Limiter are implemented in the Digital Mixer effects pads
---

## Rule
All 6 effects pads in StudioMixer are functional. Gate and Limiter use Web Audio primitives — NOT openDAW EffectFactory (which requires the internal Project graph and crossOriginIsolated).

## Noise Gate
- A `gateGain: GainNode` sits between `inputAnalyser` and `micEQ` in the mic chain (wired in `requestInput()`)
- `setNoiseGateEnabled(enabled, thresholdDb=-40)` starts/stops a RAF loop that reads `inputAnalyser` RMS and sets `gateGain.gain` (0 or 1, with 10ms smooth ramp)
- Same pattern as the Ducking effect

## Limiter
- A `masterLimiter: DynamicsCompressorNode` sits between `masterCompressor` and `masterAnalyser` (wired in `init()`)
- `setLimiterEnabled(enabled)` sets ratio=20, threshold=-1dBFS for limiting; ratio=1, threshold=0dBFS for bypass
- Chain: masterGain → masterCompressor → masterLimiter → masterAnalyser → destination

## openDAW effects
- `EffectFactories.Gate` and `EffectFactories.Maximizer` from `@opendaw/studio-core` exist but require `Project.primaryAudioUnitBoxAdapter.audioEffectsField` and `ProjectApi.insertEffect()` — only usable when openDAW is fully initialized (crossOriginIsolated required)
- `AudioUnitBoxAdapter.audioEffectsField: Field<Pointers.AudioEffectHost>` is the correct field to pass to `insertEffect`

**Why:** openDAW effects need the internal project graph; our mixer uses a standalone Web Audio chain. Full migration would require routing mic input through openDAW's project routing.
