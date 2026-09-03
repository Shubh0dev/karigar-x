/**
 * useSpeechRecognition — Custom React hook for the Web Speech API.
 *
 * Uses the free browser-native SpeechRecognition API (Chrome/Safari).
 * Supports Hindi (hi-IN) and English (en-IN) via the lang parameter.
 * Provides graceful fallback when the API is not available.
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Extend Window interface for Speech API (not in all TS libs)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export function useSpeechRecognition(): SpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Check browser support
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = useCallback(
    (lang: string = "en-IN") => {
      if (!isSupported) {
        setError("Speech recognition is not supported in this browser.");
        return;
      }

      setError(null);
      setInterimTranscript("");

      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition;

        const recognition = new SpeechRecognition();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalText = "";
          let interimText = "";

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            if (result.isFinal) {
              finalText += result[0].transcript + " ";
            } else {
              interimText += result[0].transcript;
            }
          }

          if (finalText.trim()) {
            setTranscript((prev) => {
              // Avoid duplicating what we already have
              const newPart = finalText.trim();
              if (prev.endsWith(newPart)) return prev;
              return prev ? `${prev} ${newPart}` : newPart;
            });
          }
          setInterimTranscript(interimText);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === "no-speech") {
            // Benign — just no speech detected, don't treat as error
            return;
          }
          if (event.error === "aborted") {
            // User or system stopped it
            return;
          }
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript("");
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err: any) {
        setError(`Failed to start speech recognition: ${err.message || err}`);
        setIsListening(false);
      }
    },
    [isSupported]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
