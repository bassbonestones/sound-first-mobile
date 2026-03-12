/**
 * useMaterials - Hook for material CRUD operations
 * Extracted from MaterialExplorer for reusability
 */
import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../../../api/client";
import { devError } from "../../../../../utils/devLogger";

/**
 * Hook for managing materials data and operations
 * @returns {Object} Materials state and API functions
 */
export function useMaterials() {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [ingesting, setIngesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Load materials on mount
  useEffect(() => {
    loadMaterials();
  }, []);

  // Filter materials when search query or materials change
  useEffect(() => {
    filterMaterials();
  }, [searchQuery, materials]);

  /**
   * Load all materials from API
   */
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/materials`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data.materials || []);
      } else {
        // Fallback to public endpoint
        const fallback = await fetch(`${baseUrl}/materials`);
        const data = await fallback.json();
        setMaterials(data.materials || []);
      }
    } catch (err) {
      devError("[useMaterials] Load error:", err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Filter materials based on search query
   */
  const filterMaterials = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMaterials(
        materials.filter(
          (m) =>
            m.title?.toLowerCase().includes(query) ||
            m.file_path?.toLowerCase().includes(query),
        ),
      );
    }
  }, [searchQuery, materials]);

  /**
   * Fetch detailed analysis for a material
   * @param {Object} material - Material to fetch details for
   * @returns {Object|null} Material with analysis or null on error
   */
  const fetchMaterialDetail = async (material) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/materials/${material.id}/analysis`,
      );
      if (response.ok) {
        const analysis = await response.json();
        return { ...material, analysis };
      }
      return material;
    } catch (err) {
      devError("[useMaterials] Detail fetch error:", err);
      return material;
    }
  };

  /**
   * Trigger re-analysis for a material
   * @param {number} materialId - Material ID to analyze
   * @returns {boolean} Success status
   */
  const triggerAnalysis = async (materialId) => {
    try {
      const response = await fetch(
        `${baseUrl}/materials/${materialId}/reanalyze`,
        { method: "POST" },
      );
      if (response.ok) {
        // Refresh materials list
        await loadMaterials();
        return true;
      }
      return false;
    } catch (err) {
      devError("[useMaterials] Analysis trigger error:", err);
      return false;
    }
  };

  /**
   * Batch ingest materials from filesystem
   * @param {boolean} analyzeAll - Whether to analyze all or just new
   * @returns {Object} Result with counts
   */
  const handleBatchIngest = async (analyzeAll = false) => {
    setIngesting(true);
    setActionStatus(null);
    try {
      const response = await fetch(`${baseUrl}/materials/ingest-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyze_all: analyzeAll }),
      });
      if (response.ok) {
        const data = await response.json();
        const msg = `Ingested ${data.new_count || 0} new, updated ${data.updated_count || 0}`;
        setActionStatus({ type: "success", message: msg });
        await loadMaterials();
        return { success: true, ...data };
      } else {
        const errText = await response.text();
        setActionStatus({
          type: "error",
          message: `Ingest failed: ${errText}`,
        });
        return { success: false, error: errText };
      }
    } catch (err) {
      setActionStatus({ type: "error", message: err.message });
      return { success: false, error: err.message };
    } finally {
      setIngesting(false);
    }
  };

  /**
   * Export materials to JSON file
   * @returns {Object} Result with filepath or error
   */
  const handleExportToJson = async () => {
    setExporting(true);
    setActionStatus(null);
    try {
      const response = await fetch(`${baseUrl}/materials/export-json`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok) {
        setActionStatus({
          type: "success",
          message: `Exported to ${data.filepath}`,
        });
        return { success: true, filepath: data.filepath };
      } else {
        setActionStatus({
          type: "error",
          message: data.detail || "Export failed",
        });
        return { success: false, error: data.detail };
      }
    } catch (err) {
      setActionStatus({ type: "error", message: err.message });
      return { success: false, error: err.message };
    } finally {
      setExporting(false);
    }
  };

  /**
   * Delete a material
   * @param {number} materialId - Material ID to delete
   * @returns {boolean} Success status
   */
  const deleteMaterial = async (materialId) => {
    try {
      const response = await fetch(`${baseUrl}/admin/materials/${materialId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadMaterials();
        return true;
      }
      return false;
    } catch (err) {
      devError("[useMaterials] Delete error:", err);
      return false;
    }
  };

  return {
    // State
    materials,
    filteredMaterials,
    loading,
    searchQuery,
    selectedMaterial,
    ingesting,
    exporting,
    actionStatus,

    // Setters
    setSearchQuery,
    setSelectedMaterial,
    setActionStatus,

    // Actions
    loadMaterials,
    fetchMaterialDetail,
    triggerAnalysis,
    handleBatchIngest,
    handleExportToJson,
    deleteMaterial,
  };
}

export default useMaterials;
