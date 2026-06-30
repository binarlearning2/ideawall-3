import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { BrandShell } from "@/components/BrandShell";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "IdeaWall — Brainstorming, Polling & Feasibility Matrix",
  description:
    "Papan kolaboratif untuk sesi brainstorming, polling, dan feasibility matrix secara real-time.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${poppins.variable} dark`}>
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <BrandShell>{children}</BrandShell>
      </body>
    </html>
  );
}
