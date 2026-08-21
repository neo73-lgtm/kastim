import { create } from 'zustand';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { MEETING_PRICE } from '../lib/constants';

export const useDataStore = create((set, get) => ({
  members: [],
  transactions: [],
  expenses: [],
  summary: null,
  loading: false,

  // Ambil semua data sekaligus (dipanggil saat halaman dibuka)
  fetchAll: async () => {
    set({ loading: true });
    await Promise.all([
      get().fetchMembers(),
      get().fetchTransactions(),
      get().fetchExpenses(),
      get().fetchSummary(),
    ]);
    set({ loading: false });
  },

  fetchMembers: async () => {
    const { data, error } = await supabase.from('members').select('*').order('name');
    if (error) return toast.error(error.message);
    set({ members: data ?? [] });
  },

  fetchTransactions: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, members(name)')
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) return toast.error(error.message);
    set({ transactions: data ?? [] });
  },

  fetchExpenses: async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(80);
    if (error) return toast.error(error.message);
    set({ expenses: data ?? [] });
  },

  fetchSummary: async () => {
    const { data, error } = await supabase.rpc('get_financial_summary');
    if (error) return toast.error(error.message);
    set({ summary: data });
  },

  // ---- AKSI ADMIN ----

  addMember: async ({ name, phone }) => {
    const { error } = await supabase.from('members').insert({ name, phone: phone || null });
    if (error) throw error;
    await get().fetchMembers();
  },

  setMemberActive: async (id, isActive) => {
    const { error } = await supabase.from('members').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
    await get().fetchMembers();
  },

  deleteMember: async (id) => {
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (error) throw error;
    await Promise.all([get().fetchMembers(), get().fetchTransactions(), get().fetchSummary()]);
  },

  // Top up: uang masuk ke kas global + saldo member bertambah (atomik via RPC)
  topUp: async ({ memberId, amount, note }) => {
    const { error } = await supabase.rpc('handle_topup', {
      p_member_id: memberId,
      p_amount: amount,
      p_note: note || null,
    });
    if (error) throw error;
    await Promise.all([get().fetchMembers(), get().fetchTransactions(), get().fetchSummary()]);
  },

  // Absensi: saldo SETIAP anggota yang dipilih dipotong Rp 10.000 (1x pertemuan).
  // Uang fisik TIDAK berpindah — hanya status saldo prepaid yang berubah,
  // karena uangnya sudah masuk ke kas di saat top up.
  submitAttendance: async (memberIds) => {
    const { data, error } = await supabase.rpc('handle_attendance', {
      p_member_ids: memberIds,
      p_price: MEETING_PRICE,
    });
    if (error) throw error;
    await Promise.all([get().fetchMembers(), get().fetchTransactions(), get().fetchSummary()]);
    return data; // { processed: n, price_per_meeting: 10000 }
  },

  // Pengeluaran: mengurangi kas global (uang fisik keluar)
  addExpense: async ({ title, category, amount }) => {
    const { error } = await supabase.rpc('handle_expense', {
      p_title: title,
      p_category: category,
      p_amount: amount,
    });
    if (error) throw error;
    await Promise.all([get().fetchExpenses(), get().fetchSummary()]);
  },
}));
