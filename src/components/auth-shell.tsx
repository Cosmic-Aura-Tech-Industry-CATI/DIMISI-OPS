import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Rocket, ShieldCheck, TrendingUp } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import dimisiLogo from "@/assets/dimisi-mark.png.asset.json";

function DimisiMark({ className = "" }: { className?: string }) {
  return (
    <img
      src={dimisiLogo.url}
      alt="Dimisi Technologies"
      className={`rounded-xl object-contain ${className}`}
    />
  );
}

const features = [
  {
    icon: Rocket,
    title: "Innovative Solutions",
    desc: "Built for the future",
  },
  {
    icon: ShieldCheck,
    title: "Reliable & Secure",
    desc: "Enterprise-grade security",
  },
  {
    icon: TrendingUp,
    title: "Scalable Impact",
    desc: "Grow without limits",
  },
];

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden overflow-hidden border-r border-border/60 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_-10%_-10%,rgb(255_255_255/0.10),transparent_60%),radial-gradient(800px_500px_at_110%_110%,rgb(255_255_255/0.06),transparent_60%)]" />
          <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 pl-[calc(2.5rem+15px)]">
            <Link to="/" className="flex items-center gap-3">
              <DimisiMark className="h-10 w-10" />
              <div className="font-display text-2xl font-bold tracking-wide">DIMISI</div>
            </Link>

            <div>
              <h2 className="hero-title font-display font-bold tracking-tight text-foreground">
                Dimisi Technologies
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                We build intelligent software solutions that empower businesses to innovate,
                automate, and scale with confidence.
              </p>

              <div className="mt-8 grid max-w-md gap-3">
                {features.map((f) => (
                  <div
                    key={f.title}
                    className="glass group flex items-center gap-4 rounded-2xl border border-border/60 p-4 transition-all hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/60 bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{f.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()}{" "}
              <span className="text-primary">Dimisi Technologies Pvt. Ltd.</span> All rights reserved.
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex items-center justify-center p-6 sm:p-10">
          <div className="glass w-full max-w-md rounded-3xl p-8">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <DimisiMark className="h-9 w-9" />
              <div className="leading-tight">
                <div className="font-display text-base font-semibold">Dimisi</div>
                <div className="text-[11px] text-muted-foreground">Dimisi Technologies</div>
              </div>
            </div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
            {footer && (
              <div className="mt-6 border-t border-border/60 pt-4 text-center text-sm">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
