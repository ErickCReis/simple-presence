import { ArrowRight, Check, Code, GlobeSimple, Lightning } from "@phosphor-icons/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { HeroDemo } from "@/routes/_landing/-components/hero-demo";
import { QuickGuide } from "@/routes/_landing/-components/quick-guide";

export const Route = createFileRoute("/_landing/")({
  component: LandingPage,
  head: () => ({
    meta: [
      {
        title: "Simple Presence - Real-time User Presence for Any JavaScript App",
      },
      {
        name: "description",
        content:
          "Add real-time user presence to any JavaScript application with just a few lines of code. See who's online, track user activity, and boost engagement instantly.",
      },
      {
        name: "keywords",
        content:
          "real-time presence, user activity, JavaScript, TypeScript, React, Vue, Angular, online users, live tracking",
      },
    ],
  }),
});

const features = [
  {
    icon: Lightning,
    title: "Sub-millisecond",
    description:
      "Powered by Cloudflare Durable Objects. Presence updates propagate instantly across the globe.",
  },
  {
    icon: Code,
    title: "3 lines of code",
    description:
      "Install the SDK, wrap your component, done. No WebSocket boilerplate, no infrastructure to manage.",
  },
  {
    icon: GlobeSimple,
    title: "Any framework",
    description:
      "First-class React hooks plus a framework-agnostic core SDK. Works everywhere JavaScript runs.",
  },
];

const planFeatures = [
  "3 applications",
  "100 simultaneous users",
  "Real-time presence updates",
  "Dashboard & analytics",
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="font-heading text-base tracking-widest text-white uppercase">
            Simple Presence
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
              render={<Link to="/docs/$" params={{ _splat: "" }} />}
              nativeButton={false}
            >
              Documentation
            </Button>
            <Button
              size="sm"
              className="border-transparent bg-white text-gray-950 hover:bg-gray-200"
              render={<Link to="/dashboard" />}
              nativeButton={false}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative flex min-h-svh items-center justify-center overflow-hidden pt-14">
        <div className="landing-dots pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 55%, rgba(52,211,153,0.06) 0%, transparent 100%)",
          }}
        />

        <div className="relative z-10 px-6 text-center">
          <h1 className="landing-fade-in font-heading text-5xl font-bold tracking-tight text-white md:text-7xl">
            Simple Presence
          </h1>
          <p
            className="landing-fade-in mx-auto mt-5 max-w-lg text-lg text-gray-400 md:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            Real-time user presence for any JavaScript app.{" "}
            <span className="text-gray-300">Drop in a few lines. See who's here.</span>
          </p>

          <HeroDemo />

          <div
            className="landing-fade-in flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: "0.4s" }}
          >
            <Button
              size="lg"
              className="gap-2 border-transparent bg-white px-6 text-gray-950 hover:bg-gray-200"
              render={<Link to="/dashboard" />}
              nativeButton={false}
            >
              Start Free
              <ArrowRight weight="bold" className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/15 text-gray-300 hover:bg-white/5 hover:text-white"
              render={<Link to="/docs/$" params={{ _splat: "" }} />}
              nativeButton={false}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <section className="relative px-6 py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-4 text-center font-heading text-3xl font-bold text-white md:text-4xl">
            Why Simple Presence?
          </h2>
          <p className="mx-auto mb-20 max-w-md text-center text-gray-500">
            A hosted presence service that gets out of your way.
          </p>
          <div className="grid gap-12 md:grid-cols-3 md:gap-16">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto mb-6 inline-flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
                  <feature.icon className="size-7 text-emerald-400" weight="duotone" />
                </div>
                <h3 className="mb-3 font-heading text-xl font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <section className="relative px-6 py-32">
        <div className="landing-dots pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-3xl">
          <h2 className="mb-4 text-center font-heading text-3xl font-bold text-white md:text-4xl">
            Get started in minutes
          </h2>
          <p className="mx-auto mb-12 max-w-md text-center text-gray-500">
            Install the SDK and start tracking presence. That's it.
          </p>

          <div className="mb-6 flex items-center justify-center">
            <code className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2.5 font-mono text-sm text-gray-300">
              npm install @simple-presence/react
            </code>
          </div>

          <QuickGuide />

          <p className="mt-8 text-center text-sm text-gray-600">
            No configuration files. No database. No WebSocket setup.
          </p>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <section className="px-6 py-32">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-white md:text-4xl">
            Start free
          </h2>
          <p className="mb-12 text-lg text-gray-500">No credit card. No catch. Just ship.</p>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <div className="font-heading text-5xl font-bold text-white">$0</div>
            <div className="mt-1 text-sm text-gray-600">forever</div>

            <ul className="my-8 space-y-4 text-left">
              {planFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3 text-gray-300">
                  <Check weight="bold" className="size-5 shrink-0 text-emerald-400" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full gap-2 border-transparent bg-white text-gray-950 hover:bg-gray-200"
              render={<Link to="/dashboard" />}
              nativeButton={false}
            >
              Get Started
              <ArrowRight weight="bold" className="size-4" />
            </Button>
            <p className="mt-4 text-xs text-gray-600">
              Paid plans coming soon with advanced features
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 md:flex-row">
          <span className="font-heading text-sm tracking-widest text-white/30 uppercase">
            © {new Date().getFullYear()} Simple Presence
          </span>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link
              to="/docs/$"
              params={{ _splat: "" }}
              className="transition-colors hover:text-gray-300"
            >
              Documentation
            </Link>
            <a href="/#" className="transition-colors hover:text-gray-300">
              GitHub
            </a>
            <a href="/#" className="transition-colors hover:text-gray-300">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
