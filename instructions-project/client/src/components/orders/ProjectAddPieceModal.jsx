import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Spinner } from "@heroui/react";
import { useShop } from "../../context/ShopContext";
import ProductGrid from "../shop/ProductGrid";
import { useTranslation } from 'react-i18next';

export default function ProjectAddPieceModal({ isOpen, onOpenChange, project, onAddItem }) {
  const { t } = useTranslation();
  const { products, addToProject, totalsByProject, productsLoading } = useShop();
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) { setQuery(""); setError(""); }
  }, [isOpen]);

  const filtered = React.useMemo(() => {
    if (!query) return products;
    return products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [products, query]);

  const handleAddProduct = async (product, variant, qty) => {
    setError("");
    const q = Number(qty) || 1;
    
    // Se tiver callback customizado (novo sistema com API)
    if (onAddItem) {
      try {
        setAdding(true);
        const success = await onAddItem(product, variant, q);
        if (success) {
          // Fechar modal após adicionar com sucesso
          onOpenChange(false);
        }
      } catch (err) {
        setError(t('pages.projectDetails.orders.errorAddingItem', 'Erro ao adicionar item'));
      } finally {
        setAdding(false);
      }
      return;
    }
    
    // Sistema antigo usando ShopContext (fallback)
    const current = totalsByProject[project.id]?.total || 0;
    const budget = Number(project?.budget) || 0;
    const next = current + (Number(product?.price) || 0) * q;
    if (Number.isFinite(budget) && budget > 0 && next > budget) {
      setError(t('pages.projectDetails.orders.insufficientBudget', 'Budget insuficiente para adicionar este produto'));
      return;
    }
    addToProject(project.id, product.id, variant, q);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="5xl" placement="center" scrollBehavior="inside" hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex items-center justify-between">
              <div>{t('pages.projectDetails.orders.addItemTo', 'Adicionar item a')} {project?.name}</div>
              <div className="w-64">
                <Input 
                  size="sm" 
                  placeholder={t('pages.projectDetails.orders.searchProduct', 'Pesquisar produto')}
                  aria-label={t('pages.projectDetails.orders.searchProduct', 'Pesquisar produto')}
                  value={query} 
                  onChange={(e)=>setQuery(e.target.value)} 
                />
              </div>
            </ModalHeader>
            <ModalBody>
              {error && (
                <div className="mb-2 text-danger-400 text-sm">{error}</div>
              )}
              {productsLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Spinner size="lg" label={t('common.loading')} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-default-500">
                  {t('pages.projectDetails.orders.noProducts', 'Nenhum produto encontrado')}
                </div>
              ) : (
                <ProductGrid
                  products={filtered}
                  cols={3}
                  allowQty
                  onOrder={handleAddProduct}
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                onPress={close}
                isDisabled={adding}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
              >
                {t('common.close', 'Fechar')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


