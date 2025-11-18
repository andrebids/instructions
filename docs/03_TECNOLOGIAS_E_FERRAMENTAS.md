# Tecnologias e Ferramentas

> Stack tecnológico completo e ferramentas recomendadas para o Instructions Project

---

## 📋 Stack Tecnológico

### Frontend
- **React 18+** - Framework UI
- **Vite** - Build tool e dev server
- **React Router v6** - Navegação
- **React DnD** - Drag and drop nativo
- **Fabric.js** ou **Konva.js** - Canvas avançado (alternativa ao canvas nativo)
- **Axios** - Cliente HTTP
- **Date-fns** - Manipulação de datas
- **Lucide React** - Ícones modernos

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Framework web
- **Sequelize** - ORM para PostgreSQL
- **JWT (jsonwebtoken)** - Autenticação ⭐ NOVO
- **Bcrypt** - Hash de passwords ⭐ NOVO
- **Multer** - Upload de ficheiros
- **Helmet** - Segurança HTTP
- **Express Rate Limit** - Rate limiting
- **CORS** - Cross-origin requests

### Base de Dados
- **PostgreSQL 15** - Base de dados relacional

### DevOps/Tools
- **Supabase** - Base de dados PostgreSQL gerenciada e autenticação
- **ESLint** - Linting JavaScript
- **Prettier** - Formatação de código
- **Nodemon** - Auto-restart do servidor

---

## 📦 Packages Detalhados

### Frontend - package.json

```json
{
  "name": "instructions-project-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    
    "react-dnd": "^16.0.1",
    "react-dnd-html5-backend": "^16.0.1",
    
    "konva": "^9.3.0",
    "react-konva": "^18.2.10",
    "use-image": "^1.1.1",
    
    "lucide-react": "^0.300.0",
    
    "react-image-crop": "^10.1.8",
    "react-zoom-pan-pinch": "^3.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

### Backend - package.json

```json
{
  "name": "instructions-project-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "seed": "node src/utils/seedData.js",
    "db:migrate": "npx sequelize-cli db:migrate",
    "db:seed": "npx sequelize-cli db:seed:all"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    
    "sequelize": "^6.35.0",
    "pg": "^8.11.3",
    "pg-hstore": "^2.3.4",
    
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    
    "multer": "^1.4.5-lts.1",
    
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "sequelize-cli": "^6.6.2"
  }
}
```

---

## 🤖 Ferramentas IA Recomendadas (Para Integração Futura Real)

### Para Snapping Inteligente
1. **TensorFlow.js** - Deteção de objetos no browser
   - Modelo MobileNet para detecção rápida
   - COCO-SSD para identificar objetos comuns
   
2. **OpenCV.js** - Processamento de imagem
   - Detecção de bordas
   - Identificação de linhas e formas

3. **ml5.js** - Machine Learning simplificado
   - Abstração sobre TensorFlow.js
   - Fácil de usar para protótipos

**Exemplo de uso (futuro):**
```javascript
// Carregar modelo de detecção
import * as cocoSsd from '@tensorflow-models/coco-ssd';

async function detectObjects(imageElement) {
  const model = await cocoSsd.load();
  const predictions = await model.detect(imageElement);
  
  // predictions: [{ class, score, bbox }]
  return predictions.filter(p => 
    ['person', 'car', 'building', 'tree'].includes(p.class)
  );
}
```

### Para Day→Night Conversion

**Opções reais (quando sair da demo):**

1. **Replicate API** - Serviços de IA prontos
   - https://replicate.com
   - Modelos de transformação de imagem
   - Pay-per-use

2. **Stability AI** - Stable Diffusion
   - Image-to-image transformation
   - Prompts como "convert to night scene"

3. **RunwayML** - Ferramentas criativas
   - API de processamento de vídeo/imagem

4. **Hugging Face Inference API**
   - Modelos open-source
   - ControlNet para transformações

**Exemplo mockado (atual):**
```javascript
// client/src/services/mockAI.js
export function convertToNight(imageUrl) {
  // Aplicar filtros CSS como demo
  return {
    filters: {
      brightness: '0.4',
      contrast: '1.2',
      saturate: '0.8',
      'hue-rotate': '210deg',
    },
  };
}
```

**Exemplo real (futuro com API):**
```javascript
import axios from 'axios';

export async function convertToNightReal(imageUrl) {
  const response = await axios.post('https://api.replicate.com/v1/predictions', {
    version: 'stable-diffusion-day-to-night-model',
    input: {
      image: imageUrl,
      prompt: 'nighttime, dark blue sky, street lights on, realistic lighting',
    },
  }, {
    headers: {
      'Authorization': `Token ${process.env.VITE_REPLICATE_API_KEY}`,
    },
  });
  
  return response.data.output;
}
```

---

## 🎨 Canvas Library: Konva.js + React-Konva ⭐

### Por que Konva.js?

**Vantagens:**
- 🚀 **Performance superior** - até 2-3x mais rápido com muitos objetos
- ⚛️ **React-first** - Wrapper oficial com componentes React
- 🎯 **Declarativo** - Sintaxe mais natural em React
- 📦 **Bundle menor** - ~150KB vs 200KB+ do Fabric
- 🔧 **TypeScript** - Suporte nativo melhor
- 🎨 **Layer management** - Sistema de camadas mais intuitivo

### Instalação

```bash
npm install konva react-konva use-image
```

### Exemplo Básico

```javascript
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva';
import { useState, useRef, useEffect } from 'react';
import useImage from 'use-image';

function DecorationItem({ decoration, isSelected, onSelect, onChange }) {
  const [image] = useImage(decoration.url);
  const shapeRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={decoration.x}
        y={decoration.y}
        scaleX={decoration.scale}
        scaleY={decoration.scale}
        rotation={decoration.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          onChange({
            ...decoration,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();
          const rotation = node.rotation();

          onChange({
            ...decoration,
            x: node.x(),
            y: node.y(),
            scale: scaleX,
            rotation: rotation,
          });
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  );
}

function DesignCanvas({ backgroundUrl, decorations, onDecorationChange }) {
  const [backgroundImage] = useImage(backgroundUrl);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <Stage width={1200} height={800}>
      <Layer>
        {/* Background */}
        <KonvaImage image={backgroundImage} />
        
        {/* Decorations */}
        {decorations.map((decoration) => (
          <DecorationItem
            key={decoration.id}
            decoration={decoration}
            isSelected={decoration.id === selectedId}
            onSelect={() => setSelectedId(decoration.id)}
            onChange={(newAttrs) => onDecorationChange(decoration.id, newAttrs)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
```

### Advanced Features

```javascript
// Snapping com Konva
function getSnappedPosition(pos, stageSize) {
  const GRID_SIZE = 20;
  const SNAP_DISTANCE = 10;
  
  const snappedX = Math.round(pos.x / GRID_SIZE) * GRID_SIZE;
  const snappedY = Math.round(pos.y / GRID_SIZE) * GRID_SIZE;
  
  return {
    x: Math.abs(pos.x - snappedX) < SNAP_DISTANCE ? snappedX : pos.x,
    y: Math.abs(pos.y - snappedY) < SNAP_DISTANCE ? snappedY : pos.y,
  };
}

// Export to JSON
function exportToJSON(stageRef) {
  const json = stageRef.current.toJSON();
  return JSON.parse(json);
}

// Import from JSON
function importFromJSON(jsonData, stageRef) {
  const stage = Konva.Node.create(jsonData);
  stageRef.current = stage;
}

// Undo/Redo
function useCanvasHistory() {
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  
  const saveState = (state) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      return history[currentIndex - 1];
    }
  };
  
  const redo = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      return history[currentIndex + 1];
    }
  };
  
  return { saveState, undo, redo, canUndo: currentIndex > 0, canRedo: currentIndex < history.length - 1 };
}
```

### Performance Optimization

```javascript
// Use caching for complex shapes
useEffect(() => {
  if (imageRef.current) {
    imageRef.current.cache();
  }
}, []);

// Batch updates
layer.batchDraw(); // Instead of layer.draw()

// Use virtualizing for many objects
const visibleDecorations = decorations.filter(d => 
  isInViewport(d, viewport)
);
```

### Resources & Documentation

- **Official Docs:** https://konvajs.org/
- **React-Konva:** https://konvajs.org/docs/react/
- **Examples:** https://konvajs.org/docs/react/Intro.html
- **GitHub:** https://github.com/konvajs/konva
- **TypeScript Support:** Excellent, with full type definitions

---

## 🔧 Utilitários Recomendados

### Para Imagens
```bash
npm install sharp           # Processamento de imagem (backend)
npm install react-image-crop # Crop de imagens (frontend)
npm install react-zoom-pan-pinch # Zoom e pan
```

### Para Formulários
```bash
npm install react-hook-form # Gestão de formulários
npm install zod             # Validação de schemas
```

### Para UI
```bash
# Opção A: HeroUI (RECOMENDADO para demo)
pnpm add @heroui/react framer-motion
pnpm heroui add button card table modal badge tabs input

# Opção B: Tailwind CSS puro
npm install tailwindcss

# Opção C: Styled Components
npm install styled-components
```

**⭐ Recomendação:** Usar [HeroUI](https://www.heroui.com/docs/frameworks/vite) - 210+ componentes React prontos, baseado em Tailwind v4, perfeito para Vite. Ver `06_DASHBOARD_COM_HEROUI.md` para exemplo completo.

### Para Drag & Drop Avançado
```bash
npm install @dnd-kit/core @dnd-kit/sortable # Alternativa moderna ao react-dnd
```

---

## 🗂️ Estrutura de Ficheiros Demo/Mock

### Imagens de Demonstração

Criar pasta `client/public/demo-images/`:

```
demo-images/
├── decorations/
│   ├── balls/
│   │   ├── ball-gold-large.png
│   │   ├── ball-gold-large-night.png
│   │   ├── ball-red-medium.png
│   │   └── ...
│   ├── arcs/
│   │   ├── arc-blue.png
│   │   ├── arc-blue-night.png
│   │   └── ...
│   ├── stars/
│   │   └── ...
│   └── pendants/
│       └── ...
│
├── buildings/
│   ├── facade-1.jpg
│   ├── facade-2.jpg
│   └── ...
│
├── results/
│   ├── project-1-result.jpg
│   ├── project-2-result.jpg
│   └── ...
│
└── placeholder.png
```

### Onde Obter Imagens de Exemplo

1. **Unsplash** - https://unsplash.com
   - Procurar: "christmas lights", "building facade", "decorations"

2. **Pexels** - https://pexels.com
   - Grátis para uso comercial

3. **Freepik** - https://freepik.com
   - Elementos gráficos, PNG transparentes

4. **Criar com IA:**
   - DALL-E, Midjourney, Stable Diffusion
   - Prompts: "christmas ball ornament, transparent background, PNG"

---

## 🎯 Configurações de Desenvolvimento

### ESLint (.eslintrc.cjs)
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};
```

### Vite Config (vite.config.js)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
    hmr: {
      overlay: true, // Mostrar erros em overlay
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### 🔥 Hot Module Replacement (HMR)

**Vite tem HMR nativo e super rápido!**

Funcionalidades:
- ⚡ **Instant updates** - ~50-200ms
- 🎯 **Preserva estado** - Componentes atualizam sem perder dados
- 🔄 **Fast Refresh** - React Fast Refresh integrado
- 🐛 **Error overlay** - Erros mostrados no browser

**Configuração:**
- ✅ Funciona automaticamente
- ✅ Sem configuração adicional necessária
- ✅ Suporta CSS, JSX, assets

**Como usar:**
1. Inicia o servidor: `npm run dev`
2. Edita qualquer ficheiro em `src/`
3. Guarda
4. **Vê a mudança instantânea no browser!**

Exemplo:
```javascript
// Muda isto:
<h1>Dashboard</h1>

// Para isto:
<h1>Dashboard 🎨</h1>

// Guarda e vê atualizar SEM refresh!
```

### Environment Variables

**client/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Instructions Project
VITE_DEMO_MODE=true
```

**server/.env**
```env
NODE_ENV=development
PORT=5000

# JWT
JWT_SECRET=your-super-secret-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=instructions_demo
DB_USER=demo_user
DB_PASSWORD=demo_password

# Upload
UPLOAD_DIR=./public/uploads
MAX_FILE_SIZE=5242880
```

---

## 🚀 Scripts de Desenvolvimento

### Makefile (opcional)
```makefile
.PHONY: install dev db-up db-down seed clean

install:
	cd client && npm install
	cd server && npm install

dev:
	cd server && npm run dev &
	cd client && npm run dev

seed:
	cd server && npm run seed

clean:
	rm -rf client/node_modules
	rm -rf server/node_modules
```

**Uso:**
```bash
make install   # Instalar dependências
make dev       # Iniciar tudo em modo dev
make seed      # Popular BD com dados demo
```

---

## 🎨 CSS/Styling Strategy

### ⭐ Opção 1: HeroUI (RECOMENDADO)
Biblioteca de componentes React moderna baseada em Tailwind CSS v4.

**Instalação:**
```bash
pnpm add @heroui/react framer-motion
pnpm heroui add button card table modal badge
```

**Vantagens:**
- 210+ componentes prontos
- Responsivo automático
- Dark mode built-in
- Animações incluídas (Framer Motion)
- Desenvolvimento 3x mais rápido
- Perfeito para Vite + React

**Exemplo Dashboard:**
```javascript
import { Card, CardBody, Button, Table, Chip } from '@heroui/react';

<Card>
  <CardBody className="flex flex-row items-center gap-4">
    <div className="text-4xl">⏳</div>
    <div>
      <p className="text-sm text-gray-500">Em Curso</p>
      <p className="text-3xl font-bold">{stats.ongoing}</p>
    </div>
  </CardBody>
</Card>
```

**Documentação:** [HeroUI Vite Guide](https://www.heroui.com/docs/frameworks/vite)

**Ver implementação completa:** `06_DASHBOARD_COM_HEROUI.md`

### Opção 2: CSS Puro (Controlo total)
```
client/src/styles/
├── global.css
├── variables.css
├── reset.css
└── components/
    ├── button.css
    ├── modal.css
    └── ...
```

**variables.css**
```css
:root {
  /* Cores principais */
  --color-primary: #2196F3;
  --color-secondary: #FF9800;
  --color-success: #4CAF50;
  --color-danger: #F44336;
  --color-warning: #FFC107;
  
  /* Tons de cinza */
  --color-gray-50: #FAFAFA;
  --color-gray-100: #F5F5F5;
  --color-gray-900: #212121;
  
  /* Espaçamentos */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Tipografia */
  --font-family: 'Inter', -apple-system, sans-serif;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  
  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Opção 3: Tailwind CSS Puro
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Opção 4: Styled Components
```bash
npm install styled-components
```

---

## 📱 Responsive Design

### Breakpoints
```css
/* Mobile first */
/* xs: 0-599px */
@media (min-width: 600px) { /* sm */ }
@media (min-width: 900px) { /* md */ }
@media (min-width: 1200px) { /* lg */ }
@media (min-width: 1536px) { /* xl */ }
```

---

## 🧪 Testing (Opcional para demo)

Se quiseres adicionar testes:

```bash
# Frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Backend
npm install -D jest supertest
```

---

## 📊 Performance Tips

### Frontend
1. **Lazy loading de rotas:**
```javascript
const CommercialMode = lazy(() => import('./pages/CommercialMode'));
```

2. **Memoização de componentes:**
```javascript
const DecorationCard = memo(({ decoration }) => {
  // ...
});
```

3. **Virtualização de listas longas:**
```bash
npm install react-window
```

### Backend
1. **Indexar colunas frequentes:**
```javascript
// Sequelize
{
  indexes: [
    { fields: ['status'] },
    { fields: ['projectType'] },
    { fields: ['createdAt'] }
  ]
}
```

2. **Pagination:**
```javascript
const limit = 20;
const offset = (page - 1) * limit;

Project.findAndCountAll({ limit, offset });
```

---

## 🔒 Segurança (Básica para demo)

1. **Helmet** já configurado
2. **Rate limiting** nas rotas API
3. **Validação de input** no backend
4. **CORS** configurado
5. **Não expor erros detalhados** em produção

```javascript
// server/src/middleware/errorHandler.js
export function errorHandler(err, req, res, next) {
  console.error(err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Erro interno do servidor' });
  } else {
    res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    });
  }
}
```

---

## 📚 Documentação Adicional

### API Documentation
Usar **Swagger/OpenAPI** para documentar a API:

```bash
npm install swagger-ui-express swagger-jsdoc
```

### Storybook (Componentes)
Para documentar componentes isolados:

```bash
npx storybook@latest init
```

---

## 🎯 Próximos Passos de Implementação

1. ✅ Estrutura do projeto definida
2. ✅ Tecnologias selecionadas
3. ⏳ Setup inicial (seguir `02_GUIA_IMPLEMENTACAO_DETALHADO.md`)
4. ⏳ Criar dados de demonstração (imagens, BD seed)
5. ⏳ Implementar páginas base
6. ⏳ Desenvolver canvas de design
7. ⏳ Adicionar funcionalidades mock
8. ⏳ Testar fluxo completo
9. ⏳ Polish UI/UX
10. ⏳ Deploy (opcional)

---

## 💡 Notas Finais

- **Foco na demonstração visual** - Não te preocupes com IA real inicialmente
- **Dados mock bem feitos** - Fazem toda a diferença na apresentação
- **UI moderna e limpa** - Usa as variáveis CSS para consistência
- **Interatividade** - Drag & drop, zoom, preview fazem o projeto brilhar
- **Documentação** - Mantém estes guias atualizados conforme avanças

---

**Documentos relacionados:**
- `01_ESTRUTURA_SITE.md` - Arquitetura e estrutura
- `02_GUIA_IMPLEMENTACAO_DETALHADO.md` - Implementação passo-a-passo

