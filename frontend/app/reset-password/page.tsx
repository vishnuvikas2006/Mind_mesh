"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { AuthLayout } from "@/components/mindmesh/AuthLayout";
import { api } from "@/lib/api";

function ResetPasswordForm() {
  const params = useSearchParams(); const token = params.get("token") ?? "";
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  const valid = password.length >= 8 && password === confirmPassword;
  async function submit(event: FormEvent) { event.preventDefault(); if (!token || !valid) return; setLoading(true); setMessage(""); try { const result = await api<{ message: string }>("/auth/password-reset/confirm", { method: "POST", body: JSON.stringify({ token, new_password: password }) }); setMessage(result.message); setPassword(""); setConfirmPassword(""); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to update password."); } finally { setLoading(false); } }
  return <AuthLayout><form onSubmit={submit} className="space-y-5"><Link href="/login" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to sign in</Link><div><h2 className="display-serif text-3xl text-ink">Choose a new password</h2><p className="mt-3 text-sm leading-6 text-body">Use at least eight characters.</p></div>{!token && <p className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">This reset link is incomplete or invalid.</p>}<PasswordInput label="New password" value={password} onChange={setPassword} /><PasswordInput label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} /><button disabled={!token || !valid || loading} className="flex h-14 w-full items-center justify-center rounded-full bg-deepteal font-semibold text-white disabled:opacity-60">{loading ? "Updating…" : "Update password"}</button>{message && <p className="rounded-xl bg-mint p-3 text-sm leading-6 text-ink" role="status">{message}</p>}</form></AuthLayout>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<AuthLayout><p className="text-sm text-body">Loading reset form…</p></AuthLayout>}><ResetPasswordForm /></Suspense>;
}

function PasswordInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-sm font-semibold text-ink">{label}</span><div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#d6e2e5] bg-white px-3 focus-within:border-deepteal"><LockKeyhole className="h-5 w-5 text-deepteal" /><input type="password" value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" className="w-full border-0 bg-transparent text-sm outline-none" /></div></label>; }
