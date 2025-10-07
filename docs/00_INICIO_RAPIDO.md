# Início Rápido - Instructions Project

> Guia passo-a-passo para começar o desenvolvimento AGORA

---

## 🎯 Objetivo

Este guia permite-te começar a desenvolver a aplicação em **30 minutos**, com uma base funcional onde podes adicionar as tuas imagens e decorações de demonstração.

---

## ⚡ Passos Rápidos

### 1. Criar Estrutura do Projeto (5 min)

```bash
# Criar diretório principal
mkdir instructions-project
cd instructions-project

# Criar estrutura básica
mkdir -p client/public/demo-images/{decorations,buildings,results}
mkdir -p server/src/{controllers,models,routes,services,config,utils}
mkdir -p database/{migrations,seeders}
```

### 2. Docker PostgreSQL (2 min)

Criar `docker-compose.yml` na raiz:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: instructions_demo
      POSTGRES_USER: demo_user
      POSTGRES_PASSWORD: demo_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# Iniciar PostgreSQL
docker-compose up -d
```

### 3. Backend - Setup (5 min)

```bash
cd server
npm init -y
```

**Instalar dependências:**
```bash
npm install express cors dotenv sequelize pg pg-hstore multer helmet express-rate-limit
npm install nodemon --save-dev
```

**Criar `server/src/app.js`:**
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', env: 'demo' });
});

// Rotas básicas
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

app.get('/api/decorations', (req, res) => {
  res.json([
    {
      id: '1',
      name: 'Bola Dourada',
      category: 'ball',
      tags: ['bola', 'dourado', 'natal'],
      thumbnailUrl: '/demo-images/decorations/ball-gold.png',
      width: 150,
      height: 150,
    },
  ]);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor em http://localhost:${PORT}`);
});
```

**Adicionar ao `package.json`:**
```json
{
  "type": "module",
  "scripts": {
    "dev": "nodemon src/app.js"
  }
}
```

**Criar `server/.env`:**
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=demo-secret-change-in-production
```

**Testar:**
```bash
npm run dev
# Abrir http://localhost:5000/health
```

### 4. Frontend - Setup (8 min)

```bash
cd ../client
npm create vite@latest . -- --template react
```

**Instalar dependências:**
```bash
npm install
npm install react-router-dom axios date-fns

# Opção A: Com HeroUI (RECOMENDADO) ⭐
pnpm add @heroui/react framer-motion
pnpm heroui add button card table modal badge tabs

# Canvas library (Konva)
npm install konva react-konva use-image

# Drag & Drop (opcional, para biblioteca visual)
npm install react-dnd react-dnd-html5-backend
```

> **⭐ Recomendação:** Usar HeroUI para desenvolvimento mais rápido. Ver `06_DASHBOARD_COM_HEROUI.md` para exemplo completo.

**Criar `client/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
VITE_DEMO_MODE=true
```

**Substituir `client/src/App.jsx`:**
```javascript
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: '20px' }}>
        <header style={{ marginBottom: '20px', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
          <h1>Instructions Project <span style={{ fontSize: '12px', background: '#ff9800', color: '#fff', padding: '4px 8px', borderRadius: '4px' }}>DEMO</span></h1>
          <nav>
            <Link to="/" style={{ marginRight: '20px' }}>Dashboard</Link>
            <Link to="/projects" style={{ marginRight: '20px' }}>Projetos</Link>
            <Link to="/projects/new">Criar Projeto</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/new" element={<CreateProject />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
        <StatCard title="Total de Projetos" value="12" color="#2196F3" />
        <StatCard title="Em Progresso" value="5" color="#FF9800" />
        <StatCard title="Finalizados" value="6" color="#4CAF50" />
        <StatCard title="Aprovados" value="3" color="#9C27B0" />
      </div>
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ 
      background: color, 
      color: '#fff', 
      padding: '20px', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{title}</h3>
      <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>{value}</p>
    </div>
  );
}

function ProjectList() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api.get('/projects').then(res => setProjects(res.data));
  }, []);

  return (
    <div>
      <h2>Lista de Projetos</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Nome</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Cliente</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Tipo</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Data</th>
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{project.name}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{project.clientName}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                <span style={{ 
                  background: project.projectType === 'decor' ? '#4CAF50' : '#2196F3', 
                  color: '#fff', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  {project.projectType}
                </span>
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{project.status}</td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {new Date(project.createdAt).toLocaleDateString('pt-PT')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateProject() {
  const [projectType, setProjectType] = useState('decor');
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    location: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Criar projeto:', { ...formData, projectType });
    alert('Projeto criado! (demo)');
  };

  return (
    <div>
      <h2>Criar Novo Projeto</h2>
      
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <button
          onClick={() => setProjectType('decor')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            background: projectType === 'decor' ? '#4CAF50' : '#e0e0e0',
            color: projectType === 'decor' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Decor
        </button>
        <button
          onClick={() => setProjectType('simu')}
          style={{
            padding: '10px 20px',
            background: projectType === 'simu' ? '#2196F3' : '#e0e0e0',
            color: projectType === 'simu' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Simu
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Nome do Projeto *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Cliente *</label>
          <input
            type="text"
            required
            value={formData.clientName}
            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Localização</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '10px 20px',
            background: '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Criar Projeto
        </button>
      </form>
    </div>
  );
}

export default App;
```

**Adicionar proxy no `client/vite.config.js`:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
    hmr: true, // Hot Module Replacement ativado
  },
})
```

**Testar:**
```bash
npm run dev
# Abrir http://localhost:3000
```

---

## 🎨 Adicionar Imagens de Demo (10 min)

### Estrutura necessária:
```
client/public/demo-images/
├── decorations/
│   ├── ball-gold.png
│   ├── ball-red.png
│   ├── arc-blue.png
│   ├── star-silver.png
│   └── pendant-white.png
├── buildings/
│   ├── facade-1.jpg
│   └── facade-2.jpg
└── results/
    └── result-example.jpg
```

### Onde obter imagens:

1. **Unsplash** (grátis, alta qualidade)
   - Procurar: "christmas lights", "ornaments", "building facade"
   - Download direto

2. **Pexels** (grátis)
   - Similar ao Unsplash

3. **Criar com IA** (DALL-E, etc.)
   - Prompt: "christmas ball ornament, transparent background, PNG, golden color"

4. **Placeholder temporário:**
   - Usar https://placehold.co/150x150/gold/white?text=Ball

---

## ✅ Verificação

Neste ponto deves ter:

✅ PostgreSQL a correr (Docker)  
✅ Backend API respondendo em http://localhost:5000  
✅ Frontend React a correr em http://localhost:3000  
✅ **Hot Reload (HMR) funcional** - Muda código e vê atualizar instantaneamente  
✅ Navegação funcional entre páginas  
✅ Lista de projetos a carregar da API  
✅ Formulário de criação de projeto  

---

## 🔥 Testar Hot Reload

1. Com o frontend a correr, abre `src/App.jsx`
2. Muda qualquer texto
3. Guarda o ficheiro
4. Vê o browser atualizar **instantaneamente** (sem refresh)
5. Estado dos componentes é preservado! ✨

---

## 🚀 Próximos Passos

Agora que tens a base funcional:

1. **Adicionar mais dados mock** ao backend
2. **Criar componentes reutilizáveis** (Button, Modal, etc.)
3. **Implementar detalhes de projeto**
4. **Desenvolver canvas de design** (parte mais complexa)
5. **Adicionar biblioteca de decorações**
6. **Implementar drag & drop**

Ver `02_GUIA_IMPLEMENTACAO_DETALHADO.md` para continuar.

---

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: PostgreSQL não inicia
```bash
# Verificar se porta 5432 está livre
docker-compose down
docker-compose up -d
docker-compose logs postgres
```

### Erro: CORS
Verificar se o backend tem:
```javascript
app.use(cors());
```

### Frontend não conecta ao backend
Verificar `client/.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 📝 Checklist de Setup

- [ ] Docker instalado e a correr
- [ ] PostgreSQL iniciado (porta 5432)
- [ ] Node.js 18+ instalado
- [ ] Backend instalado e a correr (porta 3001)
- [ ] Frontend instalado e a correr (porta 3000)
- [ ] API a responder (/health, /api/projects)
- [ ] Frontend a mostrar dados da API
- [ ] Navegação entre páginas funcional
- [ ] Imagens demo adicionadas (opcional para já)

---

## 💡 Dicas Rápidas

1. **Console.log é teu amigo** - Debug constantemente
2. **Testar no browser** - Developer Tools sempre abertos
3. **Git commits** - Commit pequenos e frequentes
4. **Lê os erros** - Maioria são self-explanatory
5. **Um passo de cada vez** - Não tentar fazer tudo

---

## 🎯 Meta de Hoje

**Objetivo mínimo:** Base funcional (backend + frontend + navegação)  
**Objetivo ideal:** + Detalhes de projeto + primeiras imagens demo  
**Objetivo stretch:** + Canvas básico com imagem de fundo  

---

**Boa sorte! 🚀**

Qualquer dúvida, consulta os outros guias ou o diagrama original.

