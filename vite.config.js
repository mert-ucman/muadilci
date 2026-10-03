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
    modulePreload: {
      resolveDependencies: (_filename, deps) =>
        deps.filter((dep) => !dep.includes('vendor-admin')),
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — daima yüklenir
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/scheduler')) return 'vendor-react';
          // Firebase — tüm @firebase/* sub-paketleri dahil, daima yüklenir
          if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase') || id.includes('node_modules/idb')) return 'vendor-firebase';
          // FontAwesome — Navbar kullanıyor, daima yüklenir
          if (id.includes('node_modules/@fortawesome')) return 'vendor-icons';
          // GSAP — LandingPage hero animasyonları
          if (id.includes('node_modules/gsap')) return 'vendor-gsap';
          // Admin-only ağır kütüphaneler — sadece /admin ziyaretinde yüklenir
          if (
            id.includes('node_modules/xlsx') ||
            id.includes('node_modules/jspdf') ||
            id.includes('node_modules/jspdf-autotable') ||
            id.includes('node_modules/react-easy-crop') ||
            id.includes('node_modules/qrcode')
          ) return 'vendor-admin';
          // Geri kalanlar: Rollup kendi akıllı bölmesini yapsın (catch-all yok)
        },
      },
    },
  },
  server: {
    host: true,
    port: Number(process.env.PORT) || 5173,
    strictPort: false,
  },
});
