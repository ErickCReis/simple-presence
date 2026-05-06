import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  footerPrompt: string;
  footerTo: "/sign-in" | "/sign-up";
  footerLabel: string;
  children: ReactNode;
};

const authNotes = [
  ["Registry", "Provision apps and keep public keys visible."],
  ["Streams", "Inspect tags and events from the same console."],
  ["Access", "Use one account to operate the dashboard."],
];

export function AuthShell({
  eyebrow,
  title,
  description,
  footerPrompt,
  footerTo,
  footerLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="landing-dots pointer-events-none absolute inset-0 opacity-40" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 30% 50%, rgba(52,211,153,0.04) 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl gap-10 lg:grid-cols-5 lg:gap-16">
        <section className="flex flex-col justify-center border-white/[0.06] pb-8 lg:col-span-3 lg:border-r lg:pb-0 lg:pr-16">
          <Link to="/" className="mb-8 font-heading text-base tracking-widest text-white uppercase">
            Simple Presence
          </Link>

          <p className="text-xs tracking-widest text-white/40 uppercase">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl leading-none tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/56">{description}</p>

          <dl className="mt-10 grid gap-5 border-t border-white/[0.06] pt-6 sm:grid-cols-3 lg:grid-cols-1">
            {authNotes.map(([term, detail]) => (
              <div
                key={term}
                className="border-b border-white/[0.06] pb-5 last:border-b-0 last:pb-0"
              >
                <dt className="font-heading text-sm tracking-widest text-white uppercase">
                  {term}
                </dt>
                <dd className="mt-2 text-sm leading-7 text-white/50">{detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex items-center lg:col-span-2 lg:pl-2">
          <div className="w-full max-w-md">
            <p className="text-xs tracking-widest text-white/40 uppercase">Authentication</p>
            <h2 className="mt-4 font-heading text-3xl tracking-tight text-white">
              Dashboard access
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/50">
              Authenticate and go directly to the registry.
            </p>

            <div className="mt-10">{children}</div>

            <div className="mt-6 border-t border-white/[0.06] pt-5 text-sm text-white/50">
              {footerPrompt}{" "}
              <Button
                variant="link"
                render={<Link to={footerTo} />}
                nativeButton={false}
                className="h-auto p-0 text-emerald-400 no-underline hover:text-white hover:no-underline"
              >
                {footerLabel}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
