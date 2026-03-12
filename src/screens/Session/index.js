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
import PropTypes from "prop-types";
import ErrorBoundary from "../../components/ErrorBoundary";
import { SessionProvider } from "./context/SessionContext";
import SessionScreenContent from "./SessionScreenContent";

export default function SessionScreen({ navigation, route }) {
  return (
    <ErrorBoundary>
      <SessionProvider routeParams={route?.params} navigation={navigation}>
        <SessionScreenContent />
      </SessionProvider>
    </ErrorBoundary>
  );
}

SessionScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    replace: PropTypes.func,
    goBack: PropTypes.func,
  }).isRequired,
  route: PropTypes.shape({
    params: PropTypes.object,
  }),
};

// Export context hook for external use
export { useSession } from "./context/SessionContext";
export { default as useTools } from "./hooks/useTools";
export * from "./data/stepTypes";
