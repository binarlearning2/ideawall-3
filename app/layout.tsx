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
    <html lang="id" suppressHydrationWarning className={poppins.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <BrandShell>{children}</BrandShell>
      </body>
    </html>
  );
}
