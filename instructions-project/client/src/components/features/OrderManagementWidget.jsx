import React from 'react';
import { Card, CardBody, Button, Tooltip, useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "../ui/ConfirmDialog";

// Extend Order Modal Component
const ExtendOrderModal = ({ isOpen, onClose, project, onConfirm }) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = React.useState('7');
  const [customDays, setCustomDays] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);

  const periodOptions = [
    { key: '7', label: t('pages.dashboard.orderManagement.extendOrder.modal.days7') },
    { key: '30', label: t('pages.dashboard.orderManagement.extendOrder.modal.days30') },
    { key: 'custom', label: t('pages.dashboard.orderManagement.extendOrder.modal.custom') },
  ];

  const handleConfirm = () => {
    const days = selectedPeriod === 'custom' ? parseInt(customDays, 10) : parseInt(selectedPeriod, 10);
    if (selectedPeriod === 'custom' && (!customDays || isNaN(days) || days <= 0)) {
      return;
    }
    
    // Show success state
    setShowSuccess(true);
    
    // Call parent confirm handler
    onConfirm(days);
    
    // Close modal after showing success message
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedPeriod('7');
      setCustomDays('');
      onClose();
    }, 2000);
  };

  const handleClose = () => {
    setShowSuccess(false);
    setSelectedPeriod('7');
    setCustomDays('');
    onClose();
  };

  const isCustomValid = selectedPeriod !== 'custom' || (customDays && parseInt(customDays, 10) > 0);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <ModalContent>
        {showSuccess ? (
          <>
            <ModalHeader className="flex gap-3 items-center">
              <div className="p-2 rounded-full bg-success/10 text-success">
                <Icon icon="lucide:clock" className="text-xl" />
              </div>
              <span>{t('pages.dashboard.orderManagement.extendOrder.modal.pendingApproval')}</span>
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col items-center py-4">
                <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mb-4">
                  <Icon icon="lucide:hourglass" className="text-3xl text-warning" />
                </div>
                <p className="text-lg font-semibold text-center mb-2">
                  {t('pages.dashboard.orderManagement.extendOrder.modal.requestSent')}
                </p>
                <p className="text-default-500 text-center text-sm">
                  {t('pages.dashboard.orderManagement.extendOrder.modal.awaitingApproval')}
                </p>
              </div>
            </ModalBody>
          </>
        ) : (
          <>
            <ModalHeader className="flex gap-3 items-center">
              <div className="p-2 rounded-full bg-warning/10 text-warning">
                <Icon icon="lucide:calendar-plus" className="text-xl" />
              </div>
              <span>{t('pages.dashboard.orderManagement.extendOrder.modal.title')}</span>
            </ModalHeader>
            <ModalBody>
              <p className="text-default-600 mb-4">
                {t('pages.dashboard.orderManagement.extendOrder.modal.message', { project })}
              </p>
              
              <Select
                label={t('pages.dashboard.orderManagement.extendOrder.modal.selectPeriod')}
                selectedKeys={[selectedPeriod]}
                onSelectionChange={(keys) => setSelectedPeriod(Array.from(keys)[0])}
                classNames={{
                  trigger: "bg-default-100",
                }}
              >
                {periodOptions.map((option) => (
                  <SelectItem key={option.key}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>

              {selectedPeriod === 'custom' && (
                <Input
                  type="number"
                  label={t('pages.dashboard.orderManagement.extendOrder.modal.customDays')}
                  placeholder={t('pages.dashboard.orderManagement.extendOrder.modal.customPlaceholder')}
                  value={customDays}
                  onValueChange={setCustomDays}
                  min={1}
                  classNames={{
                    inputWrapper: "bg-default-100",
                  }}
                  className="mt-4"
                  endContent={
                    <span className="text-default-400 text-sm">
                      {customDays && parseInt(customDays, 10) === 1 ? 'day' : 'days'}
                    </span>
                  }
                />
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={handleClose}>
                {t('common.cancel')}
              </Button>
              <Button 
                color="warning" 
                onPress={handleConfirm}
                isDisabled={!isCustomValid}
              >
                {t('pages.dashboard.orderManagement.extendOrder.modal.confirm')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

const MOCK_ORDERS = [
  {
    id: 1,
    project: "Lisbon Municipality",
    items: ["IPL337W", "GX350LW-2A", "IPL337-REF"],
    status: "critical",
    timeLeft: "2h",
    date: "Today, 14:00"
  },
  {
    id: 2,
    project: "Sports Center",
    items: ["IPL337W"],
    status: "pending",
    timeLeft: "2d",
    date: "Nov 27, 09:00"
  },
  {
    id: 3,
    project: "Green market",
    items: ["IPL337W", "IPL337", "8CXMAR13446625-M27", "IPL337"],
    status: "normal",
    timeLeft: "New",
    date: "Just now"
  }
];

const STATUS_CONFIG = {
  critical: {
    color: "text-red-600 dark:text-red-500",
    bg: "bg-red-500",
    bgTinted: "bg-red-500/15 dark:bg-red-500/5",
    icon: "lucide:alert-circle"
  },
  pending: {
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-500",
    bgTinted: "bg-yellow-500/15 dark:bg-yellow-500/5",
    icon: "lucide:clock"
  },
  normal: {
    color: "text-blue-600 dark:text-blue-500",
    bg: "bg-blue-500",
    bgTinted: "bg-blue-500/15 dark:bg-blue-500/5",
    icon: "lucide:check-circle-2"
  }
};

export const OrderManagementWidget = React.memo(() => {
  const { t } = useTranslation();
  const [pendingExtensions, setPendingExtensions] = React.useState(new Set());

  const handleExtensionRequest = React.useCallback((orderId) => {
    setPendingExtensions(prev => new Set([...prev, orderId]));
  }, []);

  return (
    <Card className="h-[420px] glass-panel border border-white/20 dark:border-white/10 overflow-hidden">
      <CardBody className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-white tracking-tight flex items-center gap-2">
              <Icon icon="lucide:package-check" className="w-6 h-6 text-primary" />
              Order Management
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              3 active orders require attention
            </p>
          </div>
          <Button 
            isIconOnly 
            variant="light" 
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <Icon icon="lucide:more-horizontal" className="w-5 h-5" />
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <AnimatePresence>
            {MOCK_ORDERS.map((order, index) => (
              <OrderItem 
                key={order.id} 
                order={order} 
                index={index} 
                hasPendingExtension={pendingExtensions.has(order.id)}
                onExtensionRequest={handleExtensionRequest}
              />
            ))}
          </AnimatePresence>
        </div>
      </CardBody>
    </Card>
  );
});

const OrderItem = React.memo(({ order, index, hasPendingExtension, onExtensionRequest }) => {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[order.status];
  
  // Modal states
  const { isOpen: isReleaseOpen, onOpen: onReleaseOpen, onClose: onReleaseClose } = useDisclosure();
  const { isOpen: isExtendOpen, onOpen: onExtendOpen, onClose: onExtendClose } = useDisclosure();
  const { isOpen: isConfirmOpen, onOpen: onConfirmOpen, onClose: onConfirmClose } = useDisclosure();

  // Handlers
  const handleRelease = React.useCallback(() => {
    // TODO: Implementar lógica de release order
    console.log('Release order:', order.id);
    onReleaseClose();
  }, [order.id, onReleaseClose]);

  const handleExtend = React.useCallback((days) => {
    // TODO: Implementar lógica de extend order com API
    console.log('Extend order:', order.id, 'for', days, 'days - Pending Approval');
    // Marcar este pedido como tendo extensão pendente
    onExtensionRequest(order.id);
  }, [order.id, onExtensionRequest]);

  const handleConfirm = React.useCallback(() => {
    // TODO: Implementar lógica de confirm order
    console.log('Confirm order:', order.id);
    onConfirmClose();
  }, [order.id, onConfirmClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      className={`
        group relative flex flex-col sm:flex-row items-start sm:items-center justify-between 
        p-4 rounded-2xl
        ${config.bgTinted} backdrop-blur-md
        transition-all duration-300
        hover:brightness-105
      `}
    >
      {/* Info Section */}
      <div className="flex-1 mb-3 sm:mb-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-zinc-800 dark:text-white text-base">
            {order.project}
          </h4>
          {order.status === 'critical' && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 flex-wrap">
          <span className="font-medium">{order.items[0]}</span>
          {order.items.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-semibold">
              +{order.items.length - 1}
            </span>
          )}
          <span className="text-zinc-300 dark:text-zinc-600">•</span>
          <span className={`${config.color} font-medium flex items-center gap-1`}>
            <Icon icon={config.icon} className="w-3 h-3" />
            {order.timeLeft}
          </span>
          {hasPendingExtension && (
            <>
              <span className="text-zinc-300 dark:text-zinc-600">•</span>
              <span className="text-warning font-medium text-xs">
                ({t('pages.dashboard.orderManagement.extendOrder.modal.awaitingExtension')})
              </span>
            </>
          )}
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto sm:justify-end">
        
        {/* Release Button (Tertiary) */}
        <Tooltip content={t('pages.dashboard.orderManagement.releaseOrder.tooltip')}>
          <button
            className="btn-glass btn-glass-tertiary"
            onClick={onReleaseOpen}
          >
            <Icon icon="lucide:unlock" className="w-4 h-4" />
          </button>
        </Tooltip>

        {/* Extend Button (Secondary) */}
        {/* Extend Button (Secondary) */}
        <button
          className="btn-glass btn-glass-secondary flex-1 sm:flex-none sm:min-w-[80px]"
          onClick={onExtendOpen}
        >
          <span>{t('pages.dashboard.orderManagement.extend')}</span>
        </button>

        {/* Confirm Button (Primary) */}
        {/* Confirm Button (Primary) */}
        <button
          className="btn-glass btn-glass-primary flex-1 sm:flex-none sm:min-w-[90px]"
          onClick={onConfirmOpen}
        >
          <span>{t('pages.dashboard.orderManagement.confirm')}</span>
        </button>
      </div>

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={isReleaseOpen}
        onClose={onReleaseClose}
        onConfirm={handleRelease}
        title={t('pages.dashboard.orderManagement.releaseOrder.modal.title')}
        message={t('pages.dashboard.orderManagement.releaseOrder.modal.message', { project: order.project })}
        confirmText={t('pages.dashboard.orderManagement.releaseOrder.modal.confirm')}
        cancelText={t('common.cancel')}
        confirmColor="danger"
        icon="lucide:unlock"
      />

      <ExtendOrderModal
        isOpen={isExtendOpen}
        onClose={onExtendClose}
        project={order.project}
        onConfirm={handleExtend}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={onConfirmClose}
        onConfirm={handleConfirm}
        title={t('pages.dashboard.orderManagement.confirmOrder.modal.title')}
        message={t('pages.dashboard.orderManagement.confirmOrder.modal.message', { project: order.project })}
        confirmText={t('pages.dashboard.orderManagement.confirmOrder.modal.confirm')}
        cancelText={t('common.cancel')}
        confirmColor="success"
        icon="lucide:check-circle-2"
      />
    </motion.div>
  );
});
