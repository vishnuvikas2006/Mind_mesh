import type { SahaayaStatus } from "@/lib/sahaaya";

export function SahaayaRobot({ status }: { status: SahaayaStatus }) {
  const state = status === "speaking" || status === "speaking_paused" ? "speaking" : status === "listening" ? "listening" : status === "thinking" || status === "connecting" ? "thinking" : "idle";
  return <div className={`sahaaya-robot sahaaya-robot--${state}`} role="img" aria-label={`Original friendly Sahaaya robot is ${state}`}>
    <div className="sahaaya-robot__antenna" aria-hidden="true"><span /></div>
    <div className="sahaaya-robot__head"><div className="sahaaya-robot__face"><span className="sahaaya-robot__eye sahaaya-robot__eye--left" /><span className="sahaaya-robot__eye sahaaya-robot__eye--right" /><span className="sahaaya-robot__mouth" /></div></div>
    <div className="sahaaya-robot__arm sahaaya-robot__arm--left" aria-hidden="true" /><div className="sahaaya-robot__arm sahaaya-robot__arm--right" aria-hidden="true" />
    <div className="sahaaya-robot__body"><span className="sahaaya-robot__heart" aria-hidden="true">✦</span></div>
    <div className="sahaaya-robot__feet" aria-hidden="true"><span /><span /></div>
  </div>;
}
