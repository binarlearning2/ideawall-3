import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Board tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-500">
        Pastikan kode atau link board yang kamu masukkan benar.
      </p>
      <Link href="/" className="mt-6 text-sm text-brand-600 hover:underline">
        ← Kembali ke beranda
      </Link>
    </main>
  );
}
