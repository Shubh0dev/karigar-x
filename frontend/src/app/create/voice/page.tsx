"use client";

/**
 * Voice Story Cataloguer — Intelligent Artisan Interview
 *
 * A guided, Hindi-first conversational interview that collects structured
 * product information from an artisan via voice. No hallucination: only
 * values explicitly stated by the artisan (or detected by existing AI
 * image analysis) are stored.
 *
 * Uses: Web Speech API (free, browser-native) for STT + TTS.
 * Feeds: existing generateCatalogue() and Smart Pricing productDraft state.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  Globe,
  Volume2,
  CheckCircle2,
  ChevronRight,
  Edit3,
  User,
  Eye,
  HelpCircle,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AIProcessingAnimation } from "@/components/ui/AIProcessingAnimation";
import { useDemo } from "@/context/DemoContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { generateCatalogue } from "@/lib/api";
import { sampleVoiceTranscripts } from "@/lib/mockData";
import { VoiceInterviewData } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW QUESTIONS
// ─────────────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  hindiText: string;
  englishLabel: string;
  fields: (keyof VoiceInterviewData)[];
  hindiHint: string;
}

const QUESTIONS: Question[] = [
  {
    id: "product",
    hindiText: "सबसे पहले, यह उत्पाद क्या है? इसे आप क्या नाम देते हैं?",
    englishLabel: "Product Name & Type",
    fields: ["product_name", "product_type"],
    hindiHint: "जैसे: बाँस की टोकरी, मिट्टी का घड़ा, ऊनी शॉल...",
  },
  {
    id: "material",
    hindiText: "इस उत्पाद को बनाने में कौन-कौन सी सामग्री इस्तेमाल हुई है?",
    englishLabel: "Materials Used",
    fields: ["materials"],
    hindiHint: "जैसे: बाँस, सूत, मिट्टी, ऊन, पीतल...",
  },
  {
    id: "time",
    hindiText: "इस एक उत्पाद को बनाने में लगभग कितने घंटे या कितने दिन लगते हैं?",
    englishLabel: "Production Time",
    fields: ["production_time", "production_time_hours"],
    hindiHint: "जैसे: दो दिन, छह घंटे, एक हफ्ता...",
  },
  {
    id: "people",
    hindiText: "इस उत्पाद को बनाने में कितने लोग शामिल होते हैं?",
    englishLabel: "People Involved",
    fields: ["people_involved"],
    hindiHint: "जैसे: मैं अकेला, दो लोग, पूरा परिवार...",
  },
  {
    id: "technique",
    hindiText: "इसे बनाने का मुख्य तरीका या कारीगरी क्या है?",
    englishLabel: "Craft Technique",
    fields: ["craft_technique", "production_process"],
    hindiHint: "जैसे: हाथ से बुनाई, चाक पर बनाना, लॉस्ट-वैक्स ढलाई...",
  },
  {
    id: "size",
    hindiText: "इसका आकार कितना है और इसकी कोई खासियत है जो ग्राहक को पता होनी चाहिए?",
    englishLabel: "Size & Unique Features",
    fields: ["dimensions", "unique_features"],
    hindiHint: "जैसे: बारह इंच, पाँच किलो, खास रंग या डिज़ाइन...",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTION ENGINE (client-side, Hindi regex, no hallucination)
// ─────────────────────────────────────────────────────────────────────────────

const HINDI_NUMBERS: Record<string, number> = {
  एक: 1, दो: 2, तीन: 3, चार: 4, पाँच: 5, पांच: 5,
  छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9, दस: 10,
  ग्यारह: 11, बारह: 12, तेरह: 13, चौदह: 14, पंद्रह: 15,
  बीस: 20, पच्चीस: 25, तीस: 30, पैंतीस: 35, चालीस: 40,
  पचास: 50, साठ: 60, सत्तर: 70, अस्सी: 80, नब्बे: 90,
  सौ: 100,
};

function resolveHindiNumber(text: string): number | null {
  const lower = text.trim().toLowerCase();
  if (HINDI_NUMBERS[lower] !== undefined) return HINDI_NUMBERS[lower];
  const parsed = parseInt(lower, 10);
  return isNaN(parsed) ? null : parsed;
}

function extractNumber(text: string): number | null {
  // Match digit sequences first
  const digitMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (digitMatch) return parseFloat(digitMatch[1]);
  // Match Hindi words
  for (const [word, val] of Object.entries(HINDI_NUMBERS)) {
    if (text.includes(word)) return val;
  }
  return null;
}

/**
 * Pure client-side extractor. Takes accumulated transcript text,
 * returns a partial VoiceInterviewData. Only populates fields that
 * are explicitly mentioned — never invents values.
 */
function extractFromTranscript(text: string): Partial<VoiceInterviewData> {
  const result: Partial<VoiceInterviewData> = {};
  const provided: Record<string, boolean> = {};
  const t = text.toLowerCase();

  // ── 1. PRODUCT NAME & TYPE ────────────────────────────────────────────────
  // Patterns: "ये X है", "यह X है", "X बना रहा हूँ", "X बनाते हैं"
  const productPatterns = [
    /(?:ये|यह|यही)\s+(.{2,30}?)\s+(?:है|हैं|बनाई|बनाया)/,
    /(.{2,30}?)\s+(?:बना\s*रहा|बनाते|बनाई|बनाया)/,
  ];
  for (const pat of productPatterns) {
    const m = text.match(pat);
    if (m) {
      const raw = m[1].trim();
      // Split "बाँस की टोकरी" → product_type=टोकरी, full name kept
      result.product_name = raw;
      const parts = raw.split(/\s+की\s+|\s+का\s+|\s+के\s+/);
      result.product_type = parts[parts.length - 1].trim() || raw;
      provided["product_name"] = true;
      provided["product_type"] = true;
      break;
    }
  }

  // ── 2. MATERIALS ─────────────────────────────────────────────────────────
  // Patterns: "बाँस और सूत", "बाँस, मिट्टी और ऊन", "X का इस्तेमाल"
  const materialSection =
    text.match(/(?:सामग्री|माल|इस्तेमाल|बना(?:या|ई|ते)?(?:\s+है)?[^।]*?)([^।]+)/)?.[1] ||
    text.match(/(?:बाँस|सूत|मिट्टी|ऊन|पीतल|लकड़ी|धागा|रेशम|कपास|clay|bamboo|wool)[^।]*/i)?.[0] ||
    "";

  const knownMaterials = [
    "बाँस","बांस","सूत","धागा","मिट्टी","ऊन","पीतल","लकड़ी",
    "रेशम","कपास","कपड़ा","तार","चाँदी","सोना","ताँबा",
    "bamboo","wool","clay","brass","wood","cotton","silk","thread",
  ];
  const foundMaterials: string[] = [];
  for (const mat of knownMaterials) {
    if (t.includes(mat.toLowerCase())) {
      foundMaterials.push(mat);
    }
  }
  // Also parse from "X और Y का इस्तेमाल"
  const matPattern = text.match(/(?:में\s+)?(.+?)\s+(?:का|की|के)\s+इस्तेमाल/);
  if (matPattern) {
    const matList = matPattern[1]
      .split(/और|व|,|तथा/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const m of matList) {
      if (!foundMaterials.includes(m)) foundMaterials.push(m);
    }
  }
  if (foundMaterials.length > 0) {
    result.materials = Array.from(new Set(foundMaterials));
    provided["materials"] = true;
  }

  // ── 3. PRODUCTION TIME ────────────────────────────────────────────────────
  // Use Unicode range \u0900-\u097F to match Devanagari words (दो, तीन, बारह…)
  const HI = "[\u0900-\u097F\\w]+";
  const dayMatch =
    text.match(new RegExp(`(?:लगभग\\s+)?(${HI})\\s+दिन`)) ||
    text.match(/(\d+)\s*दिन/);
  const hourMatch =
    text.match(new RegExp(`(?:लगभग\\s+)?(${HI})\\s+घंटे?`)) ||
    text.match(/(\d+)\s*घंटे?/);
  const weekMatch = text.match(new RegExp(`(?:लगभग\\s+)?(${HI})\\s+(?:हफ्ता|सप्ताह)`));

  if (dayMatch) {
    const days = resolveHindiNumber(dayMatch[1]) ?? extractNumber(dayMatch[1]);
    if (days !== null) {
      result.production_time = `${days} दिन`;
      result.production_time_hours = days * 24;
      provided["production_time"] = true;
      provided["production_time_hours"] = true;
    }
  } else if (weekMatch) {
    const weeks = resolveHindiNumber(weekMatch[1]) ?? extractNumber(weekMatch[1]);
    if (weeks !== null) {
      result.production_time = `${weeks} हफ्ता`;
      result.production_time_hours = weeks * 7 * 8; // 8 working hours/day
      provided["production_time"] = true;
      provided["production_time_hours"] = true;
    }
  } else if (hourMatch) {
    const hours = resolveHindiNumber(hourMatch[1]) ?? extractNumber(hourMatch[1]);
    if (hours !== null) {
      result.production_time = `${hours} घंटे`;
      result.production_time_hours = hours;
      provided["production_time"] = true;
      provided["production_time_hours"] = true;
    }
  }

  // ── 4. PEOPLE INVOLVED ───────────────────────────────────────────────────
  const peopleMatch =
    text.match(new RegExp(`(?:हम\\s+)?(${HI})\\s+लोग`)) ||
    text.match(/(\d+)\s+लोग/) ||
    text.match(new RegExp(`(${HI})\\s+(?:लोग|व्यक्ति|कारीगर)`));
  if (peopleMatch) {
    const n = resolveHindiNumber(peopleMatch[1]) ?? extractNumber(peopleMatch[1]);
    if (n !== null) {
      result.people_involved = n;
      provided["people_involved"] = true;
    }
  } else if (t.includes("अकेला") || t.includes("अकेले") || t.includes("खुद")) {
    result.people_involved = 1;
    provided["people_involved"] = true;
  }

  // ── 5. CRAFT TECHNIQUE ───────────────────────────────────────────────────
  const techniqueKeywords: [string, string][] = [
    ["हाथ से बुन", "हाथ से बुनाई"],
    ["हाथ बुन", "हाथ से बुनाई"],
    ["हाथ से", "हस्तनिर्मित"],
    ["चाक", "चाक पर निर्माण"],
    ["भट्ठ", "भट्ठे में पकाना"],
    ["ढलाई", "धातु ढलाई"],
    ["कढ़ाई", "कढ़ाई"],
    ["बुनाई", "बुनाई"],
    ["नक्काशी", "नक्काशी"],
    ["रंगाई", "रंगाई"],
    ["लॉस्ट-वैक्स", "लॉस्ट-वैक्स ढलाई"],
    ["मोल्ड", "मोल्डिंग"],
    ["ब्लॉक प्रिंट", "ब्लॉक प्रिंटिंग"],
  ];
  for (const [kw, technique] of techniqueKeywords) {
    if (t.includes(kw.toLowerCase())) {
      result.craft_technique = technique;
      result.production_process = technique;
      provided["craft_technique"] = true;
      provided["production_process"] = true;
      break;
    }
  }

  // ── 6. DIMENSIONS ────────────────────────────────────────────────────────
  const dimPatterns = [
    new RegExp(`(?:लगभग\\s+)?(${HI})\\s+(?:इंच|inch)`),
    /(?:लगभग\s+)?(\d+(?:\.\d+)?)\s*(?:cm|सेमी|सेंटीमीटर)/i,
    /(?:लगभग\s+)?(\d+(?:\.\d+)?)\s*(?:mm|मिमी)/i,
    new RegExp(`(?:लगभग\\s+)?(${HI})\\s+(?:किलो|kg)`),
    /(\d+)\s*[xX×]\s*(\d+)/,
  ];
  for (const pat of dimPatterns) {
    const m = text.match(pat);
    if (m) {
      if (m[2]) {
        // Two-part dimension like 12x8
        result.dimensions = `${m[1]} × ${m[2]}`;
      } else {
        const num = resolveHindiNumber(m[1]) ?? extractNumber(m[1]);
        const unit = text.match(/इंच|inch/i)
          ? "inch"
          : text.match(/सेमी|सेंटीमीटर|cm/i)
          ? "cm"
          : text.match(/किलो|kg/i)
          ? "kg"
          : "";
        if (num !== null) result.dimensions = `${num} ${unit}`.trim();
      }
      provided["dimensions"] = true;
      break;
    }
  }

  // ── ARTISAN STORY (full concatenated text) ───────────────────────────────
  result.artisan_story = text.trim();
  result.artisan_provided = provided;
  result.needs_confirmation = [];

  return result;
}

/**
 * Merge a partial extraction into the running accumulated data.
 * Never overwrites an already-confirmed artisan-provided field.
 */
function mergeExtracted(
  current: VoiceInterviewData,
  incoming: Partial<VoiceInterviewData>
): VoiceInterviewData {
  const merged = { ...current };
  const incomingProvided = incoming.artisan_provided ?? {};

  for (const key of Object.keys(incoming) as (keyof VoiceInterviewData)[]) {
    if (key === "artisan_provided" || key === "needs_confirmation" || key === "artisan_story") continue;
    const val = incoming[key];
    if (val === undefined || val === null || val === "") continue;
    if (Array.isArray(val) && (val as unknown[]).length === 0) continue;
    // Don't overwrite confirmed artisan-provided fields
    if (merged.artisan_provided[key] && !incomingProvided[key]) continue;
    (merged as Record<string, unknown>)[key] = val;
    if (incomingProvided[key]) merged.artisan_provided[key] = true;
  }
  if (incoming.artisan_story && incoming.artisan_story.length > (merged.artisan_story?.length ?? 0)) {
    merged.artisan_story = incoming.artisan_story;
  }
  return merged;
}

function emptyInterview(): VoiceInterviewData {
  return {
    product_name: "",
    product_type: "",
    materials: [],
    production_time: "",
    production_time_hours: null,
    people_involved: null,
    craft_technique: "",
    production_process: "",
    dimensions: "",
    unique_features: [],
    artisan_story: "",
    artisan_provided: {},
    needs_confirmation: [],
  };
}

/**
 * Given the current collected data, determine which question indices
 * still need to be asked.
 */
function getRemainingQuestions(data: VoiceInterviewData): number[] {
  const checks: Record<string, boolean> = {
    product: !!data.product_name,
    material: data.materials.length > 0,
    time: !!data.production_time,
    people: data.people_involved !== null,
    technique: !!data.craft_technique,
    size: !!data.dimensions,
  };
  return QUESTIONS.map((q, i) => ({ q, i }))
    .filter(({ q }) => !checks[q.id])
    .map(({ i }) => i);
}

// ─────────────────────────────────────────────────────────────────────────────
// TTS helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Speak a Hindi text via browser SpeechSynthesis.
 * Returns the utterance so callers can hook .onend.
 */
function speakHindi(text: string): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "hi-IN";
  utt.rate = 0.82;
  window.speechSynthesis.speak(utt);
  return utt;
}

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW CARD — field label mapping
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewField {
  key: keyof VoiceInterviewData;
  hindiLabel: string;
  englishLabel: string;
  renderValue: (v: VoiceInterviewData) => string;
}

const REVIEW_FIELDS: ReviewField[] = [
  {
    key: "product_name",
    hindiLabel: "उत्पाद",
    englishLabel: "Product",
    renderValue: (v) => v.product_name || "—",
  },
  {
    key: "materials",
    hindiLabel: "सामग्री",
    englishLabel: "Materials",
    renderValue: (v) => v.materials.join(", ") || "—",
  },
  {
    key: "production_time",
    hindiLabel: "बनाने का समय",
    englishLabel: "Production Time",
    renderValue: (v) =>
      v.production_time
        ? `${v.production_time}${v.production_time_hours ? ` (~${v.production_time_hours}h)` : ""}`
        : "—",
  },
  {
    key: "people_involved",
    hindiLabel: "लोग",
    englishLabel: "People",
    renderValue: (v) => (v.people_involved !== null ? `${v.people_involved} लोग` : "—"),
  },
  {
    key: "craft_technique",
    hindiLabel: "कारीगरी",
    englishLabel: "Craft Technique",
    renderValue: (v) => v.craft_technique || "—",
  },
  {
    key: "dimensions",
    hindiLabel: "आकार",
    englishLabel: "Dimensions",
    renderValue: (v) => v.dimensions || "—",
  },
  {
    key: "unique_features",
    hindiLabel: "खासियत",
    englishLabel: "Unique Features",
    renderValue: (v) => v.unique_features.join(", ") || "—",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type Phase = "intro" | "asking" | "listening" | "confirming" | "review" | "generating";

export default function VoiceStoryCataloguerPage() {
  const router = useRouter();
  const { language, productDraft, updateProductDraft, showToast } = useDemo();
  const speech = useSpeechRecognition();

  const [voiceLang] = useState<"hi" | "en">("hi"); // Hindi default, kept for speech
  const [phase, setPhase] = useState<Phase>("intro");
  const [displayLang, setDisplayLang] = useState<"hi" | "en">("hi");

  // Countdown before auto-mic (shown during "asking" phase)
  const [countdown, setCountdown] = useState<number | null>(null);
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Interview state
  const [collected, setCollected] = useState<VoiceInterviewData>(emptyInterview());
  const [remainingQIdx, setRemainingQIdx] = useState<number[]>([0, 1, 2, 3, 4, 5]);
  const [currentQPointer, setCurrentQPointer] = useState(0); // index into remainingQIdx
  const [answerTranscript, setAnswerTranscript] = useState(""); // for current question
  const [allTranscripts, setAllTranscripts] = useState<string[]>([]); // per-question
  const [lastExtracted, setLastExtracted] = useState<Partial<VoiceInterviewData>>({});

  // Refs for stable callbacks
  const speechRef = useRef(speech);
  useEffect(() => { speechRef.current = speech; }, [speech]);

  // Sync interim speech into answer transcript
  useEffect(() => {
    if (speech.transcript && phase === "listening") {
      setAnswerTranscript(speech.transcript.trim());
    }
  }, [speech.transcript, phase]);

  // ── Auto-listen: when phase becomes "asking", speak the question then
  //    auto-start the mic. A 3-second countdown gives visual feedback.
  useEffect(() => {
    if (phase !== "asking" || !currentQ || !speech.isSupported) return;

    // Clear any lingering timers from a previous question
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setCountdown(null);

    let cancelled = false;

    // Speak the question
    const utt = speakHindi(currentQ.hindiText);

    const beginCountdown = () => {
      if (cancelled) return;
      // 3-second countdown then auto-start mic
      setCountdown(3);
      let c = 3;
      countdownIntervalRef.current = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c <= 0) {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
          setCountdown(null);
          if (!cancelled) {
            speech.resetTranscript();
            setAnswerTranscript("");
            speech.startListening("hi-IN");
            setPhase("listening");
          }
        }
      }, 1000);
    };

    if (utt) {
      // Start countdown after TTS finishes
      utt.onend = () => beginCountdown();
      // Safety fallback: if TTS fires no onend within 8 s, start anyway
      autoListenTimerRef.current = setTimeout(() => {
        if (!cancelled && phase === "asking") beginCountdown();
      }, 8000);
    } else {
      // No TTS available — start countdown after 1 s
      autoListenTimerRef.current = setTimeout(() => beginCountdown(), 1000);
    }

    return () => {
      cancelled = true;
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentQPointer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const currentQIdx = remainingQIdx[currentQPointer] ?? -1;
  const currentQ = currentQIdx >= 0 ? QUESTIONS[currentQIdx] : null;
  const totalExpected = remainingQIdx.length;
  const questionNumber = currentQPointer + 1;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    // Cancel any pending auto-listen countdown
    if (autoListenTimerRef.current) { clearTimeout(autoListenTimerRef.current); autoListenTimerRef.current = null; }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    setCountdown(null);
    window.speechSynthesis?.cancel();
    speech.resetTranscript();
    setAnswerTranscript("");
    speech.startListening("hi-IN");
    setPhase("listening");
  }, [speech]);

  const stopListening = useCallback(() => {
    speech.stopListening();
    const finalText = speechRef.current.transcript.trim() || answerTranscript.trim();
    setAnswerTranscript(finalText);
    if (finalText) {
      setPhase("confirming");
    } else {
      setPhase("asking");
      showToast("कुछ सुनाई नहीं दिया, फिर से कोशिश करें।", "warning");
    }
  }, [speech, answerTranscript, showToast]);

  const processAnswer = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      // Full accumulated transcript for cumulative extraction
      const allSoFar = [...allTranscripts, text].join(" ");
      const extracted = extractFromTranscript(allSoFar);
      const updated = mergeExtracted(collected, extracted);

      setCollected(updated);
      setLastExtracted(extracted);
      setAllTranscripts((prev) => [...prev, text]);

      // Recalculate remaining questions after this answer
      const newRemaining = getRemainingQuestions(updated);
      setRemainingQIdx(newRemaining);

      // Advance to next question
      const nextPointer = currentQPointer + 1;
      if (nextPointer >= newRemaining.length) {
        // All answered — go to review
        setPhase("review");
      } else {
        setCurrentQPointer(nextPointer);
        setPhase("asking");
      }

      setAnswerTranscript("");
      speech.resetTranscript();
    },
    [allTranscripts, collected, currentQPointer, speech]
  );

  const handleConfirmAnswer = () => {
    processAnswer(answerTranscript);
  };

  const handleSkipQuestion = () => {
    const nextPointer = currentQPointer + 1;
    if (nextPointer >= remainingQIdx.length) {
      setPhase("review");
    } else {
      setCurrentQPointer(nextPointer);
      setPhase("asking");
    }
    setAnswerTranscript("");
    speech.resetTranscript();
  };

  const handleLoadDemo = () => {
    const demo = sampleVoiceTranscripts.hi;
    const extracted = extractFromTranscript(demo);
    const updated = mergeExtracted(emptyInterview(), extracted);
    setCollected(updated);
    setAllTranscripts([demo]);
    setLastExtracted(extracted);
    setRemainingQIdx([]); // all answered
    setPhase("review");
    showToast("डेमो जानकारी लोड की गई", "info");
  };

  const handleRetakeAnswer = () => {
    setAnswerTranscript("");
    speech.resetTranscript();
    setPhase("asking");
  };

  // ── Final CTA: generate catalogue + pricing ────────────────────────────────

  // 4-step progress for the generating phase
  const [genStep, setGenStep] = useState(0);
  // 0=idle, 1=profile, 2=catalogue, 3=pricing, 4=kit

  const GEN_STEPS = [
    { hi: "उत्पाद प्रोफाइल तैयार हो रही है...",   en: "Preparing Product Profile..." },
    { hi: "AI Catalogue बनाया जा रहा है...",       en: "Creating AI Catalogue..." },
    { hi: "Smart Price की गणना हो रही है...",      en: "Calculating Smart Price..." },
    { hi: "Seller Kit तैयार हो रही है...",         en: "Preparing Seller Kit..." },
  ];

  const handleCreateSellerKit = async () => {
    setGenStep(1);
    setPhase("generating");

    const fullTranscript = allTranscripts.join(" ");

    // ── STEP 1: Persist Product Profile ──────────────────────────────────────
    // Map voice fields to productDraft. Never overwrite fields already set by
    // Photo Studio / AI analysis unless voice explicitly provided a value.
    const voicePatch: Record<string, unknown> = {
      transcriptHi: fullTranscript,
      voiceInterviewData: collected,
    };

    // Material: prefer voice-provided, fallback to existing
    if (collected.materials.length > 0) {
      voicePatch.material = collected.materials.join(", ");
    }
    // Craft type
    if (collected.craft_technique) {
      voicePatch.craftType = collected.craft_technique;
    }
    // Pricing-relevant numeric fields — read by Smart Pricing page on mount
    if (collected.production_time_hours !== null) {
      voicePatch.voiceLaborHours = collected.production_time_hours;
    }
    if (collected.people_involved !== null) {
      voicePatch.voicePeopleInvolved = collected.people_involved;
    }
    if (collected.dimensions) {
      voicePatch.voiceDimensions = collected.dimensions;
    }
    if (collected.product_type) {
      // Only set category if not already chosen
      if (!productDraft.categoryNameEn) {
        voicePatch.categoryNameEn = collected.product_type;
      }
    }

    updateProductDraft(voicePatch as Parameters<typeof updateProductDraft>[0]);
    await new Promise(r => setTimeout(r, 600)); // brief UX pause

    // ── STEP 2: Generate AI Catalogue ────────────────────────────────────────
    setGenStep(2);
    let catalogueOk = false;
    try {
      const analysis = {
        category:
          productDraft.categoryNameEn || collected.product_type || "Handicraft",
        material:
          collected.materials.length > 0
            ? collected.materials.join(", ")
            : productDraft.material || "Natural Material",
        craft_type:
          collected.craft_technique || productDraft.craftType || "Handcrafted",
        colors: productDraft.colors || [],
        style: productDraft.style || "",
        visible_features: [
          ...(productDraft.visibleFeatures || []),
          ...(collected.unique_features || []),
          collected.dimensions ? `Size: ${collected.dimensions}` : "",
          collected.production_time ? `Made in: ${collected.production_time}` : "",
          collected.people_involved
            ? `${collected.people_involved} artisan(s) involved`
            : "",
        ].filter(Boolean),
      };

      // Rich transcript — ONLY artisan-provided facts, no inventions
      const richTranscript = [
        collected.product_name   ? `Product: ${collected.product_name}` : "",
        collected.materials.length > 0
          ? `Materials: ${collected.materials.join(", ")}` : "",
        collected.production_time ? `Production time: ${collected.production_time}` : "",
        collected.people_involved
          ? `People involved: ${collected.people_involved}` : "",
        collected.craft_technique ? `Technique: ${collected.craft_technique}` : "",
        collected.dimensions      ? `Dimensions: ${collected.dimensions}` : "",
        collected.unique_features.length > 0
          ? `Special features: ${collected.unique_features.join(", ")}` : "",
        fullTranscript
          ? `Artisan's own words: "${fullTranscript}"` : "",
      ].filter(Boolean).join("\n");

      const { data: catalogue, isDemo } = await generateCatalogue(analysis, richTranscript);

      updateProductDraft({
        titleEn: catalogue.title,
        descriptionEn: catalogue.description,
        featuresEn: catalogue.features,
        tagsEn: catalogue.tags,
        material: catalogue.material || analysis.material,
        craftType: catalogue.craft_type || analysis.craft_type,
      });

      catalogueOk = true;
      showToast(
        isDemo ? "डेमो: Catalogue तैयार" : "AI Catalogue तैयार! ✨",
        isDemo ? "info" : "success"
      );
    } catch {
      // Catalogue failed — save what we have, don't lose voice data
      // Seed a minimal title from product_name so result page isn't blank
      if (!productDraft.titleEn && collected.product_name) {
        updateProductDraft({ titleEn: collected.product_name });
      }
      showToast("Catalogue API से जुड़ नहीं पाए — मैन्युअल जाँच करें", "warning");
    }

    // ── STEP 3: Pre-calculate pricing features & persist ────────────────────
    setGenStep(3);
    await new Promise(r => setTimeout(r, 400));
    // No API call here — pricing page reads voiceLaborHours etc. on mount
    // and calls predictPrice itself. We just mark the patch as done.

    // ── STEP 4: Seller Kit ready ─────────────────────────────────────────────
    setGenStep(4);
    await new Promise(r => setTimeout(r, 500));

    // Route to AI Catalogue result page (step 5 in the flow)
    // If catalogue failed, still route — result page shows what's available
    router.push("/create/result");
  };


  // ── Phase: generating — 4-step progress stepper ──────────────────────────

  if (phase === "generating") {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={4} />

        <div className="space-y-1 text-center">
          <h2 className="text-lg font-extrabold text-artisan-indigo">
            {displayLang === "hi" ? "✨ Seller Kit तैयार हो रही है" : "✨ Creating Seller Kit"}
          </h2>
          <p className="text-xs text-slate-500">
            {displayLang === "hi"
              ? "कृपया रुकें — आपकी जानकारी process हो रही है"
              : "Please wait — processing your product information"}
          </p>
        </div>

        {/* 4-step progress */}
        <div className="glass-panel rounded-3xl p-5 border border-amber-900/10 shadow-lg space-y-3">
          {GEN_STEPS.map((step, idx) => {
            const stepNum = idx + 1;
            const isDone = genStep > stepNum;
            const isActive = genStep === stepNum;
            const isPending = genStep < stepNum;
            return (
              <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-500 ${
                isDone ? "bg-emerald-50 border border-emerald-200"
                : isActive ? "bg-amber-50 border border-amber-300 shadow-sm"
                : "bg-slate-50 border border-slate-100"
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                  isDone ? "bg-emerald-500 text-white"
                  : isActive ? "bg-artisan-terracotta text-white animate-pulse"
                  : "bg-slate-200 text-slate-400"
                }`}>
                  {isDone ? "✓" : stepNum}
                </div>
                <span className={`text-xs font-bold ${
                  isDone ? "text-emerald-700"
                  : isActive ? "text-artisan-terracotta"
                  : "text-slate-400"
                }`}>
                  {displayLang === "hi" ? step.hi : step.en}
                </span>
                {isActive && (
                  <div className="ml-auto flex gap-0.5">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-artisan-terracotta animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* What gets built */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { icon: "📋", label: displayLang === "hi" ? "AI Catalogue" : "AI Catalogue", active: genStep >= 2 },
            { icon: "💰", label: displayLang === "hi" ? "Smart Price" : "Smart Price",   active: genStep >= 3 },
            { icon: "🏪", label: displayLang === "hi" ? "Seller Kit"  : "Seller Kit",     active: genStep >= 4 },
          ].map((item, i) => (
            <div key={i} className={`rounded-2xl p-2.5 border transition-all duration-500 ${
              item.active
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-100 text-slate-400"
            }`}>
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-[10px] font-bold">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }


  // ── Phase: intro ──────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={4} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-xl font-extrabold text-artisan-indigo flex items-center gap-2">
              🎙️{" "}
              {displayLang === "hi"
                ? "Voice Story Cataloguer"
                : "Voice Story Cataloguer"}
            </h2>
            <p className="text-xs text-slate-500">
              {displayLang === "hi"
                ? "अपने उत्पाद के बारे में बताएँ। बाकी हम करेंगे।"
                : "Tell us about your product. We'll handle the rest."}
            </p>
          </div>
          {/* Language toggle */}
          <div className="flex rounded-full bg-white border border-amber-900/10 p-0.5 shadow-xs shrink-0">
            <button
              onClick={() => setDisplayLang("hi")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                displayLang === "hi"
                  ? "bg-artisan-terracotta text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setDisplayLang("en")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                displayLang === "en"
                  ? "bg-artisan-terracotta text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Hero intro card */}
        <div
          className="glass-panel rounded-3xl p-6 border border-amber-900/10 shadow-lg space-y-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,245,235,0.95) 0%, rgba(255,255,255,0.98) 100%)",
          }}
        >
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-artisan-terracotta to-artisan-gold flex items-center justify-center shadow-xl">
            <span className="text-4xl">🎙️</span>
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-extrabold text-slate-800">
              {displayLang === "hi"
                ? "आपकी आवाज़, हमारी समझ"
                : "Your Voice, Our Intelligence"}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {displayLang === "hi"
                ? "KARIGAR X आपसे कुछ छोटे-छोटे सवाल पूछेगा। आप हिंदी में जवाब दें। हम जानकारी को AI Catalogue और Smart Pricing के लिए तैयार करेंगे।"
                : "KARIGAR X will ask you a few short questions. Answer in Hindi. We'll structure the information for AI Catalogue and Smart Pricing."}
            </p>
          </div>

          {/* Flow diagram */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            {[
              { icon: "🗣️", label: displayLang === "hi" ? "बोलें" : "Speak" },
              { icon: "→", label: "" },
              { icon: "🧠", label: displayLang === "hi" ? "समझें" : "Extract" },
              { icon: "→", label: "" },
              { icon: "📋", label: displayLang === "hi" ? "कैटलॉग" : "Catalogue" },
              { icon: "→", label: "" },
              { icon: "💰", label: displayLang === "hi" ? "दाम" : "Pricing" },
            ].map((item, i) => (
              <span
                key={i}
                className={`text-xs font-bold ${
                  item.label
                    ? "bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-amber-900"
                    : "text-slate-400 text-sm"
                }`}
              >
                {item.icon} {item.label}
              </span>
            ))}
          </div>

          {/* Speech support warning */}
          {!speech.isSupported && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold">
                  {displayLang === "hi"
                    ? "Voice Recognition उपलब्ध नहीं"
                    : "Voice Recognition Unavailable"}
                </p>
                <p className="text-[11px] mt-0.5">
                  {displayLang === "hi"
                    ? "Chrome या Safari में खोलें, या टेक्स्ट से जवाब दें।"
                    : "Use Chrome or Safari for voice. Text input is available as fallback."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="space-y-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold text-sm"
            onClick={() => setPhase("asking")}
            icon={<Mic className="w-4 h-4" />}
          >
            {displayLang === "hi" ? "इंटरव्यू शुरू करें" : "Start Interview"}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full text-sm"
            onClick={handleLoadDemo}
            icon={<Sparkles className="w-3.5 h-3.5 text-artisan-terracotta" />}
          >
            {displayLang === "hi"
              ? "डेमो जवाब लोड करें (बाँस टोकरी)"
              : "Load Demo Answer (Bamboo Basket)"}
          </Button>
        </div>

        {/* Back nav */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.push("/create/studio")}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            {displayLang === "hi" ? "पीछे जाएँ" : "Back"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Phase: asking / listening / confirming ────────────────────────────────

  if (phase === "asking" || phase === "listening" || phase === "confirming") {
    const q = currentQ;
    if (!q) {
      // All done — jump to review
      setPhase("review");
      return null;
    }

    return (
      <div className="space-y-4">
        <StepIndicator currentStep={4} />

        {/* Header + lang toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-artisan-indigo flex items-center gap-1.5">
              🎙️ Voice Story Cataloguer
            </h2>
            <p className="text-[11px] text-slate-500">
              {displayLang === "hi"
                ? "अपने उत्पाद के बारे में बताएँ।"
                : "Tell us about your product."}
            </p>
          </div>
          <div className="flex rounded-full bg-white border border-amber-900/10 p-0.5 shadow-xs">
            <button
              onClick={() => setDisplayLang("hi")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                displayLang === "hi"
                  ? "bg-artisan-terracotta text-white"
                  : "text-slate-600"
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setDisplayLang("en")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                displayLang === "en"
                  ? "bg-artisan-terracotta text-white"
                  : "text-slate-600"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {displayLang === "hi"
                ? `सवाल ${questionNumber} / ${totalExpected}`
                : `Question ${questionNumber} of ${totalExpected}`}
            </span>
            <span className="text-[11px] text-artisan-terracotta font-bold">
              {q.englishLabel}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-artisan-terracotta to-artisan-gold rounded-full transition-all duration-500"
              style={{ width: `${(questionNumber / totalExpected) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          className="rounded-3xl p-5 border border-amber-200 shadow-lg space-y-3"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,248,240,0.98) 0%, rgba(255,255,255,0.99) 100%)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-artisan-terracotta/10 flex items-center justify-center">
              <span className="text-[10px] font-black text-artisan-terracotta">
                KX
              </span>
            </div>
            <span className="text-[10px] font-bold text-artisan-terracotta uppercase tracking-wider">
              {displayLang === "hi" ? "KARIGAR X पूछता है" : "KARIGAR X asks"}
            </span>
          </div>

          <p className="text-base font-bold text-slate-800 leading-relaxed">
            {q.hindiText}
          </p>

          <p className="text-[11px] text-slate-400 italic">{q.hindiHint}</p>

          <button
            onClick={() => speakHindi(q.hindiText)}
            className="flex items-center gap-1.5 text-[11px] text-artisan-terracotta font-semibold hover:text-artisan-terracotta/70 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5" />
            🔊{" "}
            {displayLang === "hi" ? "सुनें (TTS)" : "Listen (TTS)"}
          </button>
        </div>

        {/* Microphone / recording area */}
        <div className="glass-panel p-5 rounded-3xl text-center space-y-4 border border-amber-900/10 shadow-md">
          {phase !== "confirming" && (
            <>
              {/* Mic button — shows countdown ring during "asking", pulse during "listening" */}
              <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
                {/* Countdown ring */}
                {phase === "asking" && countdown !== null && (
                  <div className="absolute inset-0 rounded-full border-4 border-artisan-gold animate-spin"
                    style={{ animationDuration: "1s" }} />
                )}
                <button
                  onClick={phase === "listening" ? stopListening : startListening}
                  disabled={!speech.isSupported && phase !== "listening"}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                    phase === "listening"
                      ? "bg-rose-600 ring-8 ring-rose-500/30 animate-pulse"
                      : countdown !== null
                      ? "bg-gradient-to-tr from-amber-400 to-artisan-gold scale-95"
                      : "bg-gradient-to-tr from-artisan-terracotta to-artisan-gold hover:scale-105"
                  }`}
                >
                  {phase === "listening" ? (
                    <MicOff className="w-10 h-10" />
                  ) : countdown !== null ? (
                    <span className="text-3xl font-black">{countdown}</span>
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  {phase === "listening"
                    ? displayLang === "hi"
                      ? "🔴 आवाज़ सुनी जा रही है... रोकने के लिए दबाएँ"
                      : "🔴 Listening... Tap to stop"
                    : countdown !== null
                    ? displayLang === "hi"
                      ? `माइक ${countdown} सेकंड में शुरू होगा...`
                      : `Mic starts in ${countdown}s...`
                    : displayLang === "hi"
                    ? "🎙️ अभी बोलें"
                    : "🎙️ Speak Now"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {phase === "listening"
                    ? displayLang === "hi"
                      ? "हिंदी में जवाब दें"
                      : "Speak naturally in Hindi"
                    : countdown !== null
                    ? displayLang === "hi"
                      ? "जल्दी शुरू करने के लिए माइक दबाएँ"
                      : "Tap mic to start immediately"
                    : displayLang === "hi"
                    ? "या माइक दबाकर बोलें"
                    : "Or tap the mic to speak"}
                </p>
              </div>

              {/* Live waveform */}
              {phase === "listening" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 py-1">
                    {[6, 10, 14, 10, 6, 12, 8].map((h, i) => (
                      <span
                        key={i}
                        className="w-1.5 rounded-full bg-rose-500 animate-bounce"
                        style={{
                          height: `${h + Math.random() * 4}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                  {speech.interimTranscript && (
                    <p className="text-xs text-slate-500 italic bg-white/60 rounded-xl p-2 border border-slate-100 text-center">
                      {speech.interimTranscript}...
                    </p>
                  )}
                </div>
              )}

              {/* Text fallback when speech not supported */}
              {!speech.isSupported && phase === "asking" && (
                <div className="space-y-2">
                  <p className="text-[11px] text-slate-500">
                    {displayLang === "hi"
                      ? "Voice उपलब्ध नहीं — यहाँ टाइप करें:"
                      : "Voice unavailable — type your answer:"}
                  </p>
                  <textarea
                    value={answerTranscript}
                    onChange={(e) => setAnswerTranscript(e.target.value)}
                    placeholder={
                      displayLang === "hi"
                        ? "यहाँ हिंदी में जवाब लिखें..."
                        : "Type your answer in Hindi here..."
                    }
                    rows={3}
                    className="w-full text-xs text-slate-700 bg-white p-3 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/40 resize-none"
                  />
                  {answerTranscript.trim() && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => setPhase("confirming")}
                    >
                      {displayLang === "hi" ? "जवाब दर्ज करें" : "Submit Answer"}
                    </Button>
                  )}
                </div>
              )}
            </>
          )}

          {/* Confirming phase */}
          {phase === "confirming" && (
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                {displayLang === "hi" ? "आपका जवाब:" : "Your answer:"}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed font-medium">
                {answerTranscript || speech.transcript || "—"}
              </div>

              {/* What was extracted */}
              {Object.keys(lastExtracted).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {displayLang === "hi" ? "✓ समझी गई जानकारी:" : "✓ Extracted:"}
                  </p>
                  <div className="space-y-1">
                    {lastExtracted.product_name && (
                      <ExtractionChip
                        label={displayLang === "hi" ? "उत्पाद" : "Product"}
                        value={lastExtracted.product_name}
                      />
                    )}
                    {lastExtracted.materials && lastExtracted.materials.length > 0 && (
                      <ExtractionChip
                        label={displayLang === "hi" ? "सामग्री" : "Materials"}
                        value={lastExtracted.materials.join(", ")}
                      />
                    )}
                    {lastExtracted.production_time && (
                      <ExtractionChip
                        label={displayLang === "hi" ? "बनाने का समय" : "Time"}
                        value={lastExtracted.production_time}
                      />
                    )}
                    {lastExtracted.people_involved !== undefined &&
                      lastExtracted.people_involved !== null && (
                        <ExtractionChip
                          label={displayLang === "hi" ? "लोग" : "People"}
                          value={`${lastExtracted.people_involved}`}
                        />
                      )}
                    {lastExtracted.craft_technique && (
                      <ExtractionChip
                        label={displayLang === "hi" ? "कारीगरी" : "Technique"}
                        value={lastExtracted.craft_technique}
                      />
                    )}
                    {lastExtracted.dimensions && (
                      <ExtractionChip
                        label={displayLang === "hi" ? "आकार" : "Size"}
                        value={lastExtracted.dimensions}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleRetakeAnswer}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {displayLang === "hi" ? "दोबारा" : "Redo"}
                </button>
                <button
                  onClick={handleConfirmAnswer}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-artisan-terracotta to-artisan-gold text-white text-sm font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  {displayLang === "hi" ? "अगला सवाल" : "Next Question"}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Skip question */}
        {phase !== "confirming" && (
          <button
            onClick={handleSkipQuestion}
            className="w-full text-[11px] text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            {displayLang === "hi"
              ? "यह सवाल छोड़ें →"
              : "Skip this question →"}
          </button>
        )}

        {/* Already collected chips */}
        {(collected.product_name ||
          collected.materials.length > 0 ||
          collected.production_time) && (
          <div className="glass-panel p-3 rounded-2xl border border-amber-900/10 space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {displayLang === "hi" ? "अब तक जानकारी" : "Collected so far"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {collected.product_name && (
                <Badge variant="success" className="text-[10px]">
                  🗣️ {collected.product_name}
                </Badge>
              )}
              {collected.materials.map((m, i) => (
                <Badge key={i} variant="terracotta" className="text-[10px]">
                  {m}
                </Badge>
              ))}
              {collected.production_time && (
                <Badge variant="outline" className="text-[10px]">
                  ⏱ {collected.production_time}
                </Badge>
              )}
              {collected.people_involved !== null && (
                <Badge variant="outline" className="text-[10px]">
                  👥 {collected.people_involved} लोग
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* AI image analysis badge */}
        {productDraft.material && (
          <div className="glass-panel p-3 rounded-2xl border border-sky-200 space-y-1.5">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3" /> AI Image Analysis
            </span>
            <div className="flex flex-wrap gap-1.5">
              {productDraft.categoryNameEn && (
                <Badge variant="outline" className="text-[10px] border-sky-200">
                  👁️ {productDraft.categoryNameEn}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] border-sky-200">
                👁️ {productDraft.material}
              </Badge>
              {productDraft.craftType && (
                <Badge variant="outline" className="text-[10px] border-sky-200">
                  👁️ {productDraft.craftType}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Phase: review ─────────────────────────────────────────────────────────

  if (phase === "review") {
    return (
      <div className="space-y-4">
        <StepIndicator currentStep={4} />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-artisan-indigo flex items-center gap-2">
              ✓{" "}
              {displayLang === "hi"
                ? "आपकी जानकारी तैयार है"
                : "Your Information is Ready"}
            </h2>
            <p className="text-xs text-slate-500">
              {displayLang === "hi"
                ? "जाँच करें और पुष्टि करें"
                : "Review and confirm before creating"}
            </p>
          </div>
          <div className="flex rounded-full bg-white border border-amber-900/10 p-0.5 shadow-xs">
            <button
              onClick={() => setDisplayLang("hi")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                displayLang === "hi"
                  ? "bg-artisan-terracotta text-white"
                  : "text-slate-600"
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setDisplayLang("en")}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                displayLang === "en"
                  ? "bg-artisan-terracotta text-white"
                  : "text-slate-600"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Source legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-emerald-500" />
            🗣️{" "}
            {displayLang === "hi" ? "कारीगर ने बताया" : "Artisan Provided"}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3 text-sky-500" />
            👁️{" "}
            {displayLang === "hi" ? "AI ने पहचाना" : "AI Detected"}
          </span>
          <span className="flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-500" />
            ⚠️{" "}
            {displayLang === "hi" ? "पुष्टि चाहिए" : "Needs Confirmation"}
          </span>
        </div>

        {/* Review fields */}
        <div className="space-y-2">
          {REVIEW_FIELDS.map((field) => {
            const val = field.renderValue(collected);
            const isArtisanProvided = !!collected.artisan_provided[field.key as string];
            const isAIDetected =
              !isArtisanProvided &&
              ((field.key === "materials" &&
                productDraft.material &&
                collected.materials.length === 0) ||
                false);
            const isEmpty = val === "—";

            return (
              <ReviewFieldRow
                key={field.key as string}
                hindiLabel={field.hindiLabel}
                englishLabel={field.englishLabel}
                value={val}
                isArtisanProvided={isArtisanProvided}
                isAIDetected={isAIDetected}
                isEmpty={isEmpty}
                displayLang={displayLang}
                onEdit={(newVal) => {
                  const updated = { ...collected };
                  if (field.key === "materials") {
                    updated.materials = newVal
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  } else if (field.key === "unique_features") {
                    updated.unique_features = newVal
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                  } else if (field.key === "people_involved") {
                    updated.people_involved = parseInt(newVal) || null;
                  } else if (field.key === "production_time_hours") {
                    updated.production_time_hours = parseFloat(newVal) || null;
                  } else {
                    (updated as Record<string, unknown>)[field.key as string] = newVal;
                  }
                  setCollected(updated);
                }}
              />
            );
          })}
        </div>

        {/* AI Image Analysis card */}
        {productDraft.material && (
          <div className="glass-panel p-3 rounded-2xl border border-sky-200 space-y-1.5">
            <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {displayLang === "hi" ? "AI चित्र विश्लेषण" : "AI Image Analysis"}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {productDraft.categoryNameEn && (
                <Badge variant="outline" className="text-[10px] border-sky-200">
                  👁️ {productDraft.categoryNameEn}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] border-sky-200">
                👁️ {productDraft.material}
              </Badge>
              {productDraft.craftType && (
                <Badge variant="outline" className="text-[10px] border-sky-200">
                  👁️ {productDraft.craftType}
                </Badge>
              )}
              {productDraft.colors?.slice(0, 2).map((c, i) => (
                <Badge key={i} variant="default" className="text-[10px]">
                  👁️ {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Restart option */}
        <button
          onClick={() => {
            setCollected(emptyInterview());
            setAllTranscripts([]);
            setCurrentQPointer(0);
            setRemainingQIdx([0, 1, 2, 3, 4, 5]);
            setPhase("asking");
          }}
          className="w-full text-[11px] text-slate-400 hover:text-slate-600 transition-colors py-1 flex items-center justify-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          {displayLang === "hi" ? "फिर से शुरू करें" : "Restart interview"}
        </button>

        {/* Final CTA */}
        <div
          className="rounded-3xl p-5 border border-amber-200 shadow-lg space-y-3 text-center"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,248,230,0.98) 0%, rgba(255,255,255,0.99) 100%)",
          }}
        >
          <div className="text-2xl">✨</div>
          <div>
            <h3 className="font-extrabold text-base text-slate-800">
              {displayLang === "hi" ? "Seller Kit बनाएँ" : "Create Seller Kit"}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              {displayLang === "hi"
                ? "आपकी जानकारी से AI Catalogue और Smart Price बनाया जाएगा।"
                : "Your information will be used to create the AI Catalogue and Smart Price."}
            </p>
          </div>

          {/* Flow summary */}
          <div className="flex items-center justify-center gap-1 text-[10px] flex-wrap">
            {["🗣️ Voice", "→", "📋 AI Catalogue", "→", "💰 Smart Pricing", "→", "🏪 Seller Kit"].map(
              (s, i) => (
                <span
                  key={i}
                  className={s === "→" ? "text-slate-300" : "font-bold text-slate-600"}
                >
                  {s}
                </span>
              )
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full font-bold text-sm shadow-lg"
            onClick={handleCreateSellerKit}
            icon={<Sparkles className="w-4 h-4" />}
          >
            ✨{" "}
            {displayLang === "hi" ? "Seller Kit बनाएँ" : "Create Seller Kit"}
          </Button>
        </div>

        {/* Back nav */}
        <Button
          variant="ghost"
          size="lg"
          onClick={() => router.push("/create/studio")}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          {displayLang === "hi" ? "पीछे जाएँ" : "Back"}
        </Button>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function ExtractionChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
      <span className="text-[11px] text-emerald-800 font-semibold">
        {label}:{" "}
        <span className="font-bold">{value}</span>
      </span>
    </div>
  );
}

interface ReviewFieldRowProps {
  hindiLabel: string;
  englishLabel: string;
  value: string;
  isArtisanProvided: boolean;
  isAIDetected: boolean;
  isEmpty: boolean;
  displayLang: "hi" | "en";
  onEdit: (val: string) => void;
}

function ReviewFieldRow({
  hindiLabel,
  englishLabel,
  value,
  isArtisanProvided,
  isAIDetected,
  isEmpty,
  displayLang,
  onEdit,
}: ReviewFieldRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value === "—" ? "" : value);

  const sourceIcon = isArtisanProvided
    ? "🗣️"
    : isAIDetected
    ? "👁️"
    : isEmpty
    ? "⚠️"
    : "🗣️";

  const sourceBg = isArtisanProvided
    ? "bg-emerald-50 border-emerald-200"
    : isAIDetected
    ? "bg-sky-50 border-sky-200"
    : isEmpty
    ? "bg-amber-50 border-amber-200"
    : "bg-white border-slate-200";

  return (
    <div className={`rounded-2xl p-3 border ${sourceBg} space-y-1`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {sourceIcon}{" "}
          {displayLang === "hi" ? hindiLabel : englishLabel}
        </span>
        <button
          onClick={() => {
            if (editing) {
              onEdit(draft);
              setEditing(false);
            } else {
              setDraft(value === "—" ? "" : value);
              setEditing(true);
            }
          }}
          className="flex items-center gap-0.5 text-[10px] text-artisan-terracotta font-semibold hover:opacity-70 transition-opacity"
        >
          <Edit3 className="w-3 h-3" />
          {editing
            ? displayLang === "hi"
              ? "सहेजें"
              : "Save"
            : displayLang === "hi"
            ? "बदलें"
            : "Edit"}
        </button>
      </div>
      {editing ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEdit(draft);
              setEditing(false);
            }
          }}
          autoFocus
          className="w-full text-xs font-bold text-slate-800 bg-white p-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-artisan-terracotta/30"
        />
      ) : (
        <p
          className={`text-xs font-bold ${
            isEmpty ? "text-amber-500 italic" : "text-slate-800"
          }`}
        >
          {isEmpty
            ? displayLang === "hi"
              ? "जानकारी नहीं मिली"
              : "Not provided"
            : value}
        </p>
      )}
    </div>
  );
}
