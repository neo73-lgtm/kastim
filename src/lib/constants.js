// Harga 1x pertemuan badminton — dipakai untuk memotong saldo anggota saat absensi.
export const MEETING_PRICE = 10000;

export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

// Sisa pertemuan = saldo dibagi harga 1 pertemuan (dibulatkan ke bawah).
// Contoh: saldo Rp 50.000 -> sisa 5x pertemuan.
export const meetingsLeft = (balance) =>
  Math.floor((Number(balance) || 0) / MEETING_PRICE);

export const EXPENSE_CATEGORIES = [
  'Shuttlecock',
  'Sewa Lapangan',
  'Konsumsi',
  'Peralatan',
  'Lainnya',
];

const AVATAR_COLORS = ['bg-blue-500', 'bg-sky-500', 'bg-indigo-500', 'bg-cyan-600', 'bg-violet-500'];

export const avatarColor = (name = '') => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};
