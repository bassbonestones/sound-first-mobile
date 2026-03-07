/**
 * Instrument Selection Step (Step 1)
 *
 * User selects their instrument family, then specific instrument.
 */

import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import ResetButton from "../../../components/ResetButton";
import { createShadow } from "../../../styles/theme";
import { instrumentFamilies } from "../data/instruments";
import ProgressDots from "../components/ProgressDots";

export default function InstrumentStep({
  selectedFamily,
  instrument,
  onSelectFamily,
  onSelectInstrument,
  onNext,
  onNavigateAdmin,
}) {
  const familyNames = Object.keys(instrumentFamilies);
  const currentFamilyInstruments = selectedFamily
    ? instrumentFamilies[selectedFamily].instruments
    : [];
  const canProceed = !!instrument;

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "center",
          padding: 24,
          paddingBottom: 180,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: 8,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            textAlign: "center",
            marginTop: 40,
          }}
        >
          Welcome to Sound First
        </Text>
        <Text
          style={{
            color: "#e6cfa7",
            fontSize: 18,
            marginBottom: 24,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
            textAlign: "center",
          }}
        >
          {!selectedFamily
            ? "What type of instrument do you play?"
            : "Select your instrument"}
        </Text>

        {/* Family Selection */}
        {!selectedFamily && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 450,
            }}
          >
            {familyNames.map((familyName) => (
              <TouchableOpacity
                key={familyName}
                onPress={() => onSelectFamily(familyName)}
                style={{
                  backgroundColor: "#3b2c1a",
                  borderRadius: 16,
                  padding: 16,
                  margin: 8,
                  borderWidth: 2,
                  borderColor: "#bfa76a",
                  width: 120,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 36, marginBottom: 4 }}>
                  {instrumentFamilies[familyName].icon}
                </Text>
                <Text
                  style={{
                    color: "#FFD700",
                    fontWeight: "bold",
                    fontSize: 14,
                    textAlign: "center",
                    fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
                  }}
                >
                  {familyName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Instrument Selection within Family */}
        {selectedFamily ? (
          <View style={{ alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => onSelectFamily("")}
              style={{ marginBottom: 16 }}
            >
              <Text style={{ color: "#bfa76a", fontSize: 14 }}>
                {"← Back to families"}
              </Text>
            </TouchableOpacity>
            <View
              style={{
                backgroundColor: "#2a1f12",
                borderRadius: 12,
                padding: 8,
                marginBottom: 16,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 24, marginRight: 8 }}>
                {instrumentFamilies[selectedFamily].icon}
              </Text>
              <Text
                style={{ color: "#FFD700", fontSize: 18, fontWeight: "bold" }}
              >
                {selectedFamily}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "center",
                maxWidth: 400,
              }}
            >
              {currentFamilyInstruments.map((inst) => {
                const isSelected = instrument === inst.name;
                return (
                  <TouchableOpacity
                    key={inst.name}
                    onPress={() => onSelectInstrument(inst.name)}
                    style={{
                      backgroundColor: isSelected ? "#FFD700" : "#3b2c1a",
                      borderRadius: 16,
                      padding: 16,
                      margin: 8,
                      borderWidth: 2,
                      borderColor: isSelected ? "#FFD700" : "#bfa76a",
                      width: 110,
                      alignItems: "center",
                      ...createShadow(
                        isSelected ? "#FFD700" : "#000",
                        0,
                        2,
                        isSelected ? 0.4 : 0.1,
                        8,
                      ),
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 4 }}>
                      {inst.icon}
                    </Text>
                    <Text
                      style={{
                        color: isSelected ? "#3b2c1a" : "#FFD700",
                        fontWeight: "bold",
                        fontSize: 11,
                        textAlign: "center",
                        fontFamily:
                          Platform.OS === "ios" ? "Baskerville" : "serif",
                      }}
                    >
                      {inst.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Fixed bottom area with button and progress dots */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 24,
          paddingBottom: 40,
          alignItems: "center",
          backgroundColor: "#1a1410",
        }}
      >
        <TouchableOpacity
          disabled={!canProceed}
          onPress={onNext}
          style={{
            backgroundColor: canProceed ? "#FFD700" : "#5a4a2a",
            borderRadius: 28,
            paddingVertical: 16,
            paddingHorizontal: 48,
            opacity: canProceed ? 1 : 0.5,
          }}
        >
          <Text
            style={{
              color: canProceed ? "#3b2c1a" : "#8a7a5a",
              fontWeight: "bold",
              fontSize: 18,
            }}
          >
            Next →
          </Text>
        </TouchableOpacity>

        <ProgressDots currentStep={1} />
      </View>
      <ResetButton />

      {/* Admin Button */}
      <TouchableOpacity
        onPress={onNavigateAdmin}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          backgroundColor: "#3b2c1a",
          borderRadius: 8,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: "#FFD700",
        }}
      >
        <Text style={{ color: "#FFD700", fontSize: 12 }}>Admin</Text>
      </TouchableOpacity>
    </View>
  );
}
