/**
 * Tune Mastery TypeScript types
 *
 * Types for tune practice tracking and key mastery system.
 */

// ============================================================================
// Musical Keys
// ============================================================================

export type MusicalKey =
  | "A"
  | "Bb"
  | "B"
  | "C"
  | "Db"
  | "D"
  | "Eb"
  | "E"
  | "F"
  | "Gb"
  | "G"
  | "Ab";

export const ALL_KEYS: MusicalKey[] = [
  "A",
  "Bb",
  "B",
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
];

// ============================================================================
// Key Score
// ============================================================================

export interface KeyScore {
  score: number;
  attempts: number;
}

export type KeyScores = Record<MusicalKey, KeyScore>;

// ============================================================================
// Tune
// ============================================================================

export interface Tune {
  id: string;
  name: string;
  createdAt: number;
  keys: KeyScores;
  bpm: number | null;
  timeSignature: string;
  subdivision: number;
  pitchSystem: Temperament;
  aHertz: number;
}

// ============================================================================
// Tune Mastery Settings
// ============================================================================

export type TunerMode = "needle" | "text";
export type Temperament = "equal" | "just";

export interface TuneMasterySettings {
  emaAlpha: number;
  tunerMode: TunerMode;
  temperament: Temperament;
  autoMetronome: boolean;
  autoDrone: boolean;
}

// ============================================================================
// Tune Session
// ============================================================================

export type PickType = "learning" | "reinforcement";

export interface TuneSession {
  tuneId: string;
  key: MusicalKey;
  startedAt?: number;
  pickType?: PickType;
  isManualTune?: boolean;
  isManualKey?: boolean;
}

// ============================================================================
// Tune Mastery Data (full persisted structure)
// ============================================================================

export interface TuneMasteryData {
  settings: TuneMasterySettings;
  activeTunes: Tune[];
  archivedTunes: Tune[];
  currentSession: TuneSession | null;
  lastPickType: PickType;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseTuneMasteryDataReturn {
  data: TuneMasteryData;
  loading: boolean;
  error: Error | null;
  addTune: (name: string) => Tune;
  archiveTune: (tuneId: string) => void;
  restoreTune: (tuneId: string) => void;
  deleteTune: (tuneId: string) => void;
  reorderTune: (tuneId: string, direction: "up" | "down") => void;
  updateScore: (tuneId: string, key: MusicalKey, rating: number) => void;
  updateSettings: (newSettings: Partial<TuneMasterySettings>) => void;
  setCurrentSession: (session: TuneSession | null) => void;
  clearCurrentSession: () => void;
  toggleLastPickType: () => void;
  renameTune: (tuneId: string, newName: string) => void;
}
