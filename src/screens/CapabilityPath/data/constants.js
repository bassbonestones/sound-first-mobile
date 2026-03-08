/**
 * Constants for Capability Path screen
 */

export const CATEGORIES = [
  "Fundamentals",
  "Clefs",
  "Time Signatures",
  "Key Signatures",
  "Note Values",
  "Rests",
  "Melodic Intervals Asc",
  "Melodic Intervals Desc",
  "Harmonic Intervals",
  "Dynamics",
  "Dynamic Changes",
  "Articulations",
  "Ornaments",
  "Tempo Terms",
  "Expression Terms",
  "Repeat Structures",
  "Tuplets",
  "Other Notation",
];

export const TYPE_OPTIONS = [
  { label: "P - Prerequisite", value: "P" },
  { label: "T - Teachable in Context", value: "T" },
];

export const STORAGE_KEY = "@capability_path_data";

export const DEFAULT_NEW_ITEM = {
  capability: "",
  display_name: "",
  category: "Fundamentals",
  teaching_order: 999,
  type: "P",
  mastery_count: 1,
  teaching_materials: "",
  notes: "",
};
