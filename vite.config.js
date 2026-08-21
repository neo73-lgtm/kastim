import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin react wajib: mengaktifkan automatic JSX runtime + Fast Refresh.
// Tanpa ini, JSX dikompilasi ke React.createElement klasik dan aplikasi
// crash dengan "React is not defined" (halaman blank).
export default defineConfig({
  plugins: [react()],
});
