export type EngineStatus =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'error'
  | 'unsupported';

export interface DawState {
  status: EngineStatus;
  error?: string;
  isPlaying: boolean;
  isRecording: boolean;
  positionPpqn: number;
  bpm: number;
  cpuLoad: number;
  meterBars: number[];
  devices: Array<{ deviceId: string; label: string }>;
}
