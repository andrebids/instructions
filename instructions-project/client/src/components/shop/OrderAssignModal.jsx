import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Autocomplete, AutocompleteItem, Spinner, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from 'react-i18next';
import { projectsAPI, ordersAPI } from "../../services/api";

export default function OrderAssignModal({ isOpen, onOpenChange, product, variant }) {
  const { t } = useTranslation();
  const [projects, setProjects] = React.useState([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [projectId, setProjectId] = React.useState("");
  const [projectSearch, setProjectSearch] = React.useState("");
  const [qty, setQty] = React.useState(1);
  const [qtyError, setQtyError] = React.useState("");
  const [projectError, setProjectError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);
  const [orderInfo, setOrderInfo] = React.useState(null); // { total, budget }

  // Carregar projetos da API
  const loadProjects = React.useCallback(async () => {
    try {
      setLoadingProjects(true);
      const data = await projectsAPI.getAll();
      setProjects(data || []);
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  // Carregar info da order do projeto selecionado
  const loadOrderInfo = React.useCallback(async (projId) => {
    if (!projId) {
      setOrderInfo(null);
      return;
    }
    try {
      const order = await ordersAPI.getOrCreateDraft(projId);
      const project = projects.find(p => p.id === projId);
      setOrderInfo({
        total: parseFloat(order.total) || 0,
        budget: parseFloat(project?.budget) || 0,
        orderId: order.id,
      });
    } catch (err) {
      console.error('Erro ao carregar order:', err);
      setOrderInfo(null);
    }
  }, [projects]);

  React.useEffect(() => {
    if (isOpen) {
      setProjectId("");
      setProjectSearch("");
      setQty(1);
      setQtyError("");
      setProjectError("");
      setSubmitSuccess(false);
      setOrderInfo(null);
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  // Quando projeto é selecionado, carregar info da order
  React.useEffect(() => {
    if (projectId) {
      loadOrderInfo(projectId);
    }
  }, [projectId, loadOrderInfo]);

  const currentTotal = orderInfo?.total || 0;
  const itemTotal = (product?.price || 0) * (qty || 0);
  const nextTotal = currentTotal + itemTotal;
  const project = projects.find((p) => p.id === projectId);
  const budget = orderInfo?.budget || parseFloat(project?.budget) || 0;
  const stock = product?.stock || 0;

  const handleQtyChange = (value) => {
    if (value === "") {
      setQty("");
      setQtyError("");
      return;
    }

    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      setQty("");
      setQtyError("");
      return;
    }

    if (numeric < 1) {
      setQty(1);
      setQtyError(t('shop.orderAssign.qtyMinError', 'A quantidade não pode ser negativa ou zero.'));
      return;
    }

    if (stock > 0 && numeric > stock) {
      setQty(stock);
      setQtyError(t('shop.orderAssign.qtyStockError', { stock }, `A quantidade não pode exceder o stock (${stock}).`));
      return;
    }

    setQty(numeric);
    setQtyError("");
  };

  const handleProjectSelection = (key) => {
    if (!key) {
      setProjectId("");
      setProjectError(t('shop.orderAssign.selectProjectFirst', 'Selecione um projeto primeiro.'));
      return;
    }
    const id = typeof key === 'string' ? key : String(key);
    setProjectId(id);
    const selected = projects.find((p) => p.id === id);
    if (selected) setProjectSearch(selected.name);
    setProjectError("");
  };

  const handleSubmit = async (close) => {
    if (!projectId) {
      setProjectError(t('shop.orderAssign.selectProjectFirst', 'Selecione um projeto primeiro.'));
      return;
    }

    try {
      setIsSubmitting(true);

      // Obter ou criar order draft
      const order = await ordersAPI.getOrCreateDraft(projectId);

      // Adicionar item à order
      await ordersAPI.addItem(order.id, {
        productId: product.id,
        quantity: qty,
        variant: variant || {},
      });

      setSubmitSuccess(true);

      // Fechar modal após 1 segundo de sucesso
      setTimeout(() => {
        close();
      }, 1000);
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      setProjectError(t('shop.orderAssign.addError', 'Erro ao adicionar item à encomenda.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOverBudget = budget > 0 && nextTotal > budget;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" placement="center" scrollBehavior="outside" hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:shopping-cart" className="text-primary" />
                {t('shop.orderAssign.title', 'Adicionar ao Projeto')}
              </div>
            </ModalHeader>
            <ModalBody>
              {submitSuccess ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                    <Icon icon="lucide:check" className="text-3xl text-success" />
                  </div>
                  <p className="text-lg font-medium text-success">
                    {t('shop.orderAssign.success', 'Item adicionado com sucesso!')}
                  </p>
                  <p className="text-sm text-default-500 mt-1">
                    {t('shop.orderAssign.viewInOrders', 'Pode ver na aba de Encomendas do projeto.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Produto selecionado */}
                  <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg border border-default-200">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-default-100">
                      {product?.images?.day || product?.thumbnailUrl ? (
                        <img
                          src={product.images?.day || product.thumbnailUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon icon="lucide:package" className="text-default-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{product?.name}</p>
                      <p className="text-sm text-primary font-semibold">€{product?.price?.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Seleção de projeto */}
                  <div>
                    <div className="text-sm text-default-500 mb-1">
                      {t('shop.orderAssign.project', 'Projeto')}
                    </div>
                    {loadingProjects ? (
                      <div className="flex items-center gap-2 py-2">
                        <Spinner size="sm" />
                        <span className="text-sm text-default-500">{t('common.loading')}</span>
                      </div>
                    ) : (
                      <Autocomplete
                        selectedKey={projectId || null}
                        inputValue={projectSearch}
                        onSelectionChange={handleProjectSelection}
                        onInputChange={setProjectSearch}
                        defaultItems={projects}
                        placeholder={t('shop.orderAssign.searchProject', 'Pesquisar projeto...')}
                        menuTrigger="input"
                        selectionMode="single"
                        allowsCustomValue={false}
                        isInvalid={!!projectError}
                        errorMessage={projectError}
                        isDisabled={isSubmitting}
                      >
                        {(p) => (
                          <AutocompleteItem key={p.id} textValue={p.name}>
                            <div className="flex items-center justify-between">
                              <span>{p.name}</span>
                              <span className="text-xs text-default-400">{p.clientName}</span>
                            </div>
                          </AutocompleteItem>
                        )}
                      </Autocomplete>
                    )}
                  </div>

                  {/* Quantidade */}
                  <div>
                    <div className="text-sm text-default-500 mb-1">
                      {t('shop.orderAssign.quantity', 'Quantidade')}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={String(qty)}
                      onChange={(e) => handleQtyChange(e.target.value)}
                      className="max-w-[160px]"
                      isInvalid={!!qtyError}
                      errorMessage={qtyError}
                      isDisabled={isSubmitting}
                    />
                    {stock === 0 && (
                      <div className="mt-1 text-danger-400 text-xs">
                        {t('shop.orderAssign.outOfStock', 'Sem stock.')}
                      </div>
                    )}
                  </div>

                  {/* Resumo do budget */}
                  {projectId && (
                    <div className="bg-content2 rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-default-500">{t('shop.orderAssign.budget', 'Budget')}:</span>
                        <Chip size="sm" variant="flat">€{budget.toLocaleString()}</Chip>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-default-500">{t('shop.orderAssign.currentTotal', 'Total atual')}:</span>
                        <Chip size="sm" variant="flat">€{currentTotal.toLocaleString()}</Chip>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-default-500">{t('shop.orderAssign.itemTotal', 'Este item')}:</span>
                        <Chip size="sm" variant="flat" color="primary">+€{itemTotal.toLocaleString()}</Chip>
                      </div>
                      <div className="border-t border-divider pt-2">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span>{t('shop.orderAssign.afterAddition', 'Após adição')}:</span>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={isOverBudget ? 'danger' : 'success'}
                          >
                            €{nextTotal.toLocaleString()}
                          </Chip>
                        </div>
                        {isOverBudget && (
                          <p className="text-xs text-danger mt-1">
                            {t('shop.orderAssign.overBudgetWarning', 'Atenção: O total excederá o budget do projeto.')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              {!submitSuccess && (
                <>
                  <Button
                    variant="flat"
                    onPress={close}
                    isDisabled={isSubmitting}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    color="primary"
                    isDisabled={!projectId || qty < 1 || (stock > 0 && qty > stock) || stock === 0 || isSubmitting}
                    isLoading={isSubmitting}
                    onPress={() => handleSubmit(close)}
                  >
                    {t('shop.orderAssign.confirm', 'Confirmar')}
                  </Button>
                </>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
