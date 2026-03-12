/**
 * SoftGateExplorer - Soft gate rules management
 * Part of Admin console
 */
import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import styles from "../../styles";
import SoftGateRulesList from "./components/SoftGateRulesList";
import UserSoftGateStateView from "./components/UserSoftGateStateView";

function SoftGateExplorer() {
  const [activeSection, setActiveSection] = useState("rules");

  return (
    <View style={styles.section}>
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          accessibilityLabel="View rules"
          accessibilityRole="button"
          style={[
            styles.subTab,
            activeSection === "rules" && styles.subTabActive,
          ]}
          onPress={() => setActiveSection("rules")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSection === "rules" && styles.subTabTextActive,
            ]}
          >
            Rules
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="View user state"
          accessibilityRole="button"
          style={[
            styles.subTab,
            activeSection === "user_state" && styles.subTabActive,
          ]}
          onPress={() => setActiveSection("user_state")}
        >
          <Text
            style={[
              styles.subTabText,
              activeSection === "user_state" && styles.subTabTextActive,
            ]}
          >
            User State
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === "rules" && <SoftGateRulesList />}
      {activeSection === "user_state" && <UserSoftGateStateView />}
    </View>
  );
}

export default SoftGateExplorer;
