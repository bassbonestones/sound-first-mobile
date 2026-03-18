/**
 * MXL Handler Service
 *
 * Handles compressed MusicXML (.mxl) files.
 * MXL files are ZIP archives containing:
 * - META-INF/container.xml - references the root MusicXML file
 * - One or more .musicxml or .xml files
 * - Optionally: embedded images, fonts, etc.
 */

import JSZip from "jszip";
import type { LocalImportAsset, ImportError } from "../../../types/import";
import { createImportError } from "../../../types/import";
import { parseMusicXml, type MusicXmlParseResult } from "./musicXmlParser";
import { readFileAsBase64 } from "./fileAcquisition";

// ============================================================================
// Types
// ============================================================================

/**
 * Result of MXL extraction
 */
export interface MxlExtractionResult {
  readonly success: boolean;
  readonly musicXmlContent: string | null;
  readonly rootFileName: string | null;
  readonly error: ImportError | null;
}

// ============================================================================
// MXL Extraction
// ============================================================================

/**
 * Extract MusicXML content from an MXL file
 *
 * MXL files are ZIP archives containing:
 * 1. META-INF/container.xml - references the root MusicXML file
 * 2. One or more .musicxml or .xml files
 *
 * This function:
 * 1. Reads the MXL file as base64
 * 2. Extracts META-INF/container.xml to find the root file path
 * 3. Extracts and returns the root MusicXML content
 */
export async function extractMxlContent(
  asset: LocalImportAsset,
): Promise<MxlExtractionResult> {
  try {
    // Read file as base64
    const base64Content = await readFileAsBase64(asset.uri);

    // Load ZIP archive
    const zip = await JSZip.loadAsync(base64Content, { base64: true });

    // Read container.xml to find root file
    const containerFile = zip.file("META-INF/container.xml");
    if (!containerFile) {
      return {
        success: false,
        musicXmlContent: null,
        rootFileName: null,
        error: createImportError(
          "mxl_extraction_failed",
          "No container.xml found in MXL archive",
          "This MXL file appears to be invalid or corrupted.",
          { severity: "fatal", recoverable: false },
        ),
      };
    }

    const containerXml = await containerFile.async("string");

    // Parse container.xml to find rootfile full-path attribute
    // Format: <rootfile full-path="filename.musicxml" ... />
    const rootfileMatch = containerXml.match(/full-path=["']([^"']+)["']/);
    const rootFileName = rootfileMatch?.[1];

    if (!rootFileName) {
      return {
        success: false,
        musicXmlContent: null,
        rootFileName: null,
        error: createImportError(
          "mxl_extraction_failed",
          "Could not find root MusicXML file path in container.xml",
          "This MXL file appears to be missing required metadata.",
          { severity: "fatal", recoverable: false },
        ),
      };
    }

    // Extract the MusicXML content
    const musicXmlFile = zip.file(rootFileName);
    if (!musicXmlFile) {
      return {
        success: false,
        musicXmlContent: null,
        rootFileName,
        error: createImportError(
          "mxl_extraction_failed",
          `Root file "${rootFileName}" not found in MXL archive`,
          "This MXL file appears to be corrupted or incomplete.",
          { severity: "fatal", recoverable: false },
        ),
      };
    }

    const musicXmlContent = await musicXmlFile.async("string");

    return {
      success: true,
      musicXmlContent,
      rootFileName,
      error: null,
    };
  } catch (error) {
    // Handle JSZip errors (invalid ZIP, corrupted data, etc.)
    const isZipError =
      error instanceof Error &&
      (error.message.includes("zip") ||
        error.message.includes("Corrupted") ||
        error.message.includes("invalid"));

    return {
      success: false,
      musicXmlContent: null,
      rootFileName: null,
      error: createImportError(
        "mxl_extraction_failed",
        `Failed to extract MXL: ${error instanceof Error ? error.message : String(error)}`,
        isZipError
          ? "This file doesn't appear to be a valid MXL archive."
          : "We couldn't open this compressed MusicXML file.",
        {
          severity: "fatal",
          recoverable: false,
          cause: error instanceof Error ? error : undefined,
        },
      ),
    };
  }
}

/**
 * Parse MXL file to ImportedScore
 *
 * This combines extraction and parsing into one step.
 */
export async function parseMxlFile(
  asset: LocalImportAsset,
): Promise<MusicXmlParseResult> {
  // First, extract the MusicXML content
  const extraction = await extractMxlContent(asset);

  if (!extraction.success || !extraction.musicXmlContent) {
    return {
      success: false,
      score: null,
      error: extraction.error,
      warnings: [],
    };
  }

  // Then parse the extracted MusicXML
  return parseMusicXml(extraction.musicXmlContent, {
    sourceType: asset.sourceType,
    originalFileName: asset.fileName,
    remoteAssetId: null,
  });
}

// ============================================================================
// MXL Detection
// ============================================================================

/**
 * Check if content looks like an MXL file (ZIP header)
 */
export function looksLikeMxl(base64Content: string): boolean {
  // ZIP files start with "PK" (50 4B in hex)
  // In base64, "PK" encodes to "UEs"
  return base64Content.startsWith("UEs");
}

/**
 * Check if a file extension indicates MXL
 */
export function isMxlExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".mxl");
}
