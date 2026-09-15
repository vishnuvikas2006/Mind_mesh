"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Check, MapPin, Pencil, Plus, ShieldOff, Trash2, UsersRound, X } from "lucide-react";
import { AppShell } from "@/components/mindmesh/AppShell";
import { api, storedUser } from "@/lib/api";
import { shareLocationWithTrustedPerson } from "@/lib/urgent-location";

const permissionOptions = ["wellbeing_score", "wellbeing_status", "daily_checkins", "emergency_alerts", "help_requests", "alert_history", "live_location", "voice_notes"] as const;
type Permission = typeof permissionOptions[number];
type Person = { _id: string; full_name: string; email: string; mobile?: string; relationship: string; permissions: Permission[]; enabled: boolean; must_change_password: boolean };
type Share = { trusted_person_id: string; active: boolean; expires_at?: string | null };
type PersonForm = { full_name: string; email: string; mobile: string; relationship: string; temporary_password: string; confirm_temporary_password: string; permissions: Permission[] };

const blank: PersonForm = { full_name: "", email: "", mobile: "", relationship: "", temporary_password: "", confirm_temporary_password: "", permissions: ["emergency_alerts", "help_requests"] };
const label = (permission: string) => permission.replaceAll("_", " ");

export default function TrustedPeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [form, setForm] = useState<PersonForm>(blank);
  const [editing, setEditing] = useState<Person | null>(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      const [nextPeople, nextShares] = await Promise.all([api<Person[]>("/trusted/people"), api<Share[]>("/trusted/location-shares")]);
      setPeople(nextPeople); setShares(nextShares);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to load trusted-person settings."); }
  }
  useEffect(() => { if (storedUser()?.role !== "victim") { window.location.assign("/dashboard"); return; } void load(); }, []);

  function change(field: keyof PersonForm, value: string | Permission[]) { setForm((current) => ({ ...current, [field]: value } as PersonForm)); }
  function togglePermission(permission: Permission) { change("permissions", form.permissions.includes(permission) ? form.permissions.filter((item) => item !== permission) : [...form.permissions, permission]); }
  function beginAdd() { setEditing(null); setForm(blank); setOpen(true); }
  function beginEdit(person: Person) { setEditing(person); setForm({ full_name: person.full_name, email: person.email, mobile: person.mobile ?? "", relationship: person.relationship, temporary_password: "", confirm_temporary_password: "", permissions: person.permissions }); setOpen(true); }
  function closeForm() { setOpen(false); setEditing(null); setForm(blank); }

  async function save(event: FormEvent) {
    event.preventDefault(); setLoading(true); setNotice("");
    try {
      if (editing) {
        await api(`/trusted/people/${editing._id}`, { method: "PATCH", body: JSON.stringify({ full_name: form.full_name, email: form.email, mobile: form.mobile || null, relationship: form.relationship || "Trusted person", permissions: form.permissions }) });
        setNotice("Trusted-person details and permissions were updated. Their current session was refreshed for safety.");
      } else {
        await api<Person>("/trusted/people", { method: "POST", body: JSON.stringify({ ...form, mobile: form.mobile || null, relationship: form.relationship || "Trusted person" }) });
        setNotice("Trusted-person account created. Share the temporary password privately; it is never displayed again.");
      }
      closeForm(); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to save trusted-person details."); }
    finally { setLoading(false); }
  }
  async function update(person: Person, updates: object) { try { await api(`/trusted/people/${person._id}`, { method: "PATCH", body: JSON.stringify(updates) }); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to update trusted-person settings."); } }
  async function remove(person: Person) { if (!window.confirm(`Remove ${person.full_name}'s access?`)) return; try { await api(`/trusted/people/${person._id}`, { method: "DELETE" }); setNotice("Access was revoked immediately."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to remove trusted person."); } }
  const shareFor = (person: Person) => shares.find((share) => share.trusted_person_id === person._id && share.active);
  async function shareLocation(person: Person, duration_minutes: number) { try { await shareLocationWithTrustedPerson(person._id, duration_minutes); setNotice(`A fresh approximate location was shared with ${person.full_name} for ${duration_minutes} minutes.`); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to start location sharing."); } }
  async function stopLocation(person: Person) { try { await api(`/trusted/location-shares/${person._id}`, { method: "DELETE" }); setNotice("Location sharing was stopped."); await load(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to stop location sharing."); } }

  return <AppShell><div className="mx-auto max-w-3xl"><Link href="/dashboard" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to home</Link><header className="flex flex-wrap items-end justify-between gap-4"><div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-deepteal"><UsersRound className="h-6 w-6" /></span><h1 className="display-serif mt-4 text-3xl text-ink">Trusted persons</h1><p className="mt-2 max-w-xl text-sm leading-6 text-body">You decide who can access selected wellbeing information, for how long, and when access ends.</p></div><button onClick={beginAdd} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-deepteal px-4 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Add trusted person</button></header>{notice && <p role="status" className="mt-5 rounded-2xl bg-mint p-4 text-sm leading-6 text-ink">{notice}</p>}{open && <TrustedForm form={form} editing={Boolean(editing)} loading={loading} onChange={change} onToggle={togglePermission} onCancel={closeForm} onSubmit={save} />}<section className="mt-7 space-y-3">{people.length ? people.map((person) => { const activeShare = shareFor(person); return <article key={person._id} className="rounded-[24px] border border-[#e4eeee] bg-white p-5 shadow-calm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-ink">{person.full_name}</h2><p className="mt-1 text-sm text-body">{person.relationship} · {person.email}{person.mobile ? ` · ${person.mobile}` : ""}</p><p className="mt-2 text-xs font-medium text-deepteal">{person.enabled ? person.must_change_password ? "Password change pending" : "Connected" : "Access disabled"}</p></div><div className="flex gap-2"><button onClick={() => beginEdit(person)} className="grid h-10 w-10 place-items-center rounded-full border border-[#d6e2e5] text-deepteal" aria-label={`Edit ${person.full_name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => void update(person, { enabled: !person.enabled })} className="grid h-10 w-10 place-items-center rounded-full border border-[#d6e2e5] text-deepteal" aria-label={person.enabled ? "Disable access" : "Enable access"}>{person.enabled ? <ShieldOff className="h-4 w-4" /> : <Check className="h-4 w-4" />}</button><button onClick={() => void remove(person)} className="grid h-10 w-10 place-items-center rounded-full border border-[#efd4d4] text-[#963e45]" aria-label="Remove trusted person"><Trash2 className="h-4 w-4" /></button></div></div><div className="mt-4 flex flex-wrap gap-2">{permissionOptions.map((permission) => <button key={permission} type="button" onClick={() => void update(person, { permissions: person.permissions.includes(permission) ? person.permissions.filter((item) => item !== permission) : [...person.permissions, permission] })} aria-pressed={person.permissions.includes(permission)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${person.permissions.includes(permission) ? "bg-mint text-deepteal" : "bg-[#f5f6f6] text-[#81939a]"}`}>{label(permission)}</button>)}</div>{person.permissions.includes("live_location") && person.enabled && <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl bg-[#f7fcfc] p-3"><MapPin className="h-4 w-4 text-deepteal" /><p className="mr-auto text-xs leading-5 text-body">{activeShare ? activeShare.expires_at ? `Approximate location shared until ${new Date(activeShare.expires_at).toLocaleTimeString()}.` : "Approximate location shared until you stop it." : "Location is never shared unless you start a timed session."}</p>{activeShare ? <button onClick={() => void stopLocation(person)} className="min-h-9 rounded-full border border-[#e5bcbc] px-3 text-xs font-semibold text-[#963e45]">Stop sharing</button> : <button onClick={() => void shareLocation(person, 30)} className="min-h-9 rounded-full border border-[#9ed5cb] px-3 text-xs font-semibold text-deepteal">Share 30 min</button>}</div>}</article>; }) : <p className="rounded-[24px] border border-dashed border-[#badbd5] bg-white p-7 text-sm text-body">No trusted persons added yet.</p>}</section></div></AppShell>;
}

function TrustedForm({ form, editing, loading, onChange, onToggle, onCancel, onSubmit }: { form: PersonForm; editing: boolean; loading: boolean; onChange: (field: keyof PersonForm, value: string | Permission[]) => void; onToggle: (permission: Permission) => void; onCancel: () => void; onSubmit: (event: FormEvent) => void }) {
  return <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-[28px] border border-[#dbeae7] bg-white p-5 shadow-calm sm:grid-cols-2"><Field label="Full name" value={form.full_name} onChange={(value) => onChange("full_name", value)} /><Field label="Email" type="email" value={form.email} onChange={(value) => onChange("email", value)} /><Field label="Mobile (optional)" type="tel" required={false} value={form.mobile} onChange={(value) => onChange("mobile", value)} /><Field label="Relationship (optional)" required={false} value={form.relationship} onChange={(value) => onChange("relationship", value)} />{!editing && <><Field label="Trusted-person password" type="password" value={form.temporary_password} onChange={(value) => onChange("temporary_password", value)} /><Field label="Confirm password" type="password" value={form.confirm_temporary_password} onChange={(value) => onChange("confirm_temporary_password", value)} /><p className="-mt-2 text-xs leading-5 text-body sm:col-span-2">Use at least 8 characters. This is the trusted person’s normal login password; no OTP, SMS, or email is used.</p></>}<fieldset className="sm:col-span-2"><legend className="text-sm font-semibold text-ink">Share permissions</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{permissionOptions.map((permission) => <label key={permission} className="flex min-h-10 items-center gap-2 rounded-xl bg-[#f7fcfc] px-3 text-sm text-body"><input type="checkbox" checked={form.permissions.includes(permission)} onChange={() => onToggle(permission)} className="accent-deepteal" />{label(permission)}</label>)}</div></fieldset><div className="flex gap-3 sm:col-span-2"><button disabled={loading} className="min-h-11 rounded-full bg-deepteal px-5 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Saving…" : editing ? "Save changes" : "Create account"}</button><button type="button" onClick={onCancel} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d6e2e5] px-5 text-sm font-semibold text-deepteal"><X className="h-4 w-4" />Cancel</button></div></form>;
}

function Field({ label, value, onChange, type = "text", required = true }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-ink">{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#d6e2e5] px-3 text-sm outline-none focus:border-deepteal" /></label>; }
