import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Trophy,
  LogOut,
  LayoutDashboard,
  CalendarCheck2,
  PiggyBank,
  Receipt,
  Users,
} from 'lucide-react';
import { useDataStore } from '../../store/dataStore';
import { useAuthStore } from '../../store/authStore';
import SummaryPanel from '../../components/admin/SummaryPanel';
import AttendancePanel from '../../components/admin/AttendancePanel';
import TopUpPanel from '../../components/admin/TopUpPanel';
import ExpensePanel from '../../components/admin/ExpensePanel';
import MembersPanel from '../../components/admin/MembersPanel';

const TABS = [
  { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
  { id: 'absensi', label: 'Absensi', icon: CalendarCheck2 },
  { id: 'topup', label: 'Top Up', icon: PiggyBank },
  { id: 'pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { id: 'anggota', label: 'Anggota', icon: Users },
];

export default function AdminDashboard() {
  const fetchAll = useDataStore((s) => s.fetchAll);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [tab, setTab] = useState('ringkasan');

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar');
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header + navigasi tab */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-blue-600 p-2 text-white shadow-sm shadow-blue-200">
              <Trophy size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800">Panel Bendahara</h1>
              <p className="text-[11px] text-slate-400">Kas Klub Badminton</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>

        <nav className="mx-auto max-w-3xl overflow-x-auto scrollbar-hide px-4">
          <div className="flex gap-1.5 pb-2.5">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                  tab === t.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <t.icon size={14} />
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5">
        {tab === 'ringkasan' && <SummaryPanel />}
        {tab === 'absensi' && <AttendancePanel />}
        {tab === 'topup' && <TopUpPanel />}
        {tab === 'pengeluaran' && <ExpensePanel />}
        {tab === 'anggota' && <MembersPanel />}
      </main>
    </div>
  );
}
