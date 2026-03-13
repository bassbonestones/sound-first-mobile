/**
 * Tests for NotationDisplay component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import { Platform } from "react-native";
import NotationDisplay, {
  NotationPlaceholder,
} from "../src/components/NotationDisplay";

// Track postMessage calls
const mockPostMessage = jest.fn();
const mockReload = jest.fn();
const mockInjectJavaScript = jest.fn();

// Mock WebView with ref support for postMessage
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  const WebView = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        postMessage: mockPostMessage,
        reload: mockReload,
        injectJavaScript: mockInjectJavaScript,
      }));
      return <View testID="webview" {...props} />;
    },
  );

  return { WebView };
});

// Sample MusicXML for testing
const sampleMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
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

// Complex MusicXML with multiple notes and special characters
const complexMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <work>
    <work-title>Test Piece with Special \`Chars\` and $Variables</work-title>
  </work>
  <part-list>
    <score-part id="P1">
      <part-name>Test Part</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <time><beats>4</beats><beat-type>4</beat-type></time>
        <clef><sign>G</sign><line>2</line></clef>
      </attributes>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>D</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>E</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch><step>F</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <pitch><step>G</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

// MusicXML with accidentals
const accidentalMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list>
    <score-part id="P1"><part-name>Accidentals</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note>
        <pitch><step>F</step><alter>1</alter><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <accidental>sharp</accidental>
      </note>
      <note>
        <pitch><step>B</step><alter>-1</alter><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
        <accidental>flat</accidental>
      </note>
    </measure>
  </part>
</score-partwise>`;

// MusicXML with rests
const restMusicXML = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list>
    <score-part id="P1"><part-name>Rests</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <note><rest/><duration>1</duration><type>quarter</type></note>
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note><rest/><duration>2</duration><type>half</type></note>
    </measure>
  </part>
</score-partwise>`;

describe("NotationDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostMessage.mockClear();
  });

  describe("Rendering", () => {
    it("renders without crashing", () => {
      render(<NotationDisplay musicxml={sampleMusicXML} />);
    });

    it("renders with custom dimensions", () => {
      render(
        <NotationDisplay musicxml={sampleMusicXML} width={400} height={300} />,
      );
    });

    it("renders with showTitle enabled", () => {
      render(<NotationDisplay musicxml={sampleMusicXML} showTitle={true} />);
    });

    it("renders without musicxml", () => {
      render(<NotationDisplay musicxml={null} />);
    });

    it("renders with empty musicxml", () => {
      render(<NotationDisplay musicxml="" />);
    });

    it("renders with undefined musicxml", () => {
      render(<NotationDisplay musicxml={undefined} />);
    });
  });

  describe("Props", () => {
    it("accepts default width and height", () => {
      const { toJSON } = render(<NotationDisplay musicxml={sampleMusicXML} />);
      // Default width is 320, height is 200
      expect(toJSON()).toBeTruthy();
    });

    it("accepts custom width", () => {
      render(<NotationDisplay musicxml={sampleMusicXML} width={500} />);
    });

    it("accepts custom height", () => {
      render(<NotationDisplay musicxml={sampleMusicXML} height={250} />);
    });

    it("accepts showTimeSignature prop", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} showTimeSignature={true} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts fixedMeasureWidthPixels prop", () => {
      const { toJSON } = render(
        <NotationDisplay
          musicxml={sampleMusicXML}
          fixedMeasureWidthPixels={100}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts zoom prop", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} zoom={1.0} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts currentNoteIndex prop", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts all props together", () => {
      const { toJSON } = render(
        <NotationDisplay
          musicxml={sampleMusicXML}
          width={400}
          height={300}
          showTitle={true}
          showTimeSignature={true}
          fixedMeasureWidthPixels={80}
          zoom={0.8}
          currentNoteIndex={2}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Platform-specific behavior", () => {
    it("renders on mobile (native)", () => {
      // Platform.OS defaults to 'ios' in jest
      render(<NotationDisplay musicxml={sampleMusicXML} />);
    });

    it("renders WebView with correct props on mobile", () => {
      const { getByTestId } = render(
        <NotationDisplay musicxml={sampleMusicXML} />,
      );
      const webview = getByTestId("webview");
      expect(webview).toBeTruthy();
    });
  });

  describe("Empty states", () => {
    it("shows empty message when musicxml is null", () => {
      const { getByText } = render(<NotationDisplay musicxml={null} />);
      expect(getByText("No notation data")).toBeTruthy();
    });

    it("shows empty message when musicxml is empty string", () => {
      const { getByText } = render(<NotationDisplay musicxml="" />);
      expect(getByText("No notation data")).toBeTruthy();
    });

    it("shows empty message when musicxml is undefined", () => {
      const { getByText } = render(<NotationDisplay musicxml={undefined} />);
      expect(getByText("No notation data")).toBeTruthy();
    });

    it("applies custom dimensions to empty state", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={null} width={500} height={400} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Complex MusicXML handling", () => {
    it("renders complex MusicXML with multiple notes", () => {
      const { getByTestId } = render(
        <NotationDisplay musicxml={complexMusicXML} />,
      );
      expect(getByTestId("webview")).toBeTruthy();
    });

    it("handles MusicXML with special characters", () => {
      const { getByTestId } = render(
        <NotationDisplay musicxml={complexMusicXML} />,
      );
      expect(getByTestId("webview")).toBeTruthy();
    });

    it("handles MusicXML with backslashes", () => {
      const xmlWithBackslash = sampleMusicXML.replace(
        "Music",
        "Music\\Section",
      );
      const { getByTestId } = render(
        <NotationDisplay musicxml={xmlWithBackslash} />,
      );
      expect(getByTestId("webview")).toBeTruthy();
    });
  });

  describe("currentNoteIndex updates", () => {
    it("handles null currentNoteIndex", () => {
      const { rerender } = render(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={null} />,
      );
      // Re-render with index
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
      );
    });

    it("handles negative currentNoteIndex", () => {
      render(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={-1} />,
      );
    });

    it("handles currentNoteIndex update from null to number", () => {
      const { rerender } = render(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={null} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={5} />,
      );
    });

    it("handles currentNoteIndex update from number to null", () => {
      const { rerender } = render(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={3} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={null} />,
      );
    });

    it("handles sequential currentNoteIndex updates", () => {
      const { rerender } = render(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={1} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={2} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={3} />,
      );
    });
  });

  describe("Zoom levels", () => {
    it("handles small zoom value", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} zoom={0.3} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles large zoom value", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} zoom={2.0} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles default zoom value", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} zoom={0.7} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Fixed measure width", () => {
    it("handles null fixedMeasureWidthPixels", () => {
      const { toJSON } = render(
        <NotationDisplay
          musicxml={sampleMusicXML}
          fixedMeasureWidthPixels={null}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles various fixedMeasureWidthPixels values", () => {
      [50, 100, 150, 200].forEach((width) => {
        const { toJSON } = render(
          <NotationDisplay
            musicxml={sampleMusicXML}
            fixedMeasureWidthPixels={width}
          />,
        );
        expect(toJSON()).toBeTruthy();
      });
    });
  });

  describe("Dimension variations", () => {
    it("handles very small dimensions", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} width={100} height={50} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles large dimensions", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} width={1000} height={800} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles square dimensions", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} width={300} height={300} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles wide dimensions", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} width={800} height={100} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles tall dimensions", () => {
      const { toJSON } = render(
        <NotationDisplay musicxml={sampleMusicXML} width={100} height={600} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("MusicXML prop changes", () => {
    it("re-renders when musicxml changes", () => {
      const { rerender, getByTestId } = render(
        <NotationDisplay musicxml={sampleMusicXML} />,
      );
      rerender(<NotationDisplay musicxml={complexMusicXML} />);
      expect(getByTestId("webview")).toBeTruthy();
    });

    it("handles changing from empty to valid musicxml", () => {
      const { rerender, queryByText, getByTestId } = render(
        <NotationDisplay musicxml="" />,
      );
      expect(queryByText("No notation data")).toBeTruthy();
      rerender(<NotationDisplay musicxml={sampleMusicXML} />);
      expect(getByTestId("webview")).toBeTruthy();
    });

    it("handles changing from valid to empty musicxml", () => {
      const { rerender, queryByText, getByTestId } = render(
        <NotationDisplay musicxml={sampleMusicXML} />,
      );
      expect(getByTestId("webview")).toBeTruthy();
      rerender(<NotationDisplay musicxml="" />);
      expect(queryByText("No notation data")).toBeTruthy();
    });
  });
});

describe("NotationPlaceholder", () => {
  it("renders with default message", () => {
    const { getByText } = render(<NotationPlaceholder />);
    expect(getByText("Notation hidden - practice by ear")).toBeTruthy();
  });

  it("renders with custom message", () => {
    const { getByText } = render(
      <NotationPlaceholder message="Listen carefully" />,
    );
    expect(getByText("Listen carefully")).toBeTruthy();
  });

  it("renders the ear emoji icon", () => {
    const { getByText } = render(<NotationPlaceholder />);
    expect(getByText("🎧")).toBeTruthy();
  });

  it("renders with empty message", () => {
    const { queryByText } = render(<NotationPlaceholder message="" />);
    expect(queryByText("Notation hidden - practice by ear")).toBeFalsy();
  });

  it("renders correctly when unmounting", () => {
    const { unmount } = render(<NotationPlaceholder />);
    unmount();
  });

  it("renders with very long message", () => {
    const longMessage = "A".repeat(200);
    const { getByText } = render(<NotationPlaceholder message={longMessage} />);
    expect(getByText(longMessage)).toBeTruthy();
  });

  it("renders with special characters in message", () => {
    const { getByText } = render(
      <NotationPlaceholder message="Test with <special> & 'chars'" />,
    );
    expect(getByText("Test with <special> & 'chars'")).toBeTruthy();
  });

  it("renders with unicode in message", () => {
    const { getByText } = render(
      <NotationPlaceholder message="🎵 Practice Mode 🎶" />,
    );
    expect(getByText("🎵 Practice Mode 🎶")).toBeTruthy();
  });
});

describe("NotationDisplay - WebView Cursor Interaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostMessage.mockClear();
    mockReload.mockClear();
    mockInjectJavaScript.mockClear();
  });

  it("calls postMessage when currentNoteIndex changes", async () => {
    const { rerender } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
    );

    // Change note index
    await act(async () => {
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={1} />,
      );
    });

    // Check postMessage was called with cursor command
    expect(mockPostMessage).toHaveBeenCalled();
    const lastCall =
      mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
    const parsedMessage = JSON.parse(lastCall[0]);
    expect(parsedMessage.type).toBe("cursor");
    expect(parsedMessage.noteIndex).toBe(1);
  });

  it("sends null noteIndex to hide cursor", async () => {
    const { rerender } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={5} />,
    );

    await act(async () => {
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={null} />,
      );
    });

    expect(mockPostMessage).toHaveBeenCalled();
    const lastCall =
      mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
    const parsedMessage = JSON.parse(lastCall[0]);
    expect(parsedMessage.noteIndex).toBeNull();
  });

  it("sends negative noteIndex to hide cursor", async () => {
    const { rerender } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={3} />,
    );

    await act(async () => {
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={-1} />,
      );
    });

    expect(mockPostMessage).toHaveBeenCalled();
  });

  it("sends cursor updates for sequential note advancement", async () => {
    const { rerender } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
    );

    for (let i = 1; i <= 5; i++) {
      await act(async () => {
        rerender(
          <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={i} />,
        );
      });
    }

    // Should have multiple postMessage calls
    expect(mockPostMessage.mock.calls.length).toBeGreaterThanOrEqual(5);
  });

  it("handles rapid cursor updates", async () => {
    const { rerender } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
    );

    // Rapid updates
    await act(async () => {
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={1} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={2} />,
      );
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={3} />,
      );
    });

    expect(mockPostMessage).toHaveBeenCalled();
  });

  it("sends cursor update with high note index", async () => {
    const { rerender } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
    );

    await act(async () => {
      rerender(
        <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={100} />,
      );
    });

    expect(mockPostMessage).toHaveBeenCalled();
    const lastCall =
      mockPostMessage.mock.calls[mockPostMessage.mock.calls.length - 1];
    const parsedMessage = JSON.parse(lastCall[0]);
    expect(parsedMessage.noteIndex).toBe(100);
  });
});

describe("NotationDisplay - MusicXML Variants", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders MusicXML with accidentals", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={accidentalMusicXML} />,
    );
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("renders MusicXML with rests", () => {
    const { getByTestId } = render(<NotationDisplay musicxml={restMusicXML} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with newlines", () => {
    const xmlWithNewlines = sampleMusicXML.replace(/>/g, ">\n");
    const { getByTestId } = render(
      <NotationDisplay musicxml={xmlWithNewlines} />,
    );
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with tabs", () => {
    const xmlWithTabs = sampleMusicXML.replace(/  /g, "\t");
    const { getByTestId } = render(<NotationDisplay musicxml={xmlWithTabs} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with CDATA sections", () => {
    const xmlWithCDATA = sampleMusicXML.replace(
      "Music",
      "<![CDATA[Music Data]]>",
    );
    const { getByTestId } = render(<NotationDisplay musicxml={xmlWithCDATA} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with comments", () => {
    const xmlWithComment = sampleMusicXML.replace(
      "<part-name>",
      "<!-- Part Name --><part-name>",
    );
    const { getByTestId } = render(
      <NotationDisplay musicxml={xmlWithComment} />,
    );
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with single quotes in attributes", () => {
    const xmlWithQuotes = sampleMusicXML.replace('id="P1"', "id='P1'");
    const { getByTestId } = render(
      <NotationDisplay musicxml={xmlWithQuotes} />,
    );
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with ampersands", () => {
    const xmlWithAmp = sampleMusicXML.replace("Music", "Music &amp; More");
    const { getByTestId } = render(<NotationDisplay musicxml={xmlWithAmp} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles very long MusicXML", () => {
    // Create a long MusicXML with many measures
    let longXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise>
  <part-list><score-part id="P1"><part-name>Long</part-name></score-part></part-list>
  <part id="P1">`;
    for (let i = 1; i <= 50; i++) {
      longXml += `
    <measure number="${i}">
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note>
    </measure>`;
    }
    longXml += "</part></score-partwise>";

    const { getByTestId } = render(<NotationDisplay musicxml={longXml} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML with different encodings in declaration", () => {
    const xmlUtf16 = sampleMusicXML.replace("UTF-8", "UTF-16");
    const { getByTestId } = render(<NotationDisplay musicxml={xmlUtf16} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles MusicXML without XML declaration", () => {
    const xmlNoDecl = sampleMusicXML.replace(
      '<?xml version="1.0" encoding="UTF-8"?>\n',
      "",
    );
    const { getByTestId } = render(<NotationDisplay musicxml={xmlNoDecl} />);
    expect(getByTestId("webview")).toBeTruthy();
  });
});

describe("NotationDisplay - Props Combinations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with showTitle and showTimeSignature both true", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        showTitle={true}
        showTimeSignature={true}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with showTitle and showTimeSignature both false", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        showTitle={false}
        showTimeSignature={false}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with small zoom and large dimensions", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        width={800}
        height={600}
        zoom={0.3}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with large zoom and small dimensions", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        width={150}
        height={100}
        zoom={2.0}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with fixedMeasureWidthPixels and zoom together", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={80}
        zoom={1.2}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("renders with currentNoteIndex and all display options", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        currentNoteIndex={2}
        showTitle={true}
        showTimeSignature={true}
        width={400}
        height={200}
        zoom={0.8}
        fixedMeasureWidthPixels={75}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles zero width", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} width={0} height={200} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles zero height", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} width={300} height={0} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles zero fixedMeasureWidthPixels", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} fixedMeasureWidthPixels={0} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles very small zoom", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} zoom={0.1} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles very large zoom", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} zoom={5.0} />,
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe("NotationDisplay - Rerender Scenarios", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles multiple prop changes in sequence", () => {
    const { rerender, toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );

    rerender(<NotationDisplay musicxml={sampleMusicXML} width={400} />);
    rerender(
      <NotationDisplay musicxml={sampleMusicXML} width={400} height={300} />,
    );
    rerender(
      <NotationDisplay
        musicxml={sampleMusicXML}
        width={400}
        height={300}
        zoom={1.0}
      />,
    );

    expect(toJSON()).toBeTruthy();
  });

  it("handles musicxml change with dimension change", () => {
    const { rerender, getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} width={320} />,
    );

    rerender(<NotationDisplay musicxml={complexMusicXML} width={500} />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles toggling showTitle", () => {
    const { rerender, toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} showTitle={false} />,
    );

    rerender(<NotationDisplay musicxml={sampleMusicXML} showTitle={true} />);
    rerender(<NotationDisplay musicxml={sampleMusicXML} showTitle={false} />);

    expect(toJSON()).toBeTruthy();
  });

  it("handles toggling showTimeSignature", () => {
    const { rerender, toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} showTimeSignature={false} />,
    );

    rerender(
      <NotationDisplay musicxml={sampleMusicXML} showTimeSignature={true} />,
    );
    rerender(
      <NotationDisplay musicxml={sampleMusicXML} showTimeSignature={false} />,
    );

    expect(toJSON()).toBeTruthy();
  });

  it("handles changing fixedMeasureWidthPixels values", () => {
    const { rerender, toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={50}
      />,
    );

    rerender(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={100}
      />,
    );
    rerender(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={null}
      />,
    );
    rerender(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={75}
      />,
    );

    expect(toJSON()).toBeTruthy();
  });

  it("handles zoom changes in sequence", () => {
    const { rerender, toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} zoom={0.5} />,
    );

    rerender(<NotationDisplay musicxml={sampleMusicXML} zoom={1.0} />);
    rerender(<NotationDisplay musicxml={sampleMusicXML} zoom={1.5} />);
    rerender(<NotationDisplay musicxml={sampleMusicXML} zoom={0.7} />);

    expect(toJSON()).toBeTruthy();
  });

  it("handles dimension resizing", () => {
    const { rerender, toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} width={320} height={200} />,
    );

    // Simulate resize events
    rerender(
      <NotationDisplay musicxml={sampleMusicXML} width={400} height={250} />,
    );
    rerender(
      <NotationDisplay musicxml={sampleMusicXML} width={500} height={300} />,
    );
    rerender(
      <NotationDisplay musicxml={sampleMusicXML} width={320} height={200} />,
    );

    expect(toJSON()).toBeTruthy();
  });

  it("handles switching between different MusicXML files", () => {
    const { rerender, getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );

    rerender(<NotationDisplay musicxml={complexMusicXML} />);
    rerender(<NotationDisplay musicxml={accidentalMusicXML} />);
    rerender(<NotationDisplay musicxml={restMusicXML} />);
    rerender(<NotationDisplay musicxml={sampleMusicXML} />);

    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles transitioning between valid and invalid states", () => {
    const { rerender, queryByText, queryByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    expect(queryByTestId("webview")).toBeTruthy();

    rerender(<NotationDisplay musicxml="" />);
    expect(queryByText("No notation data")).toBeTruthy();

    rerender(<NotationDisplay musicxml={sampleMusicXML} />);
    expect(queryByTestId("webview")).toBeTruthy();

    rerender(<NotationDisplay musicxml={null} />);
    expect(queryByText("No notation data")).toBeTruthy();
  });
});

describe("NotationDisplay - Unmount and Cleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("cleans up on unmount with valid musicxml", () => {
    const { unmount } = render(<NotationDisplay musicxml={sampleMusicXML} />);
    unmount();
  });

  it("cleans up on unmount with null musicxml", () => {
    const { unmount } = render(<NotationDisplay musicxml={null} />);
    unmount();
  });

  it("cleans up on unmount with currentNoteIndex set", () => {
    const { unmount } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={5} />,
    );
    unmount();
  });

  it("cleans up on unmount after rerenders", () => {
    const { rerender, unmount } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );

    rerender(<NotationDisplay musicxml={complexMusicXML} />);
    rerender(<NotationDisplay musicxml="" />);
    rerender(<NotationDisplay musicxml={sampleMusicXML} />);

    unmount();
  });

  it("handles unmount during cursor update cycle", () => {
    const { rerender, unmount } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={0} />,
    );

    rerender(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={1} />,
    );
    unmount();
  });
});

describe("NotationDisplay - WebView Props Verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("WebView has javaScriptEnabled", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.javaScriptEnabled).toBe(true);
  });

  it("WebView has domStorageEnabled", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.domStorageEnabled).toBe(true);
  });

  it("WebView has scrollEnabled false", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.scrollEnabled).toBe(false);
  });

  it("WebView has source with html", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source).toBeDefined();
    expect(webview.props.source.html).toBeDefined();
    expect(typeof webview.props.source.html).toBe("string");
  });

  it("WebView HTML contains OSMD script reference", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("opensheetmusicdisplay");
  });

  it("WebView HTML contains the musicxml content", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    // The musicxml is escaped but should still be present
    expect(webview.props.source.html).toContain("score-partwise");
  });

  it("WebView has mixed content mode set", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.mixedContentMode).toBe("always");
  });

  it("WebView has originWhitelist configured", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.originWhitelist).toContain("*");
  });
});

describe("NotationDisplay - Configuration Options in HTML", () => {
  it("HTML includes showTitle option when true", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} showTitle={true} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("drawTitle: true");
  });

  it("HTML includes showTitle option when false", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} showTitle={false} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("drawTitle: false");
  });

  it("HTML includes showTimeSignature option when true", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} showTimeSignature={true} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("drawTimeSignatures: true");
  });

  it("HTML includes showTimeSignature option when false", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} showTimeSignature={false} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("drawTimeSignatures: false");
  });

  it("HTML includes zoom setting", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} zoom={0.8} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("osmd.zoom = 0.8");
  });

  it("HTML includes cursor configuration", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("cursorsOptions");
    expect(webview.props.source.html).toContain("#4CAF50"); // cursor color
  });

  it("HTML includes message listener for cursor", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("addEventListener");
    expect(webview.props.source.html).toContain("message");
  });

  it("HTML includes fixedMeasureWidth when specified", () => {
    const { getByTestId } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={100}
      />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("fixedMeasureWidth: true");
    expect(webview.props.source.html).toContain("FixedMeasureWidthFixedValue");
  });

  it("HTML includes width in styles", () => {
    const { getByTestId } = render(
      <NotationDisplay musicxml={sampleMusicXML} width={450} />,
    );
    const webview = getByTestId("webview");
    expect(webview.props.source.html).toContain("450px");
  });
});

describe("NotationDisplay - Edge Cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles whitespace-only musicxml as valid", () => {
    // Whitespace-only is treated as valid musicxml (non-empty string)
    const { getByTestId } = render(<NotationDisplay musicxml="   \n\t   " />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles single character musicxml", () => {
    const { getByTestId } = render(<NotationDisplay musicxml="x" />);
    expect(getByTestId("webview")).toBeTruthy();
  });

  it("handles negative width gracefully", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} width={-100} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles negative height gracefully", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} height={-50} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles negative zoom gracefully", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} zoom={-0.5} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles negative fixedMeasureWidthPixels", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={-50}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles very large currentNoteIndex", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} currentNoteIndex={999999} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles decimal dimensions", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        width={320.5}
        height={199.9}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles decimal zoom values", () => {
    const { toJSON } = render(
      <NotationDisplay musicxml={sampleMusicXML} zoom={0.777} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles decimal fixedMeasureWidthPixels", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        fixedMeasureWidthPixels={75.5}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });
});

describe("NotationDisplay - Snapshot validation", () => {
  it("renders consistent structure with minimum props", () => {
    const { toJSON } = render(<NotationDisplay musicxml={sampleMusicXML} />);
    expect(toJSON()).toBeTruthy();
  });

  it("renders consistent structure with all props", () => {
    const { toJSON } = render(
      <NotationDisplay
        musicxml={sampleMusicXML}
        width={400}
        height={300}
        showTitle={true}
        showTimeSignature={true}
        fixedMeasureWidthPixels={80}
        zoom={0.9}
        currentNoteIndex={1}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("empty state renders consistent structure", () => {
    const { toJSON } = render(<NotationDisplay musicxml={null} />);
    expect(toJSON()).toBeTruthy();
  });

  it("placeholder renders consistent structure", () => {
    const { toJSON } = render(<NotationPlaceholder message="Test" />);
    expect(toJSON()).toBeTruthy();
  });
});
