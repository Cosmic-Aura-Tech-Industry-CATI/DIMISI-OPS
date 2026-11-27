import { createElement, useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const ref = useRef<(HTMLElement & { checked: boolean }) | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onChange = () => setTheme(el.checked ? "dark" : "light");
    el.addEventListener("change", onChange);
    return () => el.removeEventListener("change", onChange);
  }, [setTheme]);

  useEffect(() => {
    const el = ref.current;
    let active = true;
    void customElements.whenDefined("sakuga-toggle").then(() => {
      const checked = theme === "dark";
      if (active && el && el.checked !== checked) el.checked = checked;
    });
    return () => { active = false; };
  }, [theme]);

  return (
    <span className="site-theme-switch">
      {createElement("sakuga-toggle", { ref, label: "Dark mode" })}
    </span>
  );
}
