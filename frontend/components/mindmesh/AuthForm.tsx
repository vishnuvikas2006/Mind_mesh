"use client";

import Link from "next/link";
import { LockKeyhole, Mail, ShieldCheck, Smartphone, UserRound, UserRoundPlus, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { api, storeSession, type User } from "@/lib/api";
import { FormField } from "./FormField";

type LoginRole = "victim" | "trusted_person" | "admin";
type Fields = { fullName: string; username: string; identifier: string; email: string; mobile: string; password: string; confirmPassword: string };
type FormErrors = Partial<Fields> & { general?: string; consent?: string };
const emailOk = (value: string) => /^\S+@\S+\.\S+$/.test(value);
const validPassword = (value: string) => value.length >= 8;
const roles: Array<{ id: LoginRole; label: string; icon: typeof UserRound }> = [{ id: "victim", label: "Victim", icon: UserRound }, { id: "trusted_person", label: "Trusted person", icon: UsersRound }, { id: "admin", label: "Admin", icon: ShieldCheck }];

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [role, setRole] = useState<LoginRole>("victim");
  const [values, setValues] = useState<Fields>({ fullName: "", username: "", identifier: "", email: "", mobile: "", password: "", confirmPassword: "" });
  const [remember, setRemember] = useState(true);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const change = (field: keyof Fields) => (value: string) => setValues((current) => ({ ...current, [field]: value }));

  useEffect(() => {
    // A browser may submit an unhydrated form with its native behavior if a
    // script fails to load. Older URLs containing credentials should never be
    // retained in the address bar or browser history once the app is ready.
    if (window.location.search) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  function validate() {
    const next: FormErrors = {};
    if (signup && values.fullName.trim().length < 2) next.fullName = "Please enter your full name.";
    if (signup && !/^[a-zA-Z0-9._-]{3,40}$/.test(values.username.trim())) next.username = "Use 3–40 letters, numbers, dots, underscores, or hyphens.";
    if (signup && !emailOk(values.email)) next.email = "Please enter a valid email address.";
    if (signup && values.mobile.trim() && values.mobile.replace(/[^\d]/g, "").length < 7) next.mobile = "Please enter a valid mobile number.";
    if (!signup && values.identifier.trim().length < 3) next.identifier = "Enter your username, email, or mobile number.";
    if (!values.password) next.password = "Please enter your password.";
    else if (signup && !validPassword(values.password)) next.password = "Use at least 8 characters.";
    if (signup && values.confirmPassword !== values.password) next.confirmPassword = "Passwords do not match.";
    if (signup && !consent) next.consent = "Please confirm your consent to continue.";
    setErrors(next);
    return !Object.keys(next).length;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;
    setLoading(true); setErrors({});
    try {
      const payload = signup
        ? { full_name: values.fullName, username: values.username, email: values.email, mobile: values.mobile || null, password: values.password, consent }
        : { identifier: values.identifier, password: values.password, expected_role: role };
      const result = await api<{ access_token: string; user: User }>(signup ? "/auth/register" : "/auth/login", { method: "POST", body: JSON.stringify(payload) });
      storeSession(result.access_token, result.user, signup || remember);
      const destination = result.user.role === "trusted_person" ? (result.user.must_change_password ? "/trusted/change-password" : "/trusted") : result.user.role === "official" || result.user.role === "admin" ? "/official" : "/dashboard";
      window.location.assign(destination);
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : "Unable to continue." });
    } finally { setLoading(false); }
  }

  return <form onSubmit={submit} method="post" action={signup ? "/signup" : "/login"} noValidate className="auth-form space-y-5">
    <div><h2 className="display-serif text-3xl text-ink sm:text-4xl"><span className="sm:hidden">{signup ? "Create account" : "Welcome back"}</span><span className="hidden sm:inline">{signup ? "Create victim account" : "Sign in"}</span></h2><p className="mt-3 text-sm leading-6 text-[#6f8c99]">{signup ? "Create a private support account." : "Choose your portal to continue."}</p></div>
    {!signup && <fieldset><legend className="sr-only">Select portal</legend><div className="auth-role-grid grid grid-cols-3 gap-2">{roles.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setRole(id)} aria-pressed={role === id} className={`auth-role-button flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-center text-xs font-semibold transition ${role === id ? "border-deepteal bg-mint text-deepteal" : "border-[#dce8e8] bg-white text-body hover:bg-[#f7fcfc]"}`}><Icon className="h-5 w-5" />{label}</button>)}</div></fieldset>}
    {errors.general && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm leading-5 text-red-800" role="alert">{errors.general}</p>}
    {signup && <FormField label="Full name" name="fullName" placeholder="Enter your full name" value={values.fullName} onChange={change("fullName")} error={errors.fullName} icon={UserRound} autoComplete="name" />}
    {signup && <FormField label="Username" name="username" placeholder="Choose a username" value={values.username} onChange={change("username")} error={errors.username} icon={UserRound} autoComplete="username" />}
    {signup ? <FormField label="Email address" name="email" placeholder="name@example.com" type="email" value={values.email} onChange={change("email")} error={errors.email} icon={Mail} autoComplete="email" /> : <FormField label="Username, email, or mobile number" name="identifier" placeholder="Enter your sign-in identifier" value={values.identifier} onChange={change("identifier")} error={errors.identifier} icon={UserRound} autoComplete="username" />}
    {signup && <FormField label="Mobile number (optional)" name="mobile" placeholder="Your mobile number" type="tel" value={values.mobile} onChange={change("mobile")} error={errors.mobile} icon={Smartphone} autoComplete="tel" />}
    <FormField label="Password" name="password" placeholder="Enter your password" type="password" value={values.password} onChange={change("password")} error={errors.password} icon={LockKeyhole} autoComplete={signup ? "new-password" : "current-password"} />
    {signup && <><FormField label="Confirm password" name="confirmPassword" placeholder="Re-enter your password" type="password" value={values.confirmPassword} onChange={change("confirmPassword")} error={errors.confirmPassword} icon={LockKeyhole} autoComplete="new-password" /><PasswordRequirements password={values.password} /><label className="flex items-start gap-3 rounded-xl bg-[#f7fcfc] p-3 text-sm leading-5 text-body"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-deepteal" />I consent to use this support service. MindMesh is not a medical service.</label>{errors.consent && <p className="-mt-3 text-sm text-red-700" role="alert">{errors.consent}</p>}</>}
    {!signup && <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><label className="flex items-center gap-2 text-body"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 accent-deepteal" />Remember me</label><Link href="/forgot-password" className="font-medium text-deepteal hover:underline">Forgot password?</Link></div>}
    <button type="submit" disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-deepteal px-5 font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#124b5a] disabled:cursor-wait disabled:opacity-70">{loading ? "Please wait…" : signup ? "Create account →" : `Log in to ${roles.find((item) => item.id === role)?.label} portal →`}</button>
    {!signup && <><div className="flex items-center gap-3 text-xs text-[#8ca1a9]"><span className="h-px flex-1 bg-[#d6e2e5]" />or<span className="h-px flex-1 bg-[#d6e2e5]" /></div><Link href="/signup" className="flex h-14 w-full items-center justify-center gap-2 rounded-full border border-teal bg-white font-semibold text-deepteal transition hover:bg-mint"><UserRoundPlus className="h-5 w-5" />Create victim account</Link></>}
    {signup && <p className="text-center text-sm text-body">Already have an account? <Link href="/login" className="font-semibold text-deepteal hover:underline">Log in</Link></p>}
    <p className="pt-1 text-center text-xs leading-5 text-[#78909a]">Trusted-person accounts are created by the linked victim.</p>
  </form>;
}

function PasswordRequirements({ password }: { password: string }) {
  const items = [[password.length >= 8, "At least 8 characters"]] as const;
  return <ul className="-mt-2 grid grid-cols-1 gap-1.5 rounded-xl bg-[#f7fcfc] p-3 text-xs text-[#6f8c99] sm:grid-cols-2" aria-label="Password requirements">{items.map(([valid, text]) => <li key={text} className={valid ? "font-medium text-deepteal" : ""}>{valid ? "✓" : "○"} {text}</li>)}</ul>;
}
