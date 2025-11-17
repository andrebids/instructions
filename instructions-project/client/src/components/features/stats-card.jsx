import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export function StatsCard({ title, value, change, isPositive, icon, timePeriod = "This month", colorKey = "primary" }) {

  const colorStyles = {
    primary: { bg: "bg-primary/10", icon: "text-primary" },
    secondary: { bg: "bg-secondary/10", icon: "text-secondary" },
    success: { bg: "bg-success/10", icon: "text-success" },
    warning: { bg: "bg-warning/10", icon: "text-warning" },
    danger: { bg: "bg-danger/10", icon: "text-danger" },
    default: { bg: "bg-default/10", icon: "text-default" },
  };

  const { bg, icon: iconColor } = colorStyles[colorKey] || colorStyles.primary;

  return (
    <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm">
      <CardBody>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-800 dark:text-foreground -mt-0.5">{value}</span>
              <p className="text-sm font-semibold leading-tight text-gray-800 dark:text-foreground">{title}</p>
            </div>
            <p className="text-sm text-default-500">{timePeriod}</p>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${bg}`}>
            <Icon icon={icon} className={`text-2xl ${iconColor}`} />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
