import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import sequelize, { testConnection } from './config/database.js';
import projectRoutes from './routes/projects.js';
import decorationRoutes from './routes/decorations.js';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Testar conexão com o banco
    await testConnection();
    
    // Sincronizar modelos (sem force, para não apagar dados)
    await sequelize.sync();
    console.log('✅ Modelos sincronizados');
    
    // Iniciar servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor em http://localhost:${PORT}`);
      console.log(`📊 API disponível em http://localhost:${PORT}/api`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();


