/**
 * Tests for Generation Notation Utilities
 * Covers PitchEvent to MusicXML conversion
 */
import type { PitchEvent } from "../src/api/generation";
import {
  eventsToMusicXml,
  generateDisplayTitle,
} from "../src/utils/generationNotation";

describe("eventsToMusicXml", () => {
  const sampleEvents: PitchEvent[] = [
    {
      midi_note: 60,
      pitch_name: "C4",
      duration_beats: 1,
      offset_beats: 0,
      velocity: 80,
      articulation: null,
    },
    {
      midi_note: 62,
      pitch_name: "D4",
      duration_beats: 1,
      offset_beats: 1,
      velocity: 80,
      articulation: null,
    },
    {
      midi_note: 64,
      pitch_name: "E4",
      duration_beats: 1,
      offset_beats: 2,
      velocity: 80,
      articulation: null,
    },
    {
      midi_note: 65,
      pitch_name: "F4",
      duration_beats: 1,
      offset_beats: 3,
      velocity: 80,
      articulation: null,
    },
  ];

  it("generates valid MusicXML structure", () => {
    const xml = eventsToMusicXml(sampleEvents);

    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<score-partwise");
    expect(xml).toContain("<part-list>");
    expect(xml).toContain('<part id="P1">');
    expect(xml).toContain("<measure");
    expect(xml).toContain("</score-partwise>");
  });

  it("includes title when provided", () => {
    const xml = eventsToMusicXml(sampleEvents, { title: "Test Scale" });

    expect(xml).toContain("<work-title>Test Scale</work-title>");
  });

  it("sets correct key signature", () => {
    const xmlG = eventsToMusicXml(sampleEvents, { key: "G" });
    expect(xmlG).toContain("<fifths>1</fifths>"); // G has 1 sharp

    const xmlBb = eventsToMusicXml(sampleEvents, { key: "Bb" });
    expect(xmlBb).toContain("<fifths>-2</fifths>"); // Bb has 2 flats

    const xmlC = eventsToMusicXml(sampleEvents, { key: "C" });
    expect(xmlC).toContain("<fifths>0</fifths>"); // C has no sharps/flats
  });

  it("sets time signature", () => {
    const xml = eventsToMusicXml(sampleEvents, {
      timeBeats: 3,
      timeBeatType: 4,
    });

    expect(xml).toContain("<beats>3</beats>");
    expect(xml).toContain("<beat-type>4</beat-type>");
  });

  it("includes tempo marking when provided", () => {
    const xml = eventsToMusicXml(sampleEvents, { tempo: 120 });

    expect(xml).toContain("<metronome>");
    expect(xml).toContain("<per-minute>120</per-minute>");
    expect(xml).toContain('tempo="120"');
  });

  it("generates correct note pitches", () => {
    const xml = eventsToMusicXml(sampleEvents);

    // C4
    expect(xml).toContain("<step>C</step>");
    expect(xml).toContain("<octave>4</octave>");

    // D4
    expect(xml).toContain("<step>D</step>");

    // E4
    expect(xml).toContain("<step>E</step>");

    // F4
    expect(xml).toContain("<step>F</step>");
  });

  it("generates correct note durations", () => {
    const xml = eventsToMusicXml(sampleEvents);

    // Quarter notes = 12 divisions
    expect(xml).toContain("<duration>12</duration>");
    expect(xml).toContain("<type>quarter</type>");
  });

  it("handles different duration values", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 4,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
    ];
    const xmlWhole = eventsToMusicXml(events);
    expect(xmlWhole).toContain("<type>whole</type>");
    expect(xmlWhole).toContain("<duration>48</duration>");

    events[0].duration_beats = 2;
    const xmlHalf = eventsToMusicXml(events);
    expect(xmlHalf).toContain("<type>half</type>");

    events[0].duration_beats = 0.5;
    const xmlEighth = eventsToMusicXml(events);
    expect(xmlEighth).toContain("<type>eighth</type>");
  });

  it("handles sharps correctly in sharp keys", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 66, // F#4
        pitch_name: "F#4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
    ];

    const xml = eventsToMusicXml(events, { key: "D" });

    expect(xml).toContain("<step>F</step>");
    expect(xml).toContain("<alter>1</alter>");
  });

  it("handles flats correctly in flat keys", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 70, // Bb4
        pitch_name: "Bb4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
    ];

    const xml = eventsToMusicXml(events, { key: "Bb" });

    expect(xml).toContain("<step>B</step>");
    expect(xml).toContain("<alter>-1</alter>");
  });

  it("uses pitch_name for enharmonic spelling regardless of key", () => {
    // Blues scale in C: C Eb F F# G Bb
    // Even though C is not a flat key, the pitch_name should control spelling
    const bluesScaleEvents: PitchEvent[] = [
      {
        midi_note: 60, // C4
        pitch_name: "C4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 63, // Eb4 (not D#4!)
        pitch_name: "Eb4",
        duration_beats: 1,
        offset_beats: 1,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 65, // F4
        pitch_name: "F4",
        duration_beats: 1,
        offset_beats: 2,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 66, // F#4 (not Gb4!)
        pitch_name: "F#4",
        duration_beats: 1,
        offset_beats: 3,
        velocity: 80,
        articulation: null,
      },
    ];

    // Key of C (sharp key) - but pitch_name should override
    const xml = eventsToMusicXml(bluesScaleEvents, { key: "C" });

    // Should be Eb, not D# (pitch_name controls spelling)
    expect(xml).toContain("<step>E</step>");
    expect(xml).toContain("<alter>-1</alter>");

    // Should be F#, not Gb
    expect(xml).toContain("<step>F</step>");
    expect(xml).toContain("<alter>1</alter>");

    // Should NOT have D# (which would be step D with alter 1)
    // Count occurrences - D should not appear with alter 1
    const dSharpPattern = /<step>D<\/step>\s*<alter>1<\/alter>/;
    expect(xml).not.toMatch(dSharpPattern);
  });

  it("adds staccato articulation", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: "staccato",
      },
    ];

    const xml = eventsToMusicXml(events);

    expect(xml).toContain("<notations>");
    expect(xml).toContain("<articulations>");
    expect(xml).toContain("<staccato/>");
  });

  it("adds accent articulation", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: "accent",
      },
    ];

    const xml = eventsToMusicXml(events);

    expect(xml).toContain("<accent/>");
  });

  it("adds tenuto articulation", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: "tenuto",
      },
    ];

    const xml = eventsToMusicXml(events);

    expect(xml).toContain("<tenuto/>");
  });

  it("skips articulation for legato", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 1,
        offset_beats: 0,
        velocity: 80,
        articulation: "legato",
      },
    ];

    const xml = eventsToMusicXml(events);

    expect(xml).not.toContain("<notations>");
  });

  it("creates multiple measures for long content", () => {
    // 8 quarter notes = 2 measures in 4/4
    const events: PitchEvent[] = Array.from({ length: 8 }, (_, i) => ({
      midi_note: 60 + i,
      pitch_name: `C${4 + Math.floor(i / 12)}`,
      duration_beats: 1,
      offset_beats: i,
      velocity: 80,
      articulation: null,
    }));

    const xml = eventsToMusicXml(events);

    expect(xml).toContain('measure number="1"');
    expect(xml).toContain('measure number="2"');
  });

  it("escapes XML special characters in title", () => {
    const xml = eventsToMusicXml(sampleEvents, {
      title: "Test & <Scale>",
    });

    expect(xml).toContain("Test &amp; &lt;Scale&gt;");
  });

  it("handles empty events array", () => {
    const xml = eventsToMusicXml([]);

    expect(xml).toContain("<score-partwise");
    expect(xml).toContain("</score-partwise>");
  });

  it("includes clef information", () => {
    const xml = eventsToMusicXml(sampleEvents);

    expect(xml).toContain("<clef>");
    expect(xml).toContain("<sign>G</sign>");
    expect(xml).toContain("<line>2</line>");
  });

  it("uses treble clef by default", () => {
    const xml = eventsToMusicXml(sampleEvents);

    expect(xml).toContain("<sign>G</sign>");
    expect(xml).toContain("<line>2</line>");
  });

  it("uses bass clef when specified", () => {
    const xml = eventsToMusicXml(sampleEvents, { clef: "bass" });

    expect(xml).toContain("<sign>F</sign>");
    expect(xml).toContain("<line>4</line>");
    expect(xml).not.toContain("<sign>G</sign>");
  });

  it("uses treble clef when explicitly specified", () => {
    const xml = eventsToMusicXml(sampleEvents, { clef: "treble" });

    expect(xml).toContain("<sign>G</sign>");
    expect(xml).toContain("<line>2</line>");
  });

  it("includes divisions element", () => {
    const xml = eventsToMusicXml(sampleEvents);

    expect(xml).toContain("<divisions>12</divisions>");
  });

  it("adds beam elements for eighth notes", () => {
    const eighthNotes: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.5,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.5,
        offset_beats: 0.5,
        velocity: 80,
        articulation: null,
      },
    ];
    const xml = eventsToMusicXml(eighthNotes);

    expect(xml).toContain('<beam number="1">begin</beam>');
    expect(xml).toContain('<beam number="1">end</beam>');
  });

  it("adds beam elements for sixteenth notes with two beam levels", () => {
    const sixteenthNotes: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.25,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.25,
        offset_beats: 0.25,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 64,
        pitch_name: "E4",
        duration_beats: 0.25,
        offset_beats: 0.5,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 65,
        pitch_name: "F4",
        duration_beats: 0.25,
        offset_beats: 0.75,
        velocity: 80,
        articulation: null,
      },
    ];
    const xml = eventsToMusicXml(sixteenthNotes);

    // Should have beam level 1 and 2
    expect(xml).toContain('<beam number="1">begin</beam>');
    expect(xml).toContain('<beam number="1">continue</beam>');
    expect(xml).toContain('<beam number="1">end</beam>');
    expect(xml).toContain('<beam number="2">begin</beam>');
    expect(xml).toContain('<beam number="2">end</beam>');
  });

  it("does not add beams to quarter notes", () => {
    const xml = eventsToMusicXml(sampleEvents);

    expect(xml).not.toContain("<beam");
  });

  it("notates swing durations as eighth notes", () => {
    // Swing rhythm: 2/3 beat + 1/3 beat pattern
    const swingEvents: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.6667,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      }, // swing long
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.3333,
        offset_beats: 0.6667,
        velocity: 80,
        articulation: null,
      }, // swing short
      {
        midi_note: 64,
        pitch_name: "E4",
        duration_beats: 0.6667,
        offset_beats: 1.0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 65,
        pitch_name: "F4",
        duration_beats: 0.3333,
        offset_beats: 1.6667,
        velocity: 80,
        articulation: null,
      },
    ];
    const xml = eventsToMusicXml(swingEvents);

    // Both swing long (2/3) and swing short (1/3) should be notated as eighth notes
    const eighthMatches = xml.match(/<type>eighth<\/type>/g);
    expect(eighthMatches).toHaveLength(4);
    expect(xml).not.toContain("<type>16th</type>");
  });

  it("beams swing eighths together", () => {
    const swingEvents: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.6667,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.3333,
        offset_beats: 0.6667,
        velocity: 80,
        articulation: null,
      },
    ];
    const xml = eventsToMusicXml(swingEvents);

    // Swing eighths should be beamed together
    expect(xml).toContain('<beam number="1">begin</beam>');
    expect(xml).toContain('<beam number="1">end</beam>');
  });

  it("beams swing eighths but not final quarter note", () => {
    // Simulates backend extending final note to quarter
    const swingWithFinalQuarter: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.6667,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.3333,
        offset_beats: 0.6667,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 64,
        pitch_name: "E4",
        duration_beats: 0.6667,
        offset_beats: 1.0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 65,
        pitch_name: "F4",
        duration_beats: 1.0,
        offset_beats: 1.6667,
        velocity: 80,
        articulation: null,
      }, // Quarter note
    ];
    const xml = eventsToMusicXml(swingWithFinalQuarter);

    // Should have beamed pairs for notes 1-2 and note 3 alone (no partner)
    // Final quarter note should not be beamed
    const beginMatches = xml.match(/<beam number="1">begin<\/beam>/g) ?? [];
    const endMatches = xml.match(/<beam number="1">end<\/beam>/g) ?? [];
    expect(beginMatches.length).toBe(1); // Just the first pair
    expect(endMatches.length).toBe(1);
  });

  it("adds Swing direction text when rhythm is swing_eighths", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.6667,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.3333,
        offset_beats: 0.6667,
        velocity: 80,
        articulation: null,
      },
    ];
    const xml = eventsToMusicXml(events, { rhythm: "swing_eighths" });

    expect(xml).toContain("<words");
    expect(xml).toContain("Swing</words>");
  });

  it("does not add Swing direction text for non-swing rhythms", () => {
    const events: PitchEvent[] = [
      {
        midi_note: 60,
        pitch_name: "C4",
        duration_beats: 0.5,
        offset_beats: 0,
        velocity: 80,
        articulation: null,
      },
      {
        midi_note: 62,
        pitch_name: "D4",
        duration_beats: 0.5,
        offset_beats: 0.5,
        velocity: 80,
        articulation: null,
      },
    ];
    const xml = eventsToMusicXml(events, { rhythm: "eighth_notes" });

    expect(xml).not.toContain("Swing</words>");
  });
});

describe("generateDisplayTitle", () => {
  it("generates title for scale", () => {
    const title = generateDisplayTitle("scale", "dorian", "G");

    expect(title).toBe("G Dorian Scale");
  });

  it("generates title for arpeggio", () => {
    const title = generateDisplayTitle("arpeggio", "maj7", "Bb");

    expect(title).toBe("Bb Maj7 Arpeggio");
  });

  it("includes pattern when provided", () => {
    const title = generateDisplayTitle("scale", "ionian", "C", "in_3rds");

    expect(title).toBe("C Ionian (Major) Scale - In 3rds");
  });

  it("handles snake_case definitions", () => {
    const title = generateDisplayTitle("scale", "harmonic_minor", "A");

    expect(title).toBe("A Harmonic Minor Scale");
  });

  it("handles complex patterns", () => {
    const title = generateDisplayTitle(
      "scale",
      "pentatonic_major",
      "F",
      "groups_of_4",
    );

    expect(title).toBe("F Pentatonic Major Scale - Groups Of 4");
  });

  it("handles null pattern", () => {
    const title = generateDisplayTitle("scale", "blues", "Eb", null);

    expect(title).toBe("Eb Blues Scale");
  });

  it("uses chromatic-specific pattern names for chromatic scale", () => {
    const title = generateDisplayTitle("scale", "chromatic", "C", "in_3rds");
    expect(title).toBe("C Chromatic Scale - Chromatic Major 2nds");
  });

  it("shows Chromatic minor 3rds for in_4ths on chromatic scale", () => {
    const title = generateDisplayTitle("scale", "chromatic", "B", "in_4ths");
    expect(title).toBe("B Chromatic Scale - Chromatic minor 3rds");
  });

  it("shows normal pattern name for non-chromatic scales", () => {
    const title = generateDisplayTitle("scale", "ionian", "G", "in_4ths");
    expect(title).toBe("G Ionian (Major) Scale - In 4ths");
  });
});
