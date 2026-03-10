import React, { useEffect, useRef, useState, useMemo } from "react";
import { View, Text, Platform, ActivityIndicator } from "react-native";

// Conditionally import WebView for native platforms
let WebView = null;
if (Platform?.OS && Platform.OS !== "web") {
  try {
    const RNWebView = require("react-native-webview");
    WebView = RNWebView?.WebView || null;
  } catch (e) {
    // WebView not available, that's OK
  }
}

/**
 * NotationDisplay Component
 *
 * Renders MusicXML notation using OpenSheetMusicDisplay (OSMD).
 * Uses WebView on mobile, direct DOM on web.
 */

export default function NotationDisplay({
  musicxml,
  width = 320,
  height = 200,
  showTitle = false,
  zoom = 0.7,
}) {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (Platform.OS !== "web") {
      setLoading(false);
      return;
    }

    // Load OSMD script dynamically
    const loadOSMD = async () => {
      if (typeof window === "undefined") return;

      // Check if OSMD is already loaded
      if (window.opensheetmusicdisplay) {
        initializeOSMD();
        return;
      }

      // Load OSMD from CDN
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js";
      script.async = true;
      script.onload = () => {
        initializeOSMD();
      };
      script.onerror = () => {
        setError("Failed to load notation library");
        setLoading(false);
      };
      document.head.appendChild(script);
    };

    const initializeOSMD = async () => {
      if (!containerRef.current || !window.opensheetmusicdisplay) {
        setLoading(false);
        return;
      }

      // Check again after any async operations - component may have unmounted
      if (!containerRef.current) {
        setLoading(false);
        return;
      }

      try {
        const { OpenSheetMusicDisplay } = window.opensheetmusicdisplay;

        // ALWAYS clear the container before creating a new instance
        // (This prevents concatenation of multiple staves on re-render)
        if (!containerRef.current) return; // Guard against unmount
        containerRef.current.innerHTML = "";
        osmdRef.current = null;

        // Create OSMD instance with fixed sizing
        osmdRef.current = new OpenSheetMusicDisplay(containerRef.current, {
          autoResize: false,
          drawTitle: showTitle,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: false,
          renderSingleHorizontalStaffline: true,
          fixedMeasureWidth: true,
        });

        // Set rendering options for dark theme
        osmdRef.current.EngravingRules.PageBackgroundColor = "transparent";
        // Fix the staff size to prevent jumping
        osmdRef.current.EngravingRules.PageLeftMargin = 0;
        osmdRef.current.EngravingRules.PageRightMargin = 0;
        osmdRef.current.EngravingRules.PageTopMargin = 0;
        osmdRef.current.EngravingRules.PageBottomMargin = 0;
        osmdRef.current.EngravingRules.SheetMinimumDistanceBetweenSystems = 0;
        osmdRef.current.EngravingRules.MinimumDistanceBetweenSystems = 0;

        // Load and render with fixed width
        if (musicxml) {
          await osmdRef.current.load(musicxml);
          // Check if still mounted after async load
          if (!containerRef.current) {
            setLoading(false);
            return;
          }
          // Set a fixed zoom to stabilize rendering
          osmdRef.current.zoom = zoom;
          osmdRef.current.render();

          // Force consistent positioning by fixing the SVG
          if (!containerRef.current) return; // Guard after render
          const svgElement = containerRef.current.querySelector("svg");
          if (svgElement) {
            // Fix size
            svgElement.style.width = `${width - 20}px`;
            svgElement.style.height = `${height}px`;
            svgElement.style.maxWidth = `${width - 20}px`;
            svgElement.style.maxHeight = `${height}px`;
            // Fix position at top-left
            svgElement.style.position = "absolute";
            svgElement.style.top = "10px";
            svgElement.style.left = "10px";
            // Ensure no overflow creates sizing issues
            svgElement.style.overflow = "hidden";
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("OSMD error:", err);
        setError("Failed to render notation");
        setLoading(false);
      }
    };

    loadOSMD();

    return () => {
      if (osmdRef.current) {
        osmdRef.current = null;
      }
    };
  }, [musicxml, showTitle, zoom]);

  // Generate HTML for WebView (mobile)
  const webviewHtml = useMemo(() => {
    if (Platform.OS === "web" || !musicxml) return "";

    // Escape the MusicXML for embedding in JavaScript
    const escapedXml = musicxml
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$/g, "\\$");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: transparent; 
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    #osmd-container { 
      width: 100%; 
      max-width: ${width - 20}px;
    }
    #osmd-container svg {
      width: 100% !important;
      height: auto !important;
    }
    #loading {
      color: #bfa76a;
      font-family: sans-serif;
      font-size: 14px;
      text-align: center;
    }
    #error {
      color: #c0392b;
      font-family: sans-serif;
      font-size: 12px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="osmd-container">
    <div id="loading">Loading notation...</div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js"></script>
  <script>
    (async function() {
      try {
        const container = document.getElementById('osmd-container');
        const loadingDiv = document.getElementById('loading');
        
        const osmd = new opensheetmusicdisplay.OpenSheetMusicDisplay(container, {
          autoResize: false,
          drawTitle: ${showTitle},
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawCredits: false,
          drawPartNames: false,
          drawPartAbbreviations: false,
          drawMeasureNumbers: false,
          drawTimeSignatures: false,
          renderSingleHorizontalStaffline: true,
        });
        
        osmd.EngravingRules.PageBackgroundColor = "transparent";
        osmd.EngravingRules.PageLeftMargin = 0;
        osmd.EngravingRules.PageRightMargin = 0;
        osmd.EngravingRules.PageTopMargin = 0;
        osmd.EngravingRules.PageBottomMargin = 0;
        
        const musicxml = \`${escapedXml}\`;
        await osmd.load(musicxml);
        osmd.zoom = ${zoom};
        osmd.render();
        
        if (loadingDiv) loadingDiv.remove();
      } catch (e) {
        document.getElementById('osmd-container').innerHTML = 
          '<div id="error">Failed to render: ' + e.message + '</div>';
      }
    })();
  </script>
</body>
</html>`;
  }, [musicxml, width, showTitle, zoom]);

  // Mobile: use WebView
  if (Platform.OS !== "web") {
    if (!musicxml) {
      return (
        <View
          style={{
            width,
            height,
            backgroundColor: "#2d232e",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#5a4a3a",
          }}
        >
          <Text style={{ color: "#666", fontSize: 12 }}>No notation data</Text>
        </View>
      );
    }

    return (
      <View
        style={{
          width,
          height,
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "transparent",
        }}
      >
        <WebView
          source={{ html: webviewHtml }}
          style={{
            width,
            height,
            backgroundColor: "transparent",
          }}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          originWhitelist={["*"]}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mixedContentMode="always"
        />
      </View>
    );
  }

  // Web: use direct DOM (existing code)
  if (error) {
    return (
      <View
        style={{
          width,
          height: 60,
          backgroundColor: "#2d232e",
          borderRadius: 12,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "#c0392b",
        }}
      >
        <Text style={{ color: "#c0392b", fontSize: 12 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width,
        height,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#2d232e",
            borderRadius: 12,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <ActivityIndicator color="#FFD700" />
          <Text style={{ color: "#bfa76a", fontSize: 12, marginTop: 8 }}>
            Loading notation...
          </Text>
        </View>
      )}
      <View
        ref={containerRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          backgroundColor: "#fffbe6",
          borderRadius: 8,
          overflow: "hidden",
        }}
      />
    </View>
  );
}

/**
 * Simple notation placeholder when show_notation is false
 */
export function NotationPlaceholder({
  message = "Notation hidden - practice by ear",
}) {
  return (
    <View
      style={{
        backgroundColor: "#2d232e",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#5a4a3a",
      }}
    >
      <Text style={{ color: "#FFD700", fontSize: 24, marginBottom: 4 }}>
        🎧
      </Text>
      <Text style={{ color: "#bfa76a", fontSize: 13, textAlign: "center" }}>
        {message}
      </Text>
    </View>
  );
}

/**
 * Sample MusicXML for testing
 */
export const SAMPLE_MUSICXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <part-list>
    <score-part id="P1">
      <part-name>Music</part-name>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>0</fifths>
        </key>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
      <note>
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>1</duration>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>`;
