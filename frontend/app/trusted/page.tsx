"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, HeartPulse, House, LocateFixed, LogOut, MapPinned, Mic, ShieldCheck, UserRound } from "lucide-react";
import { api, clearSession, storedUser } from "@/lib/api";
import { StatusBadge } from "@/components/mindmesh/StatusBadge";
import { SecureVoiceNote } from "@/components/mindmesh/SecureVoiceNote";

type SharedAlert = { _id: string; severity: string; status: string; created_at: string; is_emergency?: boolean };
type VoiceNote = { _id: string; mood?: string | null; created_at: string; audio_available: boolean };
type Portal = {
  victim: { full_name: string };
  relationship?: string;
  permissions: string[];
  connection_active: boolean;
  wellbeing_score?: number;
  wellbeing_status?: string;
  emergency_active?: boolean;
  latest_checkin?: { mood?: string; created_at: string };
  alerts?: SharedAlert[];
  help_requests?: { _id: string; created_at: string; channel: string }[];
  voice_notes?: VoiceNote[];
};
type Location = { shared: boolean; state?: "active" | "not_active" | "expired" | "revoked" | "waiting_for_location" | "location_expired"; expires_at?: string | null; latitude?: number; longitude?: number; updated_at?: string };

function announceUrgent() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.([100, 60, 100]);
  if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("MindMesh emergency", { body: "A connected victim needs urgent support." });
}

export default function TrustedPortalPage() {
  const [portal, setPortal] = useState<Portal | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState("");
  const [notice, setNotice] = useState("");
  const [urgentPopup, setUrgentPopup] = useState("");
  const knownUrgent = useRef<Set<string>>(new Set());

  async function load() {
    try {
      const locationRequest = api<Location>("/trusted/portal/location")
        .then((data) => ({ data, error: "" }))
        .catch((error: unknown) => ({ data: null, error: error instanceof Error ? error.message : "Location unavailable." }));
      const [nextPortal, nextLocation] = await Promise.all([api<Portal>("/trusted/portal"), locationRequest]);
      const urgentIds = [
        ...(nextPortal.alerts ?? []).filter((alert) => alert.status === "pending_review").map((alert) => alert._id),
        ...(nextPortal.help_requests ?? []).map((request) => request._id),
      ];
      const hasNewUrgent = urgentIds.some((id) => !knownUrgent.current.has(id));
      knownUrgent.current = new Set(urgentIds);
      setPortal(nextPortal);
      setLocation(nextLocation.data);
      setLocationError(nextLocation.error);
      if (hasNewUrgent && urgentIds.length) {
        setUrgentPopup("Emergency active. Please review the shared status and location now.");
        announceUrgent();
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Unable to open this portal.");
    }
  }

  useEffect(() => {
    if (storedUser()?.role !== "trusted_person") { window.location.assign("/login"); return; }
    void load();
    const interval = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(interval);
  }, []);

  if (!portal) return <main className="grid min-h-screen place-items-center bg-mint text-body">Loading portal...</main>;
  const emergencyActive = Boolean(portal.emergency_active || portal.alerts?.some((alert) => alert.is_emergency && alert.status === "pending_review"));
  const locationAllowed = portal.permissions.includes("live_location");
  const emergencyShared = portal.permissions.includes("emergency_alerts") || portal.permissions.includes("alert_history");
  const logout = () => { clearSession(); window.location.assign("/login"); };

  return <main className={`trusted-portal relative min-h-screen bg-mint px-3 py-4 pb-28 sm:px-6 sm:py-7 sm:pb-28 md:pb-7 ${emergencyActive ? "trusted-portal--emergency" : ""}`}>
    <div className="mx-auto max-w-3xl md:pt-14">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0"><p className="text-xs font-semibold tracking-[.16em] text-deepteal">MINDMESH - TRUSTED PERSON</p><h1 className="display-serif mt-2 text-3xl text-ink">Shared support</h1><p className="mt-2 text-sm leading-6 text-body">Updates shared by {portal.victim.full_name}.</p></div>
        <button onClick={logout} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#dbeae7] bg-white text-deepteal" aria-label="Log out"><LogOut className="h-5 w-5" /></button>
      </header>

      {emergencyActive && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl bg-[#a34f58] p-4 text-white shadow-calm"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Emergency active</p><p className="mt-1 text-sm leading-5 text-white/90">{urgentPopup || "A connected victim requested urgent support. Review the available location and status."}</p></div></div>}
      {!emergencyActive && urgentPopup && <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-[#efc9ce] bg-[#fff8f8] p-4"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9b3c49]" /><p className="text-sm leading-6 text-ink">{urgentPopup}</p></div>}
      {notice && <p role="alert" className="mt-5 rounded-2xl bg-[#fff3f4] p-4 text-sm leading-6 text-[#81343f]">{notice}</p>}

      <section id="wellbeing" aria-label="Connected victim overview" className="mt-6 grid grid-cols-2 gap-3">
        <Card icon={UserRound} label="Connected to" value={portal.victim.full_name} />
        <Card icon={ShieldCheck} label="Connection" value={portal.connection_active ? portal.relationship || "Connected" : "Inactive"} />
        {portal.wellbeing_status ? <StatusCard label="Wellbeing level" status={portal.wellbeing_status} detail={portal.wellbeing_score !== undefined ? `Score: ${portal.wellbeing_score}` : undefined} /> : <Card icon={HeartPulse} label="Wellbeing level" value="Not shared" />}
        {emergencyShared ? <EmergencyCard active={emergencyActive} /> : <Card icon={AlertTriangle} label="Emergency" value="Not shared" />}
        {portal.latest_checkin ? <Card icon={ShieldCheck} label="Latest check-in" value={portal.latest_checkin.mood || "Recorded"} detail={new Date(portal.latest_checkin.created_at).toLocaleString()} /> : <Card icon={ShieldCheck} label="Latest check-in" value="Not shared" />}
      </section>
      <LiveLocation location={location} allowed={locationAllowed} error={locationError} />
      <HelpRequests requests={portal.help_requests} />
      <SharedVoiceNotes notes={portal.voice_notes} />
      <SharedAlerts alerts={portal.alerts} />
      <Permissions permissions={portal.permissions} />
    </div>
    <TrustedNavigation onLogout={logout} />
  </main>;
}

function TrustedNavigation({ onLogout }: { onLogout: () => void }) {
  const itemClass = "flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium text-[#63808a] transition hover:bg-mint hover:text-deepteal";
  return <nav aria-label="Trusted portal navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[#e4eeee] bg-white/95 px-3 py-1.5 backdrop-blur md:absolute md:top-0 md:bottom-auto md:mx-auto md:max-w-4xl md:rounded-b-2xl md:border">
    <div className="mx-auto flex max-w-md items-stretch justify-between gap-1 md:max-w-3xl"><Link href="/trusted" className={itemClass}><House className="h-5 w-5" /><span>Home</span></Link><a href="#wellbeing" className={itemClass}><HeartPulse className="h-5 w-5" /><span>Wellbeing</span></a><a href="#live-location" className={itemClass}><MapPinned className="h-5 w-5" /><span>Location</span></a><a href="#alerts" className={itemClass}><AlertTriangle className="h-5 w-5" /><span>Alerts</span></a><button type="button" onClick={onLogout} className={itemClass} aria-label="Log out"><LogOut className="h-5 w-5" /><span>Log out</span></button></div>
  </nav>;
}

function Card({ icon: Icon, label, value, detail }: { icon: typeof ShieldCheck; label: string; value: string; detail?: string }) { return <article className="min-w-0 rounded-[24px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><Icon className="h-5 w-5 text-deepteal" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-body">{label}</p><p className="mt-1 break-words text-lg font-semibold capitalize text-ink">{value}</p>{detail && <p className="mt-1 break-words text-xs leading-5 text-body">{detail}</p>}</article>; }
function StatusCard({ label, status, detail }: { label: string; status: string; detail?: string }) { return <article className="min-w-0 rounded-[24px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><HeartPulse className="h-5 w-5 text-deepteal" /><p className="mt-4 text-xs font-semibold uppercase tracking-wide text-body">{label}</p><div className="mt-2"><StatusBadge level={status} /></div>{detail && <p className="mt-2 text-xs leading-5 text-body">{detail}</p>}</article>; }
function EmergencyCard({ active }: { active: boolean }) { return <article className={`min-w-0 rounded-[24px] border p-4 shadow-calm sm:p-5 ${active ? "border-[#a34f58] bg-[#a34f58] text-white" : "border-[#e4eeee] bg-white"}`}><AlertTriangle className={`h-5 w-5 ${active ? "text-white" : "text-deepteal"}`} /><p className={`mt-4 text-xs font-semibold uppercase tracking-wide ${active ? "text-white/80" : "text-body"}`}>Emergency</p><p className={`mt-1 text-lg font-semibold ${active ? "text-white" : "text-ink"}`}>{active ? "Active" : "No active request"}</p>{active && <p className="mt-1 text-xs leading-5 text-white/90">Human review pending.</p>}</article>; }

function LiveLocation({ location, allowed, error }: { location: Location | null; allowed: boolean; error: string }) {
  const mapUrl = location?.shared && typeof location.latitude === "number" && typeof location.longitude === "number" ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(String(location.latitude))}&mlon=${encodeURIComponent(String(location.longitude))}#map=14/${encodeURIComponent(String(location.latitude))}/${encodeURIComponent(String(location.longitude))}` : null;
  const unavailable = location?.state === "expired" ? "Sharing expired." : location?.state === "revoked" ? "Sharing was stopped." : location?.state === "waiting_for_location" ? "Waiting for a location update." : location?.state === "location_expired" ? "The location update expired." : "Location is not active.";
  return <section id="live-location" className="mt-5 min-w-0 scroll-mt-5 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:mt-7 sm:p-5"><div className="flex items-start gap-2"><MapPinned className="mt-0.5 h-5 w-5 shrink-0 text-deepteal" /><div><h2 className="font-semibold text-ink">Live location</h2><p className="mt-1 text-sm leading-5 text-body">Approximate location only.</p></div></div>{!allowed ? <p className="mt-4 rounded-xl bg-[#f7fcfc] p-3 text-sm leading-6 text-body">Location is not shared with this account.</p> : error ? <p role="status" className="mt-4 rounded-xl bg-[#f7fcfc] p-3 text-sm leading-6 text-body">Location unavailable. {error}</p> : location?.shared && mapUrl ? <div className="mt-4 rounded-2xl bg-[#f7fcfc] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-ink">Location active</p><p className="mt-1 text-sm leading-6 text-body">Updated {location.updated_at ? new Date(location.updated_at).toLocaleString() : "recently"}. Ends {location.expires_at ? new Date(location.expires_at).toLocaleTimeString() : "when sharing ends"}.</p></div><LocateFixed className="h-5 w-5 shrink-0 text-deepteal" /></div><a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#9ed5cb] px-4 text-sm font-semibold text-deepteal sm:w-fit"><ExternalLink className="h-4 w-4" />Open map</a></div> : <p className="mt-4 rounded-xl bg-[#f7fcfc] p-3 text-sm leading-6 text-body">{unavailable}</p>}</section>;
}
function HelpRequests({ requests }: { requests?: Portal["help_requests"] }) { if (!requests) return null; return <section className="mt-5 min-w-0 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#9b3c49]" /><h2 className="font-semibold text-ink">Help requests</h2></div><div className="mt-4 space-y-2">{requests.length ? requests.map((request) => <div key={request._id} className="break-words rounded-xl bg-[#f7fcfc] p-3 text-sm leading-6 text-body"><span className="font-semibold text-ink">Help requested</span> - {new Date(request.created_at).toLocaleString()}</div>) : <p className="text-sm text-body">No shared requests.</p>}</div></section>; }
function SharedVoiceNotes({ notes }: { notes?: VoiceNote[] }) { if (!notes) return null; return <section className="mt-5 min-w-0 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><div className="flex items-center gap-2"><Mic className="h-5 w-5 text-deepteal" /><h2 className="font-semibold text-ink">Voice notes</h2></div><div className="mt-4 space-y-2">{notes.length ? notes.map((note) => <div key={note._id} className="rounded-xl bg-[#f7fcfc] p-3 text-sm leading-6 text-body"><p>{new Date(note.created_at).toLocaleString()}{note.mood ? ` - ${note.mood.replaceAll("_", " ")}` : ""}</p>{note.audio_available && <SecureVoiceNote interactionId={note._id} />}</div>) : <p className="text-sm text-body">No shared voice notes.</p>}</div></section>; }
function SharedAlerts({ alerts }: { alerts?: SharedAlert[] }) { if (!alerts) return null; return <section id="alerts" className="mt-5 min-w-0 scroll-mt-5 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-[#9b3c49]" /><h2 className="font-semibold text-ink">Alerts</h2></div><div className="mt-4 space-y-2">{alerts.length ? alerts.map((alert) => <div key={alert._id} className={`flex min-w-0 items-start gap-3 rounded-xl p-3 text-sm leading-6 text-body ${alert.is_emergency && alert.status === "pending_review" ? "bg-[#fff3f4]" : "bg-[#f7fcfc]"}`}><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alert.is_emergency && alert.status === "pending_review" ? "text-[#9b3c49]" : "text-deepteal"}`} /><p className="min-w-0 break-words"><span className="font-semibold capitalize text-ink">{alert.is_emergency && alert.status === "pending_review" ? "Emergency active" : alert.severity}</span> - {alert.status.replaceAll("_", " ")} - {new Date(alert.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-body">No shared alerts.</p>}</div></section>; }
function Permissions({ permissions }: { permissions: string[] }) { return <section className="mt-5 rounded-[28px] border border-[#e4eeee] bg-white p-4 shadow-calm sm:p-5"><h2 className="font-semibold text-ink">Shared access</h2><div className="mt-3 flex flex-wrap gap-2">{permissions.length ? permissions.map((permission) => <span key={permission} className="rounded-full bg-mint px-3 py-1.5 text-xs font-semibold text-deepteal">{permission.replaceAll("_", " ")}</span>) : <span className="text-sm text-body">Nothing shared.</span>}</div></section>; }
