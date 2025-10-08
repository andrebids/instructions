# Estado Atual do Projeto - Instructions Project

> Documento atualizado em **8 de outubro de 2025**  
> Resume o que está implementado e os próximos passos

---

## ✅ O QUE JÁ ESTÁ FEITO

### 1. Frontend (Cliente) - **COMPLETO E FUNCIONAL** 🎉

**Tecnologias:**
- ✅ React 19.2.0
- ✅ Vite 5.4.1 (com Hot Module Replacement)
- ✅ HeroUI v2.8.5 (componentes UI modernos)
- ✅ Tailwind CSS 4.0.0
- ✅ Iconify (lucide icons)
- ✅ Framer Motion (animações)

**Componentes Criados:**
- ✅ `App.jsx` - Componente principal com dashboard
- ✅ `Header` - Cabeçalho com avatar, notificações, dark mode, search
- ✅ `SidebarNavigation` - Barra lateral com navegação icónica
- ✅ `StatsCard` - Cards de estatísticas
- ✅ `ProjectTable` - Tabela de projetos com badges e ações
- ✅ `CreateProject` - Formulário completo de criação de projetos

**Funcionalidades:**
- ✅ Dashboard bonito e responsivo
- ✅ Dark mode / Light mode (toggle funcional)
- ✅ Notificações com badge (3 notificações demo)
- ✅ Avatar com dropdown de perfil
- ✅ Search bar expansível
- ✅ Grid de estatísticas (4 cards)
- ✅ Tabela de projetos com filtros
- ✅ Formulário de criar projeto (modal)
- ✅ Hot Reload funcional

**Setup HeroUI (Verificado 8 Out 2025):**
- ✅ HeroUI v2.8.5 (versão atual)
- ✅ React 19.2.0 (requisito: 18+)
- ✅ Tailwind CSS 4.0.0 (requisito: v4)
- ✅ Framer Motion 12.23.22 (requisito: 11.9+)
- ✅ HeroUIProvider configurado
- ✅ Tailwind plugin heroui() ativo
- ✅ **100% conforme guia oficial HeroUI** ✨

**Porta:** `http://localhost:3003/` ✅ A FUNCIONAR

---

### 2. Backend (Servidor) - **BÁSICO FUNCIONAL**

**Tecnologias:**
- ✅ Node.js + Express
- ✅ CORS habilitado
- ✅ Helmet (segurança)
- ✅ Estrutura de pastas criada

**Endpoints Criados:**
- ✅ `GET /health` - Health check
- ✅ `GET /api/projects` - Lista de projetos (mock)

**Estrutura:**
```
server/
├── src/
│   ├── app.js (✅)
│   ├── controllers/ (pasta criada)
│   ├── models/ (pasta criada)
│   ├── routes/ (pasta criada)
│   └── services/ (pasta criada)
└── package.json (✅)
```

**Porta:** `http://localhost:5000/` ✅ A FUNCIONAR

---

### 3. Base de Dados - **CONFIGURADA**

**Docker Compose:**
- ✅ PostgreSQL 15 configurado
- ✅ Porta 5432
- ✅ Credenciais definidas (`demo_user` / `demo_password`)
- ✅ Volume para persistência

**Estado:** PostgreSQL pronto para usar, falta apenas conectar com Sequelize

---

## 📋 O QUE FALTA FAZER

### Fase 1: Conectar Backend à Base de Dados ⏳

**Objetivo:** Substituir dados mock por dados reais do PostgreSQL

**Tarefas:**
1. Instalar Sequelize no backend
2. Configurar conexão PostgreSQL
3. Criar modelos (Models):
   - `Project` - Projetos
   - `Decoration` - Catálogo de decorações
   - `ProjectElement` - Elementos no canvas
4. Criar Seeds (dados demo):
   - 20-30 decorações de exemplo
   - 5-10 projetos de exemplo
5. Criar Controllers e Routes:
   - CRUD completo de projetos
   - GET decorações
   - POST/PUT elementos no canvas

**Ficheiros a criar:**
```
server/src/
├── config/database.js
├── models/
│   ├── Project.js
│   ├── Decoration.js
│   ├── ProjectElement.js
│   └── index.js
├── controllers/
│   ├── projectController.js
│   └── decorationController.js
├── routes/
│   ├── projects.js
│   └── decorations.js
└── seeders/
    └── seed.js
```

**Tempo estimado:** 2-3 horas

---

### Fase 2: Conectar Frontend ao Backend Real ⏳

**Objetivo:** Substituir dados estáticos por chamadas API

**Tarefas:**
1. Criar serviço API no frontend (`src/services/api.js`)
2. Usar Axios para chamadas HTTP
3. Atualizar componentes para carregar dados reais:
   - Dashboard stats (contar projetos reais)
   - ProjectTable (listar projetos da BD)
   - CreateProject (enviar para API)
4. Adicionar loading states
5. Adicionar error handling

**Ficheiros a criar/editar:**
```
client/src/
├── services/
│   └── api.js (NOVO)
├── App.jsx (EDITAR - adicionar useEffect para carregar projetos)
├── components/
│   ├── project-table.jsx (EDITAR - dados da API)
│   └── create-project.jsx (EDITAR - submit para API)
```

**Tempo estimado:** 2 horas

---

### Fase 3: Páginas Adicionais 📄

**Objetivo:** Criar resto das páginas da aplicação

**Páginas a criar:**
1. **Project Details** (`/projects/:id`)
   - Ver detalhes completos do projeto
   - Preview da imagem base
   - Lista de decorações aplicadas
   - Botões de ação (Edit, Delete, Export)

2. **Project History** (`/projects`)
   - Lista completa com filtros avançados
   - Filtro por status, tipo, data
   - Paginação
   - Ordenação

3. **Choose Workflow** (`/projects/:id/workflow`)
   - Escolher entre Commercial Mode e Designer Mode
   - Explicação de cada modo

**Tempo estimado:** 3-4 horas

---

### Fase 4: Canvas de Design (A PARTE MAIS COMPLEXA) 🎨

**Objetivo:** Implementar canvas interativo para adicionar decorações

**Tecnologia:** Konva.js + React-Konva

**Tarefas:**
1. Instalar bibliotecas:
   ```bash
   npm install konva react-konva use-image
   npm install react-dnd react-dnd-html5-backend
   ```

2. Criar componentes:
   - `DesignCanvas` - Canvas principal com Konva
   - `DecorationLibrary` - Sidebar com catálogo de decorações
   - `CanvasToolbar` - Ferramentas (undo, redo, save, zoom)
   - `ElementProperties` - Painel de propriedades do elemento selecionado

3. Funcionalidades:
   - Drag & drop de decorações para canvas
   - Selecionar, mover, redimensionar, rodar elementos
   - Snapping inteligente (grid + outros elementos)
   - Zoom e pan
   - Undo/Redo
   - Guardar estado do canvas na BD

4. Criar páginas:
   - **Commercial Mode** (`/projects/:id/commercial`) - Canvas completo
   - **Designer Mode** (`/projects/:id/designer`) - Refinamento + preview noturno

**Ficheiros a criar:**
```
client/src/
├── pages/
│   ├── CommercialMode.jsx
│   └── DesignerMode.jsx
├── components/
│   ├── canvas/
│   │   ├── DesignCanvas.jsx
│   │   ├── CanvasToolbar.jsx
│   │   └── ElementProperties.jsx
│   └── library/
│       └── DecorationLibrary.jsx
└── utils/
    ├── snapping.js
    └── canvasUtils.js
```

**Tempo estimado:** 6-8 horas (é a parte mais complexa!)

---

### Fase 5: Funcionalidades Avançadas (Opcionais) 🔮

**Mock IA:**
- Day→Night conversion (filtros CSS)
- Detecção de contexto (posições sugeridas)
- Validação visual (avisos de sobreposição)

**Export:**
- Job Ticket JSON (formato padronizado)
- Export de imagem do canvas (PNG)
- PDF com resumo do projeto

**Tempo estimado:** 4-5 horas

---

## 🎯 PLANO DE IMPLEMENTAÇÃO RECOMENDADO

### Próximos Passos Imediatos:

1. **Hoje (2-3h):** Fase 1 - Conectar Backend à BD
   - Sequelize + Modelos + Seeds
   - Testar endpoints com dados reais

2. **Amanhã (2h):** Fase 2 - Conectar Frontend ao Backend
   - Serviço API
   - Atualizar componentes existentes
   - Ver dashboard com dados reais ✨

3. **Próximos dias (3-4h):** Fase 3 - Páginas Adicionais
   - Project Details
   - Project History

4. **Semana seguinte (6-8h):** Fase 4 - Canvas de Design
   - Commercial Mode
   - Designer Mode
   - Drag & drop funcional

5. **Opcional:** Fase 5 - Funcionalidades Avançadas

---

## 📦 DEPENDÊNCIAS A INSTALAR

### Backend (quando chegar à Fase 1):
```bash
cd server
npm install sequelize pg pg-hstore
npm install --save-dev sequelize-cli
```

### Frontend (quando chegar à Fase 4):
```bash
cd client
npm install axios
npm install konva react-konva use-image
npm install react-dnd react-dnd-html5-backend
npm install date-fns
```

---

## 🚀 COMANDOS ÚTEIS

### Iniciar Ambiente Completo:

```bash
# Terminal 1 - PostgreSQL
docker-compose up -d

# Terminal 2 - Backend
cd server
npm run dev

# Terminal 3 - Frontend (JÁ A CORRER!)
cd client
npm run dev
```

### Verificar Estado:
- Frontend: http://localhost:3003/ ✅
- Backend: http://localhost:5000/health ✅
- API: http://localhost:5000/api/projects ✅

---

## 💡 NOTAS IMPORTANTES

1. **O teu dashboard está ÓTIMO!** 🎉
   - Não vamos tocar nele sem necessidade
   - Apenas vamos adicionar dados reais da API
   - Design e componentes ficam como estão

2. **HeroUI é excelente escolha**
   - Componentes modernos e bonitos
   - Dark mode incluído
   - Mantém consistência visual

3. **Estrutura já está bem organizada**
   - Separação cliente/servidor clara
   - Componentes reutilizáveis
   - Boas práticas seguidas

4. **Canvas será a parte mais desafiante**
   - Mas temos bons guias (ver `08_CANVAS_KONVA_GUIDE.md`)
   - Fazer incrementalmente
   - Testar cada funcionalidade isoladamente

---

## 📚 DOCUMENTAÇÃO DE REFERÊNCIA

- **HeroUI:** https://www.heroui.com/docs
- **Konva.js:** https://konvajs.org/
- **React-Konva:** https://konvajs.org/docs/react/
- **Sequelize:** https://sequelize.org/
- **React DnD:** https://react-dnd.github.io/react-dnd/

---

## 🎬 PRÓXIMO PASSO RECOMENDADO

**Começar pela Fase 1:** Conectar Backend à Base de Dados

Porquê?
- Fundamental para tudo o resto
- Transforma a app de "demo estático" para "aplicação real"
- Permite testar e ver dados reais no dashboard bonito que já tens

**Quer que eu implemente a Fase 1 agora?** Posso:
1. Instalar Sequelize
2. Criar modelos (Project, Decoration, etc.)
3. Popular BD com dados de exemplo
4. Criar controllers e routes
5. Testar endpoints

Demora cerca de 30-45 minutos e depois já tens dados reais a aparecer no teu dashboard! 🚀

---

**Última atualização:** 8 de outubro de 2025  
**Estado:** Frontend completo ✅ | Backend básico ✅ | BD configurada ✅ | Pronto para Fase 1 🚀

