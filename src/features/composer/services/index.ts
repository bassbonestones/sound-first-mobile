/**
 * Composer Services
 *
 * Service layer for the Practice Composer feature.
 */

export {
  generateMusicXml,
  generateMusicXmlPreview,
  validateScoreForExport,
} from "./musicXmlGenerator";
export type { MusicXmlGeneratorOptions } from "./musicXmlGenerator";

export {
  composerStorageService,
  createAutosaveHandler,
} from "./composerStorageService";
export type {
  ScoreMeta,
  SavedScore,
  ScoreListResult,
  ExportOptions,
} from "./composerStorageService";
