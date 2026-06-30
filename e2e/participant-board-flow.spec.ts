import { test, expect } from "@playwright/test";

// Covers PRD §6.2 — Peserta join & berpartisipasi di Wall, Poll, dan Matrix.
//
// These tests need a pre-seeded board with one section of each type (wall/poll/matrix),
// since automating the facilitator's passwordless magic-link login isn't practical without
// a real test inbox. Seed one manually (login as facilitator, create a board titled
// anything, add a Wall + a Poll with >=2 options + a Matrix section) and set:
//   TEST_BOARD_JOIN_CODE=<the 6-char code>
// Without it, these tests are skipped rather than failing noisily.

const joinCode = process.env.TEST_BOARD_JOIN_CODE;

test.describe("Peserta: join board dan posting ke Wall/Poll/Matrix", () => {
  test.skip(!joinCode, "TEST_BOARD_JOIN_CODE belum di-set — lihat catatan di atas file ini.");

  test("peserta bisa join board dan posting ide ke Wall", async ({ page }) => {
    await page.goto(`/join/${joinCode}`);

    await page.getByPlaceholder("Nama kamu").fill("Budi");
    await page.getByRole("button", { name: "Masuk" }).click();

    // Wall section should be the default active tab.
    await page.getByText(/klik dua kali di area kosong/i).waitFor();

    const canvas = page.locator("text=klik dua kali untuk mulai brainstorming").locator("..");
    await canvas.dblclick({ position: { x: 100, y: 100 } }).catch(async () => {
      // Fallback: double-click the dashed canvas container directly if the empty-state text isn't present.
      await page.locator(".border-dashed").first().dblclick({ position: { x: 100, y: 100 } });
    });

    await page.getByPlaceholder("Tulis ide kamu...").fill("Ide brilian dari Budi");
    await page.getByRole("button", { name: "Tambah" }).click();

    await expect(page.getByText("Ide brilian dari Budi")).toBeVisible({ timeout: 5000 });
  });

  test("peserta bisa vote di Poll dan melihat hasil ter-update", async ({ page }) => {
    await page.goto(`/join/${joinCode}`);
    await page.getByPlaceholder("Nama kamu").fill("Siti");
    await page.getByRole("button", { name: "Masuk" }).click();

    await page.getByRole("button", { name: /poll/i }).first().click();

    const firstOption = page.getByRole("radio").or(page.getByRole("checkbox")).first();
    await firstOption.click();

    await expect(page.getByText(/total \d+ suara/i)).toBeVisible({ timeout: 5000 });
  });

  test("peserta bisa menambahkan ide ke salah satu kuadran Matrix", async ({ page }) => {
    await page.goto(`/join/${joinCode}`);
    await page.getByPlaceholder("Nama kamu").fill("Andi");
    await page.getByRole("button", { name: "Masuk" }).click();

    await page.getByRole("button", { name: /matrix/i }).first().click();

    await page.getByRole("button", { name: /tambah ide ke kuadran 1/i }).click();
    await page.getByPlaceholder("Tulis ide kamu...").fill("Quick win dari Andi");
    await page.getByRole("button", { name: "Tambah" }).click();

    await expect(page.getByText("Quick win dari Andi")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Realtime: update dari satu peserta terlihat oleh peserta lain", () => {
  test.skip(!joinCode, "TEST_BOARD_JOIN_CODE belum di-set — lihat catatan di atas file ini.");

  test("sticky note baru dari peserta 1 muncul ke peserta 2 tanpa refresh", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto(`/join/${joinCode}`);
    await page1.getByPlaceholder("Nama kamu").fill("Peserta 1");
    await page1.getByRole("button", { name: "Masuk" }).click();

    await page2.goto(`/join/${joinCode}`);
    await page2.getByPlaceholder("Nama kamu").fill("Peserta 2");
    await page2.getByRole("button", { name: "Masuk" }).click();

    await page1.locator(".border-dashed").first().dblclick({ position: { x: 150, y: 150 } });
    await page1.getByPlaceholder("Tulis ide kamu...").fill("Update real-time test");
    await page1.getByRole("button", { name: "Tambah" }).click();

    // page2 must see it appear live, without a manual reload.
    await expect(page2.getByText("Update real-time test")).toBeVisible({ timeout: 5000 });

    await context1.close();
    await context2.close();
  });
});
