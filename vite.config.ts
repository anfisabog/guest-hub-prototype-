import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// GitHub repo name — must match exactly
const DEPLOY_BASE = 'guest-hub-prototype-'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${DEPLOY_BASE}/` : '/',
  plugins: [react()],
  server: {
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
