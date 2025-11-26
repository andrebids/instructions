import React from 'react';
import { Card, CardBody, Button, Tooltip, useDisclosure } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "../ui/ConfirmDialog";

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
    color: "text-red-500",
    bg: "bg-red-500",
    bgTinted: "bg-red-500/5",
    icon: "lucide:alert-circle"
  },
  pending: {
    color: "text-yellow-500",
    bg: "bg-yellow-500",
    bgTinted: "bg-yellow-500/5",
    icon: "lucide:clock"
  },
  normal: {
    color: "text-blue-500",
    bg: "bg-blue-500",
    bgTinted: "bg-blue-500/5",
    icon: "lucide:check-circle-2"
  }
};

export const OrderManagementWidget = React.memo(() => {
  const { t } = useTranslation();

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
              <OrderItem key={order.id} order={order} index={index} />
            ))}
          </AnimatePresence>
        </div>
      </CardBody>
    </Card>
  );
});

const OrderItem = React.memo(({ order, index }) => {
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

  const handleExtend = React.useCallback(() => {
    // TODO: Implementar lógica de extend order
    console.log('Extend order:', order.id);
    onExtendClose();
  }, [order.id, onExtendClose]);

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
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
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
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex items-center gap-2 mt-3 sm:mt-0 w-full sm:w-auto sm:justify-end">
        
        {/* Release Button (Tertiary) */}
        <Tooltip content={t('pages.dashboard.orderManagement.releaseOrder.tooltip')}>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 hover:scale-110 active:scale-95 transition-all duration-300"
            onPress={onReleaseOpen}
          >
            <Icon icon="lucide:unlock" className="w-4 h-4" />
          </Button>
        </Tooltip>

        {/* Extend Button (Secondary) */}
        <Button
          size="sm"
          variant="bordered"
          className="border-zinc-300/50 dark:border-zinc-700/50 bg-white/5 backdrop-blur-md text-zinc-600 dark:text-zinc-300 hover:bg-white/20 hover:border-zinc-300 dark:hover:border-zinc-600 hover:scale-105 active:scale-95 transition-all duration-300 flex-1 sm:flex-none sm:min-w-[80px]"
          onPress={onExtendOpen}
        >
          <span>{t('pages.dashboard.orderManagement.extend')}</span>
        </Button>

        {/* Confirm Button (Primary) */}
        <Button
          size="sm"
          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md font-semibold hover:scale-105 active:scale-95 transition-all duration-300 flex-1 sm:flex-none sm:min-w-[90px]"
          onPress={onConfirmOpen}
        >
          <span>{t('pages.dashboard.orderManagement.confirm')}</span>
        </Button>
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

      <ConfirmDialog
        isOpen={isExtendOpen}
        onClose={onExtendClose}
        onConfirm={handleExtend}
        title={t('pages.dashboard.orderManagement.extendOrder.modal.title')}
        message={t('pages.dashboard.orderManagement.extendOrder.modal.message', { project: order.project })}
        confirmText={t('pages.dashboard.orderManagement.extendOrder.modal.confirm')}
        cancelText={t('common.cancel')}
        confirmColor="warning"
        icon="lucide:calendar-plus"
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
