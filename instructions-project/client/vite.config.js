import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Generate version based on timestamp and git commit (if available)
const generateVersion = () => {
  const timestamp = Date.now();
  // Try to get git commit hash, fallback to timestamp
  try {
    const { execSync } = require('child_process');
    const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
    return `${timestamp}-${gitHash}`;
  } catch {
    return timestamp.toString();
  }
};

const APP_VERSION = generateVersion();

export default defineConfig({
  build: {
    sourcemap: false // Desativar source maps para evitar erros em dev
  },
  define: {
    // Suprimir avisos de source maps do React DevTools
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    '__APP_VERSION__': JSON.stringify(APP_VERSION)
  },
  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      registerType: 'prompt', // Changed from 'autoUpdate' to 'prompt' for manual control
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
        version: APP_VERSION, // Add version to manifest for update detection
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
        rollupFormat: 'iife',
        // O injectionPoint padrão é 'self.__WB_MANIFEST' que será substituído pelo manifest
      },
      devOptions: {
        enabled: false, // Desabilitar Service Worker em desenvolvimento para evitar erros
        // O HMR funciona perfeitamente sem o Service Worker
        // O Service Worker será usado apenas em produção (build)
        type: 'module',
        navigateFallback: 'index.html',
        suppressWarnings: true,
      }
    })
  ],
  server: {
    port: 3003,
    host: true, // Permite acesso externo
    allowedHosts: [
      'test2.dsproject.pt',
      'localhost',
      '.dsproject.pt' // Permite todos os subdomínios de dsproject.pt
    ],
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
      port: 3004, // Porta separada para HMR no servidor
      // Em produção (atrás do Caddy), o WebSocket passa pela porta 443 (HTTPS)
      // O Caddy faz upgrade automático de HTTP para WebSocket
      clientPort: 443, // Quando atrás do Caddy, usar porta 443 (HTTPS)
      protocol: 'wss', // Usar WebSocket seguro quando atrás do Caddy
      overlay: false, // Desativar overlay de erros do HMR (são temporários)
    },
    watch: {
      // Melhorar performance do watch
      usePolling: false,
      interval: 100,
    },
  },
})


