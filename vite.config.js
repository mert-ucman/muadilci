import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'canvg': resolve(__dirname, 'src/stubs/canvg.js'),
      'html2canvas': resolve(__dirname, 'src/stubs/canvg.js'),
      'dompurify': resolve(__dirname, 'src/stubs/canvg.js'),
    },
  },
  optimizeDeps: {
    exclude: ['jspdf', 'jspdf-autotable'],
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
