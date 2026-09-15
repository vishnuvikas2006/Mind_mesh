"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, HeartHandshake, LoaderCircle, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { AppShell } from "@/components/mindmesh/AppShell";
import { StatusBadge } from "@/components/mindmesh/StatusBadge";
import { VoiceNote } from "@/components/mindmesh/VoiceNote";
import { api, type Risk } from "@/lib/api";
import { shareUrgentLocation } from "@/lib/urgent-location";

const moods = [
  { id: "okay", label: "I'm okay", text: "Feeling steady" },
  { id: "stressed", label: "Stressed", text: "Need some care" },
  { id: "scared", label: "Scared", text: "Do not feel safe" },
  { id: "need_help", label: "Need help", text: "Request support" },
] as const;
type Mood = (typeof moods)[number]["id"];
type Delivery = { status: string; delivery: { delivery_status: string; external_delivery: string } };
type Result = { risk: Risk; alert_created: boolean; help_request?: Delivery | null; mood: Mood | null };
type VoiceResult = { risk?: Risk; alert_created: boolean; message?: string };

export default function CheckinsPage() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [urgentLocationMessage, setUrgentLocationMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!mood && !message.trim()) { setError("Choose how you feel or add a note."); return; }
    setSaving(true); setError("");
    try {
      const saved = await api<Omit<Result, "mood">>("/interactions/text", { method: "POST", body: JSON.stringify({ mood, text: message.trim() || moods.find((item) => item.id === mood)?.label, channel: "check_in" }) });
      setResult({ ...saved, mood });
      if (mood === "need_help") { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(120); void shareUrgentLocation().then(setUrgentLocationMessage); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Check-in could not be saved."); }
    finally { setSaving(false); }
  }
  return <AppShell><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to home</Link>{result ? <ResultCard result={result} urgentLocationMessage={urgentLocationMessage} /> : <form onSubmit={submit} className="rounded-[28px] border border-[#e4eeee] bg-white p-5 shadow-calm sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ddf3ee] text-deepteal"><HeartHandshake className="h-6 w-6" /></span><h1 className="display-serif mt-5 text-3xl text-ink sm:text-4xl">How are you feeling?</h1><p className="mt-3 max-w-xl text-sm leading-6 text-body">Choose an option or add a short note.</p><fieldset className="mt-7"><legend className="sr-only">Choose how you are feeling</legend><div className="grid gap-3 sm:grid-cols-2">{moods.map((item) => <button type="button" key={item.id} onClick={() => setMood(item.id)} aria-pressed={mood === item.id} className={`min-h-20 rounded-2xl border p-4 text-left transition ${mood === item.id ? "border-deepteal bg-mint" : "border-[#e4eeee] hover:border-[#9ed5cb]"}`}><span className="block font-semibold text-ink">{item.label}</span><span className="mt-1 block text-sm text-body">{item.text}</span></button>)}</div></fieldset><label className="mt-6 block text-sm font-semibold text-ink" htmlFor="checkin-note">Add a note <span className="font-normal text-body">(optional)</span></label><textarea id="checkin-note" maxLength={3000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional note" className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-[#d6e2e5] p-4 text-sm leading-6 text-ink outline-none transition placeholder:text-[#8ca1a9] focus:border-teal" />{error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}<div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="flex max-w-sm items-start gap-2 text-xs leading-5 text-body"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-deepteal" />High-priority signals are reviewed by a person.</p><button disabled={saving} className="flex min-h-12 items-center gap-2 rounded-full bg-deepteal px-6 text-sm font-semibold text-white transition hover:bg-[#124b5a] disabled:opacity-70">{saving && <LoaderCircle className="h-4 w-4 animate-spin" />}{saving ? "Saving..." : "Save check-in"}</button></div><div className="mt-7 border-t border-[#e4eeee] pt-6"><VoiceNote mood={mood} onComplete={(voiceResult: VoiceResult) => { if (voiceResult.risk) setResult({ risk: voiceResult.risk, alert_created: voiceResult.alert_created, mood }); else setVoiceMessage(voiceResult.message ?? "Voice check-in saved."); }} />{voiceMessage && <p className="mt-3 rounded-xl bg-mint p-3 text-sm text-body" role="status">{voiceMessage}</p>}</div></form>}</div></AppShell>;
}

function ResultCard({ result, urgentLocationMessage }: { result: Result; urgentLocationMessage: string }) {
  const extraSupport = result.mood === "stressed" || result.mood === "scared";
  return <section className="rounded-[28px] border border-[#d7e8e5] bg-white p-6 shadow-calm sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ddf3ee] text-deepteal"><CheckCircle2 className="h-6 w-6" /></span><h1 className="display-serif mt-5 text-3xl text-ink">Check-in saved</h1><p className="mt-3 text-sm leading-6 text-body">{result.alert_created ? "A support team member will review this signal." : "Thank you for sharing."}</p>{result.help_request && <div className="mt-5 rounded-2xl border border-[#f0d2d2] bg-[#fff9f9] p-4 text-sm leading-6 text-body"><p className="font-semibold text-ink">Help request recorded</p><p className="mt-1">Available for authorised in-app review.</p>{urgentLocationMessage && <p className="mt-2 font-medium text-ink">{urgentLocationMessage}</p>}</div>}<div className="mt-6 rounded-2xl bg-mint p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">Support signal</p><StatusBadge level={result.risk.risk_level} /></div><p className="mt-2 text-sm leading-5 text-body">{result.risk.reasons[0]} Not a diagnosis.</p></div>{extraSupport && <div className="mt-5 rounded-2xl bg-[#f7fcfc] p-4"><p className="font-semibold text-ink">Try a small next step</p><p className="mt-1 text-sm leading-6 text-body">Take a break, play a breathing game, or talk to Sahaaya.</p></div>}<div className="mt-6 flex flex-wrap gap-3"><Link href="/dashboard" className="rounded-full bg-deepteal px-5 py-3 text-sm font-semibold text-white hover:bg-[#124b5a]">Return home</Link><Link href="/support" className="rounded-full border border-teal px-5 py-3 text-sm font-semibold text-deepteal hover:bg-mint">Talk to support</Link>{extraSupport && <Link href="/calm" className="rounded-full border border-teal px-5 py-3 text-sm font-semibold text-deepteal hover:bg-mint">Play a game</Link>}</div></section>;
}
