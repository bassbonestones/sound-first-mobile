import React, { useEffect, useRef, useState } from "react";
import { View, Text, Platform, ActivityIndicator } from "react-native";

/**
 * NotationDisplay Component
 * 
 * Renders MusicXML notation using OpenSheetMusicDisplay (OSMD) on web.
 * On mobile, displays a placeholder since WebView integration is needed.
 */

export default function NotationDisplay({ 
  musicxml, 
  width = 320, 
  height = 200,
  showTitle = false,
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
      script.src = "https://cdn.jsdelivr.net/npm/opensheetmusicdisplay@1.8.6/build/opensheetmusicdisplay.min.js";
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

      try {
        const { OpenSheetMusicDisplay } = window.opensheetmusicdisplay;
        
        // ALWAYS clear the container before creating a new instance
        // (This prevents concatenation of multiple staves on re-render)
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
          // Set a fixed zoom to stabilize rendering
          osmdRef.current.zoom = 0.7;
          osmdRef.current.render();
          
          // Force consistent positioning by fixing the SVG
          const svgElement = containerRef.current.querySelector('svg');
          if (svgElement) {
            // Fix size
            svgElement.style.width = `${width - 20}px`;
            svgElement.style.height = `${height}px`;
            svgElement.style.maxWidth = `${width - 20}px`;
            svgElement.style.maxHeight = `${height}px`;
            // Fix position at top-left
            svgElement.style.position = 'absolute';
            svgElement.style.top = '10px';
            svgElement.style.left = '10px';
            // Ensure no overflow creates sizing issues
            svgElement.style.overflow = 'hidden';
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
  }, [musicxml, showTitle]);

  // Mobile fallback
  if (Platform.OS !== "web") {
    return (
      <View style={{
        width,
        height: 80,
        backgroundColor: "#2d232e",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#5a4a3a",
      }}>
        <Text style={{ color: "#bfa76a", fontSize: 12, textAlign: "center" }}>
          🎼 Notation available on web
        </Text>
        <Text style={{ color: "#666", fontSize: 10, marginTop: 4 }}>
          WebView integration needed for mobile
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{
        width,
        height: 60,
        backgroundColor: "#2d232e",
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#c0392b",
      }}>
        <Text style={{ color: "#c0392b", fontSize: 12 }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ 
      width, 
      height, 
      overflow: 'hidden',
      position: 'relative',
    }}>
      {loading && (
        <View style={{
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
        }}>
          <ActivityIndicator color="#FFD700" />
          <Text style={{ color: "#bfa76a", fontSize: 12, marginTop: 8 }}>
            Loading notation...
          </Text>
        </View>
      )}
      <View
        ref={containerRef}
        style={{
          position: 'absolute',
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
export function NotationPlaceholder({ message = "Notation hidden - practice by ear" }) {
  return (
    <View style={{
      backgroundColor: "#2d232e",
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#5a4a3a",
    }}>
      <Text style={{ color: "#FFD700", fontSize: 24, marginBottom: 4 }}>🎧</Text>
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
