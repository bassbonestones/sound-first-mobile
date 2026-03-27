/**
 * useCapabilities - Hook for capability CRUD operations
 */
import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { baseUrl } from "../../../../../api/client";
import { devLog, devError } from "../../../../../utils/devLogger";
import type { Capability } from "../../../../../types/capability";

/** Data for creating a new capability */
export interface CreateCapabilityData {
  name: string;
  display_name?: string;
  domain: string;
  subdomain?: string;
  requirement_type?: string;
  prerequisite_ids?: number[];
  mastery_type?: string;
  mastery_count?: number;
  difficulty_tier?: number;
}

/** Data for updating an existing capability */
export interface UpdateCapabilityData extends Partial<CreateCapabilityData> {
  is_active?: boolean;
  bit_index?: number;
}

/** Result of a capability operation */
export interface CapabilityOperationResult {
  success: boolean;
  capability?: Capability;
  error?: string;
  errors?: string[];
}

/** Export status */
export interface ExportStatus {
  type: "success" | "error";
  message: string;
}

/** Dependency graph data */
export interface DependencyGraph {
  nodes: Array<{ id: number; name: string }>;
  edges: Array<{ from: number; to: number }>;
}

/** Return type for useCapabilities hook */
export interface UseCapabilitiesReturn {
  // State
  capabilities: Capability[];
  filteredCapabilities: Capability[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  domainFilter: string;
  setDomainFilter: Dispatch<SetStateAction<string>>;
  domains: string[];
  exporting: boolean;
  exportStatus: ExportStatus | null;
  capabilitiesWithContent: Set<string>;

  // Actions
  loadCapabilities: () => Promise<void>;
  loadDependencyGraph: (
    capabilityId: number,
  ) => Promise<DependencyGraph | null>;
  archiveCapability: (
    capability: Capability,
  ) => Promise<CapabilityOperationResult>;
  restoreCapability: (
    capability: Capability,
  ) => Promise<CapabilityOperationResult>;
  deleteCapability: (
    capability: Capability,
  ) => Promise<CapabilityOperationResult>;
  createCapability: (
    createData: CreateCapabilityData,
  ) => Promise<CapabilityOperationResult>;
  updateCapability: (
    capabilityId: number,
    updateData: UpdateCapabilityData,
  ) => Promise<CapabilityOperationResult>;
  moveCapability: (
    capability: Capability,
    direction: "up" | "down",
  ) => Promise<CapabilityOperationResult>;
  renameDomain: (
    oldName: string,
    newName: string,
  ) => Promise<CapabilityOperationResult>;
  exportToFile: () => Promise<void>;
}

/**
 * Hook for capability CRUD operations in admin panel
 * @returns Object containing capability state and management functions
 */
export default function useCapabilities(): UseCapabilitiesReturn {
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [filteredCapabilities, setFilteredCapabilities] = useState<
    Capability[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [domains, setDomains] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null);
  const [capabilitiesWithContent, setCapabilitiesWithContent] = useState<
    Set<string>
  >(new Set());

  // Load capabilities on mount
  useEffect(() => {
    loadCapabilities();
  }, []);

  // Filter when data or filters change
  useEffect(() => {
    filterCapabilities();
  }, [capabilities, searchQuery, domainFilter]);

  const loadCapabilities = async (): Promise<void> => {
    setLoading(true);
    try {
      // Fetch capabilities
      const response = await fetch(`${baseUrl}/admin/capabilities`);
      if (!response.ok) throw new Error("Failed to load capabilities");
      const data = await response.json();
      setCapabilities(data.capabilities || []);

      const uniqueDomains: string[] = [
        ...new Set((data.capabilities || []).map((c: Capability) => c.domain)),
      ].sort() as string[];
      setDomains(uniqueDomains);

      // Fetch teaching modules from API to identify which capabilities have modules
      const withContent = new Set<string>();
      try {
        const modulesResponse = await fetch(
          `${baseUrl}/modules/?active_only=false`,
        );
        devLog(
          "[useCapabilities] Modules response status:",
          modulesResponse.status,
        );
        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          devLog("[useCapabilities] Modules loaded:", modulesData.length);
          modulesData
            .filter((m: { capability_name?: string }) => m.capability_name)
            .forEach((m: { capability_name: string }) =>
              withContent.add(m.capability_name),
            );
        }
      } catch (moduleErr) {
        devLog("[useCapabilities] Could not load teaching modules:", moduleErr);
      }

      // Also fetch Day 0 capabilities (granted when first note experience completes)
      try {
        const day0Response = await fetch(`${baseUrl}/admin/day0-capabilities`);
        if (day0Response.ok) {
          const day0Data = await day0Response.json();
          devLog("[useCapabilities] Day 0 capabilities:", day0Data.all);
          (day0Data.all || []).forEach((name) => withContent.add(name));
        }
      } catch (day0Err) {
        devLog("[useCapabilities] Could not load Day 0 capabilities:", day0Err);
      }

      devLog("[useCapabilities] Total capabilities with content:", [
        ...withContent,
      ]);
      setCapabilitiesWithContent(withContent);
    } catch (err) {
      devError("[useCapabilities] Load error:", err);
      // Fallback to v2 endpoint
      try {
        const fallback = await fetch(`${baseUrl}/capabilities/v2`);
        const data = await fallback.json();
        setCapabilities(data.capabilities || []);
        const uniqueDomains: string[] = [
          ...new Set(
            (data.capabilities || []).map((c: Capability) => c.domain),
          ),
        ].sort() as string[];
        setDomains(uniqueDomains);
      } catch (e) {
        devError("[useCapabilities] Fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const filterCapabilities = useCallback((): void => {
    let filtered = [...capabilities];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name?.toLowerCase().includes(query) ||
          c.display_name?.toLowerCase().includes(query) ||
          c.domain?.toLowerCase().includes(query),
      );
    }

    if (domainFilter !== "all") {
      filtered = filtered.filter((c) => c.domain === domainFilter);
    }

    // Sort by bit_index
    filtered.sort((a, b) => (a.bit_index ?? 0) - (b.bit_index ?? 0));

    setFilteredCapabilities(filtered);
  }, [capabilities, searchQuery, domainFilter]);

  const loadDependencyGraph = async (
    capabilityId: number,
  ): Promise<DependencyGraph | null> => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capabilityId}/graph`,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      devLog("[useCapabilities] Could not load dependency graph");
    }
    return null;
  };

  const archiveCapability = async (
    capability: Capability,
  ): Promise<CapabilityOperationResult> => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}/archive`,
        { method: "POST" },
      );
      if (response.ok) {
        const updated = { ...capability, is_active: false };
        setCapabilities((prev) =>
          prev.map((c) => (c.id === capability.id ? updated : c)),
        );
        return { success: true, capability: updated };
      }
    } catch (err) {
      devLog("[useCapabilities] Could not archive capability", err);
    }
    return { success: false };
  };

  const restoreCapability = async (
    capability: Capability,
  ): Promise<CapabilityOperationResult> => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}/restore`,
        { method: "POST" },
      );
      if (response.ok) {
        const updated = { ...capability, is_active: true };
        setCapabilities((prev) =>
          prev.map((c) => (c.id === capability.id ? updated : c)),
        );
        return { success: true, capability: updated };
      }
    } catch (err) {
      devLog("[useCapabilities] Could not restore capability", err);
    }
    return { success: false };
  };

  const deleteCapability = async (
    capability: Capability,
  ): Promise<CapabilityOperationResult> => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capability.id}`,
        { method: "DELETE" },
      );
      if (response.ok) {
        await loadCapabilities();
        return { success: true };
      }
    } catch (err) {
      devLog("[useCapabilities] Could not delete capability", err);
    }
    return { success: false };
  };

  const createCapability = async (
    createData: CreateCapabilityData,
  ): Promise<CapabilityOperationResult> => {
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await loadCapabilities();
        return { success: true };
      } else {
        return {
          success: false,
          error: data.detail || "Failed to create capability",
        };
      }
    } catch (err) {
      devLog("[useCapabilities] Could not create capability", err);
      return { success: false, error: "Network error" };
    }
  };

  const updateCapability = async (
    capabilityId: number,
    updateData: UpdateCapabilityData,
  ): Promise<CapabilityOperationResult> => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capabilityId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        },
      );
      const data = await response.json();
      if (response.ok && data.success) {
        // Reload to get fresh data
        const reloadResponse = await fetch(`${baseUrl}/admin/capabilities`);
        if (reloadResponse.ok) {
          const reloadData = await reloadResponse.json();
          const freshCapabilities = reloadData.capabilities || [];
          setCapabilities(freshCapabilities);

          const uniqueDomains = [
            ...new Set(freshCapabilities.map((c) => c.domain)),
          ].sort();
          setDomains(uniqueDomains);

          const freshCap = freshCapabilities.find((c) => c.id === capabilityId);
          return { success: true, capability: freshCap };
        }
        return { success: true };
      } else {
        return {
          success: false,
          error: data.detail?.message || data.detail || "Failed to save",
          errors: data.detail?.errors || [],
        };
      }
    } catch (err) {
      devError("[useCapabilities] Save error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const moveCapability = async (
    capability: Capability,
    direction: "up" | "down",
  ): Promise<CapabilityOperationResult> => {
    if (domainFilter === "all") return { success: false };

    const domainCaps = capabilities
      .filter((c) => c.domain === domainFilter)
      .sort((a, b) => (a.bit_index ?? 0) - (b.bit_index ?? 0));

    const currentIndex = domainCaps.findIndex((c) => c.id === capability.id);
    if (currentIndex === -1) return { success: false };

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= domainCaps.length)
      return { success: false };

    const newOrder = [...domainCaps];
    [newOrder[currentIndex], newOrder[newIndex]] = [
      newOrder[newIndex],
      newOrder[currentIndex],
    ];

    try {
      const response = await fetch(`${baseUrl}/admin/capabilities/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domainFilter,
          capability_ids: newOrder.map((c) => c.id),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const newBitIndexes = {};
        data.new_order.forEach((item) => {
          newBitIndexes[item.id] = item.bit_index;
        });
        setCapabilities((prev) =>
          prev.map((c) => ({
            ...c,
            bit_index: newBitIndexes[c.id] ?? c.bit_index,
          })),
        );
        return { success: true };
      }
    } catch (err) {
      devLog("[useCapabilities] Could not reorder capabilities", err);
    }
    return { success: false };
  };

  const renameDomain = async (
    oldName: string,
    newName: string,
  ): Promise<CapabilityOperationResult> => {
    try {
      const response = await fetch(`${baseUrl}/admin/domains/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ old_name: oldName, new_name: newName }),
      });
      if (response.ok) {
        await loadCapabilities();
        return { success: true };
      } else {
        const data = await response.json();
        return {
          success: false,
          error: data.detail || "Failed to rename domain",
        };
      }
    } catch (err) {
      devLog("[useCapabilities] Could not rename domain", err);
      return { success: false, error: "Network error" };
    }
  };

  const exportToFile = async (): Promise<void> => {
    setExporting(true);
    setExportStatus(null);
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities/export`, {
        method: "POST",
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setExportStatus({
          type: "success",
          message: `Exported to ${data.filename}`,
        });
      } else {
        setExportStatus({
          type: "error",
          message: data.detail?.message || "Export failed",
        });
      }
    } catch (err) {
      devError("[useCapabilities] Export error:", err);
      setExportStatus({
        type: "error",
        message: "Failed to connect to server",
      });
    }
    setExporting(false);
    setTimeout(() => setExportStatus(null), 5000);
  };

  return {
    // State
    capabilities,
    filteredCapabilities,
    loading,
    searchQuery,
    setSearchQuery,
    domainFilter,
    setDomainFilter,
    domains,
    exporting,
    exportStatus,
    capabilitiesWithContent,

    // Actions
    loadCapabilities,
    loadDependencyGraph,
    archiveCapability,
    restoreCapability,
    deleteCapability,
    createCapability,
    updateCapability,
    moveCapability,
    renameDomain,
    exportToFile,
  };
}
