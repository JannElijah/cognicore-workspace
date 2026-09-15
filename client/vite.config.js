import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'CogniCore',
        short_name: 'CogniCore',
        description: 'Cognitive Training Platform',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 4000000
      }
    })
  ],
  server: {
    port: 5173,
    host: true
  },
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('phaser')) {
              return 'vendor-phaser';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            return 'vendor-core';
          }
        }
      }
    }
  }
});

