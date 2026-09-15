"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Clock3, Filter, HeartHandshake, LoaderCircle, LogOut, MapPinned, Mic, Search, ShieldAlert, Stethoscope, UserRound, UsersRound, Scale, X } from "lucide-react";
import { api, clearSession, storedUser } from "@/lib/api";
import { StatusBadge } from "@/components/mindmesh/StatusBadge";
import { SecureVoiceNote } from "@/components/mindmesh/SecureVoiceNote";

type SupportType = "counselling" | "medical" | "legal";
type Alert = { _id: string; severity: "high" | "critical"; status: string; created_at: string };
type Victim = { id: string; case_reference: string; full_name: string; email: string; mobile?: string | null; created_at: string; consent_status: boolean; latest_risk?: { dynamic_score: number; risk_level: "low" | "moderate" | "high" | "critical"; trend: string } | null; last_interaction_at?: string | null; upcoming_support?: string | null; emergency_active?: boolean; emergency_created_at?: string | null };
type VictimList = { total: number; items: Victim[] };
type LocationContext = { shared: boolean; latitude?: number; longitude?: number; precision?: string; updated_at?: string; expires_at?: string };
type LocationPoint = { id: string; case_reference: string; full_name: string; risk_level: string; emergency_active: boolean; latitude: number; longitude: number; precision?: string; updated_at?: string; expires_at?: string };
type LocationFeed = { items: LocationPoint[] };
type VoiceNote = { _id: string; mood?: string | null; created_at: string; audio_available: boolean };
type RiskHistory = { _id: string; dynamic_score?: number; risk_level?: "low" | "moderate" | "high" | "critical"; trend?: string; created_at: string };
type RecordEvent = { _id: string; status: string; created_at: string };
type Interaction = { _id: string; channel: string; mood?: string | null; created_at: string };
type RecordAlert = { _id: string; severity: "high" | "critical"; status: string; reasons?: string[]; created_at: string; is_emergency?: boolean };
type SupportAction = { _id: string; action_type: string; created_at: string };
type SupportSession = { _id: string; support_type?: string; status: string; scheduled_for?: string; created_at?: string };
type VictimDetail = {
  victim: { id: string; case_reference: string; full_name: string; username?: string | null; email: string; mobile?: string | null; created_at: string; consent_status: boolean };
  latest_risk?: { dynamic_score?: number; previous_score?: number | null; risk_level?: "low" | "moderate" | "high" | "critical"; trend?: string; reasons?: string[] } | null;
  risk_history: RiskHistory[];
  recent_interactions: Interaction[];
  alerts: RecordAlert[];
  support_actions: SupportAction[];
  support_sessions: SupportSession[];
  trusted_people: { id: string; full_name?: string; relationship?: string; enabled: boolean; permissions: string[] }[];
  help_requests: RecordEvent[];
  emergency_events: RecordEvent[];
  voice_notes: VoiceNote[];
  location_context?: LocationContext;
};

const support: { type: SupportType; label: string; icon: typeof HeartHandshake }[] = [
  { type: "counselling", label: "Assign counselling", icon: HeartHandshake },
  { type: "medical", label: "Assign medical support", icon: Stethoscope },
  { type: "legal", label: "Assign legal aid", icon: Scale },
];

function timeValue(value?: string | null) { return value ? new Date(value).getTime() || 0 : 0; }
function priorityVictims(items: Victim[]) {
  return [...items].sort((left, right) => {
    if (Boolean(left.emergency_active) !== Boolean(right.emergency_active)) return left.emergency_active ? -1 : 1;
    const leftRisk = left.latest_risk?.risk_level === "critical" ? 3 : left.latest_risk?.risk_level === "high" ? 2 : left.latest_risk?.risk_level === "moderate" ? 1 : 0;
    const rightRisk = right.latest_risk?.risk_level === "critical" ? 3 : right.latest_risk?.risk_level === "high" ? 2 : right.latest_risk?.risk_level === "moderate" ? 1 : 0;
    if (leftRisk !== rightRisk) return rightRisk - leftRisk;
    return timeValue(right.emergency_created_at || right.last_interaction_at || right.created_at) - timeValue(left.emergency_created_at || left.last_interaction_at || left.created_at);
  });
}

export default function AdminDashboard() {
  const [victims, setVictims] = useState<VictimList | null>(null);
  const [locations, setLocations] = useState<LocationFeed | null>(null);
  const [locationError, setLocationError] = useState("");
  const [victimDetail, setVictimDetail] = useState<VictimDetail | null>(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [query, setQuery] = useState("");
  const [needsAttention, setNeedsAttention] = useState(false);
  const knownUrgent = useRef<Set<string>>(new Set());

  async function load() {
    setBusy("loading");
    try {
      const locationRequest = api<LocationFeed>("/official/location-context")
        .then((data) => ({ data, error: "" }))
        .catch((error: unknown) => ({ data: { items: [] }, error: error instanceof Error ? error.message : "Location context is unavailable." }));
      const [nextVictims, nextLocations, alerts] = await Promise.all([api<VictimList>("/official/victims"), locationRequest, api<Alert[]>("/alerts")]);
      const urgent = alerts.filter((alert) => alert.status === "pending_review");
      const isNew = urgent.some((alert) => !knownUrgent.current.has(alert._id));
      knownUrgent.current = new Set(urgent.map((alert) => alert._id));
      setVictims({ ...nextVictims, items: priorityVictims(nextVictims.items) });
      setLocations(nextLocations.data); setLocationError(nextLocations.error);
      if (isNew && urgent.length) {
        setNotice(`Urgent support update: ${urgent.length} record${urgent.length === 1 ? " requires" : "s require"} human review.`);
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([100, 60, 100]);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("MindMesh urgent support", { body: "A new urgent alert needs human review." });
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : "The admin dashboard could not be loaded."); }
    finally { setBusy(""); }
  }

  useEffect(() => {
    if (!["official", "admin"].includes(storedUser()?.role ?? "")) { window.location.assign("/login"); return; }
    void load(); const interval = window.setInterval(() => void load(), 20_000); return () => window.clearInterval(interval);
  }, []);

  function openVictim(victim: Victim) { window.location.assign(`/official/victims/${victim.id}`); }
  async function refreshOpenVictim(victimId: string) { setVictimDetail(await api<VictimDetail>(`/official/victims/${victimId}`)); }
  async function reviewAlert(alertId: string, decision: "contact_victim" | "close") {
    if (!victimDetail) return;
    setBusy(`${decision}-${alertId}`);
    try {
      await api(`/alerts/${alertId}/review`, { method: "POST", body: JSON.stringify({ decision, note: "Recorded by an authorised human reviewer." }) });
      setNotice(decision === "close" ? "Alert closed and recorded in the audit trail." : "Contact decision recorded in the audit trail.");
      await Promise.all([refreshOpenVictim(victimDetail.victim.id), load()]);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save this review."); }
    finally { setBusy(""); }
  }
  async function assignSupport(alertId: string, actionType: SupportType) {
    if (!victimDetail) return;
    setBusy(`${actionType}-${alertId}`);
    try {
      await api(`/alerts/${alertId}/actions`, { method: "POST", body: JSON.stringify({ action_type: actionType, note: "Initiated by authorised human review." }) });
      setNotice("Support action recorded.");
      await Promise.all([refreshOpenVictim(victimDetail.victim.id), load()]);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to assign support."); }
    finally { setBusy(""); }
  }

  const orderedVictims = victims?.items ?? [];
  const visibleVictims = useMemo(() => orderedVictims.filter((victim) => {
    const matchesQuery = [victim.full_name, victim.case_reference, victim.email, victim.mobile].filter(Boolean).join(" ").toLowerCase().includes(query.trim().toLowerCase());
    const priority = victim.emergency_active || ["high", "critical"].includes(victim.latest_risk?.risk_level ?? "");
    return matchesQuery && (!needsAttention || priority);
  }), [orderedVictims, query, needsAttention]);
  const emergencyActive = orderedVictims.some((victim) => victim.emergency_active);

  return <main className={`admin-portal min-h-screen bg-mint px-3 py-4 sm:px-6 sm:py-6 lg:px-10 ${emergencyActive ? "admin-portal--emergency" : ""}`}><div className="mx-auto max-w-7xl">
    <header className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 max-w-2xl"><p className="text-xs font-semibold tracking-[.16em] text-deepteal">MINDMESH - ADMIN</p><h1 className="display-serif mt-2 text-3xl text-ink sm:text-4xl">Victim records</h1><p className="mt-2 hidden text-sm leading-6 text-body sm:block">Open a registered victim record for authorised wellbeing, support, and safety information.</p></div><button onClick={() => { clearSession(); window.location.assign("/login"); }} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#d7e8e5] bg-white px-4 text-sm font-semibold text-deepteal max-sm:w-full max-sm:justify-center"><LogOut className="h-4 w-4" />Log out</button></header>
    {notice && <p role="status" className="mt-5 rounded-2xl border border-[#dbeae7] bg-white p-4 text-sm leading-6 text-ink">{notice}</p>}
    {emergencyActive && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-[#efc9ce] bg-[#fff8f8] p-4 text-sm leading-6 text-ink"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9b3c49]" /><p><span className="font-semibold">Emergency active.</span> Emergency case cards are pinned at the top in red for immediate human review.</p></div>}
    <LocationHeatmap data={locations} loading={busy === "loading"} error={locationError} />
    <section className="mt-7 min-w-0"><VictimRecords data={victims} victims={visibleVictims} busy={busy} query={query} needsAttention={needsAttention} onQuery={setQuery} onFilter={() => setNeedsAttention((current) => !current)} onOpen={openVictim} /></section>
  </div></main>;
}

function Loading() { return <p className="flex items-center gap-2 rounded-xl bg-[#f7fcfc] p-4 text-sm text-body"><LoaderCircle className="h-4 w-4 animate-spin" />Loading...</p>; }
function VictimRecords({ data, victims, busy, query, needsAttention, onQuery, onFilter, onOpen }: { data: VictimList | null; victims: Victim[]; busy: string; query: string; needsAttention: boolean; onQuery: (value: string) => void; onFilter: () => void; onOpen: (victim: Victim) => void }) { return <section className="min-w-0 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><UsersRound className="h-5 w-5 shrink-0 text-deepteal" /><div><h2 className="font-semibold text-ink">Registered victims {data ? `(${data.total})` : ""}</h2><p className="mt-1 text-xs leading-5 text-body">Each account is an individual case record.</p></div></div><p className="flex items-center gap-1 text-xs text-body"><Clock3 className="h-3.5 w-3.5" />Auto-refreshes</p></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#d6e2e5] bg-white px-3"><Search className="h-4 w-4 shrink-0 text-deepteal" /><input value={query} onChange={(event) => onQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none" placeholder="Search name, case, email, or mobile" aria-label="Search victim records" /></label><button type="button" onClick={onFilter} aria-pressed={needsAttention} className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold ${needsAttention ? "border-[#e4b3b8] bg-[#fff5f5] text-[#963e45]" : "border-[#d6e2e5] text-deepteal"}`}><Filter className="h-4 w-4" />Needs attention</button></div><div className="mt-4 grid grid-cols-2 gap-3 2xl:grid-cols-3">{busy === "loading" ? <div className="col-span-2 2xl:col-span-3"><Loading /></div> : victims.map((victim) => <VictimCard key={victim.id} victim={victim} busy={busy === `victim-${victim.id}`} onOpen={onOpen} />)}{data && !victims.length && <p className="col-span-2 rounded-xl bg-[#f7fcfc] p-4 text-sm text-body 2xl:col-span-3">{query || needsAttention ? "No registered victim records match this view." : "No victim accounts registered."}</p>}</div></section>; }
function VictimCard({ victim, busy, onOpen }: { victim: Victim; busy: boolean; onOpen: (victim: Victim) => void }) { const risk = victim.latest_risk?.risk_level ?? "low"; return <button onClick={() => onOpen(victim)} className={`group flex min-w-0 flex-col rounded-2xl border p-3 text-left shadow-sm transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deepteal sm:p-4 ${victim.emergency_active ? "border-[#e8aab1] bg-[#fff5f5] hover:border-[#b65360]" : "border-[#e4eeee] bg-white hover:border-[#9ed5cb]"}`}><div className="flex items-start justify-between gap-2"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-10 sm:w-10 ${victim.emergency_active ? "bg-[#f7d9dd] text-[#a13f4b]" : "bg-mint text-deepteal"}`}>{victim.emergency_active ? <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" /> : <UserRound className="h-4 w-4 sm:h-5 sm:w-5" />}</span>{victim.emergency_active ? <span className="rounded-full bg-[#f7d9dd] px-2 py-1 text-[10px] font-semibold text-[#963e45]">Emergency</span> : <StatusBadge level={risk} />}</div><div className="mt-3 min-w-0 sm:mt-4"><p className="break-words text-sm font-semibold text-ink sm:text-base">{busy ? "Opening..." : victim.full_name}</p><p className="mt-1 break-all text-[10px] font-medium tracking-wide text-body sm:text-xs">{victim.case_reference}</p></div><div className="mt-3 border-t border-current/10 pt-3 text-[11px] leading-4 text-body sm:mt-4 sm:text-xs sm:leading-5">{victim.emergency_active ? <span className="font-semibold text-[#963e45]">Review pending</span> : <span>Activity: {victim.last_interaction_at ? new Date(victim.last_interaction_at).toLocaleDateString() : "none"}</span>}{victim.upcoming_support && <span className="mt-1 block text-deepteal">Support: {victim.upcoming_support}</span>}</div></button>; }

function LocationHeatmap({ data, loading, error }: { data: LocationFeed | null; loading: boolean; error: string }) { const points = (data?.items ?? []).filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)); const latitudes = points.map((point) => point.latitude); const longitudes = points.map((point) => point.longitude); const minLat = points.length ? Math.min(...latitudes) : 0; const maxLat = points.length ? Math.max(...latitudes) : 0; const minLng = points.length ? Math.min(...longitudes) : 0; const maxLng = points.length ? Math.max(...longitudes) : 0; const position = (value: number, min: number, max: number, reverse = false) => { const ratio = max === min ? .5 : .1 + ((value - min) / (max - min)) * .8; return `${(reverse ? 1 - ratio : ratio) * 100}%`; }; return <section className="mt-6 min-w-0 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><div className="flex items-start gap-2"><MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-deepteal" /><div><h2 className="font-semibold text-ink">Live location heatmap</h2><p className="mt-1 text-sm leading-5 text-body">Relative density of victims&apos; latest actively shared approximate locations.</p></div></div>{loading ? <div className="mt-4"><Loading /></div> : error ? <p role="status" className="mt-4 rounded-xl bg-[#f7fcfc] p-4 text-sm leading-6 text-body">Location context is unavailable right now. {error}</p> : !points.length ? <p className="mt-4 rounded-xl bg-[#f7fcfc] p-4 text-sm leading-6 text-body">No active, authorised location snapshots are available.</p> : <><div role="img" aria-label={`${points.length} active approximate location snapshots shown as a relative density heatmap`} className="relative mt-4 h-52 overflow-hidden rounded-2xl border border-[#dbeae7] bg-[#f7fcfc] sm:h-64"><span className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49.8%,#d7ebe7_50%,transparent_50.2%),linear-gradient(#d7ebe7_1px,transparent_1px)] bg-[size:100%_100%,100%_25%]" />{points.map((point) => { const left = position(point.longitude, minLng, maxLng); const top = position(point.latitude, minLat, maxLat, true); const color = point.emergency_active ? "rgba(179, 65, 79, .48)" : "rgba(30, 141, 133, .34)"; return <span key={point.id} aria-hidden="true"><span className="absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md" style={{ left, top, background: `radial-gradient(circle, ${color} 0%, transparent 70%)` }} /><span className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white shadow-sm ${point.emergency_active ? "bg-[#a34f58]" : "bg-teal"}`} style={{ left, top }}><span className="h-2 w-2 rounded-full bg-white" /></span></span>; })}</div><div className="mt-3 flex flex-wrap gap-3 text-xs text-body"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-teal" />Shared location</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#a34f58]" />Emergency active</span><span>{points.length} active snapshot{points.length === 1 ? "" : "s"}</span></div><p className="mt-3 text-xs leading-5 text-body">This is not an exact map: location is deliberately rounded, expires automatically, and is visible only to authorised administrators.</p></>}</section>; }

function PanelHeader({ label, title, onClose }: { label: string; title: string; onClose: () => void }) { return <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold tracking-[.12em] text-deepteal">{label}</p><h2 className="mt-1 break-words text-xl font-semibold text-ink">{title}</h2></div><button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d6e2e5] text-deepteal" aria-label="Close details"><X className="h-4 w-4" /></button></div>; }
function VictimPanel({ detail, busy, onClose, onReview, onAssign }: { detail: VictimDetail | null; busy: string; onClose: () => void; onReview: (alertId: string, decision: "contact_victim" | "close") => Promise<void>; onAssign: (alertId: string, action: SupportType) => Promise<void> }) { if (!detail) return <aside className="min-w-0 rounded-[28px] border border-dashed border-[#badbd5] bg-white p-5 sm:p-6 xl:sticky xl:top-6 xl:h-fit"><UsersRound className="h-7 w-7 text-deepteal" /><h2 className="mt-4 text-lg font-semibold text-ink">Open a victim record</h2><p className="mt-2 text-sm leading-6 text-body">Select a registered victim card to view their authorised case information.</p></aside>; const activeAlerts = detail.alerts.filter((alert) => alert.status === "pending_review"); return <aside className="min-w-0 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto"><PanelHeader label={detail.victim.case_reference} title={detail.victim.full_name} onClose={onClose} /><section className="mt-4 grid grid-cols-2 gap-2 text-sm"><Info label="Username" value={detail.victim.username || "Not recorded"} /><Info label="Registered" value={new Date(detail.victim.created_at).toLocaleDateString()} /><Info label="Email" value={detail.victim.email} breakAll /><Info label="Mobile" value={detail.victim.mobile || "Not recorded"} /><Info label="Consent" value={detail.victim.consent_status ? "Recorded" : "Not recorded"} /></section><section className="mt-5 rounded-2xl bg-mint p-4"><div className="flex items-center justify-between gap-3"><p className="font-semibold text-ink">Current wellbeing signal</p><StatusBadge level={detail.latest_risk?.risk_level ?? "low"} /></div><p className="mt-2 text-sm leading-5 text-body">Score: <span className="font-semibold text-ink">{detail.latest_risk?.dynamic_score ?? "Not recorded"}</span> {detail.latest_risk?.trend ? `- ${detail.latest_risk.trend} trend` : ""}</p><p className="mt-2 text-xs leading-5 text-body">{detail.latest_risk?.reasons?.[0] || "No current model reason is recorded."}</p></section><RiskTimeline history={detail.risk_history} />{detail.location_context?.shared && <p className="mt-5 rounded-xl bg-[#f7fcfc] p-3 text-sm leading-5 text-body">Approximate location is active until {detail.location_context.expires_at ? new Date(detail.location_context.expires_at).toLocaleTimeString() : "sharing ends"}.</p>}<ReviewActions alerts={activeAlerts} busy={busy} onReview={onReview} onAssign={onAssign} /><VoiceNotes notes={detail.voice_notes} /><TrustedPeople people={detail.trusted_people} /><Metadata title="Recent interaction metadata" items={detail.recent_interactions.map((item) => `${item.channel}${item.mood ? ` - ${item.mood.replaceAll("_", " ")}` : ""} - ${new Date(item.created_at).toLocaleString()}`)} empty="No interaction metadata available." /><Metadata title="Support activity" items={[...detail.support_actions.map((item) => `${item.action_type} - ${new Date(item.created_at).toLocaleString()}`), ...detail.support_sessions.map((item) => `${item.support_type || "Support"} (${item.status}) - ${new Date(item.scheduled_for || item.created_at || "").toLocaleString()}`)]} empty="No support activity recorded." /><Metadata title="Help requests" items={detail.help_requests.map((item) => `${item.status.replaceAll("_", " ")} - ${new Date(item.created_at).toLocaleString()}`)} empty="None recorded." /><Metadata title="Emergency events" items={detail.emergency_events.map((item) => `${item.status.replaceAll("_", " ")} - ${new Date(item.created_at).toLocaleString()}`)} empty="None recorded." /></aside>; }
function Info({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) { return <div className="min-w-0 rounded-xl bg-[#f7fcfc] p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-body">{label}</p><p className={`mt-1 text-xs text-ink ${breakAll ? "break-all" : "break-words"}`}>{value}</p></div>; }
function RiskTimeline({ history }: { history: RiskHistory[] }) { const latest = history.slice(-8); if (!latest.length) return null; return <section className="mt-5 border-t border-[#e4eeee] pt-5"><h3 className="text-sm font-semibold text-ink">Recent wellbeing trend</h3><div className="mt-3 flex h-20 items-end gap-1.5">{latest.map((point) => <div key={point._id} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1"><span className="text-[10px] text-body">{point.dynamic_score ?? "-"}</span><span className={`w-full rounded-t-md ${point.risk_level === "critical" ? "bg-[#a34f58]" : point.risk_level === "high" ? "bg-[#d89145]" : point.risk_level === "moderate" ? "bg-[#d6ae49]" : "bg-teal"}`} style={{ height: `${Math.max(8, Math.min(56, point.dynamic_score ?? 8))}px` }} /><span className="text-[9px] text-body">{new Date(point.created_at).toLocaleDateString(undefined, { month: "numeric", day: "numeric" })}</span></div>)}</div><p className="mt-2 text-xs text-body">Signals support human review; they are not diagnoses.</p></section>; }
function ReviewActions({ alerts, busy, onReview, onAssign }: { alerts: RecordAlert[]; busy: string; onReview: (id: string, decision: "contact_victim" | "close") => Promise<void>; onAssign: (id: string, action: SupportType) => Promise<void> }) { if (!alerts.length) return null; return <section className="mt-5 border-t border-[#e4eeee] pt-5"><div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-[#a34f58]" /><h3 className="text-sm font-semibold text-ink">Human review needed</h3></div><div className="mt-3 space-y-3">{alerts.map((alert) => <div key={alert._id} className={`rounded-xl border p-3 ${alert.is_emergency ? "border-[#efc9ce] bg-[#fff8f8]" : "border-[#dbeae7] bg-[#f7fcfc]"}`}><div className="flex flex-wrap items-center justify-between gap-2"><StatusBadge level={alert.severity} /><span className="text-xs text-body">{new Date(alert.created_at).toLocaleString()}</span></div><p className="mt-2 text-xs leading-5 text-body">{alert.reasons?.[0] || "Human review requested."}</p><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={Boolean(busy)} onClick={() => void onReview(alert._id, "contact_victim")} className="min-h-10 rounded-full border border-[#9ed5cb] px-2 text-xs font-semibold text-deepteal disabled:opacity-60">{busy === `contact_victim-${alert._id}` ? "Saving..." : "Record contact"}</button><button disabled={Boolean(busy)} onClick={() => void onReview(alert._id, "close")} className="min-h-10 rounded-full border border-[#e5bcbc] px-2 text-xs font-semibold text-[#963e45] disabled:opacity-60">Close alert</button></div><div className="mt-2 grid gap-2">{support.map(({ type, label, icon: Icon }) => <button key={type} disabled={Boolean(busy)} onClick={() => void onAssign(alert._id, type)} className="flex min-h-10 items-center gap-2 rounded-lg border border-[#dbeae7] bg-white px-3 text-left text-xs font-semibold text-deepteal disabled:opacity-60"><Icon className="h-3.5 w-3.5 shrink-0" />{busy === `${type}-${alert._id}` ? "Saving..." : label}</button>)}</div></div>)}</div></section>; }
function VoiceNotes({ notes }: { notes: VoiceNote[] }) { return <section className="mt-5 border-t border-[#e4eeee] pt-5"><div className="flex items-center gap-2"><Mic className="h-4 w-4 text-deepteal" /><h3 className="text-sm font-semibold text-ink">Voice notes</h3></div><div className="mt-2 space-y-2">{notes.length ? notes.map((note) => <div key={note._id} className="rounded-xl bg-[#f7fcfc] p-3 text-sm text-body"><p>{new Date(note.created_at).toLocaleString()}{note.mood ? ` - ${note.mood.replaceAll("_", " ")}` : ""}</p>{note.audio_available && <SecureVoiceNote interactionId={note._id} />}</div>) : <p className="text-sm text-body">None recorded.</p>}</div></section>; }
function TrustedPeople({ people }: { people: VictimDetail["trusted_people"] }) { return <section className="mt-5 border-t border-[#e4eeee] pt-5"><h3 className="text-sm font-semibold text-ink">Trusted persons</h3><div className="mt-2 space-y-2">{people.length ? people.map((person) => <div key={person.id} className="rounded-xl bg-[#f7fcfc] p-3 text-sm text-body"><span className="break-words font-semibold text-ink">{person.full_name || person.relationship || "Trusted person"}</span><span className="block text-xs">{person.enabled ? "Active" : "Disabled"}{person.relationship ? ` - ${person.relationship}` : ""}</span></div>) : <p className="text-sm text-body">None connected.</p>}</div></section>; }
function Metadata({ title, items, empty }: { title: string; items: string[]; empty: string }) { return <section className="mt-5 border-t border-[#e4eeee] pt-5"><h3 className="text-sm font-semibold text-ink">{title}</h3><div className="mt-2 space-y-2">{items.length ? items.slice(0, 8).map((item, index) => <p key={`${item}-${index}`} className="break-words rounded-xl bg-[#f7fcfc] p-3 text-xs leading-5 text-body">{item}</p>) : <p className="text-sm text-body">{empty}</p>}</div></section>; }
