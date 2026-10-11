import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api/v1/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/v1/users': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/v1/clinical': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/v1/admin': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/api/v1/lifestyle': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/profile': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/progress': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
      '/api/v1/skin': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/v1/ingredients': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api/v1/products': {
        target: 'http://localhost:8003',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8002',
        changeOrigin: true,
      },
    },
  },
});