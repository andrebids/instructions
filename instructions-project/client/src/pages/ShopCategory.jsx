import React from "react";
import { useParams } from "react-router-dom";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../context/ShopContext";
import ShopFilters from "../components/shop/ShopFilters";
import TrendingFiltersSidebar from "../components/shop/TrendingFiltersSidebar";
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
  const [cols, setCols] = React.useState(4);

  const isTrending = category === "trending";
  const productsInCategory = React.useMemo(() => products.filter((p) => p.tags?.includes(category)), [products, category]);

  // Price limits and range (only used on trending for now)
  const priceLimits = React.useMemo(() => {
    if (productsInCategory.length === 0) return { min: 0, max: 0 };
    const prices = productsInCategory.map((p) => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [productsInCategory]);

  const [priceRange, setPriceRange] = React.useState([priceLimits.min, priceLimits.max]);
  React.useEffect(() => {
    setPriceRange([priceLimits.min, priceLimits.max]);
  }, [priceLimits.min, priceLimits.max]);

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
      if (isTrending && Array.isArray(priceRange) && priceRange.length === 2) {
        if (typeof p.price === "number") {
          if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
        }
      }
      return true;
    });
    if (sort === "price-asc") return list.sort((a,b)=>a.price-b.price);
    if (sort === "price-desc") return list.sort((a,b)=>b.price-a.price);
    if (sort === "alpha-asc") return list.sort((a,b)=>a.name.localeCompare(b.name));
    if (sort === "alpha-desc") return list.sort((a,b)=>b.name.localeCompare(a.name));
    return list;
  }, [products, category, filters, query, sort, isTrending, priceRange]);

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Shop" userName="Christopher" subtitle="Explore products by category." />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mt-2">{category?.charAt(0).toUpperCase() + category?.slice(1)}</h1>
        </div>
        <div>
          <Button size="sm" variant="flat" className="md:hidden" onPress={() => setFiltersOpen(true)}>{isTrending ? "Filters" : "Filtros"}</Button>
        </div>
      </div>

      {/* Sidebar de filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setFiltersOpen(false)} />
      )}
      <div className="md:flex md:items-start md:gap-4">
        <div className={`fixed left-0 top-0 bottom-0 z-50 w-80 bg-background border-r border-divider p-4 transition-transform transform ${filtersOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:z-auto md:w-80 ${isTrending ? 'md:bg-transparent md:border-0 md:rounded-none md:top-auto md:h-auto md:overflow-visible' : 'md:bg-content1/40 md:border md:border-divider md:rounded-lg md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-auto'}`}> 
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">{isTrending ? "Filters" : "Filtros"}</div>
            <Button isIconOnly size="sm" variant="light" className="md:hidden" onPress={() => setFiltersOpen(false)}>✕</Button>
          </div>
          {isTrending ? (
            <TrendingFiltersSidebar
              products={productsInCategory}
              filters={filters}
              onChange={setFilters}
              priceRange={priceRange}
              priceLimits={priceLimits}
              onPriceChange={setPriceRange}
            />
          ) : (
            <ShopFilters filters={filters} onChange={setFilters} query={query} onQueryChange={setQuery} />
          )}
          <div className="mt-2 flex gap-2">
            {isTrending ? (
              <Button
                size="sm"
                variant="bordered"
                color="default"
                startContent={<Icon icon="lucide:rotate-ccw" className="text-sm" />}
                onPress={() => { setFilters({ type: "", usage: "", location: "", color: [], mount: "" }); setPriceRange([priceLimits.min, priceLimits.max]); }}
              >
                Clear filters
              </Button>
            ) : (
              <Button size="sm" variant="light" onPress={() => { setFilters({ type: "", usage: "", location: "", color: [], mount: "" }); }}>Limpar</Button>
            )}
            <Button size="sm" color="primary" className="md:hidden" onPress={() => setFiltersOpen(false)}>{isTrending ? "Apply" : "Aplicar"}</Button>
          </div>
        </div>

        <div className="flex-1 w-full">
        <div className="mb-4 flex items-center justify-between">
          {/* Grid density toggles (trending only) */}
          {isTrending ? (
            <div className="hidden md:flex items-center gap-2">
              {[2,3,4].map((n)=> (
                <Button
                  key={n}
                  isIconOnly
                  variant={cols===n? 'solid':'bordered'}
                  radius="full"
                  onPress={()=>setCols(n)}
                >
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: n }).map((_,i)=> (
                      <span key={i} className={`block w-0.5 h-3 rounded-sm ${cols===n? 'bg-white':'bg-default-400'}`}></span>
                    ))}
                  </div>
                </Button>
              ))}
            </div>
          ) : <div />}
          {isTrending ? (
            <Dropdown>
              <DropdownTrigger>
                <Button radius="full" variant="bordered" endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}> 
                  {sort === 'relevance' && 'Best Selling'}
                  {sort === 'alpha-asc' && 'Alphabetically, A-Z'}
                  {sort === 'alpha-desc' && 'Alphabetically, Z-A'}
                  {sort === 'price-asc' && 'Price, low to high'}
                  {sort === 'price-desc' && 'Price, high to low'}
                </Button>
              </DropdownTrigger>
              <DropdownMenu 
                aria-label="Sort products"
                selectedKeys={new Set([sort])}
                selectionMode="single"
                onAction={(key)=>setSort(String(key))}
              >
                <DropdownItem key="relevance">Best selling</DropdownItem>
                <DropdownItem key="alpha-asc">Alphabetically, A-Z</DropdownItem>
                <DropdownItem key="alpha-desc">Alphabetically, Z-A</DropdownItem>
                <DropdownItem key="price-asc">Price, low to high</DropdownItem>
                <DropdownItem key="price-desc">Price, high to low</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={sort==='relevance'?'solid':'flat'} onPress={()=>setSort('relevance')}>Relevância</Button>
              <Button size="sm" variant={sort==='price-asc'?'solid':'flat'} onPress={()=>setSort('price-asc')}>Preço mais baixo</Button>
              <Button size="sm" variant={sort==='price-desc'?'solid':'flat'} onPress={()=>setSort('price-desc')}>Preço mais alto</Button>
            </div>
          )}
        </div>
        <ProductGrid
          products={filtered}
          onOrder={(product, variant) => { setSelected({ product, variant }); setAssignOpen(true); }}
          cols={isTrending ? cols : 4}
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


