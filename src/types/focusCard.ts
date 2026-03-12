/**
 * Focus Card TypeScript types
 *
 * Types for practice focus cards and their prompts.
 */

// ============================================================================
// Focus Card Categories
// ============================================================================

export type FocusCardCategory =
  | "Ear & Pitch"
  | "Resonance & Tone"
  | "Rhythm & Time"
  | "Musical Shape"
  | "Articulation & Communication"
  | "Ease & Efficiency";

// ============================================================================
// Focus Card Prompts
// ============================================================================

export interface FocusCardPrompts {
  before?: string;
  during?: string;
  after?: string;
  listen?: string;
  sing?: string;
  imagine?: string;
  play?: string;
  reflect?: string;
}

// ============================================================================
// Focus Card
// ============================================================================

export interface FocusCard {
  id: number;
  name: string;
  description: string;
  category: FocusCardCategory | string;
  attention_cue: string;
  micro_cues: string[];
  prompts: FocusCardPrompts;
}

// ============================================================================
// Focus Card Response (from API)
// ============================================================================

export interface FocusCardResponse {
  id: number;
  name: string;
  description: string;
  category: string;
  attention_cue: string;
  micro_cues: string[]; // Parsed from JSON
  prompts: FocusCardPrompts; // Parsed from JSON
}

// ============================================================================
// Focus Card in Mini Session
// ============================================================================

export interface FocusCardInSession {
  focus_card_id: number;
  focus_card_name: string;
  focus_card_description: string;
  focus_card_category: string;
  focus_card_attention_cue: string;
  focus_card_micro_cues: string[];
  focus_card_prompts: FocusCardPrompts;
}
