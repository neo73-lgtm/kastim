// Menggabungkan transactions (topup & absensi) + expenses menjadi satu
// feed aktivitas terurut dari yang terbaru.
export function buildActivityFeed(transactions = [], expenses = []) {
  const memberActivities = transactions.map((t) => ({
    id: t.id,
    kind: t.type, // 'topup' | 'attendance'
    title: t.type === 'topup' ? 'Top Up Saldo' : 'Absensi Latihan',
    subtitle: t.members?.name || 'Anggota',
    note: t.note,
    amount: t.amount,
    createdAt: t.created_at,
  }));

  const expenseActivities = expenses.map((e) => ({
    id: e.id,
    kind: 'expense',
    title: e.title,
    subtitle: e.category,
    note: null,
    amount: e.amount,
    createdAt: e.created_at,
  }));

  return [...memberActivities, ...expenseActivities].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}
