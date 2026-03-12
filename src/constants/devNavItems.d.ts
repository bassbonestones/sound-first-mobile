/**
 * Dev navigation items type declarations
 */

/**
 * Dev navigation item structure
 */
export interface DevNavItem {
  /** Navigation screen name */
  screen: string;
  /** Display label */
  label: string;
  /** Optional icon/emoji */
  icon?: string;
}

/**
 * Available dev navigation items
 */
export declare const DEV_NAV_ITEMS: DevNavItem[];
