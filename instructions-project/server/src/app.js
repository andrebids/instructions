import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import sequelize, { testConnection } from './config/database.js';
import projectRoutes from './routes/projects.js';
import decorationRoutes from './routes/decorations.js';
import productRoutes from './routes/products.js';
import uploadRoutes from './routes/upload.js';
import editorUploadRoutes from './routes/editor-upload.js';
import { createHocuspocusServer } from './hocuspocus-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3003',
    'http://localhost:3005',
    'http://192.168.2.16:3003',
    'http://192.168.2.16:3005',
    'http://192.168.2.28:3003',
    'http://192.168.2.28:3005',
  ],
  credentials: true
}));
app.use(express.json());

// Configurar mime types para PWA
app.use((req, res, next) => {
  // Servir manifest com mime type correto para PWA
  if (req.path.endsWith('.webmanifest') || req.path.endsWith('/manifest.json')) {
    res.type('application/manifest+json');
  }
  next();
});

app.use(express.static('public'));

// Servir uploads também via /api para funcionar por trás do proxy do Vite
app.use('/api/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Servir também arquivos estáticos do client/public (para imagens da loja)
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var clientPublicPath = path.resolve(__dirname, '../../client/public');
if (fs.existsSync(clientPublicPath)) {
  app.use(express.static(clientPublicPath));
  console.log('📁 Servindo arquivos estáticos do client/public');
}

// Initialize Clerk middleware (only if configured)
const hasClerk = !!process.env.CLERK_SECRET_KEY;
const enableAuth = process.env.ENABLE_AUTH === 'true';
if (hasClerk && enableAuth) {
  app.use(clerkMiddleware());
  // Protect all /api/** routes with Clerk
  app.use('/api', requireAuth());
  console.log('🔐 Clerk auth enabled for /api routes');
} else {
  if (!hasClerk) console.warn('Clerk disabled (missing CLERK_SECRET_KEY). /api routes are unsecured.');
  if (hasClerk && !enableAuth) console.warn('Clerk present but ENABLE_AUTH!=true. Skipping auth protection for /api in dev.');
}

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'OK', 
    env: process.env.NODE_ENV || 'development',
    database: dbConnected ? 'Connected' : 'Disconnected',
  });
});

// API Routes
app.use('/api/projects', projectRoutes);
app.use('/api/decorations', decorationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload', editorUploadRoutes);

// Example protected route to inspect auth context
app.get('/api/me', (req, res) => {
  const auth = getAuth(req);
  res.json({ userId: auth?.userId || null, sessionId: auth?.sessionId || null });
});

// Simple media streaming with Range support (serves client/public videos during dev)
app.get('/api/media/:name', async (req, res) => {
  try {
    var baseName = req.params.name; // without extension or with
    // __filename e __dirname já declarados acima
    const candidateDirs = [
      // Prefer exact TRENDING directory where mp4 files live in this repo
      path.resolve(process.cwd(), '../client/public/SHOP/TRENDING'),
      path.resolve(__dirname, '../../client/public/SHOP/TRENDING'),
      // Fallback to TRENDING/VIDEO if present in other setups
      path.resolve(process.cwd(), '../client/public/SHOP/TRENDING/VIDEO'),
      path.resolve(__dirname, '../../client/public/SHOP/TRENDING/VIDEO'),
    ];
    let baseDir = null;
    for (const d of candidateDirs) {
      try { if (fs.existsSync(d)) { baseDir = d; break; } } catch {}
    }
    const clientPublic = baseDir || candidateDirs[0];
    const tryNames = [
      baseName,
      `${baseName}.mp4`,
      `${baseName}.mov`,
      `${baseName}.webm`,
    ];
    const searchDirs = [
      clientPublic,
      path.join(clientPublic, 'VIDEO'),
      path.join(clientPublic, 'video'),
    ];
    let filePath = null;
    for (const dir of searchDirs) {
      for (const n of tryNames) {
        const p = path.join(dir, n);
        if (fs.existsSync(p)) { filePath = p; break; }
      }
      if (filePath) break;
    }
    if (!filePath) return res.status(404).json({ error: 'Media not found' });

    const stat = fs.statSync(filePath);
    const range = req.headers.range;
    const contentType = filePath.toLowerCase().endsWith('.mp4') ? 'video/mp4'
      : filePath.toLowerCase().endsWith('.webm') ? 'video/webm'
      : filePath.toLowerCase().endsWith('.mov') ? 'video/quicktime'
      : 'application/octet-stream';

    // Ensure CORS headers for media (some browsers enforce on <video>)
    try {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } catch {}

    if (range) {
      // Support forms: bytes=start-end, bytes=start-, bytes=-suffix
      let start = 0;
      let end = stat.size - 1;
      const m = /bytes=([^\-]*)-([^\-]*)?/.exec(range);
      if (m) {
        if (m[1] !== '') start = parseInt(m[1], 10);
        if (m[2] !== undefined && m[2] !== '') end = parseInt(m[2], 10);
        if (m[1] === '' && m[2] !== undefined && m[2] !== '') {
          // suffix range: last N bytes
          const suffix = parseInt(m[2], 10);
          if (!Number.isNaN(suffix)) {
            start = Math.max(0, stat.size - suffix);
            end = stat.size - 1;
          }
        }
      }
      if (Number.isNaN(start) || start < 0) start = 0;
      if (Number.isNaN(end) || end >= stat.size) end = stat.size - 1;
      if (start >= stat.size) {
        res.status(416).set({
          'Content-Range': `bytes */${stat.size}`,
        }).end();
        return;
      }
      const chunksize = (end - start) + 1;
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (e) {
    console.error('media error', e);
    res.status(500).json({ error: 'Media stream error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ [APP] Error handler global:', err);
  console.error('❌ [APP] Stack:', err.stack);
  
  // Verificar se a resposta já foi enviada
  if (!res.headersSent) {
    res.status(500).json({ 
      error: 'Internal server error',
      details: err.message,
      name: err.name
    });
  } else {
    console.error('❌ [APP] Não foi possível enviar resposta de erro - headers já enviados');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Testar conexão com o banco
    await testConnection();
    
    // Carregar modelos primeiro para garantir que estão definidos
    console.log('🔄 Carregando modelos...');
    await import('./models/index.js');
    console.log('✅ Modelos carregados');
    
    // Sincronizar modelos (com alter: false para evitar problemas com ENUMs)
    // Nota: Usar migrations para alterações de schema em produção
    console.log('🔄 Sincronizando modelos...');
    try {
      await sequelize.sync({ alter: false });
      console.log('✅ Modelos sincronizados');
    } catch (syncError) {
      console.warn('⚠️  Aviso durante sincronização:', syncError.message);
      console.log('💡 Continuando mesmo assim (migrations devem ser executadas separadamente)');
    }
    
    // Iniciar servidor Express
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor em http://localhost:${PORT}`);
      console.log(`🌐 Servidor acessível externamente em http://192.168.2.16:${PORT}`);
      console.log(`📊 API disponível em http://localhost:${PORT}/api`);
      console.log(`📊 API externa disponível em http://192.168.2.16:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`💚 Health check externo: http://192.168.2.16:${PORT}/health`);
    });
    
    // Iniciar servidor Hocuspocus para colaboração em tempo real
    try {
      const hocuspocusServer = createHocuspocusServer();
      const hocuspocusPort = process.env.HOCUSPOCUS_PORT || 1234;
      console.log(`🔌 Servidor Hocuspocus iniciado na porta ${hocuspocusPort}`);
      console.log(`📝 WebSocket disponível em ws://localhost:${hocuspocusPort}`);
    } catch (error) {
      console.error('❌ Erro ao iniciar servidor Hocuspocus:', error);
      console.warn('⚠️  Continuando sem Hocuspocus (funcionalidade de notas desabilitada)');
    }
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    console.error('❌ Stack:', error.stack);
    process.exit(1);
  }
}

startServer();


