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
import ErrorBoundary from "../../components/ErrorBoundary";
import { SessionProvider } from "./context/SessionContext";
import SessionScreenContent from "./SessionScreenContent";

interface NavigationProp {
  navigate: (screen: string, params?: object) => void;
  replace?: (screen: string, params?: object) => void;
  goBack?: () => void;
}

interface RouteProp {
  params?: object;
}

interface SessionScreenProps {
  navigation: NavigationProp;
  route?: RouteProp;
}

export default function SessionScreen({
  navigation,
  route,
}: SessionScreenProps) {
  return (
    <ErrorBoundary>
      <SessionProvider routeParams={route?.params} navigation={navigation}>
        <SessionScreenContent />
      </SessionProvider>
    </ErrorBoundary>
  );
}

// Export context hook for external use
export { useSession } from "./context/SessionContext";
export { default as useTools } from "./hooks/useTools";
export * from "./data/stepTypes";
