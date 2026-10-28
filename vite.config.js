import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the browser talks to /api on the Vite port and Vite forwards it to the Node server.
export default defineConfig({
  plugins: [react()],
  server: {
    // changeOrigin stays false so the server sees the same Host as the browser (the admin same-site check needs it).
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: false } },
    // Keep saved applications out of reach of the dev server.
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/data/**', '**/reveal-out/**'] },
  },
});
