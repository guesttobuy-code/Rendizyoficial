import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  // Não especificar root - Vite usa o diretório onde está o vite.config.ts por padrão
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
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
        entryFileNames: `assets/[name]-[hash]-v114.js`, // ✅ Versão atualizada para invalidar cache e garantir sidebar atualizada
        chunkFileNames: `assets/[name]-[hash]-v114.js`,
        assetFileNames: `assets/[name]-[hash]-v114.[ext]`
      },
    },
  },
  optimizeDeps: {
    force: true
  }
});
