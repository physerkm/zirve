import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiTarget = process.env.ZIRVE_API_URL ?? 'http://localhost:5080';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    strictPort: true,
    // API ile aynı kökenden (origin) sunulur: çerezler SameSite=Strict kalabilir, CORS gerekmez.
    proxy: {
      '/api': { target: apiTarget, changeOrigin: false },
      '/health': { target: apiTarget, changeOrigin: false },
    },
  },
  build: {
    target: 'es2022',
    // Monaco editörü ayrı ve tembel yüklenen büyük bir parçadır; uyarı eşiğini buna göre ayarlıyoruz.
    chunkSizeWarningLimit: 5000,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
  },
});
