import React from "react";
import { Checkbox, Slider, Tooltip, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTheme } from "@heroui/use-theme";

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
  className = "",
}) {
  const handle = (key, value) => onChange?.({ ...filters, [key]: value });
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const containerClass = isDark
    ? "relative space-y-6 rounded-3xl border border-white/10 bg-[#0b1224]/90 p-6 text-sm text-default-400 shadow-[0_25px_80px_rgba(8,15,36,0.55)] backdrop-blur-xl"
    : "relative space-y-6 rounded-3xl border border-black/5 bg-gradient-to-b from-white via-white to-slate-100 p-6 text-sm text-default-600 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl";

  const heroCardClass = isDark
    ? "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    : "relative overflow-hidden rounded-2xl border border-black/5 bg-white px-5 py-6 shadow-[0_12px_40px_rgba(15,23,42,0.08)]";

  const sectionCardClass = isDark
    ? "rounded-2xl border border-white/10 bg-content1/60 p-5 shadow-[0_18px_60px_rgba(8,15,36,0.45)]"
    : "rounded-2xl border border-black/5 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.1)]";

  const statPillClass = isDark
    ? "rounded-xl border border-white/10 bg-black/40 px-3 py-2"
    : "rounded-xl border border-black/5 bg-white px-3 py-2";

  const collapsibleCardClass = isDark
    ? "rounded-2xl border border-white/10 bg-content1/60 shadow-[0_18px_60px_rgba(8,15,36,0.45)] backdrop-blur"
    : "rounded-2xl border border-black/5 bg-white/80 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur";

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
      mountPole: products.filter((p) => p.mount === "Poste").length,
      mountCrossarm: products.filter((p) => p.mount === "Transversal").length,
      mountGround: products.filter((p) => p.mount === "Chão").length,
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
    { value: "Poste", label: "Pole", countKey: "mountPole" },
    { value: "Transversal", label: "Transversal", countKey: "mountCrossarm" },
    { value: "Chão", label: "Ground", countKey: "mountGround" },
  ];

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

  const computeStock = (id) => {
    try {
      let s = 0;
      for (const ch of String(id || "")) s += ch.charCodeAt(0);
      return 5 + (s % 60);
    } catch (_) {
      return 20;
    }
  };

  const maxStock = React.useMemo(() => {
    const values = products.map((p) => (typeof p.stock === "number" ? p.stock : computeStock(p.id)));
    return values.length ? Math.max(...values) : 0;
  }, [products]);

  const minStock = typeof filters.minStock === "number" ? filters.minStock : 0;
  const resetStock = () => handle("minStock", 0);

  const dimKey = filters.dimKey || "";
  const dimLabels = {
    heightM: "Height",
    widthM: "Width",
    depthM: "Depth",
  };
  const availableDimKeys = ["heightM", "widthM", "depthM"];
  const dimValues = React.useMemo(() => {
    const vals = products
      .map((p) => p?.specs?.dimensions?.[dimKey])
      .filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!vals.length) return { min: 0, max: 0 };
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [products, dimKey]);
  const dimRange = Array.isArray(filters.dimRange) ? filters.dimRange : null;
  const effectiveDimRange = React.useMemo(() => {
    if (dimRange && dimRange.length === 2 && Number.isFinite(dimRange[0]) && Number.isFinite(dimRange[1])) {
      return dimRange;
    }
    return [dimValues.min, dimValues.max];
  }, [dimRange, dimValues.min, dimValues.max]);

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

  const getMountSummary = () => {
    if (!filters.mount) return "All mounting styles";
    const match = mountOptions.find((opt) => opt.value === filters.mount);
    return match ? match.label : "All mounting styles";
  };

  const [openSections, setOpenSections] = React.useState(() => [
    "category",
    "usage",
    "location",
    "collectionYear",
    "stock",
    "dimensions",
  ]);

  const toggleSection = (key) => {
    setOpenSections((prev) => {
      if (prev.includes(key)) {
        return prev.filter((item) => item !== key);
      }
      return [...prev, key];
    });
  };

  const typeOptions = [
    { value: "", label: "All", count: itemsCount.all },
    { value: "2D", label: "2D", count: itemsCount.type2D },
    { value: "3D", label: "3D", count: itemsCount.type3D },
  ];

  const collapsibleSections = [
    {
      key: "category",
      title: "Mounting",
      summary: getMountSummary(),
      onClear: filters.mount ? () => handle("mount", "") : null,
    },
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
    {
      key: "stock",
      title: "Stock Level",
      summary: stockSummary,
      onClear: minStock > 0 ? resetStock : null,
    },
    {
      key: "dimensions",
      title: "Dimensions",
      summary: dimensionSummary,
      onClear: dimKey ? clearDimensions : null,
    },
  ];

  const renderSectionContent = (sectionKey) => {
    switch (sectionKey) {
      case "category":
        return (
          <ul className="space-y-2">
            {mountOptions.map((opt) => {
              const isSelected = filters.mount === opt.value;
              const selectedClass = isDark
                ? "border-primary/40 bg-primary/20 text-white shadow-[0_10px_25px_rgba(59,130,246,0.35)]"
                : "border-primary/50 bg-primary/10 text-primary-600 shadow-[0_10px_25px_rgba(59,130,246,0.2)]";
              const idleClass = isDark
                ? "border-white/10 text-default-300 hover:bg-white/[0.05]"
                : "border-black/5 text-default-500 hover:bg-black/5";

              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handle("mount", isSelected ? "" : opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${isSelected ? selectedClass : idleClass}`}
                  >
                    <span className={`text-sm font-medium ${isDark ? "text-default-200" : "text-foreground"}`}>{opt.label}</span>
                    <span className="text-xs text-default-500">({itemsCount[opt.countKey]})</span>
                  </button>
                </li>
              );
            })}
          </ul>
        );
      case "stock":
        return (
          <div className="space-y-3">
            {typeof Slider !== "undefined" ? (
              <Slider
                aria-label="Minimum stock"
                minValue={0}
                maxValue={maxStock}
                step={1}
                value={minStock}
                onChange={(value) => handle("minStock", Array.isArray(value) ? value[0] : Number(value))}
                showTooltip
                isDisabled={maxStock <= 0}
                className="max-w-full"
              />
            ) : (
              <input
                type="range"
                min={0}
                max={maxStock}
                value={minStock}
                onChange={(e) => handle("minStock", Number(e.target.value))}
                className="w-full"
              />
            )}
            <div className="text-xs text-default-500">
              Showing products with{" "}
              <span className="font-semibold text-foreground dark:text-white">{minStock}+</span> items in stock
            </div>
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
                value={priceRange}
                onChange={handlePriceChange}
                isDisabled={min === max}
                showTooltip
                formatOptions={{ style: "currency", currency: "EUR" }}
                className="max-w-full"
              />
            ) : (
              <div className="space-y-2">
                <div className="relative h-2 rounded-full bg-default-200">
                  <div
                    className="absolute top-0 h-2 rounded-full bg-primary"
                    style={{
                      left: `${((priceRange[0] - min) / (max - min || 1)) * 100}%`,
                      width: `${((priceRange[1] - priceRange[0]) / (max - min || 1)) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={priceRange[0]}
                    onChange={(e) =>
                      onPriceChange?.([Math.min(Number(e.target.value), priceRange[1] - 1), priceRange[1]])
                    }
                    className="w-full"
                  />
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={priceRange[1]}
                    onChange={(e) =>
                      onPriceChange?.([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 1)])
                    }
                    className="w-full"
                  />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between text-xs font-medium text-default-500">
              <span>{formatCurrency(priceRange[0])}</span>
              <span>{formatCurrency(priceRange[1])}</span>
            </div>
          </div>
        );
      case "color":
        return (
          <div className="flex flex-wrap gap-3">
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
                        ? `ring-2 ring-offset-2 ${isDark ? "ring-offset-[#0b1224]" : "ring-offset-white"} ring-primary`
                        : isDark
                          ? "border-white/20"
                          : "border-black/10"
                    }`}
                    style={{
                      background: c.gradient || c.swatch,
                      boxShadow: c.bordered
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
                ? "border-primary/40 bg-primary/20 text-white shadow-[0_12px_30px_rgba(59,130,246,0.4)]"
                : "border-primary/60 bg-primary/10 text-primary-600 shadow-[0_12px_24px_rgba(59,130,246,0.2)]";
              const idleClass = isDark
                ? "border-white/10 text-default-300 hover:bg-white/[0.05]"
                : "border-black/5 text-default-500 hover:bg-black/5";

              return (
                <li key={year}>
                  <button
                    type="button"
                    onClick={() => handle("releaseYear", isSelected ? "" : yearStr)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isSelected ? selectedClass : idleClass}`}
                  >
                    <span className={isDark ? "text-default-200" : "text-foreground"}>{year}</span>
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      {count > 0 && <span>({count})</span>}
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
                ? "border-primary/40 bg-primary/20 text-white shadow-[0_8px_22px_rgba(59,130,246,0.4)]"
                : "border-primary/60 bg-primary/10 text-primary-600 shadow-[0_8px_18px_rgba(59,130,246,0.25)]";
              const idleClass = isDark
                ? "border-white/10 bg-white/[0.03] text-default-300 hover:border-white/20 hover:text-white"
                : "border-black/10 bg-white/70 text-default-600 hover:border-black/20 hover:text-foreground";

              return (
                <button
                  type="button"
                  key={opt.value || "all"}
                  onClick={() => handle("type", opt.value)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${isActive ? activeClass : idleClass}`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        );
      case "dimensions":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase tracking-[0.2em] text-default-500">Field</span>
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    radius="full"
                    variant="bordered"
                    endContent={<Icon icon="lucide:chevron-down" className="text-sm" />}
                  >
                    {dimKey ? dimLabels[dimKey] : "Select"}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Select dimension"
                  selectedKeys={new Set([dimKey || ""])}
                  selectionMode="single"
                  onAction={(key) => {
                    const k = String(key);
                    const next = { ...filters, dimKey: k === "" ? "" : k };
                    if (k === "") {
                      next.dimRange = null;
                    } else {
                      const vals = products
                        .map((p) => p?.specs?.dimensions?.[k])
                        .filter((v) => typeof v === "number" && Number.isFinite(v));
                      next.dimRange = vals.length ? [Math.min(...vals), Math.max(...vals)] : [0, 0];
                    }
                    onChange?.(next);
                  }}
                >
                  <DropdownItem key="">None</DropdownItem>
                  {availableDimKeys.map((k) => (
                    <DropdownItem key={k}>{dimLabels[k]}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            {dimKey ? (
              <div className="space-y-2">
                {typeof Slider !== "undefined" ? (
                  <Slider
                    aria-label={`${dimLabels[dimKey]} range`}
                    minValue={dimValues.min}
                    maxValue={dimValues.max}
                    step={0.01}
                    value={effectiveDimRange}
                    onChange={(value) => {
                      if (Array.isArray(value)) {
                        onChange?.({ ...filters, dimRange: [Math.min(...value), Math.max(...value)] });
                      }
                    }}
                    showTooltip
                    isDisabled={dimValues.min === dimValues.max}
                    formatOptions={{ style: "unit", unit: "meter", maximumFractionDigits: 2 }}
                    className="max-w-full"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={dimValues.min}
                      max={dimValues.max}
                      step={0.01}
                      value={effectiveDimRange[0]}
                      onChange={(e) =>
                        onChange?.({
                          ...filters,
                          dimRange: [Math.min(Number(e.target.value), effectiveDimRange[1] - 0.01), effectiveDimRange[1]],
                        })
                      }
                      className="w-full"
                    />
                    <input
                      type="range"
                      min={dimValues.min}
                      max={dimValues.max}
                      step={0.01}
                      value={effectiveDimRange[1]}
                      onChange={(e) =>
                        onChange?.({
                          ...filters,
                          dimRange: [effectiveDimRange[0], Math.max(Number(e.target.value), effectiveDimRange[0] + 0.01)],
                        })
                      }
                      className="w-full"
                    />
                  </div>
                )}
                <div className="text-xs text-default-500">
                  {dimLabels[dimKey]}:{" "}
                  <span className="font-semibold text-foreground dark:text-white">
                    {formatDimensionValue(effectiveDimRange[0])}m — {formatDimensionValue(effectiveDimRange[1])}m
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-default-500">Select a dimension field to filter.</div>
            )}
          </div>
        );
      case "usage":
        return (
          <div className="flex flex-col gap-2">
            <Checkbox
              isSelected={filters.usage === "Shopping"}
              onValueChange={(value) => handle("usage", value ? "Shopping" : "")}
              classNames={{
                label: "flex items-center gap-1 text-sm text-default-600 dark:text-default-300",
              }}
              size="sm"
            >
              Shopping Malls <span className="text-default-500">({itemsCount.usageShopping})</span>
            </Checkbox>
            <Checkbox
              isSelected={Boolean(filters.eco)}
              onValueChange={(value) => handle("eco", value)}
              classNames={{
                label: "flex items-center gap-1 text-sm text-default-600 dark:text-default-300",
              }}
              size="sm"
            >
              Eco <span className="text-default-500">({itemsCount.eco})</span>
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
                ? "border-primary/40 bg-primary/20 text-white shadow-[0_12px_30px_rgba(59,130,246,0.4)]"
                : "border-primary/60 bg-primary/10 text-primary-600 shadow-[0_12px_24px_rgba(59,130,246,0.2)]";
              const idleClass = isDark
                ? "border-white/10 text-default-300 hover:bg-white/[0.05]"
                : "border-black/5 text-default-500 hover:bg-black/5";

              return (
                <li key={opt.value || "all"}>
                  <button
                    type="button"
                    onClick={() => handle("location", opt.value)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${isSelected ? selectedClass : idleClass}`}
                  >
                    <span className={isDark ? "text-default-200" : "text-foreground"}>{opt.label}</span>
                    <div className="flex items-center gap-2 text-xs text-default-500">
                      <span>({opt.count})</span>
                      {isSelected && <Icon icon="lucide:check" className={`text-sm ${isDark ? "text-white" : "text-primary-400"}`} />}
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

  const CollapsibleCard = ({ section }) => {
    const isOpen = openSections.includes(section.key);

    const handleClear = (event) => {
      event.stopPropagation();
      section.onClear?.();
    };

    return (
      <div className={collapsibleCardClass}>
        <button
          type="button"
          onClick={() => toggleSection(section.key)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <div className="flex flex-col gap-1">
            <span className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{section.title}</span>
            {section.summary ? (
              <span className="text-xs text-default-500">{section.summary}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {section.onClear ? (
              <Button
                size="sm"
                variant="light"
                className={`h-7 px-2 text-xs ${isDark ? "text-default-400" : "text-default-400"}`}
                onPress={handleClear}
              >
                Clear
              </Button>
            ) : null}
            <Icon
              icon="lucide:chevron-down"
              className={`text-default-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </div>
        </button>
        {isOpen ? (
          <div className="px-4 pb-4">
            <div className="space-y-3">{renderSectionContent(section.key)}</div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <aside className={className}>
      <div className={containerClass}>
        <div className={heroCardClass}>
          <div className={`absolute -right-14 -top-14 h-32 w-32 rounded-full ${isDark ? "bg-primary/30" : "bg-primary/20"} blur-3xl`} />
          <div className="text-xs uppercase tracking-[0.3em] text-default-400">{isDark ? "FILTERS" : "Filters"}</div>
          <div className={`mt-2 text-xl font-semibold ${isDark ? "text-white" : "text-foreground"}`}>Catalog</div>
          <p className="mt-2 text-xs leading-relaxed text-default-400">
            Refine products by mounting, environment, sustainability and more.
          </p>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>Price Range</div>
              <div className="text-xs text-default-500">{priceSummary}</div>
            </div>
            <Button
              size="sm"
              variant="light"
              className="h-7 px-2 text-xs text-default-400"
              onPress={resetPrice}
              isDisabled={priceRange[0] === min && priceRange[1] === max}
            >
              Reset
            </Button>
          </div>
          <div className="mt-5 space-y-4">
            {renderSectionContent("price")}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={statPillClass}>
                <span className="text-[10px] uppercase tracking-[0.2em] text-default-400">Min</span>
                <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{formatCurrency(priceRange[0])}</div>
              </div>
              <div className={statPillClass}>
                <span className="text-[10px] uppercase tracking-[0.2em] text-default-400">Max</span>
                <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>{formatCurrency(priceRange[1])}</div>
              </div>
            </div>
          </div>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>Type</div>
              <div className="text-xs text-default-500">
                {filters.type ? `${filters.type} selected` : "All lighting types"}
              </div>
            </div>
            {filters.type ? (
              <Button
                size="sm"
                variant="light"
                className="h-7 px-2 text-xs text-default-400"
                onPress={() => handle("type", "")}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <div className="mt-4">{renderSectionContent("type")}</div>
        </div>

        <div className={sectionCardClass}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-sm font-semibold ${isDark ? "text-white" : "text-foreground"}`}>Color</div>
              <div className="text-xs text-default-500">{colorSummary}</div>
            </div>
            {selectedColorsCount ? (
              <Button
                size="sm"
                variant="light"
                className="h-7 px-2 text-xs text-default-400"
                onPress={clearColors}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <div className="mt-4">{renderSectionContent("color")}</div>
        </div>

        <div className="space-y-4">
          {collapsibleSections.map((section) => (
            <CollapsibleCard key={section.key} section={section} />
          ))}
        </div>
      </div>
    </aside>
  );
}

