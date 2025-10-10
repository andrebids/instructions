# DecorationLibrary Component

Componente modular e reutilizável para biblioteca de decorações com funcionalidades de drag-and-drop, pesquisa e navegação por categorias.

## Funcionalidades

- ✅ **Navegação por categorias** - Menu com categorias e botão "Todas"
- ✅ **Pesquisa em tempo real** - Pesquisa por nome, referência ou tags
- ✅ **Drag-and-drop** - Arrastar decorações para canvas (HTML5 nativo por agora)
- ✅ **Dados JSON** - Base de dados estruturada em JSON
- ✅ **Logs estratégicos** - Console logs para debugging
- ✅ **Responsivo** - Adapta-se a diferentes tamanhos de ecrã
- ✅ **HeroUI** - Interface consistente com o resto da aplicação

## Estrutura

```
decoration-library/
├── index.jsx                    # Componente principal
├── components/
│   ├── CategoryMenu.jsx        # Menu de navegação por categorias
│   ├── DecorationGrid.jsx      # Grid de decorações
│   ├── DecorationItem.jsx      # Item individual arrastável
│   └── SearchBar.jsx           # Barra de pesquisa
├── hooks/
│   ├── useDecorations.js       # Hook para gerir decorações
│   └── useDecorationSearch.js  # Hook para pesquisa/filtros
├── data/
│   └── decorations.json        # Base de dados das decorações
└── README.md                   # Esta documentação
```

## Uso

### Importação Básica

```jsx
import { DecorationLibrary } from './components/decoration-library';

function MyComponent() {
  const handleDecorationSelect = (decoration) => {
    console.log('Decoração selecionada:', decoration);
  };

  return (
    <DecorationLibrary
      onDecorationSelect={handleDecorationSelect}
      mode="sidebar"
      enableSearch={true}
      className="w-64"
    />
  );
}
```

### Props

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `onDecorationSelect` | `function` | - | Callback quando decoração é arrastada/selecionada |
| `mode` | `"sidebar" \| "modal"` | `"sidebar"` | Modo de visualização |
| `className` | `string` | `""` | Classes CSS adicionais |
| `enableSearch` | `boolean` | `true` | Ativar barra de pesquisa |
| `initialCategory` | `string` | `null` | Categoria inicial selecionada |

### Dados das Decorações

Cada decoração tem a seguinte estrutura:

```javascript
{
  "id": "dec-001",
  "name": "Pine Tree",
  "ref": "TREE-PINE-001",
  "category": "trees-plants",
  "icon": "🌲",
  "imageUrl": null,
  "type": "tree",
  "tags": ["tree", "pine", "christmas"]
}
```

## Drag-and-Drop

Por enquanto usa HTML5 native drag-and-drop. Quando `@dnd-kit` estiver instalado, será migrado para uma implementação superior com:

- ✅ Suporte touch devices
- ✅ Melhor performance
- ✅ Acessibilidade keyboard
- ✅ Customização avançada

## Logs de Debug

O componente inclui logs estratégicos para debugging:

```javascript
🎨 [DecorationLibrary] Montado - modo: sidebar
📚 [useDecorations] Carregadas: 12 decorations
📂 [DecorationLibrary] Mudando categoria para: trees-plants
🔍 [useDecorationSearch] Pesquisando: pine
🎯 [DecorationItem] Iniciando drag: Pine Tree
```

## Personalização

### Adicionar Nova Decoração

Editar `data/decorations.json`:

```json
{
  "id": "dec-013",
  "name": "New Decoration",
  "ref": "NEW-001",
  "category": "trees-plants",
  "icon": "🆕",
  "imageUrl": null,
  "type": "new",
  "tags": ["new", "custom"]
}
```

### Adicionar Nova Categoria

1. Adicionar categoria em `categories` array
2. Atualizar `count` das categorias existentes
3. Atribuir `category` nas decorações

## Próximos Passos

- [ ] Instalar `@dnd-kit/core` e `@dnd-kit/utilities`
- [ ] Migrar para dnd-kit (melhor performance)
- [ ] Suporte a imagens PNG
- [ ] Modo modal para popup
- [ ] Favoritos/pin decorações
- [ ] Histórico de uso recente
