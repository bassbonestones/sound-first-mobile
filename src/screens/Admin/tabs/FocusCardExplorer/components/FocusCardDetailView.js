/**
 * FocusCardDetailView - Detail view modal content for focus card
 */
import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import styles from "../../../styles";
import DetailRow from "./DetailRow";

export default function FocusCardDetailView({
  focusCard,
  onClose,
  onEdit,
  onDelete,
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.detailModal}>
        <View style={styles.detailModalHeader}>
          <Text style={styles.detailModalTitle}>{focusCard.name}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailModalContent}>
          <DetailRow label="ID" value={focusCard.id} />
          <DetailRow label="Category" value={focusCard.category || "None"} />
          <DetailRow
            label="Description"
            value={focusCard.description || "None"}
          />
          <DetailRow
            label="Attention Cue"
            value={focusCard.attention_cue || "None"}
          />

          <Text style={styles.detailSectionTitle}>Micro Cues</Text>
          {focusCard.micro_cues?.length > 0 ? (
            focusCard.micro_cues.map((cue, index) => (
              <Text key={index} style={styles.listItemText}>
                • {cue}
              </Text>
            ))
          ) : (
            <Text style={styles.listItemSubtext}>No micro cues defined</Text>
          )}

          <Text style={styles.detailSectionTitle}>Prompts</Text>
          {Object.keys(focusCard.prompts || {}).length > 0 ? (
            Object.entries(focusCard.prompts).map(([key, value]) => (
              <View key={key} style={styles.promptItem}>
                <Text style={styles.promptKey}>{key}:</Text>
                <Text style={styles.promptValue}>{value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.listItemSubtext}>No prompts defined</Text>
          )}
        </ScrollView>

        <View style={styles.detailModalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.modalEditButton]}
            onPress={onEdit}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => setShowDeleteConfirm(true)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>Delete "{focusCard.name}"?</Text>
              <View style={styles.confirmButtons}>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.cancelConfirmButton]}
                  onPress={() => setShowDeleteConfirm(false)}
                >
                  <Text style={styles.confirmButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, styles.deleteConfirmButton]}
                  onPress={onDelete}
                >
                  <Text style={[styles.confirmButtonText, { color: "#fff" }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
