/**
 * MusicXML Parser Tests
 */

import {
  parseMusicXml,
  extractMusicXmlMetadataQuick,
  harmonyToChordSymbol,
  extractChordsFromMusicXml,
} from "../src/features/importMusic/services/musicXmlParser";

describe("MusicXML Parser", () => {
  // ============================================================================
  // Sample MusicXML Content
  // ============================================================================

  const MINIMAL_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
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
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
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

  const MUSICXML_WITH_METADATA = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="3.1">
  <work>
    <work-title>Test Work Title</work-title>
  </work>
  <movement-title>Test Movement</movement-title>
  <identification>
    <creator type="composer">Johann Sebastian Bach</creator>
    <creator type="arranger">Test Arranger</creator>
    <rights>Copyright 2024</rights>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
      <part-abbreviation>Vln.</part-abbreviation>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>2</divisions>
        <key>
          <fifths>2</fifths>
          <mode>major</mode>
        </key>
        <time>
          <beats>3</beats>
          <beat-type>4</beat-type>
        </time>
      </attributes>
      <direction>
        <direction-type>
          <metronome>
            <beat-unit>quarter</beat-unit>
            <per-minute>120</per-minute>
          </metronome>
        </direction-type>
      </direction>
      <note>
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>2</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

  // ============================================================================
  // parseMusicXml Tests
  // ============================================================================

  describe("parseMusicXml", () => {
    const sourceInfo = {
      sourceType: "musicxml" as const,
      originalFileName: "test.musicxml",
      remoteAssetId: null,
    };

    it("parses minimal valid MusicXML", async () => {
      const result = await parseMusicXml(MINIMAL_MUSICXML, sourceInfo);

      expect(result.success).toBe(true);
      expect(result.score).not.toBeNull();
      expect(result.error).toBeNull();
    });

    it("extracts parts correctly", async () => {
      const result = await parseMusicXml(MINIMAL_MUSICXML, sourceInfo);

      expect(result.score?.parts).toHaveLength(1);
      expect(result.score?.parts[0].id).toBe("P1");
      expect(result.score?.parts[0].name).toBe("Music");
    });

    it("extracts measures correctly", async () => {
      const result = await parseMusicXml(MINIMAL_MUSICXML, sourceInfo);

      expect(result.score?.measureCount).toBe(1);
      expect(result.score?.parts[0].measures).toHaveLength(1);
      expect(result.score?.parts[0].measures[0].number).toBe(1);
    });

    it("extracts time signature", async () => {
      const result = await parseMusicXml(MINIMAL_MUSICXML, sourceInfo);

      expect(result.score?.metadata.timeSignature).not.toBeNull();
      expect(result.score?.metadata.timeSignature?.beats).toBe(4);
      expect(result.score?.metadata.timeSignature?.beatType).toBe(4);
      expect(result.score?.metadata.timeSignature?.displayName).toBe("4/4");
    });

    it("extracts key signature", async () => {
      const result = await parseMusicXml(MINIMAL_MUSICXML, sourceInfo);

      expect(result.score?.metadata.keySignature).not.toBeNull();
      expect(result.score?.metadata.keySignature?.fifths).toBe(0);
      expect(result.score?.metadata.keySignature?.displayName).toContain("C");
    });

    it("extracts notes", async () => {
      const result = await parseMusicXml(MINIMAL_MUSICXML, sourceInfo);
      const events = result.score?.parts[0].measures[0].events;

      expect(events).toHaveLength(1);
      expect(events?.[0].type).toBe("note");
      expect(events?.[0].pitch?.step).toBe("C");
      expect(events?.[0].pitch?.octave).toBe(4);
    });

    it("fails for invalid content", async () => {
      const result = await parseMusicXml("not valid xml", sourceInfo);

      expect(result.success).toBe(false);
      expect(result.score).toBeNull();
      expect(result.error).not.toBeNull();
    });

    it("fails for empty content", async () => {
      const result = await parseMusicXml("", sourceInfo);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("musicxml_invalid");
    });

    it("fails for non-MusicXML XML", async () => {
      const result = await parseMusicXml(
        "<html><body></body></html>",
        sourceInfo,
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("musicxml_invalid");
    });
  });

  // ============================================================================
  // Metadata Extraction Tests
  // ============================================================================

  describe("parseMusicXml metadata extraction", () => {
    const sourceInfo = {
      sourceType: "musicxml" as const,
      originalFileName: "test.musicxml",
      remoteAssetId: null,
    };

    it("extracts title from movement-title", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.title).toBe("Test Movement");
      expect(result.score?.metadata.movementTitle).toBe("Test Movement");
    });

    it("extracts work title", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.workTitle).toBe("Test Work Title");
    });

    it("extracts composer", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.composer).toBe("Johann Sebastian Bach");
    });

    it("extracts arranger", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.arranger).toBe("Test Arranger");
    });

    it("extracts copyright", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.copyright).toBe("Copyright 2024");
    });

    it("extracts key signature with mode", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.keySignature?.fifths).toBe(2);
      expect(result.score?.metadata.keySignature?.mode).toBe("major");
      expect(result.score?.metadata.keySignature?.displayName).toContain("D");
    });

    it("extracts tempo from metronome", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.metadata.tempo).not.toBeNull();
      expect(result.score?.metadata.tempo?.bpm).toBe(120);
      expect(result.score?.metadata.tempo?.beatUnit).toBe("quarter");
    });

    it("extracts part name and abbreviation", async () => {
      const result = await parseMusicXml(MUSICXML_WITH_METADATA, sourceInfo);

      expect(result.score?.parts[0].name).toBe("Violin");
      expect(result.score?.parts[0].abbreviation).toBe("Vln.");
    });
  });

  // ============================================================================
  // Quick Metadata Extraction Tests
  // ============================================================================

  describe("extractMusicXmlMetadataQuick", () => {
    it("extracts basic metadata quickly", () => {
      const metadata = extractMusicXmlMetadataQuick(MUSICXML_WITH_METADATA);

      expect(metadata.title).toBe("Test Movement");
      expect(metadata.composer).toBe("Johann Sebastian Bach");
    });

    it("returns empty for invalid content", () => {
      const metadata = extractMusicXmlMetadataQuick("not musicxml");

      expect(metadata.title).toBeUndefined();
      expect(metadata.composer).toBeUndefined();
    });
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  describe("edge cases", () => {
    const sourceInfo = {
      sourceType: "musicxml" as const,
      originalFileName: "test.musicxml",
      remoteAssetId: null,
    };

    it("handles rests", async () => {
      const xmlWithRest = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <rest/>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = await parseMusicXml(xmlWithRest, sourceInfo);
      const events = result.score?.parts[0].measures[0].events;

      expect(events?.[0].type).toBe("rest");
      expect(events?.[0].pitch).toBeNull();
    });

    it("handles notes with alterations (sharps/flats)", async () => {
      const xmlWithAlter = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch>
          <step>F</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = await parseMusicXml(xmlWithAlter, sourceInfo);
      const events = result.score?.parts[0].measures[0].events;

      expect(events?.[0].pitch?.step).toBe("F");
      expect(events?.[0].pitch?.alter).toBe(1);
      expect(events?.[0].pitch?.displayName).toBe("F#4");
    });

    it("handles tied notes", async () => {
      const xmlWithTie = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
        <tie type="start"/>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = await parseMusicXml(xmlWithTie, sourceInfo);
      const events = result.score?.parts[0].measures[0].events;

      expect(events?.[0].tiedToNext).toBe(true);
    });

    it("handles dotted notes", async () => {
      const xmlWithDot = `<?xml version="1.0"?>
<score-partwise version="3.1">
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>6</duration>
        <type>half</type>
        <dot/>
      </note>
    </measure>
  </part>
</score-partwise>`;

      const result = await parseMusicXml(xmlWithDot, sourceInfo);
      const events = result.score?.parts[0].measures[0].events;

      expect(events?.[0].dots).toBe(1);
    });
  });
});

// =============================================================================
// Harmony/Chord Symbol Tests
// =============================================================================

describe("MusicXML Harmony Parsing", () => {
  describe("harmonyToChordSymbol", () => {
    it("should convert major triad", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "major")).toBe("C");
    });

    it("should convert minor triad", () => {
      expect(harmonyToChordSymbol({ step: "A" }, "minor")).toBe("Am");
    });

    it("should convert major seventh", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "major-seventh")).toBe(
        "Cmaj7",
      );
    });

    it("should convert dominant seventh", () => {
      expect(harmonyToChordSymbol({ step: "G" }, "dominant")).toBe("G7");
    });

    it("should convert minor seventh", () => {
      expect(harmonyToChordSymbol({ step: "D" }, "minor-seventh")).toBe("Dm7");
    });

    it("should convert half diminished", () => {
      expect(harmonyToChordSymbol({ step: "B" }, "half-diminished")).toBe(
        "Bm7b5",
      );
    });

    it("should convert diminished seventh", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "diminished-seventh")).toBe(
        "Cdim7",
      );
    });

    it("should handle sharp root", () => {
      expect(harmonyToChordSymbol({ step: "F", alter: 1 }, "minor")).toBe(
        "F#m",
      );
    });

    it("should handle flat root", () => {
      expect(
        harmonyToChordSymbol({ step: "B", alter: -1 }, "major-seventh"),
      ).toBe("Bbmaj7");
    });

    it("should handle double sharp", () => {
      expect(harmonyToChordSymbol({ step: "C", alter: 2 }, "major")).toBe(
        "C##",
      );
    });

    it("should handle double flat", () => {
      expect(harmonyToChordSymbol({ step: "D", alter: -2 }, "minor")).toBe(
        "Dbbm",
      );
    });

    it("should convert slash chord with bass", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "major", { step: "E" })).toBe(
        "C/E",
      );
    });

    it("should convert slash chord with altered bass", () => {
      expect(
        harmonyToChordSymbol({ step: "G" }, "dominant", {
          step: "B",
          alter: -1,
        }),
      ).toBe("G7/Bb");
    });

    it("should convert suspended fourth", () => {
      expect(harmonyToChordSymbol({ step: "D" }, "suspended-fourth")).toBe(
        "Dsus4",
      );
    });

    it("should convert sixth chord", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "major-sixth")).toBe("C6");
    });

    it("should convert ninth chord", () => {
      expect(harmonyToChordSymbol({ step: "G" }, "dominant-ninth")).toBe("G9");
    });

    it("should convert augmented", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "augmented")).toBe("Caug");
    });

    it("should convert diminished", () => {
      expect(harmonyToChordSymbol({ step: "B" }, "diminished")).toBe("Bdim");
    });

    it("should handle unknown kind gracefully", () => {
      expect(harmonyToChordSymbol({ step: "C" }, "unknown-kind")).toBe("C");
    });
  });

  describe("extractChordsFromMusicXml", () => {
    it("should return empty array when no harmony elements", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result).toEqual([]);
    });

    it("should extract single chord from measure", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root><root-step>C</root-step></root>
        <kind>major-seventh</kind>
      </harmony>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result).toHaveLength(1);
      expect(result[0].measureNumber).toBe(1);
      expect(result[0].chords).toHaveLength(1);
      expect(result[0].chords[0].symbol).toBe("Cmaj7");
      expect(result[0].chords[0].offset).toBe(0);
    });

    it("should extract multiple chords from measure", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root><root-step>C</root-step></root>
        <kind>major-seventh</kind>
      </harmony>
      <harmony>
        <root><root-step>D</root-step></root>
        <kind>minor-seventh</kind>
        <offset>2</offset>
      </harmony>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result).toHaveLength(1);
      expect(result[0].chords).toHaveLength(2);
      expect(result[0].chords[0].symbol).toBe("Cmaj7");
      expect(result[0].chords[0].offset).toBe(0);
      expect(result[0].chords[1].symbol).toBe("Dm7");
      expect(result[0].chords[1].offset).toBe(2);
    });

    it("should extract chords from multiple measures", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root><root-step>C</root-step></root>
        <kind>major</kind>
      </harmony>
    </measure>
    <measure number="2">
      <harmony>
        <root><root-step>G</root-step></root>
        <kind>dominant</kind>
      </harmony>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result).toHaveLength(2);
      expect(result[0].measureNumber).toBe(1);
      expect(result[0].chords[0].symbol).toBe("C");
      expect(result[1].measureNumber).toBe(2);
      expect(result[1].chords[0].symbol).toBe("G7");
    });

    it("should handle altered roots", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root>
          <root-step>F</root-step>
          <root-alter>1</root-alter>
        </root>
        <kind>minor</kind>
      </harmony>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result[0].chords[0].symbol).toBe("F#m");
    });

    it("should handle slash chords with bass", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root><root-step>C</root-step></root>
        <kind>major</kind>
        <bass><bass-step>E</bass-step></bass>
      </harmony>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result[0].chords[0].symbol).toBe("C/E");
    });

    it("should handle slash chords with altered bass", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <harmony>
        <root><root-step>G</root-step></root>
        <kind>dominant</kind>
        <bass>
          <bass-step>B</bass-step>
          <bass-alter>-1</bass-alter>
        </bass>
      </harmony>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result[0].chords[0].symbol).toBe("G7/Bb");
    });

    it("should skip measures without harmony", () => {
      const xml = `<?xml version="1.0"?>
<score-partwise>
  <part id="P1">
    <measure number="1">
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
    <measure number="2">
      <harmony>
        <root><root-step>G</root-step></root>
        <kind>dominant</kind>
      </harmony>
    </measure>
    <measure number="3">
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration></note>
    </measure>
  </part>
</score-partwise>`;

      const result = extractChordsFromMusicXml(xml);
      expect(result).toHaveLength(1);
      expect(result[0].measureNumber).toBe(2);
    });
  });
});
