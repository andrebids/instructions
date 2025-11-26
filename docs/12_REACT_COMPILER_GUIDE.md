# React Compiler & ESLint Integration Guide

Este guia documenta a integração do React Compiler e ESLint no projeto TheCore.

## 📦 Pacotes Instalados

- **babel-plugin-react-compiler@1.0.0** (versão exata/pinada)
- **eslint@9.39.1**
- **eslint-plugin-react-hooks@7.0.1**

## 🚀 React Compiler

### O que é?

O React Compiler é uma ferramenta de otimização que aplica **auto-memoização inteligente** ao código React baseado em análise estática e heurísticas. Ele elimina a necessidade de usar `useMemo`, `useCallback` e `React.memo` manualmente na maioria dos casos.

### Como Funciona?

O compiler analisa seu código durante o build e automaticamente:
- Memoiza componentes e valores quando apropriado
- Otimiza re-renders desnecessários
- Suporta optional chains e array indices como dependências
- Funciona mesmo em casos onde `useMemo`/`useCallback` não podem ser usados (ex: após early return)

### Performance Esperada

Baseado em casos reais da Meta (Quest Store):
- **Initial loads e navegação**: até 12% mais rápido
- **Interações específicas**: até 2.5× mais rápido
- **Uso de memória**: neutro (sem overhead)

> **Nota**: Resultados podem variar. Recomendamos monitorar performance no seu caso específico.

### Configuração

O compiler está configurado em `vite.config.js`:

```javascript
react({
  babel: {
    plugins: [
      ['babel-plugin-react-compiler']
    ],
  },
  jsxRuntime: 'automatic',
})
```

## 🔍 ESLint Rules

### Regras Implementadas

O `eslint-plugin-react-hooks@latest` inclui regras do React Compiler que detectam violações das **Rules of React**:

#### 1. `set-state-in-render`
Detecta padrões de `setState` que causam render loops.

**❌ Incorreto:**
```javascript
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // Causa render loop!
  return <div>{count}</div>;
}
```

**✅ Correto:**
```javascript
function Component() {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    setCount(count + 1);
  }, []);
  
  return <div>{count}</div>;
}
```

#### 2. `set-state-in-effect`
Detecta trabalho pesado ou setState desnecessário dentro de effects.

**❌ Incorreto:**
```javascript
useEffect(() => {
  setData(expensiveComputation()); // Pode causar re-renders excessivos
}, [dependency]);
```

**✅ Correto:**
```javascript
const memoizedData = useMemo(() => expensiveComputation(), [dependency]);
```

#### 3. `refs`
Previne acesso inseguro a refs durante render.

**❌ Incorreto:**
```javascript
function Component() {
  const ref = useRef();
  console.log(ref.current.value); // Acesso durante render!
  return <input ref={ref} />;
}
```

**✅ Correto:**
```javascript
function Component() {
  const ref = useRef();
  
  useEffect(() => {
    console.log(ref.current.value); // Acesso em effect
  }, []);
  
  return <input ref={ref} />;
}
```

### Executar Linting

```bash
# Verificar violações
npm run lint

# Corrigir automaticamente (quando possível)
npm run lint:fix
```

## 🎯 Estratégia de Memoização

### Para Código Novo

**Confie no compiler** para memoização automática. Não use `useMemo`/`useCallback` por padrão.

```javascript
// ✅ Deixe o compiler otimizar
function Component({ items }) {
  const filteredItems = items.filter(item => item.active);
  return <List items={filteredItems} />;
}
```

### Para Código Existente

**Mantenha** `useMemo`, `useCallback` e `React.memo` existentes. Removê-los pode mudar o output de compilação.

> **Importante**: O projeto tem 32 arquivos com uso de `useMemo`/`useCallback`. Estes devem ser mantidos.

### Quando Usar Memoização Manual?

Use `useMemo`/`useCallback` como **escape hatch** quando precisar de controle preciso:

#### Caso de Uso: Effect Dependencies

```javascript
function Component({ data }) {
  // Garantir que effect não dispare repetidamente
  const processedData = useMemo(() => {
    return expensiveProcessing(data);
  }, [data]);
  
  useEffect(() => {
    // Effect só dispara quando processedData muda semanticamente
    sendToAnalytics(processedData);
  }, [processedData]);
}
```

## 🔄 Estratégia de Upgrade

### Versão Pinada

O compiler está instalado com versão **exata** (1.0.0) usando `--save-exact`.

**Por quê?**
- Mudanças na memoização podem afetar comportamento de componentes que violam Rules of React
- Versão pinada previne mudanças inesperadas em upgrades automáticos
- Permite testar upgrades manualmente com segurança

### Como Fazer Upgrade

1. **Ler Changelog**: Verificar breaking changes e mudanças de memoização
2. **Testar Localmente**: 
   ```bash
   npm install --save-dev --save-exact babel-plugin-react-compiler@<nova-versao>
   npm run build
   npm run dev
   ```
3. **Testar Funcionalidades Críticas**: Dashboard, Shop, criação de projetos, etc.
4. **Monitorar Performance**: Comparar métricas antes/depois
5. **Deploy Gradual**: Se possível, testar em staging antes de produção

### Rollback

Se encontrar problemas, reverter é simples:

```bash
# 1. Remover compiler do vite.config.js
# 2. Desinstalar pacote
npm uninstall babel-plugin-react-compiler

# 3. Rebuild
npm run build
```

## ⚠️ Troubleshooting

### Build Lento

O compiler pode aumentar tempo de build inicial. Isso é normal e esperado.

**Solução**: Considerar usar cache de build ou CI/CD otimizado.

### Erros de Runtime

Se componentes apresentarem comportamento inesperado:

1. **Verificar Rules of React**: Execute `npm run lint` para identificar violações
2. **Testar sem Compiler**: Remover temporariamente do `vite.config.js`
3. **Reportar Issue**: Se for bug do compiler, reportar no [GitHub](https://github.com/facebook/react/issues)

### ESLint Warnings Excessivos

Se houver muitos warnings:

1. **Priorizar**: Corrigir violações críticas primeiro
2. **Suprimir Temporariamente**: Usar `// eslint-disable-next-line` apenas quando necessário
3. **Refatorar Gradualmente**: Não precisa corrigir tudo de uma vez

## 📚 Recursos

### React Compiler
- [Documentação Oficial](https://react.dev/learn/react-compiler)
- [Guia de Instalação](https://react.dev/learn/react-compiler#installation)
- [Adoção Incremental](https://react.dev/learn/react-compiler#adopting-the-compiler)
- [NPM Package](https://www.npmjs.com/package/babel-plugin-react-compiler)

### ESLint
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [ESLint Flat Config](https://eslint.org/docs/latest/use/configure/configuration-files)
- [React Compiler ESLint Rules](https://react.dev/learn/react-compiler#eslint-plugin-react-compiler)

### Vite Integration
- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react)
- [Babel Plugin Configuration](https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#using-babel-plugins)

## 🎓 Best Practices

1. **Confie no Compiler**: Para código novo, deixe o compiler fazer o trabalho
2. **Siga as Rules of React**: Use ESLint para garantir código correto
3. **Teste Regularmente**: Monitore performance e comportamento
4. **Upgrade com Cuidado**: Sempre teste antes de fazer upgrade do compiler
5. **Documente Exceções**: Se precisar desabilitar regras, documente o porquê

---

**Última Atualização**: 2025-11-26  
**Versão do Compiler**: 1.0.0  
**Compatibilidade**: React 19.2.0

