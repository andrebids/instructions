import React from "react";
import { Accordion, AccordionItem, Checkbox, Slider, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

/**
 * Sidebar filters styled to mimic Vineta's left filter while keeping our data model.
 * Sections used (only our existing categories):
 * - Type (2D/3D)
 * - Usage (Shopping)
 * - Location (Indoor/Outdoor)
 * - Price (slider)
 * - Color (swatches)
 * - Mount (Pole/Transversal/Ground)
 */
export default function TrendingFiltersSidebar({
  products,
  filters,
  onChange,
  priceRange,
  priceLimits,
  onPriceChange,
  className = "",
}) {
  const handle = (key, value) => onChange?.({ ...filters, [key]: value });

  const isEcoProduct = (p) => {
    try {
      const explicit = typeof p?.eco === "boolean" ? p.eco : false;
      const tagEco = Array.isArray(p?.tags) && p.tags.includes("eco");
      const materialsText = String(p?.specs?.materiais || p?.materials || "").toLowerCase();
      const inferred = /(recy|recycled|recycle|bioprint|bio|eco)/.test(materialsText);
      return Boolean(explicit || tagEco || inferred);
    } catch (_) {
      return false;
    }
  };

  // Get available years from products
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set();
    const currentYear = new Date().getFullYear();
    // Add years from current year down to 2020
    for (let year = currentYear; year >= 2020; year--) {
      yearsSet.add(year);
    }
    // Add years from products
    products.forEach((p) => {
      if (p.releaseYear) {
        const year = typeof p.releaseYear === 'number' ? p.releaseYear : parseInt(p.releaseYear, 10);
        if (!isNaN(year)) {
          yearsSet.add(year);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [products]);

  const itemsCount = React.useMemo(() => ({
    all: products.length,
    type2D: products.filter((p) => p.type === "2D").length,
    type3D: products.filter((p) => p.type === "3D").length,
    indoor: products.filter((p) => p.location === "Interior").length,
    outdoor: products.filter((p) => p.location === "Exterior").length,
    usageShopping: products.filter((p) => p.usage === "Shopping").length,
    eco: products.filter((p) => isEcoProduct(p)).length,
    mountPole: products.filter((p) => p.mount === "Poste").length,
    mountCrossarm: products.filter((p) => p.mount === "Transversal").length,
    mountGround: products.filter((p) => p.mount === "Chão").length,
    colorWhite: products.filter((p) => Boolean(p.images?.colors?.brancoPuro)).length,
    colorWarm: products.filter((p) => Boolean(p.images?.colors?.brancoQuente)).length,
    colorRGB: products.filter((p) => Boolean(p.images?.colors?.rgb)).length,
    colorRed: products.filter((p) => Boolean(p.images?.colors?.vermelho)).length,
    colorGreen: products.filter((p) => Boolean(p.images?.colors?.verde)).length,
    colorBlue: products.filter((p) => Boolean(p.images?.colors?.azul)).length,
  }), [products]);

  const colorOptions = [
    { key: "brancoQuente", label: "Warm White", swatch: "#f4e1a1", countKey: "colorWarm" },
    { key: "brancoPuro", label: "Pure White", swatch: "#ffffff", bordered: true, countKey: "colorWhite" },
    { key: "rgb", label: "RGB", gradient: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)", countKey: "colorRGB" },
    { key: "vermelho", label: "Red", swatch: "#ef4444", countKey: "colorRed" },
    { key: "verde", label: "Green", swatch: "#10b981", countKey: "colorGreen" },
    { key: "azul", label: "Blue", swatch: "#3b82f6", countKey: "colorBlue" },
  ];

  const mountOptions = [
    { value: "Poste", label: "Pole", countKey: "mountPole" },
    { value: "Transversal", label: "Transversal", countKey: "mountCrossarm" },
    { value: "Chão", label: "Ground", countKey: "mountGround" },
  ];

  // Price slider handlers. Attempt HeroUI range first; fallback to custom two-handle if needed
  const min = priceLimits?.min ?? 0;
  const max = priceLimits?.max ?? 0;

  const handlePriceChange = (value) => {
    if (Array.isArray(value)) {
      onPriceChange?.([Math.min(...value), Math.max(...value)]);
    } else if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
      onPriceChange?.([value.start, value.end]);
    } else if (typeof value === "number") {
      onPriceChange?.([min, value]);
    }
  };

  const resetPrice = () => onPriceChange?.([min, max]);

  // Stock slider (min stock)
  const computeStock = (id) => { try { let s=0; for (const ch of String(id||'')) s+=ch.charCodeAt(0); return 5 + (s % 60); } catch(_){ return 20; } };
  const maxStock = React.useMemo(() => {
    const values = products.map(p => typeof p.stock === 'number' ? p.stock : computeStock(p.id));
    return values.length ? Math.max(...values) : 0;
  }, [products]);
  const minStock = typeof filters.minStock === 'number' ? filters.minStock : 0;
  const resetStock = () => handle('minStock', 0);

  // Dimensions (height/width/depth in meters)
  const dimKey = filters.dimKey || ""; // one of 'heightM' | 'widthM' | 'depthM' | ''
  const dimLabels = {
    heightM: "Height",
    widthM: "Width",
    depthM: "Depth",
  };
  const availableDimKeys = ["heightM", "widthM", "depthM"];
  const dimValues = React.useMemo(() => {
    const vals = products
      .map(p => p?.specs?.dimensions?.[dimKey])
      .filter(v => typeof v === 'number' && Number.isFinite(v));
    if (!vals.length) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [products, dimKey]);
  const dimRange = Array.isArray(filters.dimRange) ? filters.dimRange : null;
  const effectiveDimRange = React.useMemo(() => {
    if (dimRange && dimRange.length === 2 && Number.isFinite(dimRange[0]) && Number.isFinite(dimRange[1])) return dimRange;
    return [dimValues.min, dimValues.max];
  }, [dimRange, dimValues.min, dimValues.max]);

  // Get selected location label
  const getSelectedLocationLabel = () => {
    if (!filters.location) return "All";
    if (filters.location === "Interior") return "Indoor";
    if (filters.location === "Exterior") return "Outdoor";
    return "All";
  };

  // Get selected year
  const getSelectedYear = () => {
    if (!filters.releaseYear || filters.releaseYear === "") return null;
    const year = typeof filters.releaseYear === 'number' ? filters.releaseYear : parseInt(filters.releaseYear, 10);
    return !isNaN(year) ? year : null;
  };

  return (
    <aside className={`space-y-6 ${className}`}>
      <Accordion variant="splitted" defaultExpandedKeys={["mount", "stock", "price", "color", "collectionYear", "type", "dimensions", "usage", "location"]} selectionMode="multiple">
        {/* Category */}
        <AccordionItem key="mount" aria-label="Category" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Category</span></div>}>
          <ul className="space-y-2">
            {mountOptions.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => handle("mount", filters.mount === opt.value ? "" : opt.value)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-content2 ${filters.mount === opt.value ? "bg-content2" : ""}`}
                >
                  <span>{opt.label}</span>
                  <span className="text-default-500">({itemsCount[opt.countKey]})</span>
                </button>
              </li>
            ))}
          </ul>
        </AccordionItem>

        {/* Stock */}
        <AccordionItem key="stock" aria-label="Stock" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Stock</span></div>}>
          <div className="space-y-3">
            {typeof Slider !== 'undefined' ? (
              <Slider
                aria-label="Minimum stock"
                minValue={0}
                maxValue={maxStock}
                step={1}
                className="max-w-full"
                value={minStock}
                onChange={(value)=> handle('minStock', Array.isArray(value) ? value[0] : Number(value))}
                showTooltip
              />
            ) : (
              <input type="range" min={0} max={maxStock} value={minStock} onChange={(e)=> handle('minStock', Number(e.target.value))} className="w-full" />
            )}
            <div className="text-sm">Stock: <span className="font-medium">{minStock}+</span></div>
          </div>
        </AccordionItem>

        {/* Price */}
        <AccordionItem key="price" aria-label="Price" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Price</span></div>}>
          <div className="space-y-3">
            {/* Try HeroUI range first */}
            {typeof Slider !== "undefined" ? (
              <Slider
                aria-label="Price range"
                minValue={min}
                maxValue={max}
                step={1}
                className="max-w-full"
                value={priceRange}
                onChange={handlePriceChange}
                showTooltip
                formatOptions={{ style: "currency", currency: "EUR" }}
              />
            ) : (
              // Basic fallback visual range (two native range inputs)
              <div className="space-y-2">
                <div className="relative h-2 rounded-full bg-default-200">
                  <div
                    className="absolute top-0 h-2 bg-primary rounded-full"
                    style={{ left: `${((priceRange[0] - min) / (max - min)) * 100}%`, width: `${((priceRange[1] - priceRange[0]) / (max - min)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={min} max={max} value={priceRange[0]} onChange={(e) => onPriceChange?.([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])} className="w-full" />
                  <input type="range" min={min} max={max} value={priceRange[1]} onChange={(e) => onPriceChange?.([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])} className="w-full" />
                </div>
              </div>
            )}
            <div className="text-sm">Price: <span className="font-medium">€{priceRange[0]}</span> - <span className="font-medium">€{priceRange[1]}</span></div>
          </div>
        </AccordionItem>

        {/* Color */}
        <AccordionItem key="color" aria-label="Color" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Color</span></div>}>
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((c) => {
              var isActive = false;
              if (Array.isArray(filters.color)) {
                for (var i = 0; i < filters.color.length; i++) {
                  if (filters.color[i] === c.key) {
                    isActive = true;
                    break;
                  }
                }
              }
              
              var handleColorClick = function() {
                var current = Array.isArray(filters.color) ? filters.color : [];
                var next = [];
                
                if (isActive) {
                  // Remover a cor se já estiver selecionada
                  for (var j = 0; j < current.length; j++) {
                    if (current[j] !== c.key) {
                      next.push(current[j]);
                    }
                  }
                } else {
                  // Adicionar a cor se não estiver selecionada
                  for (var k = 0; k < current.length; k++) {
                    next.push(current[k]);
                  }
                  next.push(c.key);
                }
                
                handle("color", next);
              };
              
              return (
                <Tooltip key={c.key} content={`${c.label}${itemsCount[c.countKey] ? ` (${itemsCount[c.countKey]})` : ""}`}>
                  <button
                    type="button"
                    aria-label={c.label}
                    onClick={handleColorClick}
                    className={`w-8 h-8 rounded-full border ${isActive ? "ring-2 ring-primary" : "border-default-200"}`}
                    style={{ background: c.gradient || c.swatch, boxShadow: c.bordered ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined }}
                  />
                </Tooltip>
              );
            })}
          </div>
        </AccordionItem>

        {/* Collection Year */}
        <AccordionItem 
          key="collectionYear" 
          aria-label="Collection Year" 
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-default-500">Collection Year</span>
                {getSelectedYear() && (
                  <span className="text-sm text-foreground font-medium">{getSelectedYear()}</span>
                )}
              </div>
            </div>
          }
        >
          <ul className="space-y-2">
            {availableYears.map((year) => {
              const yearStr = String(year);
              const isSelected = filters.releaseYear === yearStr || filters.releaseYear === year;
              const count = products.filter((p) => {
                const productYear = p.releaseYear;
                const yearValue = typeof productYear === 'number' ? productYear : parseInt(productYear, 10);
                return !isNaN(yearValue) && yearValue === year;
              }).length;
              
              return (
                <li key={year}>
                  <button
                    type="button"
                    onClick={() => handle("releaseYear", isSelected ? "" : yearStr)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-all ${
                      isSelected
                        ? "bg-content2 border-2 border-primary"
                        : "hover:bg-content2/50 border-2 border-transparent"
                    }`}
                  >
                    <span className={isSelected ? "text-foreground" : "text-default-400"}>{year}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && <span className="text-default-500 text-sm">({count})</span>}
                      {isSelected && (
                        <Icon icon="lucide:check" className="text-white text-sm" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </AccordionItem>

        {/* Type */}
        <AccordionItem key="type" aria-label="Type" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Type</span></div>}>
          <ul className="space-y-2">
            {[
              { value: "", label: "All", count: itemsCount.all },
              { value: "2D", label: "2D", count: itemsCount.type2D },
              { value: "3D", label: "3D", count: itemsCount.type3D },
            ].map((opt) => (
              <li key={opt.label}>
                <button
                  type="button"
                  onClick={() => handle("type", opt.value)}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-content2 ${filters.type === opt.value ? "bg-content2" : ""}`}
                >
                  <span>{opt.label}</span>
                  <span className="text-default-500">({opt.count})</span>
                </button>
              </li>
            ))}
          </ul>
        </AccordionItem>

        {/* Dimensions */}
        <AccordionItem key="dimensions" aria-label="Dimensions" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Dimensions</span></div>}>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-default-600">Field</span>
              <Dropdown>
                <DropdownTrigger>
                  <Button size="sm" radius="full" variant="bordered" endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}> 
                    {dimKey ? dimLabels[dimKey] : "Select"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Select dimension"
                  selectedKeys={new Set([dimKey || ""]) }
                  selectionMode="single"
                  onAction={(key)=>{
                    const k = String(key);
                    // Reset range when changing key
                    const next = { ...filters, dimKey: k === "" ? "" : k };
                    if (k === "") {
                      next.dimRange = null;
                    } else {
                      const vals = products
                        .map(p => p?.specs?.dimensions?.[k])
                        .filter(v => typeof v === 'number' && Number.isFinite(v));
                      if (vals.length) next.dimRange = [Math.min(...vals), Math.max(...vals)];
                    }
                    onChange?.(next);
                  }}
                >
                  <DropdownItem key="">None</DropdownItem>
                  {availableDimKeys.map(k => (
                    <DropdownItem key={k}>{dimLabels[k]}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            {dimKey ? (
              <div className="space-y-2">
                {typeof Slider !== 'undefined' ? (
                  <Slider
                    aria-label={`${dimLabels[dimKey]} range`}
                    minValue={dimValues.min}
                    maxValue={dimValues.max}
                    step={0.01}
                    className="max-w-full"
                    value={effectiveDimRange}
                    onChange={(value)=>{
                      if (Array.isArray(value)) {
                        onChange?.({ ...filters, dimRange: [Math.min(...value), Math.max(...value)] });
                      }
                    }}
                    showTooltip
                    formatOptions={{ style: 'unit', unit: 'meter', maximumFractionDigits: 2 }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <input type="range" min={dimValues.min} max={dimValues.max} step={0.01} value={effectiveDimRange[0]} onChange={(e)=> onChange?.({ ...filters, dimRange: [Math.min(Number(e.target.value), effectiveDimRange[1]-0.01), effectiveDimRange[1]] })} className="w-full" />
                    <input type="range" min={dimValues.min} max={dimValues.max} step={0.01} value={effectiveDimRange[1]} onChange={(e)=> onChange?.({ ...filters, dimRange: [effectiveDimRange[0], Math.max(Number(e.target.value), effectiveDimRange[0]+0.01)] })} className="w-full" />
                  </div>
                )}
                <div className="text-sm">{dimLabels[dimKey]}: <span className="font-medium">{effectiveDimRange[0].toFixed(2)}m</span> - <span className="font-medium">{effectiveDimRange[1].toFixed(2)}m</span></div>
              </div>
            ) : (
              <div className="text-sm text-default-500">Select a dimension to filter</div>
            )}
          </div>
        </AccordionItem>

        {/* Usage */}
        <AccordionItem key="usage" aria-label="Usage" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Usage</span></div>}>
          <div className="flex flex-col gap-2">
            <Checkbox 
              isSelected={filters.usage === "Shopping"}
              onValueChange={(v) => handle("usage", v ? "Shopping" : "")}
              classNames={{ label: "flex items-center gap-1" }}
              size="sm"
            >
              <span className="flex items-center gap-1">Shopping Malls <span className="text-default-500">({itemsCount.usageShopping})</span></span>
            </Checkbox>
            <Checkbox 
              isSelected={Boolean(filters.eco)}
              onValueChange={(v) => handle("eco", v)}
              classNames={{ label: "flex items-center gap-1" }}
              size="sm"
            >
              <span className="flex items-center gap-1">Eco <span className="text-default-500">({itemsCount.eco})</span></span>
            </Checkbox>
          </div>
        </AccordionItem>

        {/* Location */}
        <AccordionItem 
          key="location" 
          aria-label="Location" 
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-default-500">Location</span>
                <span className="text-sm text-foreground font-medium">{getSelectedLocationLabel()}</span>
              </div>
            </div>
          }
        >
          <ul className="space-y-2">
            {[
              { value: "", label: "All", count: itemsCount.indoor + itemsCount.outdoor },
              { value: "Interior", label: "Indoor", count: itemsCount.indoor },
              { value: "Exterior", label: "Outdoor", count: itemsCount.outdoor },
            ].map((opt) => {
              const isSelected = filters.location === opt.value;
              return (
                <li key={opt.value || "all"}>
                  <button
                    type="button"
                    onClick={() => handle("location", opt.value)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-all ${
                      isSelected
                        ? "bg-content2 border-2 border-primary"
                        : "hover:bg-content2/50 border-2 border-transparent"
                    }`}
                  >
                    <span className={isSelected ? "text-foreground" : "text-default-400"}>{opt.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-default-500 text-sm">({opt.count})</span>
                      {isSelected && (
                        <Icon icon="lucide:check" className="text-white text-sm" />
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}


