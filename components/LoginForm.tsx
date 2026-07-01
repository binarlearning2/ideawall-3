"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const redirectTo = new URL("/auth/callback", siteUrl);
    redirectTo.searchParams.set("next", "/boards");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo.toString(),
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
        Link login sudah dikirim ke <strong>{email}</strong>. Cek inbox kamu dan klik link-nya
        untuk masuk.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="email" className="block text-sm font-medium text-slate-700">
        Email
      </label>
      <Input
        id="email"
        type="email"
        required
        placeholder="kamu@perusahaan.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {status === "error" && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={status === "sending"} className="w-full">
        {status === "sending" ? "Mengirim link..." : "Kirim link login"}
      </Button>
      <p className="text-xs text-slate-500">
        Tanpa password — kami kirim link login ke email kamu (passwordless).
      </p>
    </form>
  );
}
