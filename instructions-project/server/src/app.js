import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import sequelize, { testConnection } from './config/database.js';
import projectRoutes from './routes/projects.js';
import decorationRoutes from './routes/decorations.js';
import projectsRouter from './routes/projects.js';
import todosRouter from './routes/todos.js';
import productRoutes from './routes/products.js';
import uploadRouter from './routes/upload.js';
import editorUploadRoutes from './routes/editor-upload.js';
import userRoutes from './routes/users.js';
import authRoutes from './routes/auth.route.js';
import ordersRoutes from './routes/orders.js';
import { createHocuspocusServer } from './hocuspocus-server.js';
import upload from './config/multer-config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth } from './middleware/auth.js';
import { runMigrations } from './utils/migrationRunner.js';

const app = express();

// Middleware para aplicar Helmet condicionalmente (não aplicar para /landing/)
app.use((req, res, next) => {
  // Se for rota /landing/, pular Helmet completamente
  if (req.path.startsWith('/landing/')) {
    return next();
  }
  // Para outras rotas, aplicar Helmet
  helmet({
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
  })(req, res, next);
});

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3003',
      'http://localhost:3005',
      'https://thecore.dsproject.pt',
      'http://thecore.dsproject.pt',
      'https://test2.dsproject.pt',
      'http://test2.dsproject.pt',
      'https://thecore.blachere-illumination.ai',
      'http://thecore.blachere-illumination.ai',
    ];
    
    // Permitir qualquer IP na rede local 192.168.2.*
    const localNetworkRegex = /^http:\/\/192\.168\.2\.\d{1,3}:(3003|3005|5001)$/;
    
    if (allowedOrigins.includes(origin) || localNetworkRegex.test(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  [CORS] Origem bloqueada: ${origin}`);
      callback(new Error('Não permitido pelo CORS'));
    }
  },
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
import { getUploadsDir, getProductsUploadDir, getProjectsUploadDir } from './utils/pathUtils.js';

// Log do caminho de uploads base
const uploadsDir = getUploadsDir();
console.log(`📁 [APP] Diretório de uploads base configurado: ${uploadsDir}`);

// Log do caminho de produtos
const productsDir = getProductsUploadDir();
console.log(`📁 [APP] Diretório de produtos configurado: ${productsDir}`);

/**
 * Valida se o caminho resolvido está dentro do diretório base
 * Previne ataques de path traversal (ex: ../../etc/passwd)
 * @param {string} baseDir - Diretório base permitido
 * @param {string} requestedPath - Caminho solicitado pelo usuário
 * @returns {string|null} - Caminho resolvido e validado, ou null se inválido
 */
function validatePath(baseDir, requestedPath) {
  try {
    // Normalizar o diretório base para caminho absoluto
    const normalizedBase = path.resolve(baseDir);
    
    // Resolver o caminho completo solicitado
    const resolvedPath = path.resolve(baseDir, requestedPath);
    
    // Verificar se o caminho resolvido está dentro do diretório base
    // Usar startsWith para garantir que não saia do diretório
    if (!resolvedPath.startsWith(normalizedBase + path.sep) && resolvedPath !== normalizedBase) {
      console.warn(`⚠️ [APP] Tentativa de path traversal bloqueada: ${requestedPath}`);
      return null;
    }
    
    return resolvedPath;
  } catch (error) {
    console.error(`❌ [APP] Erro ao validar caminho: ${error.message}`);
    return null;
  }
}

// Servir produtos especificamente de getProductsUploadDir()
// IMPORTANTE: Se produtos estão em rede compartilhada diferente, precisamos de rota específica
app.use('/api/uploads/products', (req, res, next) => {
  try {
    const requestedFile = req.path.replace(/^\//, ''); // Remover barra inicial
    
    // Validar path traversal antes de processar
    const fullPath = validatePath(productsDir, requestedFile);
    if (!fullPath) {
      res.status(403).json({ 
        error: 'Caminho inválido', 
        path: req.path 
      });
      return;
    }
    
    // Verificar se arquivo existe antes de tentar servir
    if (fs.existsSync(fullPath)) {
      // Verificar se é um arquivo (não diretório)
      const stats = fs.statSync(fullPath);
      if (!stats.isFile()) {
        res.status(403).json({ 
          error: 'Caminho não é um arquivo', 
          path: req.path 
        });
        return;
      }
      
      // Servir arquivo diretamente com sendFile
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📤 [APP] Servindo arquivo de produto: ${fullPath}`);
      }
      
      // Determinar content-type baseado na extensão
      const ext = path.extname(fullPath).toLowerCase();
      const contentType = ext === '.webp' ? 'image/webp' : 
                         ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                         ext === '.png' ? 'image/png' : 'application/octet-stream';
      
      // Definir Content-Type apenas se headers ainda não foram enviados
      // sendFile pode definir automaticamente, mas garantimos o tipo correto
      res.setHeader('Content-Type', contentType);
      res.sendFile(fullPath, (err) => {
        if (err) {
          console.error(`❌ [APP] Erro ao servir arquivo de produto: ${err.message}`);
          // Se headers já foram enviados, não podemos enviar JSON
          if (!res.headersSent) {
            res.status(500).json({ 
              error: 'Erro ao servir arquivo', 
              path: req.path 
            });
          }
        }
      });
    } else {
      // Arquivo não encontrado - logs detalhados para diagnóstico
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ [APP] Arquivo de produto não encontrado: ${req.path}`);
        console.warn(`   Arquivo solicitado: ${requestedFile}`);
        console.warn(`   Caminho completo procurado: ${fullPath}`);
        console.warn(`   Diretório base (SMB montado): ${productsDir}`);
        
        try {
          console.warn(`   Arquivo existe fisicamente: ${fs.existsSync(fullPath)}`);
          
          // Verificar se o diretório existe
          const fileDir = path.dirname(fullPath);
          console.warn(`   Diretório do arquivo existe: ${fs.existsSync(fileDir)}`);
          
          // Listar alguns arquivos do diretório para debug
          if (fs.existsSync(productsDir)) {
            try {
              const files = fs.readdirSync(productsDir);
              const fileName = requestedFile.split('/').pop() || requestedFile;
              console.warn(`   Total de arquivos no diretório: ${files.length}`);
              console.warn(`   Procurando arquivo: ${fileName}`);
              
              // Listar alguns arquivos que começam com o mesmo prefixo (ex: temp_nightImage_)
              if (fileName.includes('_')) {
                const prefix = fileName.split('_').slice(0, 2).join('_'); // Ex: temp_nightImage
                const similarFiles = files.filter(f => f.startsWith(prefix) && f.endsWith('.webp'));
                if (similarFiles.length > 0) {
                  console.warn(`   Arquivos com prefixo "${prefix}": ${similarFiles.slice(0, 10).join(', ')}`);
                }
              }
            } catch (e) {
              console.warn(`   Erro ao listar arquivos: ${e.message}`);
            }
          } else {
            console.error(`   ❌ Diretório de produtos não existe! Verifique se SMB está montado corretamente.`);
          }
        } catch (e) {
          console.warn(`   Erro ao verificar arquivo: ${e.message}`);
        }
      }
      
      res.status(404).json({ 
        error: 'Arquivo não encontrado', 
        path: req.path,
        requestedFile: requestedFile,
        productsDir: productsDir,
        fullPath: fullPath
      });
    }
  } catch (error) {
    console.error(`❌ [APP] Erro crítico no middleware de produtos: ${error.message}`);
    console.error(`❌ [APP] Stack: ${error.stack}`);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        path: req.path 
      });
    }
  }
});

// Servir projetos especificamente usando getProjectsUploadDir()
// IMPORTANTE: Projetos têm estrutura hierárquica {projectId}/{subfolder}/{filename}
// Precisamos de middleware customizado para resolver corretamente com SMB
app.use('/api/uploads/projects', (req, res, next) => {
  try {
    // Formato esperado: /api/uploads/projects/{projectId}/{subfolder}/{filename}
    const pathParts = req.path.replace(/^\//, '').split('/');
    
    if (pathParts.length >= 3) {
      const projectId = pathParts[0];
      const subfolder = pathParts[1];
      const filename = pathParts.slice(2).join('/'); // Pode ter subdiretórios
      
      // Validar projectId e subfolder para prevenir path traversal
      // Estes devem ser valores simples, não caminhos relativos
      if (projectId.includes('..') || subfolder.includes('..') || filename.includes('..')) {
        console.warn(`⚠️ [APP] Tentativa de path traversal bloqueada em projeto: ${req.path}`);
        res.status(403).json({ error: 'Caminho inválido' });
        return;
      }
      
      const projectDir = getProjectsUploadDir(projectId, subfolder);
      
      // Validar path traversal usando função helper
      const filePath = validatePath(projectDir, filename);
      if (!filePath) {
        res.status(403).json({ 
          error: 'Caminho inválido', 
          path: req.path 
        });
        return;
      }
      
      // Verificar se arquivo existe
      if (fs.existsSync(filePath)) {
        // Verificar se é um arquivo (não diretório)
        const stats = fs.statSync(filePath);
        if (!stats.isFile()) {
          res.status(403).json({ 
            error: 'Caminho não é um arquivo', 
            path: req.path 
          });
          return;
        }
        
        // Determinar content-type baseado na extensão
        const ext = path.extname(filePath).toLowerCase();
        const contentType = ext === '.webp' ? 'image/webp' : 
                           ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                           ext === '.png' ? 'image/png' : 
                           ext === '.pdf' ? 'application/pdf' :
                           'application/octet-stream';
        
        // Definir Content-Type apenas se headers ainda não foram enviados
        res.setHeader('Content-Type', contentType);
        
        // Servir arquivo diretamente
        res.sendFile(filePath, (err) => {
          if (err) {
            console.error(`❌ [APP] Erro ao servir arquivo de projeto: ${err.message}`);
            // Se headers já foram enviados, não podemos enviar JSON
            if (!res.headersSent) {
              res.status(500).json({ error: 'Erro ao servir arquivo' });
            }
          }
        });
    } else {
      // Arquivo não encontrado - logs detalhados
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ [APP] Arquivo de projeto não encontrado: ${req.path}`);
        console.warn(`   ProjectId: ${projectId}, Subfolder: ${subfolder}, Filename: ${filename}`);
        console.warn(`   Caminho completo procurado: ${filePath}`);
        console.warn(`   Diretório do projeto existe: ${fs.existsSync(projectDir)}`);
        
        if (fs.existsSync(projectDir)) {
          try {
            const files = fs.readdirSync(projectDir);
            console.warn(`   Arquivos no diretório: ${files.length} total`);
            if (files.length > 0) {
              console.warn(`   Primeiros arquivos: ${files.slice(0, 5).join(', ')}`);
            }
          } catch (e) {
            console.warn(`   Erro ao listar arquivos: ${e.message}`);
          }
        }
      }
      res.status(404).json({ 
        error: 'Arquivo de projeto não encontrado', 
        path: req.path,
        projectId,
        subfolder,
        filename,
        projectDir,
        fullPath: filePath
      });
    }
  } else {
    // Caminho inválido - passar para próximo middleware
    next();
  }
  } catch (error) {
    console.error(`❌ [APP] Erro crítico no middleware de projetos: ${error.message}`);
    console.error(`❌ [APP] Stack: ${error.stack}`);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro interno do servidor', 
        path: req.path 
      });
    }
  }
});

// Servir outros uploads via /api/uploads (editor, etc)
// NOTA: express.static serve arquivos do diretório especificado
app.use('/api/uploads', express.static(uploadsDir, {
  // Adicionar headers para debug
  setHeaders: (res, path) => {
    // Log apenas para requisições importantes (para não poluir logs)
    if (path.includes('editor')) {
      console.log(`📤 [APP] Servindo arquivo: ${path}`);
    }
  }
}));

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
    express.static(clientPublicPath)(req, res, (err) => {
      // Remover CSP para rotas /landing/ após servir arquivo
      if (req.path.startsWith('/landing/')) {
        res.removeHeader('Content-Security-Policy');
      }
      next(err);
    });
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
        decorations: '/api/decorations',
        todos: '/api/todos'
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


// File upload endpoint
app.post('/api/files/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return file metadata
    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/api/files/${req.file.filename}`,
        url: `${req.protocol}://${req.get('host')}/api/files/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file', message: error.message });
  }
});

// File serving endpoint
app.get('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Usar getUploadsDir() para suportar caminhos SMB
    const uploadsDir = getUploadsDir();
    const filePath = path.join(uploadsDir, filename);

    // Security: prevent directory traversal
    // Normalizar caminhos para comparação (importante para Windows/SMB)
    const normalizedFilePath = path.normalize(filePath);
    const normalizedUploadsDir = path.normalize(uploadsDir);
    if (!normalizedFilePath.startsWith(normalizedUploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ [FILES] Arquivo não encontrado: ${filePath}`);
      return res.status(404).json({ error: 'File not found', path: filePath });
    }

    // Serve the file
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: 'Failed to serve file', message: error.message });
  }
});

// API Routes - Registrar rotas ANTES do middleware global de autenticação
// As rotas individuais já têm requireAuth() onde necessário

// Debug route para imagens de produtos (deve vir antes das rotas de produtos)
app.get('/api/debug/images/:productId', async (req, res) => {
  const { debugImages } = await import('./controllers/productController.js');
  return debugImages(req, res);
});

app.use('/api/projects', projectRoutes);
app.use('/api/decorations', decorationRoutes);
app.use('/api/projects', projectsRouter);
app.use('/api/todos', todosRouter);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRouter);
app.use('/api/upload', editorUploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', ordersRoutes);

// Proteger rotas se o auth estiver explicitamente habilitado
// NOTA: Este middleware é aplicado DEPOIS do registro das rotas
// para garantir que as rotas sejam encontradas primeiro
// Cada rota individual já tem requireAuth() onde necessário
if (useAuthJs && enableAuth) {
  // Aplicar autenticação apenas para rotas que não têm requireAuth() individual
  // Rotas como /api/todos já têm requireAuth() nas rotas individuais
  console.log('🔐 Auth.js habilitado - rotas protegidas individualmente');
} else if (useAuthJs) {
  console.warn('⚠️  Auth.js presente mas ENABLE_AUTH!=true. Rotas /api não protegidas em desenvolvimento.');
} else {
  console.warn('⚠️  Auth.js desabilitado (USE_AUTH_JS != true). Rotas /api não protegidas.');
}

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
      try { if (fs.existsSync(d)) { baseDir = d; break; } } catch { }
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
    } catch { }

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

    // Executar migrations pendentes (se habilitado)
    // Controlado pela variável de ambiente RUN_MIGRATIONS (padrão: true)
    const shouldRunMigrations = process.env.RUN_MIGRATIONS !== 'false';
    if (shouldRunMigrations) {
      console.log('🔄 Executando migrations pendentes...');
      try {
        const migrationResults = await runMigrations({ verbose: false });
        if (migrationResults.executed > 0) {
          console.log(`✅ ${migrationResults.executed} migration(s) executada(s) com sucesso`);
        } else if (migrationResults.executed === 0 && (!migrationResults.errors || migrationResults.errors.length === 0)) {
          // Quando não há migrations pendentes, runMigrations() retorna sem a propriedade 'pending'
          // Verificamos executed === 0 e sem erros para detectar este caso
          console.log('✅ Nenhuma migration pendente');
        }
        if (migrationResults.errors && migrationResults.errors.length > 0) {
          console.warn(`⚠️  ${migrationResults.errors.length} migration(s) com erro(s)`);
          // Continuar mesmo com erros (fail-safe)
        }
      } catch (migrationError) {
        console.error('❌ Erro ao executar migrations:', migrationError.message);
        console.warn('⚠️  Continuando mesmo assim (servidor iniciará sem migrations)');
      }
    } else {
      console.log('⏭️  Execução de migrations desabilitada (RUN_MIGRATIONS=false)');
    }

    // Schema da base de dados é gerenciado exclusivamente por migrations
    // Não é necessário sequelize.sync() pois migrations já criam/modificam todas as tabelas necessárias

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


