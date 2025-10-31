import React from "react";
import { products as mockProducts, projects as mockProjects, categories as mockCategories } from "../services/shop.mock";
import { productsAPI } from "../services/api";
import { transformApiProduct } from "../utils/productUtils";

const ShopContext = React.createContext(null);

const STORAGE_KEY = "shop_state_v1";

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) {}
}

export function ShopProvider({ children }) {
  const [products, setProducts] = React.useState([]);
  const [productsLoading, setProductsLoading] = React.useState(true);
  const [productsError, setProductsError] = React.useState(null);
  const [projects] = React.useState(mockProjects);
  const [categories] = React.useState(mockCategories);
  
  // Buscar produtos da API na montagem
  React.useEffect(function() {
    var fetchProducts = function() {
      setProductsLoading(true);
      setProductsError(null);
      
      productsAPI.getAll({ isActive: true })
        .then(function(apiProducts) {
          if (Array.isArray(apiProducts)) {
            var transformed = [];
            for (var i = 0; i < apiProducts.length; i++) {
              var transformedProduct = transformApiProduct(apiProducts[i]);
              if (transformedProduct) {
                transformed.push(transformedProduct);
              }
            }
            setProducts(transformed);
            setProductsLoading(false);
          } else {
            console.warn('⚠️ [ShopContext] API retornou dados não-array, usando fallback');
            setProducts(mockProducts);
            setProductsLoading(false);
          }
        })
        .catch(function(error) {
          console.error('❌ [ShopContext] Erro ao buscar produtos da API:', error);
          setProductsError(error.message || 'Erro ao carregar produtos');
          // Fallback para dados mockados em caso de erro
          setProducts(mockProducts);
          setProductsLoading(false);
        });
    };
    
    fetchProducts();
  }, []);
  const [cartByProject, setCartByProject] = React.useState(() => {
    const persisted = loadPersistedState();
    return persisted?.cartByProject || {};
  });
  const [projectStatusById, setProjectStatusById] = React.useState(() => {
    const persisted = loadPersistedState();
    if (persisted?.projectStatusById) return persisted.projectStatusById;
    const map = {};
    (mockProjects || []).forEach((p) => { map[p.id] = p.status || "created"; });
    return map;
  });
  const [projectBudgetById, setProjectBudgetById] = React.useState(() => {
    const persisted = loadPersistedState();
    if (persisted?.projectBudgetById) return persisted.projectBudgetById;
    const map = {};
    (mockProjects || []).forEach((p) => { if (typeof p.budget !== 'undefined') map[p.id] = Number(p.budget); });
    return map;
  });
  const [favorites, setFavorites] = React.useState(() => {
    const persisted = loadPersistedState();
    return persisted?.favorites || [];
  });
  // Favorites folders: [{id, name, productIds: string[] }]
  const [favoriteFolders, setFavoriteFolders] = React.useState(() => {
    const persisted = loadPersistedState();
    return persisted?.favoriteFolders || [];
  });
  const [compare, setCompare] = React.useState(() => {
    const persisted = loadPersistedState();
    return persisted?.compare || [];
  });

  const computeTotals = React.useCallback((cart) => {
    const totals = {};
    for (const [projectId, cartState] of Object.entries(cart)) {
      const total = (cartState.items || []).reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
      totals[projectId] = { total };
    }
    return totals;
  }, []);

  const totalsByProject = React.useMemo(() => computeTotals(cartByProject), [cartByProject, computeTotals]);

  const addToProject = React.useCallback((projectId, productId, variant, qty = 1) => {
    setCartByProject((prev) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return prev;
      const next = { ...prev };
      const existing = next[projectId] || { items: [] };
      const key = `${productId}|${variant?.color || ""}|${variant?.mode || ""}`;
      const items = existing.items.slice();
      const idx = items.findIndex((it) => it.key === key);
      if (idx >= 0) {
        items[idx] = { ...items[idx], qty: items[idx].qty + qty };
      } else {
        items.push({
          key,
          productId,
          name: product.name,
          unitPrice: product.price,
          qty,
          variant: { color: variant?.color || "brancoPuro", mode: variant?.mode || "day" },
        });
      }
      next[projectId] = { items };
      const stateToPersist = { cartByProject: next, favorites, favoriteFolders, compare, projectStatusById, projectBudgetById };
      persistState(stateToPersist);
      return next;
    });
  }, [products, favorites, compare]);

  const getReservedQuantity = React.useCallback((productId) => {
    let reserved = 0;
    for (const projectState of Object.values(cartByProject)) {
      for (const item of projectState.items || []) {
        if (item.productId === productId) reserved += Number(item.qty) || 0;
      }
    }
    return reserved;
  }, [cartByProject]);

  const getAvailableStock = React.useCallback((product) => {
    const computeStock = (id) => {
      try { let sum = 0; for (const ch of String(id||'')) sum += ch.charCodeAt(0); return 5 + (sum % 60); } catch (_) { return 20; }
    };
    const base = typeof product?.stock === 'number' ? product.stock : computeStock(product?.id);
    const reserved = getReservedQuantity(product?.id);
    return Math.max(0, base - reserved);
  }, [getReservedQuantity]);

  const toggleFavorite = React.useCallback((productId) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      // If unfavoriting, also remove from all folders
      let foldersNext = favoriteFolders;
      if (exists) {
        foldersNext = (favoriteFolders || []).map((f) => ({ ...f, productIds: (f.productIds || []).filter((id) => id !== productId) }));
        setFavoriteFolders(foldersNext);
      }
      const stateToPersist = { cartByProject, favorites: next, favoriteFolders: foldersNext, compare, projectStatusById, projectBudgetById };
      persistState(stateToPersist);
      return next;
    });
  }, [cartByProject, compare, favoriteFolders]);

  const toggleCompare = React.useCallback((productId) => {
    setCompare((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      const stateToPersist = { cartByProject, favorites, favoriteFolders, compare: next, projectStatusById, projectBudgetById };
      persistState(stateToPersist);
      return next;
    });
  }, [cartByProject, favorites, favoriteFolders]);

  // Favorite folders API
  const createFavoriteFolder = React.useCallback((name) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setFavoriteFolders((prev) => {
      const next = [...prev, { id, name: String(name || 'New folder'), productIds: [] }];
      persistState({ cartByProject, favorites, favoriteFolders: next, compare, projectStatusById, projectBudgetById });
      return next;
    });
    return id;
  }, [cartByProject, favorites, compare, projectStatusById, projectBudgetById]);

  const renameFavoriteFolder = React.useCallback((folderId, name) => {
    setFavoriteFolders((prev) => {
      const next = prev.map((f) => f.id === folderId ? { ...f, name: String(name || f.name) } : f);
      persistState({ cartByProject, favorites, favoriteFolders: next, compare, projectStatusById, projectBudgetById });
      return next;
    });
  }, [cartByProject, favorites, compare, projectStatusById, projectBudgetById]);

  const deleteFavoriteFolder = React.useCallback((folderId) => {
    setFavoriteFolders((prev) => {
      const next = prev.filter((f) => f.id !== folderId);
      persistState({ cartByProject, favorites, favoriteFolders: next, compare, projectStatusById, projectBudgetById });
      return next;
    });
  }, [cartByProject, favorites, compare, projectStatusById, projectBudgetById]);

  const toggleProductInFolder = React.useCallback((folderId, productId) => {
    setFavoriteFolders((prev) => {
      const target = prev.find((f) => f.id === folderId);
      const inTarget = Boolean(target?.productIds?.includes(productId));
      let next;
      if (inTarget) {
        // Remove only from the target folder
        next = prev.map((f) => f.id === folderId ? { ...f, productIds: (f.productIds || []).filter((id) => id !== productId) } : f);
      } else {
        // Add exclusively: remove from all other folders, then add to target
        next = prev.map((f) => {
          if (f.id === folderId) {
            const set = new Set(f.productIds || []);
            set.add(productId);
            return { ...f, productIds: Array.from(set) };
          }
          // remove from others
          return { ...f, productIds: (f.productIds || []).filter((id) => id !== productId) };
        });
      }
      // Ensure product is favorite when present in any folder
      const isInAny = next.some((f) => (f.productIds || []).includes(productId));
      setFavorites((favPrev) => {
        let ensured = favPrev;
        if (isInAny && !favPrev.includes(productId)) ensured = [...favPrev, productId];
        if (!isInAny && favPrev.includes(productId)) ensured = favPrev.filter((id) => id !== productId);
        persistState({ cartByProject, favorites: ensured, favoriteFolders: next, compare, projectStatusById, projectBudgetById });
        return ensured;
      });
      return next;
    });
  }, [cartByProject, compare, projectStatusById, projectBudgetById]);

  const value = React.useMemo(() => ({
    products,
    projects,
    categories,
    cartByProject,
    totalsByProject,
    addToProject,
    updateProjectItemQty: (projectId, key, qty) => {
      setCartByProject((prev) => {
        const next = { ...prev };
        const existing = next[projectId];
        if (!existing) return prev;
        const items = (existing.items || []).slice();
        const idx = items.findIndex((it) => it.key === key);
        if (idx === -1) return prev;
        const currentItem = items[idx];
        const product = products.find((p) => p.id === currentItem.productId);
        // Compute allowed maximum: available stock (already excludes this line)
        // plus current quantity on this line
        const available = product ? (function(p){
          const computeStock = (id) => { try { let sum = 0; for (const ch of String(id||'')) sum += ch.charCodeAt(0); return 5 + (sum % 60); } catch (_) { return 20; } };
          const base = typeof p.stock === 'number' ? p.stock : computeStock(p.id);
          // reserved across all projects
          let reserved = 0;
          for (const projectState of Object.values(prev)) {
            for (const item of projectState.items || []) {
              if (item.productId === p.id) reserved += Number(item.qty) || 0;
            }
          }
          const availableNow = Math.max(0, base - reserved);
          return availableNow;
        })(product) : 0;
        const allowedMaxStock = available + (Number(currentItem.qty) || 0);
        // Budget constraint
        const project = projects.find((p) => String(p.id) === String(projectId));
        const budgetValue = Number(projectBudgetById?.[projectId] ?? project?.budget);
        let allowedMaxBudget = Infinity;
        if (Number.isFinite(budgetValue)) {
          // total excluding current line
          const existing = prev[projectId]?.items || [];
          const totalExcluding = existing.reduce((sum, item) => {
            if (item.key === currentItem.key) return sum; // exclude current
            return sum + (Number(item.unitPrice) || 0) * (Number(item.qty) || 0);
          }, 0);
          const remainingBudget = Math.max(0, budgetValue - totalExcluding);
          const unitPrice = Number(currentItem.unitPrice) || 0;
          allowedMaxBudget = unitPrice > 0 ? Math.floor(remainingBudget / unitPrice) : Infinity;
        }
        const allowedMax = Math.min(allowedMaxStock, allowedMaxBudget);
        const desired = Math.max(0, Number(qty) || 0);
        const clamped = Math.min(desired, allowedMax);
        if (clamped === 0) {
          items.splice(idx, 1);
        } else {
          items[idx] = { ...currentItem, qty: clamped };
        }
        next[projectId] = { items };
        const stateToPersist = { cartByProject: next, favorites, compare, projectStatusById, projectBudgetById };
        persistState(stateToPersist);
        return next;
      });
    },
    removeProjectItem: (projectId, key) => {
      setCartByProject((prev) => {
        const next = { ...prev };
        const existing = next[projectId];
        if (!existing) return prev;
        const items = (existing.items || []).filter((it) => it.key !== key);
        next[projectId] = { items };
        const stateToPersist = { cartByProject: next, favorites, compare, projectStatusById, projectBudgetById };
        persistState(stateToPersist);
        return next;
      });
    },
    setProjectStatus: (projectId, status) => {
      setProjectStatusById((prev) => {
        const next = { ...prev, [projectId]: status };
        const stateToPersist = { cartByProject, favorites, compare, projectStatusById: next, projectBudgetById };
        persistState(stateToPersist);
        return next;
      });
    },
    setProjectBudget: (projectId, budget) => {
      setProjectBudgetById((prev) => {
        const next = { ...prev, [projectId]: Number(budget) || 0 };
        const stateToPersist = { cartByProject, favorites, compare, projectStatusById, projectBudgetById: next };
        persistState(stateToPersist);
        return next;
      });
    },
    favorites,
    favoriteFolders,
    compare,
    toggleFavorite,
    createFavoriteFolder,
    renameFavoriteFolder,
    deleteFavoriteFolder,
    toggleProductInFolder,
    toggleCompare,
    getReservedQuantity,
    getAvailableStock,
    projectStatusById,
    projectBudgetById,
  }), [products, projects, categories, cartByProject, totalsByProject, addToProject, favorites, favoriteFolders, compare, toggleFavorite, createFavoriteFolder, renameFavoriteFolder, deleteFavoriteFolder, toggleProductInFolder, toggleCompare, getReservedQuantity, getAvailableStock, projectStatusById, projectBudgetById]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = React.useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}


