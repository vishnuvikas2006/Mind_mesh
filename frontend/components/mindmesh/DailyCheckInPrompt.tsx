"use client";

import Link from "next/link";
import { BellRing, CalendarHeart, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PromptSlot = { id: string; hour: number; title: string; message: string };

const slots: PromptSlot[] = [
  { id: "morning", hour: 9, title: "A gentle morning check-in", message: "How are you feeling as your day begins?" },
  { id: "midday", hour: 13, title: "Take a short pause", message: "A few quiet moments can help you notice what you need." },
  { id: "evening", hour: 17, title: "An afternoon check-in", message: "Would it help to reflect on how today has felt?" },
  { id: "night", hour: 21, title: "Before you wind down", message: "You can share only what feels comfortable tonight." },
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function DailyCheckInPrompt({ userId }: { userId: string }) {
  const [activeSlot, setActiveSlot] = useState<PromptSlot | null>(null);
  const [notificationState, setNotificationState] = useState<NotificationPermission | "unsupported">("unsupported");
  const storageKey = `mindmesh_checkin_prompts_${userId}`;

  const showDuePrompt = useCallback(() => {
    const now = new Date();
    const dueSlot = [...slots].reverse().find((slot) => now.getHours() >= slot.hour);
    if (!dueSlot) return;
    try {
      const shown = JSON.parse(localStorage.getItem(storageKey) ?? "{}") as Record<string, string>;
      const slotKey = `${dateKey(now)}-${dueSlot.id}`;
      if (shown[slotKey] === "shown") return;
      localStorage.setItem(storageKey, JSON.stringify({ ...shown, [slotKey]: "shown" }));
      setActiveSlot(dueSlot);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("MindMesh check-in", { body: dueSlot.message, tag: `mindmesh-${slotKey}` });
      }
    } catch {
      // The in-app prompt still works if browser storage is disabled.
      setActiveSlot(dueSlot);
    }
  }, [storageKey]);

  useEffect(() => {
    if ("Notification" in window) setNotificationState(Notification.permission);
    showDuePrompt();
    const interval = window.setInterval(showDuePrompt, 60_000);
    return () => window.clearInterval(interval);
  }, [showDuePrompt]);

  async function enableNotifications() {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationState(permission);
  }

  if (!activeSlot) return null;
  return <div className="fixed inset-0 z-50 flex items-end bg-[#102b35]/35 p-3 sm:items-center sm:justify-center sm:p-6" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="checkin-prompt-title" className="w-full max-w-md rounded-[28px] border border-[#d2e7e2] bg-white p-5 shadow-2xl sm:p-7">
      <div className="flex items-start justify-between gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-mint text-deepteal"><CalendarHeart className="h-6 w-6" /></span><button type="button" onClick={() => setActiveSlot(null)} aria-label="Dismiss this reminder" className="grid h-10 w-10 place-items-center rounded-full text-body transition hover:bg-mint"><X className="h-5 w-5" /></button></div>
      <h2 id="checkin-prompt-title" className="display-serif mt-5 text-2xl text-ink">{activeSlot.title}</h2>
      <p className="mt-2 text-sm leading-6 text-body">{activeSlot.message}</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/checkins" onClick={() => setActiveSlot(null)} className="inline-flex min-h-11 items-center rounded-full bg-deepteal px-5 text-sm font-semibold text-white hover:bg-[#124b5a]">Check in now</Link><Link href="/calm" onClick={() => setActiveSlot(null)} className="inline-flex min-h-11 items-center rounded-full border border-[#9ecdc5] px-5 text-sm font-semibold text-deepteal hover:bg-mint">Play a game</Link></div>
      {notificationState === "default" && <button type="button" onClick={enableNotifications} className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-deepteal hover:underline"><BellRing className="h-4 w-4" />Enable browser reminders</button>}
      {notificationState === "denied" && <p className="mt-5 text-xs leading-5 text-body">Browser reminders are off. You can enable notifications for this site in your browser settings.</p>}
      <p className="mt-3 text-xs leading-5 text-body">Reminders appear only while MindMesh is open.</p>
    </section>
  </div>;
}
