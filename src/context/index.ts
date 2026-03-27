/**
 * Global Context Providers
 *
 * This module exports context providers that manage app-wide state.
 * These contexts are wrapped at the top level of the app.
 *
 * @module context
 *
 * Available Contexts:
 * - **UserContext**: User identity and instrument selection
 *
 * Note: Feature-specific contexts are co-located with their features:
 * - SessionContext → src/screens/Session/context/
 * - FirstNoteContext → src/screens/FirstNote/context/
 * - ChordProgressionContext → src/features/tune-composer/contexts/
 *
 * @example
 * // In App.tsx
 * import { UserProvider } from './context';
 *
 * function App() {
 *   return (
 *     <UserProvider>
 *       <Navigation />
 *     </UserProvider>
 *   );
 * }
 *
 * // In a component
 * import { useUser } from './context';
 *
 * function InstrumentSelector() {
 *   const { instruments, selectedInstrument, selectInstrument } = useUser();
 *   // ...
 * }
 */

export { UserProvider, useUser } from "./UserContext";
export type {
  UserContextValue,
  InstrumentCreateData,
  InstrumentUpdateData,
} from "./UserContext";
