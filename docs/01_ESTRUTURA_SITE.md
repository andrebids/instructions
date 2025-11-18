# Estrutura do Site - Instructions Project (DEMO)

> **NOTA IMPORTANTE**: Esta é uma aplicação de **DEMONSTRAÇÃO**. Todas as funcionalidades IA, conversões day2night, e base de dados de decorações são **SIMULADAS/MOCK** para fins de apresentação.

---

## 📋 Visão Geral

Sistema de gestão de projetos de decoração luminosa que permite:
- Criar e gerir projetos (tipo Decor ou Simu)
- Biblioteca visual de decorações
- Workflow progressivo (Comercial → Designer)
- Preview noturno automático (simulado)
- Sistema de validação e aprovação

---

## 🗂️ Estrutura de Diretórios

```
instructions-project/
├── client/                          # Frontend React
│   ├── public/
│   │   ├── demo-images/            # Imagens de demonstração
│   │   │   ├── decorations/        # Catálogo de peças (mock)
│   │   │   ├── buildings/          # Imagens de fachadas (demo)
│   │   │   └── results/            # Resultados de exemplo
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/             # Componentes reutilizáveis
│   │   │   ├── layout/             # Layout, Header, Sidebar
│   │   │   ├── projects/           # Componentes de projetos
│   │   │   ├── canvas/             # Canvas de design
│   │   │   └── library/            # Biblioteca visual
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Página inicial
│   │   │   ├── ProjectHistory.jsx  # Lista de projetos
│   │   │   ├── ProjectDetails.jsx  # Detalhes de projeto
│   │   │   ├── CreateProject.jsx   # Criar projeto
│   │   │   ├── CommercialMode.jsx  # Modo comercial
│   │   │   └── DesignerMode.jsx    # Modo designer
│   │   │
│   │   ├── services/
│   │   │   ├── api.js              # Cliente API
│   │   │   ├── mockAI.js           # IA simulada (day2night, detection)
│   │   │   └── validation.js       # Validação de projetos
│   │   │
│   │   ├── utils/
│   │   │   ├── canvas.js           # Utilitários canvas
│   │   │   ├── snapping.js         # Snapping inteligente
│   │   │   └── coordinates.js      # Gestão de coordenadas
│   │   │
│   │   ├── hooks/
│   │   │   ├── useDragDrop.js      # Hook drag & drop
│   │   │   ├── useCanvas.js        # Hook gestão canvas
│   │   │   └── useProject.js       # Hook gestão projeto
│   │   │
│   │   ├── context/
│   │   │   ├── ProjectContext.jsx  # Estado global projeto
│   │   │   └── AuthContext.jsx     # Autenticação (mock)
│   │   │
│   │   ├── styles/
│   │   │   ├── global.css          # Estilos globais
│   │   │   └── variables.css       # Variáveis CSS
│   │   │
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Backend Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── projectController.js
│   │   │   ├── decorationController.js
│   │   │   └── exportController.js
│   │   │
│   │   ├── models/
│   │   │   ├── Project.js          # Modelo projeto
│   │   │   ├── Decoration.js       # Modelo decoração
│   │   │   └── JobTicket.js        # Modelo job ticket
│   │   │
│   │   ├── routes/
│   │   │   ├── projects.js
│   │   │   ├── decorations.js
│   │   │   └── export.js
│   │   │
│   │   ├── services/
│   │   │   ├── mockAIService.js    # Serviços IA simulados
│   │   │   ├── validationService.js
│   │   │   └── exportService.js    # Exportar JSON
│   │   │
│   │   ├── utils/
│   │   │   ├── seedData.js         # Popular BD com dados demo
│   │   │   └── logger.js
│   │   │
│   │   ├── config/
│   │   │   ├── database.js         # Config PostgreSQL
│   │   │   └── constants.js
│   │   │
│   │   └── app.js
│   │
│   ├── package.json
│   └── .env.example
│
├── database/
│   ├── migrations/                  # Migrações Sequelize
│   ├── seeders/                     # Dados de demonstração
│   └── schema.sql                   # Schema PostgreSQL
│
├── docs/
│   ├── API.md                       # Documentação API
│   ├── MOCK_DATA.md                 # Estrutura dados mock
│   └── WORKFLOW.md                  # Fluxo de trabalho
│
├── package.json
└── README.md
```

---

## 📄 Páginas da Aplicação

### 0. **Login** (`/login`)
- Página inicial de autenticação
- Formulário email + password
- "Lembrar-me"
- Recuperar password (mock)
- Design moderno com HeroUI
- Redireciona para dashboard após login

### 1. **Dashboard** (`/`)
**Visão Geral e Controlo Central**

- **Estatísticas em destaque:**
  - Total de projetos em curso
  - Projetos a aguardar alterações
  - Projetos aprovados este mês
  - Média de tempo de conclusão
  
- **Ação rápida principal:**
  - Botão grande e visível: "Criar Novo Projeto"
  - Atalho direto para tipo Decor/Simu
  
- **Histórico de projetos recente (últimos 10):**
  - Tabela/cards com preview miniatura
  - Status visual (cores)
  - Botão "Pedir Alterações" direto
  - Filtro rápido por status
  - Link para ver projeto completo
  
- **Secção de projetos a precisar atenção:**
  - Projetos com feedback pendente
  - Projetos em curso há mais de X dias
  - Alertas de validação

### 2. **Project History** (`/projects`)
- Tabela com todos os projetos
- Filtros: data, tipo, status, favoritos
- Preview de miniaturas
- Status: `created`, `ongoing`, `canceled`, `finished`, `approved`
- Ações: Ver detalhes, Duplicar, Eliminar

### 3. **Project Details** (`/projects/:id`)
- Informação completa do projeto
- Simulações realizadas (imagens/vídeos demo)
- Logos criados (PDF viewer mock)
- Quantidades exportadas
- Preview de orçamento (mock)
- Histórico de alterações
- Campo de feedback do designer
- Botão: "Voltar ao Comercial"

### 4. **Create Project** (`/projects/new`)
- **Toggle Decor ↔ Simu**
- Formulário inteligente que adapta campos
- Upload de imagem (foto base)
- Informações básicas:
  - Nome do projeto
  - Cliente
  - Localização
  - Data prevista
  - Tipo (Decor/Simu)

### 5. **Choose Workflow** (`/projects/:id/workflow`)
- Seleção do modo de trabalho:
  - **Commercial Mode** (Instruções)
  - **Designer Mode** (Refinamento)
- Explicação de cada modo

### 6. **Commercial Mode** (`/projects/:id/commercial`)
- Canvas principal com imagem base
- Sidebar com biblioteca de decorações
- Ferramentas:
  - Drag & Drop de peças
  - Snapping inteligente
  - Zoom e Pan
  - Desfazer/Refazer
- Sidebar direito: propriedades da peça selecionada
- Validação visual em tempo real
- Botão: "Enviar para Designer"

### 7. **Designer Mode** (`/projects/:id/designer`)
- Canvas com resultado do Commercial Mode
- Ferramentas avançadas:
  - Ajuste de luz ambiente
  - Conversão Day→Night (mock)
  - Ajuste de intensidade luminosa
  - Texturas (simulado)
- Preview em tempo real
- Histórico de alterações
- Botão: "Voltar ao Comercial" / "Aprovar e Exportar"

### 8. **Gestão de Utilizadores** (`/users`)
- Tabela de utilizadores com HeroUI Table
- Colunas: Avatar, Nome, Email, Role, Status, Último Login, Ações
- Filtros: Role, Status (ativo/inativo)
- Pesquisa por nome/email
- Ações: Editar, Desativar/Ativar, Ver histórico
- Modal de criação/edição de utilizador
- Permissões por role

### 9. **Biblioteca Visual** (Modal/Sidebar)
- Catálogo com miniaturas de decorações
- Pesquisa por tags: `bola`, `arco`, `estrela`, `pendente`, etc.
- Filtros:
  - Tipo
  - Cor
  - Tamanho
  - Categoria
- Preview noturno ao passar o rato (mock)

---

## 🎨 Componentes Principais

### Layout
- `Header` - Navegação principal
- `Sidebar` - Menu lateral
- `Footer` - Informação básica

### Projects
- `ProjectCard` - Card de projeto na lista
- `ProjectForm` - Formulário criar/editar
- `ProjectStatusBadge` - Badge de status
- `ProjectFilters` - Filtros da lista

### Canvas
- `DesignCanvas` - Canvas principal de design
- `CanvasToolbar` - Barra de ferramentas
- `DecorationItem` - Item arrastável no canvas
- `GridOverlay` - Grid de snapping
- `ZoomControls` - Controlos de zoom

### Library
- `DecorationLibrary` - Biblioteca completa
- `DecorationCard` - Card de decoração
- `SearchBar` - Pesquisa com tags
- `FilterPanel` - Painel de filtros

### Common
- `Button` - Botão reutilizável
- `Modal` - Modal genérico
- `Tabs` - Componente tabs
- `Toggle` - Toggle Decor↔Simu
- `FileUpload` - Upload de imagens
- `PreviewImage` - Preview com zoom

---

## 🗄️ Estrutura Base de Dados (PostgreSQL)

### Tabela: `users`
```sql
id, name, email, password_hash, role (admin/designer/comercial),
avatar_url, created_at, last_login_at, is_active
```

### Tabela: `projects`
```sql
id, name, client_name, location, project_type (decor/simu),
status (created/ongoing/canceled/finished/approved),
base_image_url, created_at, updated_at, is_favorite
```

### Tabela: `decorations`
```sql
id, name, category, tags[], thumbnail_url, thumbnail_night_url,
width, height, description, created_at
```

### Tabela: `project_elements`
```sql
id, project_id, decoration_id, x_position, y_position,
scale, rotation, z_index, created_at
```

### Tabela: `project_history`
```sql
id, project_id, action, description, snapshot_data (JSON),
created_at, created_by
```

### Tabela: `job_tickets`
```sql
id, project_id, ticket_data (JSON), export_date, created_at
```

---

## 🔄 Fluxo de Trabalho

```
1. Dashboard
   ↓
2. Create Project (escolher tipo: Decor/Simu)
   ↓
3. Choose Workflow
   ↓
4a. Commercial Mode (colocar decorações)
   ↓
4b. Designer Mode (refinar e simular)
   ↓
5. Approval & Export (gerar Job Ticket JSON)
   ↓
6. Project History (guardar resultado)
```

---

## 📦 Formato Job Ticket JSON

```json
{
  "projectId": "uuid",
  "projectName": "string",
  "projectType": "decor|simu",
  "client": "string",
  "baseImage": "url",
  "elements": [
    {
      "decorationId": "uuid",
      "name": "string",
      "position": { "x": 0, "y": 0 },
      "scale": 1.0,
      "rotation": 0,
      "properties": {}
    }
  ],
  "metadata": {
    "totalElements": 0,
    "createdBy": "string",
    "createdAt": "timestamp",
    "lastModified": "timestamp"
  }
}
```

---

## 🎯 Funcionalidades MOCK (Simuladas)

Estas funcionalidades são **demonstrações visuais** sem IA real:

1. **Day→Night Conversion**
   - Aplicar filtro CSS escuro + ajuste de contraste
   - Adicionar overlay azulado
   - Aumentar brilho de elementos luminosos

2. **AI Context Detection**
   - Retornar posições pré-definidas aleatórias
   - Sugerir decorações baseadas em regras simples

3. **Auto-Suggestions**
   - Lista pré-definida baseada no tipo de projeto
   - Recomendações hardcoded

4. **Smart Snapping**
   - Snapping a grid (cada 10px)
   - Snapping a outros elementos (bounding box)
   - Magnetismo simulado

---

## 🚀 Próximos Passos

Ver documentos:
- `02_GUIA_IMPLEMENTACAO_DETALHADO.md` - Como implementar cada página
- `03_TECNOLOGIAS_E_FERRAMENTAS.md` - Stack tecnológico completo

