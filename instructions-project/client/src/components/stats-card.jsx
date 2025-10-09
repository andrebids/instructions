import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export function StatsCard({ title, value, change, isPositive, icon, timePeriod = "This month" }) {
  const colorKeyByTitle = {
    "Total Projects": "primary",
    "In Progress": "warning",
    Finished: "success",
    Approved: "success",
    "In Queue": "secondary",
    Cancelled: "danger",
  };

  const colorKey = colorKeyByTitle[title] || "primary";

  const colorStyles = {
    primary: { bg: "bg-primary/10", icon: "text-primary" },
    secondary: { bg: "bg-secondary/10", icon: "text-secondary" },
    success: { bg: "bg-success/10", icon: "text-success" },
    warning: { bg: "bg-warning/10", icon: "text-warning" },
    danger: { bg: "bg-danger/10", icon: "text-danger" },
  };

  const { bg, icon: iconColor } = colorStyles[colorKey];

  return (
    <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm">
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl font-semibold text-gray-800 dark:text-foreground -mt-0.5">{value}</span>
            <div>
              <p className="text-sm font-semibold leading-tight text-gray-800 dark:text-foreground">{title}</p>
              <p className="text-sm text-default-500 mt-0">{timePeriod}</p>
            </div>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${bg}`}>
            <Icon icon={icon} className={`text-2xl ${iconColor}`} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
