/**
 * UserCandidatesTab - View eligible/ineligible materials and available modules
 */
import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { baseUrl } from "../../../../api/client";
import { devError } from "../../../../utils/devLogger";
import styles from "../../styles";

interface Material {
  title: string;
  eligibility_reason?: string;
  ineligibility_reason?: string;
}

interface TeachingModule {
  display_name: string;
  capability_name: string;
  status: string;
  lessons_completed?: number;
  lesson_count?: number;
  prerequisite_capability_names?: string[];
}

interface CandidatesData {
  eligible_materials?: Material[];
  ineligible_sample?: Material[];
}

interface UserCandidatesTabProps {
  userId: string;
}

export function UserCandidatesTab({ userId }: UserCandidatesTabProps) {
  const [candidates, setCandidates] = useState<CandidatesData | null>(null);
  const [availableModules, setAvailableModules] = useState<TeachingModule[]>(
    [],
  );
  const [loading, setLoading] = useState(false);

  const loadCandidates = async () => {
    setLoading(true);
    try {
      // Load material candidates
      const response = await fetch(
        `${baseUrl}/admin/users/${userId}/session-candidates`,
      );
      if (response.ok) {
        const data = await response.json();
        setCandidates(data);
      }

      // Load available teaching modules
      const modulesResponse = await fetch(
        `${baseUrl}/modules/user/${userId}/available`,
      );
      if (modulesResponse.ok) {
        const modulesData = await modulesResponse.json();
        setAvailableModules(modulesData);
      }
    } catch (err) {
      devError("[AdminScreen] Load candidates error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCandidates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  }

  return (
    <View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Available Teaching Modules
        </Text>
        {availableModules?.length > 0 ? (
          <>
            <Text style={styles.candidateCount}>
              {availableModules.length} modules available
            </Text>
            {availableModules.map((mod, idx) => (
              <View key={idx} style={styles.candidateItem}>
                <Text style={styles.candidateTitle}>{mod.display_name}</Text>
                <Text style={styles.candidateReason}>
                  {mod.capability_name} •{" "}
                  {mod.status === "not_started"
                    ? "Not started"
                    : mod.status === "in_progress"
                      ? `In progress (${mod.lessons_completed}/${mod.lesson_count})`
                      : mod.status}
                </Text>
                {(mod.prerequisite_capability_names?.length ?? 0) > 0 && (
                  <Text style={styles.candidateReason}>
                    Prereqs: {mod.prerequisite_capability_names?.join(", ")}
                  </Text>
                )}
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>
            No teaching modules available (check prerequisites)
          </Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Candidate Pool for Next Session
        </Text>
        {(candidates?.eligible_materials?.length ?? 0) > 0 ? (
          <>
            <Text style={styles.candidateCount}>
              {candidates?.eligible_materials?.length} eligible materials
            </Text>
            {candidates?.eligible_materials?.slice(0, 15).map((mat, idx) => (
              <View key={idx} style={styles.candidateItem}>
                <Text style={styles.candidateTitle}>{mat.title}</Text>
                <Text style={styles.candidateReason}>
                  {mat.eligibility_reason || "Passes all gates"}
                </Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.noDataText}>No eligible materials</Text>
        )}
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>
          Ineligible Materials (Sample)
        </Text>
        {(candidates?.ineligible_sample?.length ?? 0) > 0 ? (
          candidates?.ineligible_sample?.slice(0, 10).map((mat, idx) => (
            <View key={idx} style={styles.candidateItem}>
              <Text style={styles.candidateTitle}>{mat.title}</Text>
              <Text style={styles.candidateReasonFail}>
                ✗ {mat.ineligibility_reason}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noDataText}>No sample available</Text>
        )}
      </View>
    </View>
  );
}

export default UserCandidatesTab;
