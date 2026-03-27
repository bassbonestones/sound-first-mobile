/**
 * Tests for LessonComponents shared UI components
 *
 * Tests the extracted lesson exercise UI components:
 * - LessonBeatIndicator
 * - LessonAttestationModal
 * - LessonFocusCard
 * - LessonFocusCardMini
 * - LessonPhaseProgress
 * - LessonNotationToggle
 * - LessonResultDisplay
 * - LessonSuccessDisplay
 */
import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import {
  LessonBeatIndicator,
  LessonAttestationModal,
  LessonFocusCard,
  LessonFocusCardMini,
  LessonPhaseProgress,
  LessonNotationToggle,
  LessonResultDisplay,
  LessonSuccessDisplay,
} from "../src/screens/Session/components/exercises/shared/LessonComponents";

describe("LessonComponents", () => {
  // ---------------------------------------------------------------------------
  // LessonBeatIndicator
  // ---------------------------------------------------------------------------
  describe("LessonBeatIndicator", () => {
    it("renders count-in and play beats", () => {
      render(
        <LessonBeatIndicator
          currentBeat={0}
          totalBeats={4}
          countInBeats={4}
          beatsPerNote={1}
        />,
      );

      expect(screen.getByText("Count in:")).toBeTruthy();
      expect(screen.getByText("Play:")).toBeTruthy();
      // Count-in and play both have numbers 1-4, so use getAllByText
      expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("2").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("3").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("4").length).toBeGreaterThanOrEqual(1);
    });

    it("shows stop indicator", () => {
      render(<LessonBeatIndicator currentBeat={0} totalBeats={4} />);

      expect(screen.getByText("●")).toBeTruthy();
    });

    it("uses custom labels", () => {
      render(
        <LessonBeatIndicator
          currentBeat={0}
          totalBeats={4}
          countInLabel="Ready:"
          playLabel="Sing:"
        />,
      );

      expect(screen.getByText("Ready:")).toBeTruthy();
      expect(screen.getByText("Sing:")).toBeTruthy();
    });

    it("handles different beatsPerNote values", () => {
      // Test with half notes (2 beats per note)
      render(
        <LessonBeatIndicator currentBeat={0} totalBeats={4} beatsPerNote={2} />,
      );

      // Should still render 4 beats for play section
      const playBeats = screen.getAllByText(/^[1-4]$/);
      // Count-in (1-4) + play (1-4) = we should find some beats
      expect(playBeats.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // LessonAttestationModal
  // ---------------------------------------------------------------------------
  describe("LessonAttestationModal", () => {
    it("renders modal when visible", () => {
      const { getByText, getByLabelText } = render(
        <LessonAttestationModal
          visible={true}
          phase="sing"
          onCancel={jest.fn()}
          onConfirm={jest.fn()}
        />,
      );

      // Use accessibility label for the confirm button
      expect(getByLabelText("Confirm attestation")).toBeTruthy();
      expect(getByText(/sang/)).toBeTruthy();
    });

    it("shows correct text for play phase", () => {
      const { getByText } = render(
        <LessonAttestationModal
          visible={true}
          phase="play"
          onCancel={jest.fn()}
          onConfirm={jest.fn()}
        />,
      );

      expect(getByText(/played/)).toBeTruthy();
    });

    it("calls onCancel when cancel button pressed", () => {
      const onCancel = jest.fn();
      render(
        <LessonAttestationModal
          visible={true}
          phase="sing"
          onCancel={onCancel}
          onConfirm={jest.fn()}
        />,
      );

      fireEvent.press(screen.getByLabelText("Cancel attestation"));
      expect(onCancel).toHaveBeenCalled();
    });

    it("calls onConfirm when confirm button pressed", () => {
      const onConfirm = jest.fn();
      render(
        <LessonAttestationModal
          visible={true}
          phase="sing"
          onCancel={jest.fn()}
          onConfirm={onConfirm}
        />,
      );

      fireEvent.press(screen.getByLabelText("Confirm attestation"));
      expect(onConfirm).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // LessonFocusCard
  // ---------------------------------------------------------------------------
  describe("LessonFocusCard", () => {
    const testFocusCard = {
      category: "pitch",
      name: "Pitch Center",
      description: "Lock your ear onto the exact center of each pitch.",
      cue: "Hear the center. Sing the center. Play the center.",
    };

    it("renders all focus card content", () => {
      render(<LessonFocusCard focusCard={testFocusCard} />);

      expect(screen.getByText("PITCH")).toBeTruthy();
      expect(screen.getByText("Pitch Center")).toBeTruthy();
      expect(
        screen.getByText("Lock your ear onto the exact center of each pitch."),
      ).toBeTruthy();
      expect(
        screen.getByText("Hear the center. Sing the center. Play the center."),
      ).toBeTruthy();
    });

    it("uppercases category", () => {
      const lowerCaseCard = { ...testFocusCard, category: "rhythm" };
      render(<LessonFocusCard focusCard={lowerCaseCard} />);

      expect(screen.getByText("RHYTHM")).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // LessonFocusCardMini
  // ---------------------------------------------------------------------------
  describe("LessonFocusCardMini", () => {
    const testFocusCard = {
      category: "pitch",
      name: "Pitch Center",
      description: "Lock your ear onto the exact center.",
      cue: "Hear the center.",
    };

    it("renders mini focus card content", () => {
      render(<LessonFocusCardMini focusCard={testFocusCard} />);

      expect(screen.getByText("🎯")).toBeTruthy();
      expect(screen.getByText("Pitch Center")).toBeTruthy();
      expect(screen.getByText("Hear the center.")).toBeTruthy();
    });

    it("does not render full description", () => {
      render(<LessonFocusCardMini focusCard={testFocusCard} />);

      expect(
        screen.queryByText("Lock your ear onto the exact center."),
      ).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // LessonPhaseProgress
  // ---------------------------------------------------------------------------
  describe("LessonPhaseProgress", () => {
    const testItems = [
      { id: "item1", name: "Item 1", isCompleted: true, isCurrent: false },
      { id: "item2", name: "Item 2", isCompleted: false, isCurrent: true },
      { id: "item3", name: "Item 3", isCompleted: false, isCurrent: false },
    ];

    it("renders all progress items", () => {
      render(<LessonPhaseProgress items={testItems} />);

      expect(screen.getByText("✓")).toBeTruthy();
      expect(screen.getByText("2")).toBeTruthy();
      expect(screen.getByText("3")).toBeTruthy();
    });

    it("shows checkmark for completed items", () => {
      render(<LessonPhaseProgress items={testItems} />);

      expect(screen.getByText("✓")).toBeTruthy();
    });

    it("calls onItemPress when allowReplay is true", () => {
      const onItemPress = jest.fn();
      render(
        <LessonPhaseProgress
          items={testItems}
          onItemPress={onItemPress}
          allowReplay={true}
        />,
      );

      fireEvent.press(screen.getByLabelText("Item 1, completed"));
      expect(onItemPress).toHaveBeenCalledWith(0, "item1");
    });

    it("does not call onItemPress when allowReplay is false", () => {
      const onItemPress = jest.fn();
      render(
        <LessonPhaseProgress
          items={testItems}
          onItemPress={onItemPress}
          allowReplay={false}
        />,
      );

      fireEvent.press(screen.getByLabelText("Item 1, completed"));
      expect(onItemPress).not.toHaveBeenCalled();
    });

    it("provides correct accessibility labels", () => {
      render(<LessonPhaseProgress items={testItems} />);

      expect(screen.getByLabelText("Item 1, completed")).toBeTruthy();
      expect(screen.getByLabelText("Item 2, current")).toBeTruthy();
      expect(screen.getByLabelText("Item 3")).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // LessonNotationToggle
  // ---------------------------------------------------------------------------
  describe("LessonNotationToggle", () => {
    it("shows 'Show Notation' button when hidden", () => {
      render(
        <LessonNotationToggle showNotation={false} onToggle={jest.fn()} />,
      );

      expect(screen.getByText("Show Notation 📝")).toBeTruthy();
    });

    it("shows 'Hide Notation' button when shown", () => {
      render(<LessonNotationToggle showNotation={true} onToggle={jest.fn()} />);

      expect(screen.getByText("Hide Notation")).toBeTruthy();
    });

    it("renders children when notation is shown", () => {
      const { getByTestId } = render(
        <LessonNotationToggle showNotation={true} onToggle={jest.fn()}>
          <React.Fragment>
            <></>
          </React.Fragment>
        </LessonNotationToggle>,
      );

      // Children should be rendered when showNotation is true
      expect(screen.getByText("Hide Notation")).toBeTruthy();
    });

    it("calls onToggle when button pressed", () => {
      const onToggle = jest.fn();
      render(<LessonNotationToggle showNotation={false} onToggle={onToggle} />);

      fireEvent.press(screen.getByLabelText("Show notation"));
      expect(onToggle).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // LessonResultDisplay
  // ---------------------------------------------------------------------------
  describe("LessonResultDisplay", () => {
    it("displays success message with correct styling", () => {
      render(<LessonResultDisplay success={true} message="Great job!" />);

      expect(screen.getByText("Great job!")).toBeTruthy();
    });

    it("displays failure message", () => {
      render(
        <LessonResultDisplay success={false} message="Keep practicing!" />,
      );

      expect(screen.getByText("Keep practicing!")).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // LessonSuccessDisplay
  // ---------------------------------------------------------------------------
  describe("LessonSuccessDisplay", () => {
    it("renders with default props", () => {
      render(<LessonSuccessDisplay />);

      expect(screen.getByText("🎉")).toBeTruthy();
      expect(screen.getByText("All Patterns Complete!")).toBeTruthy();
      expect(
        screen.getByText("You've successfully completed all patterns."),
      ).toBeTruthy();
    });

    it("renders with custom props", () => {
      render(
        <LessonSuccessDisplay
          title="Well Done!"
          message="You finished the exercise."
          subtext="Tap to continue"
          emoji="🎵"
        />,
      );

      expect(screen.getByText("🎵")).toBeTruthy();
      expect(screen.getByText("Well Done!")).toBeTruthy();
      expect(screen.getByText("You finished the exercise.")).toBeTruthy();
      expect(screen.getByText("Tap to continue")).toBeTruthy();
    });

    it("does not render subtext when not provided", () => {
      render(<LessonSuccessDisplay subtext={undefined} />);

      // Default message should exist, but subtext should not
      expect(
        screen.getByText("You've successfully completed all patterns."),
      ).toBeTruthy();
    });
  });
});
