"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const musicEmbedUrl =
  "https://www.youtube.com/embed/Um42Na9sfOI?autoplay=1&mute=1&loop=1&playlist=Um42Na9sfOI&controls=0&showinfo=0&rel=0";

export function BrandShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ideawall-theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme ?? (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("ideawall-theme", theme);
  }, [mounted, theme]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,107,53,0.16),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(15,91,216,0.14),_transparent_35%)] transition-colors duration-300">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-500/20">
              <span className="text-lg font-semibold text-white">B</span>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-600 dark:text-brand-300">
                BINAR
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">IdeaWall by BINAR</p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTheme((current) => (current === "light" ? "dark" : "light"))}
              aria-label="Toggle day/night theme"
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {theme === "light" ? "☀️ Day" : "🌙 Night"}
            </button>
            <button
              type="button"
              onClick={() => setMusicEnabled((current) => !current)}
              aria-label="Toggle background music"
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {musicEnabled ? "♫ On" : "♫ Off"}
            </button>
          </div>
        </header>

        <div className="flex-1">
          <iframe
            title="Background music"
            className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
            src={musicEnabled ? musicEmbedUrl : undefined}
            allow="autoplay"
          />
          {children}
        </div>
      </div>
    </div>
  );
}
