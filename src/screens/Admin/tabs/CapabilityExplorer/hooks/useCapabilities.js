/**
 * useCapabilities - Hook for capability CRUD operations
 */
import { useState, useEffect, useCallback } from "react";
import { baseUrl } from "../../../../../api/client";

export default function useCapabilities() {
  const [capabilities, setCapabilities] = useState([]);
  const [filteredCapabilities, setFilteredCapabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [domains, setDomains] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  // Load capabilities on mount
  useEffect(() => {
    loadCapabilities();
  }, []);

  // Filter when data or filters change
  useEffect(() => {
    filterCapabilities();
  }, [capabilities, searchQuery, domainFilter]);

  const loadCapabilities = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/admin/capabilities`);
      if (!response.ok) throw new Error("Failed to load capabilities");
      const data = await response.json();
      setCapabilities(data.capabilities || []);

      const uniqueDomains = [
        ...new Set((data.capabilities || []).map((c) => c.domain)),
      ].sort();
      setDomains(uniqueDomains);
    } catch (err) {
      console.error("[useCapabilities] Load error:", err);
      // Fallback to v2 endpoint
      try {
        const fallback = await fetch(`${baseUrl}/capabilities/v2`);
        const data = await fallback.json();
        setCapabilities(data.capabilities || []);
        const uniqueDomains = [
          ...new Set((data.capabilities || []).map((c) => c.domain)),
        ].sort();
        setDomains(uniqueDomains);
      } catch (e) {
        console.error("[useCapabilities] Fallback failed:", e);
      }
    }
    setLoading(false);
  };

  const filterCapabilities = useCallback(() => {
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

  const loadDependencyGraph = async (capabilityId) => {
    try {
      const response = await fetch(
        `${baseUrl}/admin/capabilities/${capabilityId}/graph`,
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.log("[useCapabilities] Could not load dependency graph");
    }
    return null;
  };

  const archiveCapability = async (capability) => {
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
      console.log("[useCapabilities] Could not archive capability", err);
    }
    return { success: false };
  };

  const restoreCapability = async (capability) => {
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
      console.log("[useCapabilities] Could not restore capability", err);
    }
    return { success: false };
  };

  const deleteCapability = async (capability) => {
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
      console.log("[useCapabilities] Could not delete capability", err);
    }
    return { success: false };
  };

  const createCapability = async (createData) => {
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
      console.log("[useCapabilities] Could not create capability", err);
      return { success: false, error: "Network error" };
    }
  };

  const updateCapability = async (capabilityId, updateData) => {
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
      console.error("[useCapabilities] Save error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const moveCapability = async (capability, direction) => {
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
      console.log("[useCapabilities] Could not reorder capabilities", err);
    }
    return { success: false };
  };

  const renameDomain = async (oldName, newName) => {
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
      console.log("[useCapabilities] Could not rename domain", err);
      return { success: false, error: "Network error" };
    }
  };

  const exportToFile = async () => {
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
      console.error("[useCapabilities] Export error:", err);
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
