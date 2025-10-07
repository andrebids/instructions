# Dashboard com HeroUI - Implementação

> Exemplo de implementação do dashboard usando HeroUI components

---

## 🎯 Setup Inicial

### Instalação

```bash
cd client

# Instalar HeroUI
pnpm add @heroui/react framer-motion

# Adicionar componentes necessários
pnpm heroui add button card table badge progress modal input
```

### Configuração Tailwind

**hero.ts**
```typescript
import { heroui } from "@heroui/react";

export default {
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: "#2196F3",
            secondary: "#FF9800",
            success: "#4CAF50",
            warning: "#FFC107",
            danger: "#F44336",
          },
        },
      },
    }),
  ],
};
```

**main.css**
```css
@import "@heroui/theme/dist/index.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Provider Setup

**main.jsx**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HeroUIProvider } from '@heroui/react';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HeroUIProvider>
  </React.StrictMode>
);
```

---

## 📊 Dashboard Completo

**client/src/pages/Dashboard.jsx**

```javascript
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Avatar,
  Progress,
  Tabs,
  Tab,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
} from '@heroui/react';
import { projectsAPI } from '../services/api';
import { format } from 'date-fns';
import { ptPT } from 'date-fns/locale';

export default function Dashboard() {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProject, setSelectedProject] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [stats, setStats] = useState({
    ongoing: 0,
    needsAttention: 0,
    approved: 0,
    avgDays: 0,
  });
  const [projects, setProjects] = useState([]);
  const [alertProjects, setAlertProjects] = useState([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data } = await projectsAPI.getAll();
      
      // Calcular stats
      const ongoing = data.filter(p => p.status === 'ongoing');
      const needsAttention = data.filter(p => 
        p.status === 'ongoing' && (p.feedbackDesigner || isOld(p))
      );
      
      setStats({
        ongoing: ongoing.length,
        needsAttention: needsAttention.length,
        approved: data.filter(p => p.status === 'approved').length,
        avgDays: calculateAvgDays(data),
      });
      
      setProjects(data.slice(0, 10));
      setAlertProjects(needsAttention);
    } catch (error) {
      console.error('Erro:', error);
    }
  }

  function isOld(project) {
    const days = Math.floor(
      (new Date() - new Date(project.createdAt)) / (1000 * 60 * 60 * 24)
    );
    return days > 7;
  }

  function calculateAvgDays(projects) {
    const finished = projects.filter(p => 
      p.status === 'finished' || p.status === 'approved'
    );
    if (finished.length === 0) return 0;
    
    const total = finished.reduce((sum, p) => {
      const days = Math.floor(
        (new Date(p.updatedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24)
      );
      return sum + days;
    }, 0);
    
    return Math.round(total / finished.length);
  }

  function handleRequestChanges(project) {
    setSelectedProject(project);
    setFeedback('');
    onOpen();
  }

  async function submitFeedback() {
    try {
      await projectsAPI.update(selectedProject.id, {
        feedbackDesigner: feedback,
        status: 'ongoing',
      });
      onClose();
      loadDashboard();
    } catch (error) {
      console.error('Erro:', error);
    }
  }

  const filteredProjects = statusFilter === 'all' 
    ? projects 
    : projects.filter(p => p.status === statusFilter);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Gestão de Projetos de Decoração</p>
        </div>
        <Button 
          color="primary" 
          size="lg"
          onPress={() => navigate('/projects/new')}
        >
          + Criar Novo Projeto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="text-4xl">⏳</div>
            <div>
              <p className="text-sm text-gray-500">Em Curso</p>
              <p className="text-3xl font-bold">{stats.ongoing}</p>
            </div>
          </CardBody>
        </Card>

        <Card className={stats.needsAttention > 0 ? 'border-2 border-warning' : ''}>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="text-4xl">⚠️</div>
            <div>
              <p className="text-sm text-gray-500">A Precisar Atenção</p>
              <p className="text-3xl font-bold text-warning">{stats.needsAttention}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="text-4xl">✓</div>
            <div>
              <p className="text-sm text-gray-500">Aprovados (mês)</p>
              <p className="text-3xl font-bold text-success">{stats.approved}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="flex flex-row items-center gap-4">
            <div className="text-4xl">📊</div>
            <div>
              <p className="text-sm text-gray-500">Tempo Médio</p>
              <p className="text-3xl font-bold">{stats.avgDays} dias</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Alert Projects */}
      {alertProjects.length > 0 && (
        <Card className="mb-8 bg-warning-50 border-2 border-warning">
          <CardHeader>
            <h3 className="text-xl font-bold text-warning">
              ⚠️ Projetos a Precisar Atenção
            </h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {alertProjects.map(project => (
                <div 
                  key={project.id}
                  className="flex justify-between items-center bg-white p-3 rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{project.name}</p>
                    <p className="text-sm text-gray-500">
                      {project.feedbackDesigner 
                        ? 'Com feedback pendente' 
                        : 'Em curso há muito tempo'}
                    </p>
                  </div>
                  <Button 
                    as={Link} 
                    to={`/projects/${project.id}`}
                    size="sm"
                    color="warning"
                    variant="flat"
                  >
                    Ver Projeto
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Projects History */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Histórico de Projetos</h3>
          <Tabs 
            selectedKey={statusFilter}
            onSelectionChange={setStatusFilter}
            size="sm"
          >
            <Tab key="all" title="Todos" />
            <Tab key="ongoing" title="Em Curso" />
            <Tab key="finished" title="Finalizados" />
            <Tab key="approved" title="Aprovados" />
          </Tabs>
        </CardHeader>
        <CardBody>
          <Table aria-label="Histórico de projetos">
            <TableHeader>
              <TableColumn>PREVIEW</TableColumn>
              <TableColumn>PROJETO</TableColumn>
              <TableColumn>CLIENTE</TableColumn>
              <TableColumn>TIPO</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>DATA</TableColumn>
              <TableColumn>AÇÕES</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredProjects.map(project => (
                <TableRow key={project.id}>
                  <TableCell>
                    <Avatar 
                      src={project.baseImageUrl || '/placeholder.png'}
                      radius="sm"
                      size="lg"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <Link 
                        to={`/projects/${project.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {project.name}
                      </Link>
                      {project.feedbackDesigner && (
                        <Chip 
                          size="sm" 
                          color="warning" 
                          variant="flat"
                          className="ml-2"
                        >
                          💬 Feedback
                        </Chip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{project.clientName}</TableCell>
                  <TableCell>
                    <Chip 
                      color={project.projectType === 'decor' ? 'success' : 'primary'}
                      variant="flat"
                    >
                      {project.projectType === 'decor' ? '🎨 Decor' : '🔧 Simu'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={project.status} />
                  </TableCell>
                  <TableCell>
                    {format(new Date(project.createdAt), 'dd/MM/yyyy', { locale: ptPT })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        as={Link}
                        to={`/projects/${project.id}`}
                        size="sm"
                        color="primary"
                        variant="flat"
                      >
                        Ver
                      </Button>
                      {project.status !== 'created' && (
                        <Button 
                          size="sm"
                          color="warning"
                          variant="flat"
                          onPress={() => handleRequestChanges(project)}
                        >
                          Pedir Alterações
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-6 text-center">
            <Button 
              as={Link}
              to="/projects"
              color="default"
              variant="bordered"
            >
              Ver Todos os Projetos ({stats.ongoing + stats.approved})
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Quick Create */}
      <div className="mt-8 text-center">
        <h3 className="text-xl font-bold mb-4">Criar Projeto Rápido</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Card 
            isPressable
            onPress={() => navigate('/projects/new?type=decor')}
            className="hover:scale-105 transition-transform"
          >
            <CardBody className="text-center p-8">
              <div className="text-6xl mb-4">🎨</div>
              <h4 className="text-xl font-bold mb-2">Projeto Decor</h4>
              <p className="text-gray-500">Decorações visuais</p>
            </CardBody>
          </Card>

          <Card 
            isPressable
            onPress={() => navigate('/projects/new?type=simu')}
            className="hover:scale-105 transition-transform"
          >
            <CardBody className="text-center p-8">
              <div className="text-6xl mb-4">🔧</div>
              <h4 className="text-xl font-bold mb-2">Projeto Simu</h4>
              <p className="text-gray-500">Dados técnicos</p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal Pedir Alterações */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>Pedir Alterações</ModalHeader>
          <ModalBody>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Projeto:</p>
              <p className="font-semibold">{selectedProject?.name}</p>
            </div>
            <Textarea
              label="Que alterações pretende?"
              placeholder="Descreva as alterações necessárias..."
              value={feedback}
              onValueChange={setFeedback}
              minRows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Cancelar
            </Button>
            <Button 
              color="primary" 
              onPress={submitFeedback}
              isDisabled={!feedback.trim()}
            >
              Enviar Feedback
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

function StatusChip({ status }) {
  const config = {
    created: { label: 'Criado', color: 'default', icon: '📝' },
    ongoing: { label: 'Em Curso', color: 'warning', icon: '⏳' },
    finished: { label: 'Finalizado', color: 'primary', icon: '✓' },
    approved: { label: 'Aprovado', color: 'success', icon: '✓✓' },
    canceled: { label: 'Cancelado', color: 'danger', icon: '✗' },
  };
  
  const { label, color, icon } = config[status] || config.created;
  
  return (
    <Chip color={color} variant="flat">
      {icon} {label}
    </Chip>
  );
}
```

---

## 🎨 Vantagens desta Implementação

### 1. **Código Mais Limpo**
- Menos CSS custom
- Componentes auto-estilizados
- Responsivo automático

### 2. **Funcionalidades Grátis**
- Modal pronto com animações
- Table com sorting (se ativar)
- Chips coloridos
- Hover states
- Focus states para acessibilidade

### 3. **Dark Mode (Bonus)**
```javascript
// Adicionar toggle
import { Switch } from '@heroui/react';

<Switch
  defaultSelected
  size="sm"
  color="secondary"
  startContent={<span>☀️</span>}
  endContent={<span>🌙</span>}
>
  Dark mode
</Switch>
```

### 4. **Desenvolvimento Rápido**
- Dashboard completo em ~200 linhas
- Vs ~500 linhas com CSS custom

---

## 📊 Comparação Visual

### Antes (CSS Puro)
```javascript
// Tens de criar tudo
<div className="stat-card stat-orange">
  <span className="stat-icon">⏳</span>
  <div className="stat-content">
    <h3>Em Curso</h3>
    <p className="stat-value">12</p>
  </div>
</div>

// + 50 linhas de CSS
```

### Depois (HeroUI)
```javascript
// Já está pronto
<Card>
  <CardBody className="flex flex-row items-center gap-4">
    <div className="text-4xl">⏳</div>
    <div>
      <p className="text-sm text-gray-500">Em Curso</p>
      <p className="text-3xl font-bold">{stats.ongoing}</p>
    </div>
  </CardBody>
</Card>

// 0 linhas de CSS custom
```

---

## ✅ Recomendação Final

**Usa HeroUI para:**
- Dashboard
- Formulários (Create Project)
- Modals e Dialogs
- Tables e Lists
- Buttons e Badges

**Mantém custom para:**
- Canvas de design (Fabric.js)
- Drag & Drop específico
- Animações muito específicas

---

## 🚀 Próximos Passos

1. Instalar HeroUI no projeto
2. Configurar tema com cores do projeto
3. Implementar dashboard com componentes HeroUI
4. Testar responsividade
5. Adicionar dark mode (opcional)

---

**Resultado:** Dashboard profissional em 1/3 do tempo! 🎉

