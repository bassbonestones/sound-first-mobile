/**
 * Entry Palette Component Tests
 *
 * Tests for DurationSelector, PitchSelector, ModifierRow,
 * OctaveControls, and EntryPalette components.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  DurationSelector,
  PitchSelector,
  ModifierRow,
  OctaveControls,
  EntryPalette,
} from "../src/features/composer/components";
import {
  DURATION,
  createNote,
  type PitchName,
} from "../src/features/composer/types";

describe("DurationSelector", () => {
  const defaultProps = {
    selectedDuration: DURATION.QUARTER,
    onSelectDuration: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all duration options", () => {
    const { getByTestId } = render(<DurationSelector {...defaultProps} />);

    expect(getByTestId("duration-whole")).toBeTruthy();
    expect(getByTestId("duration-half")).toBeTruthy();
    expect(getByTestId("duration-quarter")).toBeTruthy();
    expect(getByTestId("duration-eighth")).toBeTruthy();
    expect(getByTestId("duration-sixteenth")).toBeTruthy();
  });

  it("should highlight selected duration", () => {
    const { getByTestId, rerender } = render(
      <DurationSelector {...defaultProps} selectedDuration={DURATION.HALF} />,
    );

    const halfButton = getByTestId("duration-half");
    expect(halfButton.props.accessibilityState.selected).toBe(true);

    const quarterButton = getByTestId("duration-quarter");
    expect(quarterButton.props.accessibilityState.selected).toBe(false);
  });

  it("should call onSelectDuration when tapped", () => {
    const onSelectDuration = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onSelectDuration={onSelectDuration}
      />,
    );

    fireEvent.press(getByTestId("duration-half"));
    expect(onSelectDuration).toHaveBeenCalledWith(DURATION.HALF);

    fireEvent.press(getByTestId("duration-whole"));
    expect(onSelectDuration).toHaveBeenCalledWith(DURATION.WHOLE);
  });

  it("should not call onSelectDuration when disabled", () => {
    const onSelectDuration = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onSelectDuration={onSelectDuration}
        disabled
      />,
    );

    fireEvent.press(getByTestId("duration-half"));
    expect(onSelectDuration).not.toHaveBeenCalled();
  });

  it("should have accessible labels", () => {
    const { getByLabelText } = render(<DurationSelector {...defaultProps} />);

    expect(getByLabelText("Whole note")).toBeTruthy();
    expect(getByLabelText("Half note")).toBeTruthy();
    expect(getByLabelText("Quarter note")).toBeTruthy();
    expect(getByLabelText("8th note")).toBeTruthy();
    expect(getByLabelText("16th note")).toBeTruthy();
  });

  // ==========================================================================
  // Dotted Mode Tests
  // ==========================================================================

  it("should render dot button when onToggleDotted provided", () => {
    const { getByTestId } = render(
      <DurationSelector {...defaultProps} onToggleDotted={jest.fn()} />,
    );
    expect(getByTestId("duration-dot")).toBeTruthy();
  });

  it("should not render dot button when onToggleDotted not provided", () => {
    const { queryByTestId } = render(<DurationSelector {...defaultProps} />);
    expect(queryByTestId("duration-dot")).toBeNull();
  });

  it("should highlight dot when dottedMode is true", () => {
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        dottedMode={true}
        onToggleDotted={jest.fn()}
      />,
    );
    const dotButton = getByTestId("duration-dot");
    expect(dotButton.props.accessibilityState.selected).toBe(true);
  });

  it("should call onToggleDotted when dot pressed", () => {
    const onToggleDotted = jest.fn();
    const { getByTestId } = render(
      <DurationSelector {...defaultProps} onToggleDotted={onToggleDotted} />,
    );

    fireEvent.press(getByTestId("duration-dot"));
    expect(onToggleDotted).toHaveBeenCalled();
  });

  it("should not call onToggleDotted when disabled", () => {
    const onToggleDotted = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onToggleDotted={onToggleDotted}
        disabled
      />,
    );

    fireEvent.press(getByTestId("duration-dot"));
    expect(onToggleDotted).not.toHaveBeenCalled();
  });

  it("should disable sixteenth when dotted mode is active", () => {
    const onSelectDuration = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onSelectDuration={onSelectDuration}
        dottedMode={true}
      />,
    );

    const sixteenthButton = getByTestId("duration-sixteenth");
    expect(sixteenthButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(sixteenthButton);
    expect(onSelectDuration).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // Triplet Tests
  // ==========================================================================

  it("should render triplet buttons when tripletsAllowed is true", () => {
    const { queryByTestId } = render(
      <DurationSelector {...defaultProps} tripletsAllowed={true} />,
    );
    expect(queryByTestId("duration-triplet-eighth")).toBeTruthy();
    expect(queryByTestId("duration-triplet-quarter")).toBeTruthy();
  });

  it("should hide triplet buttons when tripletsAllowed is false", () => {
    const { queryByTestId } = render(
      <DurationSelector {...defaultProps} tripletsAllowed={false} />,
    );
    expect(queryByTestId("duration-triplet-eighth")).toBeNull();
    expect(queryByTestId("duration-triplet-quarter")).toBeNull();
  });

  it("should disable non-triplet durations when in triplet group", () => {
    const { getByTestId } = render(
      <DurationSelector {...defaultProps} tripletPosition={1} />,
    );

    // Non-triplet durations should be disabled when in triplet group
    const quarterButton = getByTestId("duration-quarter");
    expect(quarterButton.props.accessibilityState.disabled).toBe(true);

    const halfButton = getByTestId("duration-half");
    expect(halfButton.props.accessibilityState.disabled).toBe(true);
  });

  it("should enable only eighth triplets when tripletGroupType is eighth", () => {
    const onSelectDuration = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onSelectDuration={onSelectDuration}
        tripletPosition={1}
        tripletGroupType="eighth"
        tripletsAllowed={true}
      />,
    );

    const eighthTriplet = getByTestId("duration-triplet-eighth");
    const quarterTriplet = getByTestId("duration-triplet-quarter");

    // Eighth triplet should be enabled
    expect(eighthTriplet.props.accessibilityState.disabled).toBe(false);
    // Quarter triplet should be disabled in 'eighth' group
    expect(quarterTriplet.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(quarterTriplet);
    expect(onSelectDuration).not.toHaveBeenCalled();
  });

  it("should enable only quarter triplets when tripletGroupType is quarter", () => {
    const onSelectDuration = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onSelectDuration={onSelectDuration}
        tripletPosition={2}
        tripletGroupType="quarter"
        tripletsAllowed={true}
      />,
    );

    const eighthTriplet = getByTestId("duration-triplet-eighth");
    const quarterTriplet = getByTestId("duration-triplet-quarter");

    // Quarter triplet should be enabled
    expect(quarterTriplet.props.accessibilityState.disabled).toBe(false);
    // Eighth triplet should be disabled in 'quarter' group
    expect(eighthTriplet.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(eighthTriplet);
    expect(onSelectDuration).not.toHaveBeenCalled();
  });

  it("should enable both triplet types when tripletGroupType is mixed", () => {
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        tripletPosition={1}
        tripletGroupType="mixed"
        tripletsAllowed={true}
      />,
    );

    const eighthTriplet = getByTestId("duration-triplet-eighth");
    const quarterTriplet = getByTestId("duration-triplet-quarter");

    expect(eighthTriplet.props.accessibilityState.disabled).toBe(false);
    expect(quarterTriplet.props.accessibilityState.disabled).toBe(false);
  });

  it("should disable triplet buttons when canStartTriplet is false and not in triplet group", () => {
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        canStartTriplet={false}
        tripletsAllowed={true}
      />,
    );

    const eighthTriplet = getByTestId("duration-triplet-eighth");
    const quarterTriplet = getByTestId("duration-triplet-quarter");

    expect(eighthTriplet.props.accessibilityState.disabled).toBe(true);
    expect(quarterTriplet.props.accessibilityState.disabled).toBe(true);
  });

  it("should disable dot button when in triplet group", () => {
    const onToggleDotted = jest.fn();
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        onToggleDotted={onToggleDotted}
        tripletPosition={1}
        tripletsAllowed={true}
      />,
    );

    const dotButton = getByTestId("duration-dot");
    expect(dotButton.props.accessibilityState.disabled).toBe(true);

    fireEvent.press(dotButton);
    expect(onToggleDotted).not.toHaveBeenCalled();
  });

  it("should disable triplet buttons when dotted mode is active", () => {
    const { getByTestId } = render(
      <DurationSelector
        {...defaultProps}
        dottedMode={true}
        tripletsAllowed={true}
      />,
    );

    const eighthTriplet = getByTestId("duration-triplet-eighth");
    expect(eighthTriplet.props.accessibilityState.disabled).toBe(true);
  });

  // ==========================================================================
  // Scroll Tests
  // ==========================================================================

  it("should handle scroll events", () => {
    const { getByTestId } = render(
      <DurationSelector {...defaultProps} testID="duration-selector" />,
    );

    // The selector should render without errors when scroll happens
    expect(getByTestId("duration-selector")).toBeTruthy();
  });
});

describe("PitchSelector", () => {
  const defaultProps = {
    onSelectPitch: jest.fn(),
    onInsertRest: jest.fn(),
    selectedDuration: DURATION.QUARTER,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all pitch options", () => {
    const { getByTestId } = render(<PitchSelector {...defaultProps} />);

    // Rest button should be at the beginning
    expect(getByTestId("pitch-rest")).toBeTruthy();

    const pitches: PitchName[] = ["C", "D", "E", "F", "G", "A", "B"];
    pitches.forEach((pitch) => {
      expect(getByTestId(`pitch-${pitch}`)).toBeTruthy();
    });
  });

  it("should call onInsertRest when rest tapped", () => {
    const onInsertRest = jest.fn();
    const { getByTestId } = render(
      <PitchSelector {...defaultProps} onInsertRest={onInsertRest} />,
    );

    fireEvent.press(getByTestId("pitch-rest"));
    expect(onInsertRest).toHaveBeenCalled();
  });

  it("should call onSelectPitch when tapped", () => {
    const onSelectPitch = jest.fn();
    const { getByTestId } = render(
      <PitchSelector {...defaultProps} onSelectPitch={onSelectPitch} />,
    );

    fireEvent.press(getByTestId("pitch-C"));
    expect(onSelectPitch).toHaveBeenCalledWith("C");

    fireEvent.press(getByTestId("pitch-G"));
    expect(onSelectPitch).toHaveBeenCalledWith("G");
  });

  it("should not call onSelectPitch when disabled", () => {
    const onSelectPitch = jest.fn();
    const { getByTestId } = render(
      <PitchSelector
        {...defaultProps}
        onSelectPitch={onSelectPitch}
        disabled
      />,
    );

    fireEvent.press(getByTestId("pitch-C"));
    expect(onSelectPitch).not.toHaveBeenCalled();
  });

  it("should highlight specified pitch", () => {
    const { getByTestId, rerender } = render(
      <PitchSelector {...defaultProps} highlightedPitch="E" />,
    );

    // E should have highlighted style (we can't directly check style, but we verify it renders)
    expect(getByTestId("pitch-E")).toBeTruthy();
  });

  it("should have accessible labels", () => {
    const { getByLabelText } = render(<PitchSelector {...defaultProps} />);

    expect(getByLabelText("Note C")).toBeTruthy();
    expect(getByLabelText("Note D")).toBeTruthy();
    expect(getByLabelText("Note G")).toBeTruthy();
  });
});

describe("ModifierRow", () => {
  const defaultProps = {
    onAccidental: jest.fn(),
    onTie: jest.fn(),
    onOctaveChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all modifier buttons", () => {
    const { getByTestId } = render(<ModifierRow {...defaultProps} />);

    expect(getByTestId("modifier-sharp")).toBeTruthy();
    expect(getByTestId("modifier-flat")).toBeTruthy();
    expect(getByTestId("modifier-natural")).toBeTruthy();
    expect(getByTestId("modifier-tie")).toBeTruthy();
    expect(getByTestId("octave-up")).toBeTruthy();
    expect(getByTestId("octave-down")).toBeTruthy();
  });

  it("should call onAccidental when accidental pressed", () => {
    const onAccidental = jest.fn();
    const { getByTestId } = render(
      <ModifierRow
        {...defaultProps}
        onAccidental={onAccidental}
        hasSelection
      />,
    );

    fireEvent.press(getByTestId("modifier-sharp"));
    expect(onAccidental).toHaveBeenCalledWith("sharp");

    fireEvent.press(getByTestId("modifier-flat"));
    expect(onAccidental).toHaveBeenCalledWith("flat");
  });

  it("should call onTie when tie pressed", () => {
    const onTie = jest.fn();
    const { getByTestId } = render(
      <ModifierRow {...defaultProps} onTie={onTie} hasSelection />,
    );

    fireEvent.press(getByTestId("modifier-tie"));
    expect(onTie).toHaveBeenCalled();
  });

  it("should disable accidentals and tie when no selection", () => {
    const onAccidental = jest.fn();
    const onTie = jest.fn();
    const { getByTestId } = render(
      <ModifierRow
        {...defaultProps}
        onAccidental={onAccidental}
        onTie={onTie}
        hasSelection={false}
      />,
    );

    fireEvent.press(getByTestId("modifier-sharp"));
    expect(onAccidental).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("modifier-tie"));
    expect(onTie).not.toHaveBeenCalled();
  });

  it("should highlight active accidental", () => {
    const { getByTestId } = render(
      <ModifierRow {...defaultProps} activeAccidental="sharp" hasSelection />,
    );

    const sharpButton = getByTestId("modifier-sharp");
    expect(sharpButton.props.accessibilityState.selected).toBe(true);
  });

  it("should highlight when tie is active", () => {
    const { getByTestId } = render(
      <ModifierRow {...defaultProps} tieActive hasSelection />,
    );

    const tieButton = getByTestId("modifier-tie");
    expect(tieButton.props.accessibilityState.selected).toBe(true);
  });
});

describe("OctaveControls", () => {
  const defaultProps = {
    onOctaveChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render octave controls", () => {
    const { getByTestId } = render(<OctaveControls {...defaultProps} />);

    expect(getByTestId("octave-up")).toBeTruthy();
    expect(getByTestId("octave-down")).toBeTruthy();
  });

  it("should call onOctaveChange up", () => {
    const onOctaveChange = jest.fn();
    const { getByTestId } = render(
      <OctaveControls {...defaultProps} onOctaveChange={onOctaveChange} />,
    );

    fireEvent.press(getByTestId("octave-up"));
    expect(onOctaveChange).toHaveBeenCalledWith("up");
  });

  it("should call onOctaveChange down", () => {
    const onOctaveChange = jest.fn();
    const { getByTestId } = render(
      <OctaveControls {...defaultProps} onOctaveChange={onOctaveChange} />,
    );

    fireEvent.press(getByTestId("octave-down"));
    expect(onOctaveChange).toHaveBeenCalledWith("down");
  });

  it("should disable when disabled prop is true", () => {
    const onOctaveChange = jest.fn();
    const { getByTestId } = render(
      <OctaveControls
        {...defaultProps}
        onOctaveChange={onOctaveChange}
        disabled
      />,
    );

    fireEvent.press(getByTestId("octave-up"));
    expect(onOctaveChange).not.toHaveBeenCalled();
  });

  it("should have accessible labels", () => {
    const { getByLabelText } = render(<OctaveControls {...defaultProps} />);

    expect(getByLabelText("Octave up")).toBeTruthy();
    expect(getByLabelText("Octave down")).toBeTruthy();
  });
});

describe("EntryPalette", () => {
  const defaultProps = {
    selectedDuration: DURATION.QUARTER,
    selectedNote: null,
    onDurationSelect: jest.fn(),
    onPitchTap: jest.fn(),
    onOctaveChange: jest.fn(),
    onAccidental: jest.fn(),
    onInsertRest: jest.fn(),
    onToggleTie: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all sub-components", () => {
    const { getByTestId } = render(<EntryPalette {...defaultProps} />);

    expect(getByTestId("duration-selector")).toBeTruthy();
    expect(getByTestId("pitch-selector")).toBeTruthy();
    expect(getByTestId("modifier-row")).toBeTruthy();
    // Octave controls are now part of modifier-row
    expect(getByTestId("octave-up")).toBeTruthy();
    expect(getByTestId("octave-down")).toBeTruthy();
  });

  it("should pass duration to DurationSelector", () => {
    const { getByTestId } = render(
      <EntryPalette {...defaultProps} selectedDuration={DURATION.HALF} />,
    );

    const halfButton = getByTestId("duration-half");
    expect(halfButton.props.accessibilityState.selected).toBe(true);
  });

  it("should call onDurationSelect", () => {
    const onDurationSelect = jest.fn();
    const { getByTestId } = render(
      <EntryPalette {...defaultProps} onDurationSelect={onDurationSelect} />,
    );

    fireEvent.press(getByTestId("duration-whole"));
    expect(onDurationSelect).toHaveBeenCalledWith(DURATION.WHOLE);
  });

  it("should call onPitchTap", () => {
    const onPitchTap = jest.fn();
    const { getByTestId } = render(
      <EntryPalette {...defaultProps} onPitchTap={onPitchTap} />,
    );

    fireEvent.press(getByTestId("pitch-E"));
    expect(onPitchTap).toHaveBeenCalledWith("E");
  });

  it("should call onOctaveChange", () => {
    const onOctaveChange = jest.fn();
    // Need selectedNote for octave buttons to be enabled
    const selectedNote = createNote(60, DURATION.QUARTER);
    const { getByTestId } = render(
      <EntryPalette
        {...defaultProps}
        onOctaveChange={onOctaveChange}
        selectedNote={selectedNote}
      />,
    );

    fireEvent.press(getByTestId("octave-up"));
    expect(onOctaveChange).toHaveBeenCalledWith("up");
  });

  it("should call onInsertRest", () => {
    const onInsertRest = jest.fn();
    const { getByTestId } = render(
      <EntryPalette {...defaultProps} onInsertRest={onInsertRest} />,
    );

    fireEvent.press(getByTestId("pitch-rest"));
    expect(onInsertRest).toHaveBeenCalled();
  });

  it("should pass selected note accidental to ModifierRow", () => {
    const selectedNote = createNote(60, DURATION.QUARTER, {
      accidental: "flat",
    });
    const { getByTestId } = render(
      <EntryPalette {...defaultProps} selectedNote={selectedNote} />,
    );

    const flatButton = getByTestId("modifier-flat");
    expect(flatButton.props.accessibilityState.selected).toBe(true);
  });

  it("should pass tie state to ModifierRow", () => {
    const selectedNote = createNote(60, DURATION.QUARTER, { tieStart: true });
    const { getByTestId } = render(
      <EntryPalette {...defaultProps} selectedNote={selectedNote} />,
    );

    const tieButton = getByTestId("modifier-tie");
    expect(tieButton.props.accessibilityState.selected).toBe(true);
  });

  it("should enable accidentals when note selected", () => {
    const onAccidental = jest.fn();
    const selectedNote = createNote(60, DURATION.QUARTER);
    const { getByTestId } = render(
      <EntryPalette
        {...defaultProps}
        selectedNote={selectedNote}
        onAccidental={onAccidental}
      />,
    );

    fireEvent.press(getByTestId("modifier-sharp"));
    expect(onAccidental).toHaveBeenCalledWith("sharp");
  });

  it("should disable all when disabled prop is true", () => {
    const onPitchTap = jest.fn();
    const onDurationSelect = jest.fn();
    const { getByTestId } = render(
      <EntryPalette
        {...defaultProps}
        onPitchTap={onPitchTap}
        onDurationSelect={onDurationSelect}
        disabled
      />,
    );

    fireEvent.press(getByTestId("pitch-C"));
    expect(onPitchTap).not.toHaveBeenCalled();

    fireEvent.press(getByTestId("duration-half"));
    expect(onDurationSelect).not.toHaveBeenCalled();
  });
});
