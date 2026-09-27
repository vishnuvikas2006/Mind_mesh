"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storedUser, type User } from "@/lib/api";

const BottomNavigation = dynamic(() => import("./BottomNavigation").then((module) => module.BottomNavigation), {
  ssr: false,
  loading: () => null,
});

const DailyCheckInPrompt = dynamic(() => import("./DailyCheckInPrompt").then((module) => module.DailyCheckInPrompt), {
  ssr: false,
  loading: () => null,
});

export function AppShell({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setReady(true);
    const current = storedUser();
    if (!current) {
      router.replace("/login");
      return;
    }
    if (current.role !== "victim") {
      router.replace(current.role === "trusted_person" ? "/trusted" : "/official");
      return;
    }
    setUser(current);
  }, [router]);

  if (!ready || !user) {
    return <main className="relative min-h-screen bg-mint">
      <div className={minimal ? "min-h-screen" : "page-pad mx-auto min-h-screen max-w-4xl px-4 pt-7 sm:px-6 md:pt-20"}>
        <div className="h-12 w-full animate-pulse rounded-xl bg-white/30" />
      </div>
    </main>;
  }

  return <main className="relative min-h-screen bg-mint">
    <div className={minimal ? "min-h-screen" : "page-pad mx-auto min-h-screen max-w-4xl px-4 pt-7 sm:px-6 md:pt-20"}>{children}</div>
    {!minimal && <>
      <BottomNavigation />
      <DailyCheckInPrompt userId={user._id} />
    </>}
  </main>;
}
