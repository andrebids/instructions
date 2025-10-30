import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { useShop } from "../../context/ShopContext";
import ProductGrid from "../shop/ProductGrid";

export default function ProjectAddPieceModal({ isOpen, onOpenChange, project }) {
  const { products, addToProject, totalsByProject } = useShop();
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (isOpen) { setQuery(""); setError(""); }
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" placement="center" scrollBehavior="inside">
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div>Adicionar peça a {project?.name}</div>
              <div className="w-64"><Input size="sm" placeholder="Pesquisar produto" aria-label="Pesquisar produto" value={query} onChange={(e)=>setQuery(e.target.value)} /></div>
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="mb-2 text-danger-400 text-sm">{error}</div>
              )}
              <ProductGrid
                products={filtered}
                cols={3}
                allowQty
                onOrder={(product, variant, qty) => {
                  const current = totalsByProject[project.id]?.total || 0;
                  const budget = Number(project?.budget) || 0;
                  const q = Number(qty) || 1;
                  const next = current + (Number(product?.price) || 0) * q;
                  if (Number.isFinite(budget) && next > budget) {
                    setError("Sem orçamento suficiente para adicionar este produto.");
                    return;
                  }
                  addToProject(project.id, product.id, variant, q);
                }}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={close}>Fechar</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


