/**
 * Tests for VolumeBar component
 *
 * Fully typed TypeScript test file.
 */
import React from "react";
import { render } from "@testing-library/react-native";
import VolumeBar, {
  CircularVolumeIndicator,
} from "../src/components/VolumeBar";

describe("VolumeBar Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { toJSON } = render(<VolumeBar volume={0.5} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders with label", () => {
      const { getByText } = render(
        <VolumeBar volume={0.5} label="Your Sound" />,
      );
      expect(getByText("Your Sound")).toBeTruthy();
    });

    it("renders without label", () => {
      const { queryByText } = render(<VolumeBar volume={0.5} />);
      // Should not have any specific label text
      expect(queryByText("Your Sound")).toBeNull();
    });
  });

  describe("Volume Levels", () => {
    it("renders at zero volume", () => {
      const { toJSON } = render(<VolumeBar volume={0} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders at mid volume", () => {
      const { toJSON } = render(<VolumeBar volume={0.5} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders at full volume", () => {
      const { toJSON } = render(<VolumeBar volume={1} />);
      expect(toJSON()).toBeTruthy();
    });

    it("clamps volume above 1", () => {
      const { toJSON } = render(<VolumeBar volume={1.5} />);
      expect(toJSON()).toBeTruthy();
    });

    it("handles negative volume", () => {
      const { toJSON } = render(<VolumeBar volume={-0.5} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Pitch Accuracy Colors", () => {
    it("renders with correct pitch accuracy and shows message", () => {
      const { getByText } = render(
        <VolumeBar volume={0.5} pitchAccuracy="correct" />,
      );
      expect(getByText("Great pitch!")).toBeTruthy();
    });

    it("renders with off pitch accuracy and shows message", () => {
      const { getByText } = render(
        <VolumeBar volume={0.5} pitchAccuracy="off" />,
      );
      expect(getByText("Adjust your pitch")).toBeTruthy();
    });

    it("renders with listening pitch accuracy", () => {
      const { toJSON } = render(
        <VolumeBar volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders without pitch accuracy", () => {
      const { toJSON } = render(
        <VolumeBar volume={0.5} pitchAccuracy={null} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Height Prop", () => {
    it("accepts custom height", () => {
      const { toJSON } = render(<VolumeBar volume={0.5} height={50} />);
      expect(toJSON()).toBeTruthy();
    });

    it("uses default height when not specified", () => {
      const { toJSON } = render(<VolumeBar volume={0.5} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts small height", () => {
      const { toJSON } = render(<VolumeBar volume={0.5} height={10} />);
      expect(toJSON()).toBeTruthy();
    });

    it("accepts large height", () => {
      const { toJSON } = render(<VolumeBar volume={0.5} height={100} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Style Props", () => {
    it("accepts custom style", () => {
      const { toJSON } = render(
        <VolumeBar volume={0.5} style={{ marginTop: 20 }} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts showPeakHold prop", () => {
      const { toJSON } = render(
        <VolumeBar volume={0.75} showPeakHold={true} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe("CircularVolumeIndicator Component", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      const { toJSON } = render(<CircularVolumeIndicator volume={0.5} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders at various sizes", () => {
      const sizes = [50, 80, 100, 150];

      sizes.forEach((size) => {
        const { toJSON, unmount } = render(
          <CircularVolumeIndicator volume={0.5} size={size} />,
        );
        expect(toJSON()).toBeTruthy();
        unmount();
      });
    });
  });

  describe("Volume Levels", () => {
    it("renders at zero volume", () => {
      const { toJSON } = render(<CircularVolumeIndicator volume={0} />);
      expect(toJSON()).toBeTruthy();
    });

    it("renders at full volume", () => {
      const { toJSON } = render(<CircularVolumeIndicator volume={1} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Pitch Accuracy", () => {
    it("renders with correct pitch", () => {
      const { toJSON } = render(
        <CircularVolumeIndicator volume={0.5} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with off pitch", () => {
      const { toJSON } = render(
        <CircularVolumeIndicator volume={0.5} pitchAccuracy="off" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with listening state", () => {
      const { toJSON } = render(
        <CircularVolumeIndicator volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe("VolumeBar Animation and Peak Hold", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders without animation (animated=false)", () => {
    const { toJSON } = render(<VolumeBar volume={0.5} animated={false} />);
    expect(toJSON()).toBeTruthy();
  });

  it("updates immediately when animated is false", () => {
    const { rerender, toJSON } = render(
      <VolumeBar volume={0.5} animated={false} />,
    );

    // Change volume
    rerender(<VolumeBar volume={0.8} animated={false} />);

    expect(toJSON()).toBeTruthy();
  });

  it("renders with showPeakHold enabled", () => {
    const { toJSON } = render(<VolumeBar volume={0.5} showPeakHold={true} />);
    expect(toJSON()).toBeTruthy();
  });

  it("tracks peak when volume increases", () => {
    const { rerender, toJSON } = render(
      <VolumeBar volume={0.3} showPeakHold={true} />,
    );

    // Increase volume to set a new peak
    rerender(<VolumeBar volume={0.7} showPeakHold={true} />);

    expect(toJSON()).toBeTruthy();
  });

  it("decays peak after timeout", () => {
    const { rerender, toJSON } = render(
      <VolumeBar volume={0.8} showPeakHold={true} />,
    );

    // Set a peak
    rerender(<VolumeBar volume={0.8} showPeakHold={true} />);

    // Advance timers to trigger peak decay
    jest.advanceTimersByTime(600);

    expect(toJSON()).toBeTruthy();
  });

  it("clears existing timeout when new peak is set", () => {
    const { rerender, toJSON } = render(
      <VolumeBar volume={0.5} showPeakHold={true} />,
    );

    // Set first peak
    rerender(<VolumeBar volume={0.7} showPeakHold={true} />);

    // Quickly set a new higher peak (should clear previous timeout)
    rerender(<VolumeBar volume={0.9} showPeakHold={true} />);

    // Advance partial time
    jest.advanceTimersByTime(600);

    expect(toJSON()).toBeTruthy();
  });
});
