/**
 * Tune Composer Services - Barrel Export
 */

export {
  tuneComposerStorageService,
  createAutosaveHandler,
} from "./tuneComposerStorageService";
export type {
  TuneScoreMeta,
  SavedTuneScore,
  TuneScoreListResult,
  ExportOptions,
} from "./tuneComposerStorageService";

export {
  generateMusicXml,
  generateMusicXmlPreview,
  validateScoreForExport,
  generateHarmonyXml,
} from "./tuneComposerMusicXmlGenerator";

export {
  recognizeChord,
  getAutocompleteSuggestions,
  spellChord,
  transposeChord,
  isValidChordSymbol,
  getChordIntervals,
  getSupportedQualities,
} from "./chordRecognition";
export { generateChordPreviewMusicXml } from "./chordMusicXmlGenerator";
export type {
  ChordRoot,
  ChordQuality,
  ParsedChord,
  ChordRecognitionResult,
} from "./chordRecognition";
export type { MusicXmlGeneratorOptions } from "./tuneComposerMusicXmlGenerator";

export { practiceContentToMusicXml } from "./pitchEventsToMusicXml";
export type { PracticeContentToMusicXmlOptions } from "./pitchEventsToMusicXml";

// Re-export composer synth for playback (shared service)
export { composerSynth } from "../../composer/services/composerSynth";
