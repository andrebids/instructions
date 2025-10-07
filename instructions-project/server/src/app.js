import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', env: process.env.NODE_ENV || 'development' });
});

app.get('/api/projects', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Projeto Demo 1',
      clientName: 'Cliente A',
      projectType: 'decor',
      status: 'created',
      createdAt: new Date().toISOString(),
    },
  ]);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor em http://localhost:${PORT}`);
});


