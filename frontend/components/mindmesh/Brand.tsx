import { Sprout } from "lucide-react";

export function Brand({ dark = true }: { dark?: boolean }) {
  return <div className={`flex flex-col items-center ${dark ? "text-deepteal" : "text-white"}`}>
    <Sprout aria-hidden="true" className="mb-1 h-9 w-9 stroke-[1.5]" />
    <span className="display-serif text-3xl font-semibold tracking-tight">MindMesh</span>
    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[.18em] opacity-70">Support · Monitor · Heal</span>
  </div>;
}
