import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useShop } from "../../context/ShopContext";

export default function CompareSuggestModal({ isOpen, onOpenChange, baseProduct, onAdd }) {
  const { products, compare, toggleCompare } = useShop();
  const [query, setQuery] = React.useState("");

  const pool = React.useMemo(() => {
    return products.filter(p => p.id !== baseProduct?.id);
  }, [products, baseProduct]);

  const suggestions = React.useMemo(() => {
    if (!pool.length) return [];
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [pool, isOpen]);

  const results = React.useMemo(() => {
    if (!query) return suggestions;
    const q = query.toLowerCase();
    return pool.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query, pool, suggestions]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="center" scrollBehavior="outside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div className="text-lg font-semibold">Suggested items to compare</div>
              <div className="text-sm text-default-500">Base: {baseProduct?.name}</div>
            </ModalHeader>
            <ModalBody>
              <Input
                placeholder="Search products..."
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
              />
              {/* Currently in compare */}
              {compare?.length > 0 && (
                <div className="mt-2 text-xs">
                  <div className="text-default-500 mb-1">Currently in compare:</div>
                  <div className="flex flex-wrap gap-2">
                    {products.filter(p=>compare.includes(p.id)).map(p => (
                      <div key={p.id} className="px-2 py-1 rounded-lg bg-content2 border border-divider flex items-center gap-2">
                        <span className="truncate max-w-[160px]" title={p.name}>{p.name}</span>
                        <Button size="sm" isIconOnly variant="light" onPress={()=>toggleCompare(p.id)} aria-label="Remove">
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {results.map(p => {
                  const already = compare?.includes(p.id);
                  return (
                    <div key={p.id} className="p-3 rounded-xl border border-divider bg-content1/60">
                      <div className="font-medium truncate" title={p.name}>{p.name}</div>
                      <div className="text-primary text-sm">€{p.price}</div>
                      <div className="mt-2 flex justify-end">
                        <Button size="sm" color={already ? "danger" : "primary"} variant={already ? "bordered" : "solid"}
                          onPress={()=>{ already ? toggleCompare(p.id) : (onAdd ? onAdd(p) : toggleCompare(p.id)); }}>
                          {already ? "Remove" : "Add to compare"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {results.length === 0 && (
                  <div className="text-sm text-default-500">No results.</div>
                )}
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close}>Close</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


