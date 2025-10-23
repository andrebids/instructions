import React from "react";
import { useParams } from "react-router-dom";
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { useShop } from "../context/ShopContext";
import ShopFilters from "../components/shop/ShopFilters";
import ProductGrid from "../components/shop/ProductGrid";
import OrderAssignModal from "../components/shop/OrderAssignModal";
import { PageTitle } from "../components/page-title";

export default function ShopCategory() {
  const { category } = useParams();
  const { products } = useShop();
  const [filters, setFilters] = React.useState({ type: "", usage: "", location: "", color: [], mount: "" });
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [selected, setSelected] = React.useState({ product: null, variant: null });
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [draftFilters, setDraftFilters] = React.useState(filters);

  const filtered = React.useMemo(() => {
    return products.filter((p) => {
      if (!p.tags?.includes(category)) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.usage && p.usage !== filters.usage) return false;
      if (filters.location && p.location !== filters.location) return false;
      if (filters.mount && p.mount !== filters.mount) return false;
      if (filters.color && Array.isArray(filters.color) && filters.color.length > 0) {
        const hasAny = filters.color.some((c) => Boolean(p.images?.colors?.[c]));
        if (!hasAny) return false;
      }
      return true;
    });
  }, [products, category, filters]);

  return (
    <div className="flex-1 min-h-0 overflow-auto p-6">
      <PageTitle title="Shop" userName="Christopher" subtitle="Explore products by category." />
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mt-2">{category?.charAt(0).toUpperCase() + category?.slice(1)}</h1>
        </div>
        <div>
          <Button size="sm" variant="flat" onPress={() => { setDraftFilters(filters); setFiltersOpen(true); }}>Filtros</Button>
        </div>
      </div>

      {/* Modal de filtros */}
      <Modal isOpen={filtersOpen} onOpenChange={setFiltersOpen} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Filtros</ModalHeader>
              <ModalBody>
                <ShopFilters filters={draftFilters} onChange={setDraftFilters} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setDraftFilters({ type: "", usage: "", location: "", color: [], mount: "" })}>Limpar</Button>
                <Button color="primary" onPress={() => { setFilters(draftFilters); onClose(); }}>Aplicar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <ProductGrid
        products={filtered}
        onOrder={(product, variant) => { setSelected({ product, variant }); setAssignOpen(true); }}
      />

      <OrderAssignModal
        isOpen={assignOpen}
        onOpenChange={setAssignOpen}
        product={selected.product}
        variant={selected.variant}
      />
    </div>
  );
}


