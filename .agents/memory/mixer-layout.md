---
name: Mixer layout architecture
description: StudioMixer layout, effects wiring, and DAW routing decisions.
---

## Layout (1080px floating panel)

Static left (92px): Input/Mic In strip — trim slider, fader, pan, 3-band EQ (L/M/H), post-fader meter
Scrollable center (346px viewport): Timeline track strips — each has M, S, fader, meter, ARM button (mic tracks only)
Static right: Bus faders — Music Bed (66px), SFX (66px), Monitor (66px), Master (68px) — no EQ in bus strips
Static far right (288px, overflow-y-auto): Pad bank — Music Bed 2×3 / SFX 2×3 / Effects 2×3

Transport dock: Add Track button (replaces Mix Rec), transport controls, armed track count.

## Audio routing

Mic: source → inputGainNode(trim) → inputAnalyser → micEQ → micGain(fader) → micPanner → micAnalyser → masterGain
Mic also fans out from micAnalyser to: reverbSendGain → ConvolverNode → reverbReturnGain → masterGain (wet reverb)
                                    and delaySendGain → DelayNode(120ms) → delayReturnGain → masterGain (wet delay)
Music pads: source → engine.musicBusGain → musicBusEQ → musicBusPanner → musicBusAnalyser → masterGain
SFX pads: source → engine.sfxBusGain → sfxBusEQ → sfxBusPanner → sfxBusAnalyser → masterGain
Master: masterGain → masterCompressor → masterAnalyser → speakers
Monitor tap: masterGain → monitorGain → monitorAnalyser (headphones only, not re-routed to speakers)
Recorder tap: masterGain → recorderBusGain → MediaStreamDestinationNode (for export)

## Effects wiring (Effects pad bank)

| Effect     | Node type              | Status     | Notes |
|------------|------------------------|------------|-------|
| Reverb     | ConvolverNode          | Available  | Synthetic exponential IR generated in _generateReverbIR(); wired in requestInput() |
| Delay      | DelayNode (120ms)      | Available  | Parallel wet send from micAnalyser |
| Compressor | DynamicsCompressorNode | Available  | Same as CMP toggle on Master strip |
| EQ         | BiquadFilterNode preset| Available  | Applies -1/+3/+2 dB L/M/H preset; stored in prePresetEQ ref for restore |
| Ducking    | RAF + gain ramp        | Available  | Same as DK button on Music Bed strip |
| Noise Gate | —                      | Unavailable| Requires AudioWorklet; not implemented |

## Send/Return buses

Not supported — no send/return buses in engine. Direct routing only.

## Key decisions

**Why no EQ on bus strips:** Removed from compact bus strip UI to fit body height (368px). EQ nodes still exist in the engine (musicBusEQ, sfxBusEQ) and setters work; only UI knobs were removed.

**Why ARM only on mic tracks:** Music and SFX tracks are playback-only; only mic-type tracks have armed:true by default and show the ARM button.

**EQ preset conflicts:** When EQ preset is active, prePresetEQ ref stores user values. Knobs are dimmed (opacity-40) and disabled. On deactivate, engine nodes are restored from ref.

**Mixer persistence key:** podcraft_mixer_v2 (bumped from v1 to avoid stale state from old shape).
