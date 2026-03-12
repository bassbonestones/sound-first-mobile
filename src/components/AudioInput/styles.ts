/**
 * AudioInput component styles
 * Extracted for modularity
 */
import { StyleSheet, Platform, ViewStyle, TextStyle } from "react-native";

interface Styles {
  container: ViewStyle;
  errorText: TextStyle;
  infoText: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  debugContainer: ViewStyle;
  debugText: TextStyle;
  mobileContainer: ViewStyle;
  webView: ViewStyle;
  hiddenWebViewContainer: ViewStyle;
  hiddenWebView: ViewStyle;
  debugOverlay: ViewStyle;
}

export const styles = StyleSheet.create<Styles>({
  container: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "#FF6B6B",
    textAlign: "center",
    marginBottom: 10,
  },
  infoText: {
    color: "#333",
    textAlign: "center",
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4A90D9",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  debugContainer: {
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    margin: 10,
  },
  debugText: {
    fontFamily: Platform.OS === "web" ? "monospace" : "Courier",
    fontSize: 12,
    color: "#333",
    marginVertical: 2,
  },
  mobileContainer: {
    flex: 1,
    minHeight: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  hiddenWebViewContainer: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
  hiddenWebView: {
    width: 1,
    height: 1,
  },
  debugOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 8,
  },
});

export default styles;
