/**
 * API Constants
 *
 * API endpoints, timeout values, and network-related constants.
 */

// Types
export interface ApiConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface Endpoints {
  login: string;
  register: string;
  user: string;
  userInstruments: string;
  userProgress: string;
  practiceAttempt: string;
  practiceSession: string;
  generateSession: string;
  materials: string;
  materialById: (id: number | string) => string;
  focusCards: string;
  focusCardById: (id: number | string) => string;
  capabilities: string;
  capabilityById: (id: number | string) => string;
  capabilityDomains: string;
  historySummary: string;
  historyMaterials: string;
  historyFocusCards: string;
  historyTimeline: string;
  softGates: string;
  softGateRules: string;
  userSoftGateState: string;
}

// API configuration
export const API_CONFIG: ApiConfig = {
  timeout: 10000, // Request timeout (10s)
  retryAttempts: 3, // Number of retry attempts
  retryDelay: 1000, // Delay between retries (ms)
};

// API endpoints (relative to baseUrl)
export const ENDPOINTS: Endpoints = {
  // Auth
  login: "/auth/login",
  register: "/auth/register",

  // User
  user: "/user",
  userInstruments: "/user/instruments",
  userProgress: "/user/progress",

  // Practice
  practiceAttempt: "/practice-attempt",
  practiceSession: "/practice-sessions",
  generateSession: "/generate-session",

  // Materials
  materials: "/materials",
  materialById: (id: number | string) => `/materials/${id}`,

  // Focus Cards
  focusCards: "/focus-cards",
  focusCardById: (id: number | string) => `/focus-cards/${id}`,

  // Capabilities
  capabilities: "/capabilities",
  capabilityById: (id: number | string) => `/capabilities/${id}`,
  capabilityDomains: "/capabilities/domains",

  // History
  historySummary: "/history/summary",
  historyMaterials: "/history/materials",
  historyFocusCards: "/history/focus-cards",
  historyTimeline: "/history/timeline",

  // Admin
  softGates: "/soft-gates",
  softGateRules: "/soft-gate-rules",
  userSoftGateState: "/user-soft-gate-state",
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// Content types
export const CONTENT_TYPE = {
  JSON: "application/json",
  FORM: "application/x-www-form-urlencoded",
  MULTIPART: "multipart/form-data",
};

export default {
  API_CONFIG,
  ENDPOINTS,
  HTTP_STATUS,
  CONTENT_TYPE,
};
