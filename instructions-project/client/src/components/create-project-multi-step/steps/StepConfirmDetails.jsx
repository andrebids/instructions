import React from "react";
import { Card, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone } from "@internationalized/date";
import { SimulationCarousel } from "./SimulationCarousel";

export function StepConfirmDetails({ formData, error }) {
  const hasSimulations = formData.canvasImages && formData.canvasImages.length > 0;
  const simulationCount = formData.canvasImages?.length || 0;
  
  const handleCreatePresentation = () => {
    // Placeholder - será implementado depois com template
    console.log('Create Presentation clicked - placeholder');
  };
  
  const handleExportMovie = () => {
    // Placeholder - será implementado depois
    console.log('Export AI Movie clicked - placeholder');
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Confirm Details</h2>
      <p className="text-sm sm:text-base text-default-500">
        Please review the information before creating the project.
      </p>
      
      <div className="space-y-6">
        {/* Project Details Card */}
        <Card className="p-4">
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <Icon icon="lucide:folder" className="text-primary" />
            Project Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-default-500">Name:</span>
              <p className="font-medium">{formData.name || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Type:</span>
              <p className="font-medium capitalize">
                {formData.projectType 
                  ? formData.projectType 
                  : "Not specified (will use 'decor' as default)"}
              </p>
            </div>
            {formData.projectType === "simu" && (
              <div className="col-span-2">
                <span className="text-default-500">Simu mode:</span>
                <p className="font-medium">
                  {formData.simuWorkflow === "ai"
                    ? "AI Assisted Designer"
                    : formData.simuWorkflow === "human"
                    ? "Send to Human Designer"
                    : "—"}
                </p>
              </div>
            )}
            <div>
              <span className="text-default-500">Client:</span>
              <p className="font-medium">{formData.clientName || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Status:</span>
              <p className="font-medium">Created</p>
            </div>
            <div>
              <span className="text-default-500">Client Email:</span>
              <p className="font-medium">{formData.clientEmail || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">Client Phone:</span>
              <p className="font-medium">{formData.clientPhone || "—"}</p>
            </div>
            <div>
              <span className="text-default-500">End Date:</span>
              <p className="font-medium">
                {formData.endDate 
                  ? formData.endDate.toDate(getLocalTimeZone()).toLocaleDateString() 
                  : "—"}
              </p>
            </div>
            <div>
              <span className="text-default-500">Budget:</span>
              <p className="font-medium">
                {formData.budget 
                  ? `€${parseFloat(formData.budget).toLocaleString()}` 
                  : "—"}
              </p>
            </div>
          </div>
        </Card>
        
        {/* AI Generated Simulations Card - apenas se for AI workflow e houver simulações */}
        {formData.projectType === "simu" && formData.simuWorkflow === "ai" && hasSimulations && (
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon icon="lucide:sparkles" className="text-primary" />
              AI Generated Simulations
            </h3>
            <div className="space-y-4">
              <div>
                <span className="text-default-500">Simulations Generated:</span>
                <p className="font-medium">
                  {simulationCount} simulation{simulationCount !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Carrossel de Simulações */}
              <SimulationCarousel
                canvasImages={formData.canvasImages}
                decorationsByImage={formData.decorationsByImage || {}}
              />
            </div>
          </Card>
        )}
        
        {/* Export Options Card */}
        {formData.projectType === "simu" && formData.simuWorkflow === "ai" && (
          <Card className="p-4">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Icon icon="lucide:download" className="text-primary" />
              Export Options
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Icon icon="lucide:file-text" />}
                  onPress={handleCreatePresentation}
                  className="flex-1"
                >
                  Create Presentation
                </Button>
                <div className="flex gap-2">
                  <Button
                    color="default"
                    variant="flat"
                    startContent={<Icon icon="lucide:file" />}
                    onPress={handleCreatePresentation}
                  >
                    PDF
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    startContent={<Icon icon="lucide:presentation" />}
                    onPress={handleCreatePresentation}
                  >
                    PowerPoint
                  </Button>
                </div>
              </div>
              
              {hasSimulations && (
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<Icon icon="lucide:video" />}
                  onPress={handleExportMovie}
                  className="w-full"
                >
                  Export AI Movie (with simulations)
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600">
          <Icon icon="lucide:alert-circle" className="inline mr-2" />
          {error}
        </div>
      )}
    </div>
  );
}

