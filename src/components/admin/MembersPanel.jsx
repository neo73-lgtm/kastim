import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Trash2, Power, Users } from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { formatRupiah, meetingsLeft, avatarColor } from '../../lib/constants';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import { ListSkeleton } from '../ui/Skeleton';

// Manajemen anggota: tambah anggota baru, aktif/nonaktifkan, dan hapus.
export default function MembersPanel() {
  const { members, loading, addMember, setMemberActive, deleteMember } = useDataStore();

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [memberToDelete, setMemberToDelete] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nama anggota wajib diisi');

    setSaving(true);
    try {
      await addMember({ name: form.name.trim(), phone: form.phone.trim() });
      toast.success(`Anggota "${form.name.trim()}" berhasil ditambahkan`);
      setForm({ name: '', phone: '' });
      setAddOpen(false);
    } catch (err) {
      toast.error(err.message || 'Gagal menambah anggota');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (member) => {
    try {
      await setMemberActive(member.id, !member.is_active);
      toast.success(`${member.name} ${member.is_active ? 'dinonaktifkan' : 'diaktifkan'}`);
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMember(memberToDelete.id);
      toast.success(`Anggota "${memberToDelete.name}" dihapus`);
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus anggota');
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Kelola Anggota</h2>
            <p className="mt-0.5 text-xs text-slate-400">{members.length} anggota terdaftar</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setForm({ name: '', phone: '' });
              setAddOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800"
          >
            <Plus size={15} /> Anggota
          </button>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        {loading && !members.length ? (
          <ListSkeleton rows={5} />
        ) : members.length ? (
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatarColor(member.name)}`}
                >
                  {member.name.charAt(0).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${member.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                    {member.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Saldo: {formatRupiah(member.balance)} • Sisa: {meetingsLeft(member.balance)}x
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(member)}
                    title={member.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    className={`rounded-lg p-2 transition ${
                      member.is_active
                        ? 'text-emerald-500 hover:bg-emerald-50'
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Power size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemberToDelete(member)}
                    title="Hapus anggota"
                    className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="Belum ada anggota" subtitle="Tambahkan anggota pertama klub" />
        )}
      </section>

      {/* Modal Tambah Anggota */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Tambah Anggota Baru">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">No. HP (opsional)</label>
            <input
              type="tel"
              inputMode="tel"
              placeholder="Contoh: 081234567890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Simpan Anggota'}
          </button>
        </form>
      </Modal>

      {/* Konfirmasi hapus anggota */}
      <ConfirmDialog
        open={!!memberToDelete}
        onClose={() => setMemberToDelete(null)}
        onConfirm={handleDelete}
        title="Hapus Anggota"
        tone="red"
        confirmLabel="Ya, Hapus"
        message={`Anggota "${memberToDelete?.name}" beserta seluruh riwayat transaksinya akan dihapus permanen. Lanjutkan?`}
      />
    </div>
  );
}
