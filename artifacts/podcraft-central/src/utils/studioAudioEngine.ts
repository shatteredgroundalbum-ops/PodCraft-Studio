/* ── PodCraft Audio Engine — Full DAW Mixer Routing ──────────────
   Signal flow:
   Mic → inputGain(trim) → inputAnalyser → micEQ → micGain(fader) → micPanner → micAnalyser → masterGain
   Timeline clips → trackGain → trackPanner → trackAnalyser → masterGain
   Music Pads → musicBusGain(fader) → musicBusEQ → musicBusPanner → musicBusAnalyser → masterGain
   SFX Pads → sfxBusGain(fader) → sfxBusEQ → sfxBusPanner → sfxBusAnalyser → masterGain
   masterGain → masterCompressor → masterAnalyser → destination
             └→ monitorGain → monitorAnalyser  (headphone monitor)
             └→ recorderBusGain → recorderDestination  (master-mix export)
   ─────────────────────────────────────────────────────────────── */

export interface ChannelEQ {
  low:  BiquadFilterNode;   // lowshelf  @100 Hz
  mid:  BiquadFilterNode;   // peaking   @1 kHz
  high: BiquadFilterNode;   // highshelf @8 kHz
}

export class AudioEngine {
  ctx: AudioContext | null = null;

  // ── Master ────────────────────────────────────────────────────
  masterGain:       GainNode | null = null;
  masterCompressor: DynamicsCompressorNode | null = null;
  masterAnalyser:   AnalyserNode | null = null;

  // ── Mic input chain ───────────────────────────────────────────
  stream:        MediaStream | null = null;
  inputGainNode: GainNode | null = null;     // trim (backward-compat public)
  inputAnalyser: AnalyserNode | null = null; // pre-fader meter (backward-compat public)
  micEQ:         ChannelEQ | null = null;
  micGain:       GainNode | null = null;     // channel fader
  micPanner:     StereoPannerNode | null = null;
  micAnalyser:   AnalyserNode | null = null; // post-fader meter

  // ── Music Bed bus ─────────────────────────────────────────────
  musicBusGain:     GainNode | null = null;
  musicBusEQ:       ChannelEQ | null = null;
  musicBusPanner:   StereoPannerNode | null = null;
  musicBusAnalyser: AnalyserNode | null = null;

  // ── SFX bus ───────────────────────────────────────────────────
  sfxBusGain:     GainNode | null = null;
  sfxBusEQ:       ChannelEQ | null = null;
  sfxBusPanner:   StereoPannerNode | null = null;
  sfxBusAnalyser: AnalyserNode | null = null;

  // ── Reverb effect (parallel wet send from mic post-fader) ─────
  reverbSendGain:   GainNode | null = null;
  reverbConvolver:  ConvolverNode | null = null;
  reverbReturnGain: GainNode | null = null;

  // ── Delay effect (parallel wet send from mic post-fader) ──────
  delaySendGain:    GainNode | null = null;
  delayNode:        DelayNode | null = null;
  delayReturnGain:  GainNode | null = null;

  // ── Monitor/Headphone bus ─────────────────────────────────────
  monitorGain:     GainNode | null = null;
  monitorAnalyser: AnalyserNode | null = null;

  // ── Recorder bus (master-mix export) ─────────────────────────
  recorderBusGain:     GainNode | null = null;
  recorderDestination: MediaStreamAudioDestinationNode | null = null;

  // ── Timeline track chains ─────────────────────────────────────
  trackGains:     Map<string, GainNode>         = new Map();
  trackPanners:   Map<string, StereoPannerNode> = new Map();
  trackAnalysers: Map<string, AnalyserNode>     = new Map();

  // ── Mic MediaRecorder (for timeline clips) ────────────────────
  mediaRecorder:  MediaRecorder | null = null;
  recordedChunks: Blob[] = [];

  // ── Mix MediaRecorder (master-mix export) ────────────────────
  mixMediaRecorder:  MediaRecorder | null = null;
  mixRecordedChunks: Blob[] = [];

  // ── Playback ──────────────────────────────────────────────────
  sourceNodes: Map<string, AudioBufferSourceNode[]> = new Map();
  startTime = 0;

  // ── Init ─────────────────────────────────────────────────────
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Master: masterGain → compressor → analyser → speakers
    this.masterGain = this.ctx.createGain();
    this.masterCompressor = this.ctx.createDynamicsCompressor();
    this.masterCompressor.threshold.value = 0; // neutral by default
    this.masterCompressor.ratio.value = 1;
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Reverb effect (ConvolverNode — parallel wet send, input wired in requestInput)
    this.reverbSendGain   = this.ctx.createGain();
    this.reverbSendGain.gain.value = 0; // off by default
    this.reverbConvolver  = this.ctx.createConvolver();
    this.reverbReturnGain = this.ctx.createGain();
    this.reverbReturnGain.gain.value = 0.7;
    this.reverbSendGain.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.reverbReturnGain);
    this.reverbReturnGain.connect(this.masterGain);

    // Delay effect (DelayNode — parallel wet send, input wired in requestInput)
    this.delaySendGain   = this.ctx.createGain();
    this.delaySendGain.gain.value = 0; // off by default
    this.delayNode       = this.ctx.createDelay(5.0);
    this.delayNode.delayTime.value = 0.12; // 120ms
    this.delayReturnGain = this.ctx.createGain();
    this.delayReturnGain.gain.value = 0.4;
    this.delaySendGain.connect(this.delayNode);
    this.delayNode.connect(this.delayReturnGain);
    this.delayReturnGain.connect(this.masterGain);

    // Monitor bus (parallel tap from masterGain)
    this.monitorGain = this.ctx.createGain();
    this.monitorGain.gain.value = 0.8;
    this.monitorAnalyser = this.ctx.createAnalyser();
    this.monitorAnalyser.fftSize = 256;
    this.masterGain.connect(this.monitorGain);
    this.monitorGain.connect(this.monitorAnalyser);

    // Recorder bus (tap from masterGain → MediaStreamDestinationNode)
    this.recorderBusGain = this.ctx.createGain();
    this.recorderDestination = this.ctx.createMediaStreamDestination();
    this.masterGain.connect(this.recorderBusGain);
    this.recorderBusGain.connect(this.recorderDestination);

    // Music Bed bus: gain → EQ → panner → analyser → master
    this.musicBusGain = this.ctx.createGain();
    this.musicBusGain.gain.value = 0.8;
    this.musicBusEQ = this._makeEQ();
    this.musicBusPanner = this.ctx.createStereoPanner();
    this.musicBusAnalyser = this.ctx.createAnalyser();
    this.musicBusAnalyser.fftSize = 512;
    this.musicBusGain.connect(this.musicBusEQ.low);
    this.musicBusEQ.low.connect(this.musicBusEQ.mid);
    this.musicBusEQ.mid.connect(this.musicBusEQ.high);
    this.musicBusEQ.high.connect(this.musicBusPanner);
    this.musicBusPanner.connect(this.musicBusAnalyser);
    this.musicBusAnalyser.connect(this.masterGain);

    // SFX bus: gain → EQ → panner → analyser → master
    this.sfxBusGain = this.ctx.createGain();
    this.sfxBusGain.gain.value = 0.8;
    this.sfxBusEQ = this._makeEQ();
    this.sfxBusPanner = this.ctx.createStereoPanner();
    this.sfxBusAnalyser = this.ctx.createAnalyser();
    this.sfxBusAnalyser.fftSize = 512;
    this.sfxBusGain.connect(this.sfxBusEQ.low);
    this.sfxBusEQ.low.connect(this.sfxBusEQ.mid);
    this.sfxBusEQ.mid.connect(this.sfxBusEQ.high);
    this.sfxBusEQ.high.connect(this.sfxBusPanner);
    this.sfxBusPanner.connect(this.sfxBusAnalyser);
    this.sfxBusAnalyser.connect(this.masterGain);
  }

  private _makeEQ(): ChannelEQ {
    if (!this.ctx) throw new Error('ctx not initialized');
    const low  = this.ctx.createBiquadFilter();
    low.type  = 'lowshelf';  low.frequency.value  = 100;  low.gain.value  = 0;
    const mid  = this.ctx.createBiquadFilter();
    mid.type  = 'peaking';   mid.frequency.value  = 1000; mid.Q.value = 0.9; mid.gain.value = 0;
    const high = this.ctx.createBiquadFilter();
    high.type = 'highshelf'; high.frequency.value = 8000; high.gain.value = 0;
    return { low, mid, high };
  }

  // ── Mic input setup ──────────────────────────────────────────
  async requestInput(deviceId?: string) {
    try {
      if (!this.ctx) this.init();
      const constraints = deviceId ? { audio: { deviceId: { exact: deviceId } } } : { audio: true };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.ctx && this.masterGain) {
        const source = this.ctx.createMediaStreamSource(this.stream);
        // trim → pre-fader analyser → EQ → fader → pan → post-fader analyser → master
        this.inputGainNode = this.ctx.createGain();
        this.inputGainNode.gain.value = 0.8;
        this.inputAnalyser = this.ctx.createAnalyser();
        this.inputAnalyser.fftSize = 1024;
        this.micEQ = this._makeEQ();
        this.micGain = this.ctx.createGain();
        this.micGain.gain.value = 1;
        this.micPanner = this.ctx.createStereoPanner();
        this.micAnalyser = this.ctx.createAnalyser();
        this.micAnalyser.fftSize = 1024;
        source.connect(this.inputGainNode);
        this.inputGainNode.connect(this.inputAnalyser);
        this.inputAnalyser.connect(this.micEQ.low);
        this.micEQ.low.connect(this.micEQ.mid);
        this.micEQ.mid.connect(this.micEQ.high);
        this.micEQ.high.connect(this.micGain);
        this.micGain.connect(this.micPanner);
        this.micPanner.connect(this.micAnalyser);
        this.micAnalyser.connect(this.masterGain);
        // Hook mic into effects sends (parallel wet paths)
        if (this.reverbSendGain) this.micAnalyser.connect(this.reverbSendGain);
        if (this.delaySendGain)  this.micAnalyser.connect(this.delaySendGain);
        // Build synthetic reverb IR now that ctx + sample rate are known
        if (this.reverbConvolver) this.reverbConvolver.buffer = this._generateReverbIR();
      }
      return true;
    } catch { return false; }
  }

  // ── Timeline track chain ────────────────────────────────────
  getTrackGain(trackId: string): GainNode | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
    if (!this.trackGains.has(trackId)) {
      const gain    = this.ctx.createGain();
      const panner  = this.ctx.createStereoPanner();
      const analyser = this.ctx.createAnalyser();
      analyser.fftSize = 256;
      gain.connect(panner); panner.connect(analyser); analyser.connect(this.masterGain);
      this.trackGains.set(trackId, gain);
      this.trackPanners.set(trackId, panner);
      this.trackAnalysers.set(trackId, analyser);
    }
    return this.trackGains.get(trackId);
  }

  getTrackAnalyser(trackId: string): AnalyserNode | undefined {
    this.getTrackGain(trackId);
    return this.trackAnalysers.get(trackId);
  }

  setTrackVolume(trackId: string, v: number) { const g = this.getTrackGain(trackId); if (g) g.gain.value = v; }
  setTrackPan(trackId: string, v: number) {
    this.getTrackGain(trackId);
    const p = this.trackPanners.get(trackId); if (p) p.pan.value = Math.max(-1, Math.min(1, v));
  }

  // ── Volume / pan / EQ setters ────────────────────────────────
  setMasterVolume(v: number)      { if (this.masterGain)     this.masterGain.gain.value = v; }
  setInputGain(v: number)         { if (this.inputGainNode)  this.inputGainNode.gain.value = v; }
  setMicFaderVolume(v: number)    { if (this.micGain)        this.micGain.gain.value = v; }
  setMicPan(v: number)            { if (this.micPanner)      this.micPanner.pan.value = Math.max(-1, Math.min(1, v)); }
  setMusicBusVolume(v: number)    { if (this.musicBusGain)   this.musicBusGain.gain.value = v; }
  setMusicBusPan(v: number)       { if (this.musicBusPanner) this.musicBusPanner.pan.value = Math.max(-1, Math.min(1, v)); }
  setSfxBusVolume(v: number)      { if (this.sfxBusGain)     this.sfxBusGain.gain.value = v; }
  setSfxBusPan(v: number)         { if (this.sfxBusPanner)   this.sfxBusPanner.pan.value = Math.max(-1, Math.min(1, v)); }
  setMonitorVolume(v: number)     { if (this.monitorGain)    this.monitorGain.gain.value = v; }

  setCompressor(enabled: boolean) {
    if (!this.masterCompressor) return;
    this.masterCompressor.threshold.value = enabled ? -24 : 0;
    this.masterCompressor.ratio.value     = enabled ? 4   : 1;
  }

  setMicEQ     (band: 'low'|'mid'|'high', db: number) { if (this.micEQ)      this.micEQ[band].gain.value = db; }
  setMusicBusEQ(band: 'low'|'mid'|'high', db: number) { if (this.musicBusEQ) this.musicBusEQ[band].gain.value = db; }
  setSfxBusEQ  (band: 'low'|'mid'|'high', db: number) { if (this.sfxBusEQ)   this.sfxBusEQ[band].gain.value = db; }

  // ── Reverb (ConvolverNode — synthetic exponential IR) ────────
  setReverbEnabled(enabled: boolean) {
    if (this.reverbSendGain) this.reverbSendGain.gain.value = enabled ? 1.0 : 0;
  }

  // ── Delay (DelayNode — 120 ms default) ──────────────────────
  setDelayEnabled(enabled: boolean) {
    if (this.delaySendGain) this.delaySendGain.gain.value = enabled ? 0.45 : 0;
  }

  private _generateReverbIR(duration = 1.5, decay = 3.0): AudioBuffer {
    const sr  = this.ctx!.sampleRate;
    const len = Math.round(sr * duration);
    const buf = this.ctx!.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // ── Mic recording (for timeline clips) ──────────────────────
  startRecording(onDataAvailable: (blob: Blob) => void): boolean {
    if (!this.stream) return false;
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) { this.recordedChunks.push(e.data); onDataAvailable(e.data); }
    };
    this.mediaRecorder.start(100);
    return true;
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(new Blob(this.recordedChunks, { type: 'audio/webm' })); return;
      }
      this.mediaRecorder.onstop = () => resolve(new Blob(this.recordedChunks, { type: 'audio/webm' }));
      this.mediaRecorder.stop();
    });
  }

  // ── Master-mix recording (for export/download) ───────────────
  startMixRecording(onDataAvailable: (blob: Blob) => void): boolean {
    if (!this.recorderDestination) return false;
    this.mixRecordedChunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus') ? 'audio/ogg;codecs=opus' : '';
    this.mixMediaRecorder = new MediaRecorder(
      this.recorderDestination.stream,
      mime ? { mimeType: mime } : undefined,
    );
    this.mixMediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) { this.mixRecordedChunks.push(e.data); onDataAvailable(e.data); }
    };
    this.mixMediaRecorder.start(100);
    return true;
  }

  stopMixRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mixMediaRecorder || this.mixMediaRecorder.state === 'inactive') {
        resolve(new Blob(this.mixRecordedChunks, { type: 'audio/webm' })); return;
      }
      this.mixMediaRecorder.onstop = () => resolve(new Blob(this.mixRecordedChunks, { type: 'audio/webm' }));
      this.mixMediaRecorder.stop();
    });
  }

  async decodeAudioData(blob: Blob): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    return this.ctx.decodeAudioData(await blob.arrayBuffer());
  }

  // ── Timeline playback ────────────────────────────────────────
  play(
    tracks: { id: string; muted: boolean; clips: { startTime: number; duration: number; buffer: AudioBuffer }[] }[],
    offset = 0,
  ) {
    if (!this.ctx) return;
    this.stop();
    this.startTime = this.ctx.currentTime - offset;
    tracks.forEach((track) => {
      if (track.muted) return;
      const trackGain = this.getTrackGain(track.id); if (!trackGain) return;
      const nodes: AudioBufferSourceNode[] = [];
      track.clips.forEach((clip) => {
        if (!this.ctx || clip.startTime + clip.duration <= offset) return;
        const src = this.ctx.createBufferSource();
        src.buffer = clip.buffer; src.connect(trackGain);
        let startOffset = 0, playTime = clip.startTime;
        if (offset > clip.startTime) { startOffset = offset - clip.startTime; playTime = offset; }
        src.start(this.ctx.currentTime + (playTime - offset), startOffset);
        nodes.push(src);
      });
      this.sourceNodes.set(track.id, nodes);
    });
  }

  stop() {
    this.sourceNodes.forEach((nodes) =>
      nodes.forEach((n) => { try { n.stop(); } catch { /**/ } n.disconnect(); }),
    );
    this.sourceNodes.clear();
  }
}

export const engine = new AudioEngine();
