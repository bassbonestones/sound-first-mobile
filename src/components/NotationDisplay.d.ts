/**
 * Props for NotationDisplay component
 */
export interface NotationDisplayProps {
  /** MusicXML content to render */
  musicxml?: string;
  /** Width of the notation display */
  width?: number;
  /** Height of the notation display */
  height?: number;
  /** Whether to show the title */
  showTitle?: boolean;
  /** Whether to show time signature */
  showTimeSignature?: boolean;
  /** Fixed measure width in pixels */
  fixedMeasureWidthPixels?: number | null;
  /** Zoom level for the notation */
  zoom?: number;
  /** Which note to highlight (0-based), null = no cursor */
  currentNoteIndex?: number | null;
}

/**
 * Props for NotationPlaceholder component
 */
export interface NotationPlaceholderProps {
  /** Message to display in placeholder */
  message?: string;
}

/**
 * NotationDisplay Component
 *
 * Renders MusicXML notation using OpenSheetMusicDisplay (OSMD).
 * Uses WebView on mobile, direct DOM on web.
 */
declare function NotationDisplay(
  props: NotationDisplayProps,
): React.ReactElement;

/**
 * Placeholder shown when notation is loading or unavailable
 */
export declare function NotationPlaceholder(
  props: NotationPlaceholderProps,
): React.ReactElement;

export default NotationDisplay;
