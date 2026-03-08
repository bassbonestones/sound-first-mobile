/**
 * ToolsPanel - Metronome/Drone toggles, mute button, and tool components
 */
import React from "react";
import { View, Text, TouchableOpacity, Pressable } from "react-native";
import Metronome from "../../../components/Metronome";
import PitchDrone from "../../../components/PitchDrone";

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
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          width: 320,
          marginBottom: 18,
        }}
      >
        {/* Metronome Toggle */}
        <TouchableOpacity
          style={{
            backgroundColor: metronomeEnabled ? "#9C27B0" : "#333",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginRight: 10,
            borderWidth: 1,
            borderColor: metronomeEnabled ? "#9C27B0" : "#555",
          }}
          onPress={toggleMetronome}
        >
          <Text
            style={{
              color: metronomeEnabled ? "#fff" : "#888",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            🥁 Metronome
          </Text>
        </TouchableOpacity>

        {/* Drone Toggle */}
        <TouchableOpacity
          style={{
            backgroundColor: droneEnabled ? "#00BCD4" : "#333",
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 8,
            marginLeft: 10,
            borderWidth: 1,
            borderColor: droneEnabled ? "#00BCD4" : "#555",
          }}
          onPress={toggleDrone}
        >
          <Text
            style={{
              color: droneEnabled ? "#fff" : "#888",
              fontSize: 14,
              fontWeight: "600",
            }}
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
          style={{
            backgroundColor: audioMuted ? "#ff6b6b" : "#333",
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 14 }}>
            {audioMuted ? "🔇 Unmute" : "🔊 Mute"} (hold for volume)
          </Text>
        </Pressable>
      )}

      {/* Metronome Component */}
      {metronomeEnabled && (
        <View
          style={{
            width: 320,
            marginBottom: 18,
            backgroundColor: "#2a2a4a",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#9C27B0",
          }}
        >
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
        <View
          style={{
            width: 320,
            marginBottom: 18,
            backgroundColor: "#2a2a4a",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "#00BCD4",
          }}
        >
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
