import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useShop } from "../../context/ShopContext";
import { Icon } from "@iconify/react";
import ProductMediaViewer from "./ProductMediaViewer";
import { ComponentsField } from "./Components/ComponentsField";
import { PrintFields } from "./Components/PrintFields";
import { WeightField } from "./Components/WeightField";
import { EffectsField } from "./Components/EffectsField";
import { AnimatedSparklesField } from "./Components/AnimatedSparklesField";
import { AluminiumField } from "./Components/AluminiumField";
import { BioprintField } from "./Components/BioprintField";

export default function CompareSuggestModal({ isOpen, onOpenChange, baseProduct, onAdd }) {
  const { products, compare, toggleCompare, getAvailableStock } = useShop();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState(null);
  const [baseOverride, setBaseOverride] = React.useState(null);
  const [changingBase, setChangingBase] = React.useState(false);

  const activeBase = baseOverride || baseProduct;

  const pool = React.useMemo(() => {
    return products.filter(p => p.id !== activeBase?.id);
  }, [products, activeBase]);

  const suggestions = React.useMemo(() => {
    if (!pool.length) return [];
    const baseName = activeBase?.name || '';
    const getPrefix = (name) => {
      if (!name) return '';
      const m = String(name).match(/^[A-Za-z]+/);
      return (m?.[0] || '').toUpperCase();
    };
    const basePrefix = getPrefix(baseName);
    const baseStock = activeBase ? getAvailableStock(activeBase) : 0;

    const scored = pool.map((p) => {
      const prefix = getPrefix(p.name);
      const prefixMismatch = basePrefix ? (prefix === basePrefix ? 0 : 1) : 0;
      const deltaStock = Math.abs(getAvailableStock(p) - baseStock);
      return { p, prefixMismatch, deltaStock };
    });

    // Primary pass: prefer same-prefix and close stock
    const threshold = Math.max(10, Math.round(baseStock * 0.5));
    let primary = scored
      .filter((s) => s.prefixMismatch === 0 && s.deltaStock <= threshold)
      .sort((a, b) => a.deltaStock - b.deltaStock)
      .map((s) => s.p);

    // If not enough, relax: keep same prefix but any stock
    if (primary.length < 3) {
      const restSamePrefix = scored
        .filter((s) => s.prefixMismatch === 0 && !primary.includes(s.p))
        .sort((a, b) => a.deltaStock - b.deltaStock)
        .map((s) => s.p);
      primary = primary.concat(restSamePrefix);
    }

    // If still not enough, fill with closest stock regardless of prefix
    if (primary.length < 3) {
      const rest = scored
        .filter((s) => !primary.includes(s.p))
        .sort((a, b) => (a.prefixMismatch - b.prefixMismatch) || (a.deltaStock - b.deltaStock))
        .map((s) => s.p);
      primary = primary.concat(rest);
    }

    return primary.slice(0, 3);
  }, [pool, isOpen, activeBase, getAvailableStock]);

  const results = React.useMemo(() => {
    if (!query) return suggestions;
    const q = query.toLowerCase();
    return pool.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, pool, suggestions]);

  const formatDimensions = (specs, product) => {
    // Prioridade: campos height/width/depth/diameter do produto (vindos do AdminProducts)
    const parts = [];
    if (product?.height != null) parts.push(`${Number(product.height).toFixed(2)} m (H)`);
    if (product?.width != null) parts.push(`${Number(product.width).toFixed(2)} m (W)`);
    if (product?.depth != null) parts.push(`${Number(product.depth).toFixed(2)} m (D)`);
    if (product?.diameter != null) parts.push(`${Number(product.diameter).toFixed(2)} m (Ø)`);
    if (parts.length > 0) return parts.join(' x ');
    
    // Fallback: specs.dimensions (formato antigo)
    const dim = specs?.dimensions;
    if (dim && (dim.widthM != null || dim.heightM != null || dim.depthM != null)) {
      const parts2 = [];
      if (dim.heightM != null) parts2.push(`${Number(dim.heightM).toFixed(2)} m (H)`);
      if (dim.widthM != null) parts2.push(`${Number(dim.widthM).toFixed(2)} m (W)`);
      if (dim.depthM != null) parts2.push(`${Number(dim.depthM).toFixed(2)} m (D)`);
      return parts2.join(' x ');
    }
    
    // Fallback: specs.dimensoes (texto)
    const s = specs?.dimensoes || specs?.dimensionsText;
    if (typeof s === 'string') {
      const regex = /([0-9]+(?:[\.,][0-9]+)?)\s*m/gi;
      const nums = [];
      let m;
      while ((m = regex.exec(s)) && nums.length < 3) {
        nums.push(parseFloat(String(m[1]).replace(',', '.')));
      }
      if (nums.length >= 2) {
        const [w, h, d] = nums;
        const parts3 = [];
        if (!Number.isNaN(h)) parts3.push(`${h.toFixed(2)} m (H)`);
        if (!Number.isNaN(w)) parts3.push(`${w.toFixed(2)} m (W)`);
        if (!Number.isNaN(d)) parts3.push(`${d.toFixed(2)} m (D)`);
        return parts3.join(' x ');
      }
      return s;
    }
    return '-';
  };

  const handleModalOpenChange = React.useCallback((open) => {
    if (!open) {
      // Remove base and selected from compare if present
      const baseId = (baseOverride || baseProduct)?.id;
      const selectedId = selected?.id;
      if (baseId && compare?.includes(baseId)) toggleCompare(baseId);
      if (selectedId && compare?.includes(selectedId)) toggleCompare(selectedId);
    }
    if (typeof onOpenChange === 'function') onOpenChange(open);
  }, [baseProduct, baseOverride, selected, compare, toggleCompare, onOpenChange]);

  React.useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setQuery("");
      setBaseOverride(null);
      setChangingBase(false);
    }
  }, [isOpen, baseProduct]);

  const handleSelectProduct = (p) => {
    if (changingBase) {
      // If new base equals current selected, clear selection to avoid duplicates
      if (selected?.id === p?.id) {
        if (compare?.includes(p.id)) toggleCompare(p.id);
        setSelected(null);
      }
      // add new base to compare (so it can be removed on close)
      if (p?.id && !compare?.includes(p.id)) toggleCompare(p.id);
      setBaseOverride(p);
      setChangingBase(false);
      return;
    }
    setSelected(p);
    if (onAdd) onAdd(p); else toggleCompare(p.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={handleModalOpenChange}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      hideCloseButton
      classNames={{
        base: "max-w-[1400px] w-[96vw] max-h-[92vh] my-4 bg-default-100 dark:bg-content1",
        body: "py-4 overflow-y-auto"
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="text-lg font-semibold">Suggested items to compare</div>
              <div className="text-sm text-default-500">Base: {activeBase?.name}</div>
            </ModalHeader>
            <ModalBody>
              {/* Layout: left viewer of base, right suggestions or second viewer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1">
                  <div className="mb-2 flex items-center justify-between h-8">
                    <div className="text-sm text-default-500">{changingBase ? 'Pick base product' : 'Base product'}</div>
                    {!changingBase && (
                      <Button
                        size="sm"
                        color="primary"
                        variant="bordered"
                        className="font-medium border-2"
                        onPress={() => {
                          // remove current base from compare when starting change
                          if (activeBase?.id && compare?.includes(activeBase.id)) toggleCompare(activeBase.id);
                          setChangingBase(true);
                          setQuery("");
                        }}
                        startContent={<Icon icon="lucide:refresh-ccw" />}
                      >
                        Change
                      </Button>
                    )}
                  </div>
                  {changingBase ? (
                    <>
                      <Input
                        placeholder="Search products..."
                        value={query}
                        onChange={(e)=>setQuery(e.target.value)}
                        className="mb-2"
                      />
                      <div className="grid grid-cols-1 gap-3 mt-2">
                        {results.map(p => (
                          <div key={p.id} className="p-3 rounded-xl border border-divider bg-content1/60">
                            <div className="font-medium truncate" title={p.name}>{p.name}</div>
                            <div className="text-primary text-sm">€{p.price}</div>
                            <div className="mt-2 flex justify-end gap-2">
                              <Button size="sm" color="primary" isDisabled={selected?.id === p.id} onPress={() => handleSelectProduct(p)}>Set as base</Button>
                            </div>
                          </div>
                        ))}
                        {results.length === 0 && (
                          <div className="text-sm text-default-500">No results.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {activeBase && (
                        <div className="relative rounded-2xl border border-divider bg-content2 p-3 shadow-sm">
                          <ProductMediaViewer product={activeBase} className="w-full" />
                        </div>
                      )}
                      <div className="mt-2 text-center text-sm font-medium truncate" title={activeBase?.name}>{activeBase?.name}</div>
                      <div className="text-center text-primary">€{activeBase?.price}</div>
                      <div className="mt-3 text-sm text-default-700 grid grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:ruler" className="text-default-500 text-sm mt-0.5" />
                          <div>
                            <div className="text-default-500">Dimensions</div>
                            <div className="leading-6 text-foreground/90 break-words">{formatDimensions(activeBase?.specs, activeBase)}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:layers" className="text-default-500 text-sm mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-default-500 mb-2">Materials</div>
                            <div className="space-y-2">
                              <ComponentsField materials={activeBase?.specs?.materiais} size="xs" />
                              <PrintFields printType={activeBase?.specs?.printType} printColor={activeBase?.specs?.printColor} size="xs" />
                              <AluminiumField aluminium={activeBase?.specs?.aluminium} size="xs" />
                              <BioprintField bioprint={activeBase?.specs?.bioprint} size="xs" />
                              <WeightField weight={activeBase?.specs?.weight} size="xs" />
                              <EffectsField effects={activeBase?.specs?.effects} size="xs" />
                              <AnimatedSparklesField sparkles={activeBase?.specs?.sparkles} size="xs" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:file-text" className="text-default-500 text-sm mt-0.5" />
                          <div>
                            <div className="text-default-500">Description</div>
                            <div className="leading-6 text-foreground/90 break-words">{activeBase?.specs?.descricao || '-'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:cpu" className="text-default-500 text-sm mt-0.5" />
                          <div>
                            <div className="text-default-500">Technical</div>
                            <div className="leading-6 text-foreground/90 break-words">{activeBase?.specs?.tecnicas || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="md:col-span-1">
                  {!selected ? (
                    <>
                      <div className="mb-2 flex items-center justify-between h-8">
                        <div className="text-sm text-default-500">Pick second product</div>
                      </div>
                      <Input
                        placeholder="Search products..."
                        value={query}
                        onChange={(e)=>setQuery(e.target.value)}
                        className="mb-2"
                      />
                      
                      <div className="grid grid-cols-1 gap-3 mt-2">
                        {results.map(p => {
                          const already = compare?.includes(p.id);
                          return (
                            <div key={p.id} className="p-3 rounded-xl border border-divider bg-content1/60">
                              <div className="font-medium truncate" title={p.name}>{p.name}</div>
                              <div className="text-primary text-sm">€{p.price}</div>
                              <div className="mt-2 flex justify-end gap-2">
                                <Button size="sm" color="primary" onPress={() => handleSelectProduct(p)}>
                                  Add to compare
                                </Button>
                                {already && (
                                  <Button size="sm" color="danger" variant="bordered" onPress={()=>toggleCompare(p.id)}>Remove</Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {results.length === 0 && (
                          <div className="text-sm text-default-500">No results.</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between h-8">
                        <div className="text-sm text-default-500">Second product</div>
                        <Button
                          size="sm"
                          color="primary"
                          variant="bordered"
                          className="font-medium border-2"
                          onPress={() => { if (selected?.id && compare?.includes(selected.id)) toggleCompare(selected.id); setSelected(null); }}
                          startContent={<Icon icon="lucide:refresh-ccw" />}
                        >
                          Change
                        </Button>
                      </div>
                      <div className="relative rounded-2xl border border-divider bg-content2 p-3 shadow-sm">
                        <ProductMediaViewer product={selected} className="w-full" />
                      </div>
                      <div className="mt-2 text-center text-sm font-medium truncate" title={selected?.name}>{selected?.name}</div>
                      <div className="text-center text-primary">€{selected?.price}</div>
                      <div className="mt-3 text-sm text-default-700 grid grid-cols-2 gap-x-8 gap-y-3">
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:ruler" className="text-default-500 text-sm mt-0.5" />
                          <div>
                            <div className="text-default-500">Dimensions</div>
                            <div className="leading-6 text-foreground/90 break-words">{formatDimensions(selected?.specs, selected)}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:layers" className="text-default-500 text-sm mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="text-default-500 mb-2">Materials</div>
                            <div className="space-y-2">
                              <ComponentsField materials={selected?.specs?.materiais} size="xs" />
                              <PrintFields printType={selected?.specs?.printType} printColor={selected?.specs?.printColor} size="xs" />
                              <AluminiumField aluminium={selected?.specs?.aluminium} size="xs" />
                              <BioprintField bioprint={selected?.specs?.bioprint} size="xs" />
                              <WeightField weight={selected?.specs?.weight} size="xs" />
                              <EffectsField effects={selected?.specs?.effects} size="xs" />
                              <AnimatedSparklesField sparkles={selected?.specs?.sparkles} size="xs" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:file-text" className="text-default-500 text-sm mt-0.5" />
                          <div>
                            <div className="text-default-500">Description</div>
                            <div className="leading-6 text-foreground/90 break-words">{selected?.specs?.descricao || '-'}</div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 col-span-2 md:col-span-1 py-0.5">
                          <Icon icon="lucide:cpu" className="text-default-500 text-sm mt-0.5" />
                          <div>
                            <div className="text-default-500">Technical</div>
                            <div className="leading-6 text-foreground/90 break-words">{selected?.specs?.tecnicas || '-'}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                onPress={close}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


