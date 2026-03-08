/**
 * Materials API Service
 *
 * Handles material CRUD operations, analysis, and ingestion.
 */

import { api, baseUrl } from "./client";

/**
 * @typedef {Object} Material
 * @property {number} id - Material ID
 * @property {string} title - Material title
 * @property {string} file_path - Path to music XML file
 * @property {Object} analysis - Analysis data
 */

/**
 * Get all materials
 * @returns {Promise<{materials: Material[]}>} List of materials
 */
export async function getMaterials() {
  // Try admin endpoint first, fallback to public
  try {
    const response = await fetch(`${baseUrl}/admin/materials`);
    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    console.log("[materials] Admin endpoint unavailable, using public");
  }

  const response = await fetch(`${baseUrl}/materials`);
  if (!response.ok) {
    throw new Error(`Failed to fetch materials: ${response.status}`);
  }
  return response.json();
}

/**
 * Get a single material by ID
 * @param {number} materialId - Material ID
 * @returns {Promise<Material>} Material with full details
 */
export async function getMaterial(materialId) {
  return api.get(`/materials/${materialId}`);
}

/**
 * Admin: Get detailed analysis for a material
 * @param {number} materialId - Material ID
 * @returns {Promise<Object>} Full analysis data
 */
export async function getMaterialAnalysis(materialId) {
  const response = await fetch(
    `${baseUrl}/admin/materials/${materialId}/analysis`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch analysis: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Run soft gate check for a material
 * @param {number} materialId - Material ID
 * @param {number} userId - User ID to check against
 * @returns {Promise<Object>} Gate check results
 */
export async function getMaterialGateCheck(materialId, userId) {
  const response = await fetch(
    `${baseUrl}/admin/materials/${materialId}/gate-check?user_id=${userId}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to run gate check: ${response.status}`);
  }
  return response.json();
}

/**
 * Analyze a music XML file
 * @param {string} fileContent - XML file content
 * @param {string} [fileName] - Optional file name
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeMaterial(fileContent, fileName) {
  const response = await fetch(`${baseUrl}/materials/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_content: fileContent,
      file_name: fileName,
    }),
  });
  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Reanalyze an existing material
 * @param {number} materialId - Material ID
 * @returns {Promise<Object>} Updated analysis
 */
export async function reanalyzeMaterial(materialId) {
  const response = await fetch(`${baseUrl}/materials/${materialId}/reanalyze`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(`Reanalysis failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Update material metadata
 * @param {number} materialId - Material ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Material>} Updated material
 */
export async function updateMaterial(materialId, updates) {
  const response = await fetch(`${baseUrl}/admin/materials/${materialId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Delete a material
 * @param {number} materialId - Material ID
 * @returns {Promise<void>}
 */
export async function deleteMaterial(materialId) {
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
