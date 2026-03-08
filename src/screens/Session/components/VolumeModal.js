/**
 * VolumeModal - Volume control modal for metronome and drone
 */
import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Slider from "@react-native-community/slider";

export default function VolumeModal({
  visible,
  onClose,
  metronomeVolume,
  setMetronomeVolume,
  droneVolume,
  setDroneVolume,
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "#2a2a4a",
            borderRadius: 16,
            padding: 24,
            width: "100%",
            maxWidth: 320,
          }}
        >
          <Text
            style={{
              color: "#FFD700",
              fontSize: 18,
              fontWeight: "bold",
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            Volume Control
          </Text>

          {/* Metronome Volume */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#9C27B0",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              🥁 Metronome: {Math.round(metronomeVolume * 100)}%
            </Text>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={0}
              maximumValue={1}
              value={metronomeVolume}
              onValueChange={setMetronomeVolume}
              minimumTrackTintColor="#9C27B0"
              maximumTrackTintColor="#444"
              thumbTintColor="#9C27B0"
            />
          </View>

          {/* Drone Volume */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                color: "#00BCD4",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              🎶 Drone: {Math.round(droneVolume * 100)}%
            </Text>
            <Slider
              style={{ width: "100%", height: 40 }}
              minimumValue={0}
              maximumValue={1}
              value={droneVolume}
              onValueChange={setDroneVolume}
              minimumTrackTintColor="#00BCD4"
              maximumTrackTintColor="#444"
              thumbTintColor="#00BCD4"
            />
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#FFD700",
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{ color: "#1a1a2e", fontWeight: "bold", fontSize: 16 }}
            >
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
