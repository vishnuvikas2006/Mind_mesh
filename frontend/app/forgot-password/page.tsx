"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthLayout } from "@/components/mindmesh/AuthLayout";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [developmentUrl, setDevelopmentUrl] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (identifier.trim().length < 3) return;
    setLoading(true); setMessage(""); setDevelopmentUrl("");
    try {
      const result = await api<{ message: string; development_only_reset_url?: string; development_only?: boolean }>("/auth/password-reset/request", { method: "POST", body: JSON.stringify({ identifier }) });
      setMessage(result.message);
      if (result.development_only && result.development_only_reset_url) setDevelopmentUrl(result.development_only_reset_url);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to request password reset."); }
    finally { setLoading(false); }
  }
  return <AuthLayout><form onSubmit={submit} className="space-y-5"><Link href="/login" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to sign in</Link><div><h2 className="display-serif text-3xl text-ink">Reset password</h2><p className="mt-3 text-sm leading-6 text-body">Enter your registered email or mobile number. We do not use OTP codes.</p></div><label className="block"><span className="mb-2 block text-sm font-semibold text-ink">Email or mobile number</span><div className="flex min-h-12 items-center gap-2 rounded-xl border border-[#d6e2e5] bg-white px-3 focus-within:border-deepteal"><Mail className="h-5 w-5 text-deepteal" /><input value={identifier} onChange={(event) => setIdentifier(event.target.value)} autoComplete="username" className="w-full border-0 bg-transparent text-sm outline-none" placeholder="name@example.com or mobile number" /></div></label><button disabled={loading || identifier.trim().length < 3} className="flex h-14 w-full items-center justify-center rounded-full bg-deepteal font-semibold text-white disabled:opacity-60">{loading ? "Please wait…" : "Request reset link"}</button>{message && <p className="rounded-xl bg-mint p-3 text-sm leading-6 text-ink" role="status">{message}</p>}{developmentUrl && <p className="rounded-xl border border-[#e4c978] bg-[#fff9e6] p-3 text-sm leading-6 text-[#604d12]">Development-only reset link: <a className="font-semibold underline" href={developmentUrl}>Open reset page</a></p>}</form></AuthLayout>;
}
