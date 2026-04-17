import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: ['encanador-conecta.onrender.com'],
    proxy: {
      '/api': 'http://localhost:5174'
    }
  }
});
