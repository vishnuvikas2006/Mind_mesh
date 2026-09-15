"use client";

import { LoaderCircle, Mic, Send, Square, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api, type Risk } from "@/lib/api";

type Mood = "okay" | "stressed" | "scared" | "need_help" | null;
type VoiceResult = { risk?: Risk; alert_created: boolean; analysis_available: boolean; message?: string };
type Recognition = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: { results: { length: number; [key: number]: { [key: number]: { transcript: string } } } }) => void) | null; onerror: (() => void) | null };

export function VoiceNote({ mood, onComplete }: { mood: Mood; onComplete?: (result: VoiceResult) => void }) {
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recognition = useRef<Recognition | null>(null);
  const [recording, setRecording] = useState(false);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("Record a short voice note, then add or review its transcript.");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { recorder.current?.stream.getTracks().forEach((track) => track.stop()); }, []);
  useEffect(() => {
    if (!audio) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(audio);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [audio]);

  async function start() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording is not available in this browser. You can still use a text check-in.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const media = new MediaRecorder(stream);
      media.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      media.onstop = () => {
        setAudio(new Blob(chunks.current, { type: media.mimeType || "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
        setStatus("Recording ready. Review the transcript below, then save your voice check-in.");
      };
      recorder.current = media;
      media.start();
      startTranscription();
      setRecording(true);
      setStatus("Listening… select Stop when you are ready.");
    } catch {
      setError("Microphone access was not granted. Please allow it in your browser settings or use text instead.");
    }
  }

  function startTranscription() {
    const BrowserWindow = window as typeof window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const SpeechRecognition = BrowserWindow.SpeechRecognition ?? BrowserWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const service = new SpeechRecognition();
    service.continuous = true;
    service.interimResults = false;
    service.lang = "en-IN";
    service.onresult = (event) => {
      let next = "";
      for (let index = 0; index < event.results.length; index += 1) next += `${event.results[index][0].transcript} `;
      setTranscript(next.trim());
    };
    service.onerror = () => setStatus("Recording ready. Add a short transcript if automatic transcription is unavailable.");
    recognition.current = service;
    try { service.start(); } catch { /* A browser may not support restarting speech recognition. */ }
  }

  function stop() {
    recorder.current?.stop();
    recognition.current?.stop();
    setRecording(false);
  }

  async function save() {
    if (!audio) { setError("Record a voice note before saving."); return; }
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("audio", new File([audio], "mindmesh-voice-note.webm", { type: audio.type || "audio/webm" }));
    formData.append("transcript", transcript);
    if (mood) formData.append("mood", mood);
    try {
      const result = await api<VoiceResult>("/interactions/voice", { method: "POST", body: formData });
      onComplete?.(result);
      setStatus(result.analysis_available ? "Voice check-in saved and its transcript was analysed as an assistive support signal." : result.message ?? "Voice check-in saved.");
      setAudio(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your voice note could not be saved.");
    } finally { setUploading(false); }
  }

  return <section className="rounded-2xl border border-[#dbeae7] bg-[#f9fdfc] p-4">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#ddf3ee] text-deepteal"><Volume2 className="h-5 w-5" /></span><div><h2 className="font-semibold text-ink">Voice check-in</h2><p className="mt-1 text-xs leading-5 text-body">Voice is stored only after you choose Save. In this MVP, a transcript is needed for an assistive text signal.</p></div></div>
    <div className="mt-4 flex flex-wrap gap-2">{recording ? <button type="button" onClick={stop} className="flex min-h-11 items-center gap-2 rounded-full bg-[#a34f58] px-4 text-sm font-semibold text-white"><Square className="h-4 w-4" />Stop recording</button> : <button type="button" onClick={start} disabled={uploading} className="flex min-h-11 items-center gap-2 rounded-full border border-[#9ed5cb] bg-white px-4 text-sm font-semibold text-deepteal hover:bg-mint"><Mic className="h-4 w-4" />{audio ? "Record again" : "Record voice note"}</button>}{recording && <span className="flex min-h-11 items-center gap-2 px-2 text-sm font-medium text-[#a34f58]"><span className="h-2 w-2 animate-pulse rounded-full bg-[#a34f58]" />Recording</span>}</div>
    {previewUrl && <audio className="mt-4 w-full" controls src={previewUrl} />}
    <label className="mt-4 block text-sm font-semibold text-ink" htmlFor="voice-transcript">Transcript <span className="font-normal text-body">(optional, but needed for analysis)</span></label>
    <textarea id="voice-transcript" value={transcript} onChange={(event) => setTranscript(event.target.value)} maxLength={3000} placeholder="Review or type what you said. You can save a recording without a transcript." className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[#d6e2e5] bg-white p-3 text-sm leading-6 text-ink outline-none placeholder:text-[#8ca1a9] focus:border-deepteal" />
    <p className="mt-2 text-xs leading-5 text-body">{status}</p>{error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
    {audio && <button type="button" onClick={save} disabled={uploading} className="mt-4 flex min-h-11 items-center gap-2 rounded-full bg-deepteal px-4 text-sm font-semibold text-white disabled:opacity-60">{uploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{uploading ? "Saving voice note…" : "Save voice check-in"}</button>}
  </section>;
}
