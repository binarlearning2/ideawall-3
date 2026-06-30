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
  // Default ON — musik langsung mulai saat halaman dibuka
  const [musicEnabled, setMusicEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicEnabledRef = useRef(true);

  // Sinkronkan ref agar closure di listener selalu punya nilai terbaru
  useEffect(() => {
    musicEnabledRef.current = musicEnabled;
  }, [musicEnabled]);

  useEffect(() => {
    const audio = new Audio("/Harvestmoon-sound.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audioRef.current = audio;

    // Coba langsung play; jika browser blokir (policy autoplay),
    // tunggu gesture pertama user lalu coba lagi
    void audio.play().catch(() => {
      const resume = () => {
        if (musicEnabledRef.current) {
          void audio.play().catch(() => undefined);
        }
      };
      document.addEventListener("click", resume, { once: true });
      document.addEventListener("keydown", resume, { once: true });
    });

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
        <header className="mb-6 flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-white/10 px-5 py-3 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <Link href="/" className="group flex items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-brand-500/80 to-brand-700/90 p-1.5 shadow-lg shadow-brand-900/20">
              <IdeaWallLogo />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-brand-300 transition-colors group-hover:text-brand-200">
                BINAR
              </p>
              <p className="text-sm font-semibold leading-tight text-white">IdeaWall</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMusicEnabled((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
              musicEnabled
                ? "border-amber-300/40 bg-amber-400/20 text-amber-100 shadow-[0_0_0_1px_rgba(253,230,138,0.25)]"
                : "border-white/15 bg-white/10 text-slate-100 hover:bg-white/20"
            }`}
          >
            <span className="text-base">{musicEnabled ? "♫" : "♪"}</span>
            <span>{musicEnabled ? "Backsound On" : "Backsound Off"}</span>
          </button>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
