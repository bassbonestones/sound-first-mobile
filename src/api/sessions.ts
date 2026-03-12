/**
 * Sessions API Service
 *
 * Handles session generation, completion, and related operations.
 */

import { api, baseUrl } from "./client";

// ============================================
// Types
// ============================================

export interface SessionRequest {
  user_id: number;
  focus_card_id?: number;
  material_id?: number;
}

export interface SessionStep {
  id?: number;
  type: string;
  config?: Record<string, unknown>;
  completed?: boolean;
  result?: Record<string, unknown>;
}

export interface FocusCardRef {
  id: number;
  title: string;
  description?: string;
}

export interface Session {
  id: number;
  steps: SessionStep[];
  focus_card?: FocusCardRef;
  user_id?: number;
  created_at?: string;
  completed_at?: string;
}

export interface StepResult {
  success: boolean;
  score?: number;
  accuracy?: number;
  details?: Record<string, unknown>;
}

export interface SessionCompletionData {
  rating?: number;
  fatigue?: number;
  notes?: string;
}

export interface SessionSummary {
  id: number;
  total_steps: number;
  completed_steps: number;
  rating?: number;
  duration_seconds?: number;
}

export interface SessionCandidate {
  materials: Array<{
    id: number;
    title: string;
    difficulty?: number;
  }>;
  focus_cards: Array<{
    id: number;
    title: string;
  }>;
}

export interface SessionDiagnostics {
  session_id: number;
  steps: Array<{
    type: string;
    result?: StepResult;
  }>;
  analytics?: Record<string, unknown>;
}

// ============================================
// API Functions
// ============================================

/**
 * Generate a new practice session
 */
export async function generateSession(
  params: SessionRequest,
): Promise<Session> {
  return api.post<Session>("/generate-session", params);
}

/**
 * Complete a session step
 */
export async function completeStep(
  sessionId: number,
  stepIndex: number,
  result: StepResult,
): Promise<Session> {
  return api.post<Session>(
    `/sessions/${sessionId}/steps/${stepIndex}/complete`,
    result,
  );
}

/**
 * Complete a full session with rating
 */
export async function completeSession(
  sessionId: number,
  data: SessionCompletionData,
): Promise<SessionSummary> {
  return api.post<SessionSummary>(`/sessions/${sessionId}/complete`, data);
}

/**
 * Get session history for a user
 */
export async function getSessionHistory(
  userId: number,
  limit = 10,
): Promise<Session[]> {
  return api.get<Session[]>(`/users/${userId}/sessions?limit=${limit}`);
}

/**
 * Admin: Get session candidates for a user
 */
export async function getSessionCandidates(
  userId: number,
): Promise<SessionCandidate> {
  const response = await fetch(
    `${baseUrl}/admin/users/${userId}/session-candidates`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch session candidates: ${response.status}`);
  }
  return response.json() as Promise<SessionCandidate>;
}

/**
 * Admin: Generate a diagnostic session
 */
export async function generateDiagnosticSession(
  userId: number,
): Promise<Session> {
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
  return response.json() as Promise<Session>;
}

/**
 * Admin: Get last session diagnostics
 */
export async function getLastSessionDiagnostics(
  userId: number,
): Promise<SessionDiagnostics> {
  const response = await fetch(
    `${baseUrl}/admin/users/${userId}/last-session-diagnostics`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch diagnostics: ${response.status}`);
  }
  return response.json() as Promise<SessionDiagnostics>;
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
