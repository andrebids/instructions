import React from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export function UrgencyWidget() {
  const { t } = useTranslation();
  
  return (
    <Card className="h-full bg-content1/50 border-default-200/50 backdrop-blur-md shadow-sm">
      <CardBody className="p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon icon="lucide:alert-triangle" className="text-warning text-xl" />
            <h3 className="text-lg font-semibold text-foreground">{t('pages.dashboard.urgencyWidget.title')}</h3>
          </div>
          <p className="text-default-500 text-sm mb-4">
            {t('pages.dashboard.urgencyWidget.subtitle')}
          </p>
          
          <div className="bg-danger-500/10 border border-danger-500/20 rounded-xl p-3 mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-danger-500 font-medium text-sm">{t('pages.dashboard.urgencyWidget.project')} Winter Wonderland</span>
              <Chip size="sm" color="danger" variant="flat" className="h-5 text-xs">{t('pages.dashboard.urgencyWidget.daysLeft', { count: 2 })}</Chip>
            </div>
            <p className="text-default-500 text-xs">500m LED Strings (Warm White)</p>
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
            {t('pages.dashboard.urgencyWidget.extend')}
          </Button>
          <Button 
            size="sm" 
            color="danger" 
            variant="ghost" 
            className="flex-1 font-medium"
            startContent={<Icon icon="lucide:x" />}
          >
            {t('pages.dashboard.urgencyWidget.release')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
