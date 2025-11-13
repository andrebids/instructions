import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    sourcemap: false // Desativar source maps para evitar erros em dev
  },
  define: {
    // Suprimir avisos de source maps do React DevTools
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      registerType: 'autoUpdate',
      srcDir: 'public',
      filename: 'sw.js',
      includeAssets: ['favicon.ico', 'logo.webp', 'icons/*.png'],
      manifest: {
        name: 'TheCore',
        short_name: 'TheCore',
        description: 'Experiência web do TheCore com configurações interativas.',
        theme_color: '#0a0a0a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,webm}'],
        globIgnores: [
          '**/demo-images/**/*.png', // Excluir imagens demo grandes do precache
          '**/SHOP/TRENDING/VIDEO/*.webm', // Excluir vídeos grandes do precache
          '**/snooooow.webm', // Excluir vídeo muito grande
          '**/simuvideo.webp' // Excluir vídeo grande
        ],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB para permitir ficheiros maiores
        rollupFormat: 'iife'
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true
      }
    })
  ],
  server: {
    port: 3003,
    host: true, // Permite acesso externo
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    hmr: {
      port: 3004, // Porta separada para HMR
      overlay: false, // Desativar overlay de erros do HMR (são temporários)
    },
    watch: {
      // Melhorar performance do watch
      usePolling: false,
      interval: 100,
    },
  },
})


