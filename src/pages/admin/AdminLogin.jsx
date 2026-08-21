import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Delete, Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '';
const PIN_LENGTH = ADMIN_PIN.length || 6;

// Halaman login admin: PIN pad numerik.
// PIN dicocokkan dengan env VITE_ADMIN_PIN (bukan Supabase Auth).
export default function AdminLogin() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const submit = (value) => {
    if (login(value)) {
      toast.success('Selamat datang, Bendahara!');
      navigate('/admin', { replace: true });
    } else {
      setShake(true);
      toast.error('PIN salah, coba lagi');
      setTimeout(() => {
        setPin('');
        setShake(false);
      }, 450);
    }
  };

  // Verifikasi otomatis saat jumlah digit tercapai
  useEffect(() => {
    if (ADMIN_PIN && pin.length === PIN_LENGTH) submit(pin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  // Dukungan keyboard fisik
  useEffect(() => {
    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) setPin((p) => (p.length < PIN_LENGTH ? p + e.key : p));
      else if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const press = (digit) => setPin((p) => (p.length < PIN_LENGTH ? p + digit : p));

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-xs">
        {/* Ikon & judul */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <Lock size={28} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Panel Bendahara</h1>
          <p className="mt-1 text-sm text-slate-400">Masukkan PIN admin untuk melanjutkan</p>
        </div>

        {!ADMIN_PIN && (
          <div className="mb-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-700 ring-1 ring-amber-100">
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
            <span>
              <b>VITE_ADMIN_PIN</b> belum diatur di file .env. Atur dulu sebelum login.
            </span>
          </div>
        )}

        {/* Indikator PIN */}
        <div className={`mb-8 flex justify-center gap-3 ${shake ? 'animate-shake' : ''}`}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`h-3.5 w-3.5 rounded-full transition-colors duration-150 ${
                i < pin.length ? 'bg-blue-600' : 'border-2 border-slate-300 bg-white'
              }`}
            />
          ))}
        </div>

        {/* PIN Pad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={!ADMIN_PIN}
              onClick={() => press(digit)}
              className="h-14 rounded-2xl bg-white text-xl font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:scale-95 active:bg-blue-50 active:text-blue-600 disabled:opacity-40"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            disabled={!ADMIN_PIN}
            onClick={() => setPin('')}
            className="h-14 rounded-2xl text-sm font-bold text-slate-400 transition active:scale-95 disabled:opacity-40"
          >
            C
          </button>
          <button
            type="button"
            disabled={!ADMIN_PIN}
            onClick={() => press('0')}
            className="h-14 rounded-2xl bg-white text-xl font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition active:scale-95 active:bg-blue-50 active:text-blue-600 disabled:opacity-40"
          >
            0
          </button>
          <button
            type="button"
            disabled={!ADMIN_PIN}
            onClick={() => setPin((p) => p.slice(0, -1))}
            className="flex h-14 items-center justify-center rounded-2xl text-slate-500 transition active:scale-95 disabled:opacity-40"
          >
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
