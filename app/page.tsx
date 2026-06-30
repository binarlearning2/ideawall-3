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
        <div className="mb-4 inline-flex items-center rounded-full border border-brand-700/60 bg-brand-900/50 px-4 py-1.5 text-sm font-semibold text-brand-300">
          ✦ Powered by BINAR
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          IdeaWall
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base text-slate-300 sm:text-lg">
          Papan kolaboratif untuk brainstorming, polling, dan feasibility matrix —
          real-time, tanpa tool eksternal.
        </p>
      </div>

      {/* Kartu — selalu putih, tidak berubah saat mode malam */}
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)] backdrop-blur">
          <h2 className="mb-1 text-xl font-semibold text-slate-900">Fasilitator</h2>
          <p className="mb-4 text-sm text-slate-500">
            Login untuk membuat dan mengelola board kamu sendiri.
          </p>
          <LoginForm />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.18)] backdrop-blur">
          <h2 className="mb-1 text-xl font-semibold text-slate-900">Peserta</h2>
          <p className="mb-4 text-sm text-slate-500">
            Punya kode board dari fasilitator? Masuk langsung tanpa akun.
          </p>
          <JoinCodeForm />
        </div>
      </div>
    </main>
  );
}
