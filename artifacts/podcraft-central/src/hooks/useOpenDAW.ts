import { useState, useEffect } from 'react';
import { openDawEngine } from '../services/daw';
import type { DawState } from '../services/daw/types';

export interface UseOpenDAW extends DawState {
  play(): void;
  pause(): void;
  stop(): void;
  seekToStart(): void;
  seekForward(): void;
  seekForwardLarge(): void;
  seekBackward(): void;
  seekBackwardLarge(): void;
  setInputGain(value: number): void;
  requestMicPermission(): Promise<void>;
  refreshDevices(): Promise<void>;
  startMeterMonitoring(deviceId?: string): Promise<void>;
  stopMeterMonitoring(): void;
  startEngineRecording(countIn?: boolean): void;
  stopEngineRecording(): void;
}

export function useOpenDAW(): UseOpenDAW {
  const [state, setState] = useState<DawState>(() => openDawEngine.getState());

  useEffect(() => {
    const unsubscribe = openDawEngine.subscribe(() => {
      setState(openDawEngine.getState());
    });

    openDawEngine.initialize().catch(() => {});

    return unsubscribe;
  }, []);

  return {
    ...state,
    play: () => openDawEngine.play(),
    pause: () => openDawEngine.pause(),
    stop: () => openDawEngine.stop(),
    seekToStart: () => openDawEngine.seekToStart(),
    seekForward: () => openDawEngine.seekForward(),
    seekForwardLarge: () => openDawEngine.seekForwardLarge(),
    seekBackward: () => openDawEngine.seekBackward(),
    seekBackwardLarge: () => openDawEngine.seekBackwardLarge(),
    setInputGain: (value) => openDawEngine.setInputGain(value),
    requestMicPermission: () => openDawEngine.requestMicPermission(),
    refreshDevices: () => openDawEngine.refreshDevices(),
    startMeterMonitoring: (deviceId) => openDawEngine.startMeterMonitoring(deviceId),
    stopMeterMonitoring: () => openDawEngine.stopMeterMonitoring(),
    startEngineRecording: (countIn) => openDawEngine.startEngineRecording(countIn),
    stopEngineRecording: () => openDawEngine.stopEngineRecording(),
  };
}
