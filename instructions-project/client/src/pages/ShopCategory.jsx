import React from "react";
import { useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { useShop } from "../context/ShopContext";
import ShopFilters from "../components/shop/ShopFilters";
import ProductGrid from "../components/shop/ProductGrid";
import OrderAssignModal from "../components/shop/OrderAssignModal";
import { PageTitle } from "../components/page-title";

export default function ShopCategory() {
  const { category } = useParams();
  const { products } = useShop();
  const [filters, setFilters] = React.useState({ type: "", usage: "", location: "", color: [], mount: "" });
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selected, setSelected] = React.useState({ product: null, variant: null });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("relevance");

  const filtered = React.useMemo(() => {
    const list = products.filter((p) => {
      if (!p.tags?.includes(category)) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.usage && p.usage !== filters.usage) return false;
      if (filters.location && p.location !== filters.location) return false;
      if (filters.mount && p.mount !== filters.mount) return false;
      if (filters.color && Array.isArray(filters.color) && filters.color.length > 0) {
        const hasAny = filters.color.some((c) => Boolean(p.images?.colors?.[c]));
        if (!hasAny) return false;
      }
      return true;
    });
    if (sort === "price-asc") return list.sort((a,b)=>a.price-b.price);
    if (sort === "price-desc") return list.sort((a,b)=>b.price-a.price);
    return list;
  }, [products, category, filters, query, sort]);

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Shop" userName="Christopher" subtitle="Explore products by category." />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mt-2">{category?.charAt(0).toUpperCase() + category?.slice(1)}</h1>
        </div>
        <div>
          <Button size="sm" variant="flat" className="md:hidden" onPress={() => setFiltersOpen(true)}>Filtros</Button>
        </div>
      </div>

      {/* Sidebar de filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setFiltersOpen(false)} />
      )}
      <div className="md:flex md:items-start md:gap-4">
        <div className={`fixed left-0 top-0 bottom-0 z-50 w-80 bg-background border-r border-divider p-4 transition-transform transform ${filtersOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:z-auto md:rounded-lg md:w-80 md:bg-content1/40 md:border md:border-divider md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-auto`}> 
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Filtros</div>
            <Button isIconOnly size="sm" variant="light" className="md:hidden" onPress={() => setFiltersOpen(false)}>✕</Button>
          </div>
          <ShopFilters filters={filters} onChange={setFilters} query={query} onQueryChange={setQuery} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="light" onPress={() => setFilters({ type: "", usage: "", location: "", color: [], mount: "" })}>Limpar</Button>
            <Button size="sm" color="primary" className="md:hidden" onPress={() => setFiltersOpen(false)}>Aplicar</Button>
          </div>
        </div>

        <div className="flex-1 w-full">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant={sort==='relevance'?'solid':'flat'} onPress={()=>setSort('relevance')}>Relevância</Button>
          <Button size="sm" variant={sort==='price-asc'?'solid':'flat'} onPress={()=>setSort('price-asc')}>Preço mais baixo</Button>
          <Button size="sm" variant={sort==='price-desc'?'solid':'flat'} onPress={()=>setSort('price-desc')}>Preço mais alto</Button>
        </div>
        <ProductGrid
          products={filtered}
          onOrder={(product, variant) => { setSelected({ product, variant }); setAssignOpen(true); }}
        />
        </div>
      </div>

      <OrderAssignModal
        isOpen={assignOpen}
        onOpenChange={setAssignOpen}
        product={selected.product}
        variant={selected.variant}
      />
    </div>
  );
}


