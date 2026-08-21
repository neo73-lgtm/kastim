export default function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      {Icon && (
        <div className="mb-3 rounded-2xl bg-slate-100 p-3 text-slate-400">
          <Icon size={26} />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
}
