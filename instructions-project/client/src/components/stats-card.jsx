import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

export function StatsCard({ title, value, change, isPositive, icon, timePeriod = "This month" }) {
  return (
    <Card className="bg-[#e4e3e8] dark:bg-content1 shadow-sm">
      <CardBody>
        <div className="flex justify-between">
          <div>
            <p className="text-base font-semibold text-gray-800 dark:text-foreground">{title}</p>
            <p className="text-xs text-default-500 mt-1">{timePeriod}</p>
            <p className="text-xl font-normal text-gray-800 dark:text-foreground mt-2">{value}</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Icon icon={icon} className="text-2xl text-primary" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
