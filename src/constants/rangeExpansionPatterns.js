/**
 * Range Expansion Patterns
 * 
 * Each pattern defines a sequence of intervals relative to the anchor note.
 * - direction: 'up' expands range_high, 'down' expands range_low
 * - intervals: semitone offsets from anchor (0 = anchor, positive = up, negative = down)
 * - requiredRangeSemitones: minimum range user must have to use this pattern
 * - holdFinal: if true, the final note should be held (for "land" type exercises)
 * - targetInterval: the interval to the NEW note being added (1 = half step)
 */

// Expanding UP patterns (target = range_high + 1 semitone)
export const PATTERNS_UP = [
  {
    id: 'chromatic_neighbor_up',
    name: 'Touch and Return',
    direction: 'up',
    solfege: 'do → di → do',
    intervals: [0, 1, 0],  // anchor → half step up → anchor
    targetInterval: 1,     // the "di" is the new note
    requiredRangeSemitones: 0,
    holdFinal: false,
    description: 'Touch the new note briefly, then return home',
  },
  {
    id: 'whole_step_up',
    name: 'Step Up and Back',
    direction: 'up',
    solfege: 'do → re → do',
    intervals: [0, 2, 0],  // anchor → whole step up → anchor
    targetInterval: 2,
    requiredRangeSemitones: 1,  // need at least m2 range
    holdFinal: false,
    description: 'Step up a whole step to the new note',
  },
  {
    id: 'scalar_up',
    name: 'Scale Approach',
    direction: 'up',
    solfege: 'do → re → mi → re → do',
    intervals: [0, 2, 4, 2, 0],  // scalar approach
    targetInterval: 4,
    requiredRangeSemitones: 3,  // need at least m3 range
    holdFinal: false,
    description: 'Scale up to the new note, then back down',
  },
  {
    id: 'land_up',
    name: 'Land on New Note',
    direction: 'up',
    solfege: 'do → re (hold)',
    intervals: [0, 2],
    targetInterval: 2,
    requiredRangeSemitones: 1,
    holdFinal: true,
    description: 'Land on the new note and hold it',
  },
  {
    id: 'chromatic_repeated_up',
    name: 'Chromatic Reinforcement',
    direction: 'up',
    solfege: 'do → di → do → di → do',
    intervals: [0, 1, 0, 1, 0],
    targetInterval: 1,
    requiredRangeSemitones: 0,
    holdFinal: false,
    description: 'Repeated chromatic motion to reinforce the new note',
  },
  {
    id: 'octave_anchor_up',
    name: 'Octave Context',
    direction: 'up',
    solfege: 'low do → high do',
    intervals: [0, 12],  // octave leap
    targetInterval: 12,
    requiredRangeSemitones: 11,  // need M7 range
    holdFinal: true,
    description: 'Place the new note in octave context',
  },
];

// Expanding DOWN patterns (target = range_low - 1 semitone)
export const PATTERNS_DOWN = [
  {
    id: 'chromatic_neighbor_down',
    name: 'Touch and Return',
    direction: 'down',
    solfege: 'do → ti → do',
    intervals: [0, -1, 0],  // anchor → half step down → anchor
    targetInterval: -1,
    requiredRangeSemitones: 0,
    holdFinal: false,
    description: 'Touch the new note briefly, then return home',
  },
  {
    id: 'land_down',
    name: 'Land on New Note',
    direction: 'down',
    solfege: 'do → ti (hold)',
    intervals: [0, -1],
    targetInterval: -1,
    requiredRangeSemitones: 0,
    holdFinal: true,
    description: 'Land on the new note and hold it',
  },
  {
    id: 'scalar_down',
    name: 'Scale Approach',
    direction: 'down',
    solfege: 'do → ti → la → ti → do',
    intervals: [0, -1, -3, -1, 0],  // scalar approach down
    targetInterval: -3,
    requiredRangeSemitones: 2,  // need M2 range
    holdFinal: false,
    description: 'Scale down to the new note, then back up',
  },
  {
    id: 'descend_to_new',
    name: 'Descend from Above',
    direction: 'down',
    solfege: 'mi → re → do',
    intervals: [4, 2, 0],  // start high, descend to new anchor
    targetInterval: 0,  // the final note is the new bottom
    requiredRangeSemitones: 3,  // need m3 range
    holdFinal: true,
    description: 'Descend stepwise to the new note',
    startsFromTop: true,  // special flag: intervals relative to range_high, not range_low
  },
  {
    id: 'chromatic_repeated_down',
    name: 'Chromatic Reinforcement',
    direction: 'down',
    solfege: 'do → ti → do → ti → do',
    intervals: [0, -1, 0, -1, 0],
    targetInterval: -1,
    requiredRangeSemitones: 0,
    holdFinal: false,
    description: 'Repeated chromatic motion to reinforce the new note',
  },
  {
    id: 'octave_anchor_down',
    name: 'Octave Context',
    direction: 'down',
    solfege: 'high do → low do',
    intervals: [0, -12],  // octave drop
    targetInterval: -12,
    requiredRangeSemitones: 11,  // need M7 range
    holdFinal: true,
    description: 'Place the new note in octave context',
  },
];

export const ALL_PATTERNS = [...PATTERNS_UP, ...PATTERNS_DOWN];

/**
 * Get patterns available for user's current range
 * @param {string} direction - 'up' or 'down'
 * @param {number} currentRangeSemitones - user's current range in semitones (range_high - range_low in MIDI)
 * @returns {Array} - patterns the user can use
 */
export function getAvailablePatterns(direction, currentRangeSemitones) {
  const patterns = direction === 'up' ? PATTERNS_UP : PATTERNS_DOWN;
  return patterns.filter(p => p.requiredRangeSemitones <= currentRangeSemitones);
}

/**
 * Get the simplest available pattern (lowest required range)
 */
export function getSimplestPattern(direction, currentRangeSemitones) {
  const available = getAvailablePatterns(direction, currentRangeSemitones);
  if (available.length === 0) return null;
  return available.reduce((a, b) => 
    a.requiredRangeSemitones <= b.requiredRangeSemitones ? a : b
  );
}

/**
 * Get a random pattern from available ones
 */
export function getRandomPattern(direction, currentRangeSemitones) {
  const available = getAvailablePatterns(direction, currentRangeSemitones);
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
