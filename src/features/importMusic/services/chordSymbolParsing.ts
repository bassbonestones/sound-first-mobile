/**
 * Chord Symbol Parsing - MusicXML harmony to chord symbol conversion
 *
 * Extracted from musicXmlParser.ts for maintainability.
 * Self-contained module for parsing and converting MusicXML harmony elements.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Raw harmony element from MusicXML
 * Represents a chord symbol positioned at a specific beat offset
 */
interface RawHarmony {
  /** Root note (e.g., "C", "F#", "Bb") */
  readonly root: { step: string; alter?: number };
  /** MusicXML kind (e.g., "major", "minor", "dominant", "major-seventh") */
  readonly kind: string;
  /** Optional bass note for slash chords */
  readonly bass?: { step: string; alter?: number };
  /** Beat offset within the measure (in divisions) */
  readonly offset?: number;
}

/**
 * Parsed harmony result for use by external code
 */
export interface ParsedHarmony {
  /** The chord symbol string (e.g., "Cmaj7", "F#m7", "G/B") */
  symbol: string;
  /** Beat offset in divisions */
  offset: number;
}

// =============================================================================
// XML Helper Functions
// =============================================================================

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

// =============================================================================
// MusicXML Harmony Extraction
// =============================================================================

/**
 * Raw harmony data structure for internal use
 */
export interface RawHarmonyData {
  /** Root note (e.g., "C", "F#", "Bb") */
  readonly root: { step: string; alter?: number };
  /** MusicXML kind (e.g., "major", "minor", "dominant", "major-seventh") */
  readonly kind: string;
  /** Optional bass note for slash chords */
  readonly bass?: { step: string; alter?: number };
  /** Beat offset within the measure (in divisions) */
  readonly offset?: number;
}

/**
 * Extract harmony elements (chord symbols) from a measure
 */
export function extractHarmonyFromMeasure(
  measureContent: string,
): RawHarmonyData[] {
  const harmonies: RawHarmonyData[] = [];
  const harmonyRegex = /<harmony[^>]*>([\s\S]*?)<\/harmony>/gi;

  let match;
  while ((match = harmonyRegex.exec(measureContent)) !== null) {
    const harmonyContent = match[1];

    // Extract root
    const rootBlock = extractTagBlock(harmonyContent, "root");
    if (!rootBlock) continue;

    const rootStep = extractTagContent(rootBlock, "root-step");
    if (!rootStep) continue;

    const rootAlterStr = extractTagContent(rootBlock, "root-alter");
    const rootAlter = rootAlterStr ? parseInt(rootAlterStr, 10) : undefined;

    // Extract kind (required)
    const kind = extractTagContent(harmonyContent, "kind");
    if (!kind) continue;

    // Extract optional bass (for slash chords)
    let bass: { step: string; alter?: number } | undefined;
    const bassBlock = extractTagBlock(harmonyContent, "bass");
    if (bassBlock) {
      const bassStep = extractTagContent(bassBlock, "bass-step");
      if (bassStep) {
        const bassAlterStr = extractTagContent(bassBlock, "bass-alter");
        bass = {
          step: bassStep,
          alter: bassAlterStr ? parseInt(bassAlterStr, 10) : undefined,
        };
      }
    }

    // Extract optional offset
    const offsetStr = extractTagContent(harmonyContent, "offset");
    const offset = offsetStr ? parseInt(offsetStr, 10) : undefined;

    harmonies.push({
      root: { step: rootStep, alter: rootAlter },
      kind,
      bass,
      offset,
    });
  }

  return harmonies;
}

// =============================================================================
// MusicXML Harmony to Chord Symbol Mapping
// =============================================================================

/**
 * Mapping from MusicXML kind values to chord symbol suffixes
 * Based on: https://www.w3.org/2021/06/musicxml40/musicxml-reference/data-types/kind-value/
 */
const MUSICXML_KIND_TO_SUFFIX: Record<string, string> = {
  // Triads
  major: "",
  minor: "m",
  augmented: "aug",
  diminished: "dim",
  // Sevenths
  dominant: "7",
  "major-seventh": "maj7",
  "minor-seventh": "m7",
  "diminished-seventh": "dim7",
  "augmented-seventh": "aug7",
  "half-diminished": "m7b5",
  "major-minor": "mMaj7", // Minor triad with major 7th
  // Sixths
  "major-sixth": "6",
  "minor-sixth": "m6",
  // Ninths
  "dominant-ninth": "9",
  "major-ninth": "maj9",
  "minor-ninth": "m9",
  // 11ths
  "dominant-11th": "11",
  "major-11th": "maj11",
  "minor-11th": "m11",
  // 13ths
  "dominant-13th": "13",
  "major-13th": "maj13",
  "minor-13th": "m13",
  // Suspended
  "suspended-second": "sus2",
  "suspended-fourth": "sus4",
  // Other
  power: "5", // Power chord (just root and fifth)
  none: "", // No chord symbol (N.C.)
  other: "", // Custom - will use text content
  // Italian/French/German augmented sixths
  Italian: "It+6",
  French: "Fr+6",
  German: "Ger+6",
  // Neapolitan
  Neapolitan: "N",
  // Pedal
  pedal: "ped",
  // Tristan chord
  Tristan: "Tr",
};

/**
 * Convert alter value to accidental string
 */
function alterToAccidental(alter: number | undefined): string {
  if (alter === undefined || alter === 0) return "";
  if (alter === 1) return "#";
  if (alter === -1) return "b";
  if (alter === 2) return "##";
  if (alter === -2) return "bb";
  return alter > 0 ? "#".repeat(alter) : "b".repeat(Math.abs(alter));
}

/**
 * Convert a MusicXML harmony element to a chord symbol string
 *
 * @param root - Root note with step and optional alter
 * @param kind - MusicXML kind value
 * @param bass - Optional bass note for slash chords
 * @returns Chord symbol string
 *
 * @example
 * harmonyToChordSymbol({ step: "C" }, "major-seventh")
 * // Returns "Cmaj7"
 *
 * harmonyToChordSymbol({ step: "F", alter: 1 }, "minor")
 * // Returns "F#m"
 *
 * harmonyToChordSymbol({ step: "G" }, "major", { step: "B" })
 * // Returns "G/B"
 */
export function harmonyToChordSymbol(
  root: { step: string; alter?: number },
  kind: string,
  bass?: { step: string; alter?: number },
): string {
  const rootNote = root.step + alterToAccidental(root.alter);
  const suffix = MUSICXML_KIND_TO_SUFFIX[kind] ?? "";

  let symbol = rootNote + suffix;

  if (bass) {
    const bassNote = bass.step + alterToAccidental(bass.alter);
    symbol += "/" + bassNote;
  }

  return symbol;
}

/**
 * Convert RawHarmony array from parser to ParsedHarmony array
 *
 * @param rawHarmonies - Array of RawHarmony from parseXmlToRaw
 * @returns Array of ParsedHarmony with chord symbols
 */
export function convertHarmoniesToSymbols(
  rawHarmonies: ReadonlyArray<{
    root: { step: string; alter?: number };
    kind: string;
    bass?: { step: string; alter?: number };
    offset?: number;
  }>,
): ParsedHarmony[] {
  return rawHarmonies.map((h) => ({
    symbol: harmonyToChordSymbol(h.root, h.kind, h.bass),
    offset: h.offset ?? 0,
  }));
}

/**
 * Extract all chord symbols from a parsed MusicXML score
 *
 * @param content - Raw MusicXML content string
 * @returns Array of measures with their chord symbols
 */
export function extractChordsFromMusicXml(
  content: string,
): Array<{ measureNumber: number; chords: ParsedHarmony[] }> {
  const results: Array<{ measureNumber: number; chords: ParsedHarmony[] }> = [];

  // Quick check for harmony elements
  if (!content.includes("<harmony")) {
    return results;
  }

  // Extract measures with harmony
  const measureRegex =
    /<measure[^>]*number=["'](\d+)["'][^>]*>([\s\S]*?)<\/measure>/gi;

  let match;
  while ((match = measureRegex.exec(content)) !== null) {
    const measureNumber = parseInt(match[1], 10);
    const measureContent = match[2];

    if (measureContent.includes("<harmony")) {
      const rawHarmonies = extractHarmonyFromMeasure(measureContent);
      if (rawHarmonies.length > 0) {
        results.push({
          measureNumber,
          chords: convertHarmoniesToSymbols(rawHarmonies),
        });
      }
    }
  }

  return results;
}
