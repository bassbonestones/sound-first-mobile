/**
 * Tune Metadata Service
 *
 * Manages storage of tune metadata alongside MusicXML files.
 * Uses the same preview file API to store JSON metadata files.
 */

import { deletePreviewFile } from "../../../api/materials";
import { baseUrl } from "../../../api/client";
import {
  TuneMetadata,
  createDefaultMetadata,
  getMetadataFilename,
} from "../types/tuneMetadataTypes";
import { createDevLogger } from "../../../utils/devLogger";

const logger = createDevLogger("TuneMetadataService");

/**
 * Save metadata for a tune
 * @param musicxmlFilename - The filename of the MusicXML file (e.g., "beginner/my_tune.musicxml")
 * @param metadata - The metadata to save
 */
export async function saveMetadata(
  musicxmlFilename: string,
  metadata: TuneMetadata,
): Promise<void> {
  const metadataFilename = getMetadataFilename(musicxmlFilename);
  const content = JSON.stringify(metadata, null, 2);

  logger.log(`Saving metadata for ${musicxmlFilename}`);

  // Use upsert endpoint - creates if not exists, updates if exists
  const response = await fetch(
    `${baseUrl}/materials/preview/metadata/${encodeURIComponent(metadataFilename)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail =
      (errorData as { detail?: string }).detail || `Status ${response.status}`;
    throw new Error(`Failed to save metadata: ${detail}`);
  }
}

/**
 * Load metadata for a tune
 * @param musicxmlFilename - The filename of the MusicXML file
 * @returns The metadata or null if not found
 */
export async function loadMetadata(
  musicxmlFilename: string,
): Promise<TuneMetadata | null> {
  const metadataFilename = getMetadataFilename(musicxmlFilename);

  try {
    // Fetch the metadata JSON using the raw file endpoint
    const response = await fetch(
      `${baseUrl}/materials/preview/raw/${encodeURIComponent(metadataFilename)}`,
    );

    if (!response.ok) {
      if (response.status === 404) {
        logger.log(`No metadata found for ${musicxmlFilename}`);
        return null;
      }
      throw new Error(`Failed to load metadata: ${response.status}`);
    }

    const content = await response.text();
    const metadata = JSON.parse(content) as TuneMetadata;

    logger.log(`Loaded metadata for ${musicxmlFilename}`);

    return metadata;
  } catch (error) {
    logger.warn(`Error loading metadata for ${musicxmlFilename}:`, error);
    return null;
  }
}

/**
 * Delete metadata for a tune
 * @param musicxmlFilename - The filename of the MusicXML file
 */
export async function deleteMetadata(musicxmlFilename: string): Promise<void> {
  const metadataFilename = getMetadataFilename(musicxmlFilename);

  try {
    await deletePreviewFile(metadataFilename);
    logger.log(`Deleted metadata for ${musicxmlFilename}`);
  } catch (error) {
    // Don't fail if metadata doesn't exist
    logger.warn(`Error deleting metadata for ${musicxmlFilename}:`, error);
  }
}

/**
 * Load metadata or create default if not found
 * @param musicxmlFilename - The filename of the MusicXML file
 * @param defaultTitle - Default title to use if creating new metadata
 */
export async function loadOrCreateMetadata(
  musicxmlFilename: string,
  defaultTitle?: string,
): Promise<TuneMetadata> {
  const existing = await loadMetadata(musicxmlFilename);
  if (existing) {
    return existing;
  }
  return createDefaultMetadata(defaultTitle);
}

export const tuneMetadataService = {
  saveMetadata,
  loadMetadata,
  deleteMetadata,
  loadOrCreateMetadata,
};
