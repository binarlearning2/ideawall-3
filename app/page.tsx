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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">IdeaWall</h1>
        <p className="mt-2 max-w-md text-slate-600">
          Papan kolaboratif untuk brainstorming, polling, dan feasibility matrix —
          real-time, tanpa tool eksternal.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Fasilitator</h2>
          <p className="mb-4 text-sm text-slate-500">
            Login untuk membuat dan mengelola board kamu sendiri.
          </p>
          <LoginForm />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-slate-900">Peserta</h2>
          <p className="mb-4 text-sm text-slate-500">
            Punya kode board dari fasilitator? Masuk langsung tanpa akun.
          </p>
          <JoinCodeForm />
        </div>
      </div>
    </main>
  );
}
