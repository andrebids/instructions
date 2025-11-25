import React from 'react';
import { Card, CardBody, Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

const MOCK_ORDERS = [
  {
    id: 1,
    project: "Alpha Tower",
    items: ["Steel Beams", "Concrete Mix", "Rebar"],
    status: "critical",
    timeLeft: "2h",
    date: "Today, 14:00"
  },
  {
    id: 2,
    project: "Beta Complex",
    items: ["Cement Bags"],
    status: "pending",
    timeLeft: "2d",
    date: "Nov 27, 09:00"
  },
  {
    id: 3,
    project: "Gamma Mall",
    items: ["Glass Panels", "Window Frames", "Door Handles", "LED Strips"],
    status: "normal",
    timeLeft: "New",
    date: "Just now"
  }
];

const STATUS_CONFIG = {
  critical: {
    color: "text-red-500",
    bg: "bg-red-500",
    border: "border-red-500/30",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.4)]",
    icon: "lucide:alert-circle"
  },
  pending: {
    color: "text-amber-500",
    bg: "bg-amber-500",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.4)]",
    icon: "lucide:clock"
  },
  normal: {
    color: "text-emerald-500",
    bg: "bg-emerald-500",
    border: "border-emerald-500/30",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.4)]",
    icon: "lucide:check-circle-2"
  }
};

export const OrderManagementWidget = () => {
  const { t } = useTranslation();

  return (
    <Card className="h-[420px] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
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
};

const OrderItem = ({ order, index }) => {
  const config = STATUS_CONFIG[order.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      className={`
        group relative flex flex-col sm:flex-row items-start sm:items-center justify-between 
        p-4 rounded-2xl border border-white/10 dark:border-white/5 
        bg-white/30 dark:bg-black/20 backdrop-blur-md
        transition-colors duration-300
      `}
    >
      {/* Status Indicator Line (Left) */}
      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${config.bg} ${config.glow}`} />

      {/* Info Section */}
      <div className="pl-4 flex-1 mb-3 sm:mb-0">
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
      <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
        
        {/* Release Button (Tertiary) */}
        <Tooltip content="Release Order">
          <Button
            isIconOnly
            size="sm"
            variant="light"
            className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <Icon icon="lucide:trash-2" className="w-4 h-4" />
          </Button>
        </Tooltip>

        {/* Extend Button (Secondary) */}
        <Button
          size="sm"
          variant="bordered"
          className="border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-0 sm:min-w-[80px]"
        >
          <span className="hidden sm:inline">Extend</span>
          <Icon icon="lucide:calendar-clock" className="w-4 h-4 sm:hidden" />
        </Button>

        {/* Confirm Button (Primary) */}
        <Button
          size="sm"
          variant="bordered"
          className="border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold min-w-0 sm:min-w-[90px] transition-colors"
        >
          <span className="hidden sm:inline">Confirm</span>
          <Icon icon="lucide:check" className="w-4 h-4 sm:hidden" />
        </Button>
      </div>
    </motion.div>
  );
};
