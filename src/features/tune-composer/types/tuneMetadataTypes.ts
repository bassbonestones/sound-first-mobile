/**
 * Tune Metadata Types
 *
 * Metadata for tunes stored alongside MusicXML files.
 * This is separate from the score data and used for catalog/search purposes.
 */

import type { PlaybackSettings } from "./tuneComposerTypes";

/**
 * Metadata for a tune, stored in a JSON file alongside the MusicXML
 */
export interface TuneMetadata {
  /** Display title of the tune */
  title: string;
  /** Original key signature as fifths (-7 to +7, matching MusicXML) */
  originalFifths: number;
  /** Difficulty level */
  difficulty?: "beginner" | "early_intermediate" | "intermediate" | "advanced";
  /** Tags for categorization */
  tags?: string[];
  /** Composer/arranger name */
  composer?: string;
  /** Style/genre */
  style?: string;
  /** Notes about the tune */
  notes?: string;
  /** Playback settings (swing, accompaniment style, etc.) */
  playbackSettings?: PlaybackSettings;
  /** When metadata was last updated */
  updatedAt: string;
}

/**
 * Create default metadata for a new tune
 */
export function createDefaultMetadata(title?: string): TuneMetadata {
  return {
    title: title || "Untitled Tune",
    originalFifths: 0,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Format fifths as a human-readable string
 * e.g., 0 -> "no sharps/flats", 2 -> "2 sharps", -3 -> "3 flats"
 */
export function formatFifths(fifths: number): string {
  if (fifths === 0) return "no sharps/flats";
  if (fifths > 0) return `${fifths} sharp${fifths === 1 ? "" : "s"}`;
  return `${-fifths} flat${fifths === -1 ? "" : "s"}`;
}

/**
 * Get the metadata filename for a given musicxml filename
 * e.g., "beginner/my_tune.musicxml" -> "beginner/my_tune.metadata.json"
 */
export function getMetadataFilename(musicxmlFilename: string): string {
  return musicxmlFilename.replace(/\.musicxml$/i, ".metadata.json");
}
