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
              <div className="space-y-6">
                {allLogos.map((logo, logoIndex) => (
                  <div key={logo.id || logoIndex} className={logoIndex > 0 ? "border-t border-default-200 pt-4" : ""}>
                    {allLogos.length > 1 && (
                      <h4 className="font-medium text-base mb-3 text-primary">
                        Logo {logoIndex + 1} {logo.logoName && `- ${logo.logoName}`}
                      </h4>
                    )}
                    <div className="space-y-4">
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
                           logo.composition.componentes.length > 0 && (
                            <div className="mb-4">
                              <h5 className="text-xs font-semibold text-default-600 mb-2 uppercase tracking-wider">
                                Componentes ({logo.composition.componentes.length})
                              </h5>
                              <div className="space-y-2">
                                {logo.composition.componentes.map((comp, index) => (
                                  <div key={index} className="text-sm bg-default-50 p-2 rounded border border-default-200">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        <p className="font-medium text-default-900">
                                          {comp.componenteNome || `Componente ${index + 1}`}
                                        </p>
                                        {comp.corNome && (
                                          <p className="text-xs text-default-600 mt-1">
                                            Cor: {comp.corNome}
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
                                          Bola {index + 1}
                                        </p>
                                        <div className="text-xs text-default-600 mt-1 space-y-0.5">
                                          {bola.corNome && (
                                            <p>Cor: {bola.corNome}</p>
                                          )}
                                          {bola.acabamentoNome && (
                                            <p>Acabamento: {bola.acabamentoNome}</p>
                                          )}
                                          {bola.tamanhoNome && (
                                            <p>Tamanho: {bola.tamanhoNome}</p>
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
                            <p className="text-sm text-default-400 italic">Nenhum material adicionado</p>
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
                      {logo.attachmentFiles && logo.attachmentFiles.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-default-700 mb-2">Attachments</h4>
                          <p className="text-sm text-default-600">
                            {logo.attachmentFiles.length} file(s) attached
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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

