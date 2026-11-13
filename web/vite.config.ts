import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // 開發時把 /api 轉給後端，不用另外設定網址或處理 CORS
    proxy: { '/api': 'http://localhost:3000' },
  },
});
