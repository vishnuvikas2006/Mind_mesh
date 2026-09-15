export const SUPPORTED_LANGUAGES = [
  { code: "auto", name: "Auto detect", locale: "" },
  { code: "te", name: "Telugu", locale: "te-IN" },
  { code: "hi", name: "Hindi", locale: "hi-IN" },
  { code: "en", name: "English", locale: "en-IN" },
  { code: "ta", name: "Tamil", locale: "ta-IN" },
  { code: "kn", name: "Kannada", locale: "kn-IN" },
  { code: "ml", name: "Malayalam", locale: "ml-IN" },
  { code: "bn", name: "Bengali", locale: "bn-IN" },
] as const;

export type SahaayaLanguage = (typeof SUPPORTED_LANGUAGES)[number]["code"];
export type SpiritualSupport = "off" | "reflection" | "tradition";

export const SAHAAYA_STATUS_LABELS = {
  idle: "Ready to talk",
  requesting_permission: "Requesting microphone access",
  connecting: "Connecting…",
  connected: "Connected",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
  speaking_paused: "Speech paused",
  paused: "Microphone muted",
  error: "Connection needs attention",
  ended: "Conversation ended",
} as const;

export type SahaayaStatus = keyof typeof SAHAAYA_STATUS_LABELS;

export function languageName(language: SahaayaLanguage | "unknown") {
  return SUPPORTED_LANGUAGES.find((entry) => entry.code === language)?.name ?? "Unclear";
}
