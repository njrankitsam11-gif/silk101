import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
        articles: 'articles.html',
        verify: 'verify.html'
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap';
          }
          if (id.includes('node_modules')) {
            return 'vendor-core';
          }
        }
      }
    }
  }
});
