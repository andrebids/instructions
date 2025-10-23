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
      const stateToPersist = { cartByProject: next };
      persistState(stateToPersist);
      return next;
    });
  }, [products]);

  const value = React.useMemo(() => ({
    products,
    projects,
    categories,
    cartByProject,
    totalsByProject,
    addToProject,
  }), [products, projects, categories, cartByProject, totalsByProject, addToProject]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = React.useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}


