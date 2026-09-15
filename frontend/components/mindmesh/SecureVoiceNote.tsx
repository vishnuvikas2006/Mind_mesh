"use client";

import { LoaderCircle, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { apiBlob } from "@/lib/api";

export function SecureVoiceNote({ interactionId }: { interactionId: string }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  async function load() {
    setLoading(true); setError("");
    try {
      const blob = await apiBlob(`/interactions/voice/${interactionId}/audio`);
      const nextUrl = URL.createObjectURL(blob);
      setAudioUrl((current) => { if (current) URL.revokeObjectURL(current); return nextUrl; });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The recording could not be loaded."); }
    finally { setLoading(false); }
  }

  if (audioUrl) return <div className="mt-2"><audio controls preload="metadata" className="w-full" src={audioUrl}>Your browser cannot play this recording.</audio>{error && <p role="alert" className="mt-1 text-xs text-red-700">{error}</p>}</div>;
  return <div className="mt-2"><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#9ed5cb] px-3 text-xs font-semibold text-deepteal disabled:opacity-60">{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4" /><Volume2 className="h-3.5 w-3.5" /></>}{loading ? "Loading" : "Play recording"}</button>{error && <p role="alert" className="mt-1 text-xs leading-5 text-red-700">{error}</p>}</div>;
}
