import { defineConfig } from 'vite';

export default defineConfig({
  // Point Vite at the viewer entry HTML
  root: '.',

  server: {
    port: 5173,
    open: true,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  // Ensure public/data/ is served statically
  publicDir: 'public',
});
