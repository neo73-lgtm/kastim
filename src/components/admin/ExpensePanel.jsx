import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Receipt, TrendingDown } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { EXPENSE_CATEGORIES, formatRupiah, formatDateTime } from '../../lib/constants';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';

// Pengeluaran: uang keluar dari kas global (beli shuttlecock, sewa lapangan, dll).
export default function ExpensePanel() {
  const { expenses, summary, addExpense } = useDataStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Lainnya', amount: '' });

  const recentExpenses = expenses.slice(0, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim()) return toast.error('Isi nama pengeluaran');
    if (!amount || amount < 1000) return toast.error('Nominal minimal Rp 1.000');

    setSaving(true);
    try {
      await addExpense({ title: form.title.trim(), category: form.category, amount });
      toast.success(`Pengeluaran ${formatRupiah(amount)} tercatat`);
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan pengeluaran');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Ringkasan pengeluaran bulan ini */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-red-500 to-red-400 p-4 text-white shadow-sm">
        <div>
          <p className="text-xs font-medium text-red-100">Pengeluaran Bulan Ini</p>
          <p className="mt-0.5 text-2xl font-extrabold">{formatRupiah(summary?.expense_this_month)}</p>
        </div>
        <TrendingDown size={34} className="text-red-200" />
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Catat Pengeluaran Kas</h2>
          <button
            type="button"
            onClick={() => {
              setForm({ title: '', category: 'Lainnya', amount: '' });
              setOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus size={15} /> Tambah
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-1 text-sm font-bold text-slate-800">Riwayat Pengeluaran</h2>
        {recentExpenses.length ? (
          <div className="divide-y divide-slate-50">
            {recentExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700">{e.title}</p>
                  <p className="text-xs text-slate-400">
                    {e.category} • {formatDateTime(e.created_at)}
                  </p>
                </div>
                <p className="shrink-0 pl-3 text-sm font-bold text-red-500">-{formatRupiah(e.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Receipt} title="Belum ada pengeluaran" />
        )}
      </section>

      {/* Modal Form Pengeluaran */}
      <Modal open={open} onClose={() => setOpen(false)} title="Tambah Pengeluaran">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Pengeluaran</label>
            <input
              type="text"
              placeholder="Contoh: Beli shuttlecock"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nominal</label>
            <input
              type="number"
              inputMode="numeric"
              min="1000"
              step="1000"
              placeholder="Contoh: 165000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
