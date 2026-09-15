import Link from "next/link";
import { ArrowLeft, BookHeart, HeartHandshake, Scale, ShieldAlert, Stethoscope } from "lucide-react";
import { AppShell } from "@/components/mindmesh/AppShell";

const resources = [
  { icon: HeartHandshake, title: "Counselling", text: "Talk with a support professional." },
  { icon: Stethoscope, title: "Medical support", text: "Find suitable healthcare support." },
  { icon: Scale, title: "Legal aid", text: "Understand available legal options." },
  { icon: BookHeart, title: "Wellbeing tools", text: "Use simple self-care resources." },
];

export default function HelpPage() {
  return <AppShell><div className="mx-auto max-w-2xl"><Link href="/dashboard" className="mb-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-deepteal hover:underline"><ArrowLeft className="h-4 w-4" />Back to home</Link><header><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fce8e8] text-[#a34f58]"><HeartHandshake className="h-6 w-6" /></span><h1 className="display-serif mt-4 text-3xl text-ink sm:text-4xl">Get help</h1><p className="mt-2 max-w-xl text-sm leading-6 text-body">Choose the support you need.</p></header><section className="mt-7 grid gap-3 sm:grid-cols-2">{resources.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[24px] border border-[#e4eeee] bg-white p-5 shadow-calm"><Icon className="h-6 w-6 text-deepteal" /><h2 className="mt-5 font-semibold text-ink">{title}</h2><p className="mt-2 text-sm leading-5 text-body">{text}</p><Link href="/support" className="mt-4 inline-flex text-sm font-semibold text-deepteal hover:underline">Talk to support</Link></article>)}</section><aside className="mt-7 rounded-[24px] border border-[#f0d2d2] bg-[#fff9f9] p-5"><div className="flex gap-3"><ShieldAlert className="h-6 w-6 shrink-0 text-[#a34f58]" /><div><h2 className="font-semibold text-ink">Immediate danger</h2><p className="mt-1 text-sm leading-6 text-body">Contact local emergency services or a trusted person now.</p></div></div></aside></div></AppShell>;
}
