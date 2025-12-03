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
    sourcemap: false, // Desativar source maps para evitar erros em dev
    rollupOptions: {
      output: {
        manualChunks: {
          // Otimizar chunking para carregamento mais rápido
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@heroui/react', '@iconify/react'],
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
    // Otimizações de performance
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true,
      },
    },
  },
  define: {
    // Suprimir avisos de source maps do React DevTools
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    '__APP_VERSION__': JSON.stringify(APP_VERSION)
  },
  optimizeDeps: {
    // Pre-bundle dependencies para carregamento mais rápido
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@heroui/react',
      '@iconify/react',
    ],
    exclude: ['@react-three/fiber', '@react-three/drei', 'three'],
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler']
        ],
      },
      // Configuração do plugin React para suprimir avisos de source maps
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
    // Plugin customizado para interceptar source maps inexistentes
    // Isso previne erros do React DevTools ao tentar carregar installHook.js.map
    {
      name: 'suppress-source-map-errors',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Interceptar requisições de source maps (.map) que podem não existir
          if (req.url.endsWith('.map')) {
            // Para source maps que não existem (como installHook.js.map do React DevTools),
            // retornar um source map vazio válido em vez de erro 404
            // Isso previne erros de JSON.parse no navegador
            // O Vite tentará servir o arquivo primeiro via next(), então só retornamos
            // um source map vazio se o arquivo realmente não existir

            // Armazenar a função original do end para interceptar 404s
            const originalEnd = res.end.bind(res);
            let responseEnded = false;

            res.end = function (chunk, encoding) {
              // Se for um 404 e ainda não tivermos respondido
              if (res.statusCode === 404 && !responseEnded && req.url.endsWith('.map')) {
                responseEnded = true;
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return originalEnd(JSON.stringify({ version: 3, sources: [], mappings: '' }));
              }
              return originalEnd(chunk, encoding);
            };

            next();
            return;
          }
          next();
        });
      },
    },
    VitePWA({
      strategies: 'injectManifest',
      registerType: 'prompt', // Changed from 'autoUpdate' to 'prompt' for manual control
      injectRegister: null, // Manual registration via virtual:pwa-register (registerSW)
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
        // rollupFormat removido - usar padrão do VitePWA (ES modules)
        // O injectionPoint padrão é 'self.__WB_MANIFEST' que será substituído pelo manifest
        // Novas opções do injectManifest (v0.18.0+)
        minify: false, // Desabilitar minificação temporariamente para debug (habilitar após resolver erro)
        sourcemap: false, // Source maps desabilitados por padrão (usar workbox.sourcemap para habilitar)
        enableWorkboxModulesLogs: true // Habilitar logs detalhados do Workbox para debug
      },
      workbox: {
        // Cleanup outdated caches - remove assets antigos quando nova versão é publicada
        // Já é padrão para generateSW, mas documentamos explicitamente aqui
        // Para injectManifest, o cleanup é feito manualmente no sw.js via cleanupOutdatedCaches()
        cleanupOutdatedCaches: true,
        // Gerar source maps do service worker
        // Se configurado, sobrescreve a opção injectManifest.sourcemap
        sourcemap: false // Desabilitado por padrão (habilitar apenas para debug)
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
      '.dsproject.pt', // Permite todos os subdomínios de dsproject.pt
      'thecore.blachere-illumination.ai'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 30000, // 30 segundos para evitar timeouts em arquivos grandes
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 60000, // 60 segundos para uploads/imagens (podem ser grandes ou em SMB lento)
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        timeout: 5000, // 5 segundos para health check (deve ser rápido)
      },
    },
    hmr: process.env.NODE_ENV === 'development' ? {
      // Em desenvolvimento local, usar configuração simplificada
      port: 3003, // Usar a mesma porta do servidor
      protocol: 'ws', // WebSocket não seguro em desenvolvimento
      overlay: false, // Desativar overlay de erros do HMR
      // Não definir clientPort - deixar o Vite escolher automaticamente
    } : {
      // Em produção (atrás do Caddy), usar configuração para HTTPS
      port: 3004, // Porta separada para HMR no servidor
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


