"use client";

import { useEffect, useState } from "react";
import { LocateFixed, LogOut, Mail, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { AppShell } from "@/components/mindmesh/AppShell";
import { api, clearSession, storedUser, type User } from "@/lib/api";

type LocationStatus = { shared: boolean; updated_at?: string | null; precision?: string };

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [location, setLocation] = useState<LocationStatus>({ shared: false });
  const [locationState, setLocationState] = useState("");
  const [updatingLocation, setUpdatingLocation] = useState(false);
  useEffect(() => { setUser(storedUser()); api<LocationStatus>("/victim/me/location").then(setLocation).catch(() => undefined); }, []);
  function logout() { clearSession(); window.location.assign("/login"); }
  function shareLocation() {
    if (!navigator.geolocation) { setLocationState("Location sharing is unavailable in this browser."); return; }
    setUpdatingLocation(true); setLocationState("");
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const saved = await api<LocationStatus>("/victim/me/location", { method: "PUT", body: JSON.stringify({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy_meters: position.coords.accuracy }) });
        setLocation(saved); setLocationState("Approximate location shared.");
      } catch (error) { setLocationState(error instanceof Error ? error.message : "Location could not be saved."); }
      finally { setUpdatingLocation(false); }
    }, () => { setLocationState("Location was not shared."); setUpdatingLocation(false); }, { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 });
  }
  async function removeLocation() { setUpdatingLocation(true); setLocationState(""); try { await api("/victim/me/location", { method: "DELETE" }); setLocation({ shared: false }); setLocationState("Location removed."); } catch (error) { setLocationState(error instanceof Error ? error.message : "Location could not be removed."); } finally { setUpdatingLocation(false); } }

  return <AppShell><div className="mx-auto max-w-2xl"><header><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ddf3ee] text-deepteal"><UserRound className="h-6 w-6" /></span><h1 className="display-serif mt-4 text-3xl text-ink sm:text-4xl">Profile</h1><p className="mt-2 text-sm leading-6 text-body">Manage your account and location sharing.</p></header><section className="mt-7 rounded-[28px] border border-[#e4eeee] bg-white p-5 shadow-calm sm:p-6"><div className="flex items-center gap-3 border-b border-[#edf3f2] pb-5"><span className="grid h-11 w-11 place-items-center rounded-full bg-mint text-deepteal"><UserRound className="h-5 w-5" /></span><div><p className="font-semibold text-ink">{user?.full_name || "Member"}</p><p className="mt-1 text-sm text-body">Member account</p></div></div><dl className="divide-y divide-[#edf3f2]"><div className="flex items-center gap-3 py-5"><Mail className="h-5 w-5 text-deepteal" /><div><dt className="text-xs font-semibold uppercase tracking-wide text-body">Email</dt><dd className="mt-1 break-all text-sm text-ink">{user?.email || "-"}</dd></div></div><div className="flex items-start gap-3 py-5"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-deepteal" /><div><dt className="text-xs font-semibold uppercase tracking-wide text-body">Privacy</dt><dd className="mt-1 text-sm leading-6 text-ink">High-priority signals are reviewed by a person.</dd></div></div></dl><section className="border-t border-[#edf3f2] py-5"><div className="flex items-start gap-3"><LocateFixed className="mt-0.5 h-5 w-5 shrink-0 text-deepteal" /><div className="min-w-0 flex-1"><h2 className="font-semibold text-ink">Approximate location</h2><p className="mt-1 text-sm leading-6 text-body">Optional. Shared only for authorised support context.</p>{location.shared && <p className="mt-2 text-xs text-deepteal">Shared {location.updated_at ? new Date(location.updated_at).toLocaleString() : "recently"}.</p>}<div className="mt-4 flex flex-wrap gap-2">{location.shared ? <button onClick={removeLocation} disabled={updatingLocation} className="flex min-h-11 items-center gap-2 rounded-full border border-[#e5bcbc] px-4 text-sm font-semibold text-[#963e45] hover:bg-[#fff7f7] disabled:opacity-60"><Trash2 className="h-4 w-4" />Remove location</button> : <button onClick={shareLocation} disabled={updatingLocation} className="flex min-h-11 items-center gap-2 rounded-full border border-[#9ed5cb] px-4 text-sm font-semibold text-deepteal hover:bg-mint disabled:opacity-60"><LocateFixed className="h-4 w-4" />{updatingLocation ? "Sharing..." : "Share approximate location"}</button>}</div>{locationState && <p className="mt-3 text-sm leading-5 text-body" role="status">{locationState}</p>}</div></div></section><button onClick={logout} className="mt-2 flex min-h-12 items-center gap-2 rounded-full border border-[#e5bcbc] px-5 text-sm font-semibold text-[#963e45] transition hover:bg-[#fff7f7]"><LogOut className="h-4 w-4" />Log out</button></section></div></AppShell>;
}
