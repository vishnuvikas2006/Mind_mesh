"use client";
import Link from "next/link";
import { CircleUserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { storedUser } from "@/lib/api";
function greetingName() {
  const user = storedUser();
  const username = user?.username?.trim();
  if (username) return username;

  // Older sessions can contain an email in `full_name`. Never present that as
  // the personal greeting; a fresh sign-in supplies the saved username.
  const fullName = user?.full_name?.trim();
  return fullName && !fullName.includes("@") ? fullName.split(/\s+/)[0] : "Member";
}

export function DashboardHeader() {
  const [name, setName] = useState("Member");

  useEffect(() => setName(greetingName()), []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";

  return <header className="mb-7 flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-body">{greeting}</p><h1 className="display-serif mt-0.5 text-4xl leading-none text-ink sm:text-5xl">{name}</h1><p className="mt-3 max-w-sm text-sm leading-6 text-body">Take a moment to check in with yourself.</p></div><Link href="/profile" aria-label="Open your profile" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d7e8e5] bg-white text-deepteal shadow-sm transition hover:bg-mint"><CircleUserRound className="h-6 w-6" /></Link></header>;
}
