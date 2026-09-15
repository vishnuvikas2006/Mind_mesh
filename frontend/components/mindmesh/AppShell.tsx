"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavigation } from "./BottomNavigation";
import { DailyCheckInPrompt } from "./DailyCheckInPrompt";
import { storedUser, type User } from "@/lib/api";

export function AppShell({ children, minimal = false }: { children: React.ReactNode; minimal?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const current = storedUser();
    if (!current) router.replace("/login");
    else if (current.role !== "victim") router.replace(current.role === "trusted_person" ? "/trusted" : "/official");
    else setUser(current);
  }, [router]);

  if (!user) return <main className="grid min-h-screen place-items-center bg-mint text-body">Loading your private space...</main>;

  return <main className="relative min-h-screen bg-mint">
    <div className={minimal ? "min-h-screen" : "page-pad mx-auto min-h-screen max-w-4xl px-4 pt-7 sm:px-6 md:pt-20"}>{children}</div>
    {!minimal && <>
      <BottomNavigation />
      {user.role === "victim" && <DailyCheckInPrompt userId={user._id} />}
    </>}
  </main>;
}
