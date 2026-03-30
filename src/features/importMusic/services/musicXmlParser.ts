/**
 * MusicXML Parser Service
 *
 * Parses MusicXML content into the normalized ImportedScore format.
 * Supports both score-partwise and score-timewise formats.
 *
 * This is a lightweight parser focused on extracting:
 * - Metadata (title, composer, key, time, tempo)
 * - Part structure
 * - Measure structure with basic note events
 *
 * For full MusicXML parsing with all features (articulations, dynamics,
 * ornaments, etc.), consider using a dedicated library or backend service.
 *
 * @requires fast-xml-parser (or similar XML parser)
 */

import type {
  ImportedScore,
  ImportedMetadata,
  ImportedPart,
  ImportedMeasure,
  ImportedNoteEvent,
  KeySignatureInfo,
  TimeSignatureInfo,
  TempoInfo,
  PitchInfo,
  ImportSourceInfo,
  ImportError,
  NoteLetter,
  DurationType,
  LocalImportAsset,
  ArticulationType,
} from "../../../types/import";
import { createImportError } from "../../../types/import";
import {
  validateMusicXmlContent,
  looksLikeMusicXml,
} from "../utils/validation";

// Re-export chord symbol parsing utilities from extracted module
export {
  harmonyToChordSymbol,
  convertHarmoniesToSymbols,
  extractChordsFromMusicXml,
  extractHarmonyFromMeasure,
  type ParsedHarmony,
  type RawHarmonyData,
} from "./chordSymbolParsing";

// Internal import for use in this file
import {
  extractHarmonyFromMeasure,
  convertHarmoniesToSymbols,
} from "./chordSymbolParsing";
import type { RawHarmonyData } from "./chordSymbolParsing";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of MusicXML parsing
 */
export interface MusicXmlParseResult {
  readonly success: boolean;
  readonly score: ImportedScore | null;
  readonly error: ImportError | null;
  /** Warnings encountered during parsing (non-fatal) */
  readonly warnings: string[];
}

/**
 * Raw parsed MusicXML structure (intermediate representation)
 */
interface RawMusicXmlData {
  readonly identification?: RawIdentification;
  readonly workTitle?: string;
  readonly movementTitle?: string;
  readonly partList: RawPartInfo[];
  readonly parts: RawPart[];
  readonly defaults?: RawDefaults;
}

interface RawIdentification {
  readonly creator?: { type?: string; value: string }[];
  readonly rights?: string;
  readonly encoding?: {
    readonly software?: string;
    readonly encodingDate?: string;
  };
}

interface RawPartInfo {
  readonly id: string;
  readonly partName: string | null;
  readonly partAbbreviation: string | null;
  readonly instrument: string | null;
}

interface RawPart {
  readonly id: string;
  readonly measures: RawMeasure[];
}

interface RawMeasure {
  readonly number: number;
  readonly isPickup?: boolean;
  readonly attributes?: RawAttributes;
  readonly direction?: RawDirection[];
  readonly notes: RawNote[];
  readonly harmony?: RawHarmonyData[];
}

interface RawAttributes {
  readonly divisions?: number;
  readonly key?: { fifths: number; mode?: string };
  readonly time?: {
    beats: number;
    beatType: number;
    symbol?: "common" | "cut";
  };
  readonly clef?: { sign: string; line: number };
}

interface RawDirection {
  readonly metronome?: { beatUnit: string; perMinute: number };
  readonly words?: string;
  readonly dynamics?: string;
}

interface RawLyric {
  readonly text: string;
  readonly syllabic: "single" | "begin" | "middle" | "end";
  readonly extend?: boolean;
}

interface RawNote {
  readonly isRest: boolean;
  readonly isChord: boolean;
  readonly pitch?: { step: string; octave: number; alter?: number };
  readonly duration: number;
  readonly type?: string;
  readonly dots: number;
  readonly tieStart: boolean;
  readonly tieStop: boolean;
  readonly lyric?: RawLyric;
  readonly articulations: string[];
  readonly slurStart: boolean;
  readonly slurEnd: boolean;
  readonly slurPlacement?: "above" | "below";
}

interface RawDefaults {
  readonly scaling?: { millimeters: number; tenths: number };
}

// Note: RawHarmonyData is imported from chordSymbolParsing.ts

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse MusicXML content into ImportedScore
 *
 * @param content - MusicXML string content
 * @param sourceInfo - Information about the import source
 * @returns Parse result with score or error
 */
export async function parseMusicXml(
  content: string,
  sourceInfo: Omit<ImportSourceInfo, "importedAt">,
): Promise<MusicXmlParseResult> {
  const warnings: string[] = [];

  // Validate content first
  const validation = validateMusicXmlContent(content);
  if (!validation.valid || !validation.rootElement) {
    return {
      success: false,
      score: null,
      error: validation.error,
      warnings,
    };
  }

  try {
    // Parse the XML
    const rawData = parseXmlToRaw(content, validation.rootElement, warnings);

    // Convert to ImportedScore
    const score = convertToImportedScore(rawData, {
      ...sourceInfo,
      importedAt: Date.now(),
    });

    return {
      success: true,
      score,
      error: null,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      score: null,
      error: createImportError(
        "parse_failed",
        `MusicXML parsing failed: ${error instanceof Error ? error.message : String(error)}`,
        "We couldn't read the contents of this MusicXML file.",
        {
          severity: "fatal",
          recoverable: false,
          cause: error instanceof Error ? error : undefined,
        },
      ),
      warnings,
    };
  }
}

/**
 * Parse MusicXML from a LocalImportAsset
 */
export async function parseMusicXmlFromAsset(
  asset: LocalImportAsset,
  readContent: () => Promise<string>,
): Promise<MusicXmlParseResult> {
  try {
    const content = await readContent();
    return parseMusicXml(content, {
      sourceType: asset.sourceType,
      originalFileName: asset.fileName,
      remoteAssetId: null,
    });
  } catch (error) {
    return {
      success: false,
      score: null,
      error: createImportError(
        "parse_failed",
        `Failed to read MusicXML file: ${error instanceof Error ? error.message : String(error)}`,
        "We couldn't read this file.",
        {
          severity: "fatal",
          recoverable: false,
          cause: error instanceof Error ? error : undefined,
        },
      ),
      warnings: [],
    };
  }
}

// ============================================================================
// XML Parsing (Lightweight Implementation)
// ============================================================================

/**
 * Parse XML content to raw intermediate format
 *
 * This is a simplified parser using regex and string manipulation.
 * For production use with complex MusicXML, consider using a proper
 * XML parser library like fast-xml-parser.
 */
function parseXmlToRaw(
  content: string,
  rootElement: "score-partwise" | "score-timewise",
  warnings: string[],
): RawMusicXmlData {
  // Extract identification (title, composer, etc.)
  const identification = extractIdentification(content);

  // Extract work/movement titles
  const workTitle = extractTagContent(content, "work-title");
  const movementTitle = extractTagContent(content, "movement-title");

  // Extract part list
  const partList = extractPartList(content);

  // Extract parts with measures
  const parts =
    rootElement === "score-partwise"
      ? extractPartsPartwise(content, warnings)
      : extractPartsTimewise(content, warnings);

  return {
    identification,
    workTitle: workTitle ?? undefined,
    movementTitle: movementTitle ?? undefined,
    partList,
    parts,
  };
}

/**
 * Extract identification block
 */
function extractIdentification(content: string): RawIdentification | undefined {
  const identBlock = extractTagBlock(content, "identification");
  if (!identBlock) return undefined;

  const creators: { type?: string; value: string }[] = [];

  // Extract creators (composer, lyricist, etc.)
  const creatorRegex =
    /<creator[^>]*type=["']([^"']*)["'][^>]*>([^<]*)<\/creator>/gi;
  let match;
  while ((match = creatorRegex.exec(identBlock)) !== null) {
    creators.push({ type: match[1], value: match[2].trim() });
  }

  // Also check for creators without type attribute
  const creatorSimpleRegex = /<creator>([^<]*)<\/creator>/gi;
  while ((match = creatorSimpleRegex.exec(identBlock)) !== null) {
    creators.push({ value: match[1].trim() });
  }

  const rights = extractTagContent(identBlock, "rights");

  return {
    creator: creators.length > 0 ? creators : undefined,
    rights: rights ?? undefined,
  };
}

/**
 * Extract part list information
 */
function extractPartList(content: string): RawPartInfo[] {
  const partListBlock = extractTagBlock(content, "part-list");
  if (!partListBlock) return [];

  const parts: RawPartInfo[] = [];
  const scorePartRegex =
    /<score-part[^>]*id=["']([^"']*)["'][^>]*>([\s\S]*?)<\/score-part>/gi;

  let match;
  while ((match = scorePartRegex.exec(partListBlock)) !== null) {
    const partId = match[1];
    const partContent = match[2];

    parts.push({
      id: partId,
      partName: extractTagContent(partContent, "part-name"),
      partAbbreviation: extractTagContent(partContent, "part-abbreviation"),
      instrument: extractTagContent(partContent, "instrument-name"),
    });
  }

  return parts;
}

/**
 * Extract parts from score-partwise format
 */
function extractPartsPartwise(content: string, warnings: string[]): RawPart[] {
  const parts: RawPart[] = [];
  const partRegex = /<part[^>]*id=["']([^"']*)["'][^>]*>([\s\S]*?)<\/part>/gi;

  let match;
  while ((match = partRegex.exec(content)) !== null) {
    const partId = match[1];
    const partContent = match[2];

    const measures = extractMeasures(partContent, warnings);

    parts.push({
      id: partId,
      measures,
    });
  }

  return parts;
}

/**
 * Extract parts from score-timewise format
 * TODO: Implement score-timewise parsing
 */
function extractPartsTimewise(content: string, warnings: string[]): RawPart[] {
  warnings.push(
    "score-timewise format support is limited; some data may be incomplete",
  );
  // For now, attempt to extract as partwise (many files support both)
  return extractPartsPartwise(content, warnings);
}

/**
 * Extract measures from a part
 */
function extractMeasures(
  partContent: string,
  warnings: string[],
): RawMeasure[] {
  const measures: RawMeasure[] = [];
  // Capture measure tag attributes and content
  const measureRegex = /<measure([^>]*)>([\s\S]*?)<\/measure>/gi;

  let match;
  while ((match = measureRegex.exec(partContent)) !== null) {
    const measureAttrs = match[1];
    const measureContent = match[2];

    // Extract measure number
    const numberMatch = measureAttrs.match(/number=["'](\d+)["']/i);
    const measureNumber = numberMatch ? parseInt(numberMatch[1], 10) : 0;

    // Check for implicit="yes" (pickup measure)
    const isPickup = /implicit=["']yes["']/i.test(measureAttrs);

    const attributes = extractAttributes(measureContent);
    const direction = extractDirections(measureContent);
    const notes = extractNotes(measureContent, warnings);
    const harmony = extractHarmonyFromMeasure(measureContent);

    measures.push({
      number: measureNumber,
      isPickup,
      attributes,
      direction,
      notes,
      harmony: harmony.length > 0 ? harmony : undefined,
    });
  }

  return measures;
}

/**
 * Extract attributes from a measure
 */
function extractAttributes(measureContent: string): RawAttributes | undefined {
  const attrBlock = extractTagBlock(measureContent, "attributes");
  if (!attrBlock) return undefined;

  // Divisions
  const divisionsStr = extractTagContent(attrBlock, "divisions");
  const divisions = divisionsStr ? parseInt(divisionsStr, 10) : undefined;

  // Key signature
  const keyBlock = extractTagBlock(attrBlock, "key");
  let key: { fifths: number; mode?: string } | undefined;
  if (keyBlock) {
    const fifthsStr = extractTagContent(keyBlock, "fifths");
    const mode = extractTagContent(keyBlock, "mode");
    if (fifthsStr) {
      key = { fifths: parseInt(fifthsStr, 10), mode: mode ?? undefined };
    }
  }

  // Time signature
  const timeBlock = extractTagBlock(attrBlock, "time");
  let time:
    | { beats: number; beatType: number; symbol?: "common" | "cut" }
    | undefined;
  if (timeBlock) {
    const beatsStr = extractTagContent(timeBlock, "beats");
    const beatTypeStr = extractTagContent(timeBlock, "beat-type");
    if (beatsStr && beatTypeStr) {
      // Check for symbol attribute on the <time> tag (e.g., symbol="cut" for cut time)
      // Note: We search attrBlock (not timeBlock) because extractTagBlock returns only inner content
      const symbolMatch = attrBlock.match(
        /<time[^>]*symbol="(common|cut)"[^>]*>/i,
      );
      time = {
        beats: parseInt(beatsStr, 10),
        beatType: parseInt(beatTypeStr, 10),
        ...(symbolMatch
          ? { symbol: symbolMatch[1].toLowerCase() as "common" | "cut" }
          : {}),
      };
    }
  }

  return { divisions, key, time };
}

/**
 * Extract direction elements (tempo, dynamics, etc.)
 */
function extractDirections(measureContent: string): RawDirection[] {
  const directions: RawDirection[] = [];
  const directionRegex = /<direction[^>]*>([\s\S]*?)<\/direction>/gi;

  let match;
  while ((match = directionRegex.exec(measureContent)) !== null) {
    const dirContent = match[1];

    // Metronome (visual tempo marking)
    const metronomeBlock = extractTagBlock(dirContent, "metronome");
    let metronome: { beatUnit: string; perMinute: number } | undefined;
    if (metronomeBlock) {
      const beatUnit = extractTagContent(metronomeBlock, "beat-unit");
      const perMinuteStr = extractTagContent(metronomeBlock, "per-minute");
      if (beatUnit && perMinuteStr) {
        metronome = { beatUnit, perMinute: parseInt(perMinuteStr, 10) };
      }
    }

    // Sound element (playback tempo) - fallback if no metronome
    // Format: <sound tempo="100"/> or <sound tempo="100"></sound>
    if (!metronome) {
      const soundMatch = dirContent.match(
        /<sound[^>]*tempo=["'](\d+(?:\.\d+)?)["'][^>]*\/?>/i,
      );
      if (soundMatch) {
        const tempo = parseFloat(soundMatch[1]);
        if (tempo > 0) {
          metronome = { beatUnit: "quarter", perMinute: Math.round(tempo) };
        }
      }
    }

    // Words (tempo markings, etc.)
    const words = extractTagContent(dirContent, "words");

    // Dynamics (pp, p, mp, mf, f, ff, fp, sf, sfz, etc.)
    let dynamics: string | undefined;
    const dynamicsBlock = extractTagBlock(dirContent, "dynamics");
    if (dynamicsBlock) {
      // The dynamic is an empty element like <f/> or <mf/> inside <dynamics>
      const dynamicMatch = dynamicsBlock.match(
        /<(pp|p|mp|mf|f|ff|fff|fp|sf|sfz|fz|sfp|sfpp|rfz|ppp|pppp|ffff)[^>]*\/>/i,
      );
      if (dynamicMatch) {
        dynamics = dynamicMatch[1].toLowerCase();
      }
    }

    if (metronome || words || dynamics) {
      directions.push({ metronome, words: words ?? undefined, dynamics });
    }
  }

  return directions;
}

/**
 * Extract notes from a measure
 */
function extractNotes(measureContent: string, _warnings: string[]): RawNote[] {
  const notes: RawNote[] = [];
  const noteRegex = /<note[^>]*>([\s\S]*?)<\/note>/gi;

  let match;
  while ((match = noteRegex.exec(measureContent)) !== null) {
    const noteContent = match[1];

    // Check if rest
    const isRest = noteContent.includes("<rest");

    // Check if chord (continuation of previous note)
    const isChord = noteContent.includes("<chord");

    // Extract pitch
    let pitch: { step: string; octave: number; alter?: number } | undefined;
    if (!isRest) {
      const pitchBlock = extractTagBlock(noteContent, "pitch");
      if (pitchBlock) {
        const step = extractTagContent(pitchBlock, "step");
        const octaveStr = extractTagContent(pitchBlock, "octave");
        const alterStr = extractTagContent(pitchBlock, "alter");
        if (step && octaveStr) {
          pitch = {
            step,
            octave: parseInt(octaveStr, 10),
            alter: alterStr ? parseInt(alterStr, 10) : undefined,
          };
        }
      }
    }

    // Duration
    const durationStr = extractTagContent(noteContent, "duration");
    const duration = durationStr ? parseInt(durationStr, 10) : 0;

    // Type (quarter, half, etc.)
    const type = extractTagContent(noteContent, "type");

    // Dots
    const dots = (noteContent.match(/<dot\s*\/?>|<dot>/g) || []).length;

    // Ties
    const tieStart = /<tie[^>]*type=["']start["']/i.test(noteContent);
    const tieStop = /<tie[^>]*type=["']stop["']/i.test(noteContent);

    // Lyric
    let lyric: RawLyric | undefined;
    const lyricBlock = extractTagBlock(noteContent, "lyric");
    if (lyricBlock) {
      const lyricText = extractTagContent(lyricBlock, "text");
      const syllabicStr = extractTagContent(lyricBlock, "syllabic");
      const hasExtend = lyricBlock.includes("<extend");

      if (lyricText) {
        lyric = {
          text: lyricText,
          syllabic: (syllabicStr as RawLyric["syllabic"]) || "single",
          extend: hasExtend || undefined,
        };
      }
    }

    // Articulations (inside <notations><articulations>)
    const articulations: string[] = [];
    let slurStart = false;
    let slurEnd = false;
    let slurPlacement: "above" | "below" | undefined;
    const notationsBlock = extractTagBlock(noteContent, "notations");
    if (notationsBlock) {
      const articulationsBlock = extractTagBlock(
        notationsBlock,
        "articulations",
      );
      if (articulationsBlock) {
        // Look for common articulations as empty elements
        const articulationTypes = [
          "staccato",
          "accent",
          "tenuto",
          "staccatissimo",
          "strong-accent",
          "detached-legato",
        ];
        for (const art of articulationTypes) {
          if (new RegExp(`<${art}[^>]*/>`).test(articulationsBlock)) {
            articulations.push(art);
          }
        }
      }
      // Fermata is directly inside notations, not articulations
      if (/<fermata[^>]*\/?>/.test(notationsBlock)) {
        articulations.push("fermata");
      }
      // Slurs - check for slur start and stop, plus placement
      const slurStartMatch = notationsBlock.match(
        /<slur[^>]*type=["']start["'][^>]*>/i,
      );
      if (slurStartMatch) {
        slurStart = true;
        // Extract placement attribute if present
        const placementMatch = slurStartMatch[0].match(
          /placement=["'](above|below)["']/i,
        );
        if (placementMatch) {
          slurPlacement = placementMatch[1].toLowerCase() as "above" | "below";
        }
      }
      if (/<slur[^>]*type=["']stop["']/i.test(notationsBlock)) {
        slurEnd = true;
      }
    }

    notes.push({
      isRest,
      isChord,
      pitch,
      duration,
      type: type ?? undefined,
      dots,
      tieStart,
      tieStop,
      lyric,
      articulations,
      slurStart,
      slurEnd,
      slurPlacement,
    });
  }

  return notes;
}

// Note: extractHarmony, harmony-to-chord-symbol mapping, and related functions
// have been extracted to chordSymbolParsing.ts

// ============================================================================
// XML Helper Functions
// ============================================================================

/**
 * Unescape XML entities back to original characters
 */
function unescapeXml(text: string): string {
  return text
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&"); // Must be last to avoid double-unescaping
}

/**
 * Extract content between opening and closing tags
 */
function extractTagContent(content: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i");
  const match = content.match(regex);
  return match ? unescapeXml(match[1].trim()) : null;
}

/**
 * Extract entire block including nested content
 */
function extractTagBlock(content: string, tagName: string): string | null {
  // Simple extraction - works for non-nested same-named tags
  const startTag = new RegExp(`<${tagName}[^>]*>`, "i");
  const startMatch = startTag.exec(content);
  if (!startMatch) return null;

  const endTag = `</${tagName}>`;
  const endIndex = content
    .toLowerCase()
    .indexOf(endTag.toLowerCase(), startMatch.index);
  if (endIndex === -1) return null;

  return content.slice(startMatch.index + startMatch[0].length, endIndex);
}

// ============================================================================
// Conversion to ImportedScore
// ============================================================================

/**
 * Convert raw parsed data to ImportedScore
 */
function convertToImportedScore(
  raw: RawMusicXmlData,
  sourceInfo: ImportSourceInfo,
): ImportedScore {
  const id = `score_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  // Extract metadata
  const metadata = extractMetadata(raw);

  // Convert parts
  const parts = convertParts(raw);

  // Calculate total measure count
  const measureCount = parts.length > 0 ? parts[0].measures.length : 0;

  return {
    id,
    metadata,
    parts,
    measureCount,
    sourceInfo,
    confidence: null, // No confidence for direct parsing
  };
}

/**
 * Extract metadata from raw data
 */
function extractMetadata(raw: RawMusicXmlData): ImportedMetadata {
  // Find composer
  const composer =
    raw.identification?.creator?.find(
      (c) => c.type?.toLowerCase() === "composer",
    )?.value ??
    raw.identification?.creator?.[0]?.value ??
    null;

  // Find arranger
  const arranger =
    raw.identification?.creator?.find(
      (c) => c.type?.toLowerCase() === "arranger",
    )?.value ?? null;

  // Get title (prefer movement-title, fall back to work-title)
  const title = raw.movementTitle ?? raw.workTitle ?? null;

  // Extract first key signature
  let keySignature: KeySignatureInfo | null = null;
  for (const part of raw.parts) {
    for (const measure of part.measures) {
      if (measure.attributes?.key) {
        keySignature = convertKeySignature(measure.attributes.key);
        break;
      }
    }
    if (keySignature) break;
  }

  // Extract first time signature
  let timeSignature: TimeSignatureInfo | null = null;
  for (const part of raw.parts) {
    for (const measure of part.measures) {
      if (measure.attributes?.time) {
        timeSignature = convertTimeSignature(measure.attributes.time);
        break;
      }
    }
    if (timeSignature) break;
  }

  // Extract first tempo
  let tempo: TempoInfo | null = null;
  for (const part of raw.parts) {
    for (const measure of part.measures) {
      for (const dir of measure.direction || []) {
        if (dir.metronome) {
          tempo = {
            bpm: dir.metronome.perMinute,
            beatUnit: dir.metronome.beatUnit,
            marking: dir.words ?? null,
          };
          break;
        }
      }
      if (tempo) break;
    }
    if (tempo) break;
  }

  return {
    title,
    composer,
    arranger,
    movementTitle: raw.movementTitle ?? null,
    workTitle: raw.workTitle ?? null,
    copyright: raw.identification?.rights ?? null,
    keySignature,
    timeSignature,
    tempo,
  };
}

/**
 * Convert key signature
 */
function convertKeySignature(key: {
  fifths: number;
  mode?: string;
}): KeySignatureInfo {
  const fifths = key.fifths;
  const mode = key.mode === "minor" ? "minor" : "major";

  // Generate display name
  const majorKeys = ["C", "G", "D", "A", "E", "B", "F#", "C#"];
  const minorKeys = ["A", "E", "B", "F#", "C#", "G#", "D#", "A#"];
  const flatMajorKeys = ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb"];
  const flatMinorKeys = ["A", "D", "G", "C", "F", "Bb", "Eb", "Ab"];

  let displayName: string;
  if (fifths >= 0) {
    const keys = mode === "minor" ? minorKeys : majorKeys;
    displayName = `${keys[Math.min(fifths, keys.length - 1)]} ${mode === "minor" ? "Minor" : "Major"}`;
  } else {
    const keys = mode === "minor" ? flatMinorKeys : flatMajorKeys;
    displayName = `${keys[Math.min(-fifths, keys.length - 1)]} ${mode === "minor" ? "Minor" : "Major"}`;
  }

  return {
    fifths,
    mode,
    displayName,
  };
}

/**
 * Convert time signature
 */
function convertTimeSignature(time: {
  beats: number;
  beatType: number;
  symbol?: "common" | "cut";
}): TimeSignatureInfo {
  return {
    beats: time.beats,
    beatType: time.beatType,
    displayName: `${time.beats}/${time.beatType}`,
    ...(time.symbol ? { symbol: time.symbol } : {}),
  };
}

/**
 * Convert parts
 */
function convertParts(raw: RawMusicXmlData): ImportedPart[] {
  return raw.parts.map((rawPart) => {
    const partInfo = raw.partList.find((p) => p.id === rawPart.id);

    return {
      id: rawPart.id,
      name: partInfo?.partName ?? null,
      abbreviation: partInfo?.partAbbreviation ?? null,
      instrument: partInfo?.instrument ?? null,
      measures: convertMeasures(rawPart.measures),
    };
  });
}

/**
 * Convert measures
 */
function convertMeasures(rawMeasures: RawMeasure[]): ImportedMeasure[] {
  return rawMeasures.map((rawMeasure) => {
    // Extract initial dynamic from directions (first one found)
    const initialDynamic =
      rawMeasure.direction?.find((d) => d.dynamics)?.dynamics ?? null;

    // Extract expression text from directions (words without metronome = expression)
    // Skip words that look like tempo markings (contain numbers or "Allegro", "Andante", etc.)
    const initialExpression =
      rawMeasure.direction?.find(
        (d) => d.words && !d.metronome && !isTempoWord(d.words),
      )?.words ?? null;

    // Convert harmony data to ImportedHarmony format
    const harmony = rawMeasure.harmony
      ? convertHarmoniesToSymbols(rawMeasure.harmony)
      : undefined;

    return {
      number: rawMeasure.number,
      events: convertNotes(rawMeasure.notes, initialDynamic, initialExpression),
      timeSignature: rawMeasure.attributes?.time
        ? convertTimeSignature(rawMeasure.attributes.time)
        : null,
      keySignature: rawMeasure.attributes?.key
        ? convertKeySignature(rawMeasure.attributes.key)
        : null,
      confidence: null,
      isPickup: rawMeasure.isPickup || undefined,
      harmony: harmony && harmony.length > 0 ? harmony : undefined,
    };
  });
}

/**
 * Check if a word looks like a tempo marking rather than expression text
 */
function isTempoWord(word: string): boolean {
  const tempoPatterns = [
    /allegro/i,
    /andante/i,
    /adagio/i,
    /presto/i,
    /largo/i,
    /moderato/i,
    /vivace/i,
    /lento/i,
    /grave/i,
    /tempo/i,
    /a tempo/i,
    /rit\./i,
    /accel\./i,
    /\d+\s*bpm/i,
    /\d+\s*=/i,
    /=\s*\d+/i,
  ];
  return tempoPatterns.some((p) => p.test(word));
}

/**
 * Convert notes to ImportedNoteEvent
 * @param rawNotes - The raw notes to convert
 * @param initialDynamic - Dynamic marking that applies to the first pitched note
 * @param initialExpression - Expression text that applies to the first pitched note
 */
function convertNotes(
  rawNotes: RawNote[],
  initialDynamic: string | null = null,
  initialExpression: string | null = null,
): ImportedNoteEvent[] {
  const events: ImportedNoteEvent[] = [];
  let currentChordPitches: PitchInfo[] = [];
  let currentChordNote: RawNote | null = null;
  let dynamicApplied = false;
  let expressionApplied = false;
  let pitchedNoteCount = 0; // Track pitched notes to offset expression
  const dynamicToApply = initialDynamic;
  const expressionToApply = initialExpression;

  for (const rawNote of rawNotes) {
    if (rawNote.isChord && currentChordNote) {
      // Add to current chord
      if (rawNote.pitch) {
        currentChordPitches.push(convertPitch(rawNote.pitch));
      }
    } else {
      // Flush previous chord if exists
      if (currentChordNote && currentChordPitches.length > 1) {
        const useDynamic =
          !dynamicApplied && dynamicToApply && !currentChordNote.isRest;
        // Expression goes on second pitched note (index 1) to avoid overlap with tempo
        const useExpression =
          !expressionApplied &&
          expressionToApply &&
          !currentChordNote.isRest &&
          pitchedNoteCount === 1;
        events.push(
          createNoteEvent(
            currentChordNote,
            null,
            currentChordPitches,
            useDynamic ? dynamicToApply : null,
            useExpression ? expressionToApply : null,
          ),
        );
        if (useDynamic) dynamicApplied = true;
        if (useExpression) expressionApplied = true;
        if (!currentChordNote.isRest) pitchedNoteCount++;
      } else if (currentChordNote && currentChordPitches.length === 1) {
        const useDynamic =
          !dynamicApplied && dynamicToApply && !currentChordNote.isRest;
        // Expression goes on second pitched note (index 1) to avoid overlap with tempo
        const useExpression =
          !expressionApplied &&
          expressionToApply &&
          !currentChordNote.isRest &&
          pitchedNoteCount === 1;
        events.push(
          createNoteEvent(
            currentChordNote,
            currentChordPitches[0],
            null,
            useDynamic ? dynamicToApply : null,
            useExpression ? expressionToApply : null,
          ),
        );
        if (useDynamic) dynamicApplied = true;
        if (useExpression) expressionApplied = true;
        if (!currentChordNote.isRest) pitchedNoteCount++;
      }

      // Start new note/chord
      currentChordNote = rawNote;
      currentChordPitches = rawNote.pitch ? [convertPitch(rawNote.pitch)] : [];

      // If it's a rest or non-chord note, add it immediately
      if (rawNote.isRest || !rawNote.isChord) {
        if (rawNote.isRest) {
          events.push(createNoteEvent(rawNote, null, null, null, null));
          currentChordNote = null;
          currentChordPitches = [];
        }
      }
    }
  }

  // Flush final note/chord
  if (currentChordNote && currentChordPitches.length > 1) {
    const useDynamic =
      !dynamicApplied && dynamicToApply && !currentChordNote.isRest;
    const useExpression =
      !expressionApplied &&
      expressionToApply &&
      !currentChordNote.isRest &&
      pitchedNoteCount === 1;
    events.push(
      createNoteEvent(
        currentChordNote,
        null,
        currentChordPitches,
        useDynamic ? dynamicToApply : null,
        useExpression ? expressionToApply : null,
      ),
    );
  } else if (currentChordNote && currentChordPitches.length === 1) {
    const useDynamic =
      !dynamicApplied && dynamicToApply && !currentChordNote.isRest;
    const useExpression =
      !expressionApplied &&
      expressionToApply &&
      !currentChordNote.isRest &&
      pitchedNoteCount === 1;
    events.push(
      createNoteEvent(
        currentChordNote,
        currentChordPitches[0],
        null,
        useDynamic ? dynamicToApply : null,
        useExpression ? expressionToApply : null,
      ),
    );
  }

  return events;
}

/**
 * Map MusicXML articulation name to import ArticulationType
 */
function mapArticulation(art: string): ArticulationType | null {
  switch (art.toLowerCase()) {
    case "staccato":
      return "staccato";
    case "accent":
      return "accent";
    case "tenuto":
      return "tenuto";
    case "strong-accent":
      return "marcato";
    case "fermata":
      return "fermata";
    // staccatissimo and detached-legato not in import type, skip
    default:
      return null;
  }
}

/**
 * Create a note event
 */
function createNoteEvent(
  rawNote: RawNote,
  pitch: PitchInfo | null,
  pitches: PitchInfo[] | null,
  dynamics: string | null = null,
  expression: string | null = null,
): ImportedNoteEvent {
  // Map raw articulations to typed ArticulationType
  const articulations = rawNote.articulations
    .map(mapArticulation)
    .filter((a): a is ArticulationType => a !== null);

  return {
    type: rawNote.isRest
      ? "rest"
      : pitches && pitches.length > 1
        ? "chord"
        : "note",
    pitch,
    pitches,
    duration: rawNote.duration,
    durationType: mapDurationType(rawNote.type),
    dots: rawNote.dots,
    articulations,
    dynamics,
    tiedToNext: rawNote.tieStart,
    tiedFromPrevious: rawNote.tieStop,
    lyric: rawNote.lyric
      ? {
          text: rawNote.lyric.text,
          syllabic: rawNote.lyric.syllabic,
          extend: rawNote.lyric.extend,
        }
      : null,
    slurStart: rawNote.slurStart,
    slurEnd: rawNote.slurEnd,
    slurPlacement: rawNote.slurPlacement,
    expression,
  };
}

/**
 * Convert pitch
 */
function convertPitch(pitch: {
  step: string;
  octave: number;
  alter?: number;
}): PitchInfo {
  const alter = pitch.alter ?? 0;
  const alterSymbol = alter === 1 ? "#" : alter === -1 ? "b" : "";

  return {
    step: pitch.step.toUpperCase() as NoteLetter,
    octave: pitch.octave,
    alter,
    displayName: `${pitch.step}${alterSymbol}${pitch.octave}`,
  };
}

/**
 * Map MusicXML duration type to our enum
 */
function mapDurationType(type: string | undefined): DurationType {
  switch (type?.toLowerCase()) {
    case "whole":
      return "whole";
    case "half":
      return "half";
    case "quarter":
      return "quarter";
    case "eighth":
      return "eighth";
    case "16th":
      return "16th";
    case "32nd":
      return "32nd";
    case "64th":
      return "64th";
    case "128th":
      return "128th";
    default:
      return "quarter"; // Default
  }
}

// ============================================================================
// Quick Metadata Extraction
// ============================================================================

/**
 * Extract just metadata without full parsing
 * Useful for preview display
 */
export function extractMusicXmlMetadataQuick(
  content: string,
): Partial<ImportedMetadata> {
  if (!looksLikeMusicXml(content)) {
    return {};
  }

  const identification = extractIdentification(content);
  const workTitle = extractTagContent(content, "work-title");
  const movementTitle = extractTagContent(content, "movement-title");

  const composer =
    identification?.creator?.find((c) => c.type?.toLowerCase() === "composer")
      ?.value ??
    identification?.creator?.[0]?.value ??
    null;

  return {
    title: movementTitle ?? workTitle ?? null,
    composer,
    workTitle: workTitle ?? undefined,
    movementTitle: movementTitle ?? undefined,
  };
}
