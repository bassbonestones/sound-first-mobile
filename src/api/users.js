/**
 * Users API Service
 *
 * Handles user data, progress, focus cards, and soft gates.
 */

import { api, baseUrl } from "./client";

// ============================================
// User Profile & Progress
// ============================================

/**
 * Get user profile data
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User profile
 */
export async function getUser(userId) {
  const response = await fetch(`${baseUrl}/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  return response.json();
}

/**
 * Get capability progress for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Progress data by capability
 */
export async function getCapabilityProgress(userId) {
  const response = await fetch(
    `${baseUrl}/users/${userId}/capability-progress`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch progress: ${response.status}`);
  }
  return response.json();
}

/**
 * Get journey stage for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Current stage and milestone data
 */
export async function getJourneyStage(userId) {
  const response = await fetch(`${baseUrl}/users/${userId}/journey-stage`);
  if (!response.ok) {
    throw new Error(`Failed to fetch journey stage: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Get all users
 * @returns {Promise<{users: Object[]}>} List of users
 */
export async function getAllUsers() {
  const response = await fetch(`${baseUrl}/admin/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Get progression data for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Progression details
 */
export async function getUserProgression(userId) {
  const response = await fetch(`${baseUrl}/admin/users/${userId}/progression`);
  if (!response.ok) {
    throw new Error(`Failed to fetch progression: ${response.status}`);
  }
  return response.json();
}

// ============================================
// Focus Cards
// ============================================

/**
 * Get all focus cards
 * @returns {Promise<{focus_cards: Object[]}>} List of focus cards
 */
export async function getFocusCards() {
  const response = await fetch(`${baseUrl}/focus-cards`);
  if (!response.ok) {
    throw new Error(`Failed to fetch focus cards: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Get focus card by ID
 * @param {number} focusCardId - Focus card ID
 * @returns {Promise<Object>} Focus card details
 */
export async function getFocusCard(focusCardId) {
  const response = await fetch(`${baseUrl}/admin/focus-cards/${focusCardId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch focus card: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Create focus card
 * @param {Object} focusCard - Focus card data
 * @returns {Promise<Object>} Created focus card
 */
export async function createFocusCard(focusCard) {
  const response = await fetch(`${baseUrl}/admin/focus-cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(focusCard),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Update focus card
 * @param {number} focusCardId - Focus card ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated focus card
 */
export async function updateFocusCard(focusCardId, updates) {
  const response = await fetch(`${baseUrl}/admin/focus-cards/${focusCardId}`, {
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
 * Admin: Delete focus card
 * @param {number} focusCardId - Focus card ID
 * @returns {Promise<void>}
 */
export async function deleteFocusCard(focusCardId) {
  const response = await fetch(`${baseUrl}/admin/focus-cards/${focusCardId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

// ============================================
// Soft Gates
// ============================================

/**
 * Admin: Get soft gate rules
 * @returns {Promise<{rules: Object[]}>} List of rules
 */
export async function getSoftGateRules() {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rules: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Create soft gate rule
 * @param {Object} rule - Rule data
 * @returns {Promise<Object>} Created rule
 */
export async function createSoftGateRule(rule) {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Update soft gate rule
 * @param {number} ruleId - Rule ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated rule
 */
export async function updateSoftGateRule(ruleId, updates) {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules/${ruleId}`, {
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
 * Admin: Delete soft gate rule
 * @param {number} ruleId - Rule ID
 * @returns {Promise<void>}
 */
export async function deleteSoftGateRule(ruleId) {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules/${ruleId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

/**
 * Admin: Get user soft gate state
 * @param {number} userId - User ID
 * @returns {Promise<{states: Object[]}>} User's gate states
 */
export async function getUserSoftGateState(userId) {
  const response = await fetch(
    `${baseUrl}/admin/user-soft-gate-state?user_id=${userId}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch state: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Update user soft gate state
 * @param {number} stateId - State ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated state
 */
export async function updateUserSoftGateState(stateId, updates) {
  const response = await fetch(
    `${baseUrl}/admin/user-soft-gate-state/${stateId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Create user soft gate state
 * @param {Object} state - State data
 * @returns {Promise<Object>} Created state
 */
export async function createUserSoftGateState(state) {
  const response = await fetch(`${baseUrl}/admin/user-soft-gate-state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Reset user soft gate state
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
export async function resetUserSoftGateState(userId) {
  const response = await fetch(`${baseUrl}/admin/user-soft-gate-state/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!response.ok) {
    throw new Error(`Reset failed: ${response.status}`);
  }
}

// ============================================
// User Instruments
// ============================================

/**
 * Get all instruments for a user
 * @param {number} userId - User ID
 * @returns {Promise<{user_id: number, instruments: Object[]}>}
 */
export async function getUserInstruments(userId) {
  const response = await fetch(`${baseUrl}/users/${userId}/instruments`);
  if (!response.ok) {
    throw new Error(`Failed to fetch instruments: ${response.status}`);
  }
  return response.json();
}

/**
 * Add a new instrument for a user
 * @param {number} userId - User ID
 * @param {Object} instrument - Instrument data
 * @returns {Promise<Object>} Created instrument
 */
export async function createUserInstrument(userId, instrument) {
  const response = await fetch(`${baseUrl}/users/${userId}/instruments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(instrument),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Update an instrument for a user
 * @param {number} userId - User ID
 * @param {number} instrumentId - Instrument ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated instrument
 */
export async function updateUserInstrument(userId, instrumentId, updates) {
  const response = await fetch(
    `${baseUrl}/users/${userId}/instruments/${instrumentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  );
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Delete an instrument for a user
 * @param {number} userId - User ID
 * @param {number} instrumentId - Instrument ID
 * @returns {Promise<Object>}
 */
export async function deleteUserInstrument(userId, instrumentId) {
  const response = await fetch(
    `${baseUrl}/users/${userId}/instruments/${instrumentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
  return response.json();
}

/**
 * Persist the user's current instrument selection
 * @param {number} userId - User ID
 * @param {number} instrumentId - Instrument ID to select
 * @returns {Promise<Object>}
 */
export async function selectUserInstrument(userId, instrumentId) {
  const response = await fetch(
    `${baseUrl}/users/${userId}/select-instrument`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instrument_id: instrumentId }),
    },
  );
  if (!response.ok) {
    throw new Error(`Select failed: ${response.status}`);
  }
  return response.json();
}

export default {
  // User
  getUser,
  getCapabilityProgress,
  getJourneyStage,
  getAllUsers,
  getUserProgression,
  // Focus Cards
  getFocusCards,
  getFocusCard,
  createFocusCard,
  updateFocusCard,
  deleteFocusCard,
  // Soft Gates
  getSoftGateRules,
  createSoftGateRule,
  updateSoftGateRule,
  deleteSoftGateRule,
  getUserSoftGateState,
  updateUserSoftGateState,
  createUserSoftGateState,
  resetUserSoftGateState,
  // User Instruments
  getUserInstruments,
  createUserInstrument,
  updateUserInstrument,
  deleteUserInstrument,
  selectUserInstrument,
};
