const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-red-50 text-red-500',
  amber: 'bg-amber-50 text-amber-600',
};

export default function StatCard({ icon: Icon, label, value, tone = 'blue', loading = false }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      {Icon && (
        <div className={`mb-3 inline-flex rounded-xl p-2 ${TONES[tone]}`}>
          <Icon size={20} />
        </div>
      )}
      <p className="text-xs font-medium text-slate-400">{label}</p>
      {loading ? (
        <div className="mt-1.5 h-6 w-24 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-0.5 truncate text-lg font-bold text-slate-800">{value}</p>
      )}
    </div>
  );
}
