# Kas Badminton Club — Sistem Manajemen Kas Iuran Badminton

Aplikasi manajemen kas klub badminton: **Pemasukan (Top Up)**, **Pengeluaran**, dan **Tabungan/Kuota Anggota**. Dibangun dengan React (Vite) + Supabase.

## Tech Stack
- React 18 + Vite + React Router DOM
- Tailwind CSS + Headless UI + Lucide React
- Supabase (PostgreSQL) via `@supabase/supabase-js`
- Zustand (state management) + react-hot-toast (notifikasi)

## Setup

### 1. Database
1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor → New query**
3. Paste seluruh isi `supabase/schema.sql` lalu klik **RUN**
   (membuat tabel `members`, `transactions`, `expenses`, fungsi RPC, dan data dummy)

### 2. Environment
```bash
cp .env.example .env
```
Isi `.env`:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ADMIN_PIN=123456
```
(Kredensial ada di **Supabase Dashboard → Project Settings → API**)

### 3. Jalankan
```bash
npm install
npm run dev
```

| Halaman | Path | Akses |
|---|---|---|
| Dashboard anggota (read-only) | `/` | Publik |
| Login admin (PIN pad) | `/admin/login` | PIN dari `VITE_ADMIN_PIN` |
| Dashboard admin | `/admin` | Setelah login PIN |

## Logika Bisnis
- Harga **1x pertemuan = Rp 10.000**
- Member top up Rp 100.000 → saldo Rp 100.000 (sisa 10x pertemuan)
- Member hadir latihan → saldo dipotong Rp 10.000 otomatis (sisa 9x)
- **Total Kas = SUM(top up) − SUM(pengeluaran)**. Absensi tidak mengubah kas global karena uangnya sudah masuk saat top up; absensi hanya mengubah status saldo prepaid anggota.
- Semua perubahan saldo bersifat atomik lewat fungsi PostgreSQL (`handle_topup`, `handle_attendance`, `handle_expense`) sehingga riwayat & saldo tidak pernah tidak sinkron.
- Saldo boleh minus (tunggakan) agar bendahara tahu siapa yang harus menyetor lagi.

## Catatan Keamanan
Autentikasi PIN di sisi client sesuai kebutuhan aplikasi ini. Untuk production, disarankan memakai Supabase Auth + RLS policy per-role.
