import React from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
}

export function StatsCard({ title, value, change, isPositive, icon }: StatsCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="flex justify-between">
          <div>
            <p className="text-small text-default-500">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <div className="flex items-center gap-1 mt-2">
              <Icon
                icon={isPositive ? "lucide:trending-up" : "lucide:trending-down"}
                className={isPositive ? "text-success" : "text-danger"}
              />
              <span className={`text-small ${isPositive ? "text-success" : "text-danger"}`}>
                {change}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Icon icon={icon} className="text-2xl text-primary" />
          </div>
        </div>
      </CardBody>
    </Card>
  );
}