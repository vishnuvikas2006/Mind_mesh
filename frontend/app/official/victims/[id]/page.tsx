"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, HeartHandshake, LoaderCircle, MapPin, Mic, Scale, ShieldAlert, Stethoscope, Trash2, UsersRound } from "lucide-react";
import { api, storedUser } from "@/lib/api";
import { StatusBadge } from "@/components/mindmesh/StatusBadge";
import { SecureVoiceNote } from "@/components/mindmesh/SecureVoiceNote";

type SupportType = "counselling" | "medical" | "legal";
type LocationContext = { shared: boolean; precision?: string; updated_at?: string; expires_at?: string };
type Risk = { dynamic_score?: number; previous_score?: number | null; risk_level?: "low" | "moderate" | "high" | "critical"; trend?: string; reasons?: string[] };
type RiskHistory = { _id: string; dynamic_score?: number; risk_level?: "low" | "moderate" | "high" | "critical"; created_at: string };
type RecordEvent = { _id: string; status: string; created_at: string };
type RecordAlert = { _id: string; severity: "high" | "critical"; status: string; reasons?: string[]; created_at: string; is_emergency?: boolean };
type VictimDetail = {
  victim: { id: string; case_reference: string; full_name: string; username?: string | null; email: string; mobile?: string | null; created_at: string; consent_status: boolean };
  latest_risk?: Risk | null;
  risk_history: RiskHistory[];
  recent_interactions: { _id: string; channel: string; mood?: string | null; created_at: string }[];
  alerts: RecordAlert[];
  support_actions: { _id: string; action_type: string; created_at: string }[];
  support_sessions: { _id: string; support_type?: string; status: string; scheduled_for?: string; created_at?: string }[];
  trusted_people: { id: string; full_name?: string; relationship?: string; enabled: boolean; permissions: string[] }[];
  help_requests: RecordEvent[];
  emergency_events: RecordEvent[];
  voice_notes: { _id: string; mood?: string | null; created_at: string; audio_available: boolean }[];
  location_context?: LocationContext;
};

const support = [
  { type: "counselling" as const, label: "Assign counselling", icon: HeartHandshake },
  { type: "medical" as const, label: "Assign medical support", icon: Stethoscope },
  { type: "legal" as const, label: "Assign legal aid", icon: Scale },
];

export default function VictimRecordPage() {
  const params = useParams<{ id: string }>();
  const victimId = typeof params.id === "string" ? params.id : "";
  const [detail, setDetail] = useState<VictimDetail | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  async function load() {
    if (!victimId) return;
    setBusy("loading");
    try { setDetail(await api<VictimDetail>(`/official/victims/${victimId}`)); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The victim record could not be loaded."); }
    finally { setBusy(""); }
  }
  useEffect(() => {
    if (!["official", "admin"].includes(storedUser()?.role ?? "")) { window.location.assign("/login"); return; }
    void load();
  }, [victimId]);

  async function review(alertId: string, decision: "contact_victim" | "close") {
    setBusy(`${decision}-${alertId}`);
    try {
      await api(`/alerts/${alertId}/review`, { method: "POST", body: JSON.stringify({ decision, note: "Recorded by an authorised human reviewer." }) });
      setMessage(decision === "close" ? "Alert closed and recorded." : "Contact decision recorded.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save this review."); }
    finally { setBusy(""); }
  }
  async function assign(alertId: string, actionType: SupportType) {
    setBusy(`${actionType}-${alertId}`);
    try {
      await api(`/alerts/${alertId}/actions`, { method: "POST", body: JSON.stringify({ action_type: actionType, note: "Initiated by an authorised human reviewer." }) });
      setMessage("Support action recorded."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to assign support."); }
    finally { setBusy(""); }
  }
  async function deleteVictim() {
    if (deleteConfirmation !== "DELETE" || !victimId) return;
    setBusy("deleting-victim");
    try {
      await api<{ ok: boolean; message: string }>(`/official/victims/${victimId}`, { method: "DELETE", body: JSON.stringify({ confirmation: "DELETE" }) });
      window.location.assign("/official");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The account could not be deleted.");
      setBusy("");
    }
  }

  if (!detail) return <main className="min-h-screen bg-mint px-4 py-6 sm:px-6"><div className="mx-auto max-w-5xl"><Link href="/official" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-deepteal"><ArrowLeft className="h-4 w-4" />Back to victim records</Link>{message ? <p role="alert" className="mt-6 rounded-2xl bg-white p-4 text-sm text-body">{message}</p> : <div className="mt-6">{busy === "loading" ? <Loading /> : <p className="rounded-2xl bg-white p-4 text-sm text-body">Preparing victim record...</p>}</div>}</div></main>;

  const activeAlerts = detail.alerts.filter((alert) => alert.status === "pending_review");
  return <main className="min-h-screen bg-mint px-3 py-4 sm:px-6 sm:py-6 lg:px-10"><div className="mx-auto max-w-5xl"><Link href="/official" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d7e8e5] bg-white px-4 text-sm font-semibold text-deepteal shadow-sm"><ArrowLeft className="h-4 w-4" />Back to victim records</Link><header className="mt-6 rounded-[28px] bg-white p-5 shadow-calm sm:p-7"><p className="text-xs font-semibold tracking-[.14em] text-deepteal">{detail.victim.case_reference}</p><h1 className="display-serif mt-2 break-words text-3xl text-ink sm:text-4xl">{detail.victim.full_name}</h1><p className="mt-2 text-sm leading-6 text-body">Authorised victim case record</p></header>{message && <p role="status" className="mt-5 rounded-2xl border border-[#dbeae7] bg-white p-4 text-sm leading-6 text-ink">{message}</p>}<section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(17rem,.9fr)]"><div className="space-y-5"><AccountCard victim={detail.victim} /><WellbeingCard risk={detail.latest_risk} history={detail.risk_history} /><ReviewCard alerts={activeAlerts} busy={busy} onReview={review} onAssign={assign} /></div><div className="space-y-5"><LocationCard location={detail.location_context} /><TrustedCard people={detail.trusted_people} /><VoiceCard notes={detail.voice_notes} /></div></section><section className="mt-5 grid gap-5 sm:grid-cols-2"><TimelineCard title="Recent interactions" empty="No interaction metadata recorded." items={detail.recent_interactions.map((item) => `${item.channel}${item.mood ? ` - ${item.mood.replaceAll("_", " ")}` : ""} - ${new Date(item.created_at).toLocaleString()}`)} /><TimelineCard title="Support activity" empty="No support activity recorded." items={[...detail.support_actions.map((item) => `${item.action_type} - ${new Date(item.created_at).toLocaleString()}`), ...detail.support_sessions.map((item) => `${item.support_type || "Support"} (${item.status}) - ${new Date(item.scheduled_for || item.created_at || "").toLocaleString()}`)]} /><TimelineCard title="Help requests" empty="None recorded." items={detail.help_requests.map((item) => `${item.status.replaceAll("_", " ")} - ${new Date(item.created_at).toLocaleString()}`)} /><TimelineCard title="Emergency history" empty="None recorded." items={detail.emergency_events.map((item) => `${item.status.replaceAll("_", " ")} - ${new Date(item.created_at).toLocaleString()}`)} /></section><section className="mt-5 rounded-[28px] border border-[#efc9ce] bg-[#fffafa] p-5 shadow-calm sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#fce8e8] text-[#a34f58]"><Trash2 className="h-5 w-5" /></span><div className="min-w-0"><h2 className="font-semibold text-ink">Delete victim account</h2><p className="mt-1 text-sm leading-6 text-body">Permanently removes this victim&apos;s account, linked trusted-person accounts, check-ins, recordings, locations, alerts, and support records. This cannot be undone.</p><button type="button" onClick={() => { setDeleteConfirmation(""); setDeleteOpen(true); }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#a34f58] px-4 text-sm font-semibold text-white hover:bg-[#853842]"><Trash2 className="h-4 w-4" />Delete victim</button></div></div></section>{deleteOpen && <DeleteVictimDialog victim={detail.victim} value={deleteConfirmation} busy={busy === "deleting-victim"} onChange={setDeleteConfirmation} onCancel={() => setDeleteOpen(false)} onConfirm={() => void deleteVictim()} />}</div></main>;
}

function DeleteVictimDialog({ victim, value, busy, onChange, onCancel, onConfirm }: { victim: VictimDetail["victim"]; value: string; busy: boolean; onChange: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-end bg-[#173f47]/35 p-3 backdrop-blur-[2px] sm:place-items-center sm:p-6" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="delete-victim-title" aria-describedby="delete-victim-description" className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#fce8e8] text-[#a34f58]"><AlertTriangle className="h-5 w-5" /></span><div><h2 id="delete-victim-title" className="text-lg font-semibold text-ink">Delete {victim.full_name}?</h2><p id="delete-victim-description" className="mt-2 text-sm leading-6 text-body">This permanently removes the account and its private records. Type <strong className="text-ink">DELETE</strong> to confirm.</p></div></div><label className="mt-5 block text-sm font-semibold text-ink">Confirmation<input autoFocus value={value} onChange={(event) => onChange(event.target.value)} placeholder="Type DELETE" className="mt-2 min-h-11 w-full rounded-xl border border-[#d6e2e5] bg-[#f7fcfc] px-3 text-sm font-normal text-ink outline-none focus:border-[#a34f58]" /></label><div className="mt-5 grid grid-cols-2 gap-3"><button type="button" disabled={busy} onClick={onCancel} className="min-h-11 rounded-full border border-[#d6e2e5] text-sm font-semibold text-deepteal disabled:opacity-60">Cancel</button><button type="button" disabled={busy || value !== "DELETE"} onClick={onConfirm} className="min-h-11 rounded-full bg-[#a34f58] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Deleting..." : "Permanently delete"}</button></div></section></div>;
}

function Loading() { return <p className="flex items-center gap-2 rounded-2xl bg-white p-4 text-sm text-body"><LoaderCircle className="h-4 w-4 animate-spin" />Loading...</p>; }
function AccountCard({ victim }: { victim: VictimDetail["victim"] }) { return <section className="rounded-[28px] bg-white p-5 shadow-calm sm:p-6"><h2 className="font-semibold text-ink">Account information</h2><div className="mt-4 grid grid-cols-2 gap-3"><Info label="Username" value={victim.username || "Not recorded"} /><Info label="Registered" value={new Date(victim.created_at).toLocaleDateString()} /><Info label="Email" value={victim.email} breakAll /><Info label="Mobile" value={victim.mobile || "Not recorded"} /><Info label="Consent" value={victim.consent_status ? "Recorded" : "Not recorded"} /></div></section>; }
function Info({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) { return <div className="min-w-0 rounded-2xl bg-[#f7fcfc] p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-body">{label}</p><p className={`mt-1 text-sm text-ink ${breakAll ? "break-all" : "break-words"}`}>{value}</p></div>; }
function WellbeingCard({ risk, history }: { risk?: Risk | null; history: RiskHistory[] }) { const points = history.slice(-8); return <section className="rounded-[28px] bg-white p-5 shadow-calm sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-ink">Wellbeing overview</h2><p className="mt-1 text-sm text-body">Assistive monitoring signal, not a diagnosis.</p></div><StatusBadge level={risk?.risk_level ?? "low"} /></div><div className="mt-4 rounded-2xl bg-mint p-4"><p className="text-sm text-body">Current score</p><p className="mt-1 text-3xl font-semibold text-ink">{risk?.dynamic_score ?? "Not recorded"}</p><p className="mt-2 text-sm leading-5 text-body">{risk?.trend ? `${risk.trend} trend. ` : ""}{risk?.reasons?.[0] || "No current model reason is recorded."}</p></div>{points.length > 0 && <div className="mt-5"><p className="text-sm font-semibold text-ink">Recent trend</p><div className="mt-3 flex h-24 items-end gap-2">{points.map((point) => <div key={point._id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] text-body">{point.dynamic_score ?? "-"}</span><span className={`w-full rounded-t-md ${point.risk_level === "critical" ? "bg-[#a34f58]" : point.risk_level === "high" ? "bg-[#d89145]" : point.risk_level === "moderate" ? "bg-[#d6ae49]" : "bg-teal"}`} style={{ height: `${Math.max(8, Math.min(64, point.dynamic_score ?? 8))}px` }} /><span className="text-[9px] text-body">{new Date(point.created_at).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}</span></div>)}</div></div>}</section>; }
function ReviewCard({ alerts, busy, onReview, onAssign }: { alerts: RecordAlert[]; busy: string; onReview: (id: string, decision: "contact_victim" | "close") => Promise<void>; onAssign: (id: string, type: SupportType) => Promise<void> }) { if (!alerts.length) return null; return <section className="rounded-[28px] border border-[#efc9ce] bg-[#fffafa] p-5 shadow-calm sm:p-6"><div className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-[#a34f58]" /><h2 className="font-semibold text-ink">Human review needed</h2></div><div className="mt-4 space-y-4">{alerts.map((alert) => <article key={alert._id} className="rounded-2xl border border-[#efd7da] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge level={alert.severity} /><span className="text-xs text-body">{new Date(alert.created_at).toLocaleString()}</span></div><p className="mt-3 text-sm leading-6 text-body">{alert.reasons?.[0] || "Human review requested."}</p><div className="mt-4 grid grid-cols-2 gap-2"><button disabled={Boolean(busy)} onClick={() => void onReview(alert._id, "contact_victim")} className="min-h-11 rounded-full border border-[#9ed5cb] px-3 text-xs font-semibold text-deepteal disabled:opacity-60">{busy === `contact_victim-${alert._id}` ? "Saving..." : "Record contact"}</button><button disabled={Boolean(busy)} onClick={() => void onReview(alert._id, "close")} className="min-h-11 rounded-full border border-[#e5bcbc] px-3 text-xs font-semibold text-[#963e45] disabled:opacity-60">Close alert</button></div><div className="mt-2 grid gap-2 sm:grid-cols-3">{support.map(({ type, label, icon: Icon }) => <button key={type} disabled={Boolean(busy)} onClick={() => void onAssign(alert._id, type)} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#dbeae7] bg-white px-3 text-xs font-semibold text-deepteal disabled:opacity-60"><Icon className="h-3.5 w-3.5" />{busy === `${type}-${alert._id}` ? "Saving..." : label}</button>)}</div></article>)}</div></section>; }
function LocationCard({ location }: { location?: LocationContext }) { return <section className="rounded-[28px] bg-white p-5 shadow-calm sm:p-6"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-deepteal" /><h2 className="font-semibold text-ink">Location status</h2></div>{location?.shared ? <p className="mt-4 rounded-2xl bg-mint p-4 text-sm leading-6 text-body">Approximate location is actively shared until {location.expires_at ? new Date(location.expires_at).toLocaleTimeString() : "sharing ends"}. It is intentionally rounded.</p> : <p className="mt-4 text-sm leading-6 text-body">No active location sharing.</p>}</section>; }
function TrustedCard({ people }: { people: VictimDetail["trusted_people"] }) { return <section className="rounded-[28px] bg-white p-5 shadow-calm sm:p-6"><div className="flex items-center gap-2"><UsersRound className="h-5 w-5 text-deepteal" /><h2 className="font-semibold text-ink">Trusted persons</h2></div><div className="mt-4 space-y-2">{people.length ? people.map((person) => <div key={person.id} className="rounded-2xl bg-[#f7fcfc] p-3"><p className="font-semibold text-ink">{person.full_name || person.relationship || "Trusted person"}</p><p className="mt-1 text-xs text-body">{person.enabled ? "Active" : "Disabled"}{person.relationship ? ` - ${person.relationship}` : ""}</p></div>) : <p className="text-sm text-body">No trusted persons connected.</p>}</div></section>; }
function VoiceCard({ notes }: { notes: VictimDetail["voice_notes"] }) { return <section className="rounded-[28px] bg-white p-5 shadow-calm sm:p-6"><div className="flex items-center gap-2"><Mic className="h-5 w-5 text-deepteal" /><h2 className="font-semibold text-ink">Voice notes</h2></div><div className="mt-4 space-y-3">{notes.length ? notes.map((note) => <div key={note._id} className="rounded-2xl bg-[#f7fcfc] p-3"><p className="text-xs text-body">{new Date(note.created_at).toLocaleString()}{note.mood ? ` - ${note.mood.replaceAll("_", " ")}` : ""}</p>{note.audio_available && <SecureVoiceNote interactionId={note._id} />}</div>) : <p className="text-sm text-body">No voice notes recorded.</p>}</div></section>; }
function TimelineCard({ title, items, empty }: { title: string; items: string[]; empty: string }) { return <section className="rounded-[28px] bg-white p-5 shadow-calm sm:p-6"><h2 className="font-semibold text-ink">{title}</h2><div className="mt-4 space-y-2">{items.length ? items.slice(0, 8).map((item, index) => <p key={`${item}-${index}`} className="rounded-2xl bg-[#f7fcfc] p-3 text-sm leading-5 text-body">{item}</p>) : <p className="text-sm text-body">{empty}</p>}</div></section>; }
