import React from "react";
import { products as mockProducts, projects as mockProjects, categories as mockCategories } from "../services/shop.mock";

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
  const [products] = React.useState(mockProducts);
  const [projects] = React.useState(mockProjects);
  const [categories] = React.useState(mockCategories);
  const [cartByProject, setCartByProject] = React.useState(() => {
    const persisted = loadPersistedState();
    return persisted?.cartByProject || {};
  });
  const [favorites, setFavorites] = React.useState(() => {
    const persisted = loadPersistedState();
    return persisted?.favorites || [];
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
      const stateToPersist = { cartByProject: next, favorites, compare };
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
      const stateToPersist = { cartByProject, favorites: next, compare };
      persistState(stateToPersist);
      return next;
    });
  }, [cartByProject, compare]);

  const toggleCompare = React.useCallback((productId) => {
    setCompare((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      const stateToPersist = { cartByProject, favorites, compare: next };
      persistState(stateToPersist);
      return next;
    });
  }, [cartByProject, favorites]);

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
        const budgetValue = Number(project?.budget);
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
        const stateToPersist = { cartByProject: next, favorites, compare };
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
        const stateToPersist = { cartByProject: next, favorites, compare };
        persistState(stateToPersist);
        return next;
      });
    },
    favorites,
    compare,
    toggleFavorite,
    toggleCompare,
    getReservedQuantity,
    getAvailableStock,
  }), [products, projects, categories, cartByProject, totalsByProject, addToProject, favorites, compare, toggleFavorite, toggleCompare, getReservedQuantity, getAvailableStock]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = React.useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}


