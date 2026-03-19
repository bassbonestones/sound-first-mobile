/**
 * PitchFeedback Component Tests
 *
 * Tests for the pitch feedback visualization component.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import { PitchFeedback } from "../src/features/importMusic/components/PitchFeedback";
import type { PitchMatchState } from "../src/features/importMusic/types/practiceTypes";

// Mock Feather icons
jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Feather: ({ name, testID }: { name: string; testID?: string }) => (
      <Text testID={testID || `icon-${name}`}>{name}</Text>
    ),
  };
});

const createMockState = (
  overrides: Partial<PitchMatchState> = {},
): PitchMatchState => ({
  targetNote: {
    midiNote: 60,
    noteName: "C4",
    frequency: 261.63,
    measureNumber: 1,
    beatPosition: 1,
    durationBeats: 1,
    isRest: false,
  },
  detectedMidiNote: null,
  detectedNoteName: null,
  centsDeviation: 0,
  isMatching: false,
  confidence: 0,
  volume: 0,
  isSounding: false,
  ...overrides,
});

describe("PitchFeedback", () => {
  it("renders inactive state when not active", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState()}
        isActive={false}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("Pitch detection off")).toBeTruthy();
  });

  it("renders target note when active", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState()}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("Target")).toBeTruthy();
    expect(getByText("C4")).toBeTruthy();
  });

  it("shows rest state for rest notes", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState({
          targetNote: {
            midiNote: 0,
            noteName: "",
            frequency: 0,
            measureNumber: 1,
            beatPosition: 1,
            durationBeats: 1,
            isRest: true,
          },
        })}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("Rest")).toBeTruthy();
  });

  it("displays detected note when sounding", () => {
    const { getByText, getAllByText } = render(
      <PitchFeedback
        pitchState={createMockState({
          detectedMidiNote: 60,
          detectedNoteName: "C4",
          isSounding: true,
          volume: 0.5,
        })}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("Playing")).toBeTruthy();
    // Both target and detected show C4 - should have 2 instances
    const c4Elements = getAllByText("C4");
    expect(c4Elements.length).toBe(2);
  });

  it("shows match indicator when pitch matches", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState({
          detectedMidiNote: 60,
          detectedNoteName: "C4",
          centsDeviation: 5,
          isMatching: true,
          isSounding: true,
          volume: 0.5,
        })}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("Match!")).toBeTruthy();
  });

  it("shows cents deviation when playing", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState({
          detectedMidiNote: 61,
          detectedNoteName: "C#4",
          centsDeviation: 25,
          isMatching: false,
          isSounding: true,
          volume: 0.5,
        })}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("+25¢ sharp")).toBeTruthy();
  });

  it("shows flat indicator for negative deviation", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState({
          detectedMidiNote: 59,
          detectedNoteName: "B3",
          centsDeviation: -30,
          isMatching: false,
          isSounding: true,
          volume: 0.5,
        })}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("-30¢ flat")).toBeTruthy();
  });

  it("renders in compact mode", () => {
    const { getByText, queryByText } = render(
      <PitchFeedback
        pitchState={createMockState()}
        isActive={true}
        compact={true}
        testID="pitch-feedback"
      />,
    );

    // Compact mode should still show target
    expect(getByText("Target")).toBeTruthy();
    // But compress some labels
    expect(getByText("You")).toBeTruthy();
  });

  it("shows listen prompt when not sounding", () => {
    const { getByText } = render(
      <PitchFeedback
        pitchState={createMockState({
          isSounding: false,
        })}
        isActive={true}
        testID="pitch-feedback"
      />,
    );

    expect(getByText("Listen...")).toBeTruthy();
  });

  it("accepts testID prop", () => {
    const { getByTestId } = render(
      <PitchFeedback
        pitchState={createMockState()}
        isActive={true}
        testID="test-pitch-feedback"
      />,
    );

    expect(getByTestId("test-pitch-feedback")).toBeTruthy();
  });
});
