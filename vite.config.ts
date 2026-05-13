import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// ⚠️  BEFORE DEPLOYING: replace 'YOUR-REPO-NAME' with your actual GitHub repo name
//     e.g. if your repo is github.com/anfisign/booking-prototype → base: '/booking-prototype/'
const GITHUB_REPO_NAME = 'listings-to-website-A'

export default defineConfig({
  base: `/${GITHUB_REPO_NAME}/`,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
