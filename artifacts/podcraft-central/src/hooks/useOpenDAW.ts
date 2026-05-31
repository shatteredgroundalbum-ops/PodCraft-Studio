import { useState, useEffect } from 'react';
import { openDawEngine } from '../services/daw';
import type { DawState } from '../services/daw/types';

export interface UseOpenDAW extends DawState {
  play(): void;
  stop(): void;
  seekToStart(): void;
  seekForward(): void;
  seekBackward(): void;
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
    stop: () => openDawEngine.stop(),
    seekToStart: () => openDawEngine.seekToStart(),
    seekForward: () => openDawEngine.seekForward(),
    seekBackward: () => openDawEngine.seekBackward(),
    requestMicPermission: () => openDawEngine.requestMicPermission(),
    refreshDevices: () => openDawEngine.refreshDevices(),
    startMeterMonitoring: (deviceId) =>
      openDawEngine.startMeterMonitoring(deviceId),
    stopMeterMonitoring: () => openDawEngine.stopMeterMonitoring(),
    startEngineRecording: (countIn) =>
      openDawEngine.startEngineRecording(countIn),
    stopEngineRecording: () => openDawEngine.stopEngineRecording(),
  };
}
