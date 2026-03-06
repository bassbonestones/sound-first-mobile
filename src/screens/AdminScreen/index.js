/**
 * AdminScreen/index.js - Admin Console with tabbed navigation
 * 
 * This is the main entry point for the Admin screen. 
 * Each tab section is now in its own file for maintainability.
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { adminStyles as styles } from "../../styles/admin.styles";
import ResetButton from "../../components/ResetButton";

// Tab content components
import CapabilityExplorer from "./explorers/CapabilityExplorer";
import MaterialExplorer from "./explorers/MaterialExplorer";
import FocusCardExplorer from "./explorers/FocusCardExplorer";
import SoftGateExplorer from "./explorers/SoftGateExplorer";
import UserProgressInspector from "./explorers/UserProgressInspector";
import SessionDiagnostics from "./explorers/SessionDiagnostics";

const TABS = [
  { id: "capabilities", label: "Capabilities" },
  { id: "materials", label: "Materials" },
  { id: "focus_cards", label: "Focus Cards" },
  { id: "soft_gates", label: "Soft Gates" },
  { id: "users", label: "User Progress" },
  { id: "sessions", label: "Session Diag" },
];

export default function AdminScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState("capabilities");

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Console</Text>
        <ResetButton />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === "capabilities" && <CapabilityExplorer />}
        {activeTab === "materials" && <MaterialExplorer />}
        {activeTab === "focus_cards" && <FocusCardExplorer />}
        {activeTab === "soft_gates" && <SoftGateExplorer />}
        {activeTab === "users" && <UserProgressInspector />}
        {activeTab === "sessions" && <SessionDiagnostics />}
      </View>
    </View>
  );
}
