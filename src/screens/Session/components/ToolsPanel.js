/**
 * ToolsPanel - Metronome/Drone toggles, mute button, and tool components
 */
import React from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Metronome from "../../../components/Metronome";
import PitchDrone from "../../../components/PitchDrone";
import { styles, colors } from "./styles";

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
}) {
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
            initialNote={mini.key || "C"}
          />
        </View>
      )}
    </>
  );
}

ToolsPanel.propTypes = {
  mini: PropTypes.shape({
    key: PropTypes.string,
    tempo: PropTypes.number,
    time_signature: PropTypes.string,
  }),
  metronomeEnabled: PropTypes.bool.isRequired,
  droneEnabled: PropTypes.bool.isRequired,
  metronomeVisible: PropTypes.bool.isRequired,
  setMetronomeVisible: PropTypes.func.isRequired,
  setMetronomeIsPlaying: PropTypes.func.isRequired,
  droneVisible: PropTypes.bool.isRequired,
  setDroneVisible: PropTypes.func.isRequired,
  setDroneIsPlaying: PropTypes.func.isRequired,
  audioMuted: PropTypes.bool.isRequired,
  metronomeVolume: PropTypes.number.isRequired,
  droneVolume: PropTypes.number.isRequired,
  toggleMetronome: PropTypes.func.isRequired,
  toggleDrone: PropTypes.func.isRequired,
  startMuteLongPress: PropTypes.func.isRequired,
  cancelMuteLongPress: PropTypes.func.isRequired,
  handleMutePress: PropTypes.func.isRequired,
};
