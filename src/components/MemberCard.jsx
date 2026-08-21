import { formatRupiah, meetingsLeft, avatarColor } from '../lib/constants';

// Kartu anggota untuk halaman publik:
// menampilkan saldo + konversi ke sisa pertemuan (saldo / 10.000).
export default function MemberCard({ member }) {
  const inDebt = member.balance < 0;
  const left = meetingsLeft(member.balance);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-blue-100">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(member.name)}`}
      >
        {member.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">{member.name}</p>
        <p className="text-xs text-slate-400">{member.phone || 'Tanpa nomor HP'}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className={`text-sm font-bold ${inDebt ? 'text-red-500' : 'text-slate-800'}`}>
          {formatRupiah(member.balance)}
        </p>
        {!member.is_active ? (
          <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
            Nonaktif
          </span>
        ) : inDebt ? (
          <span className="mt-0.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-500">
            Tunggakan
          </span>
        ) : (
          <span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">
            Sisa: {left}x Pertemuan
          </span>
        )}
      </div>
    </div>
  );
}
