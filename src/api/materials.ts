/**
 * Materials API Service
 *
 * Handles material CRUD operations, analysis, and ingestion.
 */

import { api, baseUrl } from "./client";
import { devLog } from "../utils/devLogger";
import type { PitchEvent } from "./generation";

// ============================================
// Types
// ============================================

export interface MaterialAnalysis {
  title?: string;
  tempo?: number;
  tempo_bpm?: number;
  key_signature?: string;
  time_signature?: string;
  pitch_range?: {
    low: string;
    high: string;
  };
  difficulty?: number;
  capabilities?: string[];
  capabilities_by_domain?: Record<string, string[]>;
  capability_count?: number;
  measure_count?: number;
  detailed_extraction?: Record<string, unknown>;
  soft_gates?: Record<string, unknown>;
  unified_scores?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Material {
  id: number;
  title: string;
  file_path?: string;
  analysis?: MaterialAnalysis;
  created_at?: string;
  updated_at?: string;
}

export interface MaterialsResponse {
  materials: Material[];
}

export interface GateCheckResult {
  material_id: number;
  user_id: number;
  passed: boolean;
  blocked_by?: string[];
  details?: Record<string, unknown>;
}

export interface AnalyzeRequest {
  musicxml_content: string;
  title: string;
}

export interface MaterialUpdate {
  title?: string;
  file_path?: string;
  analysis?: Partial<MaterialAnalysis>;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all materials
 */
export async function getMaterials(): Promise<MaterialsResponse> {
  // Try admin endpoint first, fallback to public
  try {
    const response = await fetch(`${baseUrl}/admin/materials`);
    if (response.ok) {
      return response.json() as Promise<MaterialsResponse>;
    }
  } catch {
    devLog("[materials] Admin endpoint unavailable, using public");
  }

  const response = await fetch(`${baseUrl}/materials`);
  if (!response.ok) {
    throw new Error(`Failed to fetch materials: ${response.status}`);
  }
  return response.json() as Promise<MaterialsResponse>;
}

/**
 * Get a single material by ID
 */
export async function getMaterial(materialId: number): Promise<Material> {
  return api.get<Material>(`/materials/${materialId}`);
}

/**
 * Admin: Get detailed analysis for a material
 */
export async function getMaterialAnalysis(
  materialId: number,
): Promise<MaterialAnalysis> {
  const response = await fetch(
    `${baseUrl}/admin/materials/${materialId}/analysis`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis: ${response.status}`);
  }
  return response.json() as Promise<MaterialAnalysis>;
}

/**
 * Admin: Run soft gate check for a material
 */
export async function getMaterialGateCheck(
  materialId: number,
  userId: number,
): Promise<GateCheckResult> {
  const response = await fetch(
    `${baseUrl}/admin/materials/${materialId}/gate-check?user_id=${userId}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to run gate check: ${response.status}`);
  }
  return response.json() as Promise<GateCheckResult>;
}

/**
 * Analyze a music XML file
 */
export async function analyzeMaterial(
  fileContent: string,
  fileName?: string,
): Promise<MaterialAnalysis> {
  const response = await fetch(`${baseUrl}/materials/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      musicxml_content: fileContent,
      title: fileName || "Untitled",
    } as AnalyzeRequest),
  });
  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }
  return response.json() as Promise<MaterialAnalysis>;
}

/**
 * Reanalyze an existing material
 */
export async function reanalyzeMaterial(
  materialId: number,
): Promise<MaterialAnalysis> {
  const response = await fetch(`${baseUrl}/materials/${materialId}/reanalyze`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Reanalysis failed: ${response.status}`);
  }
  return response.json() as Promise<MaterialAnalysis>;
}

/**
 * Admin: Update material metadata
 */
export async function updateMaterial(
  materialId: number,
  updates: MaterialUpdate,
): Promise<Material> {
  const response = await fetch(`${baseUrl}/admin/materials/${materialId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  return response.json() as Promise<Material>;
}

/**
 * Admin: Delete a material
 */
export async function deleteMaterial(materialId: number): Promise<void> {
  const response = await fetch(`${baseUrl}/admin/materials/${materialId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

// ============================================
// Preview Types
// ============================================

export interface MaterialPreviewFilesResponse {
  files: string[];
  folder: string;
}

export interface MaterialPreviewSoftGates {
  tonal_complexity_stage?: number;
  interval_sustained_stage?: number;
  interval_hazard_stage?: number;
  rhythm_complexity_stage?: number;
  range_usage_stage?: number;
  [key: string]: unknown;
}

export interface MaterialPreviewUnifiedScores {
  tonal_complexity_composite?: number;
  interval_complexity_composite?: number;
  rhythm_complexity_composite?: number;
  range_composite?: number;
  difficulty_index?: number;
  [key: string]: unknown;
}

export interface MaterialPreviewResponse {
  filename: string;
  title: string;
  musicxml_content: string;
  original_key_center: string | null;
  capabilities: string[];
  capabilities_by_domain: Record<string, string[]>;
  capability_count: number;
  range_analysis: Record<string, unknown> | null;
  chromatic_complexity: number | null;
  measure_count: number;
  tempo_bpm: number | null;
  tempo_marking: string | null;
  soft_gates: MaterialPreviewSoftGates;
  unified_scores: MaterialPreviewUnifiedScores;
  playback_events: PitchEvent[];
}

// ============================================
// Preview API Functions
// ============================================

/**
 * List available MusicXML files in the pending materials folder
 */
export async function listPreviewFiles(): Promise<MaterialPreviewFilesResponse> {
  const response = await fetch(`${baseUrl}/materials/preview/files`);
  if (!response.ok) {
    throw new Error(`Failed to list preview files: ${response.status}`);
  }
  return response.json() as Promise<MaterialPreviewFilesResponse>;
}

/**
 * Preview a MusicXML file with full analysis
 */
export async function previewMaterial(
  filename: string,
): Promise<MaterialPreviewResponse> {
  const response = await fetch(
    `${baseUrl}/materials/preview?filename=${encodeURIComponent(filename)}`,
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail =
      (errorData as { detail?: string }).detail || `Status ${response.status}`;
    throw new Error(`Preview failed: ${detail}`);
  }
  return response.json() as Promise<MaterialPreviewResponse>;
}

/**
 * Response from solfège conversion endpoint
 */
export interface SolfegeResponse {
  filename: string;
  solfege_xml: string;
  key_used: string;
}

/**
 * Get solfège version of a MusicXML file
 */
export async function getSolfege(
  filename: string,
  key?: string,
): Promise<SolfegeResponse> {
  let url = `${baseUrl}/materials/preview/solfege?filename=${encodeURIComponent(filename)}`;
  if (key) {
    url += `&key=${encodeURIComponent(key)}`;
  }
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail =
      (errorData as { detail?: string }).detail || `Status ${response.status}`;
    throw new Error(`Solfège conversion failed: ${detail}`);
  }
  return response.json() as Promise<SolfegeResponse>;
}

export default {
  getMaterials,
  getMaterial,
  getMaterialAnalysis,
  getMaterialGateCheck,
  analyzeMaterial,
  reanalyzeMaterial,
  updateMaterial,
  deleteMaterial,
  listPreviewFiles,
  previewMaterial,
  getSolfege,
};
