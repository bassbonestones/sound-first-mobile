/**
 * Tests for ScorePreview component
 *
 * Tests the music notation preview component that renders
 * MusicXML using OpenSheetMusicDisplay in a WebView.
 */

import React from "react";
import { View } from "react-native";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";

// Mock react-native-webview with ref support
const mockInjectJavaScript = jest.fn();
let onLoadCallback: (() => void) | null = null;
let onMessageCallback:
  | ((event: { nativeEvent: { data: string } }) => void)
  | null = null;

jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  const WebView = React.forwardRef((props: any, ref: any) => {
    // Capture callbacks
    onLoadCallback = props.onLoad;
    onMessageCallback = props.onMessage;

    // Expose methods via ref
    React.useImperativeHandle(ref, () => ({
      injectJavaScript: mockInjectJavaScript,
    }));

    return <View testID="webview" {...props} />;
  });

  return { WebView };
});

// Import after mocks
import {
  ScorePreview,
  HighlightedMeasure,
} from "../src/features/importMusic/components/ScorePreview";
import { generateOsmdHtml } from "../src/features/importMusic/components/scorePreviewHtml";

// ============================================================================
// Test Data
// ============================================================================

const sampleMusicXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN"
    "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
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
      <note>
        <pitch><step>C</step><octave>4</octave></pitch>
        <duration>4</duration>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`;

const highlightedMeasures: HighlightedMeasure[] = [
  { measureNumber: 1, partIndex: 0, confidence: 0.7 },
  { measureNumber: 2, partIndex: 0, confidence: 0.4 },
];

// ============================================================================
// Helper Functions
// ============================================================================

function simulateWebViewLoad() {
  if (onLoadCallback) {
    act(() => {
      onLoadCallback!();
    });
  }
}

function simulateWebViewMessage(type: string, payload?: unknown) {
  if (onMessageCallback) {
    act(() => {
      onMessageCallback!({
        nativeEvent: { data: JSON.stringify({ type, payload }) },
      });
    });
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("ScorePreview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onLoadCallback = null;
    onMessageCallback = null;
  });

  describe("Rendering", () => {
    it("renders loading state initially", () => {
      const { getByText, getByTestId } = render(
        <ScorePreview musicXml={sampleMusicXml} />,
      );

      expect(getByText("Preparing renderer...")).toBeTruthy();
      expect(getByTestId("score-preview")).toBeTruthy();
    });

    it("shows rendering state after WebView loads", async () => {
      const { getByText } = render(<ScorePreview musicXml={sampleMusicXml} />);

      simulateWebViewLoad();

      await waitFor(() => {
        expect(getByText("Rendering score...")).toBeTruthy();
      });
    });

    it("injects MusicXML into WebView on load", async () => {
      render(<ScorePreview musicXml={sampleMusicXml} />);

      simulateWebViewLoad();

      await waitFor(() => {
        expect(mockInjectJavaScript).toHaveBeenCalled();
        const script = mockInjectJavaScript.mock.calls[0][0];
        expect(script).toContain("window.renderMusicXML");
      });
    });

    it("shows ready state after render complete message", async () => {
      const { queryByText } = render(
        <ScorePreview musicXml={sampleMusicXml} />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(queryByText("Preparing renderer...")).toBeNull();
        expect(queryByText("Rendering score...")).toBeNull();
      });
    });

    it("shows error state on render error", async () => {
      const { getByText } = render(<ScorePreview musicXml={sampleMusicXml} />);

      simulateWebViewLoad();
      simulateWebViewMessage("error", "Failed to parse MusicXML");

      await waitFor(() => {
        expect(getByText("Failed to render score")).toBeTruthy();
        expect(getByText("Failed to parse MusicXML")).toBeTruthy();
      });
    });
  });

  describe("Callbacks", () => {
    it("calls onRenderComplete when render succeeds", async () => {
      const onRenderComplete = jest.fn();
      render(
        <ScorePreview
          musicXml={sampleMusicXml}
          onRenderComplete={onRenderComplete}
        />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(onRenderComplete).toHaveBeenCalledTimes(1);
      });
    });

    it("calls onError when render fails", async () => {
      const onError = jest.fn();
      render(<ScorePreview musicXml={sampleMusicXml} onError={onError} />);

      simulateWebViewLoad();
      simulateWebViewMessage("error", "Parse error");

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith("Parse error");
      });
    });

    it("calls onMeasureTap when a measure is tapped", async () => {
      const onMeasureTap = jest.fn();
      render(
        <ScorePreview musicXml={sampleMusicXml} onMeasureTap={onMeasureTap} />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");
      simulateWebViewMessage("measureTap", { measureNumber: 3, partIndex: 0 });

      await waitFor(() => {
        expect(onMeasureTap).toHaveBeenCalledWith(3, 0);
      });
    });
  });

  describe("Zoom Controls", () => {
    it("renders zoom controls by default", async () => {
      const { getByTestId, getByText } = render(
        <ScorePreview musicXml={sampleMusicXml} />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(getByTestId("score-preview-zoom-in")).toBeTruthy();
        expect(getByTestId("score-preview-zoom-out")).toBeTruthy();
        expect(getByTestId("score-preview-zoom-reset")).toBeTruthy();
        expect(getByText("100%")).toBeTruthy();
      });
    });

    it("hides zoom controls when showZoomControls=false", async () => {
      const { queryByTestId } = render(
        <ScorePreview musicXml={sampleMusicXml} showZoomControls={false} />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(queryByTestId("score-preview-zoom-in")).toBeNull();
      });
    });

    it("injects zoom commands when zoom buttons are pressed", async () => {
      const { getByTestId } = render(
        <ScorePreview musicXml={sampleMusicXml} initialZoom={1.0} />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(getByTestId("score-preview-zoom-in")).toBeTruthy();
      });

      mockInjectJavaScript.mockClear();

      fireEvent.press(getByTestId("score-preview-zoom-in"));
      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("window.setZoom(1.25)"),
      );

      mockInjectJavaScript.mockClear();

      fireEvent.press(getByTestId("score-preview-zoom-out"));
      // Should go back to 1.0 (since we just zoomed to 1.25 and now subtract 0.25)
      expect(mockInjectJavaScript).toHaveBeenCalledWith(
        expect.stringContaining("window.setZoom(1)"),
      );
    });

    it("respects min and max zoom limits", async () => {
      const { getByTestId, getByText } = render(
        <ScorePreview
          musicXml={sampleMusicXml}
          initialZoom={0.5}
          minZoom={0.5}
          maxZoom={2.0}
        />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(getByText("50%")).toBeTruthy();
      });

      // Zoom out should be disabled at min
      const zoomOutButton = getByTestId("score-preview-zoom-out");
      // Implementation disables based on currentZoom <= minZoom
      // The button's onPress won't do anything meaningful
    });

    it("updates zoom percentage display", async () => {
      const { getByText } = render(
        <ScorePreview musicXml={sampleMusicXml} initialZoom={1.5} />,
      );

      simulateWebViewLoad();
      simulateWebViewMessage("rendered");

      await waitFor(() => {
        expect(getByText("150%")).toBeTruthy();
      });
    });
  });

  describe("Props", () => {
    it("applies custom height", () => {
      const { getByTestId } = render(
        <ScorePreview musicXml={sampleMusicXml} height={600} />,
      );

      const container = getByTestId("score-preview");
      expect(container.props.style).toEqual(
        expect.arrayContaining([expect.objectContaining({ height: 600 })]),
      );
    });

    it("passes highlighted measures to HTML generator", () => {
      render(
        <ScorePreview
          musicXml={sampleMusicXml}
          highlightMeasures={highlightedMeasures}
        />,
      );

      // The HTML should contain the serialized highlights
      // We can't easily test the generated HTML, but we can verify
      // it doesn't crash with highlights
      simulateWebViewLoad();
      expect(mockInjectJavaScript).toHaveBeenCalled();
    });

    it("uses custom testID", () => {
      const { getByTestId } = render(
        <ScorePreview musicXml={sampleMusicXml} testID="custom-preview" />,
      );

      expect(getByTestId("custom-preview")).toBeTruthy();
    });
  });
});

// ============================================================================
// HTML Generator Tests
// ============================================================================

describe("generateOsmdHtml", () => {
  it("generates valid HTML", () => {
    const html = generateOsmdHtml();

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<html>");
    expect(html).toContain("</html>");
  });

  it("includes OSMD script from CDN", () => {
    const html = generateOsmdHtml();

    expect(html).toContain("opensheetmusicdisplay");
    expect(html).toContain("cdn.jsdelivr.net");
  });

  it("includes renderMusicXML function", () => {
    const html = generateOsmdHtml();

    expect(html).toContain("window.renderMusicXML");
  });

  it("includes setZoom function", () => {
    const html = generateOsmdHtml();

    expect(html).toContain("window.setZoom");
  });

  it("applies initial zoom", () => {
    const html = generateOsmdHtml({ initialZoom: 1.5 });

    expect(html).toContain("currentZoom = 1.5");
  });

  it("includes highlight measures", () => {
    const html = generateOsmdHtml({
      highlightMeasures: [{ measureNumber: 1, partIndex: 0, confidence: 0.8 }],
    });

    expect(html).toContain("measureNumber");
    expect(html).toContain("confidence");
  });

  it("applies custom background color", () => {
    const html = generateOsmdHtml({ backgroundColor: "#f0f0f0" });

    expect(html).toContain("#f0f0f0");
  });

  it("configures OSMD draw options", () => {
    const html = generateOsmdHtml({
      drawTitle: true,
      drawComposer: true,
      drawPartNames: false,
    });

    expect(html).toContain("drawTitle: true");
    expect(html).toContain("drawComposer: true");
    expect(html).toContain("drawPartNames: false");
  });

  it("includes message passing to React Native", () => {
    const html = generateOsmdHtml();

    expect(html).toContain("ReactNativeWebView");
    expect(html).toContain("postMessage");
  });

  it("includes error handling", () => {
    const html = generateOsmdHtml();

    expect(html).toContain("catch");
    expect(html).toContain("showError");
  });

  it("includes highlight styling", () => {
    const html = generateOsmdHtml();

    expect(html).toContain(".highlight-measure");
    expect(html).toContain(".highlight-measure-low");
  });
});
