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
        });

        // Configure chord symbol rendering
        if (osmd.EngravingRules) {
          // Increase spacing for chord symbols
          osmd.EngravingRules.ChordSymbolTextHeight = 2.0;
          osmd.EngravingRules.ChordSymbolXSpacing = 2.0;
          // Reduce font size to help with long chord names
          osmd.EngravingRules.ChordSymbolRelativeFontSize = 0.75;
          // Try to use text attribute from MusicXML
          osmd.EngravingRules.RenderChordSymbolText = true;
          // Use Unicode symbols for alterations
          osmd.EngravingRules.ChordSymbolUseSharpFlat = true;
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
        buildNoteMap();
        addNoteClickHandlers();
        sendMeasurePositions();
        sendMessage('rendered');
      } catch (error) {
        console.error('Render error:', error);
        showError('Failed to render: ' + error.message);
        sendMessage('error', error.message);
      }
    };

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
        
        // DEBUG: Log all available properties on staffMeasure and bbox for measure 1
        if (i === 1) {
          console.log('[OSMD] staffMeasure keys:', Object.keys(staffMeasure));
          console.log('[OSMD] bbox keys:', Object.keys(bbox));
          console.log('[OSMD] bbox.boundingRectangle:', bbox.boundingRectangle);
          console.log('[OSMD] staffMeasure.endInstructionsWidth:', staffMeasure.endInstructionsWidth);
          console.log('[OSMD] staffMeasure.minimumStaffEntriesWidth:', staffMeasure.minimumStaffEntriesWidth);
          console.log('[OSMD] staffMeasure.staffWidth:', staffMeasure.staffWidth);
        }
        
        if (posX === undefined || isNaN(posX)) continue;
        
        // Collect all beat positions from staff entries
        const beatPositions = [];
        let firstNoteX = null;
        let lastNoteX = null;
        
        if (staffMeasure.staffEntries && staffMeasure.staffEntries.length > 0) {
          let entryIndex = 0;
          for (const entry of staffMeasure.staffEntries) {
            if (entry && entry.boundingBox) {
              const entryX = entry.boundingBox.absolutePosition 
                ? entry.boundingBox.absolutePosition.x 
                : entry.boundingBox.x;
              if (entryX !== undefined && !isNaN(entryX)) {
                // Try to get beat from sourceStaffEntry.Timestamp
                let beatNumber = entryIndex; // Fallback to entry index
                
                const sourceEntry = entry.sourceStaffEntry;
                if (sourceEntry?.Timestamp?.RealValue !== undefined) {
                  // Get measure start from first entry
                  const firstSourceEntry = staffMeasure.staffEntries[0]?.sourceStaffEntry;
                  const measureStart = firstSourceEntry?.Timestamp?.RealValue || 0;
                  const relativeTimestamp = sourceEntry.Timestamp.RealValue - measureStart;
                  // Convert whole notes to quarter notes (beats) - keep fractional values!
                  beatNumber = relativeTimestamp * 4;
                }
                
                beatPositions.push({
                  beat: beatNumber,
                  x: entryX * 10
                });
                
                if (firstNoteX === null) {
                  firstNoteX = entryX;
                }
                lastNoteX = entryX;
                entryIndex++;
              }
            }
          }
        }
        
        // Convert to pixels (OSMD units * 10)
        const measureX = posX * 10;
        const noteStartX = firstNoteX !== null ? firstNoteX * 10 : measureX + 50;
        const noteEndX = lastNoteX !== null ? lastNoteX * 10 : noteStartX + 100;
        
        // Get actual measure width from bounding box for barline position
        const measureWidth = bbox.boundingRectangle ? bbox.boundingRectangle.width * 10 : null;
        const barlineX = measureWidth ? measureX + measureWidth : null;
        
        positions.push({
          measureIndex: i,
          x: measureX,
          noteStartX: noteStartX,
          noteEndX: noteEndX,
          barlineX: barlineX,
          beatPositions: beatPositions,
          // Width is from first note to end of measure (estimated as last note + some padding)
          width: (noteEndX - noteStartX) + 40,
        });
      }
      
      // Also get total content width
      const container = document.getElementById('osmd-container');
      const contentWidth = container ? container.scrollWidth : 0;
      
      sendMessage('measurePositions', { positions, contentWidth, zoom: currentZoom });
    }

    // Build map of notes for click detection
    function buildNoteMap() {
      noteElements = [];
      if (!osmd || !osmd.graphic || !osmd.graphic.measureList) return;

      const measureList = osmd.graphic.measureList;
      let globalNoteIndex = 0;

      for (let mIdx = 0; mIdx < measureList.length; mIdx++) {
        const staffMeasures = measureList[mIdx];
        if (!staffMeasures || staffMeasures.length === 0) continue;

        const staffMeasure = staffMeasures[0]; // Single staff
        if (!staffMeasure || !staffMeasure.staffEntries) continue;

        for (let seIdx = 0; seIdx < staffMeasure.staffEntries.length; seIdx++) {
          const staffEntry = staffMeasure.staffEntries[seIdx];
          if (!staffEntry || !staffEntry.graphicalVoiceEntries) continue;

          for (const gve of staffEntry.graphicalVoiceEntries) {
            if (!gve || !gve.notes) continue;
            for (const note of gve.notes) {
              // Store reference with position info
              noteElements.push({
                measureIndex: mIdx,
                noteIndex: globalNoteIndex,
                element: note,
                boundingBox: note.boundingBox || null,
              });
              globalNoteIndex++;
            }
          }
        }
      }

      console.log('Built note map with ' + noteElements.length + ' notes');
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
