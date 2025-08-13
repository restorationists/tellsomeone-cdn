import fs from 'fs';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist', // Vite builds to ./dist/
    assetsDir: 'assets',
    rollupOptions: {
      input: {

      },
      output: {

      }
    }
  },
  server: {
    watch: {
      usePolling: true,
      interval: 100
    },
    fs: {
      allow: ['.', './static']
    },
    port: 5173
  },
  publicDir: 'dist'
});