import { ArrowDownLeft, ArrowUpRight, MinusCircle } from 'lucide-react';
import { formatRupiah, formatDate } from '../lib/constants';
import EmptyState from './ui/EmptyState';
import { ListSkeleton } from './ui/Skeleton';

const KIND_META = {
  topup: {
    icon: ArrowDownLeft,
    iconCls: 'bg-emerald-50 text-emerald-600',
    sign: '+',
    amountCls: 'text-emerald-600',
  },
  attendance: {
    icon: MinusCircle,
    iconCls: 'bg-amber-50 text-amber-600',
    sign: '-',
    amountCls: 'text-amber-600',
  },
  expense: {
    icon: ArrowUpRight,
    iconCls: 'bg-red-50 text-red-500',
    sign: '-',
    amountCls: 'text-red-500',
  },
};

function ActivityItem({ item }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.iconCls}`}>
        <Icon size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-700">{item.title}</p>
        <p className="truncate text-xs text-slate-400">
          {item.subtitle}
          {item.note ? ` • ${item.note}` : ''}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${meta.amountCls}`}>
          {meta.sign}
          {formatRupiah(item.amount)}
        </p>
        <p className="text-[11px] text-slate-400">{formatDate(item.createdAt)}</p>
      </div>
    </div>
  );
}

export default function ActivityList({ items, loading = false, emptyIcon, emptyTitle }) {
  if (loading) return <ListSkeleton rows={4} />;
  if (!items.length) return <EmptyState icon={emptyIcon} title={emptyTitle} subtitle="Belum ada catatan untuk ditampilkan" />;

  return (
    <div className="divide-y divide-slate-50">
      {items.map((item) => (
        <ActivityItem key={`${item.kind}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
