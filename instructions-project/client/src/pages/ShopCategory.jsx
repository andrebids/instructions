import React from "react";
import { useParams } from "react-router-dom";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../context/ShopContext";
import TrendingFiltersSidebar from "../components/shop/TrendingFiltersSidebar";
import ProductGrid from "../components/shop/ProductGrid";
import OrderAssignModal from "../components/shop/OrderAssignModal";
import { PageTitle } from "../components/page-title";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ShopCategory() {
  const { category } = useParams();
  const { products } = useShop();
  const navigate = useNavigate();
  const { userName } = useUser();
  const [filters, setFilters] = React.useState({ type: "", usage: "", location: "", color: [], mount: "", minStock: 0, eco: false });
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selected, setSelected] = React.useState({ product: null, variant: null });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("relevance");
  const [cols, setCols] = React.useState(4);
  // Title typing animation
  const fullTitle = React.useMemo(() => {
    const c = String(category || "");
    if (c.toLowerCase() === "trending") return "TRENDING";
    return c.replace(/-/g, " ").toUpperCase();
  }, [category]);
  const categoryDescription = React.useMemo(() => {
    const c = String(category || "").toLowerCase();
    const map = {
      trending: "Explore what's popular right now.",
      new: "Fresh arrivals picked for you.",
      sale: "Great deals and limited-time offers.",
      christmas: "Festive picks for the season.",
      summer: "Bright picks for sunny days.",
    };
    return map[c] || "Browse curated items for this category.";
  }, [category]);
  const [typedTitle, setTypedTitle] = React.useState("");
  const [typingDone, setTypingDone] = React.useState(false);
  React.useEffect(() => {
    const text = String(fullTitle || "");
    setTypedTitle("");
    if (!text.length) {
      setTypingDone(true);
      return;
    }
    setTypingDone(false);
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      const next = text.slice(0, Math.min(i, text.length));
      setTypedTitle(next);
      if (i >= text.length) {
        clearInterval(timer);
        setTypingDone(true);
      }
    }, 45);
    return () => clearInterval(timer);
  }, [fullTitle]);

  const isTrending = category === "trending";
  const productsInCategory = React.useMemo(() => products.filter((p) => p.tags?.includes(category)), [products, category]);

  // Price limits and range
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
      if (filters.eco) {
        const materialsText = String(p?.specs?.materiais || p?.materials || "").toLowerCase();
        const isEco = Boolean(p?.eco) || (Array.isArray(p?.tags) && p.tags.includes("eco")) || /(recy|recycled|recycle|bioprint|bio|eco)/.test(materialsText);
        if (!isEco) return false;
      }
      if (filters.color && Array.isArray(filters.color) && filters.color.length > 0) {
        const hasAny = filters.color.some((c) => Boolean(p.images?.colors?.[c]));
        if (!hasAny) return false;
      }
      if (typeof filters.minStock === 'number') {
        const computeStock = (id) => { try { let s=0; for (const ch of String(id||'')) s+=ch.charCodeAt(0); return 5 + (s % 60); } catch(_){ return 20; } };
        const stock = typeof p.stock === 'number' ? p.stock : computeStock(p.id);
        if (stock < filters.minStock) return false;
      }
      if (Array.isArray(priceRange) && priceRange.length === 2) {
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
  }, [products, category, filters, query, sort, priceRange]);

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Shop" userName={userName} lead={`Here's your catalog, ${userName}`} subtitle={categoryDescription} />
      <div className="mb-4">
        <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-wider text-foreground mt-6 text-center" style={{ textShadow: "0 6px 22px rgba(0,0,0,0.35)" }}>
          <span>{typedTitle}</span>
          <span className={`ml-1 inline-block w-[2px] h-[1em] align-[-0.2em] bg-current ${typingDone ? 'opacity-0' : 'animate-pulse'}`}></span>
        </h1>
        <div className="mt-2 flex items-center justify-end">
          <Button size="sm" variant="flat" className="md:hidden" onPress={() => setFiltersOpen(true)}>Filters</Button>
        </div>
      </div>

      {/* Sidebar de filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setFiltersOpen(false)} />
      )}
      <div className="md:flex md:items-start md:gap-4">
        <div className={`fixed left-0 top-0 bottom-0 z-50 w-80 bg-background border-r border-divider p-4 transition-transform transform ${filtersOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:z-auto md:w-80 md:bg-transparent md:border-0 md:rounded-none md:top-auto md:h-auto md:overflow-visible`}> 
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Filters</div>
            <Button isIconOnly size="sm" variant="light" className="md:hidden" onPress={() => setFiltersOpen(false)} aria-label="Close filters">✕</Button>
          </div>
          <TrendingFiltersSidebar
            products={productsInCategory}
            filters={filters}
            onChange={setFilters}
            priceRange={priceRange}
            priceLimits={priceLimits}
            onPriceChange={setPriceRange}
          />
          <div className="mt-2 flex gap-2 justify-end">
            <Button
              size="sm"
              variant="flat"
              radius="full"
              className="bg-[#e4e3e8] text-foreground/80 hover:text-foreground dark:bg-content1 shadow-sm"
              startContent={<Icon icon="lucide:rotate-ccw" className="text-sm" />}
          onPress={() => { setFilters({ type: "", usage: "", location: "", color: [], mount: "", minStock: 0, eco: false }); setPriceRange([priceLimits.min, priceLimits.max]); setQuery(""); }}
            >
              Clear filters
            </Button>
            <Button size="sm" color="primary" className="md:hidden" onPress={() => setFiltersOpen(false)}>Apply</Button>
          </div>
        </div>

        <div className="flex-1 w-full">
        <div className="mb-4 flex items-center justify-between">
          <div className="hidden md:flex items-center gap-2">
            {[2,3,4].map((n)=> (
              <Button
                key={n}
                isIconOnly
                variant={cols===n? 'solid':'bordered'}
                radius="full"
                onPress={()=>setCols(n)}
                aria-label={`Set columns to ${n}`}
              >
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: n }).map((_,i)=> (
                    <span key={i} className={`block w-0.5 h-3 rounded-sm ${cols===n? 'bg-white':'bg-default-400'}`}></span>
                  ))}
                </div>
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              isIconOnly
              radius="full"
              variant="bordered"
              aria-label="Go to favorites"
              className="border-red-500/40 hover:border-red-500 bg-transparent text-red-500 hover:bg-red-500/5 focus-visible:ring-2 focus-visible:ring-red-500/50"
              onPress={()=> navigate('/favorites')}
            >
              <Icon icon="lucide:heart" className="text-red-500 text-2xl" />
            </Button>
          </div>
        </div>
        <ProductGrid
          products={filtered}
          onOrder={(product, variant) => { setSelected({ product, variant }); setAssignOpen(true); }}
          cols={cols}
          glass={isTrending}
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


