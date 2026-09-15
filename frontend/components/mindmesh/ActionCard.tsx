import Link from "next/link";
import { type LucideIcon } from "lucide-react";
export function ActionCard({ href, icon: Icon, title, text, tone = "mint" }: { href: string; icon: LucideIcon; title: string; text: string; tone?: "mint" | "blue" | "yellow" | "pink" | "emergency" }) {
  const colors = { mint: "bg-[#ddf3ee] text-deepteal", blue: "bg-[#e6f2f5] text-[#397587]", yellow: "bg-[#fff4d6] text-[#8a6518]", pink: "bg-[#fce8e8] text-[#a34f58]", emergency: "bg-white/15 text-white" };
  const emergency = tone === "emergency";
  return <Link href={href} className={`group flex min-h-44 flex-col rounded-[24px] border p-4 shadow-calm transition hover:-translate-y-0.5 active:translate-y-0 ${emergency ? "border-[#8d3440] bg-[#a34f58] hover:bg-[#853842]" : "border-[#e4eeee] bg-white hover:border-[#c8e3de]"}`}><span className={`grid h-11 w-11 place-items-center rounded-2xl ${colors[tone]}`}><Icon className="h-5 w-5" /></span><span className="mt-auto"><span className={`block text-[15px] font-semibold ${emergency ? "text-white" : "text-ink"}`}>{title}</span><span className={`mt-1 block text-xs leading-4 ${emergency ? "text-white/90" : "text-body"}`}>{text}</span></span></Link>;
}
