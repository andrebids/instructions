# Guia de Implementação Detalhado

> Instruções passo-a-passo para implementar cada elemento da aplicação

---

## 📋 Índice

1. [Setup Inicial](#1-setup-inicial)
2. [Base de Dados](#2-base-de-dados)
3. [Backend API](#3-backend-api)
4. [Frontend - Layout Base](#4-frontend---layout-base)
5. [Páginas Principais](#5-páginas-principais)
6. [Canvas de Design](#6-canvas-de-design)
7. [Biblioteca Visual](#7-biblioteca-visual)
8. [Funcionalidades Mock/IA](#8-funcionalidades-mockia)
9. [Sistema de Validação](#9-sistema-de-validação)
10. [Export e Job Tickets](#10-export-e-job-tickets)

---

## 1. Setup Inicial

### 1.1 Criar Estrutura de Projeto

```bash
# Criar diretório principal
mkdir instructions-project
cd instructions-project

# Criar estrutura
mkdir -p client/src/{components,pages,services,utils,hooks,context,styles}
mkdir -p server/src/{controllers,models,routes,services,utils,config}
mkdir -p database/{migrations,seeders}
mkdir -p docs
```

### 1.2 Inicializar Frontend (React + Vite)

```bash
cd client
npm create vite@latest . -- --template react
npm install

# Dependências adicionais
npm install react-router-dom
npm install axios
npm install react-dnd react-dnd-html5-backend
npm install fabric
npm install lucide-react
npm install date-fns
npm install clsx
```

### 1.3 Inicializar Backend (Node.js + Express)

```bash
cd ../server
npm init -y

# Dependências
npm install express cors dotenv
npm install sequelize pg pg-hstore
npm install multer
npm install helmet express-rate-limit
npm install nodemon --save-dev
```

### 1.4 Docker para PostgreSQL

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

  pgadmin:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@demo.com
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    depends_on:
      - postgres

volumes:
  postgres_data:
```

```bash
docker-compose up -d
```

---

## 2. Base de Dados

### 2.1 Configurar Sequelize

**server/src/config/database.js**
```javascript
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'instructions_demo',
  process.env.DB_USER || 'demo_user',
  process.env.DB_PASSWORD || 'demo_password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false,
  }
);

module.exports = sequelize;
```

### 2.2 Modelos Sequelize

**server/src/models/Project.js**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  location: DataTypes.STRING,
  projectType: {
    type: DataTypes.ENUM('decor', 'simu'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('created', 'ongoing', 'canceled', 'finished', 'approved'),
    defaultValue: 'created',
  },
  baseImageUrl: DataTypes.STRING,
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  feedbackDesigner: DataTypes.TEXT,
});

module.exports = Project;
```

**server/src/models/Decoration.js**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Decoration = sequelize.define('Decoration', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING, // 'ball', 'arc', 'star', 'pendant'
    allowNull: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  thumbnailUrl: DataTypes.STRING,
  thumbnailNightUrl: DataTypes.STRING, // Preview noturno
  width: DataTypes.INTEGER,
  height: DataTypes.INTEGER,
  description: DataTypes.TEXT,
});

module.exports = Decoration;
```

**server/src/models/ProjectElement.js**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectElement = sequelize.define('ProjectElement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  projectId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  decorationId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  xPosition: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  yPosition: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  scale: {
    type: DataTypes.FLOAT,
    defaultValue: 1.0,
  },
  rotation: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  zIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

module.exports = ProjectElement;
```

### 2.3 Associações

**server/src/models/index.js**
```javascript
const Project = require('./Project');
const Decoration = require('./Decoration');
const ProjectElement = require('./ProjectElement');
const ProjectHistory = require('./ProjectHistory');
const JobTicket = require('./JobTicket');

// Associações
Project.hasMany(ProjectElement, { foreignKey: 'projectId', as: 'elements' });
ProjectElement.belongsTo(Project, { foreignKey: 'projectId' });

Decoration.hasMany(ProjectElement, { foreignKey: 'decorationId' });
ProjectElement.belongsTo(Decoration, { foreignKey: 'decorationId', as: 'decoration' });

Project.hasMany(ProjectHistory, { foreignKey: 'projectId', as: 'history' });
Project.hasOne(JobTicket, { foreignKey: 'projectId', as: 'jobTicket' });

module.exports = {
  Project,
  Decoration,
  ProjectElement,
  ProjectHistory,
  JobTicket,
};
```

### 2.4 Seed Data (Dados Demo)

**server/src/utils/seedData.js**
```javascript
const { Decoration } = require('../models');

const decorationsSeed = [
  {
    name: 'Bola Dourada Grande',
    category: 'ball',
    tags: ['bola', 'dourado', 'grande', 'natal'],
    thumbnailUrl: '/demo-images/decorations/ball-gold-large.png',
    thumbnailNightUrl: '/demo-images/decorations/ball-gold-large-night.png',
    width: 150,
    height: 150,
  },
  {
    name: 'Arco de Luz Azul',
    category: 'arc',
    tags: ['arco', 'azul', 'led', 'moderno'],
    thumbnailUrl: '/demo-images/decorations/arc-blue.png',
    thumbnailNightUrl: '/demo-images/decorations/arc-blue-night.png',
    width: 300,
    height: 200,
  },
  {
    name: 'Estrela Prateada',
    category: 'star',
    tags: ['estrela', 'prateado', 'topo'],
    thumbnailUrl: '/demo-images/decorations/star-silver.png',
    thumbnailNightUrl: '/demo-images/decorations/star-silver-night.png',
    width: 200,
    height: 200,
  },
  {
    name: 'Pendente Cascata',
    category: 'pendant',
    tags: ['pendente', 'cascata', 'branco', 'led'],
    thumbnailUrl: '/demo-images/decorations/pendant-cascade.png',
    thumbnailNightUrl: '/demo-images/decorations/pendant-cascade-night.png',
    width: 100,
    height: 400,
  },
  // Adicionar mais 20-30 decorações de exemplo
];

async function seedDecorations() {
  await Decoration.bulkCreate(decorationsSeed);
  console.log('✅ Decorações demo criadas');
}

module.exports = { seedDecorations };
```

---

## 3. Backend API

### 3.1 Routes

**server/src/routes/projects.js**
```javascript
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');

router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.post('/', projectController.create);
router.put('/:id', projectController.update);
router.delete('/:id', projectController.delete);
router.patch('/:id/status', projectController.updateStatus);
router.patch('/:id/favorite', projectController.toggleFavorite);

module.exports = router;
```

**server/src/routes/decorations.js**
```javascript
const express = require('express');
const router = express.Router();
const decorationController = require('../controllers/decorationController');

router.get('/', decorationController.getAll);
router.get('/search', decorationController.search);
router.get('/:id', decorationController.getById);

module.exports = router;
```

### 3.2 Controllers

**server/src/controllers/projectController.js**
```javascript
const { Project, ProjectElement, Decoration } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const { status, projectType, favorite } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (favorite) where.isFavorite = favorite === 'true';
    
    const projects = await Project.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: ProjectElement,
          as: 'elements',
          include: [{ model: Decoration, as: 'decoration' }],
        },
      ],
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ... outros métodos
```

### 3.3 App Principal

**server/src/app.js**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const sequelize = require('./config/database');
const projectRoutes = require('./routes/projects');
const decorationRoutes = require('./routes/decorations');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/decorations', decorationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', env: 'demo' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;

sequelize.sync().then(() => {
  console.log('✅ Base de dados sincronizada');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor a correr em http://localhost:${PORT}`);
  });
});

module.exports = app;
```

---

## 4. Frontend - Layout Base

### 4.1 Router Principal

**client/src/App.jsx**
```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProjectHistory from './pages/ProjectHistory';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import ChooseWorkflow from './pages/ChooseWorkflow';
import CommercialMode from './pages/CommercialMode';
import DesignerMode from './pages/DesignerMode';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectHistory />} />
          <Route path="projects/new" element={<CreateProject />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/:id/workflow" element={<ChooseWorkflow />} />
          <Route path="projects/:id/commercial" element={<CommercialMode />} />
          <Route path="projects/:id/designer" element={<DesignerMode />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 4.2 Layout Principal

**client/src/components/layout/Layout.jsx**
```javascript
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  return (
    <div className="layout">
      <Header />
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

**client/src/components/layout/Header.jsx**
```javascript
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <h1>Instructions Project</h1>
        <span className="demo-badge">DEMO</span>
      </div>
      <nav className="header-nav">
        <Link to="/">Dashboard</Link>
        <Link to="/projects">Projetos</Link>
        <Link to="/projects/new">Novo Projeto</Link>
      </nav>
    </header>
  );
}
```

### 4.3 Service API

**client/src/services/api.js**
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  updateStatus: (id, status) => api.patch(`/projects/${id}/status`, { status }),
  toggleFavorite: (id) => api.patch(`/projects/${id}/favorite`),
};

export const decorationsAPI = {
  getAll: (params) => api.get('/decorations', { params }),
  search: (query) => api.get('/decorations/search', { params: { q: query } }),
  getById: (id) => api.get(`/decorations/${id}`),
};

export default api;
```

---

## 5. Páginas Principais

### 5.1 Dashboard

**client/src/pages/Dashboard.jsx**
```javascript
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { format } from 'date-fns';
import { ptPT } from 'date-fns/locale';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    needsAttention: 0,
    approved: 0,
    avgCompletionDays: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [projectsNeedingAttention, setProjectsNeedingAttention] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: projects } = await projectsAPI.getAll();
      
      // Calcular estatísticas
      const ongoing = projects.filter(p => p.status === 'ongoing');
      const needsAttention = projects.filter(p => 
        p.status === 'ongoing' && (p.feedbackDesigner || isOldProject(p))
      );
      const approved = projects.filter(p => p.status === 'approved');
      
      setStats({
        total: projects.length,
        ongoing: ongoing.length,
        needsAttention: needsAttention.length,
        approved: approved.length,
        avgCompletionDays: calculateAvgDays(projects),
      });
      
      // Últimos 10 projetos
      setRecentProjects(projects.slice(0, 10));
      setProjectsNeedingAttention(needsAttention);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    }
  }

  function isOldProject(project) {
    const daysSinceCreation = Math.floor(
      (new Date() - new Date(project.createdAt)) / (1000 * 60 * 60 * 24)
    );
    return daysSinceCreation > 7; // Mais de 7 dias
  }

  function calculateAvgDays(projects) {
    const finished = projects.filter(p => 
      p.status === 'finished' || p.status === 'approved'
    );
    if (finished.length === 0) return 0;
    
    const totalDays = finished.reduce((sum, p) => {
      const days = Math.floor(
        (new Date(p.updatedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    
    return Math.round(totalDays / finished.length);
  }

  async function handleRequestChanges(projectId) {
    const feedback = prompt('Que alterações pretende?');
    if (feedback) {
      try {
        await projectsAPI.update(projectId, { 
          feedbackDesigner: feedback,
          status: 'ongoing'
        });
        loadDashboardData();
      } catch (error) {
        console.error('Erro ao guardar feedback:', error);
      }
    }
  }

  const filteredProjects = statusFilter === 'all' 
    ? recentProjects 
    : recentProjects.filter(p => p.status === statusFilter);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/projects/new" className="btn btn-primary btn-large">
          + Criar Novo Projeto
        </Link>
      </div>

      {/* Estatísticas principais */}
      <div className="stats-grid">
        <StatCard 
          title="Em Curso" 
          value={stats.ongoing} 
          color="orange"
          icon="⏳"
          highlight
        />
        <StatCard 
          title="A Precisar Atenção" 
          value={stats.needsAttention} 
          color="red"
          icon="⚠️"
          highlight={stats.needsAttention > 0}
        />
        <StatCard 
          title="Aprovados (mês)" 
          value={stats.approved} 
          color="green"
          icon="✓"
        />
        <StatCard 
          title="Tempo Médio" 
          value={`${stats.avgCompletionDays} dias`} 
          color="blue"
          icon="📊"
        />
      </div>

      {/* Projetos a precisar atenção */}
      {projectsNeedingAttention.length > 0 && (
        <div className="dashboard-section alert-section">
          <h2>⚠️ Projetos a Precisar Atenção</h2>
          <div className="projects-alert-list">
            {projectsNeedingAttention.map(project => (
              <div key={project.id} className="alert-item">
                <div className="alert-info">
                  <strong>{project.name}</strong>
                  <span className="alert-reason">
                    {project.feedbackDesigner 
                      ? 'Com feedback pendente' 
                      : 'Em curso há muito tempo'}
                  </span>
                </div>
                <Link to={`/projects/${project.id}`} className="btn btn-small">
                  Ver Projeto
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Histórico recente de projetos */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Histórico de Projetos</h2>
          <div className="status-filters">
            <button 
              className={statusFilter === 'all' ? 'active' : ''}
              onClick={() => setStatusFilter('all')}
            >
              Todos
            </button>
            <button 
              className={statusFilter === 'ongoing' ? 'active' : ''}
              onClick={() => setStatusFilter('ongoing')}
            >
              Em Curso
            </button>
            <button 
              className={statusFilter === 'finished' ? 'active' : ''}
              onClick={() => setStatusFilter('finished')}
            >
              Finalizados
            </button>
            <button 
              className={statusFilter === 'approved' ? 'active' : ''}
              onClick={() => setStatusFilter('approved')}
            >
              Aprovados
            </button>
          </div>
        </div>

        <div className="recent-projects-table">
          <table>
            <thead>
              <tr>
                <th>Preview</th>
                <th>Projeto</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(project => (
                <tr key={project.id}>
                  <td>
                    <img 
                      src={project.baseImageUrl || '/placeholder.png'} 
                      alt={project.name}
                      className="project-thumbnail"
                    />
                  </td>
                  <td>
                    <Link to={`/projects/${project.id}`} className="project-name">
                      {project.name}
                    </Link>
                    {project.feedbackDesigner && (
                      <span className="feedback-badge" title={project.feedbackDesigner}>
                        💬 Feedback
                      </span>
                    )}
                  </td>
                  <td>{project.clientName}</td>
                  <td>
                    <span className={`badge badge-${project.projectType}`}>
                      {project.projectType === 'decor' ? '🎨 Decor' : '🔧 Simu'}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={project.status} />
                  </td>
                  <td>
                    <time>
                      {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptPT })}
                    </time>
                  </td>
                  <td className="actions-cell">
                    <Link 
                      to={`/projects/${project.id}`} 
                      className="btn btn-small btn-view"
                    >
                      Ver
                    </Link>
                    {project.status !== 'created' && (
                      <button 
                        onClick={() => handleRequestChanges(project.id)}
                        className="btn btn-small btn-changes"
                      >
                        Pedir Alterações
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section-footer">
          <Link to="/projects" className="btn btn-secondary">
            Ver Todos os Projetos ({stats.total})
          </Link>
        </div>
      </div>

      {/* Ação rápida de criação */}
      <div className="quick-create-section">
        <h3>Criar Projeto Rápido</h3>
        <div className="quick-create-buttons">
          <button 
            onClick={() => navigate('/projects/new?type=decor')}
            className="quick-create-btn decor"
          >
            <span className="icon">🎨</span>
            <span className="label">Projeto Decor</span>
            <span className="description">Decorações visuais</span>
          </button>
          <button 
            onClick={() => navigate('/projects/new?type=simu')}
            className="quick-create-btn simu"
          >
            <span className="icon">🔧</span>
            <span className="label">Projeto Simu</span>
            <span className="description">Dados técnicos</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color, icon, highlight }) {
  return (
    <div className={`stat-card stat-${color} ${highlight ? 'highlight' : ''}`}>
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-content">
        <h3>{title}</h3>
        <p className="stat-value">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const statusConfig = {
    created: { label: 'Criado', color: 'gray', icon: '📝' },
    ongoing: { label: 'Em Curso', color: 'orange', icon: '⏳' },
    finished: { label: 'Finalizado', color: 'blue', icon: '✓' },
    approved: { label: 'Aprovado', color: 'green', icon: '✓✓' },
    canceled: { label: 'Cancelado', color: 'red', icon: '✗' },
  };
  
  const config = statusConfig[status] || statusConfig.created;
  
  return (
    <span className={`status-badge status-${config.color}`}>
      <span className="status-icon">{config.icon}</span>
      {config.label}
    </span>
  );
}
```

### 5.2 Project History (Lista)

**client/src/pages/ProjectHistory.jsx**
```javascript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { format } from 'date-fns';
import './ProjectHistory.css';

export default function ProjectHistory() {
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    projectType: '',
    favorite: false,
  });

  useEffect(() => {
    loadProjects();
  }, [filters]);

  async function loadProjects() {
    try {
      const { data } = await projectsAPI.getAll(filters);
      setProjects(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    }
  }

  async function handleToggleFavorite(id) {
    try {
      await projectsAPI.toggleFavorite(id);
      loadProjects();
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  }

  return (
    <div className="project-history">
      <div className="page-header">
        <h1>Histórico de Projetos</h1>
        <Link to="/projects/new" className="btn btn-primary">
          Novo Projeto
        </Link>
      </div>

      <ProjectFilters filters={filters} onChange={setFilters} />

      <div className="projects-table">
        <table>
          <thead>
            <tr>
              <th>Preview</th>
              <th>Nome</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Status</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {projects.map(project => (
              <tr key={project.id}>
                <td>
                  <img 
                    src={project.baseImageUrl || '/placeholder.png'} 
                    alt={project.name}
                    className="project-thumbnail"
                  />
                </td>
                <td>
                  <Link to={`/projects/${project.id}`}>
                    {project.name}
                  </Link>
                  {project.isFavorite && <span>⭐</span>}
                </td>
                <td>{project.clientName}</td>
                <td>
                  <span className={`badge badge-${project.projectType}`}>
                    {project.projectType}
                  </span>
                </td>
                <td>
                  <StatusBadge status={project.status} />
                </td>
                <td>{format(new Date(project.createdAt), 'dd/MM/yyyy')}</td>
                <td>
                  <button onClick={() => handleToggleFavorite(project.id)}>
                    {project.isFavorite ? '★' : '☆'}
                  </button>
                  <Link to={`/projects/${project.id}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 5.3 Create Project

**client/src/pages/CreateProject.jsx**
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import './CreateProject.css';

export default function CreateProject() {
  const navigate = useNavigate();
  const [projectType, setProjectType] = useState('decor');
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    location: '',
    baseImage: null,
  });

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      // Upload da imagem primeiro (se houver)
      let baseImageUrl = '';
      if (formData.baseImage) {
        // Implementar upload
        baseImageUrl = '/demo-images/uploaded-image.jpg';
      }
      
      const { data: project } = await projectsAPI.create({
        ...formData,
        projectType,
        baseImageUrl,
      });
      
      navigate(`/projects/${project.id}/workflow`);
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
    }
  }

  return (
    <div className="create-project">
      <h1>Criar Novo Projeto</h1>

      {/* Toggle Decor ↔ Simu */}
      <div className="project-type-toggle">
        <button
          className={projectType === 'decor' ? 'active' : ''}
          onClick={() => setProjectType('decor')}
        >
          Decor
        </button>
        <button
          className={projectType === 'simu' ? 'active' : ''}
          onClick={() => setProjectType('simu')}
        >
          Simu
        </button>
      </div>

      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label>Nome do Projeto *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Cliente *</label>
          <input
            type="text"
            required
            value={formData.clientName}
            onChange={(e) => setFormData({...formData, clientName: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Localização</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>Imagem Base</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({...formData, baseImage: e.target.files[0]})}
          />
        </div>

        {/* Campos específicos Decor/Simu */}
        {projectType === 'decor' && (
          <DecorSpecificFields />
        )}
        
        {projectType === 'simu' && (
          <SimuSpecificFields />
        )}

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            Criar Projeto
          </button>
        </div>
      </form>
    </div>
  );
}
```

---

## 6. Canvas de Design

### 6.1 Commercial Mode com Canvas

**client/src/pages/CommercialMode.jsx**
```javascript
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DesignCanvas from '../components/canvas/DesignCanvas';
import DecorationLibrary from '../components/library/DecorationLibrary';
import CanvasToolbar from '../components/canvas/CanvasToolbar';
import { projectsAPI, decorationsAPI } from '../services/api';
import './CommercialMode.css';

export default function CommercialMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [decorations, setDecorations] = useState([]);

  useEffect(() => {
    loadProject();
    loadDecorations();
  }, [id]);

  async function loadProject() {
    const { data } = await projectsAPI.getById(id);
    setProject(data);
    setElements(data.elements || []);
  }

  async function loadDecorations() {
    const { data } = await decorationsAPI.getAll();
    setDecorations(data);
  }

  function handleAddDecoration(decoration, position) {
    const newElement = {
      id: `temp-${Date.now()}`,
      decorationId: decoration.id,
      decoration,
      xPosition: position.x,
      yPosition: position.y,
      scale: 1,
      rotation: 0,
      zIndex: elements.length,
    };
    setElements([...elements, newElement]);
  }

  function handleUpdateElement(id, updates) {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }

  function handleDeleteElement(id) {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement?.id === id) {
      setSelectedElement(null);
    }
  }

  async function handleSendToDesigner() {
    try {
      // Guardar elementos
      await projectsAPI.update(id, { elements });
      
      // Mudar status
      await projectsAPI.updateStatus(id, 'ongoing');
      
      navigate(`/projects/${id}/designer`);
    } catch (error) {
      console.error('Erro ao enviar:', error);
    }
  }

  if (!project) return <div>A carregar...</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="commercial-mode">
        <CanvasToolbar 
          onSave={handleSendToDesigner}
          onUndo={() => {/* implementar */}}
          onRedo={() => {/* implementar */}}
        />

        <div className="commercial-layout">
          {/* Sidebar esquerda: Biblioteca */}
          <aside className="decoration-sidebar">
            <DecorationLibrary 
              decorations={decorations}
              onSelect={handleAddDecoration}
            />
          </aside>

          {/* Canvas central */}
          <main className="canvas-container">
            <DesignCanvas
              backgroundImage={project.baseImageUrl}
              elements={elements}
              selectedElement={selectedElement}
              onElementClick={setSelectedElement}
              onElementUpdate={handleUpdateElement}
              onElementAdd={handleAddDecoration}
            />
          </main>

          {/* Sidebar direita: Propriedades */}
          {selectedElement && (
            <aside className="properties-sidebar">
              <ElementProperties
                element={selectedElement}
                onUpdate={(updates) => handleUpdateElement(selectedElement.id, updates)}
                onDelete={() => handleDeleteElement(selectedElement.id)}
              />
            </aside>
          )}
        </div>
      </div>
    </DndProvider>
  );
}
```

### 6.2 Design Canvas Component

**client/src/components/canvas/DesignCanvas.jsx**
```javascript
import { useRef, useEffect, useState } from 'react';
import { useDrop } from 'react-dnd';
import { applySmartSnapping } from '../../utils/snapping';
import './DesignCanvas.css';

export default function DesignCanvas({
  backgroundImage,
  elements,
  selectedElement,
  onElementClick,
  onElementUpdate,
  onElementAdd,
}) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState(null);

  const [{ isOver }, drop] = useDrop({
    accept: 'DECORATION',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      const canvasRect = canvasRef.current.getBoundingClientRect();
      
      const position = {
        x: (offset.x - canvasRect.left - pan.x) / zoom,
        y: (offset.y - canvasRect.top - pan.y) / zoom,
      };
      
      // Aplicar snapping inteligente
      const snappedPosition = applySmartSnapping(position, elements);
      
      onElementAdd(item.decoration, snappedPosition);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  useEffect(() => {
    drop(canvasRef);
  }, [drop]);

  function handleElementDragStart(element, e) {
    setIsDragging(true);
    setDraggedElement(element);
  }

  function handleElementDrag(e) {
    if (!isDragging || !draggedElement) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newPosition = {
      x: (e.clientX - canvasRect.left - pan.x) / zoom,
      y: (e.clientY - canvasRect.top - pan.y) / zoom,
    };
    
    // Aplicar snapping
    const snappedPosition = applySmartSnapping(newPosition, elements);
    
    onElementUpdate(draggedElement.id, {
      xPosition: snappedPosition.x,
      yPosition: snappedPosition.y,
    });
  }

  function handleElementDragEnd() {
    setIsDragging(false);
    setDraggedElement(null);
  }

  return (
    <div 
      ref={canvasRef}
      className={`design-canvas ${isOver ? 'drop-over' : ''}`}
      style={{
        transform: `scale(${zoom})`,
        backgroundImage: `url(${backgroundImage})`,
      }}
      onMouseMove={handleElementDrag}
      onMouseUp={handleElementDragEnd}
    >
      {/* Grid de snapping (opcional) */}
      <div className="canvas-grid" />

      {/* Elementos no canvas */}
      {elements.map((element) => (
        <CanvasElement
          key={element.id}
          element={element}
          isSelected={selectedElement?.id === element.id}
          onClick={() => onElementClick(element)}
          onDragStart={(e) => handleElementDragStart(element, e)}
        />
      ))}

      {/* Controlos de zoom */}
      <div className="zoom-controls">
        <button onClick={() => setZoom(zoom + 0.1)}>+</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>-</button>
        <button onClick={() => setZoom(1)}>Reset</button>
      </div>
    </div>
  );
}

function CanvasElement({ element, isSelected, onClick, onDragStart }) {
  return (
    <div
      className={`canvas-element ${isSelected ? 'selected' : ''}`}
      style={{
        left: element.xPosition,
        top: element.yPosition,
        transform: `scale(${element.scale}) rotate(${element.rotation}deg)`,
        zIndex: element.zIndex,
      }}
      onClick={onClick}
      onMouseDown={onDragStart}
      draggable
    >
      <img 
        src={element.decoration.thumbnailUrl} 
        alt={element.decoration.name}
        draggable={false}
      />
      {isSelected && (
        <div className="selection-handles">
          <div className="handle handle-nw" />
          <div className="handle handle-ne" />
          <div className="handle handle-sw" />
          <div className="handle handle-se" />
        </div>
      )}
    </div>
  );
}
```

---

## 7. Biblioteca Visual

**client/src/components/library/DecorationLibrary.jsx**
```javascript
import { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import './DecorationLibrary.css';

export default function DecorationLibrary({ decorations, onSelect }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);

  const filteredDecorations = useMemo(() => {
    return decorations.filter(dec => {
      // Filtro por pesquisa
      if (searchQuery && !dec.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filtro por categoria
      if (selectedCategory !== 'all' && dec.category !== selectedCategory) {
        return false;
      }
      
      // Filtro por tags
      if (selectedTags.length > 0) {
        const hasTag = selectedTags.some(tag => dec.tags.includes(tag));
        if (!hasTag) return false;
      }
      
      return true;
    });
  }, [decorations, searchQuery, selectedCategory, selectedTags]);

  const categories = ['all', 'ball', 'arc', 'star', 'pendant'];
  const allTags = [...new Set(decorations.flatMap(d => d.tags))];

  return (
    <div className="decoration-library">
      <h2>Biblioteca de Decorações</h2>

      {/* Pesquisa */}
      <input
        type="text"
        placeholder="Pesquisar..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
      />

      {/* Filtro por categoria */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat}
            className={selectedCategory === cat ? 'active' : ''}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all' ? 'Todas' : cat}
          </button>
        ))}
      </div>

      {/* Tags */}
      <div className="tags-filter">
        {allTags.map(tag => (
          <button
            key={tag}
            className={selectedTags.includes(tag) ? 'active' : ''}
            onClick={() => {
              if (selectedTags.includes(tag)) {
                setSelectedTags(selectedTags.filter(t => t !== tag));
              } else {
                setSelectedTags([...selectedTags, tag]);
              }
            }}
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Grid de decorações */}
      <div className="decorations-grid">
        {filteredDecorations.map(decoration => (
          <DecorationCard
            key={decoration.id}
            decoration={decoration}
            onSelect={() => onSelect(decoration)}
          />
        ))}
      </div>
    </div>
  );
}

function DecorationCard({ decoration, onSelect }) {
  const [showNight, setShowNight] = useState(false);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'DECORATION',
    item: { decoration },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className={`decoration-card ${isDragging ? 'dragging' : ''}`}
      onMouseEnter={() => setShowNight(true)}
      onMouseLeave={() => setShowNight(false)}
      onClick={onSelect}
    >
      <img
        src={showNight ? decoration.thumbnailNightUrl : decoration.thumbnailUrl}
        alt={decoration.name}
      />
      <p>{decoration.name}</p>
      <div className="decoration-meta">
        <span>{decoration.category}</span>
        <span>{decoration.width}x{decoration.height}</span>
      </div>
    </div>
  );
}
```

---

## 8. Funcionalidades Mock/IA

### 8.1 Snapping Inteligente

**client/src/utils/snapping.js**
```javascript
const SNAP_DISTANCE = 10; // pixels
const GRID_SIZE = 20;

export function applySmartSnapping(position, existingElements) {
  let snappedX = position.x;
  let snappedY = position.y;
  
  // 1. Snapping a grid
  const gridX = Math.round(position.x / GRID_SIZE) * GRID_SIZE;
  const gridY = Math.round(position.y / GRID_SIZE) * GRID_SIZE;
  
  if (Math.abs(position.x - gridX) < SNAP_DISTANCE) {
    snappedX = gridX;
  }
  if (Math.abs(position.y - gridY) < SNAP_DISTANCE) {
    snappedY = gridY;
  }
  
  // 2. Snapping a outros elementos
  for (const element of existingElements) {
    // Snapping horizontal
    if (Math.abs(position.x - element.xPosition) < SNAP_DISTANCE) {
      snappedX = element.xPosition;
    }
    if (Math.abs(position.x - (element.xPosition + element.decoration.width)) < SNAP_DISTANCE) {
      snappedX = element.xPosition + element.decoration.width;
    }
    
    // Snapping vertical
    if (Math.abs(position.y - element.yPosition) < SNAP_DISTANCE) {
      snappedY = element.yPosition;
    }
    if (Math.abs(position.y - (element.yPosition + element.decoration.height)) < SNAP_DISTANCE) {
      snappedY = element.yPosition + element.decoration.height;
    }
  }
  
  return { x: snappedX, y: snappedY };
}

// Detectar colisões
export function detectCollision(element1, element2) {
  const rect1 = {
    x: element1.xPosition,
    y: element1.yPosition,
    width: element1.decoration.width * element1.scale,
    height: element1.decoration.height * element1.scale,
  };
  
  const rect2 = {
    x: element2.xPosition,
    y: element2.yPosition,
    width: element2.decoration.width * element2.scale,
    height: element2.decoration.height * element2.scale,
  };
  
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}
```

### 8.2 Day→Night Conversion (Mock)

**client/src/services/mockAI.js**
```javascript
// Simulação de conversão day→night
export function convertToNight(imageUrl) {
  // Na realidade, aplicamos filtros CSS
  // Numa app real, usaríamos uma API de IA
  
  return {
    nightImageUrl: imageUrl, // Mesma imagem com filtros CSS
    filters: {
      brightness: 0.4,
      contrast: 1.2,
      saturate: 0.8,
      hue: '210deg', // Azulado
    },
    success: true,
  };
}

// Detecção de contexto na imagem (mock)
export function detectImageContext(imageUrl) {
  // Mock: retornar dados aleatórios
  const mockDetections = [
    { type: 'building', x: 100, y: 50, confidence: 0.95 },
    { type: 'pole', x: 300, y: 100, confidence: 0.87 },
    { type: 'tree', x: 500, y: 150, confidence: 0.92 },
  ];
  
  return {
    detections: mockDetections,
    suggestions: generateSuggestions(mockDetections),
  };
}

function generateSuggestions(detections) {
  const suggestions = [];
  
  detections.forEach(detection => {
    if (detection.type === 'pole') {
      suggestions.push({
        decorationCategory: 'pendant',
        position: { x: detection.x, y: detection.y + 50 },
        reason: 'Pendente adequado para poste',
      });
    }
    
    if (detection.type === 'building') {
      suggestions.push({
        decorationCategory: 'arc',
        position: { x: detection.x - 50, y: detection.y + 100 },
        reason: 'Arco decorativo para fachada',
      });
    }
  });
  
  return suggestions;
}

// Validação visual
export function validateProject(elements, baseImage) {
  const warnings = [];
  
  // Verificar se há elementos
  if (elements.length === 0) {
    warnings.push({
      type: 'error',
      message: 'Projeto sem decorações',
    });
  }
  
  // Verificar coordenadas
  elements.forEach(element => {
    if (element.xPosition < 0 || element.yPosition < 0) {
      warnings.push({
        type: 'warning',
        message: `Elemento "${element.decoration.name}" fora dos limites`,
      });
    }
  });
  
  // Verificar sobreposições
  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      if (detectCollision(elements[i], elements[j])) {
        warnings.push({
          type: 'warning',
          message: 'Elementos sobrepostos detectados',
        });
      }
    }
  }
  
  return {
    isValid: warnings.filter(w => w.type === 'error').length === 0,
    warnings,
  };
}
```

---

## 9. Sistema de Validação

**client/src/services/validation.js**
```javascript
export function validateProjectBeforeExport(project, elements) {
  const errors = [];
  const warnings = [];
  
  // Validações obrigatórias
  if (!project.name || project.name.trim() === '') {
    errors.push('Nome do projeto é obrigatório');
  }
  
  if (!project.clientName || project.clientName.trim() === '') {
    errors.push('Nome do cliente é obrigatório');
  }
  
  if (!project.baseImageUrl) {
    errors.push('Imagem base é obrigatória');
  }
  
  if (elements.length === 0) {
    errors.push('Projeto deve ter pelo menos uma decoração');
  }
  
  // Validações de alerta
  if (elements.length > 50) {
    warnings.push('Projeto com muitos elementos pode afetar performance');
  }
  
  elements.forEach((element, index) => {
    if (!element.decoration) {
      errors.push(`Elemento ${index + 1} sem decoração associada`);
    }
    
    if (element.xPosition < 0 || element.yPosition < 0) {
      warnings.push(`Elemento "${element.decoration?.name}" com coordenadas negativas`);
    }
    
    if (element.scale < 0.1 || element.scale > 5) {
      warnings.push(`Elemento "${element.decoration?.name}" com escala incomum`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
```

---

## 10. Export e Job Tickets

**client/src/services/exportService.js**
```javascript
export function generateJobTicket(project, elements) {
  return {
    projectId: project.id,
    projectName: project.name,
    projectType: project.projectType,
    client: project.clientName,
    location: project.location,
    baseImage: project.baseImageUrl,
    
    elements: elements.map(element => ({
      decorationId: element.decorationId,
      name: element.decoration.name,
      category: element.decoration.category,
      position: {
        x: Math.round(element.xPosition),
        y: Math.round(element.yPosition),
      },
      scale: element.scale,
      rotation: element.rotation,
      zIndex: element.zIndex,
      properties: {
        width: element.decoration.width,
        height: element.decoration.height,
        tags: element.decoration.tags,
      },
    })),
    
    metadata: {
      totalElements: elements.length,
      createdAt: new Date().toISOString(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    },
  };
}

export function downloadJobTicketJSON(jobTicket) {
  const dataStr = JSON.stringify(jobTicket, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `job-ticket-${jobTicket.projectId}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
}
```

---

## 📚 Próximo Documento

Ver `03_TECNOLOGIAS_E_FERRAMENTAS.md` para:
- Stack tecnológico completo
- Ferramentas IA recomendadas
- Bibliotecas e packages
- Configurações de desenvolvimento

