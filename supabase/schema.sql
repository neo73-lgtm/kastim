-- ================================================================
-- SISTEM MANAJEMEN KAS IURAN BADMINTON
-- Skema Database Supabase (PostgreSQL) + Data Dummy
--
-- Cara pakai:
--   1. Buat project di https://supabase.com
--   2. Buka Dashboard > SQL Editor > New query
--   3. Paste seluruh script ini, lalu klik RUN
-- ================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------
-- 1) TABEL: members
--    balance = tabungan/kuota milik member (satuan Rupiah).
--    Harga 1x pertemuan = Rp 10.000 (dipakai di handle_attendance).
-- ----------------------------------------------------------------
create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  name       text    not null,
  phone      text,
  balance    integer not null default 0,        -- saldo tabungan member
  is_active  boolean not null default true,     -- nonaktif = sudah berhenti klub
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 2) TABEL: transactions (arus uang terkait MEMBER)
--    type = 'topup'      : member setor uang -> balance NAIK, kas global NAIK
--    type = 'attendance' : member hadir main -> balance TURUN, kas global TETAP
--
--    PENTING (logika kas):
--    Uang fisik masuk ke kas HANYA saat top-up. Saat member hadir,
--    uang tidak berpindah — yang berubah hanyalah status saldo
--    prepaid member (saldo -> terpakai). Maka:
--      TOTAL KAS = SUM(transactions where type='topup') - SUM(expenses)
-- ----------------------------------------------------------------
create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid    not null references public.members(id) on delete cascade,
  type       text    not null check (type in ('topup', 'attendance')),
  amount     integer not null check (amount > 0), -- selalu positif, arah ditentukan kolom `type`
  note       text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 3) TABEL: expenses (pengeluaran kas global oleh bendahara)
--    Contoh: beli shuttlecock, sewa lapangan.
-- ----------------------------------------------------------------
create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  title      text    not null,
  category   text    not null default 'Lainnya',
  amount     integer not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- Index untuk mempercepat query daftar / history
create index if not exists idx_tx_member    on public.transactions (member_id, created_at desc);
create index if not exists idx_tx_type_date on public.transactions (type, created_at desc);
create index if not exists idx_expense_date on public.expenses (created_at desc);

-- ----------------------------------------------------------------
-- 4) ROW LEVEL SECURITY
--    Autentikasi aplikasi memakai PIN di sisi client (bukan Supabase
--    Auth), sehingga kebijakan dibuka untuk role anon.
--    Untuk production yang lebih aman, ganti dengan Supabase Auth
--    dan policy per-role.
-- ----------------------------------------------------------------
alter table public.members      enable row level security;
alter table public.transactions enable row level security;
alter table public.expenses     enable row level security;

drop policy if exists "anon_full_access_members" on public.members;
create policy "anon_full_access_members" on public.members for all using (true) with check (true);

drop policy if exists "anon_full_access_transactions" on public.transactions;
create policy "anon_full_access_transactions" on public.transactions for all using (true) with check (true);

drop policy if exists "anon_full_access_expenses" on public.expenses;
create policy "anon_full_access_expenses" on public.expenses for all using (true) with check (true);

-- Hak akses eksplisit untuk role anon.
-- PENTING: beberapa project Supabase tidak mewarisi default privileges
-- secara otomatis, sehingga query anon menghasilkan error 42501
-- "permission denied for table" tanpa GRANT di bawah ini.
grant usage on schema public to anon;
grant all on all tables in schema public to anon;
grant all on all sequences in schema public to anon;
grant execute on all functions in schema public to anon;

-- ================================================================
-- 5) FUNGSI (RPC) — semua perubahan saldo dilakukan ATOMIK
--    di database agar transaksi & saldo tidak pernah tidak sinkron.
-- ================================================================

-- 5a. TOP UP: catat transaksi + tambah saldo member dalam 1 transaksi DB
create or replace function public.handle_topup(
  p_member_id uuid,
  p_amount    integer,
  p_note      text default null
)
returns void
language plpgsql
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal top up harus lebih besar dari 0';
  end if;

  insert into public.transactions (member_id, type, amount, note)
  values (p_member_id, 'topup', p_amount, p_note);

  update public.members
     set balance = balance + p_amount
   where id = p_member_id;
end;
$$;

-- 5b. ABSENSI: potong saldo tiap member yang hadir
--
--     INI INTI LOGIKA BISNIS:
--     1x pertemuan = Rp 10.000 (p_price). Untuk SETIAP member yang
--     dipilih bendahara:
--       1. Dicatat transaksi 'attendance' sebesar p_price
--       2. balance member dikurangi p_price
--     Contoh: member top up Rp 100.000 lalu hadir 1x ->
--             saldo menjadi Rp 90.000 (sisa 9x pertemuan).
--
--     Saldo BOLEH minus (tunggakan) supaya bendahara tahu siapa yang
--     harus menyetor lagi. Jika ingin memblokir member bersaldo kurang,
--     tambahkan pengecekan `where balance >= p_price` pada UPDATE.
create or replace function public.handle_attendance(
  p_member_ids uuid[],
  p_price      integer default 10000,
  p_note       text    default 'Potongan absensi latihan'
)
returns json
language plpgsql
as $$
declare
  v_id        uuid;
  v_processed integer := 0;
begin
  if p_price is null or p_price <= 0 then
    p_price := 10000; -- harga default 1x pertemuan
  end if;

  foreach v_id in array p_member_ids loop
    insert into public.transactions (member_id, type, amount, note)
    values (v_id, 'attendance', p_price, p_note);

    update public.members
       set balance = balance - p_price  -- <-- POTONGAN SALDO KEHADIRAN
     where id = v_id;

    v_processed := v_processed + 1;
  end loop;

  return json_build_object(
    'processed', v_processed,
    'price_per_meeting', p_price
  );
end;
$$;

-- 5c. PENGELUARAN: mengurangi kas global (uang fisik keluar)
--     CATATAN: parameter dengan nilai default (p_category) harus
--     berada SETELAH parameter wajib (p_amount) sesuai aturan PL/pgSQL.
create or replace function public.handle_expense(
  p_title    text,
  p_amount   integer,
  p_category text default 'Lainnya'
)
returns void
language plpgsql
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Nominal pengeluaran harus lebih besar dari 0';
  end if;

  insert into public.expenses (title, category, amount)
  values (p_title, p_category, p_amount);
end;
$$;

-- 5d. RINGKASAN KEUANGAN untuk dashboard (dipanggil via supabase.rpc)
create or replace function public.get_financial_summary()
returns json
language sql
stable
as $$
  select json_build_object(
    'total_income', coalesce((select sum(amount) from public.transactions where type = 'topup'), 0),
    'total_expense', coalesce((select sum(amount) from public.expenses), 0),
    'total_cash', coalesce((select sum(amount) from public.transactions where type = 'topup'), 0)
                  - coalesce((select sum(amount) from public.expenses), 0),
    'expense_this_month', coalesce((
        select sum(amount) from public.expenses
        where date_trunc('month', created_at) = date_trunc('month', now())
      ), 0),
    'active_members', (select count(*) from public.members where is_active),
    'total_balance_held', coalesce((select sum(balance) from public.members), 0)
  );
$$;

-- ================================================================
-- 6) DATA DUMMY
--    8 anggota, riwayat top up + absensi 9 sesi latihan terakhir,
--    dan 4 pengeluaran. Semua angka KONSISTEN:
--      Total top up            = Rp 1.050.000
--      Total potongan absensi  = Rp   440.000  (44 kehadiran x 10.000)
--      Total pengeluaran       = Rp   440.000
--      TOTAL KAS               = Rp   610.000  (= total saldo member)
-- ================================================================

-- Guard agar data dummy tidak terduplikasi jika script dijalankan ulang
insert into public.members (name, phone)
select v.name, v.phone
from (
  values
    ('Budi Santoso',  '081234567001'),
    ('Siti Rahma',    '081234567002'),
    ('Ahmad Fauzi',   '081234567003'),
    ('Dewi Lestari',  '081234567004'),
    ('Rizky Pratama', '081234567005'),
    ('Maya Putri',    '081234567006'),
    ('Agus Wijaya',   '081234567007'),
    ('Intan Permata', '081234567008')
) as v(name, phone)
where not exists (select 1 from public.members);

do $$
declare
  v_budi  uuid; v_siti uuid; v_ahmad uuid; v_dewi  uuid;
  v_rizky uuid; v_maya uuid; v_agus  uuid; v_intan uuid;
begin
  select id into v_budi  from public.members where name = 'Budi Santoso';
  select id into v_siti  from public.members where name = 'Siti Rahma';
  select id into v_ahmad from public.members where name = 'Ahmad Fauzi';
  select id into v_dewi  from public.members where name = 'Dewi Lestari';
  select id into v_rizky from public.members where name = 'Rizky Pratama';
  select id into v_maya  from public.members where name = 'Maya Putri';
  select id into v_agus  from public.members where name = 'Agus Wijaya';
  select id into v_intan from public.members where name = 'Intan Permata';

  -- ---- TOP UP (uang masuk ke kas global) ----
  insert into public.transactions (member_id, type, amount, note, created_at) values
    (v_budi,  'topup', 100000, 'Top up tunai',    now() - interval '41 days'),
    (v_siti,  'topup', 200000, 'Top up transfer', now() - interval '41 days'),
    (v_ahmad, 'topup',  50000, 'Top up tunai',    now() - interval '40 days'),
    (v_dewi,  'topup', 150000, 'Top up transfer', now() - interval '39 days'),
    (v_rizky, 'topup', 100000, 'Top up tunai',    now() - interval '39 days'),
    (v_maya,  'topup', 300000, 'Top up transfer', now() - interval '38 days'),
    (v_agus,  'topup',  50000, 'Top up tunai',    now() - interval '38 days'),
    (v_intan, 'topup', 100000, 'Top up tunai',    now() - interval '37 days');

  -- ---- ABSENSI (setiap baris memotong Rp 10.000 dari saldo member) ----
  insert into public.transactions (member_id, type, amount, note, created_at) values
    -- Sesi 1 (40 hari lalu): 7 orang
    (v_budi,  'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    (v_ahmad, 'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    (v_dewi,  'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    (v_maya,  'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '40 days'),
    -- Sesi 2 (37 hari lalu): 6 orang
    (v_budi,  'attendance', 10000, 'Latihan rutin', now() - interval '37 days'),
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '37 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '37 days'),
    (v_maya,  'attendance', 10000, 'Latihan rutin', now() - interval '37 days'),
    (v_agus,  'attendance', 10000, 'Latihan rutin', now() - interval '37 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '37 days'),
    -- Sesi 3 (33 hari lalu): 5 orang
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '33 days'),
    (v_ahmad, 'attendance', 10000, 'Latihan rutin', now() - interval '33 days'),
    (v_dewi,  'attendance', 10000, 'Latihan rutin', now() - interval '33 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '33 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '33 days'),
    -- Sesi 4 (30 hari lalu): 3 orang
    (v_budi,  'attendance', 10000, 'Latihan rutin', now() - interval '30 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '30 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '30 days'),
    -- Sesi 5 (26 hari lalu): 5 orang
    (v_budi,  'attendance', 10000, 'Latihan rutin', now() - interval '26 days'),
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '26 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '26 days'),
    (v_maya,  'attendance', 10000, 'Latihan rutin', now() - interval '26 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '26 days'),
    -- Sesi 6 (23 hari lalu): 5 orang
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '23 days'),
    (v_dewi,  'attendance', 10000, 'Latihan rutin', now() - interval '23 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '23 days'),
    (v_maya,  'attendance', 10000, 'Latihan rutin', now() - interval '23 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '23 days'),
    -- Sesi 7 (19 hari lalu): 8 orang
    (v_budi,  'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_ahmad, 'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_dewi,  'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_maya,  'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_agus,  'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '19 days'),
    -- Sesi 8 (12 hari lalu): 4 orang
    (v_siti,  'attendance', 10000, 'Latihan rutin', now() - interval '12 days'),
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '12 days'),
    (v_maya,  'attendance', 10000, 'Latihan rutin', now() - interval '12 days'),
    (v_intan, 'attendance', 10000, 'Latihan rutin', now() - interval '12 days'),
    -- Sesi 9 (9 hari lalu): 1 orang
    (v_rizky, 'attendance', 10000, 'Latihan rutin', now() - interval '9 days');

  -- ---- PENGELUARAN (kas global berkurang) ----
  insert into public.expenses (title, category, amount, created_at) values
    ('Sewa lapangan bulanan',        'Sewa Lapangan', 150000, now() - interval '38 days'),
    ('Beli shuttlecock RSL 1 lusin', 'Shuttlecock',   165000, now() - interval '20 days'),
    ('Air mineral & konsumsi',       'Konsumsi',       45000, now() - interval '15 days'),
    ('Perbaikan net + listrik',      'Peralatan',      80000, now() - interval '6 days');

  -- ---- Sinkronkan saldo member dengan riwayat transaksi di atas ----
  -- topup menambah, attendance mengurangi. Hasil akhir:
  --   Budi 50.000 | Siti 130.000 | Ahmad 20.000 | Dewi 110.000
  --   Rizky 10.000 | Maya 240.000 | Agus 30.000 | Intan 20.000
  update public.members m
     set balance = coalesce((
           select sum(case when t.type = 'topup' then t.amount else -t.amount end)
             from public.transactions t
            where t.member_id = m.id
         ), 0);
end $$;
