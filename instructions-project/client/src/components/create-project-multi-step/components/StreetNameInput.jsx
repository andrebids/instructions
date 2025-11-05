import React, { useState, useEffect } from "react";
import { Input, Select, SelectItem } from "@heroui/react";
import { Icon } from "@iconify/react";

/**
 * Componente para informações do cartouche (Name of the project, Street or zone, Option)
 * This functionality will be developed later
 */
export const StreetNameInput = ({ 
  projectName = "", 
  streetOrZone = "", 
  option = "",
  onProjectNameChange,
  onStreetOrZoneChange,
  onOptionChange,
  className = "" 
}) => {
  // Parsear option para tipo e número
  // option pode ser "base" ou "option-1", "option-2", etc.
  const parseOption = (opt) => {
    if (!opt || opt === "base" || opt === "1") {
      return { type: "base", number: null };
    }
    if (opt.startsWith("option-")) {
      return { type: "option", number: opt.replace("option-", "") };
    }
    // Se for apenas um número antigo (para compatibilidade), assumir que é "base" se for "1"
    if (opt === "1") {
      return { type: "base", number: null };
    }
    // Se for outro número, assumir que é uma opção
    return { type: "option", number: opt };
  };

  const { type: optionType, number: optionNumber } = parseOption(option);
  const [selectedType, setSelectedType] = useState(optionType || "base");
  const [selectedNumber, setSelectedNumber] = useState(optionNumber || "1");
  
  // Estados locais para controlar os valores dos inputs
  const [localProjectName, setLocalProjectName] = useState(projectName);
  const [localStreetOrZone, setLocalStreetOrZone] = useState(streetOrZone);

  // Atualizar quando valores externos mudarem
  useEffect(() => {
    setLocalProjectName(projectName);
  }, [projectName]);

  useEffect(() => {
    setLocalStreetOrZone(streetOrZone);
  }, [streetOrZone]);

  // Atualizar quando option externo mudar
  useEffect(() => {
    const parsed = parseOption(option);
    setSelectedType(parsed.type);
    setSelectedNumber(parsed.number || "1");
  }, [option]);

  const handleTypeChange = (type) => {
    setSelectedType(type);
    if (type === "base") {
      onOptionChange?.("base");
    } else {
      // Quando muda para "option", usar o número selecionado ou padrão "1"
      const newOption = `option-${selectedNumber || "1"}`;
      setSelectedNumber(selectedNumber || "1");
      onOptionChange?.(newOption);
    }
  };

  const handleNumberChange = (number) => {
    setSelectedNumber(number);
    onOptionChange?.(`option-${number}`);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        type="text"
        placeholder="Name of the project"
        value={localProjectName}
        onChange={(e) => {
          const newValue = e.target.value;
          setLocalProjectName(newValue);
          onProjectNameChange?.(newValue);
        }}
        startContent={<Icon icon="lucide:folder" className="text-default-400" />}
        variant="bordered"
        size="sm"
        classNames={{
          base: "w-full",
          input: "text-sm"
        }}
      />
      
      <Input
        type="text"
        placeholder="Street or zone"
        value={localStreetOrZone}
        onChange={(e) => {
          const newValue = e.target.value;
          setLocalStreetOrZone(newValue);
          onStreetOrZoneChange?.(newValue);
        }}
        startContent={<Icon icon="lucide:map-pin" className="text-default-400" />}
        variant="bordered"
        size="sm"
        classNames={{
          base: "w-full",
          input: "text-sm"
        }}
      />
      
      {/* Primeiro dropdown: escolher tipo */}
      <Select
        placeholder="Select type..."
        selectedKeys={new Set([selectedType])}
        onSelectionChange={(keys) => {
          const selectedValue = Array.from(keys)[0];
          handleTypeChange(selectedValue);
        }}
        variant="bordered"
        size="sm"
        startContent={<Icon icon="lucide:settings" className="text-default-400" />}
        classNames={{
          base: "w-full",
          trigger: "h-10 min-h-10"
        }}
      >
        <SelectItem key="base" value="base">
          Offre de base
        </SelectItem>
        <SelectItem key="option" value="option">
          Option
        </SelectItem>
      </Select>

      {/* Segundo dropdown: escolher número da opção (só aparece se escolher "Option") */}
      {selectedType === "option" && (
        <Select
          placeholder="Select option number..."
          selectedKeys={new Set([selectedNumber])}
          defaultSelectedKeys={new Set(["1"])}
          onSelectionChange={(keys) => {
            const selectedValue = Array.from(keys)[0];
            handleNumberChange(selectedValue || "1");
          }}
          variant="bordered"
          size="sm"
          startContent={<Icon icon="lucide:hash" className="text-default-400" />}
          classNames={{
            base: "w-full",
            trigger: "h-10 min-h-10"
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((num) => (
            <SelectItem key={String(num)} value={String(num)}>
              Option {num}
            </SelectItem>
          ))}
        </Select>
      )}
    </div>
  );
};

