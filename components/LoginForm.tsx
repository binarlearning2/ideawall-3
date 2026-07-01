"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const FACILITATOR_NAME_KEY = "ideawall:facilitator:name";

export function LoginForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 50) {
      setErrorMessage("Nama wajib diisi (maksimal 50 karakter)");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      localStorage.setItem(FACILITATOR_NAME_KEY, trimmed);
      router.push("/boards");
    } catch {
      setStatus("idle");
      setErrorMessage("Gagal masuk. Coba lagi.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="name" className="block text-sm font-medium text-slate-700">
        Nama fasilitator
      </label>
      <Input
        id="name"
        required
        placeholder="Nama kamu"
        value={name}
        maxLength={50}
        onChange={(e) => setName(e.target.value)}
      />
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Masuk..." : "Masuk tanpa email"}
      </Button>
      <p className="text-xs text-slate-500">
        Cukup tulis nama, tanpa login email atau verifikasi.
      </p>
    </form>
  );
}
