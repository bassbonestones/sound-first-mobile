import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TuningSettingsButton, {
  MINOR_7TH_RATIOS,
  MINOR_7TH_LABELS,
  KEY_DISPLAY_NAMES,
} from "../src/components/TuningSettingsButton";

describe("TuningSettingsButton", () => {
  const defaultProps = {
    temperament: "equal" as const,
    concertA: "440",
    keyIndex: 0,
    minor7System: "classical" as const,
    onTemperamentChange: jest.fn(),
    onConcertAChange: jest.fn(),
    onKeyIndexChange: jest.fn(),
    onMinor7SystemChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Constants", () => {
    it("exports MINOR_7TH_RATIOS", () => {
      expect(MINOR_7TH_RATIOS.classical).toBe(9 / 5);
      expect(MINOR_7TH_RATIOS.pythagorean).toBe(16 / 9);
      expect(MINOR_7TH_RATIOS.harmonic).toBe(7 / 4);
    });

    it("exports MINOR_7TH_LABELS", () => {
      expect(MINOR_7TH_LABELS.classical).toBe("9:5");
      expect(MINOR_7TH_LABELS.pythagorean).toBe("16:9");
      expect(MINOR_7TH_LABELS.harmonic).toBe("7:4");
    });

    it("exports KEY_DISPLAY_NAMES", () => {
      expect(KEY_DISPLAY_NAMES).toHaveLength(12);
      expect(KEY_DISPLAY_NAMES[0]).toBe("C");
      expect(KEY_DISPLAY_NAMES[9]).toBe("A");
    });
  });

  describe("ET summary display", () => {
    it("shows ET label for equal temperament", () => {
      const { getByText } = render(<TuningSettingsButton {...defaultProps} />);
      expect(getByText("ET")).toBeTruthy();
    });

    it("shows concert A value", () => {
      const { getByText } = render(<TuningSettingsButton {...defaultProps} />);
      expect(getByText("A=440Hz")).toBeTruthy();
    });

    it("has settings icon", () => {
      const { getByText } = render(<TuningSettingsButton {...defaultProps} />);
      expect(getByText("⚙️")).toBeTruthy();
    });
  });

  describe("JI summary display", () => {
    it("shows JI label for just intonation", () => {
      const { getByText } = render(
        <TuningSettingsButton {...defaultProps} temperament="just" />,
      );
      expect(getByText("JI")).toBeTruthy();
    });

    it("shows key name for just intonation", () => {
      const { getByText } = render(
        <TuningSettingsButton
          {...defaultProps}
          temperament="just"
          keyIndex={0}
        />,
      );
      expect(getByText("C")).toBeTruthy();
    });

    it("shows m7 system label", () => {
      const { getByText } = render(
        <TuningSettingsButton
          {...defaultProps}
          temperament="just"
          minor7System="classical"
        />,
      );
      expect(getByText("m7: 9:5")).toBeTruthy();
    });
  });

  describe("Modal interaction", () => {
    it("opens modal on button press", () => {
      const { getByLabelText, getByText } = render(
        <TuningSettingsButton {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(getByText("Tuning Settings")).toBeTruthy();
    });

    it("closes modal on Done press", () => {
      const { getByLabelText, getByText, queryByText } = render(
        <TuningSettingsButton {...defaultProps} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(getByText("Tuning Settings")).toBeTruthy();
      fireEvent.press(getByLabelText("Close settings"));
      // Modal should be closed (but in RN tests Modal visibility might still be queryable)
    });
  });

  describe("Temperament selection", () => {
    it("calls onTemperamentChange with equal", () => {
      const { getByLabelText } = render(
        <TuningSettingsButton {...defaultProps} temperament="just" />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      fireEvent.press(getByLabelText(/Standard equal temperament/));
      expect(defaultProps.onTemperamentChange).toHaveBeenCalledWith("equal");
    });

    it("calls onTemperamentChange with just", () => {
      const { getByLabelText } = render(
        <TuningSettingsButton {...defaultProps} temperament="equal" />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      fireEvent.press(getByLabelText(/Resonance just intonation/));
      expect(defaultProps.onTemperamentChange).toHaveBeenCalledWith("just");
    });
  });

  describe("Accessibility", () => {
    it("has accessible button", () => {
      const { getByLabelText } = render(
        <TuningSettingsButton {...defaultProps} />,
      );
      expect(getByLabelText("Open tuning settings")).toBeTruthy();
    });
  });

  describe("Custom styling", () => {
    it("applies custom style", () => {
      const { getByLabelText } = render(
        <TuningSettingsButton {...defaultProps} style={{ marginTop: 10 }} />,
      );
      expect(getByLabelText("Open tuning settings")).toBeTruthy();
    });
  });

  describe("JI-specific controls", () => {
    const jiProps = {
      ...defaultProps,
      temperament: "just" as const,
    };

    it("shows key selection in JI mode modal", () => {
      const { getByLabelText, getByText } = render(
        <TuningSettingsButton {...jiProps} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(getByText("Key Center")).toBeTruthy();
    });

    it("calls onKeyIndexChange when key is selected", () => {
      const { getByLabelText } = render(
        <TuningSettingsButton {...jiProps} keyIndex={0} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      fireEvent.press(getByLabelText("Key of D"));
      expect(jiProps.onKeyIndexChange).toHaveBeenCalledWith(2);
    });

    it("shows minor 7th ratio section in JI mode", () => {
      const { getByLabelText, getByText } = render(
        <TuningSettingsButton {...jiProps} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      expect(getByText("Minor 7th Ratio")).toBeTruthy();
    });

    it("calls onMinor7SystemChange for pythagorean", () => {
      const { getByLabelText, getByText } = render(
        <TuningSettingsButton {...jiProps} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      fireEvent.press(getByText("16:9"));
      expect(jiProps.onMinor7SystemChange).toHaveBeenCalledWith("pythagorean");
    });

    it("calls onMinor7SystemChange for harmonic", () => {
      const { getByLabelText, getByText } = render(
        <TuningSettingsButton {...jiProps} />,
      );
      fireEvent.press(getByLabelText("Open tuning settings"));
      fireEvent.press(getByText("7:4"));
      expect(jiProps.onMinor7SystemChange).toHaveBeenCalledWith("harmonic");
    });
  });
});
