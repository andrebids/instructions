import React from "react";
import { Card, CardBody, CardHeader, Chip, Button, Textarea } from "@heroui/react";
import { Icon } from "@iconify/react";

/**
 * Painel de resumo que mostra o workflow selecionado para cada imagem
 * e permite adicionar instruções para imagens com workflow "human"
 * @param {Object} props
 * @param {Array} props.uploadedImages - Lista de imagens uploadadas
 * @param {Object} props.workflowByImage - Mapeia workflow por imagem: { imageId: 'ai' | 'human' }
 * @param {Object} props.humanDesignerInstructions - Instruções por imagem: { imageId: 'instruções...' }
 * @param {Function} props.onWorkflowChange - Callback quando workflow muda: (imageId, workflow) => void
 * @param {Function} props.onInstructionsChange - Callback quando instruções mudam: (imageId, instructions) => void
 * @param {Function} props.onSubmitAll - Callback para submeter todas as imagens
 * @param {boolean} props.isSubmitting - Se está submetendo
 */
export function WorkflowSummaryPanel({
  uploadedImages = [],
  workflowByImage = {},
  humanDesignerInstructions = {},
  onWorkflowChange,
  onInstructionsChange,
  onSubmitAll,
  isSubmitting = false
}) {
  // Agrupar imagens por workflow
  const imagesByWorkflow = {
    ai: uploadedImages.filter(img => workflowByImage[img.id] === 'ai'),
    human: uploadedImages.filter(img => workflowByImage[img.id] === 'human'),
    unassigned: uploadedImages.filter(img => !workflowByImage[img.id])
  };

  const hasUnassigned = imagesByWorkflow.unassigned.length > 0;
  const canSubmit = !hasUnassigned && uploadedImages.length > 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-semibold">Workflow Summary</h3>
          <Chip 
            color={hasUnassigned ? "warning" : "success"} 
            variant="flat"
            size="sm"
          >
            {hasUnassigned 
              ? `${imagesByWorkflow.unassigned.length} unassigned`
              : "All assigned"
            }
          </Chip>
        </div>
        <p className="text-sm text-default-500">
          Choose processing mode for each image. Add instructions for Human Designer images.
        </p>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Lista de imagens com workflow AI */}
        {imagesByWorkflow.ai.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:zap" className="text-warning-500" />
              <h4 className="font-medium text-sm">AI Assisted Designer ({imagesByWorkflow.ai.length})</h4>
            </div>
            <div className="space-y-1 pl-6">
              {imagesByWorkflow.ai.map(image => (
                <div key={image.id} className="flex items-center justify-between text-sm">
                  <span className="text-default-600 truncate">{image.name}</span>
                  <Button
                    size="sm"
                    variant="light"
                    onPress={() => onWorkflowChange(image.id, 'human')}
                  >
                    Change to Human
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de imagens com workflow Human */}
        {imagesByWorkflow.human.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:palette" className="text-pink-400" />
              <h4 className="font-medium text-sm">Human Designer ({imagesByWorkflow.human.length})</h4>
            </div>
            <div className="space-y-3 pl-6">
              {imagesByWorkflow.human.map(image => (
                <div key={image.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-default-700">{image.name}</span>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => onWorkflowChange(image.id, 'ai')}
                    >
                      Change to AI
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Add detailed instructions for the designer..."
                    value={humanDesignerInstructions[image.id] || ''}
                    onValueChange={(value) => onInstructionsChange(image.id, value)}
                    minRows={2}
                    maxRows={4}
                    size="sm"
                    classNames={{
                      input: "text-sm"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de imagens sem workflow atribuído */}
        {hasUnassigned && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:alert-circle" className="text-warning-500" />
              <h4 className="font-medium text-sm text-warning-600">
                Unassigned ({imagesByWorkflow.unassigned.length})
              </h4>
            </div>
            <div className="space-y-1 pl-6">
              {imagesByWorkflow.unassigned.map(image => (
                <div key={image.id} className="flex items-center justify-between text-sm">
                  <span className="text-default-600 truncate">{image.name}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="flat"
                      color="warning"
                      startContent={<Icon icon="lucide:zap" />}
                      onPress={() => onWorkflowChange(image.id, 'ai')}
                    >
                      AI
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      startContent={<Icon icon="lucide:palette" />}
                      onPress={() => onWorkflowChange(image.id, 'human')}
                    >
                      Human
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão de submit */}
        <div className="pt-4 border-t border-divider">
          <Button
            color="primary"
            size="lg"
            className="w-full"
            onPress={onSubmitAll}
            isDisabled={!canSubmit || isSubmitting}
            isLoading={isSubmitting}
            startContent={!isSubmitting && <Icon icon="lucide:send" />}
          >
            {isSubmitting 
              ? "Processing..." 
              : canSubmit 
                ? `Submit ${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''}`
                : "Assign workflow to all images first"
            }
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

