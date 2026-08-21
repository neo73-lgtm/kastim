// Skeleton loading — ditampilkan selagi data diambil dari Supabase.

export function StatSkeleton() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 h-9 w-9 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-6 w-28 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

export function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-slate-200" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-3.5 w-16 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

export function BlockSkeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-2xl bg-white/40 ${className}`} />;
}
