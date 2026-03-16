/**
 * ToolsPanel - Metronome/Drone toggles, mute button, and tool components
 */
import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Metronome from "../../../components/Metronome";
import PitchDrone from "../../../components/PitchDrone";
import { styles, colors } from "./styles";

interface ToolsPanelMini {
  key?: string;
  tempo?: number;
  time_signature?: string;
}

interface ToolsPanelProps {
  mini?: ToolsPanelMini;
  metronomeEnabled: boolean;
  droneEnabled: boolean;
  metronomeVisible: boolean;
  setMetronomeVisible: (visible: boolean) => void;
  setMetronomeIsPlaying: (playing: boolean) => void;
  droneVisible: boolean;
  setDroneVisible: (visible: boolean) => void;
  setDroneIsPlaying: (playing: boolean) => void;
  audioMuted: boolean;
  metronomeVolume: number;
  droneVolume: number;
  toggleMetronome: () => void;
  toggleDrone: () => void;
  startMuteLongPress: () => void;
  cancelMuteLongPress: () => void;
  handleMutePress: () => void;
}

export default function ToolsPanel({
  mini,
  metronomeEnabled,
  droneEnabled,
  metronomeVisible,
  setMetronomeVisible,
  setMetronomeIsPlaying,
  droneVisible,
  setDroneVisible,
  setDroneIsPlaying,
  audioMuted,
  metronomeVolume,
  droneVolume,
  toggleMetronome,
  toggleDrone,
  startMuteLongPress,
  cancelMuteLongPress,
  handleMutePress,
}: ToolsPanelProps) {
  return (
    <>
      {/* Tools Row */}
      <View style={styles.toolsRow}>
        {/* Metronome Toggle */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            metronomeEnabled && styles.toggleButtonMetronomeActive,
          ]}
          onPress={toggleMetronome}
          accessibilityLabel={
            metronomeEnabled ? "Disable metronome" : "Enable metronome"
          }
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.toggleButtonText,
              metronomeEnabled && styles.toggleButtonTextActive,
            ]}
          >
            🥁 Metronome
          </Text>
        </TouchableOpacity>

        {/* Drone Toggle */}
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonRight,
            droneEnabled && styles.toggleButtonDroneActive,
          ]}
          onPress={toggleDrone}
          accessibilityLabel={droneEnabled ? "Disable drone" : "Enable drone"}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.toggleButtonText,
              droneEnabled && styles.toggleButtonTextActive,
            ]}
          >
            🎶 Drone
          </Text>
        </TouchableOpacity>
      </View>

      {/* Mute / Volume Control */}
      {(metronomeEnabled || droneEnabled) && (
        <Pressable
          onPressIn={startMuteLongPress}
          onPressOut={cancelMuteLongPress}
          onPress={handleMutePress}
          style={[styles.muteButton, audioMuted && styles.muteButtonActive]}
          accessibilityLabel={
            audioMuted
              ? "Unmute audio, hold for volume control"
              : "Mute audio, hold for volume control"
          }
          accessibilityRole="button"
        >
          <Text style={styles.muteButtonText}>
            {audioMuted ? "🔇 Unmute" : "🔊 Mute"} (hold for volume)
          </Text>
        </Pressable>
      )}

      {/* Metronome Component */}
      {metronomeEnabled && (
        <View style={styles.toolWrapper}>
          <Metronome
            visible={metronomeVisible}
            onVisibilityChange={setMetronomeVisible}
            onPlayStateChange={setMetronomeIsPlaying}
            muted={audioMuted}
            volume={metronomeVolume}
            initialTempo={mini.tempo || 80}
          />
        </View>
      )}

      {/* Drone Component */}
      {droneEnabled && (
        <View style={[styles.toolWrapper, styles.toolWrapperDrone]}>
          <PitchDrone
            visible={droneVisible}
            onVisibilityChange={setDroneVisible}
            onPlayStateChange={setDroneIsPlaying}
            muted={audioMuted}
            volume={droneVolume}
            initialNote={mini?.key || "C"}
          />
        </View>
      )}
    </>
  );
}
