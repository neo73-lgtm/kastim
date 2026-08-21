import { useMemo } from 'react';
import { Wallet, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { formatRupiah } from '../../lib/constants';
import { buildActivityFeed } from '../../lib/activity';
import StatCard from '../ui/StatCard';
import ActivityList from '../ActivityList';
import { StatSkeleton } from '../ui/Skeleton';
import { ReceiptText } from 'lucide-react';

export default function SummaryPanel() {
  const { summary, transactions, expenses, loading } = useDataStore();

  const recent = useMemo(
    () => buildActivityFeed(transactions, expenses).slice(0, 8),
    [transactions, expenses]
  );

  const isLoading = loading && !summary;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              icon={Wallet}
              label="Total Kas"
              value={formatRupiah(summary?.total_cash)}
              tone="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Total Pemasukan"
              value={formatRupiah(summary?.total_income)}
              tone="green"
            />
            <StatCard
              icon={TrendingDown}
              label="Pengeluaran Bulan Ini"
              value={formatRupiah(summary?.expense_this_month)}
              tone="red"
            />
            <StatCard
              icon={Users}
              label="Saldo Dititipkan Anggota"
              value={formatRupiah(summary?.total_balance_held)}
              tone="amber"
            />
          </>
        )}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-1 text-sm font-bold text-slate-800">Aktivitas Terbaru</h2>
        <ActivityList items={recent} emptyIcon={ReceiptText} emptyTitle="Belum ada aktivitas" />
      </section>
    </div>
  );
}
