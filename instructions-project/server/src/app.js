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
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.route.js';
import { createHocuspocusServer } from './hocuspocus-server.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './middleware/auth.js';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "blob:", "data:"], // Permitir blob e data para Service Worker
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para scripts inline do Vite
        "'unsafe-eval'", // Necessário para alguns scripts do Vite em dev
        "https://cdn.tailwindcss.com", // Tailwind CSS CDN
        "https://cdnjs.cloudflare.com", // Cloudflare CDN (GSAP, etc)
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Necessário para estilos inline
        "https://fonts.googleapis.com", // Google Fonts
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Google Fonts
        "data:", // Fontes em base64
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:", // Permitir imagens de qualquer origem HTTPS
      ],
      connectSrc: [
        "'self'",
        "https://api.iconify.design", // Iconify API
        "https://api.simplesvg.com", // SimpleSVG API
        "https://api.unisvg.com", // UniSVG API
      ],
      frameSrc: [
        "'self'",
      ],
      workerSrc: [
        "'self'",
        "blob:", // Service Worker
      ],
      scriptSrcAttr: ["'unsafe-inline'"], // Permitir atributos inline em scripts
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Desabilitar para permitir recursos externos
}));
app.use(cors({
  origin: [
    'http://localhost:3003',
    'http://localhost:3005',
    'http://192.168.2.16:3003',
    'http://192.168.2.16:3005',
    'http://192.168.2.28:3003',
    'http://192.168.2.28:3005',
    'http://192.168.2.108:3003',
    'http://192.168.2.108:3005',
    'https://thecore.dsproject.pt',
    'http://thecore.dsproject.pt',
    'https://test2.dsproject.pt',
    'http://test2.dsproject.pt',
    'https://thecore.blachere-illumination.ai',
    'http://thecore.blachere-illumination.ai',
  ],
  credentials: true
}));
// Aumentar limite de body parser para suportar uploads maiores
// Nota: Para multipart/form-data (uploads), o multer gerencia os limites
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// Configurar mime types para PWA
app.use((req, res, next) => {
  // Servir manifest com mime type correto para PWA
  if (req.path.endsWith('.webmanifest') || req.path.endsWith('/manifest.json')) {
    res.type('application/manifest+json');
  }
  // Garantir que Service Worker seja servido com tipo MIME correto
  if (req.path === '/sw.js' || req.path.endsWith('/sw.js')) {
    res.type('application/javascript');
  }
  next();
});

// Servir uploads também via /api para funcionar por trás do proxy do Vite
app.use('/api/uploads', express.static(path.resolve(process.cwd(), 'public/uploads')));

// Servir também arquivos estáticos do client/public (para imagens da loja)
// MAS: Não servir sw.js de public/ - ele deve vir de dist/ após processamento pelo VitePWA
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var clientPublicPath = path.resolve(__dirname, '../../client/public');
if (fs.existsSync(clientPublicPath)) {
  // Middleware customizado para servir public mas excluir sw.js
  app.use((req, res, next) => {
    // Se for sw.js, não servir de public - deixar o dist/ servir
    if (req.path === '/sw.js' || req.path.endsWith('/sw.js')) {
      return next(); // Pular este middleware, deixar dist/ servir
    }
    // Para outros arquivos, servir de public normalmente
    express.static(clientPublicPath)(req, res, next);
  });
  console.log('📁 Servindo arquivos estáticos do client/public (exceto sw.js)');
}

// Servir arquivos estáticos do public do servidor (apenas para uploads e outros assets do servidor)
// NOTA: O Service Worker (sw.js) deve vir de dist/, não de public/
// O public/sw.js é apenas o source - o VitePWA processa e coloca em dist/sw.js
// Excluir sw.js de public para garantir que dist/ sirva o arquivo processado
app.use((req, res, next) => {
  // Se for sw.js, não servir de public - deixar o dist/ servir
  if (req.path === '/sw.js' || req.path.endsWith('/sw.js')) {
    return next(); // Pular este middleware, deixar dist/ servir
  }
  // Para outros arquivos, servir de public normalmente
  express.static('public')(req, res, next);
});

// Frontend é servido via build estático (client/dist) quando disponível, ou via Vite dev server em desenvolvimento

// Configurar autenticação usando Auth.js
const useAuthJs = process.env.USE_AUTH_JS === 'true';
const enableAuth = process.env.ENABLE_AUTH === 'true';

// Configurar Auth.js
if (useAuthJs) {
  // Trust proxy para Auth.js funcionar corretamente
  app.set('trust proxy', true);
  
  // Montar rotas do Auth.js em /auth/*
  app.use('/auth', authRoutes);
  console.log('✅ Auth.js configurado em /auth/*');
}

// Proxy para APIs de ícones do Iconify (resolve problemas CORS)
// IMPORTANTE: Esta rota deve estar ANTES do middleware de autenticação
// pois os ícones são necessários para renderizar a UI antes da autenticação
// Suporta múltiplos providers: iconify, simplesvg, unisvg
app.get('/api/icons/*', async (req, res) => {
  try {
    // Capturar o path completo após /api/icons/
    const iconPath = req.params[0] || '';
    // Preservar query string se existir
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    
    // Detectar qual provider está sendo usado baseado no path ou query string
    // O Iconify pode usar diferentes APIs: iconify.design, simplesvg.com, unisvg.com
    // Por padrão, usamos api.iconify.design, mas podemos detectar outros providers
    // se necessário no futuro
    let baseUrl = 'https://api.iconify.design';
    
    // Se o path contém indicação de outro provider, ajustar baseUrl
    // (Por enquanto, todos os providers do Iconify usam api.iconify.design)
    // Mas mantemos a estrutura para facilitar futuras expansões
    const iconUrl = `${baseUrl}/${iconPath}${queryString}`;
    
    console.log('🔍 [Icon Proxy] Requisição recebida:', req.path);
    console.log('🔍 [Icon Proxy] Fazendo proxy para:', iconUrl);
    console.log('🔍 [Icon Proxy] Path completo:', req.path);
    console.log('🔍 [Icon Proxy] Query string:', queryString);
    console.log('🔍 [Icon Proxy] Headers:', JSON.stringify(req.headers, null, 2));
    
    // Fazer requisição para o CDN do Iconify com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    let response;
    try {
      response = await fetch(iconUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TheCore-Server/1.0'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('❌ [Icon Proxy] Timeout ao buscar ícone:', iconUrl);
        return res.status(504).json({ error: 'Request timeout', url: iconUrl });
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      console.warn(`⚠️  [Icon Proxy] CDN retornou status ${response.status} para: ${iconUrl}`);
      console.warn(`⚠️  [Icon Proxy] Response status text: ${response.statusText}`);
      
      // Retornar erro com informações úteis para debug
      return res.status(response.status).json({ 
        error: 'Failed to fetch icon',
        status: response.status,
        statusText: response.statusText,
        url: iconUrl
      });
    }
    
    const data = await response.json();
    
    // Retornar com headers CORS corretos
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
    res.setHeader('Content-Type', 'application/json');
    
    console.debug('✅ [Icon Proxy] Proxy bem-sucedido para:', iconPath);
    res.json(data);
  } catch (error) {
    console.error('❌ [Icon Proxy] Erro ao fazer proxy de ícone:', error.message);
    console.error('❌ [Icon Proxy] Stack:', error.stack);
    console.error('❌ [Icon Proxy] URL original:', req.url);
    
    // Retornar erro detalhado para debug
    res.status(500).json({ 
      error: 'Failed to proxy icon request',
      message: error.message,
      url: req.url
    });
  }
});

// OPTIONS para CORS preflight
app.options('/api/icons/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204);
});

// Proteger rotas se o auth estiver explicitamente habilitado
if (useAuthJs && enableAuth) {
  app.use('/api', requireAuth());
  console.log('🔐 Auth.js habilitado para rotas /api (exceto /api/icons/*)');
} else if (useAuthJs) {
  console.warn('⚠️  Auth.js presente mas ENABLE_AUTH!=true. Rotas /api não protegidas em desenvolvimento.');
} else {
  console.warn('⚠️  Auth.js desabilitado (USE_AUTH_JS != true). Rotas /api não protegidas.');
}

// Rota raiz - informações do servidor (apenas quando não há build de produção)
// Quando há dist/, o catch-all serve index.html para /
var distPathCheck = path.resolve(__dirname, '../../client/dist');
var distExistsCheck = fs.existsSync(distPathCheck) && fs.statSync(distPathCheck).isDirectory();

if (!distExistsCheck) {
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Instructions Project API Server',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api',
        projects: '/api/projects',
        products: '/api/products',
        decorations: '/api/decorations'
      },
      access: {
        local: `http://localhost:${process.env.PORT || 5000}`,
        network: `http://192.168.2.16:${process.env.PORT || 5000}`
      }
    });
  });
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
app.use('/api/users', userRoutes);

// Rota de teste de email (requer autenticação admin)
app.post('/api/email/test', requireAuth(), async (req, res) => {
  try {
    const { getAuth } = await import('./middleware/auth.js');
    const auth = await getAuth(req);
    
    // Verificar se é admin
    if (auth?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem testar emails.' });
    }
    
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    // Importar serviço de email
    const { sendNotificationEmail } = await import('./services/emailService.js');
    const { verifyEmailConfig } = await import('./config/email.js');
    
    // Verificar configuração primeiro
    const configValid = await verifyEmailConfig();
    if (!configValid) {
      return res.status(500).json({ 
        error: 'Configuração de email inválida',
        message: 'Verifique as variáveis de ambiente de email'
      });
    }
    
    // Enviar email de teste
    const result = await sendNotificationEmail(
      email,
      'Teste de Email - TheCore',
      'Este é um email de teste do sistema TheCore.\n\nSe você recebeu este email, a configuração de email está funcionando corretamente.'
    );
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Email de teste enviado com sucesso',
        messageId: result.messageId,
        previewUrl: result.previewUrl
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Falha ao enviar email de teste',
        message: result.message
      });
    }
  } catch (error) {
    console.error('Erro ao testar email:', error);
    res.status(500).json({
      error: 'Erro ao testar email',
      message: error.message
    });
  }
});

// Example protected route to inspect auth context
app.get('/api/me', async (req, res) => {
  // Usar middleware dual que suporta ambos os sistemas
  const { getAuth } = await import('./middleware/auth.js');
  const auth = await getAuth(req);
  res.json({ 
    userId: auth?.userId || null, 
    sessionId: auth?.sessionId || null,
    role: auth?.role || null,
    source: auth?.source || 'none'
  });
});

// CRÍTICO: Servir sw.js de dist/ ANTES de qualquer outro middleware estático
// Isso garante que o arquivo processado pelo VitePWA seja servido, não o source de public/
// (__filename e __dirname já declarados acima)
var distPath = path.resolve(__dirname, '../../client/dist');
var distExists = fs.existsSync(distPath) && fs.statSync(distPath).isDirectory();

if (distExists) {
  // Servir sw.js especificamente de dist/ com prioridade máxima
  app.use('/sw.js', (req, res, next) => {
    const swPath = path.join(distPath, 'sw.js');
    if (fs.existsSync(swPath)) {
      // Cache-Control restritivo para sw.js
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Content-Type', 'application/javascript');
      console.log('✅ [APP] Servindo sw.js de dist/ (processado pelo VitePWA)');
      res.sendFile(swPath);
    } else {
      console.warn('⚠️ [APP] sw.js não encontrado em dist/, servindo 404');
      res.status(404).send('Service Worker not found');
    }
  });
}

// Servir arquivos estáticos do build de produção (client/dist) se existir
if (distExists) {
  console.log('📦 [APP] Build de produção detectado - servindo arquivos estáticos de client/dist');
  
  // Middleware para Cache-Control restritivo em arquivos críticos do PWA
  // Conforme documentação Vite PWA: /, /sw.js, /index.html, /manifest.webmanifest
  // devem ter cache muito restritivo (sem immutable)
  app.use((req, res, next) => {
    const reqPath = req.path.toLowerCase();
    // Arquivos críticos do PWA: sem cache ou cache muito curto
    if (reqPath === '/' || 
        reqPath === '/sw.js' || 
        reqPath === '/index.html' || 
        reqPath.endsWith('/manifest.webmanifest') ||
        reqPath.endsWith('/manifest.json')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (reqPath.match(/\.(js|css)$/) && reqPath.match(/[a-f0-9]{8,}/)) {
      // Arquivos com hash no nome (ex: index-abc123.js) podem ter cache longo
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (reqPath.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)) {
      // Outros assets estáticos: cache longo mas não immutable
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    next();
  });
  
  // Servir arquivos estáticos do dist (sw.js já foi servido acima, então não será servido aqui)
  // IMPORTANTE: Usar fallthrough: false para não servir index.html automaticamente
  // e adicionar verificação customizada para ignorar rotas /auth/ e /api/
  app.use((req, res, next) => {
    // Se for rota de API ou Auth, passar para o próximo middleware (não servir arquivo estático)
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      return next();
    }
    // Para outras rotas, usar express.static
    express.static(distPath, {
      maxAge: '1y', // Cache agressivo para assets estáticos (será sobrescrito pelo middleware acima para arquivos críticos)
      etag: true,
      lastModified: true,
      fallthrough: false // Não servir index.html automaticamente se arquivo não for encontrado
    })(req, res, (err) => {
      // Se express.static não encontrou o arquivo, passar para o próximo middleware
      if (err) {
        return next();
      }
      // Se encontrou e serviu, não fazer nada (já foi servido)
    });
  });
  
  // Rota catch-all para SPA routing (deve vir depois de todas as rotas de API)
  // Retorna index.html para qualquer rota que não seja API e não seja um arquivo estático
  app.get('*', (req, res, next) => {
    // Ignorar rotas de API e Auth.js
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      return next();
    }
    
    // Se for um arquivo estático (com extensão), deixar o express.static lidar
    // Se não tiver extensão ou for uma rota SPA, servir index.html
    const hasExtension = /\.\w+$/.test(req.path);
    if (!hasExtension) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        // Aplicar Cache-Control restritivo para index.html
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
        return;
      }
    }
    
    // Se chegou aqui, deixar o 404 handler lidar
    next();
  });
} else {
  console.log('ℹ️  [APP] Build de produção não encontrado - servindo apenas API');
  console.log('   Para servir frontend em produção, execute: cd client && npm run build');
}

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

// Frontend é servido via build estático (client/dist) quando disponível

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


