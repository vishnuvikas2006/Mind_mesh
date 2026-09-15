"use client";

import { LoaderCircle, Mic, Square } from "lucide-react";
import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type VoiceResult = { analysis_available?: boolean; message?: string };

/** An explicit press-and-hold recorder placed in the victim's primary navigation. */
export function HoldToRecordVoiceNote() {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const releasedBeforeStart = useRef(false);
  const [holding, setHolding] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => () => { recorder.current?.stop(); stream.current?.getTracks().forEach((track) => track.stop()); }, []);

  async function upload(blob: Blob) {
    if (!blob.size) { setStatus("Recording was too short. Hold the microphone and try again."); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append("audio", new File([blob], "mindmesh-voice-note.webm", { type: blob.type || "audio/webm" }));
    formData.append("transcript", "");
    try {
      const result = await api<VoiceResult>("/interactions/voice", { method: "POST", body: formData });
      setStatus(result.analysis_available ? "Voice note sent for authorised review." : result.message ?? "Voice note sent for authorised review.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Voice note could not be sent."); }
    finally { setUploading(false); }
  }

  async function begin() {
    if (holding || preparing || uploading) return;
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { setStatus("Voice recording is not available in this browser."); return; }
    releasedBeforeStart.current = false; setPreparing(true); setStatus("");
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (releasedBeforeStart.current) { nextStream.getTracks().forEach((track) => track.stop()); return; }
      stream.current = nextStream; chunks.current = [];
      const nextRecorder = new MediaRecorder(nextStream);
      nextRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      nextRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: nextRecorder.mimeType || "audio/webm" });
        nextStream.getTracks().forEach((track) => track.stop());
        recorder.current = null; stream.current = null; void upload(blob);
      };
      recorder.current = nextRecorder; nextRecorder.start(); setHolding(true); setStatus("Recording. Release to send.");
    } catch { setStatus("Microphone access was not granted. Allow it in browser settings and try again."); }
    finally { setPreparing(false); }
  }

  function end() {
    releasedBeforeStart.current = true;
    if (recorder.current?.state === "recording") recorder.current.stop();
    setHolding(false);
  }
  function pointerDown(event: PointerEvent<HTMLButtonElement>) { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); void begin(); }
  function pointerEnd(event: PointerEvent<HTMLButtonElement>) { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); end(); }
  function keyDown(event: KeyboardEvent<HTMLButtonElement>) { if ((event.key === " " || event.key === "Enter") && !event.repeat) { event.preventDefault(); void begin(); } }
  function keyUp(event: KeyboardEvent<HTMLButtonElement>) { if (event.key === " " || event.key === "Enter") { event.preventDefault(); end(); } }

  return <div className="relative flex flex-1 justify-center"><button type="button" aria-label={holding ? "Recording voice note; release to send" : "Hold to record and send a voice note"} aria-pressed={holding} onPointerDown={pointerDown} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={end} onKeyDown={keyDown} onKeyUp={keyUp} disabled={preparing || uploading} className={`bottom-voice-note flex min-h-[58px] min-w-16 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition ${holding ? "text-[#9b3c49]" : "text-deepteal hover:bg-mint"}`}><span className={`grid h-10 w-10 place-items-center rounded-full ${holding ? "bg-[#fce8e8]" : "bg-mint"}`}>{preparing || uploading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : holding ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}</span>{holding ? "Release" : uploading ? "Sending" : "Hold to talk"}</button><span aria-live="polite" className="sr-only">{status}</span>{status && <span className="bottom-voice-note__status" role="status">{status}</span>}</div>;
}
