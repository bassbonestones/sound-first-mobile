/**
 * Tunes API Service
 *
 * Handles tune CRUD operations including chord progression management
 * and chord inference.
 */

import { api } from "./client";

// ============================================
// Types
// ============================================

export interface TimeSignature {
  beats: number;
  beatUnit: number;
}

export interface ChordSymbol {
  id: string;
  symbol: string;
  beatPosition: number;
  measureIndex: number;
}

export interface ChordProgression {
  id: string;
  name: string;
  isDefault: boolean;
  isAutoInferred?: boolean;
  isSystemDefined?: boolean;
  chords: ChordSymbol[];
}

export interface DisplaySettings {
  showChordSymbols: boolean;
  activeProgressionId?: string;
}

export interface PlaybackSettings {
  accompanimentStyle?: string;
  accompanimentVolume?: number;
}

export interface Tune {
  id: number;
  user_id: number;
  title: string;
  clef: string;
  key_signature: number;
  time_signature: TimeSignature;
  tempo: number;
  measures_json: string;
  chord_progressions: ChordProgression[];
  display_settings: DisplaySettings;
  playback_settings: PlaybackSettings;
  imported_from?: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface TuneListItem {
  id: number;
  title: string;
  clef: string;
  key_signature: number;
  tempo: number;
  measure_count: number;
  has_chord_progressions: boolean;
  imported_from?: string;
  created_at: string;
  updated_at: string;
}

export interface TunesListResponse {
  tunes: TuneListItem[];
  total_count: number;
}

export interface TuneCreateRequest {
  title: string;
  clef?: string;
  key_signature?: number;
  time_signature?: TimeSignature;
  tempo?: number;
  measures_json: string;
  chord_progressions?: ChordProgression[];
  display_settings?: DisplaySettings;
  playback_settings?: PlaybackSettings;
  imported_from?: string;
}

export interface TuneUpdateRequest {
  title?: string;
  clef?: string;
  key_signature?: number;
  time_signature?: TimeSignature;
  tempo?: number;
  measures_json?: string;
  chord_progressions?: ChordProgression[];
  display_settings?: DisplaySettings;
  playback_settings?: PlaybackSettings;
}

export interface ChordInferenceRequest {
  use_seventh_chords?: boolean;
  chords_per_measure?: 1 | 2;
}

export interface ChordInferenceResponse {
  progression: ChordProgression;
  chord_count: number;
}

export interface ChordAnalyzeRequest {
  measures_json: string;
  key_signature?: number;
  time_signature?: TimeSignature;
  use_seventh_chords?: boolean;
  chords_per_measure?: 1 | 2;
}

// ============================================
// API Functions
// ============================================

/**
 * List tunes for a user
 */
export async function listTunes(
  userId: number,
  options?: {
    includeArchived?: boolean;
    limit?: number;
    offset?: number;
  },
): Promise<TunesListResponse> {
  const params = new URLSearchParams({
    user_id: userId.toString(),
  });
  if (options?.includeArchived) {
    params.set("include_archived", "true");
  }
  if (options?.limit) {
    params.set("limit", options.limit.toString());
  }
  if (options?.offset) {
    params.set("offset", options.offset.toString());
  }

  return api.get<TunesListResponse>(`/tunes?${params.toString()}`);
}

/**
 * Get a single tune by ID
 */
export async function getTune(tuneId: number, userId: number): Promise<Tune> {
  return api.get<Tune>(`/tunes/${tuneId}?user_id=${userId}`);
}

/**
 * Create a new tune
 */
export async function createTune(
  userId: number,
  data: TuneCreateRequest,
): Promise<Tune> {
  return api.post<Tune>(`/tunes?user_id=${userId}`, data);
}

/**
 * Update an existing tune
 */
export async function updateTune(
  tuneId: number,
  userId: number,
  data: TuneUpdateRequest,
): Promise<Tune> {
  return api.put<Tune>(`/tunes/${tuneId}?user_id=${userId}`, data);
}

/**
 * Delete (archive) a tune
 */
export async function deleteTune(
  tuneId: number,
  userId: number,
  permanent = false,
): Promise<void> {
  return api.delete(
    `/tunes/${tuneId}?user_id=${userId}&permanent=${permanent}`,
  );
}

/**
 * Restore an archived tune
 */
export async function restoreTune(
  tuneId: number,
  userId: number,
): Promise<Tune> {
  return api.post<Tune>(`/tunes/${tuneId}/restore?user_id=${userId}`, {});
}

/**
 * Duplicate a tune
 */
export async function duplicateTune(
  tuneId: number,
  userId: number,
): Promise<Tune> {
  return api.post<Tune>(`/tunes/${tuneId}/duplicate?user_id=${userId}`, {});
}

/**
 * Infer chord progression from tune melody
 *
 * Analyzes the melody notes to suggest harmonically appropriate chords.
 * Returns a ChordProgression with isAutoInferred=true.
 *
 * @param tuneId - ID of the tune to analyze
 * @param userId - Owner of the tune
 * @param options - Inference options
 * @returns Inferred chord progression
 */
export async function inferChords(
  tuneId: number,
  userId: number,
  options?: ChordInferenceRequest,
): Promise<ChordInferenceResponse> {
  return api.post<ChordInferenceResponse>(
    `/tunes/${tuneId}/infer-chords?user_id=${userId}`,
    {
      use_seventh_chords: options?.use_seventh_chords ?? true,
      chords_per_measure: options?.chords_per_measure ?? 1,
    },
  );
}

/**
 * Analyze melody data and infer chord progression
 *
 * This function analyzes raw melody data without requiring a saved tune.
 * Use this in the Tune Composer to infer chords before saving.
 *
 * @param data - Melody data with key signature and time signature
 * @returns Inferred chord progression
 */
export async function analyzeChords(
  data: ChordAnalyzeRequest,
): Promise<ChordInferenceResponse> {
  return api.post<ChordInferenceResponse>("/tunes/analyze-chords", {
    measures_json: data.measures_json,
    key_signature: data.key_signature ?? 0,
    time_signature: data.time_signature ?? { beats: 4, beatUnit: 4 },
    use_seventh_chords: data.use_seventh_chords ?? true,
    chords_per_measure: data.chords_per_measure ?? 1,
  });
}
