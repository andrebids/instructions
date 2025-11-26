import React from "react";
import { Checkbox, Slider, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";

// Componente memoizado para ícones para evitar loops
const MountIcon = React.memo(({ iconName }) => {
  if (!iconName) return null;
  return <Icon icon={iconName} className="text-xs" />;
}, (prevProps, nextProps) => prevProps.iconName === nextProps.iconName);
MountIcon.displayName = "MountIcon";

/**
 * Redesigned shop filters sidebar styled after the provided inspiration,
 * but wired to the existing filters/state.
 */
export default function TrendingFiltersSidebar({
  products,
  filters,
  onChange,
  priceRange,
  priceLimits,
  onPriceChange,
  stockRange,
  stockLimits,
  onStockChange,
  className = "",
  onClearAll,
  onToggleVisibility,
  filtersVisible = true,
}) {
  const filtersRef = React.useRef(filters);
  React.useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const handle = React.useCallback((key, value) => {
    onChange?.({ ...filtersRef.current, [key]: value });
  }, [onChange]);
  const { theme } = useTheme();
  
  // Force component to re-render when theme changes by checking both hook and DOM
  const [isDark, setIsDark] = React.useState(() => {
    // Initialize from DOM to catch initial state
    return document.documentElement.classList.contains('dark');
  });
  
  React.useEffect(() => {
    // Update from theme hook
    const darkFromTheme = theme === 'dark';
    setIsDark(darkFromTheme);
    
    // Also listen for DOM class changes as backup
    const checkDarkClass = () => {
      const hasDark = document.documentElement.classList.contains('dark');
      setIsDark(hasDark);
    };
    
    // Listen for theme change events
    const handleThemeChange = (event) => {
      if (event.detail?.theme) {
        setIsDark(event.detail.theme === 'dark');
      }
    };
    
    // Use MutationObserver to watch for class changes on html element
    const observer = new MutationObserver(checkDarkClass);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    window.addEventListener('themechange', handleThemeChange);
    
    return () => {
      observer.disconnect();
      window.removeEventListener('themechange', handleThemeChange);
    };
  }, [theme]);

  const containerClass = React.useMemo(() => isDark
    ? "relative space-y-6 rounded-lg border border-white/10 bg-[#0b1224]/90 pt-[14px] pb-6 px-6 text-sm text-default-400 shadow-[0_25px_80px_rgba(8,15,36,0.55)] backdrop-blur-xl w-full"
    : "relative space-y-6 rounded-lg border border-black/5 bg-gradient-to-b from-white via-white to-slate-100 pt-[14px] pb-6 px-6 text-sm text-default-600 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl w-full", [isDark]);

  const heroCardClass = React.useMemo(() => isDark
    ? "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    : "relative overflow-hidden rounded-2xl border border-black/5 bg-white px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]", [isDark]);

  const sectionCardClass = React.useMemo(() => isDark
    ? "rounded-2xl border border-white/10 bg-content1/60 p-5 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
    : "rounded-2xl border border-black/5 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.1)]", [isDark]);

  const statPillClass = React.useMemo(() => isDark
    ? "rounded-xl border border-white/10 bg-black/40 px-3 py-2"
    : "rounded-xl border border-black/5 bg-white px-3 py-2", [isDark]);

  const collapsibleCardClass = React.useMemo(() => isDark
    ? "rounded-2xl border border-white/10 bg-content1/60 shadow-[0_18px_60px_rgba(8,15,36,0.45)] backdrop-blur"
    : "rounded-2xl border border-black/5 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur", [isDark]);

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

  const availableYears = React.useMemo(() => {
    const yearsSet = new Set();
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 2020; year--) {
      yearsSet.add(year);
    }
    products.forEach((p) => {
      if (p.releaseYear) {
        const year = typeof p.releaseYear === "number" ? p.releaseYear : parseInt(p.releaseYear, 10);
        if (!Number.isNaN(year)) {
          yearsSet.add(year);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [products]);

  const itemsCount = React.useMemo(
    () => ({
      all: products.length,
      type2D: products.filter((p) => p.type === "2D").length,
      type3D: products.filter((p) => p.type === "3D").length,
      indoor: products.filter((p) => p.location === "Interior").length,
      outdoor: products.filter((p) => p.location === "Exterior").length,
      usageShopping: products.filter((p) => p.usage === "Shopping").length,
      eco: products.filter((p) => isEcoProduct(p)).length,
      mountSidePole: products.filter((p) => p.mount === "SIDE POLE").length,
      mountCentralPole: products.filter((p) => p.mount === "CENTRAL POLE").length,
      mountSuspended: products.filter((p) => p.mount === "SUSPENDED").length,
      mountTransverse: products.filter((p) => p.mount === "TRANSVERSE").length,
      mountWallMounted: products.filter((p) => p.mount === "WALL-MOUNTED").length,
      mountFloorStanding: products.filter((p) => p.mount === "FLOOR-STANDING").length,
      mountSpecial: products.filter((p) => p.mount === "SPECIAL").length,
      mountNoFixing: products.filter((p) => p.mount === "NO FIXING").length,
      colorWhite: products.filter((p) => Boolean(p.images?.colors?.brancoPuro)).length,
      colorWarm: products.filter((p) => Boolean(p.images?.colors?.brancoQuente)).length,
      colorRGB: products.filter((p) => Boolean(p.images?.colors?.rgb)).length,
      colorRed: products.filter((p) => Boolean(p.images?.colors?.vermelho)).length,
      colorGreen: products.filter((p) => Boolean(p.images?.colors?.verde)).length,
      colorBlue: products.filter((p) => Boolean(p.images?.colors?.azul)).length,
    }),
    [products]
  );

  const colorOptions = [
    { key: "brancoQuente", label: "Warm White", swatch: "#f4e1a1", countKey: "colorWarm" },
    { key: "brancoPuro", label: "Pure White", swatch: "#ffffff", bordered: true, countKey: "colorWhite" },
    { key: "rgb", label: "RGB", gradient: "linear-gradient(135deg,#ef4444,#f59e0b,#10b981,#3b82f6,#8b5cf6)", countKey: "colorRGB" },
    { key: "vermelho", label: "Red", swatch: "#ef4444", countKey: "colorRed" },
    { key: "verde", label: "Green", swatch: "#10b981", countKey: "colorGreen" },
    { key: "azul", label: "Blue", swatch: "#3b82f6", countKey: "colorBlue" },
  ];

  const mountOptions = [
    { value: "SIDE POLE", label: "Side Pole", countKey: "mountSidePole", icon: "lucide:flag" },
    { value: "CENTRAL POLE", label: "Central Pole", countKey: "mountCentralPole", icon: "lucide:flag" },
    { value: "SUSPENDED", label: "Suspended", countKey: "mountSuspended", icon: "lucide:move-vertical" },
    { value: "TRANSVERSE", label: "Transverse", countKey: "mountTransverse", icon: "lucide:move-horizontal" },
    { value: "WALL-MOUNTED", label: "Wall-Mounted", countKey: "mountWallMounted", icon: "lucide:square" },
    { value: "FLOOR-STANDING", label: "Floor-Standing", countKey: "mountFloorStanding", icon: "lucide:square" },
    { value: "SPECIAL", label: "Special", countKey: "mountSpecial", icon: "lucide:star" },
    { value: "NO FIXING", label: "No Fixing", countKey: "mountNoFixing", icon: "lucide:x-circle" },
  ];


  const min = priceLimits?.min ?? 0;
  const max = priceLimits?.max ?? 0;
  // Ensure min and max are different to avoid Hero UI warning
  const effectiveMin = min === max ? Math.max(0, min - 1) : min;
  const effectiveMax = min === max ? min + 1 : max;

  const stockMin = stockLimits?.min ?? 0;
  const stockMax = stockLimits?.max ?? 0;
  // Ensure min and max are different to avoid Hero UI warning
  const effectiveStockMin = stockMin === stockMax ? Math.max(0, stockMin - 1) : stockMin;
  const effectiveStockMax = stockMin === stockMax ? stockMin + 1 : stockMax;

  const [isDraggingPrice, setIsDraggingPrice] = React.useState(false);

  const handlePriceChange = React.useCallback((value) => {
    if (Array.isArray(value)) {
      const newMin = Math.min(...value);
      const newMax = Math.max(...value);
      onPriceChange?.([newMin, newMax]);
    } else if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
      onPriceChange?.([value.start, value.end]);
    } else if (typeof value === "number") {
      onPriceChange?.([min, value]);
    }
  }, [onPriceChange, min]);

  const handlePriceChangeStart = React.useCallback(() => {
    setIsDraggingPrice(true);
  }, []);

  const handlePriceChangeEnd = React.useCallback(() => {
    setIsDraggingPrice(false);
  }, []);

  const resetPrice = React.useCallback(() => {
    if (onPriceChange) {
      onPriceChange([min, max]);
    }
  }, [onPriceChange, min, max]);

  const handleStockChange = React.useCallback((value) => {
    if (Array.isArray(value)) {
      const newMin = Math.round(Math.min(...value));
      const newMax = Math.round(Math.max(...value));
      onStockChange?.([newMin, newMax]);
    } else if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
      onStockChange?.([Math.round(value.start), Math.round(value.end)]);
    } else if (typeof value === "number") {
      onStockChange?.([stockMin, Math.round(value)]);
    }
  }, [onStockChange, stockMin]);

  const resetStock = React.useCallback(() => {
    if (onStockChange) {
      onStockChange([stockMin, stockMax]);
    }
  }, [onStockChange, stockMin, stockMax]);

  const dimLabels = {
    heightM: "Height",
    widthM: "Width",
    depthM: "Depth",
  };
  const availableDimKeys = ["heightM", "widthM", "depthM"];
  
  // Calculate values for each dimension separately
  const heightValues = React.useMemo(() => {
    const vals = products
      .map((p) => p?.specs?.dimensions?.heightM)
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [products]);

  const widthValues = React.useMemo(() => {
    const vals = products
      .map((p) => p?.specs?.dimensions?.widthM)
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [products]);

  const depthValues = React.useMemo(() => {
    const vals = products
      .map((p) => p?.specs?.dimensions?.depthM)
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [products]);

  // Extrair valores primitivos para evitar recálculos desnecessários quando objetos são recriados
  const heightMin = heightValues.min;
  const heightMax = heightValues.max;
  const widthMin = widthValues.min;
  const widthMax = widthValues.max;
  const depthMin = depthValues.min;
  const depthMax = depthValues.max;

  // Get effective ranges for each dimension
  // Calcular diretamente nos useMemo usando valores primitivos para evitar recriações desnecessárias
  const effectiveHeightRange = React.useMemo(() => {
    const dimRanges = filters.dimRanges || {};
    const range = dimRanges.heightM;
    if (range && Array.isArray(range) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
      return range;
    }
    return [heightMin, heightMax];
  }, [filters.dimRanges, heightMin, heightMax]);

  const effectiveWidthRange = React.useMemo(() => {
    const dimRanges = filters.dimRanges || {};
    const range = dimRanges.widthM;
    if (range && Array.isArray(range) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
      return range;
    }
    return [widthMin, widthMax];
  }, [filters.dimRanges, widthMin, widthMax]);

  const effectiveDepthRange = React.useMemo(() => {
    const dimRanges = filters.dimRanges || {};
    const range = dimRanges.depthM;
    if (range && Array.isArray(range) && range.length === 2 && Number.isFinite(range[0]) && Number.isFinite(range[1])) {
      return range;
    }
    return [depthMin, depthMax];
  }, [filters.dimRanges, depthMin, depthMax]);

  const getSelectedLocationLabel = () => {
    if (!filters.location) return "All";
    if (filters.location === "Interior") return "Indoor";
    if (filters.location === "Exterior") return "Outdoor";
    return "All";
  };

  const getSelectedYear = () => {
    if (!filters.releaseYear || filters.releaseYear === "") return null;
    const year = typeof filters.releaseYear === "number" ? filters.releaseYear : parseInt(filters.releaseYear, 10);
    return !Number.isNaN(year) ? year : null;
  };

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
  const colorSummary = selectedColorsCount ? `${selectedColorsCount} selected` : "All colors";
  const dimensionSummary = filters.dimRanges && Object.keys(filters.dimRanges).length > 0
    ? "Custom ranges"
    : "All dimensions";
  const usageSummaryParts = [];
  if (filters.usage === "Shopping") usageSummaryParts.push("Shopping");
  if (filters.eco) usageSummaryParts.push("Eco");
  const usageSummary = usageSummaryParts.length ? usageSummaryParts.join(" • ") : "All";
  const locationSummary = getSelectedLocationLabel();
  
  const getStockSummary = () => {
    if (Array.isArray(stockRange) && stockRange.length === 2) {
      if (stockRange[0] === stockMin && stockRange[1] === stockMax) {
        return "All stock levels";
      }
      return `${stockRange[0]} — ${stockRange[1]}`;
    }
    return "All stock levels";
  };

  const clearColors = () => onChange?.({ ...filters, color: [] });
  const clearYear = () => onChange?.({ ...filters, releaseYear: "" });
  const clearDimensions = () => {
    const next = { ...filters };
    delete next.dimRanges;
    delete next.dimKey;
    delete next.dimRange;
    onChange?.(next);
  };
  const clearUsage = () => onChange?.({ ...filters, usage: "", eco: false });
  const clearLocation = () => onChange?.({ ...filters, location: "" });

  const getMountSummary = () => {
    if (!filters.mount) return "All mounting styles";
    const match = mountOptions.find((opt) => opt.value === filters.mount);
    return match ? match.label : "All mounting styles";
  };

  const [openSections, setOpenSections] = React.useState(() => [
    "usage",
    "location",
    "collectionYear",
  ]);

  const toggleSection = (key) => {
    // Preservar a posição do scroll antes de fazer toggle
    const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-auto');
    const scrollY = scrollContainer ? scrollContainer.scrollTop : (window.pageYOffset || document.documentElement.scrollTop);
    
    setOpenSections((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
    
    // Restaurar a posição do scroll após o re-render (usar múltiplos frames para garantir)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollY;
        } else {
          window.scrollTo({ top: scrollY, behavior: 'auto' });
        }
      });
    });
  };

  const typeOptions = [
    { value: "", label: "All", count: itemsCount.all },
    { value: "2D", label: "2D", count: itemsCount.type2D },
    { value: "3D", label: "3D", count: itemsCount.type3D },
  ];

  const collapsibleSections = [
    {
      key: "usage",
      title: "Usage & Sustainability",
      summary: usageSummary,
      onClear: filters.usage || filters.eco ? clearUsage : null,
    },
    {
      key: "location",
      title: "Location",
      summary: locationSummary,
      onClear: filters.location ? clearLocation : null,
    },
    {
      key: "collectionYear",
      title: "Collection Year",
      summary: selectedYear ? String(selectedYear) : "All years",
      onClear: selectedYear ? clearYear : null,
    },
  ];

  // Calculate price distribution histogram
  const histogramBins = 20; // Number of bars in histogram
  const priceHistogram = React.useMemo(() => {
    if (!products || products.length === 0 || min === max) {
      return Array(histogramBins).fill(0);
    }
    
    const binSize = (max - min) / histogramBins;
    const bins = Array(histogramBins).fill(0);
    
    products.forEach((product) => {
      const price = typeof product.price === "number" ? product.price : 0;
      if (price >= min && price <= max) {
        const binIndex = Math.min(
          Math.floor((price - min) / binSize),
          histogramBins - 1
        );
        bins[binIndex]++;
      }
    });
    
    return bins;
  }, [products, min, max]);
  
  const maxCount = Math.max(...priceHistogram, 1);

  // Componente memoizado para Mounting para evitar loops com Icon
  const MountingFilter = React.useMemo(() => {
    const mountCounts = mountOptions.reduce((acc, opt) => {
      acc[opt.countKey] = itemsCount[opt.countKey] || 0;
      return acc;
    }, {});
    
    return (
      <div className="grid grid-cols-4 gap-1.5">
        {mountOptions.map((opt) => {
          const isSelected = filters.mount === opt.value;
          const selectedClass = isDark
            ? "border-primary bg-primary text-white"
            : "border-primary bg-primary text-white";
          const idleClass = isDark
            ? "border-white/20 bg-white/[0.05] hover:border-white/30 hover:bg-white/[0.08] text-white"
            : "border-black/10 bg-white hover:border-black/20 hover:bg-default-50 text-default-700";
          const count = mountCounts[opt.countKey] || 0;

          return (
            <Tooltip
              key={opt.value}
              content={`${opt.label}${count > 0 ? ` (${count})` : ""}`}
            >
              <button
                type="button"
                onClick={() => handle("mount", isSelected ? "" : opt.value)}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 transition-all ${
                  isSelected ? selectedClass : idleClass
                }`}
              >
                {opt.icon && <MountIcon iconName={opt.icon} />}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    );
  }, [filters.mount, isDark, itemsCount, handle, mountOptions]);

  const renderSectionContent = React.useCallback((sectionKey) => {
    switch (sectionKey) {
      case "category":
        return MountingFilter;
      case "price":
        return (
          <div className="space-y-2">
            {/* Histogram bars */}
            <div className="relative h-20 flex items-end gap-1 justify-between">
              {priceHistogram.map((count, index) => {
                const binStart = min + (index * (max - min) / histogramBins);
                const binEnd = min + ((index + 1) * (max - min) / histogramBins);
                const isInRange = binStart <= priceRange[1] && binEnd >= priceRange[0];
                
                // Calculate actual bar height (10px to 60px based on count)
                const actualBarHeight = maxCount > 0 
                  ? Math.max(10, Math.min(60, 10 + (count / maxCount) * 50))
                  : 10;
                
                return (
                  <div
                    key={index}
                    className="relative w-1 overflow-hidden rounded-sm"
                    style={{
                      height: `${actualBarHeight}px`,
                      minHeight: count > 0 ? "10px" : "10px",
                      marginLeft: index === 0 ? "9px" : undefined,
                      marginRight: index === histogramBins - 1 ? "9px" : undefined,
                    }}
                    title={`${formatCurrency(binStart)} - ${formatCurrency(binEnd)}: ${count} produtos`}
                  >
                    {/* Gray background bar (always visible) */}
                    <div
                      className={`absolute bottom-0 w-full ${
                        isDark ? "bg-white/20" : "bg-default-300"
                      }`}
                      style={{
                        height: "100%",
                      }}
                    />
                    {/* Colored fill that animates from bottom to top */}
                    <div
                      className={`absolute bottom-0 w-full transition-all duration-500 ease-out ${
                        isDark ? "bg-primary-500" : "bg-primary-500"
                      }`}
                      style={{
                        height: isInRange ? "100%" : "0%",
                      }}
                    />
                  </div>
                );
              })}
            </div>
            
            {typeof Slider !== "undefined" && min !== max ? (
              <Slider
                  key={`price-slider-${effectiveMin}-${effectiveMax}`}
                  aria-label="Price range"
                  minValue={effectiveMin}
                  maxValue={effectiveMax}
                  step={1}
                  value={Array.isArray(priceRange) && priceRange.length === 2 ? priceRange : [effectiveMin, effectiveMax]}
                  onChange={handlePriceChange}
                  onChangeStart={handlePriceChangeStart}
                  onChangeEnd={handlePriceChangeEnd}
                formatOptions={{ style: "currency", currency: "EUR" }}
                className="max-w-full"
                classNames={{
                  track: "h-1",
                  filler: "h-1"
                }}
              />
            ) : (
              <div className="space-y-2">
                <div className="relative h-2 rounded-full bg-default-200">
                  <div
                    className="absolute top-0 h-2 rounded-full bg-primary"
                    style={{
                      left: `${((priceRange[0] - effectiveMin) / (effectiveMax - effectiveMin || 1)) * 100}%`,
                      width: `${((priceRange[1] - priceRange[0]) / (effectiveMax - effectiveMin || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={effectiveMin}
                    max={effectiveMax}
                    value={priceRange[0]}
                    onChange={(e) =>
                      onPriceChange?.([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])
                    }
                    className="w-full"
                    disabled={min === max}
                  />
                  <input
                    type="range"
                    min={effectiveMin}
                    max={effectiveMax}
                    value={priceRange[1]}
                    onChange={(e) =>
                      onPriceChange?.([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])
                    }
                    className="w-full"
                    disabled={min === max}
                  />
                </div>
              </div>
            )}
          </div>
        );
      case "color":
        return (
          <div className="grid grid-cols-6 gap-2">
            {colorOptions.map((c) => {
              const isActive = Array.isArray(filters.color) && filters.color.includes(c.key);
              const handleColorClick = () => {
                const current = Array.isArray(filters.color) ? filters.color : [];
                const next = isActive ? current.filter((value) => value !== c.key) : [...current, c.key];
                handle("color", next);
              };

              return (
                <Tooltip
                  key={c.key}
                  content={`${c.label}${itemsCount[c.countKey] ? ` (${itemsCount[c.countKey]})` : ""}`}
                >
                  <button
                    type="button"
                    aria-label={c.label}
                    onClick={handleColorClick}
                    className={`h-9 w-9 rounded-full border transition-all ${
                      isActive
                        ? `ring-2 ring-primary ${c.key === "brancoPuro" ? "" : c.bordered ? "ring-offset-2" : "ring-offset-1"} ${c.key === "brancoPuro" ? "" : isDark ? "ring-offset-[#0b1224]" : "ring-offset-white"}`
                        : isDark
                          ? "border-white/20"
                          : "border-black/10"
                    }`}
                    style={{
                      background: c.gradient || c.swatch,
                      boxShadow: c.bordered && !isActive
                        ? "inset 0 0 0 1px rgba(0,0,0,0.15), inset 0 0 0 2px rgba(255,255,255,0.6)"
                        : c.bordered && isActive && c.key !== "brancoPuro"
                        ? "inset 0 0 0 1px rgba(0,0,0,0.15), inset 0 0 0 2px rgba(255,255,255,0.6)"
                        : undefined,
                    }}
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
                const yearValue = typeof productYear === "number" ? productYear : parseInt(productYear, 10);
                return !Number.isNaN(yearValue) && yearValue === year;
              }).length;

              const selectedClass = isDark
                ? "border-primary bg-primary/10 text-white"
                : "border-primary bg-primary/5 text-primary-700";
              const idleClass = isDark
                ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                : "border-black/10 bg-white hover:border-black/20 hover:bg-default-50";

              return (
                <li key={year}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const scrollContainer = document.querySelector('.flex-1.min-h-0.overflow-auto');
                      const scrollY = scrollContainer ? scrollContainer.scrollTop : (window.pageYOffset || document.documentElement.scrollTop);
                      
                      handle("releaseYear", isSelected ? "" : yearStr);
                      
                      requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                          if (scrollContainer) {
                            scrollContainer.scrollTop = scrollY;
                          } else {
                            window.scrollTo({ top: scrollY, behavior: 'auto' });
                          }
                        });
                      });
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isSelected ? selectedClass : idleClass}`}
                  >
                    <span className={isDark ? "text-white" : isSelected ? "text-primary-700" : "text-default-700"}>{year}</span>
                    <div className="flex items-center gap-2 text-xs">
                      {count > 0 && <span className={`font-medium ${isDark ? "text-white" : "text-default-600"}`}>({count})</span>}
                      {isSelected && <Icon icon="lucide:check" className={`text-sm ${isDark ? "text-white" : "text-primary-400"}`} />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        );
      case "type":
        return (
          <div className="grid grid-cols-3 gap-2">
            {typeOptions.map((opt) => {
              const isActive = filters.type === opt.value;
              const activeClass = isDark
                ? "border-primary bg-primary/10 text-white"
                : "border-primary bg-primary/5 text-primary-700";
              const idleClass = isDark
                ? "border-white/10 bg-white/[0.03] text-default-400 hover:border-white/20 hover:bg-white/[0.05]"
                : "border-black/10 bg-white text-default-700 hover:border-black/20 hover:bg-default-50";

              return (
                <button
                  type="button"
                  key={opt.value || "all"}
                  onClick={() => handle("type", opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${isActive ? activeClass : idleClass}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      case "dimensions":
        const renderDimensionSlider = (key, label, values, effectiveRange) => {
          const handleDimensionChange = (value) => {
            if (Array.isArray(value)) {
              const newMin = Math.min(...value);
              const newMax = Math.max(...value);
              const dimRanges = filters.dimRanges || {};
              onChange?.({ ...filters, dimRanges: { ...dimRanges, [key]: [newMin, newMax] } });
            } else if (typeof value === "object" && value !== null && "start" in value && "end" in value) {
              const dimRanges = filters.dimRanges || {};
              onChange?.({ ...filters, dimRanges: { ...dimRanges, [key]: [value.start, value.end] } });
            } else if (typeof value === "number") {
              const dimRanges = filters.dimRanges || {};
              onChange?.({ ...filters, dimRanges: { ...dimRanges, [key]: [values.min, value] } });
            }
          };

          return (
            <div className="space-y-1">
              <span className="text-xs text-default-500 block -mt-2">{label}</span>
              {typeof Slider !== "undefined" && values.min !== values.max ? (
                <>
                  <Slider
                    key={`${key}-slider-${values.min}-${values.max}`}
                    aria-label={`${label} range`}
                    minValue={values.min}
                    maxValue={values.max}
                    step={0.01}
                    value={Array.isArray(effectiveRange) && effectiveRange.length === 2 ? effectiveRange : [values.min, values.max]}
                    onChange={handleDimensionChange}
                    className="max-w-full"
                    classNames={{
                      track: "h-1",
                      filler: "h-1"
                    }}
                  />
                </>
              ) : null}
            </div>
          );
        };

        return (
          <div className="space-y-4">
            {renderDimensionSlider("heightM", "Height", heightValues, effectiveHeightRange)}
            {renderDimensionSlider("widthM", "Width", widthValues, effectiveWidthRange)}
            {renderDimensionSlider("depthM", "Depth", depthValues, effectiveDepthRange)}
          </div>
        );
      case "usage":
        return (
          <div className="flex flex-col gap-1.5">
            <Checkbox
              isSelected={filters.usage === "Shopping"}
              onValueChange={(value) => handle("usage", value ? "Shopping" : "")}
              classNames={{
                label: `flex items-center gap-1 text-sm ${isDark ? "text-white" : "text-default-600"}`,
              }}
              size="sm"
            >
              Shopping Malls <span className={`font-medium ${isDark ? "text-white" : "text-default-500"}`}>({itemsCount.usageShopping})</span>
            </Checkbox>
            <Checkbox
              isSelected={Boolean(filters.eco)}
              onValueChange={(value) => handle("eco", value)}
              classNames={{
                label: `flex items-center gap-1 text-sm ${isDark ? "text-white" : "text-default-600"}`,
              }}
              size="sm"
            >
              Eco <span className={`font-medium ${isDark ? "text-white" : "text-default-500"}`}>({itemsCount.eco})</span>
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
              const selectedClass = isDark
                ? "border-primary bg-primary/10 text-white"
                : "border-primary bg-primary/5 text-primary-700";
              const idleClass = isDark
                ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                : "border-black/10 bg-white hover:border-black/20 hover:bg-default-50";

              return (
                <li key={opt.value || "all"}>
                  <button
                    type="button"
                    onClick={() => handle("location", opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isSelected ? selectedClass : idleClass}`}
                  >
                    <span className={isDark ? "text-white" : isSelected ? "text-primary-700" : "text-default-700"}>{opt.label}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`font-medium ${isDark ? "text-white" : "text-default-600"}`}>({opt.count})</span>
                      {isSelected && <Icon icon="lucide:check" className={`text-sm ${isDark ? "text-white" : "text-primary-400"}`} />}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        );
      case "stock":
        return (
          <div className="space-y-2">
            {typeof Slider !== "undefined" && stockMin !== stockMax ? (
              <Slider
                key={`stock-slider-${effectiveStockMin}-${effectiveStockMax}`}
                aria-label="Stock range"
                minValue={effectiveStockMin}
                maxValue={effectiveStockMax}
                step={0.01}
                value={Array.isArray(stockRange) && stockRange.length === 2 ? stockRange : [effectiveStockMin, effectiveStockMax]}
                onChange={handleStockChange}
                showTooltip
                formatOptions={{ maximumFractionDigits: 0 }}
                tooltipValueFormatOptions={{ maximumFractionDigits: 0 }}
                className="max-w-full"
                classNames={{
                  track: "h-1",
                  filler: "h-1"
                }}
              />
            ) : (
              <div className="space-y-2">
                <div className="relative h-2 rounded-full bg-default-200">
                  <div
                    className="absolute top-0 h-2 rounded-full bg-primary"
                    style={{
                      left: `${((stockRange[0] - effectiveStockMin) / (effectiveStockMax - effectiveStockMin || 1)) * 100}%`,
                      width: `${((stockRange[1] - stockRange[0]) / (effectiveStockMax - effectiveStockMin || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={effectiveStockMin}
                    max={effectiveStockMax}
                    value={stockRange[0]}
                    onChange={(e) =>
                      onStockChange?.([Math.min(Number(e.target.value), stockRange[1] - 1), stockRange[1]])
                    }
                    className="w-full"
                    disabled={stockMin === stockMax}
                  />
                  <input
                    type="range"
                    min={effectiveStockMin}
                    max={effectiveStockMax}
                    value={stockRange[1]}
                    onChange={(e) =>
                      onStockChange?.([stockRange[0], Math.max(Number(e.target.value), stockRange[0] + 1)])
                    }
                    className="w-full"
                    disabled={stockMin === stockMax}
                  />
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  }, [isDark, filters, itemsCount, mountOptions, heightValues, widthValues, depthValues, effectiveHeightRange, effectiveWidthRange, effectiveDepthRange, products, handle, formatCurrency, formatDimensionValue, availableYears, priceRange, effectiveMin, effectiveMax, handlePriceChange, handlePriceChangeStart, handlePriceChangeEnd, isDraggingPrice, colorOptions, typeOptions, stockRange, stockMin, stockMax, effectiveStockMin, effectiveStockMax, handleStockChange, priceHistogram, maxCount, histogramBins, min, max, statPillClass, MountingFilter, onChange, onPriceChange, onStockChange]);

  const CollapsibleCard = ({ section }) => {
    const isOpen = openSections.includes(section.key);

    const handleClear = (event) => {
      // HeroUI onPress pode não passar um evento DOM padrão
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      section.onClear?.();
    };

    const handleToggle = (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleSection(section.key);
    };

    return (
      <div className={collapsibleCardClass}>
        <div className="flex w-full items-center justify-between gap-3 px-4 py-2">
          <button
            type="button"
            onClick={handleToggle}
            className="flex flex-1 items-center justify-between gap-3 text-left"
          >
            <div className="flex flex-col gap-0.5">
              <span className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>{section.title}</span>
            </div>
            <Icon
              icon="lucide:chevron-down"
              className={`text-default-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
          {section.onClear ? (
            <Button
              size="sm"
              variant="light"
              className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
              onPress={() => {
                handleClear(null);
              }}
              onClick={(e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                handleClear(e);
              }}
              isDisabled={section.isResetDisabled}
            >
              {section.clearButtonText || "Clear"}
            </Button>
          ) : null}
        </div>
        {isOpen ? (
          <div className="px-4 pb-3">
            <div className="space-y-2">{renderSectionContent(section.key)}</div>
          </div>
        ) : null}
      </div>
    );
  };

  const dynamicContainerClass = React.useMemo(() => filtersVisible
    ? containerClass
    : isDark
    ? "relative rounded-lg border border-white/10 bg-[#0b1224]/90 p-[10px] text-sm text-default-400 shadow-[0_25px_80px_rgba(8,15,36,0.55)] backdrop-blur-xl w-fit"
    : "relative rounded-lg border border-black/5 bg-gradient-to-b from-white via-white to-slate-100 p-[10px] text-sm text-default-600 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl w-fit", [filtersVisible, containerClass, isDark]);

  return (
    <aside className={className} key={`filters-${isDark ? 'dark' : 'light'}`}>
      <div className={dynamicContainerClass}>
        {filtersVisible ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className={`text-xs uppercase tracking-[0.3em] ${isDark ? "text-white" : "text-default-900"}`}>{isDark ? "FILTERS" : "Filters"}</div>
              {onToggleVisibility && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="flat"
                  radius="full"
                  onPress={onToggleVisibility}
                  aria-label="Hide filters"
                  className={`md:flex hidden items-center justify-center ${isDark ? 'bg-white/10 hover:bg-white/20 border border-primary' : 'bg-default-100 hover:bg-default-200 border border-primary'} transition-colors`}
                >
                  <Icon icon="lucide:x" className={`text-sm ${isDark ? "text-white" : "text-default-700"}`} />
                </Button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className={isDark
                ? "rounded-2xl border border-white/10 bg-content1/60 p-4 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
                : "rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)]"}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>Mounting</div>
                </div>
                {filters.mount ? (
                  <Button
                    size="sm"
                    variant="light"
                    className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
                    onPress={() => handle("mount", "")}
                  >
                    Clear
                  </Button>
                ) : null}
              </div>
              <div>{renderSectionContent("category")}</div>
            </div>

            <div className={isDark
                ? "rounded-2xl border border-white/10 bg-content1/60 p-4 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
                : "rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)]"}>
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>Price Range</div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    resetPrice();
                  }}
                  isDisabled={priceRange[0] === min && priceRange[1] === max}
                >
                  Reset
                </Button>
              </div>
              <div className="space-y-2">
                {renderSectionContent("price")}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`${statPillClass} py-1.5`}>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-default-400">Min</span>
                    <div className={`mt-0.5 text-xs font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{formatCurrency(priceRange[0])}</div>
                  </div>
                  <div className={`${statPillClass} py-1.5`}>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-default-400">Max</span>
                    <div className={`mt-0.5 text-xs font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{formatCurrency(priceRange[1])}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={isDark
                ? "rounded-2xl border border-white/10 bg-content1/60 p-4 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
                : "rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)]"}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>Stock Level</div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    resetStock();
                  }}
                  isDisabled={Array.isArray(stockRange) && stockRange.length === 2 && stockRange[0] === stockMin && stockRange[1] === stockMax}
                >
                  Reset
                </Button>
              </div>
              <div className="space-y-2">
                {renderSectionContent("stock")}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`${statPillClass} py-1.5`}>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-default-400">Min</span>
                    <div className={`mt-0.5 text-xs font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{stockRange[0]}</div>
                  </div>
                  <div className={`${statPillClass} py-1.5`}>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-default-400">Max</span>
                    <div className={`mt-0.5 text-xs font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{stockRange[1]}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className={isDark
                ? "rounded-2xl border border-white/10 bg-content1/60 p-4 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
                : "rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)]"}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>Dimensions</div>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    clearDimensions();
                  }}
                  isDisabled={!filters.dimRanges || Object.keys(filters.dimRanges).length === 0}
                >
                  Reset
                </Button>
              </div>
              <div className="space-y-2">
                {renderSectionContent("dimensions")}
              </div>
            </div>

            <div className={isDark
                ? "rounded-2xl border border-white/10 bg-content1/60 p-4 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
                : "rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)]"}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>Type</div>
            </div>
            {filters.type ? (
              <Button
                size="sm"
                variant="light"
                className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
                onPress={() => handle("type", "")}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <div>{renderSectionContent("type")}</div>
        </div>

        <div className={isDark
                ? "rounded-2xl border border-white/10 bg-content1/60 p-4 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
                : "rounded-2xl border border-black/5 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.1)]"}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-primary-400" : "text-primary-700"}`}>Color</div>
            </div>
            {selectedColorsCount ? (
              <Button
                size="sm"
                variant="light"
                className={`h-7 px-2 text-xs font-medium ${isDark ? "text-white hover:text-white/80" : "text-default-600 hover:text-default-700"}`}
                onPress={clearColors}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <div>{renderSectionContent("color")}</div>
        </div>

        <div className="space-y-3">
          {collapsibleSections.map((section) => (
            <CollapsibleCard key={section.key} section={section} />
          ))}
        </div>

              {/* Clear Filters Button */}
              {onClearAll && (
                <div className="mt-4 pt-4 border-t border-divider">
                  <Button
                    size="sm"
                    variant="flat"
                    radius="full"
                    className="w-full bg-[#e4e3e8] text-foreground/80 hover:text-foreground dark:bg-content1 shadow-sm"
                    startContent={<Icon icon="lucide:rotate-ccw" className="text-sm" />}
                    onPress={onClearAll}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}

