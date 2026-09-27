import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Core Web Vitals: split vendor code so the initial JS payload is smaller
      // and long-term caching works (vendors change less often than app code).
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-react';
            if (/[\\/]node_modules[\\/](framer-motion|motion)[\\/]/.test(id)) return 'vendor-motion';
            if (/[\\/]node_modules[\\/](firebase)[\\/]/.test(id)) return 'vendor-firebase';
            if (/[\\/]node_modules[\\/](socket\.io|engine\.io|xmlhttprequest)[\\/]/.test(id)) return 'vendor-socket';
            if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'vendor-icons';
            if (/[\\/]node_modules[\\/](recharts|d3-)[\\/]/.test(id)) return 'vendor-charts';
            return 'vendor';
          },
        },
      },
      chunkSizeWarningLimit: 900,
    },
  };
});
