import { Brand } from "./Brand";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-layout min-h-screen bg-[#f7fcfc] lg:grid lg:grid-cols-2">
    <section className="auth-art auth-hero relative flex min-h-[250px] overflow-hidden px-5 py-7 text-white sm:min-h-[430px] sm:px-7 sm:py-9 lg:min-h-screen lg:px-[11%] lg:py-14">
      <div className="auth-hero__content mt-auto max-w-md">
        <p className="mb-5 flex items-center gap-3 text-[10px] font-semibold tracking-[.18em]"><span className="h-px w-10 bg-white/80" />MENTAL HEALTH SUPPORT</p>
        <h1 className="display-serif text-3xl leading-[1.06] sm:text-5xl lg:text-6xl">You are not<br />alone in this.</h1>
        <p className="mt-4 max-w-sm text-sm leading-6 text-white/90 sm:mt-6 sm:text-base">MindMesh is here to support your mental wellbeing with compassionate care and the right help when you need it.</p>
      </div>
    </section>
    <section className="auth-panel relative flex min-h-0 items-center justify-center overflow-hidden px-5 py-8 sm:px-8 sm:py-10 lg:min-h-screen lg:px-12">
      <span className="organic-shape organic-shape--top" /><span className="organic-shape organic-shape--bottom" />
      <div className="auth-panel__content relative z-10 w-full max-w-[420px]">
        <div className="auth-panel__brand mb-7 sm:mb-10"><Brand /></div>{children}
      </div>
    </section>
  </main>;
}
