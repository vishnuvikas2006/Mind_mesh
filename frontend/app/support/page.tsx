"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, LoaderCircle, MessageCircleHeart, Send, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/mindmesh/AppShell";
import { api } from "@/lib/api";

type Message = { by: "me" | "support"; text: string };
type ModelReply = { reply: string };
const fallback = "Thank you for sharing. A short break, water, a calming game, or someone you trust may help.";

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([{ by: "support", text: "Hi, I am Sahaaya. Share what feels comfortable." }]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  async function send(event: FormEvent) {
    event.preventDefault(); const value = text.trim(); if (!value || sending) return;
    const history = messages.slice(-6).map((message) => ({ role: message.by === "me" ? "user" as const : "assistant" as const, text: message.text }));
    setMessages((current) => [...current, { by: "me", text: value }]); setText(""); setSending(true);
    try { await api("/interactions/text", { method: "POST", body: JSON.stringify({ text: value, channel: "chat" }) }); const model = await api<ModelReply>("/voice/local-turn", { method: "POST", body: JSON.stringify({ text: value, language: "auto", history }) }); setMessages((current) => [...current, { by: "support", text: model.reply }]); }
    catch { setMessages((current) => [...current, { by: "support", text: fallback }]); }
    finally { setSending(false); }
  }
  return <AppShell><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to home</Link><section className="overflow-hidden rounded-[28px] border border-[#e4eeee] bg-white shadow-calm"><header className="border-b border-[#e4eeee] p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ddf3ee] text-deepteal"><MessageCircleHeart className="h-5 w-5" /></span><div><h1 className="font-semibold text-ink">Talk to Sahaaya</h1><p className="mt-0.5 text-sm text-body">Private support chat</p></div></div></header><div aria-live="polite" className="min-h-80 space-y-4 bg-[#fcfefd] p-5">{messages.map((message, index) => <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.by === "me" ? "ml-auto bg-deepteal text-white" : "bg-mint text-ink"}`}>{message.text}</div>)}{sending && <div className="flex max-w-[85%] items-center gap-2 rounded-2xl bg-mint px-4 py-3 text-sm text-ink"><LoaderCircle className="h-4 w-4 animate-spin" />Sahaaya is thinking...</div>}</div><form onSubmit={send} className="border-t border-[#e4eeee] p-4"><label htmlFor="support-message" className="sr-only">Your message</label><div className="flex gap-2"><textarea id="support-message" value={text} onChange={(event) => setText(event.target.value)} maxLength={3000} rows={2} placeholder="Write a message" className="min-h-12 flex-1 resize-none rounded-2xl border border-[#d6e2e5] px-4 py-3 text-sm outline-none focus:border-teal" /><button disabled={sending || !text.trim()} aria-label="Send message" className="grid h-12 w-12 place-items-center self-end rounded-2xl bg-deepteal text-white disabled:opacity-50"><Send className="h-5 w-5" /></button></div><p className="mt-3 flex gap-2 text-xs leading-5 text-body"><ShieldCheck className="h-4 w-4 shrink-0 text-deepteal" />Not an emergency service. In immediate danger, contact local emergency services or a trusted person.</p></form></section></div></AppShell>;
}
