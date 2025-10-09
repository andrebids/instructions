# HeroUI MCP Server - Integração no Projeto

> Documento criado em **9 de outubro de 2025**  
> Explica como usar o HeroUI MCP Server no desenvolvimento

---

## 🎯 O Que É?

O **HeroUI MCP Server** é um servidor Model Context Protocol que fornece:
- 📚 Documentação completa de componentes HeroUI
- 🔍 API Reference (props, slots, events)
- 💡 Exemplos de uso e padrões
- ♿ Guidelines de acessibilidade
- 🎨 Best practices

**É como ter a documentação oficial do HeroUI acessível via API!**

---

## 💡 Por Que Usar?

### Vantagens:

1. **Desenvolvimento Mais Rápido**
   - Consulta rápida de props disponíveis
   - Exemplos prontos a usar
   - Sem sair do IDE

2. **Menos Erros**
   - Ver tipos exatos das props
   - Validar uso correto
   - Descobrir funcionalidades que não conhecias

3. **Melhor Acessibilidade**
   - Guidelines de ARIA labels
   - Keyboard navigation
   - Screen reader support

4. **Aprendizagem Contínua**
   - Descobrir novos componentes
   - Ver padrões recomendados
   - Melhorar qualidade do código

---

## 🚀 Como Usar no Nosso Projeto

### **Cenário 1: Durante Desenvolvimento (Recomendado)**

```bash
# Em terminal separado, iniciar MCP Server
cd instructions-project/dev-tools/heroui-mcp
pnpm start

# Usar MCP Inspector para consultar
npx @modelcontextprotocol/inspector
# Conectar a: http://localhost:3000
```

**Quando usar:**
- ❓ "Como uso o DateInput?"
- ❓ "Que props tem o Modal?"
- ❓ "Como fazer um Autocomplete com validação?"
- ❓ "Este componente é acessível?"

### **Cenário 2: Integrar no Projeto (Opcional)**

Criámos um componente helper em: `dev-tools/heroui-helper-component.jsx`

```jsx
// Em qualquer página (apenas em dev mode)
import { HeroUIHelper } from '../dev-tools/heroui-helper-component';

{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 w-96 z-50">
    <HeroUIHelper component="Modal" autoLoad={true} />
  </div>
)}
```

**Resultado:** Painel flutuante com documentação do componente em tempo real!

### **Cenário 3: Página de Component Library (Futuro)**

Criar uma página `/dev/components` que lista todos os componentes HeroUI usados no projeto:

```jsx
import { HeroUIComponentList } from '../dev-tools/heroui-helper-component';

export function ComponentLibraryPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        HeroUI Components Reference
      </h1>
      <HeroUIComponentList />
    </div>
  );
}
```

---

## 📦 Setup Inicial

### 1. Instalar o MCP Server

```bash
# Criar pasta dev-tools se não existir
mkdir instructions-project/dev-tools
cd instructions-project/dev-tools

# Clonar repositório
git clone https://github.com/T-Hash06/heroui-mcp.git
cd heroui-mcp

# Instalar dependências (requer Node.js 18+)
npm install -g pnpm
pnpm install

# Build
pnpm build

# Testar
pnpm start
# Deve iniciar em: http://localhost:3000
```

### 2. Verificar Funcionamento

```bash
# Testar API
curl http://localhost:3000/api/components

# Deve retornar lista de componentes:
# ["Button", "Card", "Modal", "Table", ...]
```

### 3. Instalar MCP Inspector (Opcional)

```bash
# Instalar globalmente
npm install -g @modelcontextprotocol/inspector

# Ou usar com npx
npx @modelcontextprotocol/inspector
```

---

## 🎮 Exemplos de Uso

### Exemplo 1: Consultar Props de um Componente

**Via API:**
```javascript
fetch('http://localhost:3000/api/components/Button/api')
  .then(res => res.json())
  .then(data => {
    console.log('Props disponíveis:', data.props);
    /*
    {
      color: "primary | secondary | success | warning | danger | default",
      size: "sm | md | lg",
      variant: "solid | bordered | light | flat | faded | shadow | ghost",
      isLoading: "boolean",
      isDisabled: "boolean",
      ...
    }
    */
  });
```

**Via Helper Component:**
```jsx
<HeroUIHelper component="Button" autoLoad={true} />
// Mostra painel interativo com toda a info
```

### Exemplo 2: Ver Exemplos de Uso

```javascript
fetch('http://localhost:3000/api/components/Modal/usage')
  .then(res => res.json())
  .then(data => {
    console.log('Exemplos:', data.examples);
    /*
    [
      {
        title: "Basic Modal",
        code: "<Modal isOpen={isOpen} onClose={onClose}>...</Modal>",
        description: "Simple modal with open/close control"
      },
      ...
    ]
    */
  });
```

### Exemplo 3: Verificar Acessibilidade

```javascript
fetch('http://localhost:3000/api/components/Modal/accessibility')
  .then(res => res.json())
  .then(data => {
    console.log('Accessibility:', data);
    /*
    {
      ariaLabels: ["Use aria-label for close button", ...],
      keyboardNav: [
        { key: "Escape", action: "Close modal" },
        { key: "Tab", action: "Navigate between elements" }
      ],
      bestPractices: [...]
    }
    */
  });
```

---

## 🛠️ Ferramentas Disponíveis

### API Endpoints:

| Endpoint | Descrição | Exemplo |
|----------|-----------|---------|
| `GET /api/components` | Lista todos os componentes | `/api/components` |
| `GET /api/components/:name/docs` | Documentação completa | `/api/components/Button/docs` |
| `GET /api/components/:name/api` | Props, slots, events | `/api/components/Button/api` |
| `GET /api/components/:name/slots` | Informação de slots | `/api/components/Modal/slots` |
| `GET /api/components/:name/data-attributes` | Data attributes | `/api/components/Button/data-attributes` |
| `GET /api/components/:name/accessibility` | Acessibilidade | `/api/components/Modal/accessibility` |
| `GET /api/components/:name/usage` | Exemplos e padrões | `/api/components/Button/usage` |

---

## 📋 Casos de Uso Reais no Projeto

### Caso 1: Implementar DateInput no Formulário Multi-Step

**Problema:** Precisas de um DatePicker mas não sabes como configurar

**Solução:**
```bash
# Consultar MCP Server
curl http://localhost:3000/api/components/DateInput/docs
```

**Resultado:** Vês que existe `DateInput` com props:
- `label`: String
- `value`: DateValue
- `onChange`: (date: DateValue) => void
- `minValue`: DateValue (para validação)
- `isRequired`: boolean

**Implementação:**
```jsx
import { DateInput } from '@heroui/react';
import { parseDate } from '@internationalized/date';

<DateInput
  label="Data de Início"
  value={formData.startDate}
  onChange={(date) => handleInputChange('startDate', date)}
  minValue={parseDate(new Date().toISOString().split('T')[0])}
  isRequired
/>
```

### Caso 2: Melhorar Acessibilidade do Modal

**Problema:** Modal funciona mas não está acessível

**Solução:**
```bash
curl http://localhost:3000/api/components/Modal/accessibility
```

**Resultado:** Descobres que precisas de:
- ✅ `aria-label` no botão de fechar
- ✅ `role="dialog"` (já incluído no HeroUI)
- ✅ Keyboard navigation (Escape para fechar)
- ✅ Focus trap dentro do modal

**Implementação:**
```jsx
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>
      <h2 id="modal-title">Criar Projeto</h2>
    </ModalHeader>
    <ModalBody aria-labelledby="modal-title">
      {/* Conteúdo */}
    </ModalBody>
    <ModalFooter>
      <Button 
        onPress={onClose}
        aria-label="Fechar modal"
      >
        Fechar
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>
```

### Caso 3: Descobrir Novos Componentes

**Situação:** Queres melhorar a UX do Autocomplete de clientes

**Exploração:**
```bash
# Ver todos os componentes disponíveis
curl http://localhost:3000/api/components

# Descobres: Autocomplete, Select, Combobox
# Consultar cada um
curl http://localhost:3000/api/components/Autocomplete/docs
```

**Resultado:** Descobres que `Autocomplete` tem:
- `allowsCustomValue` - Permite criar novos valores
- `onInputChange` - Callback quando texto muda
- `startContent` / `endContent` - Ícones
- `isLoading` - Estado de loading

**Melhoria no código:**
```jsx
<Autocomplete
  label="Cliente"
  placeholder="Procurar ou criar cliente..."
  allowsCustomValue
  isLoading={loadingClients}
  startContent={<Icon icon="lucide:search" />}
  endContent={
    shouldShowAddNew && (
      <Button size="sm" onPress={openNewClientModal}>
        + Novo
      </Button>
    )
  }
  onInputChange={handleClientInputChange}
  onSelectionChange={handleClientSelection}
>
  {clients.map(client => (
    <AutocompleteItem key={client.id}>
      {client.name}
    </AutocompleteItem>
  ))}
</Autocomplete>
```

---

## ⚙️ Configuração do Projeto

### Adicionar aos Scripts de Dev

Podes adicionar um script npm para facilitar:

```json
// package.json (root)
{
  "scripts": {
    "dev": "concurrently \"npm:dev:*\"",
    "dev:client": "cd instructions-project/client && npm run dev",
    "dev:server": "cd instructions-project/server && npm run dev",
    "dev:heroui-mcp": "cd instructions-project/dev-tools/heroui-mcp && pnpm start",
    "heroui:inspector": "npx @modelcontextprotocol/inspector"
  }
}
```

Depois:
```bash
# Iniciar tudo de uma vez
npm run dev

# Ou apenas o MCP Server
npm run dev:heroui-mcp

# Ou apenas o Inspector
npm run heroui:inspector
```

---

## 🎓 Melhores Práticas

### ✅ DO:

1. **Usar durante desenvolvimento**
   - Consultar antes de implementar novo componente
   - Verificar props disponíveis
   - Ver exemplos oficiais

2. **Validar acessibilidade**
   - Sempre consultar guidelines de accessibility
   - Implementar keyboard navigation
   - Adicionar ARIA labels apropriados

3. **Descobrir funcionalidades**
   - Explorar componentes que não conheces
   - Ver slots disponíveis
   - Aprender padrões recomendados

### ❌ DON'T:

1. **Não incluir em produção**
   - MCP Server é para desenvolvimento apenas
   - Não fazer deploy do servidor
   - Remover helper components em produção

2. **Não confiar 100% sem testar**
   - A documentação pode estar desatualizada
   - Sempre testar no teu código
   - Verificar versão do HeroUI (estamos na v2.8.5)

3. **Não ignorar a documentação oficial**
   - MCP Server é complementar
   - Docs oficiais são sempre a fonte de verdade
   - https://www.heroui.com/docs

---

## 🔧 Troubleshooting

### Problema: Porta 3000 já em uso

**Solução:**
```bash
# Usar porta diferente
cd instructions-project/dev-tools/heroui-mcp
PORT=3001 pnpm start
```

### Problema: "Component not found"

**Possíveis causas:**
1. Componente não existe no HeroUI
2. Nome incorreto (case sensitive)
3. Cache desatualizado

**Solução:**
```bash
# Verificar lista de componentes
curl http://localhost:3000/api/components

# Limpar cache
cd instructions-project/dev-tools/heroui-mcp
rm -rf cache
pnpm start
```

### Problema: Server não inicia

**Verificar:**
1. Node.js versão 18+: `node --version`
2. Dependências instaladas: `pnpm install`
3. Build feito: `pnpm build`

---

## 📚 Recursos

### Documentação:
- **HeroUI Oficial**: https://www.heroui.com/docs
- **MCP Server GitHub**: https://github.com/T-Hash06/heroui-mcp
- **MCP Protocol**: https://modelcontextprotocol.io

### Nosso Projeto:
- **Setup Guide**: `instructions-project/dev-tools/heroui-mcp-setup.md`
- **Helper Component**: `instructions-project/dev-tools/heroui-helper-component.jsx`
- **HeroUI Guide**: `docs/06_DASHBOARD_COM_HEROUI.md`

---

## 🎯 Próximos Passos

### Imediato:
1. ✅ Instalar MCP Server localmente
2. ✅ Testar com MCP Inspector
3. ✅ Consultar componentes que já usas (Modal, Autocomplete, etc.)

### Curto Prazo:
1. Integrar helper component no projeto (opcional)
2. Criar página `/dev/components` para referência rápida
3. Validar acessibilidade de componentes existentes

### Longo Prazo:
1. Usar sempre que implementar novo componente
2. Manter documentação interna atualizada
3. Partilhar conhecimento com equipa

---

## 💡 Conclusão

O HeroUI MCP Server é uma **ferramenta de desenvolvimento poderosa** que:
- 🚀 Acelera desenvolvimento
- 📚 Melhora conhecimento dos componentes
- ♿ Garante acessibilidade
- 🎯 Reduz erros

**Recomendação:** Instalar e usar como referência durante desenvolvimento!

---

**Última atualização:** 9 de outubro de 2025  
**Status:** Documentado ✅ | Pronto para usar 🚀

