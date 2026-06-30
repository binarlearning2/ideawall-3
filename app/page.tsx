import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";
import { JoinCodeForm } from "@/components/JoinCodeForm";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/boards");
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center gap-8 px-2 py-8 sm:px-6 lg:px-8">
      <div className="max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-sm font-semibold text-brand-700 shadow-sm dark:border-brand-800/70 dark:bg-brand-950/40 dark:text-brand-200">
          Powered by BINAR
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-slate-50">
          IdeaWall
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-600 sm:text-lg dark:text-slate-300">
          Papan kolaboratif untuk brainstorming, polling, dan feasibility matrix —
          real-time, tanpa tool eksternal.
        </p>
      </div>

      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Fasilitator</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Login untuk membuat dan mengelola board kamu sendiri.
          </p>
          <LoginForm />
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.55)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/80">
          <h2 className="mb-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Peserta</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Punya kode board dari fasilitator? Masuk langsung tanpa akun.
          </p>
          <JoinCodeForm />
        </div>
      </div>
    </main>
  );
}
