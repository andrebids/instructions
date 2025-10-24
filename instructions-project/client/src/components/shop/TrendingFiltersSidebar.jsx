import React from "react";
import { Accordion, AccordionItem, Button, Checkbox, Chip, Slider, Tooltip } from "@heroui/react";
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

  const itemsCount = React.useMemo(() => ({
    all: products.length,
    type2D: products.filter((p) => p.type === "2D").length,
    type3D: products.filter((p) => p.type === "3D").length,
    indoor: products.filter((p) => p.location === "Interior").length,
    outdoor: products.filter((p) => p.location === "Exterior").length,
    usageShopping: products.filter((p) => p.usage === "Shopping").length,
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
    { value: "Transversal", label: "Crossarm", countKey: "mountCrossarm" },
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

  return (
    <aside className={`space-y-6 ${className}`}>
      <Accordion variant="splitted" defaultExpandedKeys={["type", "location", "price", "color", "mount", "usage"]} selectionMode="multiple">
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

        {/* Usage */}
        <AccordionItem key="usage" aria-label="Usage" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Usage</span></div>}>
          <div className="space-y-2">
            <Checkbox isSelected={filters.usage === "Shopping"} onValueChange={(v) => handle("usage", v ? "Shopping" : "")}>Shopping Malls <span className="text-default-500">({itemsCount.usageShopping})</span></Checkbox>
          </div>
        </AccordionItem>

        {/* Location */}
        <AccordionItem key="location" aria-label="Location" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Location</span></div>}>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input type="radio" name="location" className="accent-current" checked={filters.location === ""} onChange={() => handle("location", "")} />
              <span>All <span className="text-default-500">({itemsCount.indoor + itemsCount.outdoor})</span></span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="location" className="accent-current" checked={filters.location === "Interior"} onChange={() => handle("location", "Interior")} />
              <span>Indoor <span className="text-default-500">({itemsCount.indoor})</span></span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="location" className="accent-current" checked={filters.location === "Exterior"} onChange={() => handle("location", "Exterior")} />
              <span>Outdoor <span className="text-default-500">({itemsCount.outdoor})</span></span>
            </label>
          </div>
        </AccordionItem>

        {/* Price */}
        <AccordionItem key="price" aria-label="Price" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Price</span></div>}>
          <div className="space-y-3">
            <button type="button" onClick={resetPrice} className="text-xs text-primary hover:underline">Reset</button>
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
              const isActive = Array.isArray(filters.color) && filters.color.includes(c.key);
              return (
                <Tooltip key={c.key} content={`${c.label}${itemsCount[c.countKey] ? ` (${itemsCount[c.countKey]})` : ""}`}>
                  <button
                    type="button"
                    aria-label={c.label}
                    onClick={() => {
                      const current = Array.isArray(filters.color) ? filters.color : [];
                      const next = isActive ? current.filter((x) => x !== c.key) : [...current, c.key];
                      handle("color", next);
                    }}
                    className={`w-8 h-8 rounded-full border ${isActive ? "ring-2 ring-primary" : "border-default-200"}`}
                    style={{ background: c.gradient || c.swatch, boxShadow: c.bordered ? "inset 0 0 0 1px rgba(0,0,0,0.1)" : undefined }}
                  />
                </Tooltip>
              );
            })}
          </div>
        </AccordionItem>

        {/* Mount */}
        <AccordionItem key="mount" aria-label="Mount" title={<div className="flex items-center justify-between w-full"><span className="font-semibold">Mount</span></div>}>
          <div className="flex flex-wrap gap-2">
            {mountOptions.map((opt) => (
              <Chip
                key={opt.value}
                variant={filters.mount === opt.value ? "solid" : "bordered"}
                color={filters.mount === opt.value ? "primary" : "default"}
                className="cursor-pointer"
                onClick={() => handle("mount", filters.mount === opt.value ? "" : opt.value)}
              >
                {opt.label} <span className="ml-1 text-default-500">({itemsCount[opt.countKey]})</span>
              </Chip>
            ))}
          </div>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}


