/**
 * Score Preview Types
 *
 * Shared types for Score Preview components.
 * Extracted to avoid circular dependencies between ScorePreview and scorePreviewHtml.
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a measure that should be highlighted in the score preview.
 * Used to indicate uncertain regions from OMR processing.
 */
export interface HighlightedMeasure {
  /** 1-based measure number */
  readonly measureNumber: number;
  /** 0-based part/staff index */
  readonly partIndex?: number;
  /** Highlight color (default: yellow) */
  readonly color?: string;
  /** Confidence score 0-1 (optional, for display purposes) */
  readonly confidence?: number;
}

/**
 * Messages sent from WebView to React Native
 */
export type WebViewMessage =
  | { type: "ready"; payload: null }
  | { type: "rendered"; payload: null }
  | { type: "error"; payload: string }
  | {
      type: "measureTap";
      payload: { measureNumber: number; partIndex: number };
    }
  | { type: "zoomChange"; payload: number }
  | { type: "cursorShown"; payload: null }
  | { type: "cursorHidden"; payload: null }
  | { type: "cursorReset"; payload: null }
  | {
      type: "cursorMoved";
      payload: { measureNumber: number; endReached?: boolean };
    }
  | { type: "cursorEnd"; payload: null };
