"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, LoaderCircle, PhoneOff, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/mindmesh/AppShell";
import { api } from "@/lib/api";
import { shareUrgentLocation } from "@/lib/urgent-location";

type Emergency = { _id: string; status: string; created_at: string; duplicate_prevented?: boolean; delivery: { authorised_trusted_people: number; authorised_admins: number; delivery_status: string; external_delivery: string } };

export default function EmergencyPage() {
  const [events, setEvents] = useState<Emergency[]>([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Emergency | null>(null);
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const load = () => api<Emergency[]>("/emergencies").then(setEvents).catch(() => undefined);

  useEffect(() => { void load(); }, []);
  async function activate() {
    setSending(true); setError("");
    try {
      const locationStatus = await shareUrgentLocation();
      const event = await api<Emergency>("/emergencies", { method: "POST" });
      setResult(event); setLocationMessage(locationStatus);
      if (!event.duplicate_prevented && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([120, 70, 120]);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to record this request. Contact local emergency services if needed."); }
    finally { setSending(false); }
  }

  return <AppShell><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to home</Link><section className="rounded-[28px] border border-[#f0d2d2] bg-white p-5 shadow-calm sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fce8e8] text-[#a34f58]"><AlertTriangle className="h-6 w-6" /></span><h1 className="display-serif mt-5 text-3xl text-ink">Emergency support</h1><p className="mt-3 text-sm leading-6 text-body">If you are in immediate danger, contact local emergency services or a trusted person now.</p><button disabled={sending} onClick={() => void activate()} className="mt-7 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#a34f58] px-5 text-base font-semibold text-white hover:bg-[#853842] disabled:opacity-60">{sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-5 w-5" />}{sending ? "Sending request..." : "I need urgent help"}</button>{error && <p className="mt-4 rounded-xl bg-[#fff3f4] p-3 text-sm leading-6 text-[#81343f]" role="alert">{error}</p>}{result && <div role="status" className="mt-5 rounded-2xl bg-mint p-4"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-deepteal" /><div><p className="font-semibold text-ink">{result.duplicate_prevented ? "Your emergency request is already active." : "Emergency request recorded."}</p><p className="mt-1 text-sm leading-6 text-body">{locationMessage}</p><p className="mt-1 text-sm leading-6 text-body">Available for authorised in-app review.</p></div></div></div>}<aside className="mt-6 flex gap-3 rounded-2xl bg-[#fff9f9] p-4"><PhoneOff className="h-5 w-5 shrink-0 text-[#a34f58]" /><p className="text-sm leading-6 text-body">MindMesh does not place emergency calls automatically.</p></aside></section>{events.length > 0 && <section className="mt-6 rounded-[28px] border border-[#e4eeee] bg-white p-5 shadow-calm"><h2 className="font-semibold text-ink">Recent requests</h2><div className="mt-4 space-y-2">{events.map((event) => <div key={event._id} className="rounded-xl bg-[#f7fcfc] p-3 text-sm text-body"><span className="font-semibold text-ink">{event.status.replaceAll("_", " ")}</span> - {new Date(event.created_at).toLocaleString()}</div>)}</div></section>}</div></AppShell>;
}
