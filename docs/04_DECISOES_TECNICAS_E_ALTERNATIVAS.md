# Decisões Técnicas e Alternativas

> Justificação das escolhas tecnológicas e alternativas disponíveis

---

## 🎯 Decisões Principais

### 1. React vs outras frameworks

#### ✅ Escolhido: **React 18**

**Porquê:**
- Ecossistema maduro e vasto
- Drag & Drop libraries excelentes (react-dnd, dnd-kit)
- Canvas libraries bem integradas (Fabric.js tem bons wrappers)
- Familiaridade e documentação abundante
- Comunidade ativa

**Alternativas consideradas:**
- **Vue 3:** Boa opção, mas menos libraries para canvas/dnd
- **Svelte:** Performance excelente, mas ecossistema mais pequeno
- **Angular:** Demasiado "enterprise" para uma demo

---

### 2. Canvas Implementation

#### ✅ Escolhido: **Fabric.js**

**Porquê:**
- API de alto nível para manipulação de canvas
- Drag, resize, rotate out-of-the-box
- Serialização JSON nativa
- Eventos de mouse bem tratados
- Boa documentação

**Alternativas:**

#### Opção A: **Konva.js + react-konva**
```javascript
// Prós:
+ Wrapper React oficial
+ Performance excelente
+ API similar ao Fabric

// Contras:
- Serialização JSON menos rica
- Curva de aprendizagem ligeiramente maior
```

#### Opção B: **Canvas HTML5 Nativo**
```javascript
// Prós:
+ Controlo total
+ Sem dependências
+ Performance máxima

// Contras:
- Muito código boilerplate
- Implementar drag/resize manualmente
- Gestão de eventos complexa
```

#### Opção C: **React DnD apenas (sem canvas)**
```javascript
// Prós:
+ Simples de implementar
+ Drag & drop nativo HTML

// Contras:
- Sem rotação/resize fácil
- Difícil fazer snapping preciso
- Limitado para design visual
```

**Decisão final:** Fabric.js pela relação funcionalidade/complexidade

---

### 3. Drag & Drop

#### ✅ Escolhido: **React DnD (para biblioteca) + Fabric.js (para canvas)**

**Estratégia híbrida:**
- **React DnD:** Arrastar da biblioteca para o canvas
- **Fabric.js:** Manipular elementos dentro do canvas

```javascript
// Biblioteca (React DnD)
const [{ isDragging }, drag] = useDrag({
  type: 'DECORATION',
  item: { decoration },
});

// Canvas (Fabric.js)
canvas.on('object:moving', (e) => {
  const obj = e.target;
  applySnapping(obj);
});
```

**Alternativa: @dnd-kit**
- Mais moderno que react-dnd
- Performance melhor
- API mais simples
- **Consideração:** Mudar para dnd-kit se react-dnd tiver problemas

---

### 4. State Management

#### ✅ Escolhido: **React Context + useState**

**Porquê:**
- Aplicação pequena/média
- Estado não é extremamente complexo
- Evita dependências extra
- Suficiente para demo

**Quando considerar Redux/Zustand:**
- Se a app crescer muito
- Se tiveres >10 níveis de componentes
- Se precisares de debug avançado
- Se state updates forem muito complexos

```javascript
// Context simples é suficiente
const ProjectContext = createContext();

function ProjectProvider({ children }) {
  const [project, setProject] = useState(null);
  const [elements, setElements] = useState([]);
  
  return (
    <ProjectContext.Provider value={{ project, elements, setElements }}>
      {children}
    </ProjectContext.Provider>
  );
}
```

---

### 5. Backend Framework

#### ✅ Escolhido: **Express.js**

**Porquê:**
- Minimalista e flexível
- Perfeito para REST API
- Middleware ecosystem rico
- Bem documentado

**Alternativas:**

#### Opção A: **Fastify**
```javascript
// Prós:
+ Mais rápido que Express
+ TypeScript first
+ Schema validation built-in

// Contras:
- Menos familiar
- Menos middleware disponível
```

#### Opção B: **NestJS**
```javascript
// Prós:
+ Estrutura robusta (como Angular)
+ TypeScript nativo
+ Dependency injection

// Contras:
- Overkill para demo
- Curva de aprendizagem maior
- Mais boilerplate
```

#### Opção C: **Hono (Edge Runtime)**
```javascript
// Prós:
+ Ultra rápido
+ Edge-ready
+ Syntax moderna

// Contras:
- Muito novo
- Menos ecosystem
- Documentação limitada
```

**Decisão:** Express é o sweet spot para esta demo

---

### 6. ORM - Database

#### ✅ Escolhido: **Sequelize**

**Porquê:**
- ORM maduro para PostgreSQL
- Migrations e seeders integrados
- Associações bem implementadas
- Boa documentação

**Alternativas:**

#### Opção A: **Prisma**
```javascript
// Prós:
+ Type-safety excelente
+ Schema visual (Prisma Studio)
+ Migrations automáticas
+ Developer experience superior

// Contras:
- Requer build step
- Mais opinionated
- Ficheiro schema próprio
```

**Nota:** Prisma seria melhor para produção, mas Sequelize é mais direto para demo.

#### Opção B: **TypeORM**
```javascript
// Prós:
+ Decorators elegantes
+ Active Record e Data Mapper
+ Boa integração TypeScript

// Contras:
- Docs às vezes confusas
- Breaking changes frequentes
```

#### Opção C: **SQL Direto (pg)**
```javascript
// Prós:
+ Controlo total
+ Performance máxima
+ Sem abstração

// Contras:
- Muito boilerplate
- SQL injection risks
- Sem migrations automáticas
```

---

### 7. Styling Strategy

#### ✅ Recomendado: **CSS Modules ou CSS Puro**

**Para uma demo:**

```javascript
// CSS Modules (component-scoped)
import styles from './Button.module.css';

<button className={styles.primary}>Click</button>
```

**Alternativas:**

#### Opção A: **Tailwind CSS**
```javascript
// Prós:
+ Rápido de desenvolver
+ Utility-first
+ Design system built-in

// Contras:
- Classes muito longas
- Requer configuração
- Curva de aprendizagem
```

#### Opção B: **Styled Components**
```javascript
// Prós:
+ CSS-in-JS
+ Props dinâmicos
+ Theme support

// Contras:
- Runtime overhead
- Mais uma dependência
```

#### Opção C: **CSS Puro com BEM**
```css
/* Prós: */
+ Zero dependências
+ Total controlo
+ Performance perfeita

/* Contras: */
- Naming manual
- Possível conflito de nomes
```

**Decisão:** CSS puro com variáveis CSS para demo simples

```css
/* variables.css */
:root {
  --color-primary: #2196F3;
  --spacing-md: 16px;
}

/* Use em qualquer componente */
.button {
  background: var(--color-primary);
  padding: var(--spacing-md);
}
```

---

### 8. Mock IA vs Real IA

#### ✅ Fase 1: **Mock/Simulado**

**Porquê começar com mock:**
- Desenvolvimento rápido
- Sem custos de API
- Sem rate limits
- Fácil de demonstrar
- Funcionalidade garantida

```javascript
// Mock simples e confiável
export function convertToNight(imageUrl) {
  return {
    nightImageUrl: imageUrl,
    filters: {
      brightness: 0.4,
      contrast: 1.2,
      hue: '210deg',
    },
  };
}
```

#### 🔮 Fase 2: **IA Real (Futuro)**

**Quando integrar IA real:**

1. **Day→Night:** Replicate API ou Stable Diffusion
   ```javascript
   const response = await fetch('https://api.replicate.com/...', {
     method: 'POST',
     body: JSON.stringify({
       model: 'nighttime-conversion',
       input: { image: imageUrl }
     })
   });
   ```

2. **Object Detection:** TensorFlow.js + COCO-SSD
   ```javascript
   import * as cocoSsd from '@tensorflow-models/coco-ssd';
   
   const model = await cocoSsd.load();
   const predictions = await model.detect(imageElement);
   ```

3. **Smart Suggestions:** OpenAI API
   ```javascript
   const completion = await openai.chat.completions.create({
     model: "gpt-4",
     messages: [{
       role: "user",
       content: "Suggest decorations for this building type..."
     }]
   });
   ```

**Custos estimados (quando usar IA real):**
- Replicate: ~$0.001-0.01 por imagem
- OpenAI: ~$0.01-0.03 por request
- TensorFlow.js: Grátis (client-side)

---

### 9. File Upload Strategy

#### ✅ Escolhido: **Multer (local storage)**

**Para demo:**
```javascript
const upload = multer({ 
  dest: 'public/uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});
```

**Alternativas futuras:**

#### Para produção:
1. **AWS S3** - Storage cloud
2. **Cloudinary** - Image processing + CDN
3. **Firebase Storage** - Simples e integrado

---

### 10. Snapping Algorithm

#### ✅ Escolhido: **Grid + Bounding Box Snapping**

```javascript
export function applySmartSnapping(position, elements) {
  const SNAP_DISTANCE = 10;
  const GRID_SIZE = 20;
  
  let snappedX = position.x;
  let snappedY = position.y;
  
  // 1. Snapping a grid
  const gridX = Math.round(position.x / GRID_SIZE) * GRID_SIZE;
  if (Math.abs(position.x - gridX) < SNAP_DISTANCE) {
    snappedX = gridX;
  }
  
  // 2. Snapping a elementos existentes
  for (const el of elements) {
    if (Math.abs(position.x - el.x) < SNAP_DISTANCE) {
      snappedX = el.x;
    }
  }
  
  return { x: snappedX, y: snappedY };
}
```

**Alternativas avançadas (com IA):**

```javascript
// TensorFlow.js para detectar alinhamentos
async function aiSnapping(position, canvasImage) {
  const predictions = await detectLines(canvasImage);
  return snapToDetectedLines(position, predictions);
}
```

---

### 11. Export Format

#### ✅ Escolhido: **JSON (Job Ticket)**

**Porquê JSON:**
- Fácil de gerar
- Universal
- Estruturado
- Fácil de importar noutros sistemas

```json
{
  "projectId": "uuid",
  "elements": [...],
  "metadata": {...}
}
```

**Alternativas adicionais:**

1. **PDF** - Para apresentação
   ```javascript
   import jsPDF from 'jspdf';
   const doc = new jsPDF();
   doc.addImage(canvasImage, 'PNG', 10, 10);
   ```

2. **SVG** - Vetorial
   ```javascript
   const svg = canvas.toSVG();
   ```

3. **PNG/JPG** - Preview visual
   ```javascript
   const dataUrl = canvas.toDataURL('image/png');
   ```

**Implementar múltiplos exports:**
```javascript
export function exportProject(project, format = 'json') {
  switch(format) {
    case 'json': return exportJSON(project);
    case 'pdf': return exportPDF(project);
    case 'png': return exportImage(project);
  }
}
```

---

## 🔄 Migration Path (Mock → Real)

### Fase 1: Demo/Mock (Atual)
- ✅ Tudo simulado
- ✅ Desenvolvimento rápido
- ✅ Sem custos
- ✅ Apresentação funcional

### Fase 2: Hybrid
- ✅ Core funcional
- 🔄 IA opcional (toggle)
- 🔄 Fallback para mock se API falhar

```javascript
async function convertToNight(imageUrl, useAI = false) {
  if (useAI && process.env.VITE_AI_ENABLED) {
    try {
      return await convertToNightAI(imageUrl);
    } catch (error) {
      console.warn('IA falhou, usando mock');
      return convertToNightMock(imageUrl);
    }
  }
  return convertToNightMock(imageUrl);
}
```

### Fase 3: Production
- ✅ IA real em produção
- ✅ Caching de resultados
- ✅ Queue system para processos longos
- ✅ Webhooks para notificações

---

## 📊 Performance Considerations

### Canvas Performance

**Otimizações:**

1. **Virtualização**
   ```javascript
   // Só renderizar elementos visíveis
   const visibleElements = elements.filter(el => 
     isInViewport(el, canvasViewport)
   );
   ```

2. **Debouncing**
   ```javascript
   import { debounce } from 'lodash';
   
   const handleElementMove = debounce((element) => {
     saveElementPosition(element);
   }, 300);
   ```

3. **requestAnimationFrame**
   ```javascript
   function render() {
     canvas.renderAll();
     requestAnimationFrame(render);
   }
   ```

4. **Image Optimization**
   - Usar thumbnails na biblioteca
   - Lazy load de imagens
   - WebP format quando possível

---

## 🔐 Security Checklist

### ✅ Implementado:
- [x] Helmet.js (security headers)
- [x] CORS configurado
- [x] Rate limiting
- [x] File size limits
- [x] Input validation

### 🔄 Para produção:
- [ ] JWT authentication
- [ ] SQL injection protection (usando ORM)
- [ ] XSS sanitization
- [ ] HTTPS only
- [ ] Environment variables para secrets
- [ ] Logging de erros

---

## 🎯 Resumo das Decisões

| Área | Escolha | Alternativa | Razão |
|------|---------|-------------|-------|
| **Frontend** | React | Vue, Svelte | Ecosystem |
| **Canvas** | Fabric.js | Konva, Nativo | API rica |
| **Drag&Drop** | React DnD | dnd-kit | Maduro |
| **Backend** | Express | Fastify, Nest | Simplicidade |
| **Database** | PostgreSQL | MySQL, Mongo | Relacional |
| **ORM** | Sequelize | Prisma | Direto |
| **Styling** | CSS Modules | Tailwind, SC | Simples |
| **IA (v1)** | Mock | Real API | Custo/Demo |

---

## 💡 Recomendações Finais

### Para Demo:
1. ✅ Usar mocks para IA
2. ✅ Focar em UI/UX polida
3. ✅ Dados de exemplo realistas
4. ✅ Performance suficiente

### Para Produção:
1. 🔄 Migrar para IA real gradualmente
2. 🔄 Adicionar authentication
3. 🔄 Implementar caching
4. 🔄 Monitoring e logging
5. 🔄 Testes automatizados

---

## 📚 Recursos Úteis

### Documentação:
- React: https://react.dev
- Fabric.js: http://fabricjs.com
- Sequelize: https://sequelize.org
- Express: https://expressjs.com

### Tutoriais:
- React DnD: https://react-dnd.github.io/react-dnd
- TensorFlow.js: https://www.tensorflow.org/js
- Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

### Inspiração:
- Figma (canvas interaction)
- Canva (drag & drop)
- Excalidraw (drawing tools)

---

**Este documento serve como referência para decisões técnicas ao longo do desenvolvimento.**

