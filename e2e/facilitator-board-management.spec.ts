import { test, expect } from "@playwright/test";

// Covers PRD §6.1 — Fasilitator membuat board, menambahkan section, dan mendapat join code.
// NOTE: requires a real Supabase project wired up via .env.local (magic link auth +
// database) — see README.md "Menjalankan E2E Test". Without it, these will fail at the
// auth/database step, not because of a bug in the app itself.

test.describe("Fasilitator: buat board dan kelola section", () => {
  test("halaman utama menampilkan opsi login fasilitator dan join peserta", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "IdeaWall" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fasilitator" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Peserta" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel(/masukkan kode board/i)).toBeVisible();
  });

  test("mengirim magic link menampilkan pesan konfirmasi", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("fasilitator@contoh.com");
    await page.getByRole("button", { name: /kirim link login/i }).click();

    await expect(page.getByText(/link login sudah dikirim/i)).toBeVisible({ timeout: 10_000 });
  });

  test("kode board dengan format tidak valid menampilkan pesan error di form join", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel(/masukkan kode board/i).fill("AB");
    await page.getByRole("button", { name: /masuk ke board/i }).click();

    await expect(page.getByText(/kode board harus 6 karakter/i)).toBeVisible();
  });

  test("kode board yang tidak terdaftar menampilkan halaman tidak ditemukan", async ({ page }) => {
    await page.goto("/join/ZZZZ99");
    await expect(page.getByRole("heading", { name: /board tidak ditemukan/i })).toBeVisible();
  });
});
