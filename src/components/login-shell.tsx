import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Moon, Rocket, ShieldCheck, Sun, TrendingUp } from "lucide-react";
import { useTheme } from "@/lib/theme";
import "./login-shell.css";

const features = [
  { icon: Rocket, title: "Innovative Solutions", detail: "Built for the future" },
  { icon: ShieldCheck, title: "Reliable & Secure", detail: "Enterprise-grade security" },
  { icon: TrendingUp, title: "Scalable Impact", detail: "Grow without limits" },
];

export function LoginShell({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { theme, setTheme } = useTheme();
  const video = useRef<HTMLVideoElement>(null);
  const backdrop = `/assets/login/${theme}`;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const player = video.current;
    function syncPlayback() {
      if (preference.matches) player?.pause();
      else void player?.play().catch(() => {});
    }
    syncPlayback();
    preference.addEventListener("change", syncPlayback);
    return () => preference.removeEventListener("change", syncPlayback);
  }, [theme]);

  return (
    <main className="login-scene" data-theme={theme}>
      <video key={theme} ref={video} className="login-film" aria-hidden="true"
        muted playsInline loop preload="none" poster={backdrop + ".jpg"} src={backdrop + ".mp4"} />
      <header className="login-header">
        <Link to="/" className="login-brand">
          <img src="/assets/login/dimisi-wordmark.webp" alt="Dimisi home" width="1568" height="672" />
        </Link>
        <div className="login-switch" role="group" aria-label="Color theme">
          {([{ mode: "light", Icon: Sun }, { mode: "dark", Icon: Moon }] as const).map(({ mode, Icon }) => (
            <button type="button" key={mode} aria-label={mode + " theme"} aria-pressed={theme === mode}
              onClick={() => setTheme(mode)}><Icon size={20} /></button>
          ))}
        </div>
      </header>
      <section className="login-intro" aria-label="Dimisi Technologies">
        <h2>Dimisi<br />Technologies</h2>
        <p>We build intelligent software solutions that empower businesses to innovate, automate, and scale with confidence.</p>
        <ul>{features.map(({ icon: Icon, title, detail }) => (
          <li key={title}><Icon aria-hidden="true" /><div><strong>{title}</strong><small>{detail}</small></div></li>
        ))}</ul>
      </section>
      <section className="login-card" aria-labelledby="login-heading">
        <h1 id="login-heading">{title}</h1>
        <p className="login-subtitle">{subtitle}</p>
        {children}
      </section>
      <footer className="login-footer">© {new Date().getFullYear()} <strong>Dimisi Technologies Pvt. Ltd.</strong> All rights reserved.</footer>
    </main>
  );
}
