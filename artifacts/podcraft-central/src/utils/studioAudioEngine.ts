export class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  masterAnalyser: AnalyserNode | null = null;
  inputAnalyser: AnalyserNode | null = null;
  inputGainNode: GainNode | null = null;

  trackGains: Map<string, GainNode> = new Map();
  trackPanners: Map<string, StereoPannerNode> = new Map();

  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  stream: MediaStream | null = null;

  sourceNodes: Map<string, AudioBufferSourceNode[]> = new Map();
  startTime = 0;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }

  async requestInput(deviceId?: string) {
    try {
      if (!this.ctx) this.init();
      const constraints = deviceId
        ? { audio: { deviceId: { exact: deviceId } } }
        : { audio: true };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.ctx) {
        const source = this.ctx.createMediaStreamSource(this.stream);
        this.inputGainNode = this.ctx.createGain();
        this.inputAnalyser = this.ctx.createAnalyser();
        source.connect(this.inputGainNode);
        this.inputGainNode.connect(this.inputAnalyser);
        // intentionally not connecting to destination — monitoring only
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Returns (creating if needed) the gain node for a track.
   *  Signal chain: source → gain → panner → masterGain */
  getTrackGain(trackId: string): GainNode | undefined {
    if (!this.ctx || !this.masterGain) return undefined;
    if (!this.trackGains.has(trackId)) {
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner();
      gain.connect(panner);
      panner.connect(this.masterGain);
      this.trackGains.set(trackId, gain);
      this.trackPanners.set(trackId, panner);
    }
    return this.trackGains.get(trackId);
  }

  setTrackVolume(trackId: string, volume: number) {
    const gain = this.getTrackGain(trackId);
    if (gain) gain.gain.value = volume;
  }

  setTrackPan(trackId: string, pan: number) {
    // ensure the chain exists
    this.getTrackGain(trackId);
    const panner = this.trackPanners.get(trackId);
    if (panner) panner.pan.value = Math.max(-1, Math.min(1, pan));
  }

  setMasterVolume(volume: number) {
    if (this.masterGain) this.masterGain.gain.value = volume;
  }

  setInputGain(value: number) {
    if (this.inputGainNode) this.inputGainNode.gain.value = value;
  }

  startRecording(onDataAvailable: (blob: Blob) => void) {
    if (!this.stream) return false;
    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
        onDataAvailable(e.data);
      }
    };
    this.mediaRecorder.start(100);
    return true;
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) { resolve(new Blob()); return; }
      this.mediaRecorder.onstop = () =>
        resolve(new Blob(this.recordedChunks, { type: 'audio/webm' }));
      this.mediaRecorder.stop();
    });
  }

  async decodeAudioData(blob: Blob): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const arrayBuffer = await blob.arrayBuffer();
    return this.ctx.decodeAudioData(arrayBuffer);
  }

  play(
    tracks: { id: string; muted: boolean; clips: { startTime: number; duration: number; buffer: AudioBuffer }[] }[],
    offset = 0,
  ) {
    if (!this.ctx) return;
    this.stop();
    this.startTime = this.ctx.currentTime - offset;
    tracks.forEach((track) => {
      if (track.muted) return;
      const trackGain = this.getTrackGain(track.id);
      if (!trackGain) return;
      const nodes: AudioBufferSourceNode[] = [];
      track.clips.forEach((clip) => {
        if (!this.ctx) return;
        if (clip.startTime + clip.duration <= offset) return;
        const source = this.ctx.createBufferSource();
        source.buffer = clip.buffer;
        source.connect(trackGain);
        let startOffset = 0;
        let playTime = clip.startTime;
        if (offset > clip.startTime) { startOffset = offset - clip.startTime; playTime = offset; }
        source.start(this.ctx.currentTime + (playTime - offset), startOffset);
        nodes.push(source);
      });
      this.sourceNodes.set(track.id, nodes);
    });
  }

  stop() {
    this.sourceNodes.forEach((nodes) =>
      nodes.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } node.disconnect(); }),
    );
    this.sourceNodes.clear();
  }
}

export const engine = new AudioEngine();
