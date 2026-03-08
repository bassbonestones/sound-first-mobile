/**
 * Sessions API Service
 *
 * Handles session generation, completion, and related operations.
 */

import { api, baseUrl } from "./client";

/**
 * @typedef {Object} SessionRequest
 * @property {number} user_id - User ID
 * @property {number} [focus_card_id] - Optional focus card ID
 * @property {number} [material_id] - Optional specific material ID
 */

/**
 * @typedef {Object} Session
 * @property {number} id - Session ID
 * @property {Object[]} steps - Session steps
 * @property {Object} focus_card - Associated focus card
 */

/**
 * Generate a new practice session
 * @param {SessionRequest} params - Session generation parameters
 * @returns {Promise<Session>} Generated session
 */
export async function generateSession(params) {
  return api.post("/generate-session", params);
}

/**
 * Complete a session step
 * @param {number} sessionId - Session ID
 * @param {number} stepIndex - Step index
 * @param {Object} result - Step result data
 * @returns {Promise<Object>} Updated session data
 */
export async function completeStep(sessionId, stepIndex, result) {
  return api.post(`/sessions/${sessionId}/steps/${stepIndex}/complete`, result);
}

/**
 * Complete a full session with rating
 * @param {number} sessionId - Session ID
 * @param {Object} data - Completion data with rating
 * @returns {Promise<Object>} Session summary
 */
export async function completeSession(sessionId, data) {
  return api.post(`/sessions/${sessionId}/complete`, data);
}

/**
 * Get session history for a user
 * @param {number} userId - User ID
 * @param {number} [limit=10] - Maximum sessions to return
 * @returns {Promise<Object[]>} Session history
 */
export async function getSessionHistory(userId, limit = 10) {
  return api.get(`/users/${userId}/sessions?limit=${limit}`);
}

/**
 * Admin: Get session candidates for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Candidate materials and focus cards
 */
export async function getSessionCandidates(userId) {
  const response = await fetch(
    `${baseUrl}/admin/users/${userId}/session-candidates`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch session candidates: ${response.status}`);
  }
  return response.json();
}

/**
 * Admin: Generate a diagnostic session
 * @param {number} userId - User ID
 * @returns {Promise<Session>} Diagnostic session
 */
export async function generateDiagnosticSession(userId) {
  const response = await fetch(
    `${baseUrl}/admin/users/${userId}/generate-diagnostic-session`,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to generate diagnostic session: ${response.status}`,
    );
  }
  return response.json();
}

/**
 * Admin: Get last session diagnostics
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Diagnostic data
 */
export async function getLastSessionDiagnostics(userId) {
  const response = await fetch(
    `${baseUrl}/admin/users/${userId}/last-session-diagnostics`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch diagnostics: ${response.status}`);
  }
  return response.json();
}

export default {
  generateSession,
  completeStep,
  completeSession,
  getSessionHistory,
  getSessionCandidates,
  generateDiagnosticSession,
  getLastSessionDiagnostics,
};
