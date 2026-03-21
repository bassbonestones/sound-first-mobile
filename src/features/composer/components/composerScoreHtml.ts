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
          drawingParameters: "compact",
          backend: "svg",
          autoBeam: true,
          renderSingleHorizontalStaffline: ${horizontalStaffline},
        });

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
        const width = bbox.width || 0;
        
        if (posX !== undefined && !isNaN(posX)) {
          // Convert to pixels (OSMD units * 10 * zoom)
          positions.push({
            measureIndex: i,
            x: posX * 10,
            width: width * 10
          });
        }
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
      
      // Keep measure at ~15% from left edge for better visibility
      const container = document.getElementById('container');
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const leadSpace = containerWidth * 0.15;
      const scrollX = (posX * 10 * currentZoom) - leadSpace;

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
