"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { SahaayaLanguage, SahaayaStatus, SpiritualSupport } from "@/lib/sahaaya";

export type ConversationMessage = { id: string; role: "user" | "assistant"; text: string; language: SahaayaLanguage | "unknown" };
type StartOptions = { language: SahaayaLanguage; spiritualSupport: SpiritualSupport; spiritualTradition?: string };
type TranscriptResponse = { transcript: string; language: SahaayaLanguage | "unknown"; language_name: string };
type LocalTurnResponse = { reply: string; language: SahaayaLanguage };

const SPEECH_THRESHOLD = 0.008;
const MIN_TURN_MS = 220;
const SILENCE_TO_SEND_MS = 1_050;
const MAX_TURN_MS = 20_000;
const LOCALES: Record<SahaayaLanguage, string> = { auto: "en-IN", en: "en-IN", te: "te-IN", hi: "hi-IN", ta: "ta-IN", kn: "kn-IN", ml: "ml-IN", bn: "bn-IN" };

function friendlyError(error: unknown) { return error instanceof Error && error.message ? error.message : "Sahaaya could not continue right now. Please try again."; }
function isKnownLanguage(language: SahaayaLanguage | "unknown"): language is Exclude<SahaayaLanguage, "auto"> { return language !== "unknown" && language !== "auto"; }
function recordingMimeType() { return typeof MediaRecorder === "undefined" ? undefined : ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find((type) => MediaRecorder.isTypeSupported(type)); }
function speechText(text: string) { return text.replace(/\bsahaaya\b/gi, "Sa-haa-ya"); }

function voiceFor(locale: string) {
  const voices = window.speechSynthesis.getVoices();
  const prefix = locale.slice(0, 2).toLowerCase();
  const matching = voices.filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  const candidates = matching.length ? matching : voices;
  return candidates.find((voice) => /zira|jenny|aria|samantha|susan|female|woman|heera|kavya|priya|swara|google.*female/i.test(voice.name)) ?? candidates[0] ?? null;
}

/**
 * Privacy-preserving browser microphone controller. Each short turn is sent to
 * the authenticated backend, where local Whisper detects its spoken language.
 * The browser never receives a provider key.
 */
export function useRealtimeVoice() {
  const [status, setStatus] = useState<SahaayaStatus>("idle");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<SahaayaLanguage | "unknown">("auto");
  const [fallbackLanguage, setFallbackLanguage] = useState<SahaayaLanguage>("auto");

  const activeRef = useRef(false);
  const mutedRef = useRef(false);
  const soundMutedRef = useRef(false);
  const speakingRef = useRef(false);
  const awaitingReplyRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingRef = useRef(false);
  const startedAtRef = useRef(0);
  const lastSpeechAtRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const monitorFrameRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ConversationMessage[]>([]);
  const fallbackRef = useRef<SahaayaLanguage>("auto");
  const lastReplyRef = useRef<{ text: string; language: SahaayaLanguage } | null>(null);
  const speechTicketRef = useRef(0);
  const processTurnRef = useRef<(audio: Blob) => void>(() => undefined);
  const startRecordingRef = useRef<() => void>(() => undefined);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const addMessage = useCallback((role: ConversationMessage["role"], text: string, language: ConversationMessage["language"]) => {
    const clean = text.trim();
    if (!clean) return;
    setMessages((current) => [...current, { id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text: clean, language }]);
  }, []);

  const stopAudioMonitor = useCallback(() => {
    if (monitorFrameRef.current !== null) window.cancelAnimationFrame(monitorFrameRef.current);
    monitorFrameRef.current = null;
  }, []);

  const stopSpeech = useCallback((resumeListening = true) => {
    speechTicketRef.current += 1;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    speakingRef.current = false;
    if (resumeListening && activeRef.current && !mutedRef.current && !awaitingReplyRef.current) setStatus("listening");
  }, []);

  const discardRecording = useCallback(() => {
    recordingRef.current = false;
    chunksRef.current = [];
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
  }, []);

  const cleanUp = useCallback((nextStatus: SahaayaStatus = "ended") => {
    activeRef.current = false;
    mutedRef.current = false;
    awaitingReplyRef.current = false;
    requestAbortRef.current?.abort();
    requestAbortRef.current = null;
    stopAudioMonitor();
    discardRecording();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== "closed") void audioContextRef.current.close();
    audioContextRef.current = null;
    analyserRef.current = null;
    stopSpeech(false);
    setMuted(false);
    setStatus(nextStatus);
  }, [discardRecording, stopAudioMonitor, stopSpeech]);

  const speak = useCallback((text: string, language: SahaayaLanguage, onEnd?: () => void) => {
    stopSpeech(false);
    if (!activeRef.current || soundMutedRef.current || !("speechSynthesis" in window)) {
      if (activeRef.current && !mutedRef.current && !awaitingReplyRef.current) setStatus("listening");
      onEnd?.();
      return;
    }
    const ticket = ++speechTicketRef.current;
    const utterance = new SpeechSynthesisUtterance(speechText(text));
    utterance.lang = LOCALES[language] ?? LOCALES.en;
    utterance.voice = voiceFor(utterance.lang);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    speakingRef.current = true;
    setStatus("speaking");
    const done = () => {
      if (ticket !== speechTicketRef.current) return;
      speakingRef.current = false;
      if (activeRef.current && !mutedRef.current && !awaitingReplyRef.current) setStatus("listening");
      onEnd?.();
    };
    utterance.onend = done;
    utterance.onerror = done;
    window.speechSynthesis.speak(utterance);
  }, [stopSpeech]);

  const processTurn = useCallback(async (audio: Blob) => {
    if (!activeRef.current || mutedRef.current || audio.size < 750) {
      awaitingReplyRef.current = false;
      if (activeRef.current && !mutedRef.current) setStatus("listening");
      return;
    }
    const controller = new AbortController();
    requestAbortRef.current = controller;
    setStatus("thinking");
    try {
      const form = new FormData();
      form.append("audio", audio, "sahaaya-turn.webm");
      const transcription = await api<TranscriptResponse>("/voice/transcribe", { method: "POST", body: form, signal: controller.signal });
      if (!activeRef.current || mutedRef.current || controller.signal.aborted) return;
      const spokenText = transcription.transcript.trim();
      if (!spokenText) throw new Error("I could not hear that clearly. Please speak a little closer to the microphone and try again.");
      const effectiveLanguage: SahaayaLanguage | "unknown" = isKnownLanguage(transcription.language) ? transcription.language : fallbackRef.current;
      setDetectedLanguage(effectiveLanguage === "auto" ? "unknown" : effectiveLanguage);
      addMessage("user", spokenText, effectiveLanguage === "auto" ? "unknown" : effectiveLanguage);
      if (effectiveLanguage === "auto") {
        const clarification = "I could not identify the language clearly. Please repeat your message or choose a language below.";
        awaitingReplyRef.current = false;
        addMessage("assistant", clarification, "unknown");
        lastReplyRef.current = { text: clarification, language: "en" };
        speak(clarification, "en");
        return;
      }
      const history = messagesRef.current.slice(-8).map((message) => ({ role: message.role, text: message.text }));
      const response = await api<LocalTurnResponse>("/voice/local-turn", { method: "POST", body: JSON.stringify({ text: spokenText, language: effectiveLanguage, history }), signal: controller.signal });
      if (!activeRef.current || mutedRef.current || controller.signal.aborted) return;
      const replyLanguage = response.language === "auto" ? effectiveLanguage : response.language;
      awaitingReplyRef.current = false;
      setDetectedLanguage(replyLanguage);
      addMessage("assistant", response.reply, replyLanguage);
      lastReplyRef.current = { text: response.reply, language: replyLanguage };
      speak(response.reply, replyLanguage);
    } catch (cause) {
      if (!activeRef.current || mutedRef.current || controller.signal.aborted) return;
      awaitingReplyRef.current = false;
      setStatus("error");
      setError(friendlyError(cause));
    } finally {
      if (requestAbortRef.current === controller) requestAbortRef.current = null;
    }
  }, [addMessage, speak]);

  useEffect(() => { processTurnRef.current = (audio) => { void processTurn(audio); }; }, [processTurn]);

  const startRecording = useCallback(() => {
    if (!activeRef.current || mutedRef.current || speakingRef.current || awaitingReplyRef.current || recordingRef.current) return;
    const stream = streamRef.current;
    if (!stream || typeof MediaRecorder === "undefined") return;
    try {
      const mimeType = recordingMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorderRef.current = recorder;
      recordingRef.current = true;
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const result = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        chunksRef.current = [];
        if (recorderRef.current === recorder) recorderRef.current = null;
        processTurnRef.current(result);
      };
      recorder.start();
    } catch {
      cleanUp("error");
      setError("The browser could not record your voice. Use a current browser and allow microphone access.");
    }
  }, [cleanUp]);
  useEffect(() => { startRecordingRef.current = startRecording; }, [startRecording]);

  const startAudioMonitor = useCallback(() => {
    stopAudioMonitor();
    const analyser = analyserRef.current;
    if (!analyser) return;
    const samples = new Uint8Array(analyser.fftSize);
    const monitor = () => {
      if (!activeRef.current) return;
      if (!mutedRef.current && !speakingRef.current && !awaitingReplyRef.current) {
        analyser.getByteTimeDomainData(samples);
        let total = 0;
        for (const sample of samples) { const normalized = (sample - 128) / 128; total += normalized * normalized; }
        const volume = Math.sqrt(total / samples.length);
        const now = Date.now();
        if (volume >= SPEECH_THRESHOLD) { lastSpeechAtRef.current = now; startRecordingRef.current(); }
        else if (recordingRef.current && ((now - lastSpeechAtRef.current >= SILENCE_TO_SEND_MS && now - startedAtRef.current >= MIN_TURN_MS) || now - startedAtRef.current >= MAX_TURN_MS)) {
          const recorder = recorderRef.current;
          recordingRef.current = false;
          awaitingReplyRef.current = true;
          if (recorder && recorder.state !== "inactive") recorder.stop(); else awaitingReplyRef.current = false;
        }
      }
      monitorFrameRef.current = window.requestAnimationFrame(monitor);
    };
    monitorFrameRef.current = window.requestAnimationFrame(monitor);
  }, [stopAudioMonitor]);

  const start = useCallback(async (options: StartOptions) => {
    if (activeRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setStatus("error"); setError("Voice conversations need a current Chrome, Edge, Firefox, or Safari browser with microphone support."); return; }
    fallbackRef.current = options.language;
    setFallbackLanguage(options.language);
    setDetectedLanguage(options.language === "auto" ? "auto" : options.language);
    setStatus("requesting_permission");
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const AudioContextConstructor = window.AudioContext ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) throw new Error("Audio analysis is not available in this browser.");
      const context = new AudioContextConstructor();
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(analyser);
      streamRef.current = stream;
      audioContextRef.current = context;
      analyserRef.current = analyser;
      activeRef.current = true;
      mutedRef.current = false;
      awaitingReplyRef.current = false;
      setMuted(false);
      setMessages([]);
      messagesRef.current = [];
      startAudioMonitor();
      const greeting = options.language === "te" ? "నమస్కారం, నేను సహాయా. మీకు తోడుగా ఉన్నాను." : options.language === "hi" ? "नमस्ते, मैं सहाय हूं। मैं आपकी बात सुनने के लिए यहां हूं।" : "Hi, I am Sahaaya. I am here to help you.";
      const greetingLanguage = options.language === "auto" ? "en" : options.language;
      addMessage("assistant", greeting, greetingLanguage);
      lastReplyRef.current = { text: greeting, language: greetingLanguage };
      speak(greeting, greetingLanguage);
    } catch (cause) {
      cleanUp("error");
      setError(cause instanceof Error && cause.name === "NotAllowedError" ? "Microphone access was blocked. Allow it in browser settings, then try again." : friendlyError(cause));
    }
  }, [addMessage, cleanUp, speak, startAudioMonitor]);

  const toggleMute = useCallback(() => {
    if (!activeRef.current) return;
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (next) { requestAbortRef.current?.abort(); discardRecording(); awaitingReplyRef.current = false; setStatus("paused"); }
    else { void audioContextRef.current?.resume(); setStatus("listening"); }
  }, [discardRecording]);

  const toggleSound = useCallback(() => {
    const next = !soundMutedRef.current;
    soundMutedRef.current = next;
    setSoundMuted(next);
    if (next) stopSpeech();
  }, [stopSpeech]);
  const pauseSpeech = useCallback(() => { if (speakingRef.current && "speechSynthesis" in window) { window.speechSynthesis.pause(); setStatus("speaking_paused"); } }, []);
  const resumeSpeech = useCallback(() => { if ("speechSynthesis" in window) { window.speechSynthesis.resume(); speakingRef.current = true; setStatus("speaking"); } }, []);
  const replayLast = useCallback(() => { const reply = lastReplyRef.current; if (reply) speak(reply.text, reply.language); }, [speak]);
  const interrupt = useCallback(() => stopSpeech(), [stopSpeech]);
  const changeLanguage = useCallback((language: SahaayaLanguage) => { fallbackRef.current = language; setFallbackLanguage(language); if (language !== "auto") setDetectedLanguage(language); }, []);
  const end = useCallback(() => cleanUp("ended"), [cleanUp]);

  useEffect(() => () => cleanUp("ended"), [cleanUp]);
  return { status, error, muted, soundMuted, messages, detectedLanguage, fallbackLanguage, active: activeRef.current, start, interrupt, toggleMute, toggleSound, pauseSpeech, resumeSpeech, replayLast, end, retry: start, changeLanguage };
}
