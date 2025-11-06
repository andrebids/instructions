import React from "react";
import { Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useShop } from "../context/ShopContext";
import TrendingFiltersSidebar from "../components/shop/TrendingFiltersSidebar";
import ProductGrid from "../components/shop/ProductGrid";
import OrderAssignModal from "../components/shop/OrderAssignModal";
import { PageTitle } from "../components/page-title";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function Shop() {
  const { products } = useShop();
  const navigate = useNavigate();
  const { userName } = useUser();
  const [filters, setFilters] = React.useState({ type: "", usage: "", location: "", color: [], mount: "", minStock: 0, eco: false, dimKey: "", dimRange: null, releaseYear: "" });
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selected, setSelected] = React.useState({ product: null, variant: null });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
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
      if (include && filters.dimKey && Array.isArray(filters.dimRange) && filters.dimRange.length === 2) {
        var specsDimensions = (p && p.specs && p.specs.dimensions) ? p.specs.dimensions : null;
        var dimValue = (specsDimensions && specsDimensions[filters.dimKey]) ? specsDimensions[filters.dimKey] : null;
        if (!(typeof dimValue === 'number' && Number.isFinite(dimValue))) {
          include = false;
        } else if (dimValue < filters.dimRange[0] || dimValue > filters.dimRange[1]) {
          include = false;
        }
      }
      if (include && typeof filters.minStock === 'number') {
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
        if (stock < filters.minStock) {
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
      
      if (include) {
        list.push(p);
      }
    }
    
    // Helper function to check if product has a tag (case insensitive)
    var hasTag = function(product, tagName) {
      if (!product.tags || !Array.isArray(product.tags)) return false;
      var tagLower = tagName.toLowerCase();
      for (var i = 0; i < product.tags.length; i++) {
        if (String(product.tags[i]).toLowerCase() === tagLower) {
          return true;
        }
      }
      return false;
    };
    
    // Helper function to count tags (excluding priority)
    var getOtherTagsCount = function(product) {
      if (!product.tags || !Array.isArray(product.tags)) return 0;
      var count = 0;
      for (var i = 0; i < product.tags.length; i++) {
        var tag = String(product.tags[i]).toLowerCase();
        if (tag !== "priority") {
          count++;
        }
      }
      return count;
    };
    
    // Helper function to get stock value
    var getStock = function(product) {
      if (typeof product.stock === 'number') return product.stock;
      // Fallback calculation if stock is not a number
      try {
        var s = 0;
        var id = String(product.id || '');
        for (var ch_idx = 0; ch_idx < id.length; ch_idx++) {
          s += id.charCodeAt(ch_idx);
        }
        return 5 + (s % 60);
      } catch(_) {
        return 20;
      }
    };
    
    // Helper function to get tag priority (lower number = higher priority)
    var getTagPriority = function(product) {
      if (hasTag(product, "priority")) return 1; // Highest priority
      if (hasTag(product, "sale")) return 2; // Second priority
      if (hasTag(product, "new")) return 3; // Third priority
      if (hasTag(product, "trending") || hasTag(product, "summer") || hasTag(product, "christmas")) return 4; // Fourth priority (lower than New)
      return 5; // Default priority
    };
    
    // Sort by tag priority and then by complex rules within PRIORITY
    list.sort(function(a, b) {
      var priorityA = getTagPriority(a);
      var priorityB = getTagPriority(b);
      
      // If different tag priorities, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If both are PRIORITY, apply complex sorting rules
      if (priorityA === 1 && priorityB === 1) {
        // Check if they have other tags (besides priority)
        var otherTagsA = getOtherTagsCount(a);
        var otherTagsB = getOtherTagsCount(b);
        
        // Products with other tags come first
        if (otherTagsA !== otherTagsB) {
          return otherTagsB - otherTagsA; // More tags = higher priority
        }
        
        // If both have same number of other tags (including 0), sort by stock
        var stockA = getStock(a);
        var stockB = getStock(b);
        
        if (stockA !== stockB) {
          return stockB - stockA; // Higher stock = higher priority
        }
        
        // If stock is equal, sort by price (higher to lower)
        var priceA = typeof a.price === 'number' ? a.price : 0;
        var priceB = typeof b.price === 'number' ? b.price : 0;
        
        if (priceA !== priceB) {
          return priceB - priceA; // Higher price = higher priority
        }
        
        // If everything is equal, maintain order
        return 0;
      }
      
      // For Sale and other products, apply user-selected sorting
      if (sort === "price-asc") {
        return a.price - b.price;
      } else if (sort === "price-desc") {
        return b.price - a.price;
      } else if (sort === "alpha-asc") {
        return a.name.localeCompare(b.name);
      } else if (sort === "alpha-desc") {
        return b.name.localeCompare(a.name);
      }
      
      // Default: maintain order within same priority group
      return 0;
    });
    
    return list;
  }, [products, filters, query, sort, priceRange]);

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Shop" userName={userName} lead={`Here's your catalog, ${userName}`} subtitle={mainDescription} />
      
      {/* Mobile filter button */}
      <div className="mt-2 flex items-center justify-end mb-4 md:hidden">
        <Button size="sm" variant="flat" onPress={() => setFiltersOpen(true)}>Filters</Button>
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
            products={products || []}
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
              onPress={() => { setFilters({ type: "", usage: "", location: "", color: [], mount: "", minStock: 0, eco: false, dimKey: "", dimRange: null, releaseYear: "" }); setPriceRange([priceLimits.min, priceLimits.max]); setQuery(""); }}
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
