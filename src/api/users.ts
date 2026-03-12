/**
 * Users API Service
 *
 * Handles user data, progress, focus cards, and soft gates.
 */

import { baseUrl } from "./client";
import type {
  User,
  Instrument,
  UserInstrumentsResponse,
  CapabilityProgress,
  JourneyStage,
} from "../types/user";

// Re-export types that consumers may need
export type { User, Instrument, UserInstrumentsResponse } from "../types/user";

// ============================================
// Types
// ============================================

export interface FocusCard {
  id: number;
  title: string;
  description: string;
  category?: string;
  icon?: string;
  order?: number;
}

export interface FocusCardsResponse {
  focus_cards: FocusCard[];
}

export interface FocusCardCreate {
  title: string;
  description: string;
  category?: string;
  icon?: string;
  order?: number;
}

export interface FocusCardUpdate {
  title?: string;
  description?: string;
  category?: string;
  icon?: string;
  order?: number;
}

export interface SoftGateRule {
  id: number;
  name: string;
  capability_id?: number;
  threshold_type: string;
  threshold_value: number;
  is_active: boolean;
}

export interface SoftGateRulesResponse {
  rules: SoftGateRule[];
}

export interface SoftGateRuleCreate {
  name: string;
  capability_id?: number;
  threshold_type: string;
  threshold_value: number;
  is_active?: boolean;
}

export interface SoftGateRuleUpdate {
  name?: string;
  capability_id?: number;
  threshold_type?: string;
  threshold_value?: number;
  is_active?: boolean;
}

export interface UserSoftGateState {
  id: number;
  user_id: number;
  rule_id: number;
  current_value: number;
  passed: boolean;
  passed_at?: string;
}

export interface UserSoftGateStatesResponse {
  states: UserSoftGateState[];
}

export interface UserSoftGateStateCreate {
  user_id: number;
  rule_id: number;
  current_value?: number;
  passed?: boolean;
}

export interface UserSoftGateStateUpdate {
  current_value?: number;
  passed?: boolean;
}

/**
 * API input type for creating instruments - matches backend expectations
 */
export interface InstrumentCreateInput {
  instrument_name: string;
  clef?: string;
  transposition?: string;
  low_note?: string;
  high_note?: string;
  is_primary?: boolean;
}

/**
 * API input type for updating instruments
 */
export interface InstrumentUpdateInput {
  clef?: string;
  transposition?: string;
  low_note?: string;
  high_note?: string;
  first_note_detected?: string;
  first_note_confirmed?: boolean;
  day0_completed?: boolean;
  day0_stage?: number;
  [key: string]: string | boolean | number | undefined;
}

/**
 * API response when creating/updating an instrument
 */
export interface InstrumentMutationResponse {
  instrument: Instrument;
}

export interface UsersResponse {
  users: User[];
}

export interface UserProgression {
  user_id: number;
  capabilities: Array<{
    capability_id: number;
    name: string;
    mastered: boolean;
    score: number;
  }>;
  stage?: string;
}

// ============================================
// User Profile & Progress
// ============================================

/**
 * Get user profile data
 */
export async function getUser(userId: number): Promise<User> {
  const response = await fetch(`${baseUrl}/users/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  return response.json() as Promise<User>;
}

/**
 * Get capability progress for a user
 */
export async function getCapabilityProgress(
  userId: number,
): Promise<CapabilityProgress> {
  const response = await fetch(
    `${baseUrl}/users/${userId}/capability-progress`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch progress: ${response.status}`);
  }
  return response.json() as Promise<CapabilityProgress>;
}

/**
 * Get journey stage for a user
 */
export async function getJourneyStage(userId: number): Promise<JourneyStage> {
  const response = await fetch(`${baseUrl}/users/${userId}/journey-stage`);
  if (!response.ok) {
    throw new Error(`Failed to fetch journey stage: ${response.status}`);
  }
  return response.json() as Promise<JourneyStage>;
}

/**
 * Admin: Get all users
 */
export async function getAllUsers(): Promise<UsersResponse> {
  const response = await fetch(`${baseUrl}/admin/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }
  return response.json() as Promise<UsersResponse>;
}

/**
 * Admin: Get progression data for a user
 */
export async function getUserProgression(
  userId: number,
): Promise<UserProgression> {
  const response = await fetch(`${baseUrl}/admin/users/${userId}/progression`);
  if (!response.ok) {
    throw new Error(`Failed to fetch progression: ${response.status}`);
  }
  return response.json() as Promise<UserProgression>;
}

// ============================================
// Focus Cards
// ============================================

/**
 * Get all focus cards
 */
export async function getFocusCards(): Promise<FocusCardsResponse> {
  const response = await fetch(`${baseUrl}/focus-cards`);
  if (!response.ok) {
    throw new Error(`Failed to fetch focus cards: ${response.status}`);
  }
  return response.json() as Promise<FocusCardsResponse>;
}

/**
 * Admin: Get focus card by ID
 */
export async function getFocusCard(focusCardId: number): Promise<FocusCard> {
  const response = await fetch(`${baseUrl}/admin/focus-cards/${focusCardId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch focus card: ${response.status}`);
  }
  return response.json() as Promise<FocusCard>;
}

/**
 * Admin: Create focus card
 */
export async function createFocusCard(
  focusCard: FocusCardCreate,
): Promise<FocusCard> {
  const response = await fetch(`${baseUrl}/admin/focus-cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(focusCard),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json() as Promise<FocusCard>;
}

/**
 * Admin: Update focus card
 */
export async function updateFocusCard(
  focusCardId: number,
  updates: FocusCardUpdate,
): Promise<FocusCard> {
  const response = await fetch(`${baseUrl}/admin/focus-cards/${focusCardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  return response.json() as Promise<FocusCard>;
}

/**
 * Admin: Delete focus card
 */
export async function deleteFocusCard(focusCardId: number): Promise<void> {
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
 */
export async function getSoftGateRules(): Promise<SoftGateRulesResponse> {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules`);
  if (!response.ok) {
    throw new Error(`Failed to fetch rules: ${response.status}`);
  }
  return response.json() as Promise<SoftGateRulesResponse>;
}

/**
 * Admin: Create soft gate rule
 */
export async function createSoftGateRule(
  rule: SoftGateRuleCreate,
): Promise<SoftGateRule> {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json() as Promise<SoftGateRule>;
}

/**
 * Admin: Update soft gate rule
 */
export async function updateSoftGateRule(
  ruleId: number,
  updates: SoftGateRuleUpdate,
): Promise<SoftGateRule> {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules/${ruleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) {
    throw new Error(`Update failed: ${response.status}`);
  }
  return response.json() as Promise<SoftGateRule>;
}

/**
 * Admin: Delete soft gate rule
 */
export async function deleteSoftGateRule(ruleId: number): Promise<void> {
  const response = await fetch(`${baseUrl}/admin/soft-gate-rules/${ruleId}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

/**
 * Admin: Get user soft gate state
 */
export async function getUserSoftGateState(
  userId: number,
): Promise<UserSoftGateStatesResponse> {
  const response = await fetch(
    `${baseUrl}/admin/user-soft-gate-state?user_id=${userId}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch state: ${response.status}`);
  }
  return response.json() as Promise<UserSoftGateStatesResponse>;
}

/**
 * Admin: Update user soft gate state
 */
export async function updateUserSoftGateState(
  stateId: number,
  updates: UserSoftGateStateUpdate,
): Promise<UserSoftGateState> {
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
  return response.json() as Promise<UserSoftGateState>;
}

/**
 * Admin: Create user soft gate state
 */
export async function createUserSoftGateState(
  state: UserSoftGateStateCreate,
): Promise<UserSoftGateState> {
  const response = await fetch(`${baseUrl}/admin/user-soft-gate-state`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json() as Promise<UserSoftGateState>;
}

/**
 * Admin: Reset user soft gate state
 */
export async function resetUserSoftGateState(userId: number): Promise<void> {
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
 */
export async function getUserInstruments(
  userId: number,
): Promise<UserInstrumentsResponse> {
  const response = await fetch(`${baseUrl}/users/${userId}/instruments`);
  if (!response.ok) {
    throw new Error(`Failed to fetch instruments: ${response.status}`);
  }
  return response.json() as Promise<UserInstrumentsResponse>;
}

/**
 * Add a new instrument for a user
 */
export async function createUserInstrument(
  userId: number,
  instrument: InstrumentCreateInput,
): Promise<InstrumentMutationResponse> {
  const response = await fetch(`${baseUrl}/users/${userId}/instruments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(instrument),
  });
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status}`);
  }
  return response.json() as Promise<InstrumentMutationResponse>;
}

/**
 * Update an instrument for a user
 */
export async function updateUserInstrument(
  userId: number,
  instrumentId: number,
  updates: InstrumentUpdateInput,
): Promise<InstrumentMutationResponse> {
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
  return response.json() as Promise<InstrumentMutationResponse>;
}

/**
 * Delete an instrument for a user
 */
export async function deleteUserInstrument(
  userId: number,
  instrumentId: number,
): Promise<void> {
  const response = await fetch(
    `${baseUrl}/users/${userId}/instruments/${instrumentId}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.status}`);
  }
}

/**
 * Persist the user's current instrument selection
 */
export async function selectUserInstrument(
  userId: number,
  instrumentId: number,
): Promise<void> {
  const response = await fetch(`${baseUrl}/users/${userId}/select-instrument`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instrument_id: instrumentId }),
  });
  if (!response.ok) {
    throw new Error(`Select failed: ${response.status}`);
  }
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
