import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Autentikasi admin sederhana: PIN dicocokkan dengan VITE_ADMIN_PIN,
// status login disimpan di localStorage (bukan Supabase Auth).
export const useAuthStore = create(
  persist(
    (set) => ({
      isAdmin: false,
      login: (pin) => {
        const valid = pin === import.meta.env.VITE_ADMIN_PIN;
        if (valid) set({ isAdmin: true });
        return valid;
      },
      logout: () => set({ isAdmin: false }),
    }),
    { name: 'kastim-admin-auth' }
  )
);
