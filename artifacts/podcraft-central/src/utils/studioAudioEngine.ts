export class AudioEngine {
  ctx: AudioContext | null = null;
  masterGain: GainNode | null = null;
  masterAnalyser: AnalyserNode | null = null;
  inputAnalyser: AnalyserNode | null = null;
  trackGains: Map<string, GainNode> = new Map();

  mediaRecorder: MediaRecorder | null = null;
  recordedChunks: Blob[] = [];
  stream: MediaStream | null = null;

  sourceNodes: Map<string, AudioBufferSourceNode[]> = new Map();
  startTime: number = 0;
  pauseTime: number = 0;

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
  }

  async requestInput(deviceId?: string) {
    try {
      const constraints = deviceId
        ? { audio: { deviceId: { exact: deviceId } } }
        : { audio: true };
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.ctx) {
        const source = this.ctx.createMediaStreamSource(this.stream);
        this.inputAnalyser = this.ctx.createAnalyser();
        source.connect(this.inputAnalyser);
      }
      return true;
    } catch {
      return false;
    }
  }

  getTrackGain(trackId: string) {
    if (!this.ctx || !this.masterGain) return null;
    if (!this.trackGains.has(trackId)) {
      const gain = this.ctx.createGain();
      gain.connect(this.masterGain);
      this.trackGains.set(trackId, gain);
    }
    return this.trackGains.get(trackId);
  }

  setTrackVolume(trackId: string, volume: number) {
    const gain = this.getTrackGain(trackId);
    if (gain) gain.gain.value = volume;
  }

  setMasterVolume(volume: number) {
    if (this.masterGain) this.masterGain.gain.value = volume;
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
      this.mediaRecorder.onstop = () => {
        resolve(new Blob(this.recordedChunks, { type: 'audio/webm' }));
      };
      this.mediaRecorder.stop();
    });
  }

  async decodeAudioData(blob: Blob): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    const arrayBuffer = await blob.arrayBuffer();
    return await this.ctx.decodeAudioData(arrayBuffer);
  }

  play(tracks: { id: string; muted: boolean; clips: { startTime: number; duration: number; buffer: AudioBuffer }[] }[], offset = 0) {
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
    this.sourceNodes.forEach((nodes) => {
      nodes.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } node.disconnect(); });
    });
    this.sourceNodes.clear();
  }
}

export const engine = new AudioEngine();
