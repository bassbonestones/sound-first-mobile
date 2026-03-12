/**
 * AdminScreen - Internal Admin Surface for Sound First
 *
 * Six sections:
 * 1. Capability Explorer - Browse/filter/inspect capabilities
 * 2. Material Explorer - Browse materials with analysis data
 * 3. Focus Card Explorer - Manage focus cards
 * 4. Soft Gate Explorer - Manage soft gate rules
 * 5. User Progression Inspector - View user mastery state
 * 6. Session Diagnostics - Debug session generation
 */

import React, { useState } from "react";
import PropTypes from "prop-types";
import { View, Text, TouchableOpacity } from "react-native";
import ErrorBoundary from "../../components/ErrorBoundary";
import ResetButton from "../../components/ResetButton";
import {
  CapabilityExplorer,
  MaterialExplorer,
  FocusCardExplorer,
  SoftGateExplorer,
  UserProgressionInspector,
  SessionDiagnostics,
  EngineSettings,
} from "./tabs";
import styles from "./styles";

// Tab navigation
const TABS = [
  { id: "capabilities", label: "Capabilities" },
  { id: "materials", label: "Materials" },
  { id: "focus_cards", label: "Focus Cards" },
  { id: "soft_gates", label: "Soft Gates" },
  { id: "users", label: "User Progress" },
  { id: "engine", label: "Engine" },
  { id: "sessions", label: "Session Diag" },
];

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("capabilities");

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Console</Text>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              accessibilityLabel={`${tab.label} tab`}
              accessibilityRole="button"
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === "capabilities" && <CapabilityExplorer />}
          {activeTab === "materials" && <MaterialExplorer />}
          {activeTab === "focus_cards" && <FocusCardExplorer />}
          {activeTab === "soft_gates" && <SoftGateExplorer />}
          {activeTab === "users" && <UserProgressionInspector />}
          {activeTab === "engine" && <EngineSettings />}
          {activeTab === "sessions" && <SessionDiagnostics />}
        </View>

        {/* Dev Menu - at root level so overlay covers everything */}
        <ResetButton />
      </View>
    </ErrorBoundary>
  );
}

AdminScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    goBack: PropTypes.func,
  }),
};
