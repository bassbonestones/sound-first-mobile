/**
 * useMaterials - Hook for material CRUD operations
 * Extracted from MaterialExplorer for reusability
 */
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { baseUrl } from "../../../../../api/client";
import { devError } from "../../../../../utils/devLogger";
import type {
  Material,
  MaterialAnalysisDetail,
} from "../../../../../types/material";

/** Material with optional analysis data */
export interface MaterialWithAnalysis extends Material {
  file_path?: string;
  analysis?: MaterialAnalysisDetail;
}

/** Action status for UI feedback */
export interface ActionStatus {
  type: "success" | "error";
  message: string;
}

/** Result of batch ingest operation */
export interface BatchIngestResult {
  success: boolean;
  new_count?: number;
  updated_count?: number;
  error?: string;
}

/** Result of export operation */
export interface ExportResult {
  success: boolean;
  filepath?: string;
  error?: string;
}

/** Return type for useMaterials hook */
export interface UseMaterialsReturn {
  // State
  materials: MaterialWithAnalysis[];
  filteredMaterials: MaterialWithAnalysis[];
  loading: boolean;
  searchQuery: string;
  selectedMaterial: MaterialWithAnalysis | null;
  ingesting: boolean;
  exporting: boolean;
  actionStatus: ActionStatus | null;

  // Setters
  setSearchQuery: Dispatch<SetStateAction<string>>;
  setSelectedMaterial: Dispatch<SetStateAction<MaterialWithAnalysis | null>>;
  setActionStatus: Dispatch<SetStateAction<ActionStatus | null>>;

  // Actions
  loadMaterials: () => Promise<void>;
  fetchMaterialDetail: (
    material: MaterialWithAnalysis,
  ) => Promise<MaterialWithAnalysis>;
  triggerAnalysis: (materialId: number) => Promise<boolean>;
  handleBatchIngest: (analyzeAll?: boolean) => Promise<BatchIngestResult>;
  handleExportToJson: () => Promise<ExportResult>;
  deleteMaterial: (materialId: number) => Promise<boolean>;
}

/**
 * Hook for managing materials data and operations
 * @returns Object containing materials state and API functions
 */
export function useMaterials(): UseMaterialsReturn {
  const [materials, setMaterials] = useState<MaterialWithAnalysis[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<
    MaterialWithAnalysis[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] =
    useState<MaterialWithAnalysis | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionStatus, setActionStatus] = useState<ActionStatus | null>(null);

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
  const loadMaterials = async (): Promise<void> => {
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
  const filterMaterials = useCallback((): void => {
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
   * @param material - Material to fetch details for
   * @returns Material with analysis or original on error
   */
  const fetchMaterialDetail = async (
    material: MaterialWithAnalysis,
  ): Promise<MaterialWithAnalysis> => {
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
   * @param materialId - Material ID to analyze
   * @returns Success status
   */
  const triggerAnalysis = async (materialId: number): Promise<boolean> => {
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
   * @param analyzeAll - Whether to analyze all or just new
   * @returns Result with counts
   */
  const handleBatchIngest = async (
    analyzeAll = false,
  ): Promise<BatchIngestResult> => {
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
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setActionStatus({ type: "error", message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setIngesting(false);
    }
  };

  /**
   * Export materials to JSON file
   * @returns Result with filepath or error
   */
  const handleExportToJson = async (): Promise<ExportResult> => {
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
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setActionStatus({ type: "error", message: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setExporting(false);
    }
  };

  /**
   * Delete a material
   * @param materialId - Material ID to delete
   * @returns Success status
   */
  const deleteMaterial = async (materialId: number): Promise<boolean> => {
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
