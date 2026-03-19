/**
 * Score Preview HTML Generator
 *
 * Generates HTML that loads OpenSheetMusicDisplay (OSMD) from CDN
 * and renders MusicXML content.
 *
 * OSMD is a JavaScript library that renders MusicXML as SVG,
 * providing high-quality music notation rendering.
 *
 * @see https://opensheetmusicdisplay.org/
 */

import type { HighlightedMeasure } from "./scorePreviewTypes";

// ============================================================================
// Types
// ============================================================================

export interface OsmdHtmlOptions {
  /** Initial zoom level (default: 1.0) */
  initialZoom?: number;
  /** Measures to highlight */
  highlightMeasures?: HighlightedMeasure[];
  /** Background color (default: white) */
  backgroundColor?: string;
  /** Draw title (default: true) */
  drawTitle?: boolean;
  /** Draw composer (default: true) */
  drawComposer?: boolean;
  /** Draw part names (default: true) */
  drawPartNames?: boolean;
  /** Enable cursor for practice mode (default: false) */
  enableCursor?: boolean;
  /** Fixed width in pixels for scrollable rendering (0 = auto-fit to container) */
  fixedWidth?: number;
  /** Auto-scroll to keep cursor visible during playback (default: false) */
  autoScrollToCursor?: boolean;
  /** Render all measures in a single horizontal line (default: false) */
  horizontalStaffline?: boolean;
}

// ============================================================================
// HTML Generator
// ============================================================================

/**
 * Generate HTML that loads OSMD and renders MusicXML.
 *
 * The HTML includes:
 * - OSMD library loaded from CDN
 * - Container for SVG rendering
 * - JavaScript API for React Native communication
 */
export function generateOsmdHtml(options: OsmdHtmlOptions = {}): string {
  const {
    initialZoom = 1.0,
    highlightMeasures = [],
    backgroundColor = "#ffffff",
    drawTitle = false,
    drawComposer = false,
    drawPartNames = false,
    enableCursor = true,
    fixedWidth = 0,
    autoScrollToCursor = false,
    horizontalStaffline = false,
  } = options;

  // Serialize highlight measures for use in JavaScript
  const highlightJson = JSON.stringify(highlightMeasures);

  // Calculate container width style - fixed width enables horizontal scrolling
  const containerWidthStyle =
    fixedWidth > 0 ? `min-width: ${fixedWidth}px;` : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Score Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: ${backgroundColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    #container {
      width: 100%;
      height: 100%;
      overflow: auto;
      overflow-x: auto;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
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
    
    /* Highlight uncertain measures */
    .highlight-measure {
      fill: rgba(255, 193, 7, 0.3);
      stroke: rgba(255, 152, 0, 0.8);
      stroke-width: 2;
    }
    
    .highlight-measure-low {
      fill: rgba(244, 67, 54, 0.2);
      stroke: rgba(244, 67, 54, 0.8);
    }
    
    /* Cursor styles for practice mode */
    .cursor {
      fill: rgba(76, 175, 80, 0.3) !important;
      stroke: rgba(56, 142, 60, 0.9) !important;
      stroke-width: 2px !important;
    }
  </style>
</head>
<body>
  <div id="container">
    <div id="osmd-container">
      <div class="loading" id="loading">Loading music renderer...</div>
    </div>
  </div>

  <!-- Load OSMD from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js"></script>

  <script>
    // Global state
    let osmd = null;
    let currentZoom = ${initialZoom};
    const highlightMeasures = ${highlightJson};
    let pendingMusicXml = null; // Store XML if received before OSMD loads
    
    // Auto-scroll configuration
    const autoScrollEnabled = ${autoScrollToCursor};
    const cursorTargetPercent = 0.20; // Keep cursor at 20% from left edge
    
    // Smooth scroll state - CURSOR-CHASING approach
    // Simply follows wherever the cursor element actually is
    let scrollAnimationId = null;
    let isScrolling = false;

    // Send message to React Native (WebView) or parent window (iframe on web)
    function sendMessage(type, payload) {
      const message = JSON.stringify({ type, payload });
      if (window.ReactNativeWebView) {
        // React Native WebView
        window.ReactNativeWebView.postMessage(message);
      } else if (window.parent !== window) {
        // Web iframe - post to parent
        window.parent.postMessage(message, '*');
      }
    }
    
    // Intercept console.log to send to React Native for debugging
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      sendMessage('consoleLog', { level: 'log', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
    };
    console.error = function(...args) {
      originalConsoleError.apply(console, args);
      sendMessage('consoleLog', { level: 'error', message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') });
    };

    // Listen for messages from parent (web iframe)
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
          console.error('OSMD container not found');
          showError('Score container not found. Please try again.');
          return false;
        }
        
        if (typeof opensheetmusicdisplay === 'undefined') {
          console.error('OSMD library not loaded');
          showError('Music renderer not loaded. Check your internet connection.');
          return false;
        }
        
        osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
          autoResize: false,
          drawTitle: ${drawTitle},
          drawComposer: ${drawComposer},
          drawPartNames: ${drawPartNames},
          drawCredits: false,
          drawingParameters: "compact",
          backend: "svg",
          // Enable auto-beaming when MusicXML doesn't have beam elements
          autoBeam: true,
          // Render all in one line for scrollable practice view
          renderSingleHorizontalStaffline: ${horizontalStaffline},
        });

        if (loadingEl) {
          loadingEl.style.display = 'none';
        }
        return true;
      } catch (error) {
        console.error('OSMD init error:', error);
        showError('Failed to initialize music renderer: ' + error.message);
        return false;
      }
    }

    // Render MusicXML content
    window.renderMusicXML = async function(xmlContent) {
      // Check if OSMD library is loaded
      if (typeof opensheetmusicdisplay === 'undefined') {
        // Store for later when OSMD loads
        pendingMusicXml = xmlContent;
        return;
      }
      
      if (!osmd) {
        if (!initOsmd()) {
          return;
        }
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
        
        // Apply initial zoom
        setZoom(currentZoom);
        
        // Apply measure highlights
        applyHighlights();

        // Add click handlers to measures
        addMeasureClickHandlers();
        
        // Pre-build cursor timeline for playback
        buildCursorTimeline();

        sendMessage('rendered');
      } catch (error) {
        console.error('Render error:', error);
        showError('Failed to render score: ' + error.message);
        sendMessage('error', error.message);
      }
    };

    // Set zoom level
    window.setZoom = function(zoom) {
      currentZoom = zoom;
      const container = document.getElementById('osmd-container');
      if (container) {
        container.style.transform = 'scale(' + zoom + ')';
      }
      sendMessage('zoomChange', zoom);
    };

    // ========================================================================
    // Cursor playback system
    // ========================================================================
    
    // Build timeline of cursor positions with their timestamps (in quarter notes)
    let cursorTimeline = []; // [{timestamp: number, index: number}]
    let playbackState = 'stopped'; // 'stopped' | 'playing' | 'paused'
    let playbackTempo = 120;
    let playbackStartTime = 0;
    let playbackPausedAt = 0;
    let currentCursorIndex = 0;
    let animationFrameId = null;
    let beatIntervalId = null;
    let scoreBpm = 120; // Will be read from score
    let beatDurationMs = 500; // Will be calculated
    let beatsPerMeasure = 4;
    let beatUnit = 4; // 4 = quarter, 8 = eighth
    let currentBeat = 0; // Current beat in playback
    let totalBeats = 0; // Total beats in piece
    let currentPlaybackTimestamp = 0; // Current position for metronome-synced cursor (in whole notes)
    let lastScrolledMeasureIndex = 0; // Track which measure we last scrolled to (for once-per-measure scrolling)
    
    // Build the timeline after rendering - but now we also extract time sig and tempo
    function buildCursorTimeline() {
      if (!osmd || !osmd.cursor) return;
      
      cursorTimeline = [];
      osmd.cursor.reset();
      
      // Get time signature from the score
      try {
        if (osmd.sheet && osmd.sheet.SourceMeasures && osmd.sheet.SourceMeasures.length > 0) {
          const firstMeasure = osmd.sheet.SourceMeasures[0];
          if (firstMeasure.ActiveTimeSignature) {
            beatsPerMeasure = firstMeasure.ActiveTimeSignature.Numerator;
            beatUnit = firstMeasure.ActiveTimeSignature.Denominator;
            console.log('Time signature from score:', beatsPerMeasure + '/' + beatUnit);
          }
        }
      } catch (e) {
        console.log('Could not read time signature, using default 4/4');
      }
      
      // Get tempo from the score
      try {
        if (osmd.sheet && osmd.sheet.DefaultStartTempoInBpm) {
          scoreBpm = osmd.sheet.DefaultStartTempoInBpm;
          console.log('Tempo from OSMD DefaultStartTempoInBpm:', scoreBpm);
        }
        // Also try to get from tempo expressions
        if (osmd.sheet && osmd.sheet.TimestampSortedTempoExpressionsList) {
          const tempoList = osmd.sheet.TimestampSortedTempoExpressionsList;
          if (tempoList.length > 0 && tempoList[0].TempoInBpm) {
            scoreBpm = tempoList[0].TempoInBpm;
            console.log('Tempo from expressions:', scoreBpm);
          }
        }
      } catch (e) {
        console.log('Could not read tempo from score, using default:', scoreBpm);
      }
      
      // Calculate beat duration in milliseconds
      // MusicXML tempo is in quarter notes per minute (e.g., quarter=80)
      // But we need to tick per time signature beat unit:
      // - In 4/4, beat unit = 4 (quarter), so tick = quarter = 60000/80 = 750ms
      // - In 7/8, beat unit = 8 (eighth), so tick = eighth = 60000/(80*2) = 375ms
      // Formula: beatDurationMs = 60000 / (scoreBpm * (4 / beatUnit))
      const beatsPerQuarter = 4 / beatUnit; // 4/4=1, 4/8=0.5, 4/2=2
      beatDurationMs = 60000 / (scoreBpm * beatsPerQuarter);
      
      console.log('Beat calculation:', {
        scoreBpm: scoreBpm,
        timeSignature: beatsPerMeasure + '/' + beatUnit,
        beatsPerQuarter: beatsPerQuarter,
        beatDurationMs: beatDurationMs.toFixed(0) + 'ms per ' + (beatUnit === 8 ? 'eighth' : 'quarter')
      });
      
      // Build timeline with beat info
      let index = 0;
      while (!osmd.cursor.iterator.EndReached) {
        const timestamp = osmd.cursor.iterator.currentTimeStamp.RealValue;
        const measureIndex = osmd.cursor.iterator.CurrentMeasureIndex;
        cursorTimeline.push({ timestamp, index, measureIndex });
        osmd.cursor.next();
        index++;
      }
      
      // Reset cursor to beginning
      osmd.cursor.reset();
      osmd.cursor.hide();
      
      // Calculate total beats in the piece
      if (cursorTimeline.length > 0) {
        const lastTimestamp = cursorTimeline[cursorTimeline.length - 1].timestamp;
        const beatValueInWholeNotes = 1 / beatUnit;
        totalBeats = Math.ceil(lastTimestamp / beatValueInWholeNotes) + 1;
      }
      
      console.log('Cursor timeline built:', {
        positions: cursorTimeline.length,
        measures: cursorTimeline.length > 0 ? cursorTimeline[cursorTimeline.length - 1].measureIndex + 1 : 0,
        beatDurationMs: beatDurationMs.toFixed(0),
        totalBeats: totalBeats
      });
      
      // Notify React Native
      sendMessage('timelineBuilt', { 
        positions: cursorTimeline.length,
        scoreBpm: scoreBpm,
        timeSignature: beatsPerMeasure + '/' + beatUnit,
        beatDurationMs: beatDurationMs
      });
    }
    
    // Move cursor to specific index
    function moveCursorToIndex(targetIndex) {
      if (!osmd || !osmd.cursor) return;
      if (targetIndex === currentCursorIndex) return;
      
      // Reset if we need to go backwards
      if (targetIndex < currentCursorIndex) {
        osmd.cursor.reset();
        currentCursorIndex = 0;
      }
      
      // Advance to target
      while (currentCursorIndex < targetIndex && !osmd.cursor.iterator.EndReached) {
        osmd.cursor.next();
        currentCursorIndex++;
      }
    }
    
    // Animation frame loop - now just keeps isScrolling state active
    // Actual scrolling happens directly in advanceCursorByBeat for zero latency
    function smoothScrollFrame() {
      if (!isScrolling) {
        scrollAnimationId = null;
        return;
      }
      // Just keep the loop alive - actual scroll happens in advanceCursorByBeat
      scrollAnimationId = requestAnimationFrame(smoothScrollFrame);
    }
    
    // Start smooth scrolling (sets state, actual scroll in advanceCursorByBeat)
    function startSmoothScroll() {
      // Cancel any existing animation
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
      }
      
      isScrolling = true;
      
      // Start animation loop (just keeps state alive)
      scrollAnimationId = requestAnimationFrame(smoothScrollFrame);
    }
    
    // Stop smooth scrolling
    function stopSmoothScroll() {
      isScrolling = false;
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
      }
    }
    
    // Pause smooth scrolling (keep position)
    function pauseSmoothScroll() {
      isScrolling = false;
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
      }
    }
    
    // Resume smooth scrolling
    function resumeSmoothScroll() {
      isScrolling = true;
      if (!scrollAnimationId) {
        scrollAnimationId = requestAnimationFrame(smoothScrollFrame);
      }
    }
    
    // Scroll the container to keep the cursor visible (instant jump)
    function scrollToCursor() {
      if (!osmd || !osmd.cursor || !osmd.cursor.cursorElement) return;
      
      const container = document.getElementById('container');
      if (!container) return;
      
      try {
        // Get cursor element bounding rect
        const cursorEl = osmd.cursor.cursorElement;
        const cursorRect = cursorEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Calculate where cursor is relative to the scrollable container
        const cursorX = cursorRect.left - containerRect.left + container.scrollLeft;
        
        // Calculate target scroll position
        const leadSpace = containerRect.width * cursorTargetPercent;
        const targetScrollX = Math.max(0, cursorX - leadSpace);
        
        container.scrollTo({
          left: targetScrollX,
          behavior: 'smooth'
        });
      } catch (e) {
        console.log('Scroll to cursor error:', e);
      }
    }
    
    // Reset scroll position to beginning
    function resetScroll() {
      // Stop any ongoing scroll animation
      if (scrollAnimationId) {
        cancelAnimationFrame(scrollAnimationId);
        scrollAnimationId = null;
      }
      isScrolling = false;
      
      const container = document.getElementById('container');
      if (container) {
        container.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
      }
    }
    
    // Calculate which cursor index corresponds to a given beat number
    function getCursorIndexForBeat(beatNumber) {
      if (cursorTimeline.length === 0) return 0;
      
      // Convert beat number to timestamp
      // In OSMD, timestamps are in "whole note" units (1.0 = whole note)
      // The beat value depends on the time signature:
      // - In 4/4: beatUnit=4 → each beat = 1/4 = 0.25 whole notes
      // - In 7/8: beatUnit=8 → each beat = 1/8 = 0.125 whole notes
      const beatValueInWholeNotes = 1 / beatUnit;
      const targetTimestamp = beatNumber * beatValueInWholeNotes;
      
      // Find the cursor position at or just before this beat
      let index = 0;
      for (let i = 0; i < cursorTimeline.length; i++) {
        if (cursorTimeline[i].timestamp <= targetTimestamp + 0.001) { // small epsilon
          index = i;
        } else {
          break;
        }
      }
      return index;
    }
    
    // Beat tick handler - called once per beat
    function onBeatTick() {
      if (playbackState !== 'playing') return;
      
      // Find cursor position for current beat
      const targetIndex = getCursorIndexForBeat(currentBeat);
      
      if (targetIndex !== currentCursorIndex) {
        moveCursorToIndex(targetIndex);
        
        const measureIndex = osmd.cursor.iterator.CurrentMeasureIndex;
        const beatInMeasure = (currentBeat % beatsPerMeasure) + 1;
        
        sendMessage('cursorMoved', { 
          measureNumber: measureIndex + 1,
          beat: beatInMeasure,
          totalBeat: currentBeat,
          cursorIndex: currentCursorIndex
        });
      }
      
      // Advance to next beat
      currentBeat++;
      
      // Check if we've reached the end
      if (currentBeat >= totalBeats) {
        stopPlayback();
        sendMessage('playbackEnded');
      }
    }
    
    // Start playback using beat-based timing
    window.startPlayback = function(tempo, startMeasure, playbackRate) {
      if (!osmd || !osmd.cursor) return;
      if (cursorTimeline.length === 0) {
        buildCursorTimeline();
      }
      
      // Calculate total beats in the piece (based on time signature beat unit)
      if (cursorTimeline.length > 0) {
        const lastTimestamp = cursorTimeline[cursorTimeline.length - 1].timestamp;
        const beatValueInWholeNotes = 1 / beatUnit;
        totalBeats = Math.ceil(lastTimestamp / beatValueInWholeNotes) + 1;
      }
      
      // Calculate beat duration from the USER'S selected tempo, not the score's tempo
      // The tempo parameter is the BPM the user wants to practice at
      const userTempo = tempo || scoreBpm || 120;
      const beatsPerQuarter = 4 / beatUnit; // Adjust for time signature (4/4=1, 7/8=0.5)
      const userBeatDurationMs = 60000 / (userTempo * beatsPerQuarter);
      
      // Apply playback rate (usually 1.0)
      const rateMultiplier = playbackRate || 1.0;
      window.currentPlaybackRate = rateMultiplier;
      const adjustedBeatDuration = userBeatDurationMs / rateMultiplier;
      
      playbackTempo = userTempo;
      playbackState = 'playing';
      playbackStartTime = performance.now();
      
      // Reset cursor
      osmd.cursor.reset();
      currentCursorIndex = 0;
      currentBeat = 0;
      
      // Handle start measure - find first cursor position in that measure
      if (startMeasure && startMeasure > 1) {
        for (let i = 0; i < cursorTimeline.length; i++) {
          if (cursorTimeline[i].measureIndex >= startMeasure - 1) {
            // Calculate which beat this is based on time signature beat unit
            const beatValueInWholeNotes = 1 / beatUnit;
            currentBeat = Math.floor(cursorTimeline[i].timestamp / beatValueInWholeNotes);
            moveCursorToIndex(i);
            break;
          }
        }
      }
      
      osmd.cursor.show();
      
      console.log('Starting beat-based playback:', {
        scoreBpm: scoreBpm,
        timeSignature: beatsPerMeasure + '/' + beatUnit,
        beatDurationMs: adjustedBeatDuration.toFixed(0),
        totalBeats: totalBeats,
        startBeat: currentBeat,
        rateMultiplier: rateMultiplier
      });
      
      sendMessage('playbackStarted', { 
        scoreBpm: scoreBpm,
        timeSignature: beatsPerMeasure + '/' + beatUnit,
        beatDurationMs: adjustedBeatDuration,
        startMeasure: startMeasure || 1 
      });
      
      // Fire first beat immediately
      onBeatTick();
      
      // Start beat interval
      beatIntervalId = setInterval(onBeatTick, adjustedBeatDuration);
      
      // Start smooth scrolling - total duration = beats * beat duration
      const totalScrollDuration = totalBeats * adjustedBeatDuration;
      startSmoothScroll(totalScrollDuration);
    };
    
    // Pause playback
    window.pausePlayback = function() {
      if (playbackState !== 'playing') return;
      
      playbackState = 'paused';
      
      if (beatIntervalId) {
        clearInterval(beatIntervalId);
        beatIntervalId = null;
      }
      
      // Pause scrolling
      pauseSmoothScroll();
      
      sendMessage('playbackPaused');
    };
    
    // Resume playback
    window.resumePlayback = function() {
      if (playbackState !== 'paused') return;
      
      playbackState = 'playing';
      
      // Calculate beat duration from playbackTempo (user's selected tempo)
      const beatsPerQuarter = 4 / beatUnit;
      const userBeatDurationMs = 60000 / (playbackTempo * beatsPerQuarter);
      const rateMultiplier = window.currentPlaybackRate || 1.0;
      const adjustedBeatDuration = userBeatDurationMs / rateMultiplier;
      
      // Restart interval from current beat
      beatIntervalId = setInterval(onBeatTick, adjustedBeatDuration);
      
      // Resume scrolling
      resumeSmoothScroll();
      
      sendMessage('playbackResumed');
    };
    
    // Stop playback
    window.stopPlayback = function() {
      playbackState = 'stopped';
      
      if (beatIntervalId) {
        clearInterval(beatIntervalId);
        beatIntervalId = null;
      }
      
      // Stop scrolling
      stopSmoothScroll();
      
      if (osmd && osmd.cursor) {
        osmd.cursor.reset();
        osmd.cursor.hide();
      }
      currentCursorIndex = 0;
      currentBeat = 0;
      
      sendMessage('playbackStopped');
    };
    
    // Cursor visibility control - use opacity instead of hide() to keep scrolling working
    window.showCursor = function() {
      if (!osmd || !osmd.cursor) return;
      osmd.cursor.show();
      if (osmd.cursor.cursorElement) {
        osmd.cursor.cursorElement.style.opacity = '1';
      }
      sendMessage('cursorShown');
    };

    window.hideCursor = function() {
      if (!osmd || !osmd.cursor) return;
      // Don't actually hide - just make transparent so scrolling still works
      osmd.cursor.show(); // Ensure cursor element exists
      if (osmd.cursor.cursorElement) {
        osmd.cursor.cursorElement.style.opacity = '0';
      }
      sendMessage('cursorHidden');
    };
    
    // Scroll control functions (called from React Native)
    window.startSyncedScroll = function() {
      // Ensure timeline is built (needed for cursor movement)
      if (cursorTimeline.length === 0 || totalBeats === 0) {
        buildCursorTimeline();
      }
      
      startSmoothScroll();
    };
    
    window.pauseSyncedScroll = function() {
      pauseSmoothScroll();
    };
    
    window.stopSyncedScroll = function() {
      stopSmoothScroll();
    };
    
    window.resumeSyncedScroll = function() {
      resumeSmoothScroll();
    };

    window.resetCursor = function() {
      if (!osmd || !osmd.cursor) return;
      osmd.cursor.reset();
      currentCursorIndex = 0;
      currentPlaybackTimestamp = 0;
      // Don't show cursor here - let caller decide visibility
      osmd.cursor.hide();
      // Reset scroll position to beginning
      if (autoScrollEnabled) {
        resetScroll();
      }
      // Set to 0 since we're now showing measure 0 (after resetScroll)
      // This prevents spurious scroll on beat 2 of measure 1
      lastScrolledMeasureIndex = 0;
      sendMessage('cursorReset');
    };

    window.cursorNext = function() {
      if (!osmd || !osmd.cursor) return;
      if (!osmd.cursor.iterator.EndReached) {
        osmd.cursor.next();
        currentCursorIndex++;
        
        // Get current measure index
        const currentMeasureIndex = osmd.cursor.iterator.CurrentMeasureIndex;
        
        // Scroll if:
        // 1. Measure changed (once per measure), OR
        // 2. Cursor is past 70% of visible screen (for long measures)
        if (autoScrollEnabled) {
          const shouldScrollForMeasure = currentMeasureIndex !== lastScrolledMeasureIndex;
          const shouldScrollForPosition = isCursorPastThreshold(0.7);
          
          if (shouldScrollForMeasure || shouldScrollForPosition) {
            lastScrolledMeasureIndex = currentMeasureIndex;
            scrollToCursor();
          }
        }
        
        sendMessage('cursorMoved', { 
          measureNumber: currentMeasureIndex + 1,
          endReached: osmd.cursor.iterator.EndReached
        });
      } else {
        sendMessage('cursorEnd');
      }
    };
    
    // Advance cursor by one beat (based on time signature beat unit)
    // This is the correct method for metronome-synced cursor movement
    // Note: Scroll is autonomous (time-based) and doesn't need beat updates
    window.advanceCursorByBeat = function() {
      if (!osmd || !osmd.cursor) return;
      if (cursorTimeline.length === 0) {
        buildCursorTimeline();
      }
      
      const beatValueInWholeNotes = 1 / beatUnit;
      
      // Advance timestamp first - we're moving TO the next beat
      currentPlaybackTimestamp += beatValueInWholeNotes;
      
      // Find cursor position for updated timestamp
      let targetIndex = 0;
      for (let i = 0; i < cursorTimeline.length; i++) {
        if (cursorTimeline[i].timestamp <= currentPlaybackTimestamp + 0.001) {
          targetIndex = i;
        } else {
          break;
        }
      }
      
      // Check if we've reached the end
      if (cursorTimeline.length > 0) {
        const lastTimestamp = cursorTimeline[cursorTimeline.length - 1].timestamp;
        if (currentPlaybackTimestamp > lastTimestamp + beatValueInWholeNotes) {
          sendMessage('cursorEnd');
          return;
        }
      }
      
      // Move cursor if needed
      if (targetIndex !== currentCursorIndex) {
        moveCursorToIndex(targetIndex);
        
        // Get current measure index
        const currentMeasureIndex = osmd.cursor.iterator.CurrentMeasureIndex;
        
        // Scroll if:
        // 1. Measure changed (once per measure), OR
        // 2. Cursor is past 70% of visible screen (for long measures)
        if (isScrolling && autoScrollEnabled) {
          const shouldScrollForMeasure = currentMeasureIndex !== lastScrolledMeasureIndex;
          const shouldScrollForPosition = isCursorPastThreshold(0.7);
          
          if (shouldScrollForMeasure || shouldScrollForPosition) {
            lastScrolledMeasureIndex = currentMeasureIndex;
            scrollToCursorDirect();
          }
        }
        
        sendMessage('cursorMoved', { 
          measureNumber: currentMeasureIndex + 1,
          timestamp: currentPlaybackTimestamp.toFixed(3),
          cursorIndex: currentCursorIndex
        });
      }
    };
    
    // Check if cursor is past a certain percentage of the visible container width
    function isCursorPastThreshold(threshold) {
      const container = document.getElementById('container');
      if (!container || !osmd || !osmd.cursor || !osmd.cursor.cursorElement) return false;
      
      try {
        const cursorEl = osmd.cursor.cursorElement;
        const cursorRect = cursorEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Cursor position relative to the visible viewport (not scroll content)
        const cursorXInViewport = cursorRect.left - containerRect.left;
        const viewportWidth = containerRect.width;
        
        // Check if cursor is past threshold percentage of visible width
        return cursorXInViewport > viewportWidth * threshold;
      } catch (e) {
        return false;
      }
    }
    
    // Direct scroll to cursor - called synchronously when cursor moves
    function scrollToCursorDirect() {
      const container = document.getElementById('container');
      if (!container || !osmd || !osmd.cursor || !osmd.cursor.cursorElement) return;
      
      try {
        const cursorEl = osmd.cursor.cursorElement;
        const cursorRect = cursorEl.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        // Cursor X relative to the scroll content
        const cursorX = cursorRect.left - containerRect.left + container.scrollLeft;
        
        // Target scroll = cursor position - lead space (keep cursor at 20% from left)
        const leadSpace = containerRect.width * cursorTargetPercent;
        const targetScrollX = Math.max(0, cursorX - leadSpace);
        
        // Set directly, no animation
        container.scrollLeft = targetScrollX;
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Reset playback timestamp (called by resetCursor)
    window.resetPlaybackTimestamp = function() {
      currentPlaybackTimestamp = 0;
      lastScrolledMeasureIndex = 0; // We're at measure 0, so mark it as scrolled
    };

    window.cursorToMeasure = function(measureNumber) {
      if (!osmd || !osmd.cursor) return;
      osmd.cursor.reset();
      currentCursorIndex = 0;
      // Move to the specified measure
      while (!osmd.cursor.iterator.EndReached && 
             osmd.cursor.iterator.CurrentMeasureIndex < measureNumber - 1) {
        osmd.cursor.next();
        currentCursorIndex++;
      }
      osmd.cursor.show();
      // Update last scrolled measure to match where we jumped to
      lastScrolledMeasureIndex = osmd.cursor.iterator.CurrentMeasureIndex;
      sendMessage('cursorMoved', { measureNumber });
    };

    // Apply highlight overlays to uncertain measures
    function applyHighlights() {
      if (!osmd || !highlightMeasures.length) return;

      const svgContainer = document.querySelector('#osmd-container svg');
      if (!svgContainer) return;

      // Get all measure elements
      const measureBoundingBoxes = osmd.GraphicSheet.MeasureList;
      
      highlightMeasures.forEach(function(highlight) {
        try {
          // OSMD indexes are 0-based, measure numbers are 1-based
          const measureIndex = highlight.measureNumber - 1;
          const partIndex = highlight.partIndex || 0;
          
          if (measureIndex >= 0 && measureIndex < measureBoundingBoxes.length) {
            const measureList = measureBoundingBoxes[measureIndex];
            if (measureList && measureList[partIndex]) {
              const staffEntry = measureList[partIndex];
              const bbox = staffEntry.PositionAndShape;
              
              if (bbox) {
                // Create highlight rectangle
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                const units = osmd.GraphicSheet.units;
                
                rect.setAttribute('x', bbox.AbsolutePosition.x * units);
                rect.setAttribute('y', bbox.AbsolutePosition.y * units);
                rect.setAttribute('width', bbox.Size.width * units);
                rect.setAttribute('height', bbox.Size.height * units);
                rect.setAttribute('class', 
                  highlight.confidence && highlight.confidence < 0.5 
                    ? 'highlight-measure highlight-measure-low' 
                    : 'highlight-measure'
                );
                rect.setAttribute('data-measure', highlight.measureNumber);
                rect.setAttribute('data-part', partIndex);
                
                svgContainer.appendChild(rect);
              }
            }
          }
        } catch (e) {
          console.warn('Failed to highlight measure', highlight.measureNumber, e);
        }
      });
    }

    // Add click handlers to measures
    function addMeasureClickHandlers() {
      if (!osmd) return;

      const svgContainer = document.querySelector('#osmd-container svg');
      if (!svgContainer) return;

      // Add touch handler
      svgContainer.addEventListener('click', function(event) {
        const rect = event.target.closest('.highlight-measure');
        if (rect) {
          const measureNumber = parseInt(rect.getAttribute('data-measure'), 10);
          const partIndex = parseInt(rect.getAttribute('data-part'), 10);
          sendMessage('measureTap', { measureNumber, partIndex });
        }
      });
    }

    // Show error message
    function showError(message) {
      const container = document.getElementById('osmd-container');
      if (container) {
        container.innerHTML = \`
          <div class="error">
            <div class="error-icon">⚠️</div>
            <div>\${message}</div>
          </div>
        \`;
      }
      sendMessage('error', message);
    }

    // Wait for OSMD library to load
    function waitForOsmd(callback, maxAttempts) {
      maxAttempts = maxAttempts || 50; // 5 seconds max
      let attempts = 0;
      
      function check() {
        if (typeof opensheetmusicdisplay !== 'undefined') {
          callback();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(check, 100);
        } else {
          showError('Music renderer failed to load. Check your internet connection.');
        }
      }
      
      check();
    }

    // Initialize when DOM and OSMD are ready
    function startup() {
      waitForOsmd(function() {
        sendMessage('ready');
        // If we received MusicXML before OSMD was ready, render it now
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
