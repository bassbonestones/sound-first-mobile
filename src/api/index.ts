/**
 * API Service Layer - Centralized API access
 *
 * Provides typed, documented functions for all backend endpoints.
 *
 * @module api
 *
 * @example
 * // Named imports
 * import { getMaterials, generateSession } from '../api';
 *
 * @example
 * // Namespace imports
 * import * as api from '../api';
 * await api.sessions.generateSession({ user_id: 1 });
 */

// Core client
export { api, baseUrl, getBackendUrl } from "./client";

// Service modules
export * as sessions from "./sessions";
export * as materials from "./materials";
export * as capabilities from "./capabilities";
export * as users from "./users";

// Re-export commonly used functions at top level for convenience
export {
  generateSession,
  completeSession,
  getSessionHistory,
} from "./sessions";
export type {
  Session,
  SessionRequest,
  SessionStep,
  StepResult,
  SessionCompletionData,
  SessionSummary,
} from "./sessions";

export {
  getMaterials,
  getMaterial,
  getMaterialAnalysis,
  analyzeMaterial,
} from "./materials";
export type {
  Material,
  MaterialAnalysis,
  MaterialsResponse,
} from "./materials";

export { getCapabilities, getCapability } from "./capabilities";
export type {
  Capability,
  CapabilitiesResponse,
  CapabilityGraph,
} from "./capabilities";

export { getUser, getCapabilityProgress, getFocusCards } from "./users";
export type { User, FocusCard, FocusCardsResponse, Instrument } from "./users";
