# 📋 Plano de Implementação: Filtros para SmartProjectTable

## 🎯 Objetivo
Adicionar funcionalidade de filtros para as colunas **Status**, **Contract** e **Design** na tabela `SmartProjectTable`, permitindo aos utilizadores filtrar projetos de forma eficiente.

---

## 📊 Análise da Situação Atual

### Estrutura Existente
- **Componente**: `SmartProjectTable.jsx`
- **Biblioteca UI**: HeroUI (NextUI)
- **Colunas com filtros necessários**:
  - `status`: Múltiplos valores (draft, created, in_progress, finished, approved, cancelled, in_queue, to_order, ordered)
  - `contract`: 3 valores (Sale, Rent 1Y, Rent 3Y)
  - `design`: 2 valores (Ready, Pending)

### Dados Disponíveis
- **Status**: Valores normalizados em `statusColorMap` e `statusLabelMap`
- **Contract**: Valores em `contractType` e `contractTypeKey` (sale, rent1y, rent3y)
- **Design**: Valores em `designStatus` e `designStatusKey` (ready, pending)

### Componentes de Referência
- `ProductFilters.jsx` - Exemplo de filtros com Select e Checkbox
- `ShopFilters.jsx` - Exemplo de filtros com RadioGroup

---

## 🏗️ Arquitetura da Solução

### 1. Componente de Filtros (`SmartProjectTableFilters.jsx`)

**Localização**: `client/src/components/features/SmartProjectTableFilters.jsx`

**Responsabilidades**:
- Renderizar controles de filtro (Select dropdowns)
- Gerir estado dos filtros selecionados
- Permitir limpar todos os filtros
- Mostrar contador de filtros ativos

**Componentes HeroUI a utilizar**:
- `Select` + `SelectItem` - Para filtros de dropdown
- `Button` - Para limpar filtros
- `Chip` - Para mostrar filtros ativos
- `Icon` - Para ícones de filtro

### 2. Estado dos Filtros

**Estrutura proposta**:
```javascript
const [filters, setFilters] = React.useState({
  status: [],        // Array de status selecionados (múltipla seleção)
  contract: [],      // Array de contract types selecionados
  design: []         // Array de design status selecionados
});
```

**Alternativa (seleção única)**:
```javascript
const [filters, setFilters] = React.useState({
  status: null,      // String ou null
  contract: null,    // String ou null
  design: null       // String ou null
});
```

### 3. Lógica de Filtragem

**Localização**: Dentro de `SmartProjectTable.jsx`

**Implementação**:
- Criar função `filteredProjects` que aplica os filtros antes da paginação
- Filtrar baseado nos valores dos campos do projeto
- Manter compatibilidade com paginação existente

---

## 📝 Plano de Implementação Detalhado

### Fase 1: Preparação e Estrutura Base

#### 1.1 Criar Componente de Filtros
- [ ] Criar arquivo `SmartProjectTableFilters.jsx`
- [ ] Importar componentes necessários do HeroUI
- [ ] Criar estrutura básica do componente
- [ ] Adicionar props: `filters`, `onFiltersChange`, `onClearFilters`

#### 1.2 Adicionar Traduções
- [ ] Adicionar chaves de tradução em `pt.json`, `en.json`, `fr.json`
- [ ] Chaves necessárias:
  - `pages.dashboard.smartProjectTable.filters.title`
  - `pages.dashboard.smartProjectTable.filters.status`
  - `pages.dashboard.smartProjectTable.filters.contract`
  - `pages.dashboard.smartProjectTable.filters.design`
  - `pages.dashboard.smartProjectTable.filters.clearAll`
  - `pages.dashboard.smartProjectTable.filters.activeFilters`
  - `pages.dashboard.smartProjectTable.filters.all`

### Fase 2: Implementação dos Filtros

#### 2.1 Filtro de Status (Múltipla Seleção)
- [ ] Criar Select com `selectionMode="multiple"`
- [ ] Popular com todos os status disponíveis
- [ ] Usar `statusLabelMap` para labels traduzidos
- [ ] Mapear valores: draft, created, in_progress, finished, approved, cancelled, in_queue, to_order, ordered

#### 2.2 Filtro de Contract (Seleção Múltipla ou Única)
- [ ] Criar Select com opções: Sale, Rent 1Y, Rent 3Y
- [ ] Usar traduções de `contractTypes`
- [ ] Mapear valores: sale, rent1y, rent3y

#### 2.3 Filtro de Design (Seleção Única ou Múltipla)
- [ ] Criar Select com opções: Ready, Pending
- [ ] Usar traduções de `designStatus`
- [ ] Mapear valores: ready, pending

#### 2.4 Botão Limpar Filtros
- [ ] Adicionar botão para limpar todos os filtros
- [ ] Mostrar apenas quando há filtros ativos
- [ ] Resetar estado para valores iniciais

### Fase 3: Integração com a Tabela

#### 3.1 Adicionar Estado de Filtros em SmartProjectTable
- [ ] Adicionar `useState` para filtros
- [ ] Criar função `handleFilterChange`
- [ ] Criar função `handleClearFilters`

#### 3.2 Implementar Lógica de Filtragem
- [ ] Criar função `getFilteredProjects`:
  ```javascript
  const getFilteredProjects = (projects, filters) => {
    return projects.filter(project => {
      // Filtrar por status
      if (filters.status.length > 0) {
        const normalizedStatus = project.status?.toLowerCase()?.replace(/\s+/g, '_');
        if (!filters.status.includes(normalizedStatus)) return false;
      }
      
      // Filtrar por contract
      if (filters.contract.length > 0) {
        const contractKey = project.contractTypeKey || 
          (project.contractType === "Sale" ? "sale" : 
           project.contractType === "Rent 1Y" ? "rent1y" : "rent3y");
        if (!filters.contract.includes(contractKey)) return false;
      }
      
      // Filtrar por design
      if (filters.design.length > 0) {
        const designKey = project.designStatusKey || 
          (project.designStatus === 'Ready' ? "ready" : "pending");
        if (!filters.design.includes(designKey)) return false;
      }
      
      return true;
    });
  };
  ```

#### 3.3 Aplicar Filtros Antes da Paginação
- [ ] Modificar `items` useMemo para usar projetos filtrados
- [ ] Recalcular `pages` baseado em projetos filtrados
- [ ] Resetar página para 1 quando filtros mudarem

#### 3.4 Adicionar Componente de Filtros à UI
- [ ] Importar `SmartProjectTableFilters`
- [ ] Adicionar acima da tabela (dentro do CardBody)
- [ ] Passar props necessárias

### Fase 4: Melhorias e UX

#### 4.1 Indicadores Visuais
- [ ] Mostrar contador de filtros ativos
- [ ] Mostrar chips com filtros selecionados
- [ ] Adicionar ícone de filtro

#### 4.2 Responsividade
- [ ] Garantir que filtros funcionam em mobile
- [ ] Usar layout flexível (flex-wrap)
- [ ] Ajustar largura dos selects em telas pequenas

#### 4.3 Performance
- [ ] Usar `React.useMemo` para projetos filtrados
- [ ] Usar `React.useCallback` para handlers
- [ ] Evitar re-renders desnecessários

#### 4.4 Acessibilidade
- [ ] Adicionar `aria-label` aos selects
- [ ] Adicionar `aria-describedby` para descrições
- [ ] Garantir navegação por teclado

---

## 🎨 Design e Layout Proposto

### Estrutura Visual
```
┌─────────────────────────────────────────────────┐
│  [🔍 Filtros]                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Status ▼ │ │Contract ▼│ │Design ▼ │ [Limpar]│
│  └──────────┘ └──────────┘ └──────────┘        │
│  [Chip: Status1] [Chip: Contract1]             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  [Tabela de Projetos]                           │
│  ...                                             │
└─────────────────────────────────────────────────┘
```

### Posicionamento
- **Localização**: Dentro do `CardBody`, antes do `div` que contém a `Table`
- **Estilo**: Barra horizontal com espaçamento adequado
- **Background**: Pode usar `bg-default-50` ou manter transparente

---

## 📦 Dependências Necessárias

### Já Instaladas (HeroUI)
- ✅ `Select` / `SelectItem`
- ✅ `Button`
- ✅ `Chip`
- ✅ `Icon` (via @iconify/react)

### Nenhuma dependência adicional necessária

---

## 🔄 Fluxo de Dados

```
SmartProjectTable
  ├── filters (state)
  │   ├── status: []
  │   ├── contract: []
  │   └── design: []
  │
  ├── SmartProjectTableFilters
  │   ├── Recebe: filters, onFiltersChange, onClearFilters
  │   └── Emite: novos valores de filtros
  │
  ├── getFilteredProjects(projects, filters)
  │   └── Retorna: projetos filtrados
  │
  └── items (useMemo)
      ├── Usa: getFilteredProjects
      ├── Aplica: paginação
      └── Renderiza: na tabela
```

---

## 🧪 Casos de Teste

### Testes Funcionais
1. **Filtro de Status**
   - [ ] Selecionar um status → mostra apenas projetos com esse status
   - [ ] Selecionar múltiplos status → mostra projetos com qualquer um dos status
   - [ ] Limpar filtro → mostra todos os projetos

2. **Filtro de Contract**
   - [ ] Selecionar "Sale" → mostra apenas projetos de venda
   - [ ] Selecionar múltiplos tipos → mostra projetos de qualquer tipo selecionado
   - [ ] Limpar filtro → mostra todos os projetos

3. **Filtro de Design**
   - [ ] Selecionar "Ready" → mostra apenas projetos com design pronto
   - [ ] Selecionar "Pending" → mostra apenas projetos com design pendente
   - [ ] Limpar filtro → mostra todos os projetos

4. **Filtros Combinados**
   - [ ] Status + Contract → mostra projetos que atendem ambos
   - [ ] Status + Design → mostra projetos que atendem ambos
   - [ ] Todos os filtros → mostra projetos que atendem todos

5. **Paginação**
   - [ ] Aplicar filtro → resetar para página 1
   - [ ] Mudar página → manter filtros aplicados
   - [ ] Limpar filtros → resetar para página 1

### Testes de UX
- [ ] Filtros são intuitivos e fáceis de usar
- [ ] Indicadores visuais claros de filtros ativos
- [ ] Botão limpar é facilmente acessível
- [ ] Layout responsivo funciona bem

---

## 📚 Documentação de Referência

### HeroUI Table Documentation
- **Componente Table**: Suporta filtros através de props customizadas
- **Select Component**: Suporta `selectionMode="multiple"` para seleção múltipla
- **Documentação**: Fornecida pelo utilizador (HeroUI v2.8.5)

### Padrões do Projeto
- **ProductFilters.jsx**: Exemplo de filtros com Select
- **ShopFilters.jsx**: Exemplo de filtros com RadioGroup
- **Traduções**: Padrão i18n com react-i18next

---

## ⚠️ Considerações Importantes

### Decisões de Design
1. **Seleção Múltipla vs Única**:
   - **Recomendação**: Múltipla seleção para Status (muitos valores)
   - **Recomendação**: Múltipla seleção para Contract (3 valores, pode querer ver vários)
   - **Recomendação**: Múltipla seleção para Design (2 valores, mas consistente com outros)

2. **Reset de Página**:
   - Quando filtros mudam, resetar para página 1
   - Evitar página vazia quando filtros reduzem resultados

3. **Performance**:
   - Filtrar antes da paginação (mais eficiente)
   - Usar memoização para evitar recálculos desnecessários

### Compatibilidade
- ✅ Compatível com estrutura atual da tabela
- ✅ Não quebra funcionalidades existentes
- ✅ Mantém paginação funcionando
- ✅ Mantém traduções existentes

---

## 🚀 Ordem de Implementação Recomendada

1. **Fase 1**: Criar estrutura base e traduções
2. **Fase 2**: Implementar componente de filtros
3. **Fase 3**: Integrar com tabela e aplicar lógica de filtragem
4. **Fase 4**: Melhorias de UX e performance

---

## 📝 Notas Finais

- Este plano assume que os dados dos projetos já contêm os campos necessários (`status`, `contractType`/`contractTypeKey`, `designStatus`/`designStatusKey`)
- Se algum campo não existir nos dados reais, será necessário ajustar a lógica de filtragem
- O plano pode ser adaptado conforme necessário durante a implementação
- Considerar adicionar filtros adicionais no futuro (ex: budget range, dates)

---

**Data de Criação**: 2025-01-27  
**Última Atualização**: 2025-01-27  
**Versão**: 1.0

