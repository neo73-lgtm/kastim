import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarCheck2, Check, Info, TriangleAlert } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { MEETING_PRICE, formatRupiah, meetingsLeft, avatarColor } from '../../lib/constants';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { ListSkeleton } from '../ui/Skeleton';

// Absensi latihan: bendahara memilih anggota yang hadir hari ini.
// Saat disimpan, saldo SETIAP anggota terpilih otomatis dipotong
// Rp 10.000 (harga 1x pertemuan) via RPC handle_attendance.
export default function AttendancePanel() {
  const { members, loading, submitAttendance } = useDataStore();
  const [selected, setSelected] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeMembers = useMemo(() => members.filter((m) => m.is_active), [members]);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const totalCut = selected.length * MEETING_PRICE;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // RPC ini yang melakukan potongan saldo di database (atomik)
      const result = await submitAttendance(selected);
      toast.success(`Absensi tersimpan — saldo ${result.processed} anggota dipotong`);
      setSelected([]);
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan absensi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pb-28">
      {/* Penjelasan logika potongan */}
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-blue-50 p-3.5 ring-1 ring-blue-100">
        <Info size={17} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-xs leading-relaxed text-blue-700">
          Pilih anggota yang hadir latihan hari ini. Setiap anggota terpilih akan{' '}
          <b>dipotong Rp 10.000</b> dari saldo tabungannya (1x pertemuan).
        </p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Daftar Hadir Hari Ini</h2>
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
            {selected.length}/{activeMembers.length} dipilih
          </span>
        </div>

        {loading && !members.length ? (
          <ListSkeleton rows={5} />
        ) : activeMembers.length ? (
          <div className="space-y-2">
            {activeMembers.map((member) => {
              const isSelected = selected.includes(member.id);
              const lowBalance = member.balance < MEETING_PRICE;
              return (
                <label
                  key={member.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition select-none ${
                    isSelected
                      ? 'border-blue-300 bg-blue-50/60'
                      : 'border-slate-100 hover:border-blue-100'
                  }`}
                >
                  {/* Checkbox custom */}
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check size={15} className="text-white" strokeWidth={3} />}
                  </span>

                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => toggle(member.id)}
                  />

                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(member.name)}`}
                  >
                    {member.name.charAt(0).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {member.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      Saldo: {formatRupiah(member.balance)} • Sisa: {meetingsLeft(member.balance)}x
                    </span>
                  </span>

                  {lowBalance && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600">
                      <TriangleAlert size={11} /> Saldo kurang
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={CalendarCheck2} title="Belum ada anggota aktif" />
        )}
      </section>

      {/* Bar aksi bawah — selalu terlihat di mobile */}
      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400">
              {selected.length} anggota dipilih
            </p>
            <p className="truncate text-sm font-bold text-slate-800">
              Potongan: {formatRupiah(totalCut)}
            </p>
          </div>
          <button
            type="button"
            disabled={!selected.length || submitting}
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <CalendarCheck2 size={16} />
            Simpan Absensi
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleSubmit}
        title="Konfirmasi Absensi"
        message={`${selected.length} anggota akan dicatat hadir dan masing-masing dipotong ${formatRupiah(
          MEETING_PRICE
        )}. Total potongan ${formatRupiah(totalCut)}. Lanjutkan?`}
        confirmLabel={submitting ? 'Menyimpan...' : 'Ya, Simpan'}
      />
    </div>
  );
}
