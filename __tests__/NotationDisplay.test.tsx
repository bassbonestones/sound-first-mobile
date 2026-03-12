/**
 * Tests for NotationDisplay component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { Platform } from "react-native";
import NotationDisplay from "../src/components/NotationDisplay";

// Mock WebView with ref support for postMessage
jest.mock("react-native-webview", () => {
  const React = require("react");
  const { View } = require("react-native");

  const WebView = React.forwardRef(
    (props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      React.useImperativeHandle(ref, () => ({
        postMessage: jest.fn(),
        reload: jest.fn(),
        injectJavaScript: jest.fn(),
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

describe("NotationDisplay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
  });

  describe("Platform-specific behavior", () => {
    it("renders on mobile (native)", () => {
      // Platform.OS defaults to 'ios' in jest
      render(<NotationDisplay musicxml={sampleMusicXML} />);
    });
  });
});
