"use client";
import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Bot, CalendarCheck, Gamepad2, HandHeart, MessageCircle, UsersRound } from "lucide-react";
import { AppShell } from "@/components/mindmesh/AppShell";
import { ActionCard } from "@/components/mindmesh/ActionCard";
import { DailyCheckInBanner } from "@/components/mindmesh/DailyCheckInBanner";
import { DashboardHeader } from "@/components/mindmesh/DashboardHeader";
import { SectionHeader } from "@/components/mindmesh/SectionHeader";
import { UpcomingSupportCard, type SupportSession } from "@/components/mindmesh/UpcomingSupportCard";
import { WellbeingSummaryCard } from "@/components/mindmesh/WellbeingSummaryCard";
import { api, type Risk } from "@/lib/api";
type Overview = { checkins_this_week: number; latest_risk: Risk | null; upcoming_support: SupportSession[] };
export default function DashboardPage() { const [overview, setOverview] = useState<Overview>({ checkins_this_week: 0, latest_risk: null, upcoming_support: [] }); useEffect(() => { api<Overview>("/victim/me/overview").then(setOverview).catch(() => undefined); }, []); return <AppShell><DashboardHeader /><DailyCheckInBanner /><section className="grid grid-cols-2 gap-3 sm:grid-cols-3"><ActionCard href="/checkins" icon={CalendarCheck} title="Daily Check-In" text="Share how you feel" /><ActionCard href="/emergency" icon={AlertTriangle} title="Emergency" text="Request urgent review" tone="emergency" /><ActionCard href="/sahaaya" icon={Bot} title="Sahaaya AI" text="Talk by voice" tone="blue" /><ActionCard href="/calm" icon={Gamepad2} title="Stress Relief Games" text="Play and reset" tone="mint" /><ActionCard href="/trusted-persons" icon={UsersRound} title="Trusted Persons" text="Manage access" tone="yellow" /><ActionCard href="/support" icon={MessageCircle} title="Talk to Support" text="Connect with someone" tone="blue" /><ActionCard href="/wellbeing" icon={Activity} title="My Wellbeing" text="View your progress" tone="yellow" /><ActionCard href="/help" icon={HandHeart} title="Get Help" text="Explore support options" tone="pink" /></section><section className="mt-8"><SectionHeader title="Your wellbeing" /><WellbeingSummaryCard risk={overview.latest_risk} checkins={overview.checkins_this_week} /></section><section className="mt-8"><SectionHeader title="Upcoming support" /><UpcomingSupportCard session={overview.upcoming_support[0]} /></section></AppShell>; }
