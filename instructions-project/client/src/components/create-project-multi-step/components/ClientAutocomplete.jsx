import React from "react";
import { Autocomplete, AutocompleteItem, Button } from "@heroui/react";
import { Icon } from "@iconify/react";

export function ClientAutocomplete({
  clients,
  selectedKey,
  inputValue,
  onSelectionChange,
  onInputChange,
  onAddNewClick,
}) {
  return (
    <div>
      <Autocomplete
        label="Client"
        placeholder="Search for a client"
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
          label: "text-foreground font-semibold",
          input: "text-foreground font-medium",
          inputWrapper: "bg-content1 border-2 border-divider hover:border-primary focus-within:border-primary"
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
      
      <Button
        size="sm"
        color="primary"
        variant="flat"
        className="mt-2"
        onPress={onAddNewClick}
        startContent={<Icon icon="lucide:plus" />}
      >
        Add New Client
      </Button>
    </div>
  );
}

