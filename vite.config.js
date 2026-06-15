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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'vendor-firebase';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) return 'vendor-react';
          if (id.includes('node_modules/gsap')) return 'vendor-gsap';
          if (id.includes('node_modules/xlsx')) return 'vendor-xlsx';
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) return 'vendor-pdf';
          if (id.includes('node_modules/@fortawesome')) return 'vendor-icons';
          if (id.includes('node_modules')) return 'vendor-misc';
        },
      },
    },
  },
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
