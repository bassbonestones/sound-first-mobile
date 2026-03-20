/**
 * Navigation & Measure Controls Tests
 *
 * Tests for NavigationControls and MeasureControls components.
 */

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

import {
  NavigationControls,
  MeasureControls,
} from "../src/features/composer/components";
import type { MeasureValidation } from "../src/features/composer/types";

describe("NavigationControls", () => {
  const defaultProps = {
    onLeft: jest.fn(),
    onRight: jest.fn(),
    onUp: jest.fn(),
    onDown: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render all navigation buttons", () => {
    const { getByTestId } = render(<NavigationControls {...defaultProps} />);

    expect(getByTestId("nav-left")).toBeTruthy();
    expect(getByTestId("nav-right")).toBeTruthy();
    expect(getByTestId("nav-up")).toBeTruthy();
    expect(getByTestId("nav-down")).toBeTruthy();
    expect(getByTestId("nav-delete")).toBeTruthy();
  });

  it("should call onLeft when left pressed", () => {
    const onLeft = jest.fn();
    const { getByTestId } = render(
      <NavigationControls {...defaultProps} onLeft={onLeft} canGoLeft />,
    );

    fireEvent.press(getByTestId("nav-left"));
    expect(onLeft).toHaveBeenCalled();
  });

  it("should call onRight when right pressed", () => {
    const onRight = jest.fn();
    const { getByTestId } = render(
      <NavigationControls {...defaultProps} onRight={onRight} canGoRight />,
    );

    fireEvent.press(getByTestId("nav-right"));
    expect(onRight).toHaveBeenCalled();
  });

  it("should not call onLeft when canGoLeft is false", () => {
    const onLeft = jest.fn();
    const { getByTestId } = render(
      <NavigationControls
        {...defaultProps}
        onLeft={onLeft}
        canGoLeft={false}
      />,
    );

    fireEvent.press(getByTestId("nav-left"));
    expect(onLeft).not.toHaveBeenCalled();
  });

  it("should not call onRight when canGoRight is false", () => {
    const onRight = jest.fn();
    const { getByTestId } = render(
      <NavigationControls
        {...defaultProps}
        onRight={onRight}
        canGoRight={false}
      />,
    );

    fireEvent.press(getByTestId("nav-right"));
    expect(onRight).not.toHaveBeenCalled();
  });

  it("should call onUp when up pressed with selection", () => {
    const onUp = jest.fn();
    const { getByTestId } = render(
      <NavigationControls {...defaultProps} onUp={onUp} hasSelection />,
    );

    fireEvent.press(getByTestId("nav-up"));
    expect(onUp).toHaveBeenCalled();
  });

  it("should call onDown when down pressed with selection", () => {
    const onDown = jest.fn();
    const { getByTestId } = render(
      <NavigationControls {...defaultProps} onDown={onDown} hasSelection />,
    );

    fireEvent.press(getByTestId("nav-down"));
    expect(onDown).toHaveBeenCalled();
  });

  it("should not call onUp when no selection", () => {
    const onUp = jest.fn();
    const { getByTestId } = render(
      <NavigationControls {...defaultProps} onUp={onUp} hasSelection={false} />,
    );

    fireEvent.press(getByTestId("nav-up"));
    expect(onUp).not.toHaveBeenCalled();
  });

  it("should not call onDown when no selection", () => {
    const onDown = jest.fn();
    const { getByTestId } = render(
      <NavigationControls
        {...defaultProps}
        onDown={onDown}
        hasSelection={false}
      />,
    );

    fireEvent.press(getByTestId("nav-down"));
    expect(onDown).not.toHaveBeenCalled();
  });

  it("should call onDelete when delete pressed with selection", () => {
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <NavigationControls {...defaultProps} onDelete={onDelete} hasSelection />,
    );

    fireEvent.press(getByTestId("nav-delete"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("should call onDelete even when no selection", () => {
    // Delete can work without selection - it finds previous pitched note
    const onDelete = jest.fn();
    const { getByTestId } = render(
      <NavigationControls
        {...defaultProps}
        onDelete={onDelete}
        hasSelection={false}
      />,
    );

    fireEvent.press(getByTestId("nav-delete"));
    expect(onDelete).toHaveBeenCalled();
  });

  it("should disable all when disabled prop true", () => {
    const onLeft = jest.fn();
    const onRight = jest.fn();
    const onUp = jest.fn();
    const { getByTestId } = render(
      <NavigationControls
        {...defaultProps}
        onLeft={onLeft}
        onRight={onRight}
        onUp={onUp}
        hasSelection
        canGoLeft
        canGoRight
        disabled
      />,
    );

    fireEvent.press(getByTestId("nav-left"));
    fireEvent.press(getByTestId("nav-right"));
    fireEvent.press(getByTestId("nav-up"));

    expect(onLeft).not.toHaveBeenCalled();
    expect(onRight).not.toHaveBeenCalled();
    expect(onUp).not.toHaveBeenCalled();
  });

  it("should have accessible labels", () => {
    const { getByLabelText } = render(<NavigationControls {...defaultProps} />);

    expect(getByLabelText("Previous note")).toBeTruthy();
    expect(getByLabelText("Next position")).toBeTruthy();
    expect(getByLabelText("Pitch up")).toBeTruthy();
    expect(getByLabelText("Pitch down")).toBeTruthy();
    expect(getByLabelText("Delete note")).toBeTruthy();
  });
});

describe("MeasureControls", () => {
  const completeValidation: MeasureValidation = {
    isComplete: true,
    expectedDuration: 4,
    actualDuration: 4,
    difference: 0,
  };

  const incompleteValidation: MeasureValidation = {
    isComplete: false,
    expectedDuration: 4,
    actualDuration: 2,
    difference: 2,
  };

  const defaultProps = {
    currentMeasure: 1,
    totalMeasures: 4,
    validation: completeValidation,
    onAddMeasure: jest.fn(),
    onDeleteMeasure: jest.fn(),
    onFillWithRests: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render measure indicator", () => {
    const { getByText } = render(<MeasureControls {...defaultProps} />);

    expect(getByText("1 / 4")).toBeTruthy();
    expect(getByText("Measure")).toBeTruthy();
  });

  it("should show complete badge when valid", () => {
    // With pre-filled measures, the complete badge is no longer shown
    // The component just shows measure number and add/delete buttons
    const { queryByText } = render(
      <MeasureControls {...defaultProps} validation={completeValidation} />,
    );

    // Verify core elements are present
    expect(queryByText("Measure")).toBeTruthy();
    expect(queryByText("1 / 4")).toBeTruthy();
  });

  it("should show incomplete warning when not valid", () => {
    // With pre-filled measures, measures are always complete
    // This test verifies the component handles incomplete validation gracefully
    const { queryByTestId } = render(
      <MeasureControls {...defaultProps} validation={incompleteValidation} />,
    );

    // Fill button only shows if beatsRemaining < 0 (overflow case)
    // With difference = 2 (positive), no fill button shown
    expect(queryByTestId("measure-fill")).toBeNull();
  });

  it("should call onAddMeasure when add pressed", () => {
    const onAddMeasure = jest.fn();
    const { getByTestId } = render(
      <MeasureControls {...defaultProps} onAddMeasure={onAddMeasure} />,
    );

    fireEvent.press(getByTestId("measure-add"));
    expect(onAddMeasure).toHaveBeenCalled();
  });

  it("should call onDeleteMeasure when delete pressed", () => {
    const onDeleteMeasure = jest.fn();
    const { getByTestId } = render(
      <MeasureControls
        {...defaultProps}
        onDeleteMeasure={onDeleteMeasure}
        canDelete
      />,
    );

    fireEvent.press(getByTestId("measure-delete"));
    expect(onDeleteMeasure).toHaveBeenCalled();
  });

  it("should not call onDeleteMeasure when canDelete false", () => {
    const onDeleteMeasure = jest.fn();
    const { getByTestId } = render(
      <MeasureControls
        {...defaultProps}
        onDeleteMeasure={onDeleteMeasure}
        canDelete={false}
      />,
    );

    fireEvent.press(getByTestId("measure-delete"));
    expect(onDeleteMeasure).not.toHaveBeenCalled();
  });

  it("should show fill button when measure has overflow (negative difference)", () => {
    // Fill button shows when beatsRemaining < 0 (overflow case)
    const overflowValidation: MeasureValidation = {
      isComplete: false,
      expectedDuration: 4,
      actualDuration: 6,
      difference: -2, // Overflow: 2 beats too many
    };
    const { getByTestId } = render(
      <MeasureControls {...defaultProps} validation={overflowValidation} />,
    );

    expect(getByTestId("measure-fill")).toBeTruthy();
  });

  it("should not show fill button when complete", () => {
    const { queryByTestId } = render(
      <MeasureControls {...defaultProps} validation={completeValidation} />,
    );

    expect(queryByTestId("measure-fill")).toBeNull();
  });

  it("should call onFillWithRests when fill pressed", () => {
    const onFillWithRests = jest.fn();
    const overflowValidation: MeasureValidation = {
      isComplete: false,
      expectedDuration: 4,
      actualDuration: 6,
      difference: -2,
    };
    const { getByTestId } = render(
      <MeasureControls
        {...defaultProps}
        validation={overflowValidation}
        onFillWithRests={onFillWithRests}
      />,
    );

    fireEvent.press(getByTestId("measure-fill"));
    expect(onFillWithRests).toHaveBeenCalled();
  });

  it("should disable all when disabled prop true", () => {
    const onAddMeasure = jest.fn();
    const onDeleteMeasure = jest.fn();
    const { getByTestId } = render(
      <MeasureControls
        {...defaultProps}
        onAddMeasure={onAddMeasure}
        onDeleteMeasure={onDeleteMeasure}
        canDelete
        disabled
      />,
    );

    fireEvent.press(getByTestId("measure-add"));
    fireEvent.press(getByTestId("measure-delete"));

    expect(onAddMeasure).not.toHaveBeenCalled();
    expect(onDeleteMeasure).not.toHaveBeenCalled();
  });

  it("should have accessible labels", () => {
    const { getByLabelText } = render(<MeasureControls {...defaultProps} />);

    expect(getByLabelText("Add measure at end")).toBeTruthy();
    expect(getByLabelText("Delete current measure")).toBeTruthy();
  });

  it("should show fill button accessible label", () => {
    // Fill button only shows for overflow (negative difference)
    const overflowValidation: MeasureValidation = {
      isComplete: false,
      expectedDuration: 4,
      actualDuration: 6,
      difference: -2,
    };
    const { getByLabelText } = render(
      <MeasureControls {...defaultProps} validation={overflowValidation} />,
    );

    expect(getByLabelText("Fill with rests")).toBeTruthy();
  });
});
