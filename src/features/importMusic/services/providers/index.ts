/**
 * OMR Providers - Barrel Export
 */

export {
  createMockOmrProvider,
  mockOmrProvider,
  type MockOmrProviderConfig,
} from "./mockOmrProvider";

export {
  createBackendOmrProvider,
  backendOmrProvider,
  type BackendOmrProviderConfig,
  type AuthContext,
} from "./backendOmrProvider";

// ============================================================================
// Provider Registration
// ============================================================================

import { registerOmrProvider } from "../../types/omrProviderTypes";
import { mockOmrProvider } from "./mockOmrProvider";
import { backendOmrProvider } from "./backendOmrProvider";

/**
 * Register all available OMR providers
 *
 * Call this during app initialization to make providers available
 * via getActiveOmrProvider() and getOmrProvider()
 */
export function registerAllOmrProviders(): void {
  registerOmrProvider(mockOmrProvider);
  registerOmrProvider(backendOmrProvider);
}

// Auto-register providers on module load
registerAllOmrProviders();
