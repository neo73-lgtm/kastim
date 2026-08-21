import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Wallet, Users, ShieldCheck, ChevronRight, ReceiptText } from 'lucide-react';
import { useDataStore } from '../store/dataStore';
import { formatRupiah } from '../lib/constants';
import { buildActivityFeed } from '../lib/activity';
import MemberCard from '../components/MemberCard';
import ActivityList from '../components/ActivityList';
import { ListSkeleton } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

// Halaman publik (read-only) untuk anggota:
// total kas klub, daftar saldo anggota, dan riwayat transaksi terbaru.
export default function UserDashboard() {
  const { members, transactions, expenses, summary, loading, fetchAll } = useDataStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const recentActivity = useMemo(
    () => buildActivityFeed(transactions, expenses).slice(0, 12),
    [transactions, expenses]
  );

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div className="min-h-screen pb-14">
      {/* HERO — Total Uang Kas */}
      <header className="rounded-b-[2rem] bg-gradient-to-br from-blue-600 via-blue-600 to-blue-500 px-4 pb-16 pt-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 text-blue-100">
            <ShieldCheck size={18} />
            <span className="text-xs font-semibold uppercase tracking-wider">Kas Klub Badminton</span>
          </div>

          <h1 className="mt-4 text-sm font-medium text-blue-100">Total Uang Kas Saat Ini</h1>
          {loading && !summary ? (
            <div className="mt-2 h-11 w-52 animate-pulse rounded-xl bg-white/20" />
          ) : (
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              {formatRupiah(summary?.total_cash)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 backdrop-blur">
              <Users size={15} />
              <span className="text-xs font-semibold">{summary?.active_members ?? 0} Anggota Aktif</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 backdrop-blur">
              <Wallet size={15} />
              <span className="text-xs font-semibold">
                Saldo Anggota: {formatRupiah(summary?.total_balance_held)}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-3xl space-y-5 px-4">
        {/* DAFTAR ANGGOTA */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Saldo Anggota</h2>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
              {members.length} orang
            </span>
          </div>

          <div className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama anggota..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {loading && !members.length ? (
            <ListSkeleton rows={5} />
          ) : filteredMembers.length ? (
            <div className="space-y-2.5">
              {filteredMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="Anggota tidak ditemukan" subtitle="Coba kata kunci lain" />
          )}
        </section>

        {/* AKTIVITAS TERBARU */}
        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Transaksi Terbaru</h2>
            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <ReceiptText size={13} /> Pemasukan & Pengeluaran
            </span>
          </div>
          <ActivityList
            items={recentActivity}
            loading={loading && !transactions.length}
            emptyIcon={ReceiptText}
            emptyTitle="Belum ada transaksi"
          />
        </section>
      </main>

      <footer className="mt-8 text-center">
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-blue-600"
        >
          Login Bendahara <ChevronRight size={14} />
        </Link>
      </footer>
    </div>
  );
}
