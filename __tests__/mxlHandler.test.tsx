/**
 * Tests for MXL Handler Service
 *
 * Tests the extraction of MusicXML content from compressed MXL files.
 */

import JSZip from "jszip";
import {
  extractMxlContent,
  parseMxlFile,
  looksLikeMxl,
  isMxlExtension,
} from "../src/features/importMusic/services/mxlHandler";
import type { LocalImportAsset } from "../src/types/import";

// Mock the fileAcquisition module
jest.mock("../src/features/importMusic/services/fileAcquisition", () => ({
  readFileAsBase64: jest.fn(),
}));

import { readFileAsBase64 } from "../src/features/importMusic/services/fileAcquisition";

const mockReadFileAsBase64 = readFileAsBase64 as jest.MockedFunction<
  typeof readFileAsBase64
>;

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock MXL file (ZIP archive) with the given MusicXML content
 */
async function createMockMxlBase64(
  musicXmlContent: string,
  rootFileName: string = "score.musicxml",
): Promise<string> {
  const zip = new JSZip();

  // Add container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container>
  <rootfiles>
    <rootfile full-path="${rootFileName}" media-type="application/vnd.recordare.musicxml+xml"/>
  </rootfiles>
</container>`;

  zip.file("META-INF/container.xml", containerXml);
  zip.file(rootFileName, musicXmlContent);

  // Generate base64 ZIP
  const zipContent = await zip.generateAsync({ type: "base64" });
  return zipContent;
}

/**
 * Create a minimal valid MusicXML document
 */
function createMinimalMusicXml(title: string = "Test Score"): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>${title}</work-title>
  </work>
  <identification>
    <creator type="composer">Test Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Part 1</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
}

/**
 * Create a mock LocalImportAsset for testing
 */
function createMockAsset(
  overrides: Partial<LocalImportAsset> = {},
): LocalImportAsset {
  return {
    id: "test-asset-1",
    uri: "file:///test/score.mxl",
    fileName: "score.mxl",
    sourceType: "mxl",
    mimeType: "application/vnd.recordare.musicxml+xml",
    fileSize: 1024,
    acquiredAt: Date.now(),
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("MXL Handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractMxlContent", () => {
    it("successfully extracts MusicXML from valid MXL file", async () => {
      const musicXml = createMinimalMusicXml("Extracted Score");
      const mxlBase64 = await createMockMxlBase64(musicXml);
      mockReadFileAsBase64.mockResolvedValue(mxlBase64);

      const asset = createMockAsset();
      const result = await extractMxlContent(asset);

      expect(result.success).toBe(true);
      expect(result.musicXmlContent).toContain("Extracted Score");
      expect(result.rootFileName).toBe("score.musicxml");
      expect(result.error).toBeNull();
    });

    it("handles custom root file paths", async () => {
      const musicXml = createMinimalMusicXml();
      const mxlBase64 = await createMockMxlBase64(
        musicXml,
        "nested/folder/myscore.xml",
      );
      mockReadFileAsBase64.mockResolvedValue(mxlBase64);

      const asset = createMockAsset();
      const result = await extractMxlContent(asset);

      expect(result.success).toBe(true);
      expect(result.rootFileName).toBe("nested/folder/myscore.xml");
    });

    it("returns error when container.xml is missing", async () => {
      // Create ZIP without container.xml
      const zip = new JSZip();
      zip.file("score.musicxml", createMinimalMusicXml());
      const invalidMxl = await zip.generateAsync({ type: "base64" });
      mockReadFileAsBase64.mockResolvedValue(invalidMxl);

      const asset = createMockAsset();
      const result = await extractMxlContent(asset);

      expect(result.success).toBe(false);
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("mxl_extraction_failed");
      expect(result.error?.message).toContain("container.xml");
    });

    it("returns error when root file is missing from archive", async () => {
      // Create ZIP with container.xml pointing to non-existent file
      const zip = new JSZip();
      const containerXml = `<?xml version="1.0"?>
<container>
  <rootfiles>
    <rootfile full-path="missing.musicxml"/>
  </rootfiles>
</container>`;
      zip.file("META-INF/container.xml", containerXml);
      const invalidMxl = await zip.generateAsync({ type: "base64" });
      mockReadFileAsBase64.mockResolvedValue(invalidMxl);

      const asset = createMockAsset();
      const result = await extractMxlContent(asset);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("mxl_extraction_failed");
      expect(result.error?.message).toContain("missing.musicxml");
    });

    it("handles file read errors gracefully", async () => {
      mockReadFileAsBase64.mockRejectedValue(new Error("File not found"));

      const asset = createMockAsset();
      const result = await extractMxlContent(asset);

      expect(result.success).toBe(false);
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe("mxl_extraction_failed");
    });

    it("handles invalid ZIP data", async () => {
      // Pass non-ZIP data
      mockReadFileAsBase64.mockResolvedValue("not-a-zip-file");

      const asset = createMockAsset();
      const result = await extractMxlContent(asset);

      expect(result.success).toBe(false);
      expect(result.error).not.toBeNull();
    });
  });

  describe("parseMxlFile", () => {
    it("extracts and parses MXL to ImportedScore", async () => {
      const musicXml = createMinimalMusicXml("Parsed Score");
      const mxlBase64 = await createMockMxlBase64(musicXml);
      mockReadFileAsBase64.mockResolvedValue(mxlBase64);

      const asset = createMockAsset();
      const result = await parseMxlFile(asset);

      expect(result.success).toBe(true);
      expect(result.score).not.toBeNull();
      expect(result.score?.metadata.title).toBe("Parsed Score");
      expect(result.score?.metadata.composer).toBe("Test Composer");
    });

    it("propagates extraction errors", async () => {
      mockReadFileAsBase64.mockRejectedValue(new Error("Read error"));

      const asset = createMockAsset();
      const result = await parseMxlFile(asset);

      expect(result.success).toBe(false);
      expect(result.score).toBeNull();
      expect(result.error).not.toBeNull();
    });
  });

  describe("looksLikeMxl", () => {
    it("returns true for ZIP file signature", () => {
      // "PK" in base64 starts with "UEs"
      expect(looksLikeMxl("UEsDBBQAAAA")).toBe(true);
    });

    it("returns false for non-ZIP data", () => {
      expect(looksLikeMxl("PD94bWwgdmVyc2lvbj0")).toBe(false); // XML header
      expect(looksLikeMxl("SGVsbG8gV29ybGQ=")).toBe(false); // "Hello World"
    });
  });

  describe("isMxlExtension", () => {
    it("returns true for .mxl files", () => {
      expect(isMxlExtension("score.mxl")).toBe(true);
      expect(isMxlExtension("SCORE.MXL")).toBe(true);
      expect(isMxlExtension("my.score.mxl")).toBe(true);
    });

    it("returns false for non-mxl files", () => {
      expect(isMxlExtension("score.musicxml")).toBe(false);
      expect(isMxlExtension("score.xml")).toBe(false);
      expect(isMxlExtension("score.pdf")).toBe(false);
      expect(isMxlExtension("mxl")).toBe(false);
    });
  });
});
