import React from "react";
import { Card, Button, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone } from "@internationalized/date";
import { SimulationCarousel } from "./SimulationCarousel";

export function StepConfirmDetails({ formData, error, onEditLogo, onDeleteLogo }) {
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

        {/* Logo Instructions Summary - apenas se for projeto Logo */}
        {formData.projectType === "logo" && formData.logoDetails && (() => {
          const logoDetails = formData.logoDetails || {};
          const savedLogos = logoDetails.logos || [];
          const currentLogo = logoDetails.currentLogo || logoDetails;

          // Check if current logo is valid
          const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
          const hasLogoName = currentLogo.logoName?.trim() !== "";
          const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
          const dimensions = currentLogo.dimensions || {};
          const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "";
          const hasLength = dimensions.length?.value != null && dimensions.length.value !== "";
          const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "";
          const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "";
          const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
          const isCurrentLogoValid = hasLogoNumber && hasLogoName && hasRequestedBy && hasAtLeastOneDimension;

          // Combine saved logos with current logo if valid
          const allLogos = isCurrentLogoValid ? [...savedLogos, currentLogo] : savedLogos;

          if (allLogos.length === 0) return null;

          return (
            <Card className="p-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Icon icon="lucide:package" className="text-primary" />
                Logo Specifications {allLogos.length > 1 && `(${allLogos.length} logos)`}
              </h3>
              <Accordion selectionMode="multiple" variant="splitted" className="px-0">
                {allLogos.map((logo, logoIndex) => (
                  <AccordionItem
                    key={logo.id || logoIndex}
                    aria-label={`Logo ${logoIndex + 1}`}
                    title={
                      <div className="flex justify-between items-center flex-1 mr-4">
                        <span className="font-medium text-base text-primary">
                          Logo {logoIndex + 1} {logo.logoName && `- ${logo.logoName}`}
                        </span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => onEditLogo && onEditLogo(logoIndex, isCurrentLogoValid && logoIndex === allLogos.length - 1)}
                            title="Edit Logo"
                          >
                            <Icon icon="lucide:pencil" className="text-default-500" />
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => onDeleteLogo && onDeleteLogo(logoIndex, isCurrentLogoValid && logoIndex === allLogos.length - 1)}
                            title="Delete Logo"
                          >
                            <Icon icon="lucide:trash" />
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-4 pb-2">
                      {/* Identity */}
                      <div>
                        <h4 className="font-medium text-sm text-default-700 mb-2">Project Identity</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-default-500">Logo Number:</span>
                            <p className="font-medium">{logo.logoNumber || "—"}</p>
                          </div>
                          <div>
                            <span className="text-default-500">Logo Name:</span>
                            <p className="font-medium">{logo.logoName || "—"}</p>
                          </div>
                          <div>
                            <span className="text-default-500">Requested By:</span>
                            <p className="font-medium">{logo.requestedBy || "—"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Dimensions */}
                      {(logo.dimensions?.height?.value ||
                        logo.dimensions?.length?.value ||
                        logo.dimensions?.width?.value ||
                        logo.dimensions?.diameter?.value) && (
                          <div>
                            <h4 className="font-medium text-sm text-default-700 mb-2">Dimensions</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              {logo.dimensions?.height?.value && (
                                <div>
                                  <span className="text-default-500">Height:</span>
                                  <p className="font-medium">
                                    {logo.dimensions.height.value}m
                                    {logo.dimensions.height.imperative && " (!)"}
                                  </p>
                                </div>
                              )}
                              {logo.dimensions?.length?.value && (
                                <div>
                                  <span className="text-default-500">Length:</span>
                                  <p className="font-medium">
                                    {logo.dimensions.length.value}m
                                    {logo.dimensions.length.imperative && " (!)"}
                                  </p>
                                </div>
                              )}
                              {logo.dimensions?.width?.value && (
                                <div>
                                  <span className="text-default-500">Width:</span>
                                  <p className="font-medium">
                                    {logo.dimensions.width.value}m
                                    {logo.dimensions.width.imperative && " (!)"}
                                  </p>
                                </div>
                              )}
                              {logo.dimensions?.diameter?.value && (
                                <div>
                                  <span className="text-default-500">Diameter:</span>
                                  <p className="font-medium">
                                    {logo.dimensions.diameter.value}m
                                    {logo.dimensions.diameter.imperative && " (!)"}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                      {/* Fixation & Usage */}
                      <div>
                        <h4 className="font-medium text-sm text-default-700 mb-2">Fixation & Usage</h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-default-500">Usage:</span>
                            <p className="font-medium">
                              {logo.usageOutdoor ? "Outdoor" : "Indoor"}
                            </p>
                          </div>
                          {logo.fixationType && (
                            <div>
                              <span className="text-default-500">Fixation:</span>
                              <p className="font-medium capitalize">
                                {logo.fixationType.replace(/_/g, ' ')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Composition */}
                      {logo.composition && (
                        <div>
                          <h4 className="font-medium text-sm text-default-700 mb-2">Composition</h4>

                          {/* Componentes */}
                          {logo.composition.componentes &&
                            logo.composition.componentes.filter(c => c.referencia).length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-xs font-semibold text-default-600 mb-2 uppercase tracking-wider">
                                  Componentes ({logo.composition.componentes.filter(c => c.referencia).length})
                                </h5>
                                <div className="space-y-2">
                                  {logo.composition.componentes
                                    .filter(comp => comp.referencia)
                                    .map((comp, index) => (
                                      <div key={index} className="text-sm bg-default-50 p-2 rounded border border-default-200">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1">
                                            <p className="font-medium text-default-900">
                                              {comp.componenteNome || `Component ${index + 1}`}
                                            </p>
                                            {comp.corNome && (
                                              <p className="text-xs text-default-600 mt-1">
                                                Color: {comp.corNome}
                                              </p>
                                            )}
                                            {comp.referencia && (
                                              <p className="text-xs text-default-500 mt-1">
                                                Ref: {comp.referencia}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}

                          {/* Bolas */}
                          {logo.composition.bolas &&
                            logo.composition.bolas.length > 0 && (
                              <div>
                                <h5 className="text-xs font-semibold text-default-600 mb-2 uppercase tracking-wider">
                                  Bolas ({logo.composition.bolas.length})
                                </h5>
                                <div className="space-y-2">
                                  {logo.composition.bolas.map((bola, index) => (
                                    <div key={index} className="text-sm bg-default-50 p-2 rounded border border-default-200">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                          <p className="font-medium text-default-900">
                                            Ball {index + 1}
                                          </p>
                                          <div className="text-xs text-default-600 mt-1 space-y-0.5">
                                            {bola.corNome && (
                                              <p>Color: {bola.corNome}</p>
                                            )}
                                            {bola.acabamentoNome && (
                                              <p>Finish: {bola.acabamentoNome}</p>
                                            )}
                                            {bola.tamanhoNome && (
                                              <p>Size: {bola.tamanhoNome}</p>
                                            )}
                                          </div>
                                          {bola.referencia && (
                                            <p className="text-xs text-default-500 mt-1">
                                              Ref: {bola.referencia}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* Mensagem se não houver componentes nem bolas */}
                          {(!logo.composition.componentes ||
                            logo.composition.componentes.length === 0) &&
                            (!logo.composition.bolas ||
                              logo.composition.bolas.length === 0) && (
                              <p className="text-sm text-default-400 italic">No materials added</p>
                            )}
                        </div>
                      )}

                      {/* Description */}
                      {logo.description && (
                        <div>
                          <h4 className="font-medium text-sm text-default-700 mb-2">Description</h4>
                          <p className="text-sm text-default-600">{logo.description}</p>
                        </div>
                      )}

                      {/* Attachments */}
                      {((logo.generatedImage) || (formData.logoDetails?.attachmentFiles && formData.logoDetails.attachmentFiles.length > 0)) && (
                        <div>
                          <h4 className="font-medium text-sm text-default-700 mb-2">Attachments</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* AI Generated Image */}
                            {logo.generatedImage && (
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                                <img
                                  src={logo.generatedImage}
                                  alt="AI Generated"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                  AI Generated
                                </div>
                              </div>
                            )}

                            {/* Uploaded Files */}
                            {formData.logoDetails?.attachmentFiles && formData.logoDetails.attachmentFiles.map((file, index) => {
                              const isImage = file.type?.startsWith('image/');
                              const fileUrl = URL.createObjectURL(file);

                              return (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-default-200">
                                  {isImage ? (
                                    <img
                                      src={fileUrl}
                                      alt={file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-default-100 p-2">
                                      <Icon icon="lucide:file" className="w-8 h-8 text-default-400 mb-2" />
                                      <p className="text-xs text-center text-default-600 truncate w-full px-2">
                                        {file.name}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          );
        })()}

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

