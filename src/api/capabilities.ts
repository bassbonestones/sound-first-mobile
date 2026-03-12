/**
 * Capabilities API Service
 *
 * Handles capability CRUD, domains, and prerequisite management.
 */

import { baseUrl } from "./client";
import { devLog } from "../utils/devLogger";

// ============================================
// Types
// ============================================

export interface Capability {
  id: number;
  name: string;
  domain: string;
  display_order: number;
  description?: string;
  is_archived?: boolean;
  prerequisites?: number[];
}

export interface CapabilitiesResponse {
  capabilities: Capability[];
}

export interface CapabilityGraph {
  nodes: Array<{
    id: number;
    name: string;
    domain: string;
  }>;
  edges: Array<{
    source: number;
    target: number;
    type?: string;
  }>;
}

export interface CapabilityCreate {
  name: string;
  domain: string;
  display_order?: number;
  description?: string;
  prerequisites?: number[];
}

export interface CapabilityUpdate {
  name?: string;
  domain?: string;
  display_order?: number;
  description?: string;
  prerequisites?: number[];
}

export interface ReorderItem {
  id: number;
  display_order: number;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all capabilities
 */
export async function getCapabilities(): Promise<CapabilitiesResponse> {
  // Try admin endpoint first for full data
  try {
    const response = await fetch(`${baseUrl}/admin/capabilities`);
    if (response.ok) {
      return response.json() as Promise<CapabilitiesResponse>;
    }
  } catch {
    devLog("[capabilities] Admin endpoint unavailable, using public");
  }

  // Fallback to v2 public endpoint
  const response = await fetch(`${baseUrl}/capabilities/v2`);
  if (!response.ok) {
    throw new Error(`Failed to fetch capabilities: ${response.status}`);
  }
  return response.json() as Promise<CapabilitiesResponse>;
}

/**
 * Admin: Get a single capability with full details
 */
export async function getCapability(capabilityId: number): Promise<Capability> {
  const response = await fetch(`${baseUrl}/admin/capabilities/${capabilityId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch capability: ${response.status}`);
  }
  return response.json() as Promise<Capability>;
}

/**
 * Admin: Get capability dependency graph
 */
export async function getCapabilityGraph(
  capabilityId: number,
): Promise<CapabilityGraph> {
  const response = await fetch(
    `${baseUrl}/admin/capabilities/${capabilityId}/graph`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch graph: ${response.status}`);
  }
  return response.json() as Promise<CapabilityGraph>;
}

/**
 * Admin: Create a new capability
 */
export async function createCapability(
  capability: CapabilityCreate,
): Promise<Capability> {
  const response = await fetch(`${baseUrl}/admin/capabilities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capability),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail ||
        `Create failed: ${response.status}`,
    );
  }
  return response.json() as Promise<Capability>;
}

/**
 * Admin: Update a capability
 */
export async function updateCapability(
  capabilityId: number,
  updates: CapabilityUpdate,
): Promise<Capability> {
  const response = await fetch(
    `${baseUrl}/admin/capabilities/${capabilityId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      (error as { detail?: string }).detail ||
        `Update failed: ${response.status}`,
    );
  }
  return response.json() as Promise<Capability>;
}

/**
 * Admin: Archive a capability (soft delete)
 */
export async function archiveCapability(capabilityId: number): Promise<void> {
  const response = await fetch(
    `${baseUrl}/admin/capabilities/${capabilityId}/archive`,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(`Archive failed: ${response.status}`);
  }
}

/**
 * Admin: Restore an archived capability
 */
export async function restoreCapability(capabilityId: number): Promise<void> {
  const response = await fetch(
    `${baseUrl}/admin/capabilities/${capabilityId}/restore`,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(`Restore failed: ${response.status}`);
  }
}

/**
 * Admin: Reorder capabilities within a domain
 */
export async function reorderCapabilities(
  reorderData: ReorderItem[],
): Promise<void> {
  const response = await fetch(`${baseUrl}/admin/capabilities/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ capabilities: reorderData }),
  });
  if (!response.ok) {
    throw new Error(`Reorder failed: ${response.status}`);
  }
}

/**
 * Admin: Rename a domain
 */
export async function renameDomain(
  oldName: string,
  newName: string,
): Promise<void> {
  const response = await fetch(`${baseUrl}/admin/domains/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_name: oldName, new_name: newName }),
  });
  if (!response.ok) {
    throw new Error(`Rename failed: ${response.status}`);
  }
}

export default {
  getCapabilities,
  getCapability,
  getCapabilityGraph,
  createCapability,
  updateCapability,
  archiveCapability,
  restoreCapability,
  reorderCapabilities,
  renameDomain,
};
