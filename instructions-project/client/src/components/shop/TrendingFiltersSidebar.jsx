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

  const [viewport, setViewport] = React.useState(() => ({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  }));

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const isGridLayout = React.useMemo(() => {
    return viewport.width >= 1600 || (viewport.width >= 1280 && viewport.height >= 900);
  }, [viewport.width, viewport.height]);

  const formatCurrency = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "€0";
    return value.toLocaleString("pt-PT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    });
  };

  const formatDimensionValue = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "-";
    return value.toFixed(2);
  };

  const selectedYear = getSelectedYear();
  const selectedColorsCount = Array.isArray(filters.color) ? filters.color.length : 0;
  const priceSummary = `${formatCurrency(priceRange[0])} — ${formatCurrency(priceRange[1])}`;
  const stockSummary = minStock > 0 ? `${minStock}+ minimum` : "All stock levels";
  const colorSummary = selectedColorsCount ? `${selectedColorsCount} selected` : "All colors";
  const dimensionSummary = dimKey
    ? `${dimLabels[dimKey]} • ${formatDimensionValue(effectiveDimRange?.[0])}–${formatDimensionValue(effectiveDimRange?.[1])} m`
    : "Not selected";
  const usageSummaryParts = [];
  if (filters.usage === "Shopping") usageSummaryParts.push("Shopping");
  if (filters.eco) usageSummaryParts.push("Eco");
  const usageSummary = usageSummaryParts.length ? usageSummaryParts.join(" • ") : "All";
  const locationSummary = getSelectedLocationLabel();

  const clearColors = () => onChange?.({ ...filters, color: [] });
  const clearYear = () => onChange?.({ ...filters, releaseYear: "" });
  const clearDimensions = () => onChange?.({ ...filters, dimKey: "", dimRange: null });
  const clearUsage = () => onChange?.({ ...filters, usage: "", eco: false });
  const clearLocation = () => onChange?.({ ...filters, location: "" });

  const sections = [
    {
      key: "category",
      title: "Category",
      summary: null,
      action: filters.mount
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={() => handle("mount", "")}
          >
            Clear
          </Button>
        )
        : null,
    },
    {
      key: "stock",
      title: "Stock",
      summary: stockSummary,
      action: minStock > 0
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={resetStock}
          >
            Reset
          </Button>
        )
        : null,
    },
    {
      key: "price",
      title: "Price",
      summary: priceSummary,
      action: (priceRange[0] !== min || priceRange[1] !== max)
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={resetPrice}
          >
            Reset
          </Button>
        )
        : null,
    },
    {
      key: "color",
      title: "Color",
      summary: colorSummary,
      action: selectedColorsCount
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={clearColors}
          >
            Clear
          </Button>
        )
        : null,
      gridSpan: "wide",
    },
    {
      key: "collectionYear",
      title: "Collection Year",
      summary: selectedYear ? String(selectedYear) : "All",
      action: selectedYear
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={clearYear}
          >
            Clear
          </Button>
        )
        : null,
    },
    {
      key: "type",
      title: "Type",
      summary: filters.type ? filters.type : "All",
      action: filters.type
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={() => handle("type", "")}
          >
            Clear
          </Button>
        )
        : null,
    },
    {
      key: "dimensions",
      title: "Dimensions",
      summary: dimensionSummary,
      action: dimKey
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={clearDimensions}
          >
            Clear
          </Button>
        )
        : null,
    },
    {
      key: "usage",
      title: "Usage",
      summary: usageSummary,
      action: (filters.usage || filters.eco)
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={clearUsage}
          >
            Clear
          </Button>
        )
        : null,
    },
    {
      key: "location",
      title: "Location",
      summary: locationSummary,
      action: filters.location
        ? (
          <Button
            size="sm"
            variant="light"
            className="h-7 px-2 text-xs"
            onPress={clearLocation}
          >
            Clear
          </Button>
        )
        : null,
    },
  ];

  const renderSectionContent = (sectionKey) => {
    switch (sectionKey) {
      case "category":
        return (
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
        );
      case "stock":
        return (
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
        );
      case "price":
        return (
          <div className="space-y-3">
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
              <div className="space-y-2">
                <div className="relative h-2 rounded-full bg-default-200">
                  <div
                    className="absolute top-0 h-2 bg-primary rounded-full"
                    style={{ left: `${((priceRange[0] - min) / (max - min || 1)) * 100}%`, width: `${((priceRange[1] - priceRange[0]) / (max - min || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="range" min={min} max={max} value={priceRange[0]} onChange={(e) => onPriceChange?.([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])} className="w-full" />
                  <input type="range" min={min} max={max} value={priceRange[1]} onChange={(e) => onPriceChange?.([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])} className="w-full" />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-medium text-default-500">
              <span>{formatCurrency(priceRange[0])}</span>
              <span>{formatCurrency(priceRange[1])}</span>
            </div>
          </div>
        );
      case "color":
        return (
          <div className="flex flex-wrap gap-3">
            {colorOptions.map((c) => {
              let isActive = false;
              if (Array.isArray(filters.color)) {
                for (let i = 0; i < filters.color.length; i++) {
                  if (filters.color[i] === c.key) {
                    isActive = true;
                    break;
                  }
                }
              }

              const handleColorClick = () => {
                const current = Array.isArray(filters.color) ? filters.color : [];
                const next = [];

                if (isActive) {
                  for (let j = 0; j < current.length; j++) {
                    if (current[j] !== c.key) {
                      next.push(current[j]);
                    }
                  }
                } else {
                  for (let k = 0; k < current.length; k++) {
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
        );
      case "collectionYear":
        return (
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
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-all ${isSelected ? "bg-content2 border-2 border-primary" : "hover:bg-content2/50 border-2 border-transparent"}`}
                  >
                    <span className={isSelected ? "text-foreground" : "text-default-400"}>{year}</span>
                    <div className="flex items-center gap-2">
                      {count > 0 && <span className="text-default-500 text-sm">({count})</span>}
                      {isSelected && <Icon icon="lucide:check" className="text-white text-sm" />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        );
      case "type":
        return (
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
        );
      case "dimensions":
        return (
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
                    const next = { ...filters, dimKey: k === "" ? "" : k };
                    if (k === "") {
                      next.dimRange = null;
                    } else {
                      const vals = products
                        .map(p => p?.specs?.dimensions?.[k])
                        .filter(v => typeof v === 'number' && Number.isFinite(v));
                      if (vals.length) {
                        next.dimRange = [Math.min(...vals), Math.max(...vals)];
                      } else {
                        next.dimRange = [0, 0];
                      }
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
                <div className="text-sm">{dimLabels[dimKey]}: <span className="font-medium">{formatDimensionValue(effectiveDimRange[0])}m</span> - <span className="font-medium">{formatDimensionValue(effectiveDimRange[1])}m</span></div>
              </div>
            ) : (
              <div className="text-sm text-default-500">Select a dimension to filter</div>
            )}
          </div>
        );
      case "usage":
        return (
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
        );
      case "location":
        return (
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
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-all ${isSelected ? "bg-content2 border-2 border-primary" : "hover:bg-content2/50 border-2 border-transparent"}`}
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
        );
      default:
        return null;
    }
  };

  const accordionDefaultKeys = React.useMemo(
    () => ["category", "stock", "price", "color", "collectionYear", "type", "dimensions", "usage", "location"],
    []
  );

  if (isGridLayout) {
    return (
      <aside className={`grid gap-4 xl:grid-cols-2 2xl:grid-cols-3 ${className}`}>
        {sections.map((section) => (
          <div
            key={section.key}
            className={`rounded-2xl border border-white/10 bg-content1/60 backdrop-blur-sm p-4 shadow-sm ${section.gridSpan === "wide" ? "xl:col-span-2 2xl:col-span-3" : ""}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-semibold text-foreground">{section.title}</div>
                {section.summary && (
                  <div className="text-xs text-default-500 mt-1 leading-tight">
                    {section.summary}
                  </div>
                )}
              </div>
              {section.action ? (
                <div className="shrink-0">
                  {section.action}
                </div>
              ) : null}
            </div>
            <div className="space-y-3">
              {renderSectionContent(section.key)}
            </div>
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside className={className}>
      <Accordion variant="splitted" defaultExpandedKeys={accordionDefaultKeys} selectionMode="multiple">
        {sections.map((section) => (
          <AccordionItem
            key={section.key}
            aria-label={section.title}
            title={
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{section.title}</span>
                  {section.summary && (
                    <span className="text-xs text-default-500">{section.summary}</span>
                  )}
                </div>
                {section.action ? (
                  <div className="ml-2 shrink-0">
                    {section.action}
                  </div>
                ) : null}
              </div>
            }
          >
            {renderSectionContent(section.key)}
          </AccordionItem>
        ))}
      </Accordion>
    </aside>
  );
}



