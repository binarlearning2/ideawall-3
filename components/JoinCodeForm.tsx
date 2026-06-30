"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isValidJoinCodeFormat } from "@/lib/utils";

export function JoinCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!isValidJoinCodeFormat(trimmed)) {
      setErrorMessage("Kode board harus 6 karakter (huruf/angka)");
      return;
    }
    setErrorMessage("");
    router.push(`/join/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="join-code" className="block text-sm font-medium text-slate-700">
        Masukkan kode board
      </label>
      <Input
        id="join-code"
        placeholder="ABCD12"
        value={code}
        maxLength={6}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        className="text-center text-lg tracking-[0.3em] uppercase"
      />
      {errorMessage && (
        <p className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      <Button type="submit" variant="secondary" className="w-full">
        Masuk ke board
      </Button>
    </form>
  );
}
