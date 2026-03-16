/**
 * useTools - Hook for managing metronome and pitch drone tools
 */
import { useState, useEffect, useRef } from "react";

export default function useTools(currentMiniSession) {
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
  const longPressTimerRef = useRef(null);

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
  const toggleMetronome = () => {
    if (metronomeEnabled) {
      setMetronomeEnabled(false);
      setMetronomeVisible(false);
    } else {
      setMetronomeEnabled(true);
      setMetronomeVisible(true);
    }
  };

  // Toggle drone
  const toggleDrone = () => {
    if (droneEnabled) {
      setDroneEnabled(false);
      setDroneVisible(false);
    } else {
      setDroneEnabled(true);
      setDroneVisible(true);
    }
  };

  // Start long press for mute
  const startMuteLongPress = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowVolumeModal(true);
    }, 500);
  };

  // Cancel long press
  const cancelMuteLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Handle short press (toggle mute)
  const handleMutePress = () => {
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
