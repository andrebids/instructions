import React from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";
import { useShop } from "../context/ShopContext";
import TrendingFiltersSidebar from "../components/shop/TrendingFiltersSidebar";
import ProductGrid from "../components/shop/ProductGrid";
import OrderAssignModal from "../components/shop/OrderAssignModal";
import { PageTitle } from "../components/layout/page-title";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import {
  compareProductsByTagHierarchy,
  getProductHierarchyIndex,
  getNormalizedProductTags,
} from "../utils/tagHierarchy";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";

export default function Shop() {
  const { products } = useShop();
  const navigate = useNavigate();
  const { userName } = useUser();
  const { isHandheld } = useResponsiveProfile();
  const { theme } = useTheme();
  const [filters, setFilters] = React.useState({ type: "", usage: "", location: "", color: [], mount: "", eco: false, dimKey: "", dimRange: null, dimRanges: {}, releaseYear: "" });
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selected, setSelected] = React.useState({ product: null, variant: null });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filtersVisible, setFiltersVisible] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState("relevance");
  const [cols, setCols] = React.useState(4);
  const mainDescription = "Browse all our products and find what you need.";

  // Price limits and range - based on all products (no category filter)
  const priceLimits = React.useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) => p.price).filter(p => typeof p === 'number');
    if (prices.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [products]);

  const [priceRange, setPriceRange] = React.useState([priceLimits.min, priceLimits.max]);
  React.useEffect(() => {
    setPriceRange([priceLimits.min, priceLimits.max]);
  }, [priceLimits.min, priceLimits.max]);

  // Stock limits and range - based on all products
  const stockLimits = React.useMemo(() => {
    if (!products || products.length === 0) return { min: 0, max: 0 };
    const computeStock = (id) => {
      try {
        let s = 0;
        for (const ch of String(id || "")) s += ch.charCodeAt(0);
        return 5 + (s % 60);
      } catch (_) {
        return 20;
      }
    };
    const stocks = products.map((p) => (typeof p.stock === "number" ? p.stock : computeStock(p.id)));
    if (stocks.length === 0) return { min: 0, max: 0 };
    return { min: Math.min(...stocks), max: Math.max(...stocks) };
  }, [products]);

  const [stockRange, setStockRange] = React.useState([stockLimits.min, stockLimits.max]);
  React.useEffect(() => {
    setStockRange([stockLimits.min, stockLimits.max]);
  }, [stockLimits.min, stockLimits.max]);

  // Filtered products - no category filter, all products
  const filtered = React.useMemo(function() {
    if (!products || !Array.isArray(products)) return [];
    
    var list = [];
    
    // Apply all filters (except category)
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var include = true;
      
      if (query && p.name.toLowerCase().indexOf(query.toLowerCase()) === -1) {
        include = false;
      }
      if (include && filters.type && p.type !== filters.type) {
        include = false;
      }
      if (include && filters.usage && p.usage !== filters.usage) {
        include = false;
      }
      if (include && filters.location && p.location !== filters.location) {
        include = false;
      }
      if (include && filters.mount && p.mount !== filters.mount) {
        include = false;
      }
      if (include && filters.eco) {
        var specsMateriais = (p && p.specs && p.specs.materiais) ? p.specs.materiais : '';
        var materials = (p && p.materials) ? p.materials : '';
        var materialsText = String(specsMateriais || materials || "").toLowerCase();
        var isEco = Boolean(p && p.eco) || (Array.isArray(p.tags) && p.tags.indexOf("eco") !== -1) || /(recy|recycled|recycle|bioprint|bio|eco)/.test(materialsText);
        if (!isEco) {
          include = false;
        }
      }
      if (include && filters.color && Array.isArray(filters.color) && filters.color.length > 0) {
        // Suportar tanto images.colors quanto availableColors (formato da API)
        var imagesColors = (p && p.images && p.images.colors) ? p.images.colors : null;
        var availableColors = (p && p.availableColors) ? p.availableColors : null;
        var colorsObj = imagesColors || availableColors || {};
        var hasAny = false;
        for (var c_idx = 0; c_idx < filters.color.length; c_idx++) {
          if (colorsObj[filters.color[c_idx]]) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) {
          include = false;
        }
      }
      if (include && filters.dimRanges && typeof filters.dimRanges === 'object') {
        var specsDimensions = (p && p.specs && p.specs.dimensions) ? p.specs.dimensions : null;
        for (var dimKey in filters.dimRanges) {
          var dimRange = filters.dimRanges[dimKey];
          if (Array.isArray(dimRange) && dimRange.length === 2) {
            var dimValue = (specsDimensions && specsDimensions[dimKey]) ? specsDimensions[dimKey] : null;
            if (!(typeof dimValue === 'number' && Number.isFinite(dimValue))) {
              include = false;
              break;
            } else if (dimValue < dimRange[0] || dimValue > dimRange[1]) {
              include = false;
              break;
            }
          }
        }
      }
      // Backward compatibility: support old dimKey/dimRange format
      if (include && filters.dimKey && Array.isArray(filters.dimRange) && filters.dimRange.length === 2) {
        var specsDimensions = (p && p.specs && p.specs.dimensions) ? p.specs.dimensions : null;
        var dimValue = (specsDimensions && specsDimensions[filters.dimKey]) ? specsDimensions[filters.dimKey] : null;
        if (!(typeof dimValue === 'number' && Number.isFinite(dimValue))) {
          include = false;
        } else if (dimValue < filters.dimRange[0] || dimValue > filters.dimRange[1]) {
          include = false;
        }
      }
      if (include && filters.releaseYear && filters.releaseYear !== "") {
        var productYear = p.releaseYear;
        var yearValue = typeof productYear === 'number' ? productYear : parseInt(productYear, 10);
        var filterYear = typeof filters.releaseYear === 'number' ? filters.releaseYear : parseInt(filters.releaseYear, 10);
        if (isNaN(yearValue) || yearValue !== filterYear) {
          include = false;
        }
      }
      if (include && Array.isArray(priceRange) && priceRange.length === 2) {
        if (typeof p.price === "number") {
          if (p.price < priceRange[0] || p.price > priceRange[1]) {
            include = false;
          }
        }
      }
      if (include && Array.isArray(stockRange) && stockRange.length === 2) {
        var computeStock = function(id) { 
          try { 
            var s = 0; 
            for (var ch_idx = 0; ch_idx < String(id||'').length; ch_idx++) {
              s += String(id||'').charCodeAt(ch_idx);
            }
            return 5 + (s % 60); 
          } catch(_) { 
            return 20; 
          } 
        };
        var stock = typeof p.stock === 'number' ? p.stock : computeStock(p.id);
        if (stock < stockRange[0] || stock > stockRange[1]) {
          include = false;
        }
      }
      
      if (include) {
        list.push(p);
      }
    }
    
    var getOtherTagsCount = function(product) {
      var normalizedTags = getNormalizedProductTags(product);
      if (!Array.isArray(normalizedTags) || normalizedTags.length === 0) return 0;
      var count = 0;
      for (var i = 0; i < normalizedTags.length; i++) {
        if (normalizedTags[i] !== "priority") count++;
      }
      return count;
    };
    
    var getStock = function(product) {
      if (typeof product.stock === 'number' && Number.isFinite(product.stock)) return product.stock;
      try {
        var sum = 0;
        var id = String(product.id || '');
        for (var idx = 0; idx < id.length; idx++) {
          sum += id.charCodeAt(idx);
        }
        return 5 + (sum % 60);
      } catch(_) {
        return 20;
      }
    };
    
    list.sort(function(a, b) {
      var hierarchyComparison = compareProductsByTagHierarchy(a, b);
      if (hierarchyComparison !== 0) return hierarchyComparison;
      
      var hierarchyIndex = getProductHierarchyIndex(a);
      
      if (hierarchyIndex === 0) {
        var otherTagsA = getOtherTagsCount(a);
        var otherTagsB = getOtherTagsCount(b);
        if (otherTagsA !== otherTagsB) {
          return otherTagsB - otherTagsA;
        }
        
        var stockA = getStock(a);
        var stockB = getStock(b);
        if (stockA !== stockB) {
          return stockB - stockA;
        }
        
        var priceA = typeof a.price === "number" && Number.isFinite(a.price) ? a.price : 0;
        var priceB = typeof b.price === "number" && Number.isFinite(b.price) ? b.price : 0;
        if (priceA !== priceB) {
          return priceB - priceA;
        }
        
        return (a.name || "").localeCompare(b.name || "");
      }
      
      switch (sort) {
        case "price-asc":
          return (typeof a.price === "number" ? a.price : 0) - (typeof b.price === "number" ? b.price : 0);
        case "price-desc":
          return (typeof b.price === "number" ? b.price : 0) - (typeof a.price === "number" ? a.price : 0);
        case "alpha-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "alpha-desc":
          return (b.name || "").localeCompare(a.name || "");
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });
    
    return list;
  }, [products, filters, query, sort, priceRange, stockRange]);

  return (
    <Scroller className={`flex-1 min-h-0 p-6 ${isHandheld ? "pb-24" : "pb-6"}`} hideScrollbar>
      <PageTitle title="Shop" userName={userName} lead={`Here's your catalog, ${userName}`} subtitle={mainDescription} />
      
      {/* Mobile filter button */}
      <div className="mt-2 flex items-center justify-end mb-4 md:hidden">
        <Button size="sm" variant="flat" onPress={() => setFiltersOpen(true)}>Filters</Button>
      </div>

      {/* Sidebar de filtros */}
      {filtersOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setFiltersOpen(false)} />
      )}
      <div className={`md:flex md:items-start ${filtersVisible ? 'md:gap-4 xl:gap-6 2xl:gap-8' : ''}`}>
        {filtersVisible && (
          <div className={`fixed left-0 top-0 bottom-0 z-50 transition-all duration-300 ease-in-out transform ${filtersOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:translate-x-0 md:z-auto md:w-[22rem] xl:w-[26rem] 2xl:w-[32rem] ${cols === 1 ? 'md:flex-shrink-0' : ''}`}>
            <div className={`w-80 md:w-full h-full bg-background border-r border-divider p-4 md:bg-transparent md:border-0 md:rounded-none flex flex-col ${cols === 1 ? 'md:min-w-[22rem] xl:min-w-[26rem] 2xl:min-w-[32rem]' : ''}`}>
              <div className="flex items-center justify-between mb-3 md:hidden">
                <div className="font-semibold">Filters</div>
                <Button isIconOnly size="sm" variant="light" onPress={() => setFiltersOpen(false)} aria-label="Close filters">✕</Button>
              </div>
              <div className="flex-1 overflow-auto">
                <TrendingFiltersSidebar
                  key={theme}
                  products={products || []}
                  filters={filters}
                  onChange={setFilters}
                  priceRange={priceRange}
                  priceLimits={priceLimits}
                  onPriceChange={setPriceRange}
                  stockRange={stockRange}
                  stockLimits={stockLimits}
                  onStockChange={setStockRange}
                  onClearAll={() => { setFilters({ type: "", usage: "", location: "", color: [], mount: "", eco: false, dimKey: "", dimRange: null, dimRanges: {}, releaseYear: "" }); setPriceRange([priceLimits.min, priceLimits.max]); setStockRange([stockLimits.min, stockLimits.max]); setQuery(""); }}
                  onToggleVisibility={() => setFiltersVisible(!filtersVisible)}
                  filtersVisible={filtersVisible}
                />
              </div>
              <div className="mt-2 flex gap-2 justify-end md:hidden">
                <Button size="sm" color="primary" onPress={() => setFiltersOpen(false)}>Apply</Button>
              </div>
            </div>
          </div>
        )}

        <div className={`flex-1 w-full md:pt-[15px] ${!filtersVisible ? 'md:w-full' : ''}`}>
          <div className="mb-4 flex items-center justify-between">
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="flat"
                radius="full"
                onPress={() => setFiltersVisible(!filtersVisible)}
                aria-label="Toggle filters"
                className="mr-2"
              >
                <Icon icon="lucide:filter" className="text-sm mr-1" />
                Filters
              </Button>
              {[1,2,3,4].map((n)=> (
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
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
                size="sm"
                className="w-56 hidden md:block"
                aria-label="Search products"
              />
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
                <Icon 
                  icon="mdi:heart" 
                  className="text-red-500 text-2xl"
                  style={{ fill: '#ef4444' }}
                />
              </Button>
            </div>
          </div>
          <ProductGrid
            products={filtered}
            onOrder={(product, variant) => { setSelected({ product, variant }); setAssignOpen(true); }}
            cols={cols}
            glass={false}
            filtersVisible={filtersVisible}
          />
        </div>
      </div>

      <OrderAssignModal
        isOpen={assignOpen}
        onOpenChange={setAssignOpen}
        product={selected.product}
        variant={selected.variant}
      />
    </Scroller>
  );
}
