import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    sourcemap: true, // ✅ Habilitar source maps para facilitar debug
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: `assets/[name]-[hash]-v110.js`,
        chunkFileNames: `assets/[name]-[hash]-v110.js`,
        assetFileNames: `assets/[name]-[hash]-v110.[ext]`
      },
    },
  },
  optimizeDeps: {
    force: true
  }
});
