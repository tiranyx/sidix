import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [tailwindcss()],
    define: {
      // brain_qa backend URL — default localhost:8765
      // Set VITE_BRAIN_QA_URL di .env.local untuk override
      'import.meta.env.VITE_BRAIN_QA_URL': JSON.stringify(
        env.VITE_BRAIN_QA_URL ?? 'http://localhost:8765',
      ),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR disabled di Firebase AI Studio agar tidak flickering saat agent edit
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
