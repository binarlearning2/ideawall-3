"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function IdeaWallLogo() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="42" height="42" rx="11" fill="url(#logo-grad)" />
      <rect x="18" y="8" width="16" height="18" rx="2.5" fill="white" fillOpacity="0.45" />
      <rect x="8" y="14" width="16" height="20" rx="2.5" fill="white" fillOpacity="0.95" />
      <rect x="11.5" y="18.5" width="9" height="2" rx="1" fill="#7c5cf6" />
      <rect x="11.5" y="22.5" width="7" height="2" rx="1" fill="#9b8afb" />
      <rect x="11.5" y="26.5" width="8" height="2" rx="1" fill="#bdb4fe" />
      <circle cx="30" cy="22" r="3.5" fill="white" fillOpacity="0.8" />
      <circle cx="30" cy="22" r="1.8" fill="#fbbf24" />
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c5cf6" />
          <stop offset="1" stopColor="#4d24b3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function BrandShell({ children }: { children: React.ReactNode }) {
  const [musicEnabled, setMusicEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/Harvestmoon-sound.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;

    if (musicEnabled) {
      void audioRef.current.play().catch(() => undefined);
    } else {
      audioRef.current.pause();
    }
  }, [musicEnabled]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 shadow-lg backdrop-blur-xl">
          <Link href="/" className="group flex items-center gap-3">
            <IdeaWallLogo />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-brand-400 transition-colors group-hover:text-brand-300">
                BINAR
              </p>
              <p className="text-sm font-semibold leading-tight text-white">IdeaWall</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMusicEnabled((value) => !value)}
            className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            {musicEnabled ? "🔊 Backsound On" : "🔈 Backsound Off"}
          </button>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
