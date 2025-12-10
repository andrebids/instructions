import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";

/**
 * Componente para selecionar workflow (AI ou Human) por imagem
 * @param {Object} props
 * @param {string} props.imageId - ID da imagem
 * @param {string} props.selectedWorkflow - Workflow selecionado: 'ai' | 'human' | null
 * @param {Function} props.onSelect - Callback quando workflow é selecionado: (imageId, workflow) => void
 * @param {boolean} props.isCompact - Se deve mostrar versão compacta (para thumbnails)
 */
export function ImageWorkflowSelector({ imageId, selectedWorkflow, onSelect, isCompact = false }) {
  const workflows = [
    {
      id: "ai",
      icon: "lucide:zap",
      iconColor: "text-warning-500",
      label: "AI Assisted",
      tooltip: "AI Assisted Designer - Results in seconds",
    },
    {
      id: "human",
      icon: "lucide:palette",
      iconColor: "text-pink-400",
      label: "Human Designer",
      tooltip: "Send to Human Designer - More realistic results",
    },
  ];

  if (isCompact) {
    // Versão compacta para thumbnails - apenas ícones
    return (
      <div className="flex gap-1 items-center">
        {workflows.map((workflow) => {
          const isSelected = selectedWorkflow === workflow.id;
          return (
            <Tooltip key={workflow.id} content={workflow.tooltip} placement="top">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(imageId, workflow.id);
                }}
                className={`
                  p-1.5 rounded-md transition-all
                  ${isSelected 
                    ? `${workflow.id === 'ai' ? 'bg-warning-100' : 'bg-pink-100'} ring-2 ring-primary` 
                    : 'bg-default-100 hover:bg-default-200'
                  }
                `}
                aria-label={workflow.label}
              >
                <Icon 
                  icon={workflow.icon} 
                  className={`${workflow.iconColor} ${isSelected ? 'text-lg' : 'text-base'}`} 
                />
              </button>
            </Tooltip>
          );
        })}
      </div>
    );
  }

  // Versão completa - botões com labels
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-default-600 mb-1">Processing Mode:</p>
      <div className="flex gap-2">
        {workflows.map((workflow) => {
          const isSelected = selectedWorkflow === workflow.id;
          return (
            <Button
              key={workflow.id}
              size="sm"
              variant={isSelected ? "solid" : "bordered"}
              color={workflow.id === "ai" ? "warning" : "secondary"}
              startContent={<Icon icon={workflow.icon} className={workflow.iconColor} />}
              onPress={() => onSelect(imageId, workflow.id)}
              className={`
                flex-1 transition-all
                ${isSelected ? 'ring-2 ring-primary' : ''}
              `}
            >
              {workflow.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

