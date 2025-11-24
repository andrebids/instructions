import React from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

export function UrgencyWidget() {
  return (
    <Card className="h-full bg-zinc-900/50 border-zinc-800/50 backdrop-blur-md">
      <CardBody className="p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="lucide:alert-triangle" className="text-warning text-xl" />
            <h3 className="text-lg font-semibold text-white">Urgency Alert</h3>
          </div>
          <p className="text-zinc-400 text-sm mb-4">
            Stock Reservations Expiring Soon
          </p>
          
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-red-400 font-medium text-sm">Project: Winter Wonderland</span>
              <Chip size="sm" color="danger" variant="flat" className="h-5 text-xs">2 days left</Chip>
            </div>
            <p className="text-zinc-500 text-xs">500m LED Strings (Warm White)</p>
          </div>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button 
            size="sm" 
            color="warning" 
            variant="flat" 
            className="flex-1 font-medium"
            startContent={<Icon icon="lucide:clock" />}
          >
            Extend
          </Button>
          <Button 
            size="sm" 
            color="danger" 
            variant="ghost" 
            className="flex-1 font-medium"
            startContent={<Icon icon="lucide:x" />}
          >
            Release
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
