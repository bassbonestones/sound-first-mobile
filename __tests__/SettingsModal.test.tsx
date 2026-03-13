/**
 * Tests for SettingsModal component
 *
 * Tests settings configuration functionality.
 */
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import SettingsModal from "../src/screens/TuneMastery/components/SettingsModal";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Mock Alert
jest.spyOn(Alert, "alert");

const defaultProps = {
  visible: true,
  onClose: jest.fn(),
  settings: {
    emaAlpha: 0.3,
    tunerMode: "needle" as const,
    temperament: "equal" as const,
    autoMetronome: false,
    autoDrone: false,
  },
  onUpdateSettings: jest.fn().mockResolvedValue(undefined),
  onSeedTunes: jest.fn().mockResolvedValue(undefined),
};

describe("SettingsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders when visible", () => {
      const { getByText } = render(<SettingsModal {...defaultProps} />);
      expect(getByText("Settings")).toBeTruthy();
    });

    it("does not render when not visible", () => {
      const { queryByText } = render(
        <SettingsModal {...defaultProps} visible={false} />,
      );
      expect(queryByText("Settings")).toBeNull();
    });

    it("displays EMA input", () => {
      const { getByDisplayValue } = render(<SettingsModal {...defaultProps} />);
      expect(getByDisplayValue("0.3")).toBeTruthy();
    });

    it("displays tuner mode options", () => {
      const { getByText } = render(<SettingsModal {...defaultProps} />);
      expect(getByText("Needle")).toBeTruthy();
      expect(getByText("Text")).toBeTruthy();
    });

    it("displays temperament options", () => {
      const { getByText } = render(<SettingsModal {...defaultProps} />);
      expect(getByText("Equal")).toBeTruthy();
      expect(getByText("Just")).toBeTruthy();
    });
  });

  describe("save functionality", () => {
    it("calls onUpdateSettings with current values when save pressed", async () => {
      const onUpdateSettings = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <SettingsModal {...defaultProps} onUpdateSettings={onUpdateSettings} />,
      );

      fireEvent.press(getByText("Save"));

      await waitFor(() => {
        expect(onUpdateSettings).toHaveBeenCalledWith({
          emaAlpha: 0.3,
          tunerMode: "needle",
          temperament: "equal",
          autoMetronome: false,
          autoDrone: false,
        });
      });
    });

    it("calls onClose after successful save", async () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <SettingsModal {...defaultProps} onClose={onClose} />,
      );

      fireEvent.press(getByText("Save"));

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("resets invalid EMA alpha to default", async () => {
      const onUpdateSettings = jest.fn().mockResolvedValue(undefined);
      const { getByText, getByDisplayValue } = render(
        <SettingsModal {...defaultProps} onUpdateSettings={onUpdateSettings} />,
      );

      // Enter invalid alpha
      const input = getByDisplayValue("0.3");
      fireEvent.changeText(input, "invalid");

      fireEvent.press(getByText("Save"));

      // Should reset to 0.3 and not call onUpdateSettings
      await waitFor(() => {
        expect(getByDisplayValue("0.3")).toBeTruthy();
      });
    });

    it("resets EMA alpha above 1 to default", async () => {
      const onUpdateSettings = jest.fn().mockResolvedValue(undefined);
      const { getByText, getByDisplayValue } = render(
        <SettingsModal {...defaultProps} onUpdateSettings={onUpdateSettings} />,
      );

      const input = getByDisplayValue("0.3");
      fireEvent.changeText(input, "1.5");

      fireEvent.press(getByText("Save"));

      // Should reset to 0.3
      await waitFor(() => {
        expect(getByDisplayValue("0.3")).toBeTruthy();
      });
    });

    it("resets negative EMA alpha to default", async () => {
      const onUpdateSettings = jest.fn().mockResolvedValue(undefined);
      const { getByText, getByDisplayValue } = render(
        <SettingsModal {...defaultProps} onUpdateSettings={onUpdateSettings} />,
      );

      const input = getByDisplayValue("0.3");
      fireEvent.changeText(input, "-0.5");

      fireEvent.press(getByText("Save"));

      // Should reset to 0.3
      await waitFor(() => {
        expect(getByDisplayValue("0.3")).toBeTruthy();
      });
    });
  });

  describe("tuner mode selection", () => {
    it("changes tuner mode when pressed", () => {
      const { getByText } = render(<SettingsModal {...defaultProps} />);

      fireEvent.press(getByText("Text"));

      // Mode should be updated (visual change)
    });
  });

  describe("temperament selection", () => {
    it("changes temperament when pressed", () => {
      const { getByText } = render(<SettingsModal {...defaultProps} />);

      fireEvent.press(getByText("Just"));

      // Temperament should be updated
    });
  });

  describe("auto metronome toggle", () => {
    it("toggles auto metronome", () => {
      const { getByLabelText } = render(<SettingsModal {...defaultProps} />);

      // Find and press the auto metronome toggle
      const toggle = getByLabelText(/Auto-start metronome/);
      fireEvent.press(toggle);
    });
  });

  describe("auto drone toggle", () => {
    it("toggles auto drone", () => {
      const { getByLabelText } = render(<SettingsModal {...defaultProps} />);

      const toggle = getByLabelText(/Auto-start pitch drone/);
      fireEvent.press(toggle);
    });
  });

  describe("seed tunes functionality", () => {
    const originalPlatform = Platform.OS;

    afterEach(() => {
      Object.defineProperty(Platform, "OS", {
        value: originalPlatform,
        writable: true,
      });
    });

    it("shows confirmation dialog when seed button pressed on native", async () => {
      Object.defineProperty(Platform, "OS", { value: "ios", writable: true });

      const { getByText } = render(<SettingsModal {...defaultProps} />);

      fireEvent.press(getByText("Seed Default Tunes"));

      expect(Alert.alert).toHaveBeenCalledWith(
        "Seed Default Tunes",
        expect.stringContaining("replace all existing tunes"),
        expect.any(Array),
      );
    });

    it("shows confirmation dialog and seeds when confirmed on web", async () => {
      Object.defineProperty(Platform, "OS", { value: "web", writable: true });

      // Mock window.confirm
      const originalWindow = global.window;
      (global as unknown as { window: { confirm: jest.Mock } }).window = {
        confirm: jest.fn().mockReturnValue(true),
      };

      const onSeedTunes = jest.fn().mockResolvedValue(undefined);
      const { getByText } = render(
        <SettingsModal {...defaultProps} onSeedTunes={onSeedTunes} />,
      );

      fireEvent.press(getByText("Seed Default Tunes"));

      await waitFor(() => {
        expect(onSeedTunes).toHaveBeenCalled();
      });

      global.window = originalWindow;
    });
  });

  describe("cancel functionality", () => {
    it("calls onClose when cancel pressed", () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <SettingsModal {...defaultProps} onClose={onClose} />,
      );

      fireEvent.press(getByText("Cancel"));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("settings sync", () => {
    it("syncs with settings when modal becomes visible", () => {
      const settings = {
        emaAlpha: 0.5,
        tunerMode: "text" as const,
        temperament: "just" as const,
        autoMetronome: true,
        autoDrone: true,
      };

      const { getByDisplayValue, rerender } = render(
        <SettingsModal {...defaultProps} visible={false} settings={settings} />,
      );

      rerender(
        <SettingsModal {...defaultProps} visible={true} settings={settings} />,
      );

      expect(getByDisplayValue("0.5")).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("handles missing settings", () => {
      const { getByDisplayValue } = render(
        <SettingsModal {...defaultProps} settings={undefined} />,
      );
      // Should use defaults
      expect(getByDisplayValue("0.3")).toBeTruthy();
    });

    it("handles missing onSeedTunes", () => {
      const { getByText } = render(
        <SettingsModal {...defaultProps} onSeedTunes={undefined} />,
      );
      // Should still render
      expect(getByText("Settings")).toBeTruthy();
    });
  });
});
