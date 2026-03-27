/**
 * WebView-related type definitions
 *
 * Shared types for WebView refs and messaging used across
 * score rendering components (ScoreViewport, ComposerScoreViewport, etc.)
 */

/**
 * Minimal interface for WebView ref used in score components.
 * Captures the methods we actually use from react-native-webview.
 */
export interface WebViewRef {
  /** Inject and execute JavaScript in the WebView context */
  injectJavaScript: (script: string) => void;
  /** Post a message to the WebView (used for some communication patterns) */
  postMessage?: (message: string) => void;
}
