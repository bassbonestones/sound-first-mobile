/**
 * Capabilities API Service
 *
 * Handles capability CRUD, domains, and prerequisite management.
 */

import { api, baseUrl } from "./client";
import { devLog } from "../utils/devLogger";

/**
 * @typedef {Object} Capability
 * @property {number} id - Capability ID
 * @property {string} name - Capability name
 * @property {string} domain - Domain grouping
 * @property {number} display_order - Sort order within domain
 * @property {boolean} [is_archived] - Whether archived
 */

/**
 * Get all capabilities
 * @returns {Promise<{capabilities: Capability[]}>} List of capabilities
 */
export async function getCapabilities() {
  // Try admin endpoint first for full data
  try {
    const response = await fetch(`${baseUrl}/admin/capabilities`);
    if (response.ok) {
      return response.json();
    }
  } catch (err) {
    devLog("[capabilities] Admin endpoint unavailable, using public");
  }

  // Fallback to v2 public endpoint
  const response = await fetch(`${baseUrl}/capabilities/v2`);
  if (!response.ok) {
    throw new Error(`Failed to fetch capabilities: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Get a single capability with full details
 * @param {number} capabilityId - Capability ID
 * @returns {Promise<Capability>} Capability with prerequisites, etc.
 */
export async function getCapability(capabilityId) {
  const response = await fetch(`${baseUrl}/admin/capabilities/${capabilityId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch capability: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Get capability dependency graph
 * @param {number} capabilityId - Capability ID
 * @returns {Promise<Object>} Graph data with nodes and edges
 */
export async function getCapabilityGraph(capabilityId) {
  const response = await fetch(
    `${baseUrl}/admin/capabilities/${capabilityId}/graph`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch graph: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Create a new capability
 * @param {Object} capability - Capability data
 * @returns {Promise<Capability>} Created capability
 */
export async function createCapability(capability) {
  const response = await fetch(`${baseUrl}/admin/capabilities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(capability),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Create failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Update a capability
 * @param {number} capabilityId - Capability ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Capability>} Updated capability
 */
export async function updateCapability(capabilityId, updates) {
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
    throw new Error(error.detail || `Update failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Archive a capability (soft delete)
 * @param {number} capabilityId - Capability ID
 * @returns {Promise<void>}
 */
export async function archiveCapability(capabilityId) {
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
 * @param {number} capabilityId - Capability ID
 * @returns {Promise<void>}
 */
export async function restoreCapability(capabilityId) {
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
 * @param {Object[]} reorderData - Array of {id, display_order} pairs
 * @returns {Promise<void>}
 */
export async function reorderCapabilities(reorderData) {
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
 * @param {string} oldName - Current domain name
 * @param {string} newName - New domain name
 * @returns {Promise<void>}
 */
export async function renameDomain(oldName, newName) {
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
