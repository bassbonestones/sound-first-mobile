/**
 * Session Screen
 *
 * Wraps SessionScreenContent with SessionProvider context.
 * State management is handled by SessionContext and useTools hook.
 *
 * Directory structure:
 * - context/SessionContext.js - Session state and handlers
 * - hooks/useTools.js - Metronome/drone tools state
 * - data/stepTypes.js - Constants
 * - SessionScreenContent.js - UI component using context
 */
import React from "react";
import { SessionProvider } from "./context/SessionContext";
import SessionScreenContent from "./SessionScreenContent";

export default function SessionScreen({ navigation, route }) {
  return (
    <SessionProvider routeParams={route?.params} navigation={navigation}>
      <SessionScreenContent />
    </SessionProvider>
  );
}

// Export context hook for external use
export { useSession } from "./context/SessionContext";
export { default as useTools } from "./hooks/useTools";
export * from "./data/stepTypes";
