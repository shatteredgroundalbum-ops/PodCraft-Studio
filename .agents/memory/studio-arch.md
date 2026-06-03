---
name: Studio mixer architecture
description: Dock/float mode, engine routing, available vs unavailable effects, preset system, AudioSetupModal
---

## Dock / Float

- `mixerDocked` in StudioContext (not persisted — resets to `true` on load)
- `UD` button on mixer title bar = undock; `D` = dock
- When **docked**: `<StudioMixer/>` renders as a block inside `Studio.tsx`'s center column (no position:fixed). Outer container is `overflow-x-auto` so 1080px content scrolls horizontally.
- When **floating**: `position:fixed` at pos.x/pos.y, draggable via header, minimize button active.
- Script panel: fixed height (`scriptHeight`, resizable) when docked; flexible height when floating.

## Engine (studioAudioEngine.ts) — confirmed real routing

| What | Node | API |
|---|---|---|
| Input trim | GainNode (inputGainNode) | `setInputGain(v)` |
| Mic fader | GainNode (micGain) | `setMicFaderVolume(v)` |
| Mic EQ | BiquadFilterNode ×3 (micEQ) | `setMicEQ(band, db)` |
| Mic pan | StereoPannerNode | `setMicPan(v)` |
| Per-track EQ | BiquadFilterNode ×3 per track (trackEQs Map) | `setTrackEQ(id, band, db)` |
| Per-track compressor | DynamicsCompressorNode per track (trackCompressors Map) | `setTrackCompressor(id, enabled, threshold, ratio)` |
| Master compressor | DynamicsCompressorNode (masterCompressor) | `setCompressor(enabled)` |
| Reverb | ConvolverNode, synthetic exponential IR | `setReverbEnabled(bool)` — send gain 0→1 |
| Delay | DelayNode 120ms | `setDelayEnabled(bool)` — send gain 0→0.45 |
| Music Bed bus | gain → EQ → panner → analyser → master | `setMusicBusVolume/Pan/EQ()` |
| SFX bus | gain → EQ → panner → analyser → master | `setSfxBusVolume/Pan/EQ()` |
| Monitor | GainNode tap from master | `setMonitorVolume(v)` |
| Ducking | RAF loop reading inputAnalyser RMS | JS only, no special node |

## Effects pads — availability truth table

| Effect | Available | Why |
|---|---|---|
| Reverb | ✓ | ConvolverNode |
| Delay | ✓ | DelayNode |
| Compressor | ✓ | DynamicsCompressorNode on master |
| Noise Gate | ✗ | Requires AudioWorklet — not available in standard Web Audio |
| Ducking | ✓ | RAF RMS detection loop |
| Limiter | ✗ | No native LimiterNode; requires AudioWorklet |

## Track strip rules

- Only `type === 'mic'` tracks appear in the scrollable track strip.
- Music Bed / SFX are **static bus strips** only — pad bank routes through them.
- Default tracks on load: **empty** (`[]`) — user adds first track via "Add Track" button.
- Track types available in Add Track modal: Host, Interview, Guest, Voiceover, Custom (all `'mic'` type).

## Preset system

- `TRACK_PRESETS` exported from `StudioContext.tsx` — Record of preset name → `{gain, eq{low,mid,high}, compressor{enabled,threshold,ratio}}`.
- `applyTrackPreset(trackId, presetName)` calls `engine.setTrackEQ()` + `engine.setTrackCompressor()` + `updateTrack({volume, preset})`.
- Preset dropdown renders in each MixerChannel strip.

## AudioSetupModal

- Shows on first entry to Studio when `localStorage.getItem('podcraft_audio_setup') !== 'done'`.
- 4 steps: interface select → mic select → headphones select → room select (grid of 12 options).
- On finish: applies room EQ to `engine.setMicEQ()` + `engine.setInputGain()` via ROOM_EQ / ROOM_GAIN lookup tables.
- Key: `podcraft_audio_setup`. Set to `'done'` on finish or skip.
- Can be re-triggered from 3-dot menu → "Audio Setup" (calls `setAudioSetupDone(false)`).

## 3-dot menu items

Dock/Undock, Reset Mixer Layout, (divider), Add Track, Audio Setup, (divider), Engine Status (inline display)

**Why:** Preserving these decisions avoids re-discovering what's wired vs unavailable.
**How to apply:** Before modifying Studio/Mixer, check this file first.
