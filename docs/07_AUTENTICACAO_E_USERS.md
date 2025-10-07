# Sistema de Autenticação e Gestão de Utilizadores

> Implementação completa de login, users e permissões com HeroUI

---

## 🔐 Arquitetura de Autenticação

### Sistema de Roles
- **Admin** - Acesso total, gestão de utilizadores
- **Designer** - Refinar projetos, aprovar, exportar
- **Comercial** - Criar projetos, modo comercial

### Fluxo de Autenticação
```
1. Login (/login)
   ↓
2. Validar credenciais (backend)
   ↓
3. Gerar token JWT
   ↓
4. Guardar em localStorage
   ↓
5. Redirecionar para Dashboard
   ↓
6. Verificar token em cada request
```

---

## 🗄️ Base de Dados - Users

### Tabela: `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'comercial',
  avatar_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

### Modelo Sequelize

**server/src/models/User.js**
```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('admin', 'designer', 'comercial'),
    defaultValue: 'comercial',
  },
  avatarUrl: {
    type: DataTypes.STRING,
    field: 'avatar_url',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at',
  },
}, {
  timestamps: true,
  underscored: true,
});

// Método para verificar password
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Hook para hash password antes de criar
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
  }
});

// Hook para hash password antes de atualizar
User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
  }
});

module.exports = User;
```

### Seed de Utilizadores Demo

**server/src/utils/seedUsers.js**
```javascript
const { User } = require('../models');

const usersSeed = [
  {
    name: 'Admin Demo',
    email: 'admin@demo.com',
    passwordHash: 'demo123', // Será hasheado automaticamente
    role: 'admin',
    avatarUrl: '/demo-images/avatars/admin.png',
  },
  {
    name: 'Designer João',
    email: 'designer@demo.com',
    passwordHash: 'demo123',
    role: 'designer',
    avatarUrl: '/demo-images/avatars/designer.png',
  },
  {
    name: 'Comercial Maria',
    email: 'comercial@demo.com',
    passwordHash: 'demo123',
    role: 'comercial',
    avatarUrl: '/demo-images/avatars/comercial.png',
  },
];

async function seedUsers() {
  for (const userData of usersSeed) {
    await User.findOrCreate({
      where: { email: userData.email },
      defaults: userData,
    });
  }
  console.log('✅ Utilizadores demo criados');
}

module.exports = { seedUsers };
```

---

## 🔧 Backend - API de Autenticação

### Dependências Adicionais
```bash
cd server
npm install bcrypt jsonwebtoken express-jwt
```

### Auth Controller

**server/src/controllers/authController.js**
```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validar input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }
    
    // Buscar utilizador
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Verificar se está ativo
    if (!user.isActive) {
      return res.status(401).json({ error: 'Utilizador desativado' });
    }
    
    // Verificar password
    const isValid = await user.validatePassword(password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }
    
    // Atualizar último login
    await user.update({ lastLoginAt: new Date() });
    
    // Gerar token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Retornar dados do utilizador (sem password)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

exports.me = async (req, res) => {
  try {
    // req.user vem do middleware de autenticação
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizador' });
  }
};

exports.logout = async (req, res) => {
  // Em JWT, logout é feito no client (remover token)
  res.json({ message: 'Logout efetuado com sucesso' });
};
```

### Users Controller

**server/src/controllers/userController.js**
```javascript
const { User } = require('../models');
const { Op } = require('sequelize');

exports.getAll = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const where = {};
    
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    const users = await User.findAll({
      where,
      attributes: { exclude: ['passwordHash'] },
      order: [['createdAt', 'DESC']],
    });
    
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar utilizadores:', error);
    res.status(500).json({ error: 'Erro ao listar utilizadores' });
  }
};

exports.getById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash'] },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar utilizador:', error);
    res.status(500).json({ error: 'Erro ao buscar utilizador' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validar input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e password são obrigatórios' });
    }
    
    // Verificar se email já existe
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }
    
    const user = await User.create({
      name,
      email,
      passwordHash: password, // Será hasheado no hook
      role: role || 'comercial',
    });
    
    // Retornar sem password
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Erro ao criar utilizador:', error);
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, email, password, role, isActive } = req.body;
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.passwordHash = password;
    if (role) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    
    await user.update(updates);
    
    const userResponse = user.toJSON();
    delete userResponse.passwordHash;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Erro ao atualizar utilizador:', error);
    res.status(500).json({ error: 'Erro ao atualizar utilizador' });
  }
};

exports.delete = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    // Soft delete - desativar em vez de eliminar
    await user.update({ isActive: false });
    
    res.json({ message: 'Utilizador desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao eliminar utilizador:', error);
    res.status(500).json({ error: 'Erro ao eliminar utilizador' });
  }
};
```

### Middleware de Autenticação

**server/src/middleware/auth.js**
```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

exports.requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    
    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Sem permissão' });
    }
    
    next();
  };
};
```

### Routes

**server/src/routes/auth.js**
```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
```

**server/src/routes/users.js**
```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(requireAuth);

// Apenas admin pode gerir utilizadores
router.get('/', requireRole('admin'), userController.getAll);
router.get('/:id', requireRole('admin'), userController.getById);
router.post('/', requireRole('admin'), userController.create);
router.put('/:id', requireRole('admin'), userController.update);
router.delete('/:id', requireRole('admin'), userController.delete);

module.exports = router;
```

### App.js Atualizado

**server/src/app.js**
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const decorationRoutes = require('./routes/decorations');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/decorations', decorationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', env: 'demo' });
});

const PORT = process.env.PORT || 5000; // Mudado de 3001

sequelize.sync().then(() => {
  console.log('✅ Base de dados sincronizada');
  app.listen(PORT, () => {
    console.log(`🚀 Servidor em http://localhost:${PORT}`);
  });
});

module.exports = app;
```

---

## 🎨 Frontend - Login e Autenticação

### Auth Context

**client/src/context/AuthContext.jsx**
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { data } = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(data);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }

  async function login(email, password) {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    setUser(null);
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDesigner: user?.role === 'designer',
    isComercial: user?.role === 'comercial',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Axios Interceptor

**client/src/services/api.js**
```javascript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export default api;
```

### Página de Login com HeroUI

**client/src/pages/Login.jsx**
```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Input,
  Button,
  Checkbox,
  Divider,
} from '@heroui/react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col gap-3 items-center pt-8">
          <div className="text-6xl">🎨</div>
          <div className="flex flex-col gap-1 items-center">
            <h1 className="text-2xl font-bold">Instructions Project</h1>
            <p className="text-sm text-gray-500">Sistema de Gestão de Decorações</p>
          </div>
        </CardHeader>

        <Divider />

        <form onSubmit={handleSubmit}>
          <CardBody className="gap-4">
            {error && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="seu@email.com"
              value={email}
              onValueChange={setEmail}
              isRequired
              variant="bordered"
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onValueChange={setPassword}
              isRequired
              variant="bordered"
            />

            <div className="flex justify-between items-center">
              <Checkbox
                size="sm"
                isSelected={remember}
                onValueChange={setRemember}
              >
                Lembrar-me
              </Checkbox>
              <Button
                size="sm"
                variant="light"
                color="primary"
                onPress={() => alert('Demo: Contactar admin')}
              >
                Esqueci a password
              </Button>
            </div>
          </CardBody>

          <Divider />

          <CardFooter className="flex flex-col gap-3">
            <Button
              type="submit"
              color="primary"
              size="lg"
              className="w-full"
              isLoading={loading}
            >
              Entrar
            </Button>

            <div className="text-sm text-center text-gray-500">
              <p className="mb-2">Utilizadores de demonstração:</p>
              <div className="space-y-1 text-xs">
                <p><strong>Admin:</strong> admin@demo.com / demo123</p>
                <p><strong>Designer:</strong> designer@demo.com / demo123</p>
                <p><strong>Comercial:</strong> comercial@demo.com / demo123</p>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
```

### Protected Route Component

**client/src/components/ProtectedRoute.jsx**
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '@heroui/react';

export default function ProtectedRoute({ children, requireRole }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireRole && user.role !== requireRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-gray-500">Não tem permissão para aceder a esta página.</p>
        </div>
      </div>
    );
  }

  return children;
}
```

### App.jsx com Autenticação

**client/src/App.jsx**
```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ProjectHistory from './pages/ProjectHistory';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<ProjectHistory />} />
        <Route path="projects/new" element={<CreateProject />} />
        <Route path="projects/:id" element={<ProjectDetails />} />
        <Route 
          path="users" 
          element={
            <ProtectedRoute requireRole="admin">
              <Users />
            </ProtectedRoute>
          } 
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <HeroUIProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </HeroUIProvider>
  );
}

export default App;
```

---

## 👥 Página de Gestão de Utilizadores

**client/src/pages/Users.jsx**
```javascript
import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Switch,
  useDisclosure,
} from '@heroui/react';
import { usersAPI } from '../services/api';
import { format } from 'date-fns';
import { ptPT } from 'date-fns/locale';

export default function Users() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'comercial',
  });

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  async function loadUsers() {
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;
      if (search) params.search = search;
      
      const { data } = await usersAPI.getAll(params);
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar utilizadores:', error);
    }
  }

  function handleNew() {
    setSelectedUser(null);
    setFormData({ name: '', email: '', password: '', role: 'comercial' });
    onOpen();
  }

  function handleEdit(user) {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    onOpen();
  }

  async function handleSubmit() {
    try {
      if (selectedUser) {
        await usersAPI.update(selectedUser.id, formData);
      } else {
        await usersAPI.create(formData);
      }
      onClose();
      loadUsers();
    } catch (error) {
      console.error('Erro ao guardar utilizador:', error);
    }
  }

  async function handleToggleActive(user) {
    try {
      await usersAPI.update(user.id, { isActive: !user.isActive });
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar utilizador:', error);
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Utilizadores</h1>
          <p className="text-gray-500 mt-1">Gerir utilizadores do sistema</p>
        </div>
        <Button color="primary" onPress={handleNew}>
          + Novo Utilizador
        </Button>
      </div>

      <Card>
        <CardHeader className="flex gap-4">
          <Input
            placeholder="Pesquisar por nome ou email..."
            value={search}
            onValueChange={setSearch}
            onKeyUp={(e) => e.key === 'Enter' && loadUsers()}
            className="max-w-xs"
          />
          <Select
            label="Filtrar por Role"
            selectedKeys={[roleFilter]}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="max-w-xs"
          >
            <SelectItem key="all" value="all">Todos</SelectItem>
            <SelectItem key="admin" value="admin">Admin</SelectItem>
            <SelectItem key="designer" value="designer">Designer</SelectItem>
            <SelectItem key="comercial" value="comercial">Comercial</SelectItem>
          </Select>
          <Button color="primary" variant="flat" onPress={loadUsers}>
            Pesquisar
          </Button>
        </CardHeader>

        <CardBody>
          <Table aria-label="Tabela de utilizadores">
            <TableHeader>
              <TableColumn>UTILIZADOR</TableColumn>
              <TableColumn>EMAIL</TableColumn>
              <TableColumn>ROLE</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>ÚLTIMO LOGIN</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatarUrl}
                        name={user.name}
                        size="sm"
                      />
                      <span className="font-semibold">{user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      color={
                        user.role === 'admin'
                          ? 'danger'
                          : user.role === 'designer'
                          ? 'primary'
                          : 'success'
                      }
                      variant="flat"
                    >
                      {user.role}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Switch
                      size="sm"
                      isSelected={user.isActive}
                      onValueChange={() => handleToggleActive(user)}
                      color="success"
                    >
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Switch>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'dd/MM/yyyy HH:mm', {
                          locale: ptPT,
                        })
                      : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={() => handleEdit(user)}
                    >
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Modal Criar/Editar */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            {selectedUser ? 'Editar Utilizador' : 'Novo Utilizador'}
          </ModalHeader>
          <ModalBody>
            <Input
              label="Nome"
              value={formData.name}
              onValueChange={(val) => setFormData({ ...formData, name: val })}
              isRequired
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onValueChange={(val) => setFormData({ ...formData, email: val })}
              isRequired
            />
            <Input
              label={selectedUser ? 'Nova Password (deixar vazio para manter)' : 'Password'}
              type="password"
              value={formData.password}
              onValueChange={(val) => setFormData({ ...formData, password: val })}
              isRequired={!selectedUser}
            />
            <Select
              label="Role"
              selectedKeys={[formData.role]}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <SelectItem key="admin" value="admin">Admin</SelectItem>
              <SelectItem key="designer" value="designer">Designer</SelectItem>
              <SelectItem key="comercial" value="comercial">Comercial</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              Guardar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
```

---

## 🔥 Hot Reload

### ✅ SIM! Vite tem Hot Module Replacement (HMR) nativo

**Funcionalidades:**
- 🔥 **Instant hot reload** - Mudanças aparecem imediatamente
- 🎯 **Preserva estado** - Componentes atualizam sem perder estado
- ⚡ **Super rápido** - ~200ms de reload
- 🔄 **Full reload fallback** - Se HMR falhar

**Configuração automática** - Já funciona out-of-the-box com Vite + React!

---

## 📝 Resumo das Alterações

### ✅ Porta Mudada
- Backend: `3001` → `5000`
- Frontend: `3000` (Vite default)

### ✅ Sistema de Login
- Página de login com HeroUI
- JWT authentication
- Context API para estado global
- Protected routes
- Interceptors Axios

### ✅ Sistema de Users
- Tabela `users` na BD
- CRUD completo
- Roles: admin/designer/comercial
- Página de gestão (só admin)
- Ativar/desativar users

### ✅ Hot Reload
- Vite HMR nativo ✓
- Funciona automaticamente ✓

---

## 🚀 Próximos Passos

1. Implementar backend com autenticação
2. Criar seed de utilizadores demo
3. Implementar página de login
4. Adicionar protected routes
5. Criar página de gestão de utilizadores
6. Testar permissões por role

**Tudo pronto para começar!** 🎉

