/**
 * Materials API Service
 *
 * Handles material CRUD operations, analysis, and ingestion.
 */

import { api, baseUrl } from "./client";
import { devLog } from "../utils/devLogger";

// ============================================
// Types
// ============================================

export interface MaterialAnalysis {
  tempo?: number;
  key_signature?: string;
  time_signature?: string;
  pitch_range?: {
    low: string;
    high: string;
  };
  difficulty?: number;
  capabilities?: string[];
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
  file_content: string;
  file_name?: string;
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
      file_content: fileContent,
      file_name: fileName,
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

export default {
  getMaterials,
  getMaterial,
  getMaterialAnalysis,
  getMaterialGateCheck,
  analyzeMaterial,
  reanalyzeMaterial,
  updateMaterial,
  deleteMaterial,
};
