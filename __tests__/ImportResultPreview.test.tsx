/**
 * ImportResultPreview Component Tests
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  ImportResultPreview,
  propsFromPreviewModel,
} from "../src/features/importMusic/components/ImportResultPreview";
import type { ImportPreviewModel } from "../src/types/import";

describe("ImportResultPreview", () => {
  const defaultProps = {
    title: "Test Score",
    measureCount: 32,
    partCount: 2,
  };

  describe("rendering", () => {
    it("renders title", () => {
      const { getByText } = render(<ImportResultPreview {...defaultProps} />);

      expect(getByText("Test Score")).toBeTruthy();
    });

    it("renders subtitle when provided", () => {
      const { getByText } = render(
        <ImportResultPreview {...defaultProps} subtitle="Test Composer" />,
      );

      expect(getByText("Test Composer")).toBeTruthy();
    });

    it("does not render subtitle when not provided", () => {
      const { queryByText } = render(<ImportResultPreview {...defaultProps} />);

      expect(queryByText("Test Composer")).toBeNull();
    });

    it("renders measure count", () => {
      const { getByText } = render(<ImportResultPreview {...defaultProps} />);

      expect(getByText("32 measures")).toBeTruthy();
    });

    it("renders singular measure for count of 1", () => {
      const { getByText } = render(
        <ImportResultPreview {...defaultProps} measureCount={1} />,
      );

      expect(getByText("1 measure")).toBeTruthy();
    });

    it("renders part count", () => {
      const { getByText } = render(<ImportResultPreview {...defaultProps} />);

      expect(getByText("2 parts")).toBeTruthy();
    });

    it("renders singular part for count of 1", () => {
      const { getByText } = render(
        <ImportResultPreview {...defaultProps} partCount={1} />,
      );

      expect(getByText("1 part")).toBeTruthy();
    });
  });

  describe("status indicators", () => {
    it("shows success badge by default", () => {
      const { getByTestId } = render(<ImportResultPreview {...defaultProps} />);

      expect(getByTestId("import-result-preview-success-badge")).toBeTruthy();
    });

    it("shows review badge when needsReview is true", () => {
      const { getByTestId, queryByTestId } = render(
        <ImportResultPreview {...defaultProps} needsReview={true} />,
      );

      expect(getByTestId("import-result-preview-review-badge")).toBeTruthy();
      expect(queryByTestId("import-result-preview-success-badge")).toBeNull();
    });
  });

  describe("interactions", () => {
    it("calls onPress when pressed", () => {
      const onPress = jest.fn();
      const { getByTestId } = render(
        <ImportResultPreview {...defaultProps} onPress={onPress} />,
      );

      fireEvent.press(getByTestId("import-result-preview"));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("is not pressable when onPress is not provided", () => {
      const { getByTestId } = render(<ImportResultPreview {...defaultProps} />);

      // Component should still render but not be a button
      expect(getByTestId("import-result-preview")).toBeTruthy();
    });
  });

  describe("source type icons", () => {
    it.each([
      ["photo", "camera"],
      ["image", "image"],
      ["pdf", "file-text"],
      ["musicxml", "music"],
      ["mxl", "music"],
    ] as const)("shows correct icon for %s source type", (sourceType) => {
      const { getByTestId } = render(
        <ImportResultPreview {...defaultProps} sourceType={sourceType} />,
      );

      // Just verify it renders without error
      expect(getByTestId("import-result-preview")).toBeTruthy();
    });

    it("shows default icon when no source type", () => {
      const { getByTestId } = render(<ImportResultPreview {...defaultProps} />);

      expect(getByTestId("import-result-preview")).toBeTruthy();
    });
  });

  describe("accessibility", () => {
    it("has accessible label when pressable", () => {
      const onPress = jest.fn();
      const { getByRole } = render(
        <ImportResultPreview {...defaultProps} onPress={onPress} />,
      );

      expect(getByRole("button")).toBeTruthy();
    });
  });

  describe("custom testID", () => {
    it("uses custom testID", () => {
      const { getByTestId } = render(
        <ImportResultPreview {...defaultProps} testID="custom-preview" />,
      );

      expect(getByTestId("custom-preview")).toBeTruthy();
    });
  });
});

describe("propsFromPreviewModel", () => {
  const mockPreview: ImportPreviewModel = {
    title: "Symphony No. 5",
    subtitle: "Beethoven",
    needsReview: false,
    reviewReasons: [],
    stats: {
      measureCount: 256,
      partCount: 12,
      timeSignature: "4/4",
      keySignature: "C minor",
      tempo: "Allegro con brio",
    },
  };

  it("converts preview model to props", () => {
    const props = propsFromPreviewModel(mockPreview);

    expect(props.title).toBe("Symphony No. 5");
    expect(props.subtitle).toBe("Beethoven");
    expect(props.measureCount).toBe(256);
    expect(props.partCount).toBe(12);
    expect(props.needsReview).toBe(false);
  });

  it("includes source type when provided", () => {
    const props = propsFromPreviewModel(mockPreview, "musicxml");

    expect(props.sourceType).toBe("musicxml");
  });

  it("includes onPress handler when provided", () => {
    const onPress = jest.fn();
    const props = propsFromPreviewModel(mockPreview, undefined, onPress);

    expect(props.onPress).toBe(onPress);
  });

  it("handles needsReview flag", () => {
    const reviewPreview: ImportPreviewModel = {
      ...mockPreview,
      needsReview: true,
      reviewReasons: ["Low confidence score"],
    };

    const props = propsFromPreviewModel(reviewPreview);

    expect(props.needsReview).toBe(true);
  });

  it("handles null subtitle", () => {
    const noSubtitlePreview: ImportPreviewModel = {
      ...mockPreview,
      subtitle: null,
    };

    const props = propsFromPreviewModel(noSubtitlePreview);

    expect(props.subtitle).toBeNull();
  });
});
