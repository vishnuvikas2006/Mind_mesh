"use client";

import Link from "next/link";
import { AlertTriangle, CircleStop, Home, Languages, Mic, MicOff, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { languageName, SAHAAYA_STATUS_LABELS, SUPPORTED_LANGUAGES, type SahaayaLanguage } from "@/lib/sahaaya";
import { SahaayaRobot } from "./SahaayaRobot";

function possibleCrisis(text: string) { return /\b(?:suicid(?:e|al)|kill myself|end my life|want to die|self[- ]?harm|in danger|not safe|hurt me|attack(?:ed)?)\b/i.test(text); }

/** Voice-first Sahaaya experience with automatic language detection and a manual fallback. */
export function SahaayaVoiceAssistant() {
  const voice = useRealtimeVoice();
  const isLive = !["idle", "ended", "error"].includes(voice.status);
  const isSpeechPaused = voice.status === "speaking_paused";
  const isSpeaking = voice.status === "speaking";
  const lightState = voice.status === "listening" ? "listening" : isSpeaking || isSpeechPaused ? "speaking" : voice.status === "thinking" ? "thinking" : "idle";
  const highRiskMentioned = voice.messages.some((message) => message.role === "user" && possibleCrisis(message.text));
  const latestUserMessage = [...voice.messages].reverse().find((message) => message.role === "user");

  return <section className={`sahaaya-solo sahaaya-solo--${lightState}`} aria-label="Sahaaya multilingual voice companion">
    <p className="sr-only" role="status" aria-live="polite">{voice.error || SAHAAYA_STATUS_LABELS[voice.status]}</p>
    <Link href="/dashboard" className="sahaaya-solo__home" aria-label="Go to home" title="Home"><Home className="h-5 w-5" /></Link>
    <div className="sahaaya-solo__language-panel"><Languages className="h-4 w-4" aria-hidden="true" /><span className="sahaaya-solo__detected">{voice.detectedLanguage === "auto" ? "Listening for language" : `Detected: ${languageName(voice.detectedLanguage)}`}</span><label><span className="sr-only">Language fallback</span><select value={voice.fallbackLanguage} onChange={(event) => voice.changeLanguage(event.target.value as SahaayaLanguage)} aria-label="Language fallback">{SUPPORTED_LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.name}</option>)}</select></label></div>
    <span className="sahaaya-solo__signal" aria-hidden="true" />
    <button type="button" onClick={() => !isLive && voice.start({ language: voice.fallbackLanguage, spiritualSupport: "off" })} disabled={isLive} className="sahaaya-solo__robot-button" aria-label={voice.status === "error" ? "Retry Sahaaya voice conversation" : "Start a conversation with Sahaaya"} title={voice.status === "error" ? "Retry conversation" : "Tap Sahaaya to start"}><span className="sahaaya-solo__robot-scale"><SahaayaRobot status={voice.status} /></span></button>
    {isLive && latestUserMessage && !highRiskMentioned && <div className="sahaaya-solo__transcript" aria-live="polite"><span>Heard in {languageName(latestUserMessage.language)}:</span><p>{latestUserMessage.text}</p></div>}
    {!highRiskMentioned && voice.error && <div role="alert" className="sahaaya-solo__notice">{voice.error}</div>}
    {isLive && <div className="sahaaya-solo__controls" aria-label="Voice conversation controls">
      <button type="button" onClick={voice.toggleMute} className="sahaaya-solo__control" aria-label={voice.muted ? "Unmute microphone" : "Mute microphone"} title={voice.muted ? "Unmute microphone" : "Mute microphone"}>{voice.muted ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button>
      <button type="button" onClick={voice.toggleSound} className="sahaaya-solo__control" aria-label={voice.soundMuted ? "Turn on Sahaaya sound" : "Mute Sahaaya sound"} title={voice.soundMuted ? "Turn on Sahaaya sound" : "Mute Sahaaya sound"}>{voice.soundMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}</button>
      {(isSpeaking || isSpeechPaused) && <button type="button" onClick={isSpeechPaused ? voice.resumeSpeech : voice.pauseSpeech} className="sahaaya-solo__control" aria-label={isSpeechPaused ? "Resume speech" : "Pause speech"} title={isSpeechPaused ? "Resume speech" : "Pause speech"}>{isSpeechPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>}
      <button type="button" onClick={voice.interrupt} className="sahaaya-solo__control" aria-label="Stop current speech" title="Stop current speech"><CircleStop className="h-5 w-5" /></button>
      <button type="button" onClick={voice.replayLast} className="sahaaya-solo__control" aria-label="Replay last response" title="Replay last response"><RotateCcw className="h-5 w-5" /></button>
    </div>}
    {highRiskMentioned && <article role="alert" className="sahaaya-solo__safety"><AlertTriangle className="h-6 w-6 shrink-0 text-[#a23e4b]" /><div><h2 className="font-semibold text-[#762e39]">Your safety matters right now.</h2><p className="mt-1 text-sm leading-6 text-[#81343f]">If you may be in immediate danger or might hurt yourself or someone else, contact local emergency services or a trusted person now. If possible, do not stay alone.</p><div className="mt-3 flex flex-wrap gap-2"><Link href="/support" className="rounded-full bg-[#9b3c49] px-4 py-2 text-sm font-semibold text-white">Open support</Link><Link href="/checkins" className="rounded-full border border-[#d28e98] px-4 py-2 text-sm font-semibold text-[#81343f]">Share a check-in</Link></div></div></article>}
  </section>;
}
