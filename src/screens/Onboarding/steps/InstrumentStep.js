/**
 * Instrument Selection Step (Step 1)
 *
 * User selects their instrument family, then specific instrument.
 */

import React from "react";
import PropTypes from "prop-types";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import ResetButton from "../../../components/ResetButton";
import { createShadow } from "../../../styles/theme";
import { instrumentFamilies } from "../data/instruments";
import ProgressDots from "../components/ProgressDots";
import { styles, colors } from "../styles";

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Welcome to Sound First</Text>
        <Text style={styles.subtitle}>
          {!selectedFamily
            ? "What type of instrument do you play?"
            : "Select your instrument"}
        </Text>

        {/* Family Selection */}
        {!selectedFamily && (
          <View style={styles.selectionGrid}>
            {familyNames.map((familyName) => (
              <TouchableOpacity
                key={familyName}
                accessibilityLabel={`Select ${familyName} instruments`}
                accessibilityRole="button"
                onPress={() => onSelectFamily(familyName)}
                style={styles.familyCard}
              >
                <Text style={styles.cardIcon}>
                  {instrumentFamilies[familyName].icon}
                </Text>
                <Text style={styles.cardLabel}>{familyName}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Instrument Selection within Family */}
        {selectedFamily ? (
          <View style={styles.instrumentSelectionContainer}>
            <TouchableOpacity
              accessibilityLabel="Back to instrument families"
              accessibilityRole="button"
              onPress={() => onSelectFamily("")}
              style={styles.backLink}
            >
              <Text style={styles.backLinkText}>{"← Back to families"}</Text>
            </TouchableOpacity>
            <View style={styles.familyBadge}>
              <Text style={styles.familyBadgeIcon}>
                {instrumentFamilies[selectedFamily].icon}
              </Text>
              <Text style={styles.familyBadgeText}>{selectedFamily}</Text>
            </View>
            <View style={styles.selectionGridNarrow}>
              {currentFamilyInstruments.map((inst) => {
                const isSelected = instrument === inst.name;
                return (
                  <TouchableOpacity
                    key={inst.name}
                    accessibilityLabel={`Select ${inst.name}${isSelected ? ", selected" : ""}`}
                    accessibilityRole="button"
                    onPress={() => onSelectInstrument(inst.name)}
                    style={[
                      styles.instrumentCard,
                      isSelected && styles.instrumentCardSelected,
                      createShadow(
                        isSelected ? colors.gold : "#000",
                        0,
                        2,
                        isSelected ? 0.4 : 0.1,
                        8,
                      ),
                    ]}
                  >
                    <Text style={styles.cardIconSmall}>{inst.icon}</Text>
                    <Text
                      style={[
                        styles.cardLabelSmall,
                        isSelected && styles.cardLabelSelected,
                      ]}
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
      <View style={styles.fixedBottomArea}>
        <TouchableOpacity
          accessibilityLabel="Next step"
          accessibilityRole="button"
          disabled={!canProceed}
          onPress={onNext}
          style={[
            styles.primaryButton,
            !canProceed && styles.primaryButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.primaryButtonText,
              !canProceed && styles.primaryButtonTextDisabled,
            ]}
          >
            Next →
          </Text>
        </TouchableOpacity>

        <ProgressDots currentStep={1} />
      </View>
      <ResetButton />

      {/* Admin Button */}
      <TouchableOpacity
        accessibilityLabel="Open admin panel"
        accessibilityRole="button"
        onPress={onNavigateAdmin}
        style={styles.adminButton}
      >
        <Text style={styles.adminButtonText}>Admin</Text>
      </TouchableOpacity>
    </View>
  );
}

InstrumentStep.propTypes = {
  selectedFamily: PropTypes.string,
  instrument: PropTypes.string,
  onSelectFamily: PropTypes.func.isRequired,
  onSelectInstrument: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onNavigateAdmin: PropTypes.func.isRequired,
};
