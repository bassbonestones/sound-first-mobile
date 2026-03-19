/**
 * Sample MusicXML Fixtures
 *
 * Test data for development and testing.
 * These are only imported in development mode.
 */

/**
 * Simple C major scale for basic testing
 */
export const SAMPLE_SCALE_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Sample Scale</work-title>
  </work>
  <identification>
    <creator type="composer">Sound First Demo</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Piano</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>0</fifths></key>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <direction placement="above">
        <direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>80</per-minute></metronome></direction-type>
        <sound tempo="80"/>
      </direction>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
    <measure number="2">
      <note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>A</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>B</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>C</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
</score-partwise>`;

/**
 * Multi-part score for testing part handling
 */
export const SAMPLE_DUET_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Simple Duet</work-title>
  </work>
  <identification>
    <creator type="composer">Test Composer</creator>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Violin</part-name>
    </score-part>
    <score-part id="P2">
      <part-name>Cello</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>2</fifths><mode>major</mode></key>
        <time><beats>3</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note><pitch><step>D</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>E</step><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
      <note><pitch><step>F</step><alter>1</alter><octave>5</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>
  </part>
  <part id="P2">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key><fifths>2</fifths><mode>major</mode></key>
        <time><beats>3</beats><beat-type>4</beat-type></time>
        <clef><sign>F</sign><line>4</line></clef>
      </attributes>
      <note><pitch><step>D</step><octave>3</octave></pitch><duration>3</duration><type>dotted-half</type><dot/></note>
    </measure>
  </part>
</score-partwise>`;

/**
 * Score with uncertain measures (for correction UI testing)
 */
export const SAMPLE_UNCERTAIN_SCORE = {
  id: "test_uncertain_001",
  title: "Test Score with Uncertain Measures",
  composer: "Test System",
  measureCount: 4,
  partCount: 1,
  uncertainMeasures: [
    {
      measureNumber: 2,
      partIndex: 0,
      confidence: 0.45,
      reason: "Unclear rhythm notation",
    },
    {
      measureNumber: 4,
      partIndex: 0,
      confidence: 0.62,
      reason: "Possible accidental missing",
    },
  ],
};

/**
 * Get sample MusicXML by name
 */
export function getSampleMusicXml(name: "scale" | "duet" = "scale"): string {
  switch (name) {
    case "duet":
      return SAMPLE_DUET_MUSICXML;
    case "scale":
    default:
      return SAMPLE_SCALE_MUSICXML;
  }
}

/**
 * Check if we should show dev sample import option
 */
export function shouldShowDevSampleImport(): boolean {
  return process.env.NODE_ENV !== "production";
}
