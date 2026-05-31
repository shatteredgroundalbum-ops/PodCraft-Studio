import WorkersUrl from '@opendaw/studio-core/workers-main.js?worker&url';
import WorkletsUrl from '@opendaw/studio-core/processors.js?url';

import {
  Workers,
  AudioWorklets,
  AudioDevices,
  Project,
  SampleService,
  SoundfontService,
  GlobalSampleLoaderManager,
  GlobalSoundfontLoaderManager,
  OpenSampleAPI,
  OpenSoundfontAPI,
} from '@opendaw/studio-core';
import type { MeterWorklet } from '@opendaw/studio-core';
import { PPQN } from '@opendaw/lib-dsp';
import type { DawState, EngineStatus } from './types';

const SEEK_SECONDS = 10;
const SEEK_LARGE_SECONDS = 30;
const NUM_METER_BARS = 20;
const EMPTY_BARS = Array<number>(NUM_METER_BARS).fill(0);

class OpenDawEngine {
  private _status: EngineStatus = 'uninitialized';
  private _error?: string;
  private _project: Project | null = null;
  private _audioContext: AudioContext | null = null;
  private _audioWorklets: AudioWorklets | null = null;
  private _meterWorklet: MeterWorklet | null = null;
  private _meterStream: MediaStream | null = null;
  private _meterSource: MediaStreamAudioSourceNode | null = null;
  private _meterGainNode: GainNode | null = null;
  private _meterSub: { terminate(): void } | null = null;
  private _engineSubs: Array<{ terminate(): void }> = [];
  private _listeners = new Set<() => void>();
  private _initPromise: Promise<void> | null = null;

  private _isPlaying = false;
  private _isRecording = false;
  private _positionPpqn = 0;
  private _bpm = 120;
  private _cpuLoad = 0;
  private _meterBars: number[] = [...EMPTY_BARS];
  private _meterPeak = 0;
  private _meterRms = 0;
  private _devices: Array<{ deviceId: string; label: string }> = [];
  private _inputGain = 0.8;

  getState(): DawState {
    return {
      status: this._status,
      error: this._error,
      isPlaying: this._isPlaying,
      isRecording: this._isRecording,
      positionPpqn: this._positionPpqn,
      positionSeconds: this._bpm > 0 ? (this._positionPpqn * 60) / (960 * this._bpm) : 0,
      bpm: this._bpm,
      cpuLoad: this._cpuLoad,
      meterBars: this._meterBars,
      meterPeak: this._meterPeak,
      meterRms: this._meterRms,
      devices: this._devices,
      inputGain: this._inputGain,
    };
  }

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  initialize(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    if (this._status === 'ready') return Promise.resolve();
    this._initPromise = this._doInit();
    return this._initPromise;
  }

  private async _doInit(): Promise<void> {
    if (!crossOriginIsolated) {
      this._status = 'unsupported';
      this._error =
        'Cross-origin isolation is not enabled. Open the app directly (not inside an iframe) or configure the server with COOP/COEP headers to unlock full audio engine features.';
      this._notify();
      return;
    }

    try {
      this._status = 'initializing';
      this._notify();

      await Workers.install(WorkersUrl);
      AudioWorklets.install(WorkletsUrl);

      this._audioContext = new AudioContext({ latencyHint: 0 });

      this._audioWorklets = await AudioWorklets.createFor(this._audioContext);

      const sampleService = new SampleService(this._audioContext);
      const soundfontService = new SoundfontService();

      const sampleManager = new GlobalSampleLoaderManager({
        fetch: (uuid, progress) => OpenSampleAPI.get().load(uuid, progress),
      });

      const soundfontManager = new GlobalSoundfontLoaderManager({
        fetch: (uuid, progress) => OpenSoundfontAPI.get().load(uuid, progress),
      });

      this._project = Project.new({
        audioContext: this._audioContext,
        audioWorklets: this._audioWorklets,
        sampleManager,
        soundfontManager,
        sampleService,
        soundfontService,
      });

      this._project.startAudioWorklet();
      await this._project.engine.isReady();

      const engine = this._project.engine;

      this._engineSubs.push(
        engine.isPlaying.catchupAndSubscribe((obs) => {
          this._isPlaying = obs.getValue();
          this._notify();
        }),
      );
      this._engineSubs.push(
        engine.isRecording.catchupAndSubscribe((obs) => {
          this._isRecording = obs.getValue();
          this._notify();
        }),
      );
      this._engineSubs.push(
        engine.position.catchupAndSubscribe((obs) => {
          this._positionPpqn = obs.getValue();
          this._notify();
        }),
      );
      this._engineSubs.push(
        engine.bpm.catchupAndSubscribe((obs) => {
          this._bpm = obs.getValue();
          this._notify();
        }),
      );
      this._engineSubs.push(
        engine.cpuLoad.catchupAndSubscribe((obs) => {
          this._cpuLoad = obs.getValue();
          this._notify();
        }),
      );

      this._meterWorklet = this._audioWorklets.createMeter(1);

      await this._refreshDevicesInternal();

      this._status = 'ready';
      this._notify();

      if (this._audioContext.state === 'suspended') {
        window.addEventListener('click', () => this._audioContext?.resume(), {
          capture: true,
          once: true,
        });
      }
    } catch (err) {
      this._status = 'error';
      this._error = err instanceof Error ? err.message : String(err);
      this._notify();
    }
  }

  private async _refreshDevicesInternal(): Promise<void> {
    await AudioDevices.updateInputList();
    this._devices = AudioDevices.inputs.map((d) => ({
      deviceId: d.deviceId,
      label: d.label || `Microphone (${d.deviceId.slice(0, 8)})`,
    }));
  }

  async refreshDevices(): Promise<void> {
    if (this._status !== 'ready') return;
    await this._refreshDevicesInternal();
    this._notify();
  }

  async requestMicPermission(): Promise<void> {
    await AudioDevices.requestPermission();
    await this._refreshDevicesInternal();
    this._notify();
  }

  async startMeterMonitoring(deviceId?: string): Promise<void> {
    if (!this._audioContext || !this._meterWorklet) return;
    this.stopMeterMonitoring();
    try {
      const constraints: MediaTrackConstraints = deviceId
        ? { deviceId: { exact: deviceId } }
        : {};
      const stream = await AudioDevices.requestStream(constraints);
      this._meterStream = stream;
      this._meterSource = this._audioContext.createMediaStreamSource(stream);
      this._meterGainNode = this._audioContext.createGain();
      this._meterGainNode.gain.value = this._inputGain;
      this._meterSource.connect(this._meterGainNode);
      this._meterGainNode.connect(this._meterWorklet);
      this._meterSub = this._meterWorklet.subscribe(({ peak, rms }) => {
        const peakVal = peak[0] ?? 0;
        const rmsVal = rms[0] ?? 0;
        this._meterPeak = peakVal;
        this._meterRms = rmsVal;
        const displayVal = Math.max(peakVal, rmsVal);
        this._meterBars = Array(NUM_METER_BARS)
          .fill(0)
          .map((_, i) => {
            const threshold = i / NUM_METER_BARS;
            if (displayVal <= 0.01) return 0;
            if (threshold <= displayVal) return displayVal * (1 - i * 0.015);
            return 0;
          });
        this._notify();
      });
    } catch {
      // Permission denied or device unavailable
    }
  }

  stopMeterMonitoring(): void {
    this._meterSub?.terminate();
    this._meterSub = null;
    if (this._meterGainNode) {
      try { this._meterGainNode.disconnect(); } catch { /* ignore */ }
      this._meterGainNode = null;
    }
    if (this._meterSource) {
      try { this._meterSource.disconnect(); } catch { /* ignore */ }
      this._meterSource = null;
    }
    this._meterStream?.getTracks().forEach((t) => t.stop());
    this._meterStream = null;
    this._meterBars = [...EMPTY_BARS];
    this._meterPeak = 0;
    this._meterRms = 0;
    this._notify();
  }

  setInputGain(value: number): void {
    this._inputGain = Math.max(0, Math.min(1, value));
    if (this._meterGainNode) {
      this._meterGainNode.gain.value = this._inputGain;
    }
    this._notify();
  }

  play(): void {
    if (!this._project) return;
    const engine = this._project.engine;
    if (engine.isPlaying.getValue()) {
      engine.stop(false);
    } else {
      engine.play();
    }
  }

  pause(): void {
    if (!this._project) return;
    if (this._project.engine.isPlaying.getValue()) {
      this._project.engine.stop(false);
    }
  }

  stop(): void {
    this._project?.engine.stop(true);
  }

  seekToStart(): void {
    this._project?.engine.setPosition(0);
  }

  seekForward(): void {
    if (!this._project) return;
    const engine = this._project.engine;
    const current = engine.position.getValue();
    const bpm = engine.bpm.getValue();
    const pulses = PPQN.secondsToPulses(SEEK_SECONDS, bpm);
    engine.setPosition(current + pulses);
  }

  seekForwardLarge(): void {
    if (!this._project) return;
    const engine = this._project.engine;
    const current = engine.position.getValue();
    const bpm = engine.bpm.getValue();
    const pulses = PPQN.secondsToPulses(SEEK_LARGE_SECONDS, bpm);
    engine.setPosition(current + pulses);
  }

  seekBackward(): void {
    if (!this._project) return;
    const engine = this._project.engine;
    const current = engine.position.getValue();
    const bpm = engine.bpm.getValue();
    const pulses = PPQN.secondsToPulses(SEEK_SECONDS, bpm);
    engine.setPosition(Math.max(0, current - pulses));
  }

  seekBackwardLarge(): void {
    if (!this._project) return;
    const engine = this._project.engine;
    const current = engine.position.getValue();
    const bpm = engine.bpm.getValue();
    const pulses = PPQN.secondsToPulses(SEEK_LARGE_SECONDS, bpm);
    engine.setPosition(Math.max(0, current - pulses));
  }

  startEngineRecording(countIn = false): void {
    this._project?.startRecording(countIn);
  }

  stopEngineRecording(): void {
    this._project?.stopRecording();
  }

  cleanup(): void {
    this._engineSubs.forEach((s) => s.terminate());
    this._engineSubs = [];
    this.stopMeterMonitoring();
    try { this._meterWorklet?.terminate(); } catch { /* ignore */ }
    try { this._project?.terminate(); } catch { /* ignore */ }
    this._audioContext?.close().catch(() => {});
    this._project = null;
    this._audioContext = null;
    this._audioWorklets = null;
    this._meterWorklet = null;
    this._initPromise = null;
    this._status = 'uninitialized';
    this._notify();
  }

  private _notify(): void {
    this._listeners.forEach((l) => l());
  }
}

export const openDawEngine = new OpenDawEngine();
