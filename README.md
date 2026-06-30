# IdeaWall

Papan kolaboratif untuk brainstorming, polling, dan feasibility matrix secara real-time —
implementasi dari `prd-ideawall-brainstorming-polling-matrix.md`.

Dibangun dengan Next.js 14 (App Router), Supabase (Postgres + Auth + Realtime), dan Tailwind
CSS, siap deploy ke Vercel.

## 1. Fitur yang sudah diimplementasikan (v1 must-have)

- [x] Auth ringan untuk fasilitator (magic link / passwordless, via Supabase Auth)
- [x] Board management: buat board, judul, join code 6 karakter unik, archive/delete, toggle anonim
- [x] Join sebagai peserta tanpa akun (cukup nama, lewat link `/b/KODE` atau form di beranda)
- [x] Section **Wall**: sticky note freeform di canvas, drag-reposition oleh penulis, realtime
- [x] Section **Poll**: single/multiple choice, hasil bar chart + persentase real-time, owner bisa tutup poll
- [x] Section **Matrix**: grid 2x2 dengan label sumbu & kuadran custom, drag antar kuadran
- [x] Moderasi: owner hapus sticky note/vote siapa pun; penulis edit/hapus miliknya sendiri
- [x] Toggle anonim per board
- [x] Responsive UI (laptop & HP)
- [x] Rate limiting dasar untuk sticky note (cegah double-klik/spam tidak sengaja)

Lihat `prd-ideawall-brainstorming-polling-matrix.md` §5.2/§5.3 untuk fitur v2/out-of-scope
yang sengaja belum dikerjakan (reaction, export PDF, upload gambar, dst).

## 2. Struktur project

```
app/                  - Next.js App Router (pages + API route handlers)
  api/                 - Route handlers persis sesuai PRD §9.1
  board/[boardId]/     - Halaman manajemen board (owner)
  join/[joinCode]/     - Halaman join peserta
  b/[joinCode]/        - Short-link resolver (/b/ABCD12)
components/           - Komponen React (ui/ generik, board/ spesifik fitur)
lib/                  - Supabase clients, types, utils, session handling
supabase/migrations/  - SQL schema + RLS policies (PRD §8)
tests/                - Unit & integration test (Vitest)
e2e/                  - End-to-end test (Playwright)
```

## 3. Setup lokal

### 3.1 Install dependency

```bash
npm install
```

### 3.2 Buat project Supabase

1. Buat project baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi `supabase/migrations/0001_init.sql` — ini membuat semua
   tabel, RLS policy, trigger, dan mendaftarkan tabel ke realtime publication.
3. Di **Authentication → Providers**, pastikan provider **Email** aktif dengan opsi **Magic Link**
   (passwordless) — bukan Email+Password.
4. Di **Authentication → URL Configuration**, tambahkan `http://localhost:3000/auth/callback`
   ke Redirect URLs untuk development.
5. Copy `Project URL`, `anon public key`, dan `service_role key` dari **Settings → API**.

### 3.3 Environment variables

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan nilai dari Supabase (lihat komentar di tiap baris `.env.example` untuk
penjelasan masing-masing variable).

### 3.4 Jalankan dev server

```bash
npm run dev
```

Buka `http://localhost:3000`.

## 4. Testing (QA)

Mengikuti tiga layer test — unit, integration, e2e:

### 4.1 Unit & integration test (Vitest)

```bash
npm test
```

Status saat ini: **50/50 test pass** (8 file test).

- **Unit** (`tests/unit/`): fungsi utility (`generateJoinCode`, `isValidJoinCodeFormat`,
  `clampText`, rate limiter) dan komponen UI (`StickyNoteCard`, `PollSection`) — render,
  conditional UI (mode anonim, poll terbuka/tertutup), dan interaksi (vote, edit, hapus).
- **Integration** (`tests/integration/`): API Route Handler inti — `POST /api/boards`,
  `GET /api/boards/by-code/[joinCode]`, `POST /api/sections/[sectionId]/sticky-notes`,
  `POST /api/sections/[sectionId]/vote` — mencakup happy path, validasi input, authorization,
  dan rate limiting. Supabase client di-mock (lihat `tests/integration/helpers/mock-supabase.ts`),
  tidak menyentuh database production.

### 4.2 End-to-end test (Playwright)

```bash
npx playwright install   # sekali saja, download browser binary
npm run test:e2e
```

**Catatan penting**: e2e test ditulis lengkap di `e2e/`, tapi **belum bisa dijalankan dari
environment Claude saat ini** — sandbox ini tidak punya akses jaringan ke domain Supabase
maupun CDN Playwright (untuk download browser binary), jadi keduanya gagal di level
infrastruktur, bukan karena bug di kode. Jalankan langkah ini di mesin/CI kamu sendiri:

- `e2e/facilitator-board-management.spec.ts` — jalan langsung asal `npm run dev` + `.env.local`
  Supabase sudah benar (test landing page, magic link form, validasi format kode, 404 untuk
  kode tidak terdaftar).
- `e2e/participant-board-flow.spec.ts` — butuh satu board contoh yang sudah berisi section
  Wall + Poll (≥2 opsi) + Matrix. Login sebagai fasilitator, buat board itu manual sekali,
  lalu set:
  ```bash
  export TEST_BOARD_JOIN_CODE=ABCD12
  npm run test:e2e
  ```
  Tanpa env var ini, test-test tersebut otomatis di-skip (bukan gagal) — Playwright tidak bisa
  otomatis login lewat magic link karena butuh akses inbox email asli.

## 5. Deploy ke Vercel

Checklist pre-deploy sudah lolos di sisi Claude:
- [x] `npm run build` sukses tanpa error
- [x] Semua environment variable terdaftar di `.env.example`
- [x] Tidak ada secret ke-hardcode; `.gitignore` sudah exclude `.env*.local`
- [x] Unit + integration test hijau (50/50)

Langkah deploy (jalankan sendiri — butuh akun Vercel/Supabase kamu, Claude tidak punya akses
ke akun tersebut dari sandbox ini):

1. **Push ke GitHub**: buat repo baru, push project ini (folder ini, bukan termasuk
   `node_modules`/`.next` yang sudah di-`.gitignore`).
2. **Buat project Supabase production** (boleh project yang sama dengan development untuk
   skala kecil, tapi disarankan terpisah) — ulangi langkah 3.2 di atas untuk project ini.
3. **Import repo ke Vercel**: vercel.com → New Project → pilih repo GitHub ini. Framework
   preset Next.js akan terdeteksi otomatis.
4. **Set Environment Variables** di Project Settings → Environment Variables (Production +
   Preview), isi 4 variable dari `.env.example` dengan nilai project Supabase production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (tandai sebagai **sensitive**, jangan expose ke client)
   - `NEXT_PUBLIC_APP_URL` → isi domain Vercel kamu setelah deploy pertama, mis.
     `https://ideawall.vercel.app` (lalu redeploy sekali supaya link share pakai domain benar)
5. **Update Supabase Auth Redirect URL**: tambahkan `https://<domain-vercel-kamu>/auth/callback`
   di Supabase project production → Authentication → URL Configuration.
6. **Deploy** — Vercel otomatis build & deploy. Cron job di `vercel.json` (hit `/api/health`
   tiap Senin jam 06:00 UTC) akan otomatis aktif untuk mencegah Supabase free-tier project
   auto-pause setelah 7 hari idle (PRD §10.2).
7. **Smoke test manual**: buka domain production, login sebagai fasilitator, buat board test,
   buka link join dari device/incognito lain sebagai peserta, pastikan posting & realtime
   jalan di ketiga tipe section sebelum dipakai sesi training beneran (PRD §14 step 7).

## 6. Keterbatasan v1 yang perlu diketahui

- **Realtime poll_options**: ditambahkan ke realtime publication sebagai penyempurnaan di
  luar contoh kode PRD §9.2 — supaya kalau owner menambah opsi poll baru setelah peserta
  sudah membuka board, opsi baru itu langsung muncul tanpa refresh.
- **Rate limiting** bersifat in-memory per server instance (PRD §12 catatan) — cukup untuk
  mencegah double-klik tidak sengaja, bukan perlindungan anti-abuse yang ketat di lingkungan
  serverless multi-instance Vercel.
- **3 default di Open Questions PRD §11** (#1 bentuk matrix grid 2x2, #2 poll fleksibel
  single/multiple, #3 toggle anonim per board) sudah diimplementasikan sesuai default PRD,
  tapi PRD sendiri menandai ini sebaiknya dikonfirmasi ulang ke pengguna sebelum dipakai
  sesi training sungguhan.
