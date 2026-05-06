import { usePresenceCount } from "@simple-presence/react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

export function HeroDemo() {
  const count = usePresenceCount("landing", {
    appKey: import.meta.env.VITE_DEMO_APP_KEY as string,
    apiUrl: import.meta.env.VITE_SERVER_URL,
  });

  return (
    <div className="landing-fade-in relative my-16" style={{ animationDelay: "0.2s" }}>
      <div className="pointer-events-none absolute -inset-x-20 -inset-y-10 rounded-full bg-emerald-500/15 blur-3xl" />

      <div
        className="relative font-heading text-7xl font-bold leading-none tracking-tighter text-emerald-400 tabular-nums md:text-9xl"
        style={{ textShadow: "0 0 80px rgba(52, 211, 153, 0.3)" }}
      >
        <AnimatedCounter value={count} duration={800} showCommas />
      </div>

      <div className="mt-5 flex items-center justify-center gap-2.5">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-sm font-medium uppercase tracking-widest text-gray-500">
          people on this page
        </span>
      </div>
    </div>
  );
}
