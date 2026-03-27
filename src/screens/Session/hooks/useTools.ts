/**
 * useTools - Hook for managing metronome and pitch drone tools
 */
import {
  useState,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
  MutableRefObject,
} from "react";

/** Return type for useTools hook */
export interface UseToolsReturn {
  // Metronome
  metronomeEnabled: boolean;
  setMetronomeEnabled: Dispatch<SetStateAction<boolean>>;
  metronomeVisible: boolean;
  setMetronomeVisible: Dispatch<SetStateAction<boolean>>;
  metronomeIsPlaying: boolean;
  setMetronomeIsPlaying: Dispatch<SetStateAction<boolean>>;
  metronomeVolume: number;
  setMetronomeVolume: Dispatch<SetStateAction<number>>;
  toggleMetronome: () => void;

  // Drone
  droneEnabled: boolean;
  setDroneEnabled: Dispatch<SetStateAction<boolean>>;
  droneVisible: boolean;
  setDroneVisible: Dispatch<SetStateAction<boolean>>;
  droneIsPlaying: boolean;
  setDroneIsPlaying: Dispatch<SetStateAction<boolean>>;
  droneVolume: number;
  setDroneVolume: Dispatch<SetStateAction<number>>;
  toggleDrone: () => void;

  // Audio
  audioMuted: boolean;
  setAudioMuted: Dispatch<SetStateAction<boolean>>;
  showVolumeModal: boolean;
  setShowVolumeModal: Dispatch<SetStateAction<boolean>>;

  // Long press helpers
  startMuteLongPress: () => void;
  cancelMuteLongPress: () => void;
  handleMutePress: () => void;
  longPressTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

/**
 * Hook for managing metronome and pitch drone tools in session screens
 * @param currentMiniSession - Current mini session (used to reset tools on session change)
 * @returns Object containing tool state and controls
 */
export default function useTools(currentMiniSession: unknown): UseToolsReturn {
  // Metronome state
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [metronomeVisible, setMetronomeVisible] = useState(false);
  const [metronomeIsPlaying, setMetronomeIsPlaying] = useState(false);

  // Pitch Drone state
  const [droneEnabled, setDroneEnabled] = useState(false);
  const [droneVisible, setDroneVisible] = useState(false);
  const [droneIsPlaying, setDroneIsPlaying] = useState(false);

  // Volume controls (0-1 scale)
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  const [droneVolume, setDroneVolume] = useState(0.5);
  const [audioMuted, setAudioMuted] = useState(false);

  // Volume modal
  const [showVolumeModal, setShowVolumeModal] = useState(false);

  // Long-press timer ref for mute button
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset tools when mini-session changes
  useEffect(() => {
    setMetronomeEnabled(false);
    setMetronomeVisible(false);
    setMetronomeIsPlaying(false);
    setDroneEnabled(false);
    setDroneVisible(false);
    setDroneIsPlaying(false);
    setAudioMuted(false);
  }, [currentMiniSession]);

  // Toggle metronome
  const toggleMetronome = (): void => {
    if (metronomeEnabled) {
      setMetronomeEnabled(false);
      setMetronomeVisible(false);
    } else {
      setMetronomeEnabled(true);
      setMetronomeVisible(true);
    }
  };

  // Toggle drone
  const toggleDrone = (): void => {
    if (droneEnabled) {
      setDroneEnabled(false);
      setDroneVisible(false);
    } else {
      setDroneEnabled(true);
      setDroneVisible(true);
    }
  };

  // Start long press for mute
  const startMuteLongPress = (): void => {
    longPressTimerRef.current = setTimeout(() => {
      setShowVolumeModal(true);
    }, 500);
  };

  // Cancel long press
  const cancelMuteLongPress = (): void => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Handle short press (toggle mute)
  const handleMutePress = (): void => {
    cancelMuteLongPress();
    setAudioMuted(!audioMuted);
  };

  return {
    // Metronome
    metronomeEnabled,
    setMetronomeEnabled,
    metronomeVisible,
    setMetronomeVisible,
    metronomeIsPlaying,
    setMetronomeIsPlaying,
    metronomeVolume,
    setMetronomeVolume,
    toggleMetronome,

    // Drone
    droneEnabled,
    setDroneEnabled,
    droneVisible,
    setDroneVisible,
    droneIsPlaying,
    setDroneIsPlaying,
    droneVolume,
    setDroneVolume,
    toggleDrone,

    // Audio
    audioMuted,
    setAudioMuted,
    showVolumeModal,
    setShowVolumeModal,

    // Long press helpers
    startMuteLongPress,
    cancelMuteLongPress,
    handleMutePress,
    longPressTimerRef,
  };
}
