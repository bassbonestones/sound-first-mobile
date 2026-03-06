import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import ResetButton from "../components/ResetButton";
import { baseUrl } from "../src/api/client";

function getBackendUrl(endpoint) {
  return `${baseUrl}/${endpoint}`;
}

// Mastery level colors
const MASTERY_COLORS = {
  new: "#666",
  learning: "#FF9800",
  stabilizing: "#2196F3",
  familiar: "#4CAF50",
  mastered: "#FFD700",
};

export default function HistoryScreen() {
  const [summary, setSummary] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [focusCards, setFocusCards] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");

  useEffect(() => {
    Promise.all([
      fetch(getBackendUrl("history/summary?user_id=1")).then((r) => r.json()),
      fetch(getBackendUrl("history/materials?user_id=1")).then((r) => r.json()),
      fetch(getBackendUrl("history/focus-cards?user_id=1")).then((r) =>
        r.json(),
      ),
      fetch(getBackendUrl("history/timeline?user_id=1&days=30")).then((r) =>
        r.json(),
      ),
    ])
      .then(([summaryData, materialsData, focusCardsData, timelineData]) => {
        setSummary(summaryData);
        setMaterials(materialsData);
        setFocusCards(focusCardsData);
        setTimeline(timelineData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("History load error:", err);
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <ActivityIndicator
        size="large"
        style={{ flex: 1, backgroundColor: "#1a1410" }}
      />
    );

  const TabButton = ({ name, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(name)}
      style={{
        backgroundColor: activeTab === name ? "#FFD700" : "#3b2c1a",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: activeTab === name ? "#3b2c1a" : "#FFD700",
          fontWeight: "bold",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1410" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          backgroundColor: "#1a1410",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#FFD700",
            marginBottom: 16,
            fontFamily: Platform.OS === "ios" ? "Baskerville" : "serif",
          }}
        >
          Practice History
        </Text>

        {/* Tab Navigation */}
        <View
          style={{ flexDirection: "row", marginBottom: 20, flexWrap: "wrap" }}
        >
          <TabButton name="summary" label="Summary" />
          <TabButton name="materials" label="Materials" />
          <TabButton name="focus" label="Focus Cards" />
          <TabButton name="timeline" label="Timeline" />
        </View>

        {/* Summary Tab */}
        {activeTab === "summary" && summary && (
          <View>
            {/* Stats Cards */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <StatCard label="Sessions" value={summary.total_sessions} />
              <StatCard label="Attempts" value={summary.total_attempts} />
              <StatCard
                label="Streak"
                value={`${summary.current_streak_days} days`}
              />
              <StatCard
                label="Avg Rating"
                value={summary.average_rating.toFixed(1)}
              />
            </View>

            {/* Spaced Repetition Stats */}
            <Text
              style={{
                color: "#FFD700",
                fontSize: 18,
                fontWeight: "bold",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Spaced Repetition
            </Text>
            <View
              style={{
                backgroundColor: "#3b2c1a",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: "#FFD700",
              }}
            >
              <StatRow
                label="Due Today"
                value={summary.spaced_repetition.due_today}
              />
              <StatRow
                label="Overdue"
                value={summary.spaced_repetition.overdue}
                highlight={summary.spaced_repetition.overdue > 0}
              />
              <StatRow
                label="New Items"
                value={summary.spaced_repetition.never_reviewed}
              />
              <StatRow
                label="Learning"
                value={summary.spaced_repetition.short_interval_count}
              />
              <StatRow
                label="Stabilizing"
                value={summary.spaced_repetition.medium_interval_count}
              />
              <StatRow
                label="Mastered"
                value={summary.spaced_repetition.long_interval_count}
              />
            </View>
          </View>
        )}

        {/* Materials Tab */}
        {activeTab === "materials" && (
          <FlatList
            data={materials}
            scrollEnabled={false}
            keyExtractor={(item) => item.material_id.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#3b2c1a",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: item.is_due ? "#FF9800" : "#5a4a3a",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFD700",
                      fontWeight: "bold",
                      fontSize: 16,
                      flex: 1,
                    }}
                  >
                    {item.material_title}
                  </Text>
                  <View
                    style={{
                      backgroundColor:
                        MASTERY_COLORS[item.mastery_level] || "#666",
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: "bold",
                      }}
                    >
                      {item.mastery_level?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={{ marginTop: 8 }}>
                  <Text style={{ color: "#fffbe6", fontSize: 13 }}>
                    Practiced {item.attempt_count}x • Avg:{" "}
                    {item.average_rating || "—"} • Interval:{" "}
                    {item.interval_days}d
                  </Text>
                  {item.is_due && (
                    <Text
                      style={{ color: "#FF9800", fontSize: 12, marginTop: 4 }}
                    >
                      ⚡ Due for review
                    </Text>
                  )}
                </View>
              </View>
            )}
          />
        )}

        {/* Focus Cards Tab */}
        {activeTab === "focus" && (
          <FlatList
            data={focusCards}
            scrollEnabled={false}
            keyExtractor={(item) => item.focus_card_id.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#3b2c1a",
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#5a4a3a",
                }}
              >
                <Text
                  style={{ color: "#FFD700", fontWeight: "bold", fontSize: 16 }}
                >
                  {item.focus_card_name}
                </Text>
                <Text
                  style={{ color: "#bfa76a", fontSize: 12, marginBottom: 4 }}
                >
                  {item.category}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <Text style={{ color: "#fffbe6", fontSize: 13 }}>
                    {item.attempt_count} attempts • Avg:{" "}
                    {item.average_rating || "—"} •
                  </Text>
                  <Text
                    style={{
                      color:
                        item.recent_trend === "improving"
                          ? "#4CAF50"
                          : item.recent_trend === "declining"
                            ? "#f44336"
                            : "#fffbe6",
                      fontSize: 13,
                      marginLeft: 4,
                    }}
                  >
                    {item.recent_trend === "improving"
                      ? "↗ Improving"
                      : item.recent_trend === "declining"
                        ? "↘ Declining"
                        : "→ Stable"}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <View>
            <Text style={{ color: "#fffbe6", fontSize: 14, marginBottom: 12 }}>
              Last 30 days of practice
            </Text>
            {timeline.length === 0 ? (
              <Text style={{ color: "#bfa76a", fontStyle: "italic" }}>
                No practice data yet
              </Text>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {timeline.map((day) => (
                  <View
                    key={day.date}
                    style={{
                      backgroundColor:
                        day.attempts > 0
                          ? `rgba(255, 215, 0, ${Math.min(day.attempts / 5, 1)})`
                          : "#2d232e",
                      width: 32,
                      height: 32,
                      margin: 2,
                      borderRadius: 4,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: day.attempts > 0 ? "#3b2c1a" : "#666",
                        fontSize: 10,
                      }}
                    >
                      {day.attempts || ""}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Daily breakdown list */}
            <View style={{ marginTop: 20 }}>
              {timeline
                .slice()
                .reverse()
                .slice(0, 7)
                .map((day) => (
                  <View
                    key={day.date}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: "#3b2c1a",
                    }}
                  >
                    <Text style={{ color: "#fffbe6" }}>{day.date}</Text>
                    <Text style={{ color: "#FFD700" }}>
                      {day.attempts} attempts • Rating: {day.avg_rating}
                    </Text>
                  </View>
                ))}
            </View>
          </View>
        )}
      </ScrollView>
      <ResetButton />
    </View>
  );
}

// Helper Components
function StatCard({ label, value }) {
  return (
    <View
      style={{
        backgroundColor: "#3b2c1a",
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        marginBottom: 12,
        minWidth: 80,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#5a4a3a",
      }}
    >
      <Text style={{ color: "#FFD700", fontSize: 24, fontWeight: "bold" }}>
        {value}
      </Text>
      <Text style={{ color: "#bfa76a", fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function StatRow({ label, value, highlight }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: "#fffbe6" }}>{label}</Text>
      <Text
        style={{ color: highlight ? "#FF9800" : "#FFD700", fontWeight: "bold" }}
      >
        {value}
      </Text>
    </View>
  );
}
