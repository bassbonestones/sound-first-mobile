/**
 * useExerciseAudioContext - Hook for managing exercise audio context lifecycle
 *
 * Provides a unified way to initialize audio context with:
 * - Loading state tracking
 * - Error handling
 * - Automatic cleanup on unmount
 *
 * Usage:
 * const { audioContext, isAudioReady, audioError } = useExerciseAudioContext();
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { createAudioContext, cleanupAudioContext } from "./audioHelpers";
import { devError } from "../../../../../utils/devLogger";

/**
 * Hook for managing audio context in exercises
 * @returns {Object} { audioContext, isAudioReady, audioError, retryAudioInit }
 */
export function useExerciseAudioContext() {
  const audioContextRef = useRef(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const mountedRef = useRef(true);

  const initAudio = useCallback(() => {
    try {
      setAudioError(null);
      audioContextRef.current = createAudioContext();

      if (audioContextRef.current) {
        // On some platforms, we need to resume the context
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().then(() => {
            if (mountedRef.current) {
              setIsAudioReady(true);
            }
          });
        } else {
          setIsAudioReady(true);
        }
      } else {
        setAudioError(new Error("Audio context not available"));
      }
    } catch (error) {
      devError("Audio init error:", error);
      if (mountedRef.current) {
        setAudioError(error);
      }
    }
  }, []);

  const retryAudioInit = useCallback(() => {
    setIsAudioReady(false);
    if (audioContextRef.current) {
      cleanupAudioContext(audioContextRef.current);
      audioContextRef.current = null;
    }
    initAudio();
  }, [initAudio]);

  useEffect(() => {
    mountedRef.current = true;
    initAudio();

    return () => {
      mountedRef.current = false;
      if (audioContextRef.current) {
        cleanupAudioContext(audioContextRef.current);
        audioContextRef.current = null;
      }
    };
  }, [initAudio]);

  return {
    audioContext: audioContextRef.current,
    audioContextRef,
    isAudioReady,
    audioError,
    retryAudioInit,
  };
}

export default useExerciseAudioContext;
