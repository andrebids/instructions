import React from "react";
import { Chip } from "@heroui/react";

const statusConfig = {
  PENDING: { color: "default", label: "Pending" },
  IN_PROGRESS: { color: "primary", label: "In Progress" },
  BLOCKED: { color: "danger", label: "Blocked" },
  IN_REVIEW: { color: "warning", label: "In Review" },
  CHANGES_REQUESTED: { color: "warning", label: "Changes Requested" },
  APPROVED: { color: "success", label: "Approved" },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.PENDING;
  
  return (
    <Chip
      size="sm"
      color={config.color}
      variant="flat"
      className="uppercase font-bold text-xs"
    >
      {config.label}
    </Chip>
  );
};
