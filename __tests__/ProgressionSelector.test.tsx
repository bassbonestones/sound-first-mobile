/**
 * ProgressionSelector Tests
 *
 * Tests for the chord progression selector component.
 * Includes selection, creation, duplication, and edit mode testing.
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { ProgressionSelector } from "../src/features/tune-composer/components";
import type { ChordProgression } from "../src/features/tune-composer/types";

describe("ProgressionSelector", () => {
  // Sample progressions for testing
  const sampleProgressions: ChordProgression[] = [
    {
      id: "prog-1",
      name: "Default",
      isDefault: true,
      isSystemDefined: true,
      chords: [],
    },
    {
      id: "prog-2",
      name: "Reharmonization",
      isDefault: false,
      isSystemDefined: false,
      chords: [],
    },
    {
      id: "prog-3",
      name: "Auto Inferred",
      isDefault: false,
      isAutoInferred: true,
      isSystemDefined: true,
      chords: [],
    },
  ];

  const defaultProps = {
    progressions: sampleProgressions,
    activeProgressionId: "prog-1",
    onSelectProgression: jest.fn(),
    onCreateProgression: jest.fn(),
    onDuplicateProgression: jest.fn(),
    isEditMode: false,
    onToggleEditMode: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // Basic Rendering
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      const { getByTestId } = render(
        <ProgressionSelector {...defaultProps} testID="progression-selector" />,
      );
      expect(getByTestId("progression-selector")).toBeTruthy();
    });

    it("should render selector button", () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);
      expect(getByTestId("progression-selector-button")).toBeTruthy();
    });

    it("should show active progression name", () => {
      const { getByText } = render(<ProgressionSelector {...defaultProps} />);
      expect(getByText("Default")).toBeTruthy();
    });

    it("should show 'No Progression' when none active", () => {
      const { getByText } = render(
        <ProgressionSelector
          {...defaultProps}
          activeProgressionId={undefined}
        />,
      );
      expect(getByText("No Progression")).toBeTruthy();
    });

    it("should render edit mode toggle", () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);
      expect(getByTestId("edit-mode-toggle")).toBeTruthy();
    });

    it("should have accessible selector button", () => {
      const { getByLabelText } = render(
        <ProgressionSelector {...defaultProps} />,
      );
      expect(
        getByLabelText("Progression: Default. Tap to change."),
      ).toBeTruthy();
    });

    it("should disable selector when disabled prop is true", () => {
      const { getByTestId } = render(
        <ProgressionSelector {...defaultProps} disabled />,
      );
      const button = getByTestId("progression-selector-button");
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  // ===========================================================================
  // Edit Mode Toggle
  // ===========================================================================

  describe("Edit Mode Toggle", () => {
    it("should call onToggleEditMode when pressed", () => {
      const onToggleEditMode = jest.fn();
      // Active progression is user-editable
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          activeProgressionId="prog-2"
          onToggleEditMode={onToggleEditMode}
        />,
      );

      fireEvent.press(getByTestId("edit-mode-toggle"));
      expect(onToggleEditMode).toHaveBeenCalledTimes(1);
    });

    it("should disable edit toggle for system progressions", () => {
      const onToggleEditMode = jest.fn();
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          activeProgressionId="prog-1" // System defined
          onToggleEditMode={onToggleEditMode}
        />,
      );

      fireEvent.press(getByTestId("edit-mode-toggle"));
      expect(onToggleEditMode).not.toHaveBeenCalled();
    });

    it("should show active state when edit mode is on", () => {
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          activeProgressionId="prog-2"
          isEditMode={true}
        />,
      );

      const toggle = getByTestId("edit-mode-toggle");
      expect(toggle.props.accessibilityState?.selected).toBe(true);
    });

    it("should have accessible labels", () => {
      const { getByLabelText, rerender } = render(
        <ProgressionSelector
          {...defaultProps}
          activeProgressionId="prog-2"
          isEditMode={false}
        />,
      );
      expect(getByLabelText("Enter edit mode")).toBeTruthy();

      rerender(
        <ProgressionSelector
          {...defaultProps}
          activeProgressionId="prog-2"
          isEditMode={true}
        />,
      );
      expect(getByLabelText("Exit edit mode")).toBeTruthy();
    });
  });

  // ===========================================================================
  // Modal Opening/Closing
  // ===========================================================================

  describe("Modal Opening/Closing", () => {
    it("should open modal when selector button pressed", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));

      await waitFor(() => {
        expect(getByText("Select Progression")).toBeTruthy();
      });
    });

    it("should close modal when close button pressed", async () => {
      const { getByTestId, queryByText, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByText("Select Progression")).toBeTruthy();
      });

      fireEvent.press(getByTestId("modal-close"));
      await waitFor(() => {
        expect(queryByText("Select Progression")).toBeNull();
      });
    });

    it("should render progression list in modal", async () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);

      fireEvent.press(getByTestId("progression-selector-button"));

      await waitFor(() => {
        expect(getByTestId("progression-list")).toBeTruthy();
        expect(getByTestId("progression-item-prog-1")).toBeTruthy();
        expect(getByTestId("progression-item-prog-2")).toBeTruthy();
        expect(getByTestId("progression-item-prog-3")).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // Progression Selection
  // ===========================================================================

  describe("Progression Selection", () => {
    it("should call onSelectProgression when item pressed", async () => {
      const onSelectProgression = jest.fn();
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onSelectProgression={onSelectProgression}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-select-prog-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-select-prog-2"));
      expect(onSelectProgression).toHaveBeenCalledWith("prog-2");
    });

    it("should close modal after selection", async () => {
      const { getByTestId, queryByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-select-prog-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-select-prog-2"));
      await waitFor(() => {
        expect(queryByText("Select Progression")).toBeNull();
      });
    });

    it("should show checkmark on active progression", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        const item = getByTestId("progression-select-prog-1");
        expect(item.props.accessibilityState?.selected).toBe(true);
      });
    });

    it("should show badges for default, inferred, and system", async () => {
      const { getByTestId, getAllByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        // "Default" appears both as prog name and badge - use getAllByText
        expect(getAllByText("Default").length).toBeGreaterThan(0);
        expect(getAllByText("Auto").length).toBeGreaterThan(0);
        expect(getAllByText("System").length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // Create Progression
  // ===========================================================================

  describe("Create Progression", () => {
    it("should show create button in modal", async () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("create-progression-button")).toBeTruthy();
      });
    });

    it("should switch to create mode when create button pressed", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("create-progression-button")).toBeTruthy();
      });

      fireEvent.press(getByTestId("create-progression-button"));
      await waitFor(() => {
        expect(getByText("New Progression")).toBeTruthy();
        expect(getByTestId("progression-name-input")).toBeTruthy();
      });
    });

    it("should call onCreateProgression with name", async () => {
      const onCreateProgression = jest.fn();
      const { getByTestId, getByText } = render(
        <ProgressionSelector
          {...defaultProps}
          onCreateProgression={onCreateProgression}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("create-progression-button")).toBeTruthy();
      });

      fireEvent.press(getByTestId("create-progression-button"));
      await waitFor(() => {
        expect(getByTestId("progression-name-input")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("progression-name-input"), "My Custom");
      fireEvent.press(getByTestId("confirm-create-button"));

      expect(onCreateProgression).toHaveBeenCalledWith("My Custom");
    });

    it("should disable confirm when name is empty", async () => {
      const onCreateProgression = jest.fn();
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onCreateProgression={onCreateProgression}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("create-progression-button")).toBeTruthy();
      });

      fireEvent.press(getByTestId("create-progression-button"));
      await waitFor(() => {
        expect(getByTestId("confirm-create-button")).toBeTruthy();
      });

      fireEvent.press(getByTestId("confirm-create-button"));
      expect(onCreateProgression).not.toHaveBeenCalled();
    });

    it("should show preset name suggestions", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() =>
        expect(getByTestId("create-progression-button")).toBeTruthy(),
      );

      fireEvent.press(getByTestId("create-progression-button"));
      await waitFor(() => {
        expect(getByText("Suggestions:")).toBeTruthy();
        expect(getByTestId("preset-Reharmonization")).toBeTruthy();
      });
    });

    it("should use preset when suggestion tapped", async () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() =>
        expect(getByTestId("create-progression-button")).toBeTruthy(),
      );

      fireEvent.press(getByTestId("create-progression-button"));
      await waitFor(() => {
        expect(getByTestId("preset-Modal")).toBeTruthy();
      });

      fireEvent.press(getByTestId("preset-Modal"));
      const input = getByTestId("progression-name-input");
      expect(input.props.value).toBe("Modal");
    });

    it("should go back to select mode when back pressed", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() =>
        expect(getByTestId("create-progression-button")).toBeTruthy(),
      );

      fireEvent.press(getByTestId("create-progression-button"));
      await waitFor(() => expect(getByTestId("modal-back")).toBeTruthy());

      fireEvent.press(getByTestId("modal-back"));
      await waitFor(() => {
        expect(getByText("Select Progression")).toBeTruthy();
      });
    });
  });

  // ===========================================================================
  // Duplicate Progression
  // ===========================================================================

  describe("Duplicate Progression", () => {
    it("should show duplicate button on list items", async () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-duplicate-prog-1")).toBeTruthy();
        expect(getByTestId("progression-duplicate-prog-2")).toBeTruthy();
      });
    });

    it("should switch to duplicate mode when button pressed", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-duplicate-prog-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-duplicate-prog-1"));
      await waitFor(() => {
        expect(getByText("Duplicate Progression")).toBeTruthy();
        expect(getByTestId("duplicate-name-input")).toBeTruthy();
      });
    });

    it("should pre-fill name with (Copy) suffix", async () => {
      const { getByTestId } = render(<ProgressionSelector {...defaultProps} />);

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-duplicate-prog-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-duplicate-prog-1"));
      await waitFor(() => {
        const input = getByTestId("duplicate-name-input");
        expect(input.props.value).toBe("Default (Copy)");
      });
    });

    it("should call onDuplicateProgression with source and name", async () => {
      const onDuplicateProgression = jest.fn();
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onDuplicateProgression={onDuplicateProgression}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-duplicate-prog-1")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-duplicate-prog-1"));
      await waitFor(() => {
        expect(getByTestId("confirm-duplicate-button")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("duplicate-name-input"), "My Copy");
      fireEvent.press(getByTestId("confirm-duplicate-button"));

      expect(onDuplicateProgression).toHaveBeenCalledWith("prog-1", "My Copy");
    });
  });

  // ===========================================================================
  // Delete Progression
  // ===========================================================================

  describe("Delete Progression", () => {
    it("should show delete button only for non-system progressions", async () => {
      const { getByTestId, queryByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onDeleteProgression={jest.fn()}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        // System progression should not have delete button
        expect(queryByTestId("progression-delete-prog-1")).toBeNull();
        // User progression should have delete button
        expect(getByTestId("progression-delete-prog-2")).toBeTruthy();
        // Auto-inferred system progression should not have delete
        expect(queryByTestId("progression-delete-prog-3")).toBeNull();
      });
    });

    it("should call onDeleteProgression when delete pressed", async () => {
      const onDeleteProgression = jest.fn();
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onDeleteProgression={onDeleteProgression}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-delete-prog-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-delete-prog-2"));
      expect(onDeleteProgression).toHaveBeenCalledWith("prog-2");
    });

    it("should not show delete buttons when onDeleteProgression not provided", async () => {
      const { getByTestId, queryByTestId } = render(
        <ProgressionSelector {...defaultProps} />, // No onDeleteProgression
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(queryByTestId("progression-delete-prog-2")).toBeNull();
      });
    });
  });

  // ===========================================================================
  // Rename Progression
  // ===========================================================================

  describe("Rename Progression", () => {
    it("should show rename button only for non-system progressions", async () => {
      const { getByTestId, queryByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onRenameProgression={jest.fn()}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        // System progression should not have rename button
        expect(queryByTestId("progression-rename-prog-1")).toBeNull();
        // User progression should have rename button
        expect(getByTestId("progression-rename-prog-2")).toBeTruthy();
      });
    });

    it("should switch to rename mode when button pressed", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector
          {...defaultProps}
          onRenameProgression={jest.fn()}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-rename-prog-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-rename-prog-2"));
      await waitFor(() => {
        expect(getByText("Rename Progression")).toBeTruthy();
        expect(getByTestId("rename-input")).toBeTruthy();
      });
    });

    it("should pre-fill with current name", async () => {
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onRenameProgression={jest.fn()}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-rename-prog-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-rename-prog-2"));
      await waitFor(() => {
        const input = getByTestId("rename-input");
        expect(input.props.value).toBe("Reharmonization");
      });
    });

    it("should call onRenameProgression with new name", async () => {
      const onRenameProgression = jest.fn();
      const { getByTestId } = render(
        <ProgressionSelector
          {...defaultProps}
          onRenameProgression={onRenameProgression}
        />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByTestId("progression-rename-prog-2")).toBeTruthy();
      });

      fireEvent.press(getByTestId("progression-rename-prog-2"));
      await waitFor(() => {
        expect(getByTestId("rename-input")).toBeTruthy();
      });

      fireEvent.changeText(getByTestId("rename-input"), "New Name");
      fireEvent.press(getByTestId("confirm-rename-button"));

      expect(onRenameProgression).toHaveBeenCalledWith("prog-2", "New Name");
    });
  });

  // ===========================================================================
  // Empty State
  // ===========================================================================

  describe("Empty State", () => {
    it("should handle empty progressions array", async () => {
      const { getByTestId, getByText } = render(
        <ProgressionSelector {...defaultProps} progressions={[]} />,
      );

      fireEvent.press(getByTestId("progression-selector-button"));
      await waitFor(() => {
        expect(getByText("Select Progression")).toBeTruthy();
        expect(getByTestId("create-progression-button")).toBeTruthy();
      });
    });
  });
});
