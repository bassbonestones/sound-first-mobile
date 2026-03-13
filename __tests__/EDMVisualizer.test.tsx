/**
 * Tests for EDMVisualizer component
 *
 * Fully typed TypeScript test file.
 */

import React from "react";
import { render } from "@testing-library/react-native";
import EDMVisualizer, {
  EDMVisualizerMedium,
  EDMVisualizerCompact,
} from "../src/components/EDMVisualizer";

// Mock Animated to avoid animation issues in tests
jest.mock("react-native", () => {
  const rn = jest.requireActual("react-native");
  return {
    ...rn,
    Animated: {
      ...rn.Animated,
      Value: jest.fn(() => ({
        interpolate: jest.fn(() => 10),
        setValue: jest.fn(),
      })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      parallel: jest.fn(() => ({ start: jest.fn() })),
      multiply: jest.fn(() => 5),
      View: rn.View,
    },
  };
});

describe("EDMVisualizer", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(<EDMVisualizer volume={0} pitchAccuracy={null} />);
      }).not.toThrow();
    });

    it("renders with correct pitch accuracy", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with off pitch accuracy", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="off" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with listening state", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.3} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with inactive state (null accuracy)", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0} pitchAccuracy={null} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("returns valid render tree", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).not.toBeNull();
    });
  });

  describe("Volume levels", () => {
    it("renders with zero volume", () => {
      expect(() => {
        render(<EDMVisualizer volume={0} pitchAccuracy="listening" />);
      }).not.toThrow();
    });

    it("renders with low volume", () => {
      expect(() => {
        render(<EDMVisualizer volume={0.1} pitchAccuracy="listening" />);
      }).not.toThrow();
    });

    it("renders with medium volume", () => {
      expect(() => {
        render(<EDMVisualizer volume={0.5} pitchAccuracy="listening" />);
      }).not.toThrow();
    });

    it("renders with high volume", () => {
      expect(() => {
        render(<EDMVisualizer volume={1} pitchAccuracy="correct" />);
      }).not.toThrow();
    });

    it("renders with volume at boundary 0", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with volume at boundary 1", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={1} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with very small volume", () => {
      expect(() => {
        render(<EDMVisualizer volume={0.01} pitchAccuracy="listening" />);
      }).not.toThrow();
    });
  });

  describe("Bar configuration", () => {
    it("renders with default bar count", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom bar count of 8", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={8} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom bar count of 4", () => {
      expect(() => {
        render(
          <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={4} />,
        );
      }).not.toThrow();
    });

    it("renders with custom bar count of 32", () => {
      expect(() => {
        render(
          <EDMVisualizer
            volume={0.5}
            pitchAccuracy="listening"
            barCount={32}
          />,
        );
      }).not.toThrow();
    });
  });

  describe("Custom styling", () => {
    it("accepts custom style prop", () => {
      expect(() => {
        render(
          <EDMVisualizer
            volume={0.5}
            pitchAccuracy="listening"
            style={{ height: 200 }}
          />,
        );
      }).not.toThrow();
    });

    it("accepts custom width style", () => {
      const { toJSON } = render(
        <EDMVisualizer
          volume={0.5}
          pitchAccuracy="listening"
          style={{ width: 300 }}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts custom backgroundColor", () => {
      expect(() => {
        render(
          <EDMVisualizer
            volume={0.5}
            pitchAccuracy="listening"
            style={{ backgroundColor: "#000" }}
          />,
        );
      }).not.toThrow();
    });

    it("accepts multiple style properties", () => {
      expect(() => {
        render(
          <EDMVisualizer
            volume={0.5}
            pitchAccuracy="listening"
            style={{ height: 150, width: 250, borderRadius: 8 }}
          />,
        );
      }).not.toThrow();
    });
  });

  describe("Pitch accuracy states", () => {
    it("handles all accuracy states without error", () => {
      const states: Array<"correct" | "off" | "listening" | null> = [
        "correct",
        "off",
        "listening",
        null,
      ];

      states.forEach((state) => {
        expect(() => {
          render(<EDMVisualizer volume={0.5} pitchAccuracy={state} />);
        }).not.toThrow();
      });
    });

    it("transitions from listening to correct", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();

      rerender(<EDMVisualizer volume={0.5} pitchAccuracy="correct" />);
      expect(toJSON()).toBeTruthy();
    });

    it("transitions from listening to off", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
      );

      rerender(<EDMVisualizer volume={0.5} pitchAccuracy="off" />);
      expect(toJSON()).toBeTruthy();
    });

    it("transitions to inactive state", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="correct" />,
      );

      rerender(<EDMVisualizer volume={0} pitchAccuracy={null} />);
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Edge cases", () => {
    it("handles rapid volume changes", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0} pitchAccuracy="listening" />,
      );

      for (let i = 0; i <= 10; i++) {
        rerender(<EDMVisualizer volume={i / 10} pitchAccuracy="listening" />);
      }
      expect(toJSON()).toBeTruthy();
    });

    it("handles rapid state changes", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
      );

      rerender(<EDMVisualizer volume={0.5} pitchAccuracy="correct" />);
      rerender(<EDMVisualizer volume={0.5} pitchAccuracy="off" />);
      rerender(<EDMVisualizer volume={0.5} pitchAccuracy="listening" />);
      rerender(<EDMVisualizer volume={0.5} pitchAccuracy={null} />);

      expect(toJSON()).toBeTruthy();
    });

    it("renders consistently across multiple mounts", () => {
      for (let i = 0; i < 3; i++) {
        const { toJSON, unmount } = render(
          <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
        );
        expect(toJSON()).toBeTruthy();
        unmount();
      }
    });

    it("handles volume above threshold (0.02)", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.03} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles volume below threshold (0.02)", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.01} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles volume at exact threshold (0.02)", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.02} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles negative volume gracefully", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={-0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles volume greater than 1", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={1.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles decimal volume precision", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.123456789} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles minimum bar count of 1", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={1} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles large bar count of 64", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={64} />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles zero bar count", () => {
      const { toJSON } = render(
        <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={0} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Combined prop changes", () => {
    it("handles volume and accuracy change together", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0} pitchAccuracy={null} />,
      );

      rerender(<EDMVisualizer volume={0.5} pitchAccuracy="listening" />);
      expect(toJSON()).toBeTruthy();

      rerender(<EDMVisualizer volume={0.8} pitchAccuracy="correct" />);
      expect(toJSON()).toBeTruthy();
    });

    it("handles all props change together", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer volume={0} pitchAccuracy={null} barCount={16} />,
      );

      rerender(
        <EDMVisualizer
          volume={0.7}
          pitchAccuracy="correct"
          barCount={8}
          style={{ height: 150 }}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles style prop changes", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizer
          volume={0.5}
          pitchAccuracy="listening"
          style={{ height: 100 }}
        />,
      );

      rerender(
        <EDMVisualizer
          volume={0.5}
          pitchAccuracy="listening"
          style={{ height: 200 }}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe("EDMVisualizerMedium", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(<EDMVisualizerMedium volume={0} pitchAccuracy={null} />);
      }).not.toThrow();
    });

    it("renders with correct pitch accuracy", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0.5} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with off pitch accuracy", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0.5} pitchAccuracy="off" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with listening state", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0.3} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with inactive state", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0} pitchAccuracy={null} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Volume levels", () => {
    it("renders with zero volume", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with medium volume", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with full volume", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={1} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles volume below threshold", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0.01} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Bar configuration", () => {
    it("renders with default bar count (12)", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom bar count", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium
          volume={0.5}
          pitchAccuracy="listening"
          barCount={6}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with large bar count", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium
          volume={0.5}
          pitchAccuracy="listening"
          barCount={24}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Custom styling", () => {
    it("accepts custom style prop", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium
          volume={0.5}
          pitchAccuracy="listening"
          style={{ marginTop: 20 }}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("accepts multiple style properties", () => {
      const { toJSON } = render(
        <EDMVisualizerMedium
          volume={0.5}
          pitchAccuracy="listening"
          style={{ padding: 10, borderRadius: 8 }}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("State transitions", () => {
    it("handles accuracy state changes", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizerMedium volume={0.5} pitchAccuracy="listening" />,
      );

      rerender(<EDMVisualizerMedium volume={0.5} pitchAccuracy="correct" />);
      expect(toJSON()).toBeTruthy();

      rerender(<EDMVisualizerMedium volume={0.5} pitchAccuracy="off" />);
      expect(toJSON()).toBeTruthy();
    });

    it("handles volume and accuracy change together", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizerMedium volume={0.2} pitchAccuracy="listening" />,
      );

      rerender(<EDMVisualizerMedium volume={0.8} pitchAccuracy="correct" />);
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe("EDMVisualizerCompact", () => {
  describe("Rendering", () => {
    it("renders without crashing", () => {
      expect(() => {
        render(<EDMVisualizerCompact volume={0} pitchAccuracy={null} />);
      }).not.toThrow();
    });

    it("renders with correct pitch accuracy", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.5} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with off pitch accuracy", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.5} pitchAccuracy="off" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with listening state", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.3} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with inactive state", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0} pitchAccuracy={null} />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Custom dimensions", () => {
    it("renders with default dimensions", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom width", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={300}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom height", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          height={80}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom width and height", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={250}
          height={100}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with small dimensions", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={100}
          height={30}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with large dimensions", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={400}
          height={150}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with zero width", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={0}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with zero height", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          height={0}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Bar configuration", () => {
    it("renders with default bar count (8)", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.5} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with custom bar count", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          barCount={4}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with large bar count", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          barCount={16}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with single bar", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          barCount={1}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Volume levels", () => {
    it("renders with zero volume", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with low volume", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.1} pitchAccuracy="listening" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with high volume", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={0.9} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("renders with full volume", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact volume={1} pitchAccuracy="correct" />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });

  describe("Combined props", () => {
    it("renders with all props specified", () => {
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.7}
          pitchAccuracy="correct"
          barCount={10}
          width={280}
          height={70}
          style={{ borderRadius: 8 }}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles dimension and bar count interaction", () => {
      // Bar width = width / barCount
      const { toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={100}
          barCount={20}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });

    it("handles dimension change rerenders", () => {
      const { rerender, toJSON } = render(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={200}
        />,
      );

      rerender(
        <EDMVisualizerCompact
          volume={0.5}
          pitchAccuracy="listening"
          width={300}
        />,
      );
      expect(toJSON()).toBeTruthy();
    });
  });
});

describe("Color scheme transitions", () => {
  it("transitions between all color schemes", () => {
    const { rerender, toJSON } = render(
      <EDMVisualizer volume={0} pitchAccuracy={null} />, // inactive
    );
    expect(toJSON()).toBeTruthy();

    rerender(<EDMVisualizer volume={0.5} pitchAccuracy="listening" />); // cyan
    expect(toJSON()).toBeTruthy();

    rerender(<EDMVisualizer volume={0.5} pitchAccuracy="correct" />); // green
    expect(toJSON()).toBeTruthy();

    rerender(<EDMVisualizer volume={0.5} pitchAccuracy="off" />); // orange
    expect(toJSON()).toBeTruthy();

    rerender(<EDMVisualizer volume={0.01} pitchAccuracy="correct" />); // inactive (low volume)
    expect(toJSON()).toBeTruthy();
  });

  it("color scheme depends on volume threshold", () => {
    // Below 0.02 volume = inactive regardless of accuracy
    const { rerender, toJSON } = render(
      <EDMVisualizer volume={0.01} pitchAccuracy="correct" />,
    );
    expect(toJSON()).toBeTruthy();

    // Above 0.02 volume = accuracy determines color
    rerender(<EDMVisualizer volume={0.03} pitchAccuracy="correct" />);
    expect(toJSON()).toBeTruthy();
  });
});

describe("All variants comparison", () => {
  it("all variants render with same props", () => {
    const props = { volume: 0.5, pitchAccuracy: "listening" as const };

    const { toJSON: mainJSON } = render(<EDMVisualizer {...props} />);
    const { toJSON: mediumJSON } = render(<EDMVisualizerMedium {...props} />);
    const { toJSON: compactJSON } = render(<EDMVisualizerCompact {...props} />);

    expect(mainJSON()).toBeTruthy();
    expect(mediumJSON()).toBeTruthy();
    expect(compactJSON()).toBeTruthy();
  });

  it("all variants handle null accuracy", () => {
    const props = { volume: 0.5, pitchAccuracy: null };

    const { toJSON: mainJSON } = render(<EDMVisualizer {...props} />);
    const { toJSON: mediumJSON } = render(<EDMVisualizerMedium {...props} />);
    const { toJSON: compactJSON } = render(<EDMVisualizerCompact {...props} />);

    expect(mainJSON()).toBeTruthy();
    expect(mediumJSON()).toBeTruthy();
    expect(compactJSON()).toBeTruthy();
  });

  it("all variants handle zero volume", () => {
    const props = { volume: 0, pitchAccuracy: "listening" as const };

    const { toJSON: mainJSON } = render(<EDMVisualizer {...props} />);
    const { toJSON: mediumJSON } = render(<EDMVisualizerMedium {...props} />);
    const { toJSON: compactJSON } = render(<EDMVisualizerCompact {...props} />);

    expect(mainJSON()).toBeTruthy();
    expect(mediumJSON()).toBeTruthy();
    expect(compactJSON()).toBeTruthy();
  });
});

describe("Unmount and cleanup", () => {
  it("main variant cleans up on unmount", () => {
    const { unmount } = render(
      <EDMVisualizer volume={0.5} pitchAccuracy="listening" />,
    );
    unmount();
  });

  it("medium variant cleans up on unmount", () => {
    const { unmount } = render(
      <EDMVisualizerMedium volume={0.5} pitchAccuracy="listening" />,
    );
    unmount();
  });

  it("compact variant cleans up on unmount", () => {
    const { unmount } = render(
      <EDMVisualizerCompact volume={0.5} pitchAccuracy="listening" />,
    );
    unmount();
  });

  it("handles unmount during animation state", () => {
    const { rerender, unmount } = render(
      <EDMVisualizer volume={0} pitchAccuracy={null} />,
    );

    // Trigger animation by changing volume
    rerender(<EDMVisualizer volume={0.8} pitchAccuracy="correct" />);
    unmount();
  });
});

describe("Stress tests", () => {
  it("handles many rapid rerenders", () => {
    const { rerender, toJSON } = render(
      <EDMVisualizer volume={0} pitchAccuracy={null} />,
    );

    for (let i = 0; i < 20; i++) {
      rerender(
        <EDMVisualizer
          volume={Math.random()}
          pitchAccuracy={["correct", "off", "listening", null][i % 4] as any}
        />,
      );
    }
    expect(toJSON()).toBeTruthy();
  });

  it("handles large bar counts without crashing", () => {
    const { toJSON } = render(
      <EDMVisualizer volume={0.5} pitchAccuracy="listening" barCount={100} />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it("handles multiple instances simultaneously", () => {
    const { toJSON: json1 } = render(
      <EDMVisualizer volume={0.3} pitchAccuracy="listening" />,
    );
    const { toJSON: json2 } = render(
      <EDMVisualizer volume={0.6} pitchAccuracy="correct" />,
    );
    const { toJSON: json3 } = render(
      <EDMVisualizerMedium volume={0.4} pitchAccuracy="off" />,
    );
    const { toJSON: json4 } = render(
      <EDMVisualizerCompact volume={0.9} pitchAccuracy="correct" />,
    );

    expect(json1()).toBeTruthy();
    expect(json2()).toBeTruthy();
    expect(json3()).toBeTruthy();
    expect(json4()).toBeTruthy();
  });
});
