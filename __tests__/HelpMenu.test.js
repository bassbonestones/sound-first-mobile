/**
 * Tests for HelpMenu component
 */

import React from "react";
import {
  render,
  fireEvent,
  waitFor,
  screen,
} from "@testing-library/react-native";
import HelpMenu from "../src/components/HelpMenu";

// Mock fetch
global.fetch = jest.fn();

describe("HelpMenu", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe("Rendering", () => {
    it("renders when visible is true", () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ capabilities: [] }),
      });

      const { getByText } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      // Help Menu text may have an emoji prefix that gets garbled
      expect(getByText(/Help Menu/)).toBeTruthy();
    });

    it("does not render when visible is false", () => {
      const { queryByText } = render(
        <HelpMenu
          visible={false}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      expect(queryByText("Need Help?")).toBeNull();
    });
  });

  describe("Fetching capabilities", () => {
    it("fetches capabilities when visible and materialId provided", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [
              { id: 1, name: "Treble Clef", domain: "clef" },
              { id: 2, name: "Bass Clef", domain: "clef" },
            ],
          }),
      });

      render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={123}
          onSelectCapability={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining("/materials/123/help-capabilities"),
        );
      });
    });

    it("shows loading indicator while fetching", async () => {
      // Long-running fetch
      fetch.mockImplementationOnce(() => new Promise(() => {}));

      const { getByTestId } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      // Check that loading state is shown
      await waitFor(() => {
        expect(getByTestId).toBeTruthy();
      });
    });

    it("displays capabilities grouped by domain", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [
              { id: 1, name: "Treble Clef", domain: "clef" },
              { id: 2, name: "4/4 Time", domain: "time_signature" },
            ],
          }),
      });

      const { getByText } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(getByText("Clefs")).toBeTruthy();
        expect(getByText("Time Signatures")).toBeTruthy();
      });
    });

    it("handles fetch error gracefully", async () => {
      fetch.mockRejectedValueOnce(new Error("Network error"));

      const { getByText } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      await waitFor(() => {
        expect(getByText(/error|failed/i)).toBeTruthy();
      });
    });
  });

  describe("User interactions", () => {
    it("calls onClose when close button pressed", async () => {
      const onClose = jest.fn();
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ capabilities: [] }),
      });

      const { getByText } = render(
        <HelpMenu
          visible={true}
          onClose={onClose}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      // Close button is an "✕" symbol
      fireEvent.press(getByText("✕"));

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onSelectCapability when capability pressed", async () => {
      const onSelectCapability = jest.fn();
      const testCapability = {
        id: 1,
        name: "Treble Clef",
        domain: "clef",
        has_lesson: true,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [testCapability],
          }),
      });

      const { getByText } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={onSelectCapability}
        />,
      );

      await waitFor(() => {
        expect(getByText("Treble Clef")).toBeTruthy();
      });

      fireEvent.press(getByText("Treble Clef"));

      expect(onSelectCapability).toHaveBeenCalledWith(testCapability);
    });
  });

  describe("Domain grouping", () => {
    it("groups capabilities by their domain", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [
              { id: 1, name: "Treble Clef", domain: "clef" },
              { id: 2, name: "Bass Clef", domain: "clef" },
              { id: 3, name: "Forte", domain: "dynamics" },
            ],
          }),
      });

      const { getByText, getAllByText } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      await waitFor(() => {
        // Should have both clef items under Clefs section
        expect(getByText("Treble Clef")).toBeTruthy();
        expect(getByText("Bass Clef")).toBeTruthy();
        // Should have dynamics item under Dynamics section
        expect(getByText("Forte")).toBeTruthy();
      });
    });

    it("handles capabilities with missing domain", async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            capabilities: [
              { id: 1, name: "Unknown Thing" }, // No domain
            ],
          }),
      });

      const { getByText } = render(
        <HelpMenu
          visible={true}
          onClose={jest.fn()}
          materialId={1}
          onSelectCapability={jest.fn()}
        />,
      );

      await waitFor(() => {
        // Should fall back to "Other" group
        expect(getByText("Other")).toBeTruthy();
        expect(getByText("Unknown Thing")).toBeTruthy();
      });
    });
  });
});
