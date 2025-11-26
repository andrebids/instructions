import React from "react";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

export function ClientAutocomplete({
  clients,
  selectedKey,
  inputValue,
  onSelectionChange,
  onInputChange,
  onAddNewClick,
}) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          {t('pages.projectDetails.clientAutocomplete.label')}
          <span className="text-danger ml-1">*</span>
        </label>
        <Button
          size="sm"
          color="primary"
          variant="light"
          className="h-6 min-w-0 px-2 text-xs"
          onPress={onAddNewClick}
          startContent={<Icon icon="lucide:plus" className="text-sm" />}
        >
          {t('pages.projectDetails.clientAutocomplete.addNewClient')}
        </Button>
      </div>
      <Autocomplete
        placeholder={t('pages.projectDetails.clientAutocomplete.placeholder')}
        isRequired
        onSelectionChange={onSelectionChange}
        className="w-full"
        variant="bordered"
        size="md"
        radius="lg"
        startContent={<Icon icon="lucide:user" className="text-default-400" />}
        menuTrigger="input"
        defaultItems={clients}
        selectedKey={selectedKey}
        inputValue={inputValue}
        onInputChange={onInputChange}
        classNames={{
          input: "text-foreground font-medium",
          inputWrapper: "border-2 border-divider hover:border-primary focus-within:border-primary"
        }}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        }}
      >
        {(client) => (
          <AutocompleteItem key={client.id} textValue={client.name}>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{client.name}</span>
              <span className="text-xs text-default-500">{client.email}</span>
            </div>
          </AutocompleteItem>
        )}
      </Autocomplete>
    </div>
  );
}

