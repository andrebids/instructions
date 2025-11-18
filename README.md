# Instructions Project - Planos de Desenvolvimento

> Sistema de gestão de projetos de decoração luminosa (DEMONSTRAÇÃO)

---

## 🚀 **ESTADO ATUAL DO PROJETO (8 Out 2025)**

### ✅ **JÁ IMPLEMENTADO:**
- Frontend React + Vite + HeroUI funcionando em `http://localhost:3003/` ✅
- Dashboard moderno com dark mode, notificações, e estatísticas ✅
- Backend Express básico em `http://localhost:5000/` ✅
- PostgreSQL configurado (Supabase) ✅

### 📖 **COMECE AQUI:**
**[📍 ESTADO ATUAL E PRÓXIMOS PASSOS](./docs/00_ESTADO_ATUAL_PROJETO.md)** ⭐ **LEIA ESTE DOCUMENTO PRIMEIRO!**
- Resume o que está feito e o que falta
- Plano de implementação em 5 fases claras
- Indica que documento usar em cada fase

### 🎯 **PRÓXIMA FASE:**
**Fase 1:** Conectar Backend ao PostgreSQL com Sequelize (2-3h)

---

## 📌 Visão Geral

Este projeto é uma **aplicação de demonstração** para gestão de projetos de decoração luminosa, permitindo criar projetos de dois tipos (Decor/Simu) com workflow progressivo do modo comercial ao modo designer.

**⚠️ IMPORTANTE:** Todas as funcionalidades de IA, conversões day→night e bases de dados de decorações são **SIMULADAS/MOCK** para fins de apresentação.

---

## 📚 Documentação Completa

### 📍 **DOCUMENTO PRINCIPAL:**

#### [🚀 Estado Atual do Projeto](./docs/00_ESTADO_ATUAL_PROJETO.md) ⭐ **COMECE AQUI**
- ✅ O que já está implementado
- ⏳ O que falta fazer (5 fases)
- 🎯 Próximos passos imediatos
- 📖 Que documento usar em cada fase

---

### 📖 **DOCUMENTOS DE REFERÊNCIA (consulte quando necessário):**

### 1. [Estrutura do Site](./docs/01_ESTRUTURA_SITE.md)
- Arquitetura completa da aplicação
- Estrutura de diretórios
- Páginas e componentes
- Modelos de base de dados
- Fluxo de trabalho
- Formato Job Ticket JSON

### 2. [Guia de Implementação Detalhado](./docs/02_GUIA_IMPLEMENTACAO_DETALHADO.md)
- Setup inicial passo-a-passo
- Configuração da base de dados
- Implementação do backend
- Desenvolvimento do frontend
- Canvas de design com drag & drop
- Biblioteca visual de decorações
- Funcionalidades mock (IA simulada)
- Sistema de validação
- Export de Job Tickets

### 3. [Tecnologias e Ferramentas](./docs/03_TECNOLOGIAS_E_FERRAMENTAS.md)
- Stack tecnológico completo
- Packages NPM recomendados
- Ferramentas IA para integração futura
- Configurações de desenvolvimento
- Estrutura CSS/Styling
- Performance e segurança
- Testing (opcional)

### 4. [Decisões Técnicas e Alternativas](./docs/04_DECISOES_TECNICAS_E_ALTERNATIVAS.md)
- Justificação das escolhas (React vs Vue, Fabric.js vs Konva, etc.)
- Comparação de alternativas
- Migration path de Mock para IA real
- Algoritmos de snapping
- Performance tips

### 5. [HeroUI MCP Server Integration](./docs/09_HEROUI_MCP_INTEGRATION.md) 🆕 **DEV TOOL**
- Ferramenta de desenvolvimento para consultar documentação HeroUI via API
- Contexto inteligente sobre componentes, props, acessibilidade
- Quick start: `./instructions-project/dev-tools/QUICK_START.md`
- Exemplos práticos: `./instructions-project/dev-tools/INTEGRATION_EXAMPLES.md`

### 6. [Dashboard com HeroUI](./docs/06_DASHBOARD_COM_HEROUI.md) 📚 *(Apenas referência)*
- ~~Dashboard já implementado no projeto ✅~~
- Útil como referência para outros componentes HeroUI
- Exemplos de código com HeroUI components

### 7. [Autenticação e Gestão de Utilizadores](./docs/07_AUTENTICACAO_E_USERS.md) (Opcional - Fase 5)
- Sistema completo de login com JWT
- Tabela `users` e roles (admin/designer/comercial)
- Página de login com HeroUI
- Protected routes
- Gestão de utilizadores (CRUD completo)
- Middleware de autenticação

### 8. [Canvas Implementation with Konva](./docs/08_CANVAS_KONVA_GUIDE.md) ⭐ **IMPORTANTE PARA FASE 4**
- Complete Konva.js implementation guide
- Drag & drop, resize, rotate
- Smart snapping system
- Undo/Redo functionality
- Export to JSON & Image
- Full code examples

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js 18+
- NPM ou Yarn
- Conta Supabase (para base de dados)

### Instalação Rápida

```bash
# 1. Clonar/criar estrutura do projeto
mkdir instructions-project
cd instructions-project

# 2. Configurar variáveis de ambiente
# Criar arquivo server/.env com as credenciais do Supabase
# Ver exemplo em server/.env.example

# 3. Instalar dependências do backend
cd server
npm install
npm run seed  # Popular BD com dados demo

# 4. Instalar dependências do frontend
cd ../client
npm install

# 5. Configurar variáveis de ambiente do frontend
# Criar arquivo client/.env.local com VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

# 6. Iniciar ambos em modo desenvolvimento
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Acesso
- **Frontend:** http://localhost:3000 (com Hot Reload 🔥)
- **Backend API:** http://localhost:5000/api

### Utilizadores Demo
- **Admin:** admin@demo.com / demo123
- **Designer:** designer@demo.com / demo123
- **Comercial:** comercial@demo.com / demo123

---

## 🎯 Funcionalidades Principais

### ✅ Implementadas (conforme guias)
- Dashboard com estatísticas
- Histórico de projetos com filtros
- Criação de projetos (Decor/Simu)
- Upload de imagens base
- Canvas de design interativo
- Biblioteca visual de decorações
- Drag & drop de elementos
- Snapping inteligente (simulado)
- Preview noturno (filtros CSS)
- Sistema de validação
- Export Job Ticket JSON

### 🔮 Futuras (com IA real)
- Day→night conversion via API de IA
- Detecção de contexto na imagem
- Auto-sugestões baseadas em IA
- Snapping com TensorFlow.js
- Integração com Theaform/Simu-Studio

---

## 📁 Estrutura de Ficheiros

```
instructions-project/
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas principais
│   │   ├── services/    # API e mock services
│   │   └── utils/       # Utilitários
│   └── public/
│       └── demo-images/ # Imagens de demonstração
│
├── server/              # Backend Node.js + Express
│   └── src/
│       ├── controllers/ # Lógica de negócio
│       ├── models/      # Modelos Sequelize
│       ├── routes/      # Rotas API
│       └── services/    # Serviços (mock IA)
│
├── database/
│   ├── migrations/      # Migrações
│   └── seeders/         # Dados de demonstração
│
├── docs/                # Documentação adicional
└── README.md           # Este ficheiro
```

---

## 🎨 Tecnologias Utilizadas

### Frontend
- React 18
- React Router v6
- **HeroUI v2.8** - UI Components ⭐
- React DnD (Drag & Drop)
- **Konva.js + React-Konva** (Canvas) ⭐
- Axios
- Vite with HMR

### Backend
- Node.js + Express
- Sequelize ORM
- PostgreSQL
- Multer (uploads)

### DevOps
- ESLint + Prettier
- Supabase (Base de dados e autenticação)

---

## 📖 Páginas da Aplicação

0. **Login** (`/login`) - Autenticação inicial ⭐ NOVA
1. **Dashboard** (`/`) - Overview e estatísticas
2. **Project History** (`/projects`) - Lista com filtros
3. **Project Details** (`/projects/:id`) - Detalhes completos
4. **Create Project** (`/projects/new`) - Formulário criação
5. **Choose Workflow** (`/projects/:id/workflow`) - Escolher modo
6. **Commercial Mode** (`/projects/:id/commercial`) - Canvas design
7. **Designer Mode** (`/projects/:id/designer`) - Refinamento
8. **Gestão de Utilizadores** (`/users`) - Admin only ⭐ NOVA

---

## 🔄 Fluxo de Trabalho

```
Dashboard
   ↓
Create Project (Decor/Simu)
   ↓
Choose Workflow
   ↓
Commercial Mode → Adicionar decorações
   ↓
Designer Mode → Refinar e simular
   ↓
Approval & Export → Job Ticket JSON
   ↓
Project History → Resultado guardado
```

---

## 🗄️ Modelos de Dados

### Principais Tabelas
- **users** - Utilizadores do sistema (com roles) ⭐ NOVA
- **projects** - Projetos criados
- **decorations** - Catálogo de decorações (seed)
- **project_elements** - Elementos no canvas
- **project_history** - Histórico de alterações
- **job_tickets** - Exports JSON

Ver detalhes em `01_ESTRUTURA_SITE.md`

---

## 🎯 Dados de Demonstração

### Imagens Necessárias

Adicionar à pasta `client/public/demo-images/`:

1. **Decorações** (20-30 itens)
   - Bolas (várias cores/tamanhos)
   - Arcos luminosos
   - Estrelas
   - Pendentes/cascatas
   - Versões diurnas + noturnas de cada

2. **Fachadas** (5-10 exemplos)
   - Edifícios
   - Postes
   - Árvores
   - Cenários diversos

3. **Resultados** (exemplos finais)
   - Projetos completos
   - Screenshots de exemplo

### Onde Obter
- Unsplash.com
- Pexels.com
- Freepik.com (PNG transparentes)
- DALL-E / Midjourney (gerar com IA)

---

## 🧪 Funcionalidades Mock (Simuladas)

### 1. Day→Night Conversion
```javascript
// Aplica filtros CSS para simular conversão
filters: {
  brightness: 0.4,
  contrast: 1.2,
  hue-rotate: 210deg
}
```

### 2. Detecção de Contexto
```javascript
// Retorna posições aleatórias pré-definidas
mockDetections: [
  { type: 'building', x: 100, y: 50 },
  { type: 'pole', x: 300, y: 100 }
]
```

### 3. Smart Snapping
```javascript
// Snapping a grid (10px) e bounding boxes
snappedPosition = applySmartSnapping(position, elements);
```

---

## 📦 Export - Job Ticket JSON

Formato padronizado para integração:

```json
{
  "projectId": "uuid",
  "projectName": "Projeto Natal 2024",
  "projectType": "decor",
  "elements": [
    {
      "decorationId": "uuid",
      "name": "Bola Dourada",
      "position": { "x": 100, "y": 200 },
      "scale": 1.0,
      "rotation": 0
    }
  ],
  "metadata": {
    "totalElements": 15,
    "createdAt": "2024-12-01T10:00:00Z"
  }
}
```

---

## 🚧 Roadmap de Implementação

- [x] Documentação completa criada
- [ ] Setup inicial do projeto
- [ ] Configuração Supabase
- [ ] Backend API básico
- [ ] Frontend - Layout e navegação
- [ ] Página: Dashboard
- [ ] Página: Project History
- [ ] Página: Create Project
- [ ] Canvas de Design (Commercial Mode)
- [ ] Biblioteca Visual
- [ ] Drag & Drop funcional
- [ ] Snapping inteligente
- [ ] Sistema de validação
- [ ] Designer Mode
- [ ] Export Job Tickets
- [ ] Polish UI/UX
- [ ] Testes manuais
- [ ] Deploy (opcional)

---

## 💡 Dicas de Desenvolvimento

1. **Comece pelo backend** - API funcional primeiro
2. **Seed data cedo** - Dados de demonstração desde início
3. **UI incremental** - Página a página
4. **Canvas por último** - Parte mais complexa
5. **Mock bem feito** - Simula realismo
6. **Console.log** - Debug visual é essencial
7. **Git commits frequentes** - Pequenos e descritivos

---

## 🤝 Contribuição

Este é um projeto de demonstração. Para melhorias:

1. Ler os 3 guias principais
2. Seguir estrutura definida
3. Manter código limpo e comentado
4. Atualizar documentação se necessário

---

## 📞 Suporte

Consultar os guias detalhados:
- `01_ESTRUTURA_SITE.md` - Arquitetura
- `02_GUIA_IMPLEMENTACAO_DETALHADO.md` - Código
- `03_TECNOLOGIAS_E_FERRAMENTAS.md` - Stack

---

## 🌍 Language

**Application will be in English:**
- All UI text in English
- API responses in English
- Database comments in English
- Code comments in English
- Documentation can remain in Portuguese (for team)

### English Translations Reference

```javascript
// Portuguese → English
"Dashboard" → "Dashboard"
"Projetos" → "Projects"
"Criar Novo Projeto" → "Create New Project"
"Em Curso" → "In Progress"
"Aprovado" → "Approved"
"Finalizado" → "Finished"
"Utilizadores" → "Users"
"Administração" → "Administration"
"Configurações" → "Settings"
"Pedir Alterações" → "Request Changes"
"Ver Projeto" → "View Project"
"Exportar" → "Export"
"Guardar" → "Save"
"Cancelar" → "Cancel"
```

---

## 📝 Final Notes

- **Visual focus:** Demo should impress visually
- **Interactivity:** Drag & drop, zoom, preview are essential
- **Mock data:** Well-prepared makes all the difference
- **Performance:** Canvas can be heavy, optimize if needed
- **Documentation:** These guides are source of truth
- **Canvas:** Using Konva.js + React-Konva for best React integration ⭐

---

**Good luck with development! 🚀**

