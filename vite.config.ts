import fs from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const adminFallbackPlugin = () => ({
  name: 'generate-admin-fallback',
  closeBundle() {
    try {
      const distDir = path.resolve(process.cwd(), 'dist');
      const indexHtml = path.join(distDir, 'index.html');
      const adminDir = path.join(distDir, 'admin');
      if (fs.existsSync(indexHtml)) {
        if (!fs.existsSync(adminDir)) {
          fs.mkdirSync(adminDir, { recursive: true });
        }
        fs.copyFileSync(indexHtml, path.join(adminDir, 'index.html'));
      }
    } catch (e) {
      console.warn('Could not copy admin fallback:', e);
    }
  },
});

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), adminFallbackPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
