import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Progress,
  Spinner,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Tooltip,
  Input,
  Divider,
  Tabs,
  Tab,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { ordersAPI } from '../../services/api';
import ProjectAddPieceModal from './ProjectAddPieceModal';

// Mapeamento de cores por status
const statusConfig = {
  draft: { color: 'default', icon: 'lucide:file-edit', label: 'draft' },
  to_order: { color: 'warning', icon: 'lucide:shopping-cart', label: 'toOrder' },
  ordered: { color: 'primary', icon: 'lucide:package', label: 'ordered' },
  delivered: { color: 'success', icon: 'lucide:check-circle', label: 'delivered' },
  cancelled: { color: 'danger', icon: 'lucide:x-circle', label: 'cancelled' },
};

export default function ProjectOrdersTab({ projectId, budget = 0, canvasDecorations = [] }) {
  const { t } = useTranslation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const hasSyncedRef = useRef(false);

  // Sincronizar decorações do canvas com a order (apenas uma vez)
  const syncCanvasDecorations = useCallback(async () => {
    if (!projectId || canvasDecorations.length === 0 || hasSyncedRef.current) {
      return;
    }

    try {
      setSyncing(true);
      console.log('🔄 Sincronizando', canvasDecorations.length, 'decorações do canvas...');
      
      // Preparar decorações para sincronização
      const decorationsToSync = canvasDecorations.map(dec => ({
        decorationId: dec.decorationId || dec.id,
        name: dec.name || 'Decoração',
        imageUrl: dec.dayUrl || dec.nightUrl || dec.src || dec.imageUrl,
        price: dec.price || 0,
      }));

      const result = await ordersAPI.syncDecorations(projectId, decorationsToSync, null);
      console.log('✅ Decorações sincronizadas:', result);
      hasSyncedRef.current = true;
      return result.order;
    } catch (err) {
      console.error('❌ Erro ao sincronizar decorações:', err);
      return null;
    } finally {
      setSyncing(false);
    }
  }, [projectId, canvasDecorations]);

  // Carregar order draft do projeto
  const loadOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data = await ordersAPI.getOrCreateDraft(projectId);
      
      // Se não há itens de decoração na order mas há decorações no canvas, sincronizar
      const decorationItems = data.items?.filter(item => item.itemType === 'decoration') || [];
      if (decorationItems.length === 0 && canvasDecorations.length > 0 && !hasSyncedRef.current) {
        const syncedOrder = await syncCanvasDecorations();
        if (syncedOrder) {
          data = syncedOrder;
        }
      }
      
      setOrder(data);
    } catch (err) {
      console.error('Erro ao carregar order:', err);
      setError(t('pages.projectDetails.orders.errorLoading', 'Erro ao carregar encomenda'));
    } finally {
      setLoading(false);
    }
  }, [projectId, t, canvasDecorations, syncCanvasDecorations]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  // Calcular totais
  const items = order?.items || [];
  const total = parseFloat(order?.total) || 0;
  const effectiveBudget = parseFloat(budget) || 0;
  const remainingBudget = Math.max(0, effectiveBudget - total);
  const budgetPercentage = effectiveBudget > 0 ? Math.min(100, (total / effectiveBudget) * 100) : 0;
  const isOverBudget = total > effectiveBudget;
  const piecesCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Separar items por tipo
  const productItems = items.filter(item => item.itemType === 'product' || !item.itemType);
  const decorationItems = items.filter(item => item.itemType === 'decoration');
  const productPiecesCount = productItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const decorationPiecesCount = decorationItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  // Status helpers
  const currentStatus = order?.status || 'draft';
  const statusInfo = statusConfig[currentStatus] || statusConfig.draft;
  const isEditable = currentStatus === 'draft';

  // Handlers
  const handleAddItem = async (product, variant, qty) => {
    try {
      const result = await ordersAPI.addItem(order.id, {
        productId: product.id,
        quantity: qty || 1,
        variant: variant,
      });
      
      // Recarregar order para atualizar lista
      await loadOrder();
      return true;
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
      return false;
    }
  };

  const handleUpdateQuantity = async (itemId, newQty) => {
    if (!isEditable) return;
    
    try {
      setUpdatingItem(itemId);
      await ordersAPI.updateItem(order.id, itemId, { quantity: newQty });
      await loadOrder();
    } catch (err) {
      console.error('Erro ao atualizar quantidade:', err);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!isEditable) return;
    
    try {
      setUpdatingItem(itemId);
      await ordersAPI.removeItem(order.id, itemId);
      await loadOrder();
    } catch (err) {
      console.error('Erro ao remover item:', err);
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await ordersAPI.updateStatus(order.id, newStatus);
      await loadOrder();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  // Loading state
  if (loading || syncing) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" label={syncing ? t('pages.projectDetails.orders.syncing', 'A sincronizar decorações...') : t('common.loading')} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <Icon icon="lucide:alert-circle" className="text-4xl text-danger mx-auto mb-4" />
        <p className="text-default-500 mb-4">{error}</p>
        <Button color="primary" variant="flat" onPress={loadOrder}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header com Status e Budget */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            {/* Status Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-default-500 font-medium">
                {t('pages.projectDetails.orders.status', 'Estado')}:
              </span>
              <Dropdown>
                <DropdownTrigger>
                  <Chip
                    as="button"
                    color={statusInfo.color}
                    variant="flat"
                    startContent={<Icon icon={statusInfo.icon} className="text-sm" />}
                    className="cursor-pointer"
                  >
                    {t(`pages.projectDetails.orders.statusLabels.${statusInfo.label}`, currentStatus)}
                  </Chip>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label={t('pages.projectDetails.orders.changeStatus', 'Alterar estado')}
                  onAction={(key) => handleStatusChange(String(key))}
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <DropdownItem
                      key={key}
                      startContent={<Icon icon={config.icon} />}
                    >
                      {t(`pages.projectDetails.orders.statusLabels.${config.label}`, key)}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            {/* Chips de resumo */}
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="flat" startContent={<Icon icon="lucide:box" className="text-xs" />}>
                {t('pages.projectDetails.orders.totalItems', { count: piecesCount }, `${piecesCount} items`)}
              </Chip>
              {decorationPiecesCount > 0 && (
                <Chip size="sm" variant="flat" color="secondary" startContent={<Icon icon="lucide:brush" className="text-xs" />}>
                  {decorationPiecesCount} {t('pages.projectDetails.orders.decorations', 'decorações')}
                </Chip>
              )}
              <Chip
                size="sm"
                color={isOverBudget ? 'danger' : 'success'}
                variant="flat"
                startContent={<Icon icon="lucide:euro" className="text-xs" />}
              >
                €{total.toLocaleString()}
              </Chip>
              {effectiveBudget > 0 && (
                <Chip size="sm" variant="flat">
                  {t('pages.projectDetails.orders.budget', 'Budget')}: €{effectiveBudget.toLocaleString()}
                </Chip>
              )}
            </div>
          </div>

          {/* Budget Progress */}
          {effectiveBudget > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-default-500">
                  {t('pages.projectDetails.orders.budgetUsage', 'Utilização do budget')}
                </span>
                <span className={isOverBudget ? 'text-danger font-medium' : 'text-default-600'}>
                  €{total.toLocaleString()} / €{effectiveBudget.toLocaleString()}
                </span>
              </div>
              <Progress
                aria-label="Budget progress"
                value={budgetPercentage}
                color={isOverBudget ? 'danger' : budgetPercentage >= 85 ? 'warning' : 'success'}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-default-400">
                <span>{Math.round(budgetPercentage)}% {t('pages.projectDetails.orders.used', 'utilizado')}</span>
                <span className={remainingBudget <= 0 ? 'text-danger' : ''}>
                  {t('pages.projectDetails.orders.remaining', 'Restante')}: €{remainingBudget.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Lista de Items */}
      <Card>
        <CardHeader className="px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {t('pages.projectDetails.orders.items', 'Items da Encomenda')}
          </h3>
          {isEditable && (
            <Button
              color="primary"
              variant="solid"
              size="sm"
              startContent={<Icon icon="lucide:plus" />}
              onPress={() => setIsAddModalOpen(true)}
            >
              {t('pages.projectDetails.orders.addItem', 'Adicionar Item')}
            </Button>
          )}
        </CardHeader>
        <Divider />
        <CardBody className="p-0">
          {items.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-4">
                <Icon icon="lucide:shopping-bag" className="text-3xl text-default-400" />
              </div>
              <p className="text-default-500 mb-4">
                {t('pages.projectDetails.orders.emptyState', 'Nenhum item adicionado ainda')}
              </p>
              {isEditable && (
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Icon icon="lucide:plus" />}
                  onPress={() => setIsAddModalOpen(true)}
                >
                  {t('pages.projectDetails.orders.addFirstItem', 'Adicionar primeiro item')}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-divider">
              {items.map((item) => {
                const itemTotal = (parseFloat(item.unitPrice) || 0) * (item.quantity || 0);
                const isUpdating = updatingItem === item.id;
                const product = item.product;
                const decoration = item.decoration;
                const isDecoration = item.itemType === 'decoration';
                const imageUrl = item.imageUrl || product?.thumbnailUrl || product?.imagesDayUrl || decoration?.thumbnailUrl || null;

                return (
                  <div
                    key={item.id}
                    className={`px-6 py-4 flex items-center gap-4 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
                  >
                    {/* Imagem do produto/decoração */}
                    <div className="w-16 h-16 rounded-lg bg-default-100 flex-shrink-0 overflow-hidden relative">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Icon 
                            icon={isDecoration ? "lucide:sparkles" : "lucide:package"} 
                            className="text-2xl text-default-400" 
                          />
                        </div>
                      )}
                      {/* Indicador de tipo */}
                      {isDecoration && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                          <Icon icon="lucide:brush" className="text-xs text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info do produto/decoração */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground truncate" title={item.name}>
                          {item.name}
                        </h4>
                        {isDecoration && (
                          <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">
                            {t('pages.projectDetails.orders.decoration', 'Decoração')}
                          </Chip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-default-500">
                          €{parseFloat(item.unitPrice).toLocaleString()} / un.
                        </span>
                        {item.variant?.color && (
                          <Chip size="sm" variant="flat" className="text-xs">
                            {item.variant.color}
                          </Chip>
                        )}
                      </div>
                    </div>

                    {/* Controles de quantidade */}
                    <div className="flex items-center gap-2">
                      {isEditable ? (
                        <>
                          <Tooltip content={t('pages.projectDetails.orders.decrease', 'Diminuir')}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              isDisabled={isUpdating || item.quantity <= 1}
                              onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            >
                              <Icon icon="lucide:minus" />
                            </Button>
                          </Tooltip>
                          <Input
                            type="number"
                            size="sm"
                            min={1}
                            value={String(item.quantity)}
                            className="w-16"
                            isDisabled={isUpdating}
                            aria-label="Quantidade"
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (val > 0) handleUpdateQuantity(item.id, val);
                            }}
                          />
                          <Tooltip content={t('pages.projectDetails.orders.increase', 'Aumentar')}>
                            <Button
                              isIconOnly
                              size="sm"
                              variant="flat"
                              isDisabled={isUpdating}
                              onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <Icon icon="lucide:plus" />
                            </Button>
                          </Tooltip>
                        </>
                      ) : (
                        <span className="text-default-600 font-medium px-4">
                          x{item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Total da linha */}
                    <div className="w-24 text-right">
                      <span className="font-semibold text-foreground">
                        €{itemTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Botão remover */}
                    {isEditable && (
                      <Tooltip content={t('pages.projectDetails.orders.remove', 'Remover')}>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          isDisabled={isUpdating}
                          onPress={() => handleRemoveItem(item.id)}
                        >
                          <Icon icon="lucide:trash-2" />
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>

        {/* Footer com total */}
        {items.length > 0 && (
          <>
            <Divider />
            <CardBody className="px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-default-500">
                  {items.length} {t('pages.projectDetails.orders.lines', 'linhas')} • {piecesCount} {t('pages.projectDetails.orders.pieces', 'peças')}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-default-500">Total:</span>
                  <span className={`text-xl font-bold ${isOverBudget ? 'text-danger' : 'text-foreground'}`}>
                    €{total.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardBody>
          </>
        )}
      </Card>

      {/* Actions Card */}
      {items.length > 0 && currentStatus === 'draft' && (
        <Card>
          <CardBody className="px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-default-500">
                {isOverBudget
                  ? t('pages.projectDetails.orders.overBudgetWarning', 'Atenção: O total excede o budget do projeto')
                  : t('pages.projectDetails.orders.readyToOrder', 'A encomenda está pronta para ser submetida')}
              </p>
              <Button
                color="primary"
                variant="solid"
                startContent={<Icon icon="lucide:send" />}
                onPress={() => handleStatusChange('to_order')}
              >
                {t('pages.projectDetails.orders.submitOrder', 'Submeter Encomenda')}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modal de adicionar item */}
      <ProjectAddPieceModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        project={{ id: projectId, budget: effectiveBudget }}
        onAddItem={handleAddItem}
      />
    </div>
  );
}

