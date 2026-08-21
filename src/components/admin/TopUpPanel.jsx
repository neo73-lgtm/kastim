import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiggyBank, Plus, ArrowDownLeft } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { formatRupiah, formatDateTime } from '../../lib/constants';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';

const QUICK_AMOUNTS = [25000, 50000, 100000, 200000];

// Top Up (Pemasukan): menambah saldo tabungan seorang anggota.
// Uang langsung masuk ke kas global (dicatat sebagai transaksi 'topup').
export default function TopUpPanel() {
  const { members, transactions, topUp } = useDataStore();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ memberId: '', amount: '', note: '' });

  const recentTopups = transactions.filter((t) => t.type === 'topup').slice(0, 8);

  const openModal = () => {
    setForm({ memberId: '', amount: '', note: '' });
    setOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.memberId) return toast.error('Pilih anggota terlebih dahulu');
    if (!amount || amount < 1000) return toast.error('Nominal minimal Rp 1.000');

    setSaving(true);
    try {
      await topUp({ memberId: form.memberId, amount, note: form.note });
      const member = members.find((m) => m.id === form.memberId);
      toast.success(`Top up ${formatRupiah(amount)} untuk ${member?.name} berhasil`);
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan top up');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Top Up Saldo Anggota</h2>
            <p className="mt-0.5 text-xs text-slate-400">Catat setor uang iuran / tabungan latihan</p>
          </div>
          <button
            type="button"
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus size={15} /> Top Up
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-bold text-slate-800">
          <ArrowDownLeft size={16} className="text-emerald-500" /> Riwayat Top Up Terbaru
        </h2>
        {recentTopups.length ? (
          <div className="divide-y divide-slate-50">
            {recentTopups.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t.members?.name || 'Anggota'}</p>
                  <p className="text-xs text-slate-400">
                    {formatDateTime(t.created_at)}
                    {t.note ? ` • ${t.note}` : ''}
                  </p>
                </div>
                <p className="text-sm font-bold text-emerald-600">+{formatRupiah(t.amount)}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={PiggyBank} title="Belum ada top up" />
        )}
      </section>

      {/* Modal Form Top Up */}
      <Modal open={open} onClose={() => setOpen(false)} title="Top Up Saldo">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Anggota</label>
            <select
              value={form.memberId}
              onChange={(e) => setForm({ ...form, memberId: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">— Pilih anggota —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Saldo: {formatRupiah(m.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nominal</label>
            <div className="mb-2 grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm({ ...form, amount: String(val) })}
                  className={`rounded-lg py-2 text-[11px] font-bold transition ${
                    Number(form.amount) === val
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {val / 1000}rb
                </button>
              ))}
            </div>
            <input
              type="number"
              inputMode="numeric"
              min="1000"
              step="1000"
              placeholder="Contoh: 100000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Catatan (opsional)</label>
            <input
              type="text"
              placeholder="Contoh: Top up tunai"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Top Up'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
