# CreateProjectMultiStep - Componente Refatorado

## 📊 Estatísticas da Refatoração

- **Antes:** 854 linhas num único ficheiro
- **Depois:** ~23 módulos especializados (50-250 linhas cada)
- **Redução de complexidade:** ~82%
- **Data:** 10 de Outubro de 2025

## 📁 Estrutura de Ficheiros

```
create-project-multi-step/
├── index.jsx                    # Orquestrador principal (~180 linhas)
├── constants.js                 # Configurações globais (STEPS, CANVAS_CONFIG, LOG_CONFIG)
│
├── hooks/                       # Custom Hooks (lógica de negócio)
│   ├── useProjectForm.js        # Estado do formulário e submissão
│   ├── useClientManagement.js   # Gestão de clientes (CRUD)
│   ├── useStepNavigation.js     # Navegação entre steps condicionais
│   └── useCanvasManager.js      # Gestão dos canvas Konva (futura implementação)
│
├── steps/                       # Steps do wizard
│   ├── StepProjectDetails.jsx   # Step 1: Nome, Cliente, Data, Budget
│   ├── StepProjectType.jsx      # Step 2: Tipo (Simu/Logo) + Workflow
│   ├── StepLocationDescription.jsx # Step 3: Localização e Descrição
│   └── StepConfirmDetails.jsx   # Step 4: Review final
│
├── components/                  # Componentes reutilizáveis
│   ├── StepIndicator.jsx        # Indicador de progresso horizontal
│   ├── NavigationFooter.jsx     # Footer com botões de navegação
│   ├── ClientAutocomplete.jsx   # Autocomplete de clientes
│   ├── AddClientModal.jsx       # Modal para adicionar cliente
│   ├── ProjectTypeCard.jsx      # Card de tipo de projeto
│   └── SimuWorkflowSelector.jsx # Seletor AI/Human para Simu
│
└── utils/                       # Utilitários
    ├── logger.js                # Sistema de logging configurável
    ├── validation.js            # Validações por step ID
    ├── mockData.js              # Dados mock (clientes, nomes)
    ├── stepHelpers.js           # Lógica de steps condicionais
    └── canvasHelpers.js         # Helpers Konva (futura implementação)
```

## 🎯 Funcionalidades

### ✅ Implementadas
- ✅ Step 1: Detalhes do projeto (nome, cliente, data, budget)
- ✅ Step 2: Tipo de projeto (Simu/Logo)
- ✅ Step 2.1: Workflow Simu (AI/Human) - condicional
- ✅ Step 3: Localização e descrição (opcionais)
- ✅ Step 4: Confirmação e review
- ✅ Navegação dinâmica entre steps
- ✅ Validação por step com feedback visual
- ✅ Sistema de logging configurável (7 níveis)
- ✅ Gestão de clientes (mock data)
- ✅ Modal de adicionar novo cliente
- ✅ Submissão para API com tratamento de erros

### 🔜 Pendentes (Aguardam Konva)
- ⏳ Step 3 (Canvas): Seleção de decorações (apenas Simu)
- ⏳ Step 4 (Canvas): Posicionamento detalhado (apenas Simu)
- ⏳ Undo/Redo no canvas
- ⏳ Export de dados do canvas

## 🔧 Como Usar

### Import do Componente
```jsx
import { CreateProjectMultiStep } from "./components/create-project-multi-step";

// Uso
<CreateProjectMultiStep onClose={() => console.log("Closed")} />
```

### Props
- `onClose`: Callback chamado após submissão bem-sucedida ou cancelamento

## 🧪 Sistema de Logging

O sistema de logging pode ser configurado em `constants.js`:

```javascript
export const LOG_CONFIG = {
  ENABLE_LOGS: true,  // Toggle global (false em produção)
  LEVELS: {
    LIFECYCLE: true,    // Mounting, unmounting
    NAVIGATION: true,   // Step changes
    VALIDATION: true,   // Validação de steps
    CANVAS: true,       // Operações no canvas
    API: true,          // Chamadas API
    USER_ACTION: true,  // Cliques, inputs
  }
};
```

### Breakpoints de Teste

7 breakpoints de teste estão integrados para debug:
- `TEST_BREAKPOINT_1`: Constants loaded
- `TEST_BREAKPOINT_2`: useProjectForm initialized
- `TEST_BREAKPOINT_3`: Step changed
- `TEST_BREAKPOINT_4`: Canvas state
- `TEST_BREAKPOINT_5`: Main component mounted
- `TEST_BREAKPOINT_6`: Validation
- `TEST_BREAKPOINT_7`: API call

## 📋 Steps Condicionais

O wizard adapta-se dinamicamente baseado no tipo de projeto:

### Fluxo Logo (4 steps):
1. Project Details
2. Project Type (seleciona Logo)
3. Location & Description
4. Confirm Details

### Fluxo Simu (6 steps futuros):
1. Project Details
2. Project Type (seleciona Simu + AI/Human)
3. **Canvas: Select Decorations** ← Condicional
4. **Canvas: Position Elements** ← Condicional
5. Location & Description
6. Confirm Details

## 🚀 Vantagens da Refatoração

### Modularidade
- Cada componente tem responsabilidade única
- Fácil localizar onde fazer alterações
- Reduz acoplamento entre componentes

### Reutilização
- Componentes podem ser usados em outros contexts
- Hooks compartilháveis entre formulários

### Testabilidade
- Cada módulo pode ser testado isoladamente
- Mocks mais simples

### Manutenção
- Alterações em Step 1 não afetam Step 2
- Bug fixes mais rápidos (scope reduzido)
- Code reviews mais fáceis (ficheiros menores)

### Escalabilidade
- Adicionar novo step é trivial
- Novos tipos de projeto = novo card
- Fácil adicionar validações customizadas

## 🔄 Migração do Ficheiro Original

O ficheiro original foi preservado como backup:
```
create-project-multi-step.jsx.backup
```

Para restaurar se necessário:
```bash
cd src/components
mv create-project-multi-step.jsx.backup create-project-multi-step.jsx
rm -rf create-project-multi-step/  # Remover pasta refatorada
```

## 📝 Notas Técnicas

### Estado do Formulário (formData)
```javascript
{
  name: "",
  projectType: null,          // "simu" | "logo"
  simuWorkflow: null,         // "ai" | "human" (apenas se Simu)
  status: "created",
  clientId: null,
  selectedClientKey: null,
  clientName: "",
  clientEmail: "",
  clientPhone: "",
  startDate: null,
  endDate: null,
  budget: "",
  location: "",
  description: "",
  canvasSelection: [],        // 🆕 Array de decorações (futura implementação)
  canvasPositioning: [],      // 🆕 Array de posições (futura implementação)
}
```

### Dependências Pendentes

Para ativar os canvas steps, instalar:
```bash
npm install konva@^10.0.0 react-konva@^18.2.10 use-image@^1.1.1
```

Depois, descomentar steps de canvas em `index.jsx`.

## ✅ Compatibilidade

- ✅ React 19.2.0
- ✅ HeroUI 2.8.5
- ✅ @internationalized/date
- ✅ @iconify/react 6.0.2
- ✅ Framer Motion 12.23.22

## 📚 Referências

- Plano original: `/docs/10_REFACTORING_CREATE_PROJECT_MULTISTEP.md`
- Código original: `create-project-multi-step.jsx.backup`
- Canvas Guide: `/docs/08_CANVAS_KONVA_GUIDE.md`

---

**Autor:** AI Assistant (Claude)  
**Data:** 10 de Outubro de 2025  
**Versão:** 1.0.0 (sem Canvas Konva)

