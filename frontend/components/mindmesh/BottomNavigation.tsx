"use client";
import Link from "next/link";
import { CalendarCheck, CircleUserRound, House, MessageCircleHeart } from "lucide-react";
import { usePathname } from "next/navigation";
import { HoldToRecordVoiceNote } from "./HoldToRecordVoiceNote";

const leadingEntries = [{ href: "/dashboard", label: "Home", icon: House }, { href: "/checkins", label: "Check-ins", icon: CalendarCheck }];
const trailingEntries = [{ href: "/support", label: "Support", icon: MessageCircleHeart }, { href: "/profile", label: "Profile", icon: CircleUserRound }];
export function BottomNavigation() { const path = usePathname(); const renderLink = ({ href, label, icon: Icon }: (typeof leadingEntries)[number]) => { const active = path === href; return <Link key={href} href={href} className={`flex min-h-[58px] min-w-16 flex-1 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition ${active ? "text-deepteal" : "text-[#78909a] hover:bg-mint"}`} aria-current={active ? "page" : undefined}><Icon className={`h-5 w-5 ${active ? "stroke-[2.4]" : ""}`} aria-hidden="true" />{label}</Link>; }; return <nav aria-label="Primary navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-[#e4eeee] bg-white/95 px-3 backdrop-blur md:absolute md:top-0 md:bottom-auto md:mx-auto md:max-w-4xl md:rounded-b-2xl md:border"><div className="mx-auto flex max-w-md justify-between md:max-w-3xl">{leadingEntries.map(renderLink)}<HoldToRecordVoiceNote />{trailingEntries.map(renderLink)}</div></nav>; }
