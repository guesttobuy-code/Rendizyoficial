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
    // ✅ Forçar novo hash a cada build para evitar cache
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: `assets/[name]-[hash]-v112.js`, // ✅ Incrementado para forçar novo hash e invalidar cache
        chunkFileNames: `assets/[name]-[hash]-v112.js`,
        assetFileNames: `assets/[name]-[hash]-v112.[ext]`
      },
    },
  },
  optimizeDeps: {
    force: true
  }
});
