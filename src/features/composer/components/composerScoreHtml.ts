/**
 * Composer Score Preview HTML Generator
 *
 * Generates HTML that loads OpenSheetMusicDisplay (OSMD) from CDN
 * and renders MusicXML with composer-specific features:
 * - Note selection highlighting
 * - Cursor position indicator
 * - Tap-to-select notes
 * - Auto-scroll to cursor
 */

// =============================================================================
// Types
// =============================================================================

export interface ComposerOsmdOptions {
  /** Initial zoom level (default: 1.0) */
  initialZoom?: number;
  /** Background color (default: white) */
  backgroundColor?: string;
  /** Render all measures in a single horizontal line (default: true for composer) */
  horizontalStaffline?: boolean;
  /** Fixed width in pixels for scrollable rendering (0 = auto-fit) */
  fixedWidth?: number;
}

// =============================================================================
// HTML Generator
// =============================================================================

/**
 * Generate HTML for the composer score viewport.
 *
 * Features:
 * - OSMD rendering with auto-beaming
 * - Click detection on notes (sends noteId to RN)
 * - Visual cursor position
 * - Selected note highlighting via color attribute
 */
export function generateComposerOsmdHtml(
  options: ComposerOsmdOptions = {},
): string {
  const {
    initialZoom = 1.0,
    backgroundColor = "#ffffff",
    horizontalStaffline = true,
    fixedWidth = 0,
  } = options;

  const containerWidthStyle =
    fixedWidth > 0 ? `min-width: ${fixedWidth}px;` : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Composer Score</title>
  <style>
    /* Load Bravura fonts from Steinberg CDN for SMuFL metronome glyphs */
    @font-face {
      font-family: 'Bravura Text';
      src: url('https://cdn.jsdelivr.net/gh/steinbergmedia/bravura@master/redist/woff/BravuraText.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'Bravura';
      src: url('https://cdn.jsdelivr.net/gh/steinbergmedia/bravura@master/redist/woff/Bravura.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: visible;
      background-color: ${backgroundColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #container {
      width: fit-content;
      min-width: 100%;
      height: 100%;
      overflow: visible;
    }
    
    #osmd-container {
      ${containerWidthStyle}
      min-width: 100%;
      padding: 16px;
      transform-origin: top left;
    }
    
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 16px;
      color: #666;
    }
    
    .error {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      padding: 20px;
      text-align: center;
      color: #d32f2f;
    }
    
    .error-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    /* Cursor indicator - vertical line at current position */
    .cursor-indicator {
      position: absolute;
      width: 2px;
      background-color: #2196F3;
      pointer-events: none;
      z-index: 100;
      transition: left 0.1s ease-out, top 0.1s ease-out;
    }

    /* Highlight selected notes */
    svg [color="#0066CC"] {
      fill: #0066CC !important;
    }

    /* Make chord symbols smaller to prevent overlap */
    svg text[font-family*="Times"],
    svg text[font-style="italic"] {
      font-size: 85% !important;
    }

    /* Make notes clickable */
    svg .vf-notehead,
    svg .vf-stavenote,
    svg [class*="note"] {
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="osmd-container">
      <div class="loading" id="loading">Loading music renderer...</div>
    </div>
  </div>
  <div id="cursor-indicator" class="cursor-indicator" style="display: none;"></div>

  <!-- Load OSMD from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js"></script>

  <script>
    // Global state
    let osmd = null;
    let currentZoom = ${initialZoom};
    let pendingMusicXml = null;
    let pendingChordPositions = null; // Chord positions waiting to be applied after render
    let hasEverReceivedPositions = false; // Track if we've ever received chord positions
    let noteElements = []; // Map of note IDs to SVG elements
    let lastSelectedNoteId = null;
    let lastSmoothScrolledMeasure = -1; // Track last smooth-scrolled measure (for playback only)

    // Send message to React Native
    function sendMessage(type, payload) {
      const message = JSON.stringify({ type, payload });
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(message);
      } else if (window.parent !== window) {
        window.parent.postMessage(message, '*');
      }
    }
    
    // Log helper
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      sendMessage('consoleLog', { level: 'log', message: args.join(' ') });
    };
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      sendMessage('consoleLog', { level: 'error', message: args.join(' ') });
    };

    // Listen for messages from parent
    window.addEventListener('message', function(event) {
      try {
        const data = event.data;
        if (data && data.type === 'execute' && data.script) {
          eval(data.script);
        }
      } catch (e) {
        console.error('Message handling error:', e);
      }
    });

    // Initialize OSMD
    function initOsmd() {
      try {
        const container = document.getElementById('osmd-container');
        const loadingEl = document.getElementById('loading');
        
        if (!container) {
          showError('Score container not found.');
          return false;
        }
        
        if (typeof opensheetmusicdisplay === 'undefined') {
          showError('Music renderer not loaded.');
          return false;
        }
        
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
          autoResize: false,
          drawTitle: false,
          drawComposer: false,
          drawPartNames: false,
          drawCredits: false,
          drawLyrics: true,
          drawingParameters: "compact",
          backend: "svg",
          autoBeam: true,
          renderSingleHorizontalStaffline: ${horizontalStaffline},
          // Enable chord symbol rendering explicitly
          drawChordSymbols: true,
        });

        // Configure chord symbol rendering
        if (osmd.EngravingRules) {
          // CRITICAL: Enable chord symbol rendering (try multiple possible property names)
          osmd.EngravingRules.RenderChordSymbols = true;
          if (osmd.EngravingRules.DrawChordSymbols !== undefined) {
            osmd.EngravingRules.DrawChordSymbols = true;
          }
          // Increase spacing for chord symbols
          osmd.EngravingRules.ChordSymbolTextHeight = 2.0;
          osmd.EngravingRules.ChordSymbolXSpacing = 2.0;
          // Reduce font size to help with long chord names
          osmd.EngravingRules.ChordSymbolRelativeFontSize = 0.75;
          // Try to use text attribute from MusicXML
          osmd.EngravingRules.RenderChordSymbolText = true;
          // Use Unicode symbols for alterations
          osmd.EngravingRules.ChordSymbolUseSharpFlat = true;
          console.log('[OSMD] Chord settings: RenderChordSymbols=' + osmd.EngravingRules.RenderChordSymbols + ', DrawChordSymbols=' + osmd.EngravingRules.DrawChordSymbols);
        }

        if (loadingEl) {
          loadingEl.style.display = 'none';
        }
        return true;
      } catch (error) {
        console.error('OSMD init error:', error);
        showError('Failed to initialize: ' + error.message);
        return false;
      }
    }

    // Render MusicXML content
    window.renderMusicXML = async function(xmlContent) {
      if (typeof opensheetmusicdisplay === 'undefined') {
        pendingMusicXml = xmlContent;
        return;
      }
      
      if (!osmd) {
        if (!initOsmd()) return;
      }

      const loadingEl = document.getElementById('loading');
      
      try {
        if (loadingEl) {
          loadingEl.textContent = 'Rendering...';
          loadingEl.style.display = 'flex';
        }

        await osmd.load(xmlContent);
        osmd.render();

        if (loadingEl) {
          loadingEl.style.display = 'none';
        }
        
        setZoom(currentZoom);
        shortenChordSymbols();

        // Apply any pending chord positions immediately (before browser paints)
        // This reuses cached positions from previous render to prevent flicker
        if (pendingChordPositions && pendingChordPositions.length > 0) {
          applyChordPositions(pendingChordPositions);
        }
        // For first load, positions will be sent after measurePositions are received
        
        buildNoteMap();
        addNoteClickHandlers();
        sendMeasurePositions(); // Must run before replaceMetricModulations to populate window.lastMeasurePositions
        replaceMetricModulations(); // Uses measure positions for correct placement
        sendMessage('rendered');
      } catch (error) {
        console.error('Render error:', error);
        showError('Failed to render: ' + error.message);
        sendMessage('error', error.message);
      }
    };

    // Debug: log all chord-related elements OSMD created
    function debugChordElements() {
      const svg = document.querySelector('#osmd-container svg');
      if (!svg) {
        return;
      }

      // Check OSMD's internal chord data
      if (osmd && osmd.sheet) {
        if (osmd.sheet.sourceMeasures) {
          let totalChordContainers = 0;
          for (let m = 0; m < osmd.sheet.sourceMeasures.length; m++) {
            const sm = osmd.sheet.sourceMeasures[m];
            if (sm.VerticalSourceStaffEntryContainers) {
              for (const vstec of sm.VerticalSourceStaffEntryContainers) {
                if (vstec && vstec.StaffEntries) {
                  for (const se of vstec.StaffEntries) {
                    if (se && se.ChordContainers && se.ChordContainers.length > 0) {
                      totalChordContainers += se.ChordContainers.length;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Try various selectors
      const chordSymbolGroups = svg.querySelectorAll('g[class*="ChordSymbol"]');
      const chordGroups = svg.querySelectorAll('g[class*="chord"]');
      const chordTexts = svg.querySelectorAll('text[class*="chord"]');
      const allGroups = svg.querySelectorAll('g[class]');
      const allTexts = svg.querySelectorAll('text');
      
      // console.log('[DEBUG] ChordSymbol groups:', chordSymbolGroups.length);
      // console.log('[DEBUG] chord groups:', chordGroups.length);
      // console.log('[DEBUG] chord texts:', chordTexts.length);
      // console.log('[DEBUG] Total text elements:', allTexts.length);
      
      // Log all text content to see if chords appear as plain text
      const textContents = [];
      allTexts.forEach(t => {
        const content = t.textContent?.trim();
        if (content && content.length > 0 && content.length < 20) {
          textContents.push(content);
        }
      });
      // console.log('[DEBUG] Text contents:', textContents.slice(0, 20).join(', '));
      
      // Log all group classes to see what OSMD creates
      const classNames = new Set();
      allGroups.forEach(g => {
        const cls = g.getAttribute('class');
        if (cls) classNames.add(cls);
      });
      // console.log('[DEBUG] All group classes:', Array.from(classNames).join(', '));
      
      // Log details of any chord-related elements
      chordSymbolGroups.forEach((g, i) => {
        const transform = g.getAttribute('transform');
        const text = g.textContent?.trim();
        // console.log('[DEBUG] ChordSymbol ' + i + ':', text, 'transform:', transform);
      });
    }

    // SMuFL metronome glyph codepoints (Bravura font)
    // These are from the Standard Music Font Layout specification
    const SMUFL_METRONOME_GLYPHS = {
      'whole': '\uECA2',        // metNoteWhole
      'half': '\uECA3',         // metNoteHalfUp
      'quarter': '\uECA5',      // metNoteQuarterUp
      'eighth': '\uECA7',       // metNote8thUp
      '16th': '\uECA9',         // metNote16thUp
      '32nd': '\uECAB',         // metNote32ndUp
      '64th': '\uECAD',         // metNote64thUp
      'dot': '\uECB7'           // metAugmentationDot
    };

    // Pattern to match "quarter=half@m1" or "dotted-quarter=eighth@m3" (with measure marker)
    // The @m{number} suffix tells us which measure to position the glyph at
    // Note: \\d is double-escaped because this is inside a template string
    const MODULATION_PATTERN = /^(dotted-)?(whole|half|quarter|eighth|16th|32nd|64th)=(dotted-)?(whole|half|quarter|eighth|16th|32nd|64th)@m(\\d+)$/i;

    /**
     * Replace metric modulation text with proper SMuFL glyphs.
     * Since OSMD doesn't render two-beat-unit metronomes, we use <words>
     * and find the resulting text elements to replace them.
     * Uses measure positions from OSMD since text positioning is inconsistent.
     */
    function replaceMetricModulations() {
      const container = document.getElementById('osmd-container');
      if (!container) return;

      // Clean up ALL previous glyph replacements from the container level
      // This handles cases where OSMD creates a new SVG and leaves old ones
      const allOldGlyphs = container.querySelectorAll('.soundfirst-tempo-mod');
      allOldGlyphs.forEach(function(el) { el.remove(); });

      const svg = container.querySelector('svg');
      if (!svg) return;
      
      // Get measure positions from OSMD (stored during sendMeasurePositions)
      const measurePositions = window.lastMeasurePositions || [];

      // Also unhide any previously hidden modulation text (in case they're no longer valid)
      const hiddenTexts = svg.querySelectorAll('text[visibility="hidden"]');
      hiddenTexts.forEach(function(el) {
        const text = (el.textContent || '').trim();
        if (MODULATION_PATTERN.test(text.replace(/@m\d+$/, '@m0'))) { // Normalize for check
          el.removeAttribute('visibility');
        }
      });

      // Find ALL text elements in the SVG
      const allTextElements = svg.querySelectorAll('text');
      const modulationsToReplace = [];
      
      // First pass: detect if we have a pickup measure
      // Use the global hasPickupMeasure set by sendMeasurePositions (reliable detection from OSMD)
      // With pickup: MusicXML measure numbers start at 0 (pickup is measure 0)
      // Without pickup: MusicXML measure numbers start at 1
      const hasPickup = window.hasPickupMeasure || false;
      
      allTextElements.forEach(function(textEl) {
        const text = (textEl.textContent || '').trim();
        
        const match = text.match(MODULATION_PATTERN);
        if (!match) return;

        // Parse the modulation: [fullMatch, fromDotted, fromUnit, toDotted, toUnit, measureNum]
        const fromDotted = !!match[1];
        const fromUnit = match[2].toLowerCase();
        const toDotted = !!match[3];
        const toUnit = match[4].toLowerCase();
        const measureNum = parseInt(match[5], 10);

        const fromGlyph = SMUFL_METRONOME_GLYPHS[fromUnit];
        const toGlyph = SMUFL_METRONOME_GLYPHS[toUnit];
        const dotGlyph = SMUFL_METRONOME_GLYPHS.dot;

        if (!fromGlyph || !toGlyph) return;

        // Find the measure position by matching measureNumber
        // measurePositions now includes measureNumber from OSMD
        const measurePos = measurePositions.find(function(pos) {
          return pos.measureNumber === measureNum;
        });
        
        // Use measure's noteStartX if available, otherwise fall back to text element position
        let x;
        if (measurePos && measurePos.noteStartX !== undefined) {
          x = measurePos.noteStartX;
        } else {
          x = parseFloat(textEl.getAttribute('x') || '0');
        }
        const y = parseFloat(textEl.getAttribute('y') || '0');

        // Hide the original text element immediately
        textEl.setAttribute('visibility', 'hidden');

        // Store info for after font loads
        modulationsToReplace.push({
          x, y, fromGlyph, toGlyph, dotGlyph, fromDotted, toDotted
        });
      });

      if (modulationsToReplace.length === 0) return;

      // Create the replacement glyphs but keep hidden until font loads
      function createGlyphs() {
        modulationsToReplace.forEach(function(mod) {
          const custom = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          custom.setAttribute('class', 'soundfirst-tempo-mod');

          // Left note glyph
          const left = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          left.setAttribute('x', String(mod.x));
          left.setAttribute('y', String(mod.y));
          left.setAttribute('font-family', 'Bravura Text, Bravura, serif');
          left.setAttribute('font-size', '24');
          left.textContent = mod.fromGlyph + (mod.fromDotted ? mod.dotGlyph : '');

          // Equals sign
          const eq = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          eq.setAttribute('x', String(mod.x + 20));
          eq.setAttribute('y', String(mod.y));
          eq.setAttribute('font-size', '16');
          eq.textContent = '=';

          // Right note glyph
          const right = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          right.setAttribute('x', String(mod.x + 36));
          right.setAttribute('y', String(mod.y));
          right.setAttribute('font-family', 'Bravura Text, Bravura, serif');
          right.setAttribute('font-size', '24');
          right.textContent = mod.toGlyph + (mod.toDotted ? mod.dotGlyph : '');

          custom.appendChild(left);
          custom.appendChild(eq);
          custom.appendChild(right);

          svg.appendChild(custom);
        });
      }

      // Wait for Bravura font to load before showing glyphs
      if (document.fonts && document.fonts.load) {
        document.fonts.load('24px "Bravura Text"').then(function() {
          createGlyphs();
        }).catch(function() {
          // Fallback: create glyphs anyway after timeout
          setTimeout(createGlyphs, 500);
        });
      } else {
        // No Font Loading API, just wait a bit
        setTimeout(createGlyphs, 300);
      }
    }

    // Post-process SVG to shorten chord symbols using Unicode
    function shortenChordSymbols() {
      const container = document.getElementById('osmd-container');
      if (!container) return;
      
      // Find chord symbol text elements specifically
      // OSMD wraps chord symbols in containers with class containing "ChordSymbol"
      // This avoids modifying lyrics or other text elements
      const chordElements = container.querySelectorAll('svg g[class*="ChordSymbol"] text, svg [class*="chord"] text');
      
      chordElements.forEach(function(el) {
        const text = el.textContent || '';
        if (text.length < 1) return;
        
        // Apply chord symbol shortenings
        // Note: △ alone means "major 7th" in jazz notation
        let shortened = text
          // Quality abbreviations (△ = maj7, no need for redundant 7)
          .replace(/maj13/gi, '△13')
          .replace(/maj9/gi, '△9')
          .replace(/maj7/gi, '△')
          .replace(/maj/gi, '△')
          .replace(/min7/gi, 'm7')
          .replace(/min9/gi, 'm9')
          .replace(/min/gi, 'm')
          .replace(/dim7/gi, '°7')
          .replace(/dim/gi, '°')
          .replace(/aug/gi, '+')
          .replace(/m7b5/gi, 'ø')
          .replace(/half-dim/gi, 'ø')
          // Parenthetical alterations
          .replace(/\\(alt\\s*/gi, '(')
          // Alteration symbols
          .replace(/#9/g, '♯9')
          .replace(/b9/g, '♭9')
          .replace(/#11/g, '♯11')
          .replace(/b5/g, '♭5')
          .replace(/#5/g, '♯5')
          .replace(/b13/g, '♭13');
        
        if (shortened !== text) {
          el.textContent = shortened;
        }
      });
    }

    // Count chord text elements in the SVG (used to detect stale cache)
    function countChordElements() {
      const svgContainer = document.querySelector('#osmd-container svg');
      if (!svgContainer) return 0;
      
      const allTextElements = Array.from(svgContainer.querySelectorAll('g.vf-text text, g.vf-modifiers text'));
      const chordPatterns = /^[A-G][b#]?(maj|min|m|dim|aug|sus|add|7|6|9|11|13)?/i;
      
      let count = 0;
      allTextElements.forEach((textEl) => {
        const content = textEl.textContent?.trim();
        if (!content || content.length === 0 || content.length > 20) return;
        if (/[,.'!?:]/.test(content) || content.includes(' ')) return;
        if (/^(=|[0-9]+|Swing|Straight|Fast|Slow|Moderato|Allegro|Andante)$/i.test(content)) return;
        if (/^[a-z]+$/.test(content) && content.length < 4) return;
        
        if (chordPatterns.test(content)) {
          count++;
        }
      });
      return count;
    }

    // Track elements hidden for repositioning
    let hiddenRepositionElements = [];

    // Hide only the specific chords that need repositioning (to prevent flicker)
    function hideRepositionChords(chordPositions) {
      hiddenRepositionElements = [];
      const svgContainer = document.querySelector('#osmd-container svg');
      if (!svgContainer) return;
      
      const allTextElements = Array.from(svgContainer.querySelectorAll('g.vf-text text, g.vf-modifiers text'));
      const chordPatterns = /^[A-G][b#]?(maj|min|m|dim|aug|sus|add|7|6|9|11|13)?/i;
      
      // Find all chord elements
      const chordTextElements = [];
      allTextElements.forEach((textEl) => {
        const content = textEl.textContent?.trim();
        if (!content || content.length === 0 || content.length > 20) return;
        if (/[,.'!?:]/.test(content) || content.includes(' ')) return;
        if (/^(=|[0-9]+|Swing|Straight|Fast|Slow|Moderato|Allegro|Andante)$/i.test(content)) return;
        if (/^[a-z]+$/.test(content) && content.length < 4) return;
        
        if (chordPatterns.test(content)) {
          const parentGroup = textEl.closest('g');
          if (parentGroup) {
            chordTextElements.push(parentGroup);
          }
        }
      });
      
      // Sort positions to match chord element order
      const sortedPositions = chordPositions.slice().sort((a, b) => {
        if (a.measureIndex !== b.measureIndex) return a.measureIndex - b.measureIndex;
        return a.beatPosition - b.beatPosition;
      });
      
      // Hide only chords that need repositioning
      const numToProcess = Math.min(chordTextElements.length, sortedPositions.length);
      for (let i = 0; i < numToProcess; i++) {
        if (sortedPositions[i].needsRepositioning) {
          const el = chordTextElements[i];
          el.style.visibility = 'hidden';
          hiddenRepositionElements.push(el);
        }
      }
    }

    // Show the repositioned chords
    function showRepositionChords() {
      for (const el of hiddenRepositionElements) {
        el.style.visibility = 'visible';
      }
      hiddenRepositionElements = [];
    }

    // Reposition chord symbols to their correct beat positions
    // Called from React Native with pre-calculated X positions
    // chordPositions: Array of { measureIndex, beatPosition, x, needsRepositioning }
    window.repositionChordSymbols = function(chordPositions) {
      // Store positions for reuse on subsequent renders (prevents flicker)
      pendingChordPositions = chordPositions;
      hasEverReceivedPositions = true;
      
      // Apply positions
      applyChordPositions(chordPositions);
    };

    // Highlight a note by measure and note index
    // Uses an overlay rectangle instead of modifying OSMD's SVG elements
    // This allows us to highlight without re-rendering OSMD
    window.highlightNote = function(measureIndex, noteIndex) {
      // Hide overlay if clearing
      const existingOverlay = document.getElementById('note-highlight-overlay');
      if (measureIndex < 0 || noteIndex < 0) {
        if (existingOverlay) existingOverlay.style.display = 'none';
        return;
      }

      // Find the note element
      const noteInfo = noteElements.find(
        n => n.measureIndex === measureIndex && n.noteIndex === noteIndex
      );
      if (!noteInfo || !noteInfo.element) {
        console.log('[highlightNote] Note not found:', measureIndex, noteIndex, 'total notes:', noteElements.length);
        if (existingOverlay) existingOverlay.style.display = 'none';
        return;
      }

      // Get the bounding box from OSMD's graphical note
      const graphicalNote = noteInfo.element;
      if (!graphicalNote.boundingBox) {
        console.log('[highlightNote] No bounding box for note', measureIndex, noteIndex);
        return;
      }

      const bbox = graphicalNote.boundingBox;
      // OSMD stores absolute position separately
      const absPos = bbox.absolutePosition || { x: 0, y: 0 };
      
      // Calculate position in SVG units (OSMD uses units that need *10 for pixels)
      const x = (absPos.x + bbox.borderLeft) * 10 * currentZoom;
      const y = (absPos.y + bbox.borderTop) * 10 * currentZoom;
      const width = bbox.width * 10 * currentZoom;
      const height = bbox.height * 10 * currentZoom;

      // Create or update highlight overlay
      const svg = document.querySelector('#osmd-container svg');
      if (!svg) return;

      let highlightEl = document.getElementById('note-highlight-overlay');
      if (!highlightEl) {
        highlightEl = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        highlightEl.id = 'note-highlight-overlay';
        highlightEl.setAttribute('fill', '#0066CC');
        highlightEl.setAttribute('fill-opacity', '0.3');
        highlightEl.setAttribute('stroke', '#0066CC');
        highlightEl.setAttribute('stroke-width', '2');
        highlightEl.setAttribute('rx', '4');
        highlightEl.setAttribute('ry', '4');
        highlightEl.style.pointerEvents = 'none';
        svg.appendChild(highlightEl);
      }

      // Position the highlight
      highlightEl.setAttribute('x', x - 4);
      highlightEl.setAttribute('y', y - 4);
      highlightEl.setAttribute('width', width + 8);
      highlightEl.setAttribute('height', height + 8);
      highlightEl.style.display = 'block';
      
      console.log('[highlightNote] Positioned overlay at', x, y, 'size', width, height);
    };

    // Apply stored chord positions to SVG elements
    function applyChordPositions(chordPositions) {
      const svgContainer = document.querySelector('#osmd-container svg');
      if (!svgContainer) {
        console.log('applyChordPositions: No SVG container');
        return;
      }
      
      // Normalize input
      const positions = Array.isArray(chordPositions) ? chordPositions : [];

      // OSMD renders chords as plain vf-text elements, not special ChordSymbol groups
      // We need to find them by content matching against chord symbol patterns
      // Collect all text elements and their parent groups
      const allTextElements = Array.from(svgContainer.querySelectorAll('g.vf-text text, g.vf-modifiers text'));
      
      // Build regex pattern to match chord symbols:
      // Root: A-G with optional b/#
      // Quality: m, maj, min, dim, aug, sus, add, followed by numbers
      // Extensions: numbers like 6, 7, 9, 11, 13
      // Slash bass: /X or /Xb or /X#
      const chordPatterns = /^[A-G][b#♭♯]?(maj|min|m|dim|aug|sus|add|Δ|°|ø|\\+)?[0-9]*(b5|#5|b9|#9|b11|#11|b13|#13)*(\\\/[A-G][b#♭♯]?)?$/i;
      
      // Find text elements that look like chord symbols
      const chordTextElements = [];
      allTextElements.forEach((textEl) => {
        const content = textEl.textContent?.trim();
        if (!content || content.length === 0 || content.length > 20) return;
        
        // Skip if it looks like a lyric (contains spaces, common punctuation)
        if (/[,.'!?:]/.test(content) || content.includes(' ')) return;
        
        // Skip tempo marking and common non-chord text
        if (/^(=|\\d+|Swing|Straight|Fast|Slow|Moderato|Allegro|Andante)$/i.test(content)) return;
        
        // Skip single lowercase words (likely lyrics)
        if (/^[a-z]+$/.test(content) && content.length < 4) return;
        
        // Check if it matches chord pattern
        if (chordPatterns.test(content) || 
            // Also match explicit chord-like patterns
            /^[A-G][b#♭♯]?(m|maj|min|dim|aug|sus|6|7|9|11|13)/.test(content)) {
          const parentGroup = textEl.closest('g');
          if (parentGroup) {
            chordTextElements.push({ element: parentGroup, text: content });
          }
        }
      });

      console.log('applyChordPositions: Found ' + chordTextElements.length + ' chord text elements for ' + positions.length + ' positions');
      console.log('applyChordPositions: Chord texts found:', chordTextElements.map(c => c.text).join(', '));
      
      if (chordTextElements.length === 0) {
        return;
      }

      // Sort chord positions by measure then beat (same order OSMD renders them)
      const sortedPositions = positions.slice().sort((a, b) => {
        if (a.measureIndex !== b.measureIndex) return a.measureIndex - b.measureIndex;
        return a.beatPosition - b.beatPosition;
      });

      // Match chord elements to positions in order
      const numToProcess = Math.min(chordTextElements.length, sortedPositions.length);
      
      for (let i = 0; i < numToProcess; i++) {
        const chordInfo = chordTextElements[i];
        const chordGroup = chordInfo.element;
        const position = sortedPositions[i];
        
        // Only reposition chords that need it:
        // - Last measure chords (always use interleaving due to OSMD workaround)
        // - Mid-note chords (OSMD places at forward position, ignores offset)
        if (!position.needsRepositioning) {
          continue;
        }
        
        // Get the text element inside the group
        const textEl = chordGroup.querySelector('text');
        if (!textEl) {
          console.log('applyChordPositions: No text element for chord ' + i + ' (' + chordInfo.text + ')');
          continue;
        }
        
        // Get current x position from text element (in SVG pixels)
        const currentX = parseFloat(textEl.getAttribute('x') || '0');
        // Target position comes divided by 10, so multiply back to get pixels
        const targetX = position.x * 10;
        const delta = Math.abs(targetX - currentX);
        
        if (delta > 10) {
          // Move by adding a translate transform to shift the group
          const deltaX = targetX - currentX;
          chordGroup.setAttribute('transform', 'translate(' + deltaX + ', 0)');
          console.log('Chord ' + i + ' ("' + chordInfo.text + '"): moved by delta=' + deltaX.toFixed(1) + ' to x=' + targetX.toFixed(1) + ' (measure ' + position.measureIndex + ', beat ' + position.beatPosition + ')');
        } else {
          console.log('Chord ' + i + ' ("' + chordInfo.text + '"): already at correct position x=' + currentX.toFixed(1) + ' (delta=' + delta.toFixed(1) + ')');
        }
      }
    };

    // Send measure positions to parent for external scrolling
    function sendMeasurePositions() {
      if (!osmd || !osmd.graphic || !osmd.graphic.measureList) return;
      
      const measureList = osmd.graphic.measureList;
      const positions = [];
      
      for (let i = 0; i < measureList.length; i++) {
        const measure = measureList[i];
        if (!measure || !measure[0]) continue;
        
        const staffMeasure = measure[0];
        if (!staffMeasure.boundingBox) continue;
        
        const bbox = staffMeasure.boundingBox;
        const posX = bbox.absolutePosition ? bbox.absolutePosition.x : bbox.x;
        
        if (posX === undefined || isNaN(posX)) continue;
        
        // Get actual MusicXML measure number from OSMD
        // With pickup: measure 0 is the pickup, then 1, 2, 3...
        // Without pickup: measure 1, 2, 3...
        let measureNumber = i; // fallback to index
        if (staffMeasure.parentSourceMeasure && staffMeasure.parentSourceMeasure.MeasureNumber !== undefined) {
          measureNumber = staffMeasure.parentSourceMeasure.MeasureNumber;
        }
        
        // Collect all beat positions from staff entries
        const beatPositions = [];
        let firstNoteX = null;
        let lastNoteX = null;
        
        if (staffMeasure.staffEntries && staffMeasure.staffEntries.length > 0) {
          let entryIndex = 0;
          for (const entry of staffMeasure.staffEntries) {
            if (entry && entry.boundingBox) {
              // Only include entries that have actual graphical notes/rests
              // Skip entries that are just chord symbols or other non-note elements
              const hasNotes = entry.graphicalVoiceEntries && 
                entry.graphicalVoiceEntries.some(gve => 
                  gve && gve.notes && gve.notes.length > 0
                );
              if (!hasNotes) continue; // Skip non-note entries like chord symbols
              
              const entryX = entry.boundingBox.absolutePosition 
                ? entry.boundingBox.absolutePosition.x 
                : entry.boundingBox.x;
              if (entryX !== undefined && !isNaN(entryX)) {
                // Try to get beat from sourceStaffEntry.Timestamp
                let beatNumber = entryIndex; // Fallback to entry index
                
                const sourceEntry = entry.sourceStaffEntry;
                if (sourceEntry?.Timestamp?.RealValue !== undefined) {
                  // Get measure start from first entry with notes
                  const firstNoteEntry = staffMeasure.staffEntries.find(e => 
                    e?.graphicalVoiceEntries?.some(gve => gve?.notes?.length > 0)
                  );
                  const measureStart = firstNoteEntry?.sourceStaffEntry?.Timestamp?.RealValue || 0;
                  const relativeTimestamp = sourceEntry.Timestamp.RealValue - measureStart;
                  // Convert whole notes to quarter notes (beats) - keep fractional values!
                  beatNumber = relativeTimestamp * 4;
                }
                
                beatPositions.push({
                  beat: beatNumber,
                  x: entryX * 10
                });
                
                if (firstNoteX === null || entryX < firstNoteX) {
                  firstNoteX = entryX;
                }
                if (lastNoteX === null || entryX > lastNoteX) {
                  lastNoteX = entryX;
                }
                entryIndex++;
              }
            }
          }
        }
        
        // Sort beatPositions by x position (left-to-right) - OSMD entries may not be in order
        beatPositions.sort((a, b) => a.x - b.x);
        
        // Convert to pixels (OSMD units * 10)
        const measureX = posX * 10;
        const noteStartX = firstNoteX !== null ? firstNoteX * 10 : measureX + 50;
        const noteEndX = lastNoteX !== null ? lastNoteX * 10 : noteStartX + 100;
        
        // Get actual measure width from bounding box for barline position
        const measureWidth = bbox.boundingRectangle ? bbox.boundingRectangle.width * 10 : null;
        const barlineX = measureWidth ? measureX + measureWidth : null;
        
        // DEBUG: Log beat positions for each measure
        // console.log('[OSMD] Measure ' + i + ' beatPositions:', beatPositions.length, 
        //   JSON.stringify(beatPositions.map(bp => ({ beat: bp.beat.toFixed(2), x: Math.round(bp.x) }))));
        
        positions.push({
          measureIndex: i,
          measureNumber: measureNumber,
          x: measureX,
          noteStartX: noteStartX,
          noteEndX: noteEndX,
          barlineX: barlineX,
          beatPositions: beatPositions,
          // Width is from first note to end of measure (estimated as last note + some padding)
          width: (noteEndX - noteStartX) + 40,
        });
      }
      
      // Detect pickup: if first measure has measureNumber 0, we have a pickup
      const hasPickupMeasure = positions.length > 0 && positions[0].measureNumber === 0;
      window.hasPickupMeasure = hasPickupMeasure;
      
      // Also get total content width
      const container = document.getElementById('osmd-container');
      const contentWidth = container ? container.scrollWidth : 0;
      
      // Store positions globally for replaceMetricModulations to use
      window.lastMeasurePositions = positions;
      
      sendMessage('measurePositions', { positions, contentWidth, zoom: currentZoom });
    }

    // Build map of notes for click detection
    function buildNoteMap() {
      noteElements = [];
      if (!osmd || !osmd.graphic || !osmd.graphic.measureList) return;

      const measureList = osmd.graphic.measureList;

      for (let mIdx = 0; mIdx < measureList.length; mIdx++) {
        const staffMeasures = measureList[mIdx];
        if (!staffMeasures || staffMeasures.length === 0) continue;

        const staffMeasure = staffMeasures[0]; // Single staff
        if (!staffMeasure || !staffMeasure.staffEntries) continue;

        let measureNoteIndex = 0; // Per-measure index
        for (let seIdx = 0; seIdx < staffMeasure.staffEntries.length; seIdx++) {
          const staffEntry = staffMeasure.staffEntries[seIdx];
          if (!staffEntry || !staffEntry.graphicalVoiceEntries) continue;

          for (const gve of staffEntry.graphicalVoiceEntries) {
            if (!gve || !gve.notes) continue;
            for (const note of gve.notes) {
              // Store reference with position info (per-measure noteIndex)
              noteElements.push({
                measureIndex: mIdx,
                noteIndex: measureNoteIndex,
                element: note,
                boundingBox: note.boundingBox || null,
              });
              measureNoteIndex++;
            }
          }
        }
      }

      // console.log('Built note map with ' + noteElements.length + ' notes');
    }

    // Add click handlers for note selection
    function addNoteClickHandlers() {
      const svgContainer = document.querySelector('#osmd-container svg');
      if (!svgContainer) return;

      svgContainer.addEventListener('click', function(event) {
        const x = event.offsetX / currentZoom;
        const y = event.offsetY / currentZoom;

        // Find closest note to click position
        let closestNote = null;
        let closestDistance = Infinity;

        for (const noteInfo of noteElements) {
          if (!noteInfo.element || !noteInfo.element.boundingBox) continue;
          
          const bbox = noteInfo.element.boundingBox;
          const centerX = bbox.x + bbox.width / 2;
          const centerY = bbox.y + bbox.height / 2;
          
          // Convert OSMD units to pixels (rough estimate)
          const pixelX = centerX * 10;
          const pixelY = centerY * 10;
          
          const distance = Math.sqrt(
            Math.pow(x - pixelX, 2) + Math.pow(y - pixelY, 2)
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestNote = noteInfo;
          }
        }

        // If close enough, select the note
        if (closestNote && closestDistance < 50) {
          sendMessage('noteTap', {
            measureIndex: closestNote.measureIndex,
            noteIndex: closestNote.noteIndex,
          });
        }
      });
    }

    // Set zoom level
    window.setZoom = function(zoom) {
      currentZoom = zoom;
      const container = document.getElementById('osmd-container');
      if (container) {
        container.style.transform = 'scale(' + zoom + ')';
      }
      sendMessage('zoomChange', zoom);
    };

    // Scroll to a specific measure (instant, for editing)
    window.scrollToMeasure = function(measureIndex) {
      if (!osmd || !osmd.graphic || !osmd.graphic.measureList) return;
      
      const measureList = osmd.graphic.measureList;
      if (measureIndex >= measureList.length) return;

      const measure = measureList[measureIndex];
      if (!measure || !measure[0]) return;

      const staffMeasure = measure[0];
      if (!staffMeasure.boundingBox) return;

      // OSMD bounding box uses absolutePosition for coordinates
      const bbox = staffMeasure.boundingBox;
      const posX = bbox.absolutePosition ? bbox.absolutePosition.x : bbox.x;
      if (posX === undefined || isNaN(posX)) return;
      
      const scrollX = (posX * 10 * currentZoom) - 50; // Offset for visibility

      const container = document.getElementById('container');
      if (container) {
        container.scrollTo({
          left: Math.max(0, scrollX),
          behavior: 'instant'
        });
      }
    };

    // Scroll to a specific measure with smooth animation (for playback)
    // Uses 70% threshold: only scrolls when measure passes 70% of viewport
    window.scrollToMeasureSmooth = function(measureIndex) {
      // Skip if already at this measure (avoid redundant scrolls during playback)
      if (measureIndex === lastSmoothScrolledMeasure) return;
      
      if (!osmd || !osmd.graphic || !osmd.graphic.measureList) return;
      
      const measureList = osmd.graphic.measureList;
      if (measureIndex >= measureList.length) return;

      const measure = measureList[measureIndex];
      if (!measure || !measure[0]) return;

      const staffMeasure = measure[0];
      if (!staffMeasure.boundingBox) return;

      // OSMD bounding box uses absolutePosition for coordinates
      const bbox = staffMeasure.boundingBox;
      const posX = bbox.absolutePosition ? bbox.absolutePosition.x : bbox.x;
      if (posX === undefined || isNaN(posX)) return;
      
      const container = document.getElementById('container');
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const measureX = posX * 10 * currentZoom;
      const currentScrollLeft = container.scrollLeft;
      
      // Only scroll if measure is past 70% of viewport or before visible area
      const threshold = currentScrollLeft + (containerWidth * 0.7);
      const leftEdge = currentScrollLeft;
      
      if (measureX >= leftEdge && measureX < threshold) {
        // Measure is visible and before 70% threshold, no scroll needed
        lastSmoothScrolledMeasure = measureIndex;
        return;
      }
      
      // Scroll to put measure at ~15% from left edge
      const leadSpace = containerWidth * 0.15;
      const scrollX = measureX - leadSpace;

      container.scrollTo({
        left: Math.max(0, scrollX),
        behavior: 'smooth'
      });
      
      lastSmoothScrolledMeasure = measureIndex;
    };
    
    // Reset smooth scroll tracking (call when playback stops)
    window.resetSmoothScrollTracking = function() {
      lastSmoothScrolledMeasure = -1;
    };

    // Show cursor at position
    window.showCursor = function(measureIndex, noteIndex) {
      // For now, just scroll to measure
      // Future: Show actual cursor indicator element
      window.scrollToMeasure(measureIndex);
    };

    // Show error message
    function showError(message) {
      const container = document.getElementById('osmd-container');
      if (container) {
        container.innerHTML = '<div class="error"><div class="error-icon">⚠️</div><div>' + message + '</div></div>';
      }
      sendMessage('error', message);
    }

    // Wait for OSMD
    function waitForOsmd(callback, maxAttempts) {
      maxAttempts = maxAttempts || 50;
      let attempts = 0;
      
      function check() {
        if (typeof opensheetmusicdisplay !== 'undefined') {
          callback();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 100);
        } else {
          showError('Music renderer failed to load.');
        }
      }
      
      check();
    }

    // Forward wheel events to parent for external scrolling
    document.addEventListener('wheel', function(e) {
      e.preventDefault();
      sendMessage('wheel', { deltaX: e.deltaX, deltaY: e.deltaY });
    }, { passive: false });

    // Initialize
    function startup() {
      waitForOsmd(function() {
        sendMessage('ready');
        if (pendingMusicXml) {
          window.renderMusicXML(pendingMusicXml);
          pendingMusicXml = null;
        }
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startup);
    } else {
      startup();
    }
  </script>
</body>
</html>
`.trim();
}
