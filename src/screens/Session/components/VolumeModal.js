/**
 * VolumeModal - Volume control modal for metronome and drone
 */
import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import Slider from "@react-native-community/slider";
import { styles, colors } from "./styles";

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
      <View style={styles.modalBackdrop}>
        <View style={styles.volumeModalContainer}>
          <Text style={styles.volumeModalTitle}>Volume Control</Text>

          {/* Metronome Volume */}
          <View style={styles.volumeSection}>
            <Text style={styles.volumeLabelMetronome}>
              🥁 Metronome: {Math.round(metronomeVolume * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={metronomeVolume}
              onValueChange={setMetronomeVolume}
              minimumTrackTintColor={colors.metronome}
              maximumTrackTintColor="#444"
              thumbTintColor={colors.metronome}
            />
          </View>

          {/* Drone Volume */}
          <View style={styles.volumeSection}>
            <Text style={styles.volumeLabelDrone}>
              🎶 Drone: {Math.round(droneVolume * 100)}%
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={droneVolume}
              onValueChange={setDroneVolume}
              minimumTrackTintColor={colors.drone}
              maximumTrackTintColor="#444"
              thumbTintColor={colors.drone}
            />
          </View>

          {/* Close Button */}
          <TouchableOpacity onPress={onClose} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
