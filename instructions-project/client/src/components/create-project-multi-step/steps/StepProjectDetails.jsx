import React from "react";
import { Input, DatePicker } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";
import { ClientAutocomplete } from "../components/ClientAutocomplete";

export function StepProjectDetails({
  formData,
  clients,
  onInputChange,
  onClientSelect,
  onClientInputChange,
  onAddNewClient,
}) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold">Project Details</h2>
          <p className="text-sm sm:text-base text-default-500 mt-2">
            Let's start with the basic information about your project.
          </p>
        </div>
        
        <div className="space-y-5">
          {/* Project Name */}
          <div className="max-w-md mx-auto">
            <label className="block text-sm font-semibold mb-2 text-primary-700 dark:text-primary-400">
              Project Name *
            </label>
            <Input
              isRequired
              placeholder="Enter the project name"
              value={formData.name}
              onChange={(e) => onInputChange("name", e.target.value)}
              className="w-full"
              variant="bordered"
              size="md"
              radius="lg"
              startContent={<Icon icon="lucide:folder" className="text-default-400" />}
              classNames={{
                input: "text-foreground font-medium",
                inputWrapper: "bg-content1 border-2 border-divider hover:border-primary focus-within:border-primary"
              }}
            />
          </div>
          
          {/* Client Autocomplete */}
          <div className="max-w-md mx-auto">
            <ClientAutocomplete
              clients={clients}
              selectedKey={formData.selectedClientKey}
              inputValue={formData.clientName}
              onSelectionChange={onClientSelect}
              onInputChange={onClientInputChange}
              onAddNewClick={onAddNewClient}
            />
          </div>
          
          {/* Date and Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <DatePicker
                labelPlacement="outside"
                label="Delivery Date"
                isRequired
                value={formData.endDate}
                onChange={(value) => onInputChange("endDate", value)}
                className="w-full"
                variant="bordered"
                size="md"
                radius="lg"
                showMonthAndYearPickers
                locale="pt-PT"
                minValue={today(getLocalTimeZone())}
                classNames={{
                  label: "text-primary-700 dark:text-primary-400"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-primary-700 dark:text-primary-400">Budget (EUR) *</label>
              <Input
                type="number"
                placeholder="Enter the budget amount"
                value={formData.budget}
                onChange={(e) => onInputChange("budget", e.target.value)}
                className="w-full"
                variant="bordered"
                size="md"
                radius="lg"
                startContent={
                  <div className="pointer-events-none flex items-center">
                    <span className="text-default-400 text-small">€</span>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

