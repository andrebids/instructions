# DecorationLibrary Component

Modular and reusable component for decorations library with drag-and-drop functionality, search and category navigation.

## Features

- ✅ **Hierarchical navigation** - First view categories (Transversal, Pole, 3D), then enter to see decorations
- ✅ **Global search** - Search by name, reference or tags (always visible, searches all decorations)
- ✅ **Drag-and-drop** - Drag decorations to canvas (HTML5 native for now)
- ✅ **JSON data** - Structured JSON database
- ✅ **Strategic logs** - Console logs for debugging
- ✅ **Responsive** - Adapts to different screen sizes
- ✅ **HeroUI** - Interface consistent with the rest of the application

## Structure

```
decoration-library/
├── index.jsx                    # Main component
├── components/
│   ├── CategoryMenu.jsx        # Category navigation menu
│   ├── DecorationGrid.jsx      # Decorations grid
│   ├── DecorationItem.jsx      # Individual draggable item
│   └── SearchBar.jsx           # Search bar
├── hooks/
│   ├── useDecorations.js       # Hook to manage decorations
│   └── useDecorationSearch.js  # Hook for search/filters
├── data/
│   └── decorations.json        # Decorations database
└── README.md                   # This documentation
```

## Usage

### Basic Import

```jsx
import { DecorationLibrary } from './components/decoration-library';

function MyComponent() {
  const handleDecorationSelect = (decoration) => {
    console.log('Decoration selected:', decoration);
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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onDecorationSelect` | `function` | - | Callback when decoration is dragged/selected |
| `mode` | `"sidebar" \| "modal"` | `"sidebar"` | Display mode |
| `className` | `string` | `""` | Additional CSS classes |
| `enableSearch` | `boolean` | `true` | Enable search bar |
| `initialCategory` | `string` | `null` | Initially selected category |

## Navigation Flow

The component uses a **hierarchical navigation** system:

1. **Categories View** - Shows 3 main categories:
   - 📐 **Transversal** - Cross-sectional decorations
   - 🏗️ **Pole** - Pole-based decorations  
   - 🎯 **3D** - Three-dimensional decorations

2. **Decorations View** - After selecting a category or searching:
   - Shows decorations within that category or search results
   - Search bar always visible for global search
   - Back button to return to categories

### Decoration Data

Each decoration has the following structure:

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

Currently uses HTML5 native drag-and-drop. When `@dnd-kit` is installed, it will be migrated to a superior implementation with:

- ✅ Touch device support
- ✅ Better performance
- ✅ Keyboard accessibility
- ✅ Advanced customization

## Debug Logs

The component includes strategic logs for debugging:

```javascript
🎨 [DecorationLibrary] Mounted - mode: sidebar
📚 [useDecorations] Loaded: 12 decorations
📂 [DecorationLibrary] Changing category to: trees-plants
🔍 [useDecorationSearch] Searching: pine
🎯 [DecorationItem] Starting drag: Pine Tree
```

## Customization

### Add New Decoration

Edit `data/decorations.json`:

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

### Add New Category

1. Add category to `categories` array
2. Update `count` of existing categories
3. Assign `category` to decorations

## Next Steps

- [ ] Install `@dnd-kit/core` and `@dnd-kit/utilities`
- [ ] Migrate to dnd-kit (better performance)
- [ ] PNG image support
- [ ] Modal mode for popup
- [ ] Favorites/pin decorations
- [ ] Recent usage history