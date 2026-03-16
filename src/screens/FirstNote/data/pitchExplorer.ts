/**
 * Pitch explorer notes for bass clef (extended range with ledger lines)
 * Used in Stage 4 for exploring notes on the staff
 */
export const PITCH_EXPLORER_NOTES = [
  { name: "C2", position: 114.5, ledgerLines: 2 }, // 2 ledgers below (note on 2nd)
  { name: "D2", position: 105.5, ledgerLines: 2 }, // Space between 2 ledgers
  { name: "E2", position: 96.5, ledgerLines: 1 }, // 1 ledger below (note on it)
  { name: "F2", position: 87.5, ledgerLines: 0 }, // Space below staff (no line needed)
  { name: "G2", position: 78.5, ledgerLines: 0 }, // Bottom line
  { name: "A2", position: 69.5, ledgerLines: 0 }, // First space
  { name: "B2", position: 60.5, ledgerLines: 0 }, // Second line
  { name: "C3", position: 51.5, ledgerLines: 0 }, // Second space
  { name: "D3", position: 42.5, ledgerLines: 0 }, // Middle line
  { name: "E3", position: 33.5, ledgerLines: 0 }, // Third space
  { name: "F3", position: 24.5, ledgerLines: 0 }, // Fourth line
  { name: "G3", position: 15.5, ledgerLines: 0 }, // Fourth space
  { name: "A3", position: 6.5, ledgerLines: 0 }, // Top line
  { name: "B3", position: -2.5, ledgerLines: 0 }, // Space above top
  { name: "C4", position: -11.5, ledgerLines: -1 }, // Middle C - 1 ledger above
  { name: "D4", position: -20.5, ledgerLines: -1 }, // Space above middle C ledger
  { name: "E4", position: -29.5, ledgerLines: -2 }, // 2 ledgers above (note on 2nd)
];

/**
 * Default index for pitch explorer (D3 = middle line)
 */
export const DEFAULT_PITCH_EXPLORER_INDEX = 8;
