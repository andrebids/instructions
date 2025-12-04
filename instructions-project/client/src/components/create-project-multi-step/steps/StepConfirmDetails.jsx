import React, { useMemo } from "react";
import { Card, Button, Accordion, AccordionItem } from "@heroui/react";
import { Icon } from "@iconify/react";
import { getLocalTimeZone } from "@internationalized/date";
import { SimulationCarousel } from "./SimulationCarousel";

export function StepConfirmDetails({ formData, error, onEditLogo, onDeleteLogo, onAddLogo }) {
  const hasSimulations = formData.canvasImages && formData.canvasImages.length > 0;
  const simulationCount = formData.canvasImages?.length || 0;

  // Memoize logo calculations to prevent unnecessary recalculations
  const logoData = useMemo(() => {
    if (formData.projectType !== "logo" || !formData.logoDetails) {
      return null;
    }

    const logoDetails = formData.logoDetails || {};
    const savedLogos = logoDetails.logos || [];
    const currentLogo = logoDetails.currentLogo || logoDetails;

    // Check if current logo is valid
    // IMPORTANTE: Verificar se o currentLogo não está vazio (foi limpo após salvar)
    // Um logo vazio tem todos os campos principais vazios
    const isCurrentLogoEmpty = (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "") && 
                               (!currentLogo.logoName || currentLogo.logoName.trim() === "") && 
                               (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "");
    
    const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
    const hasLogoName = currentLogo.logoName?.trim() !== "";
    const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
    const dimensions = currentLogo.dimensions || {};
    // Verificar se há dimensões válidas (não vazias e não null)
    const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && dimensions.height.value !== 0;
    const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && dimensions.length.value !== 0;
    const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && dimensions.width.value !== 0;
    const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && dimensions.diameter.value !== 0;
    const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
    
    // Só considerar válido se não estiver vazio E tiver todos os campos obrigatórios
    const isCurrentLogoValid = !isCurrentLogoEmpty && hasLogoNumber && hasLogoName && hasRequestedBy && hasAtLeastOneDimension;

    // Verificar se o currentLogo já existe nos savedLogos (para evitar duplicatas)
    const currentLogoExistsInSaved = isCurrentLogoValid && savedLogos.some(logo => {
      // Comparar por ID se disponível (mais confiável)
      if (currentLogo.id && logo.id) {
        return logo.id === currentLogo.id;
      }
      // Se não tem ID, comparar por logoNumber
      if (currentLogo.logoNumber && logo.logoNumber) {
        return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
      }
      return false;
    });

    // Combine saved logos with current logo if valid AND not already in savedLogos
    const allLogos = isCurrentLogoValid && !currentLogoExistsInSaved 
      ? [...savedLogos, currentLogo] 
      : savedLogos;

    return {
      logoDetails,
      savedLogos,
      currentLogo,
      isCurrentLogoValid,
      allLogos
    };
  }, [formData.projectType, formData.logoDetails]);

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
                    <Icon icon="lucide:folder" className="text-primary" aria-hidden="true" />
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
                    <Icon icon="lucide:sparkles" className="text-primary" aria-hidden="true" />
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
        {logoData && logoData.allLogos.length > 0 && (() => {
          const { logoDetails, isCurrentLogoValid, allLogos } = logoData;

          return (
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Icon icon="lucide:package" className="text-primary" aria-hidden="true" />
                    Logo Specifications {allLogos.length > 1 && `(${allLogos.length} logos)`}
                  </h3>
                {onAddLogo && (
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Icon icon="lucide:plus" className="w-4 h-4" aria-hidden="true" />}
                    onPress={onAddLogo}
                    aria-label="Add new logo"
                  >
                    Add Logo
                  </Button>
                )}
              </div>
              <Accordion selectionMode="multiple" variant="splitted" className="px-0" aria-label="Logo specifications list">
                {allLogos.map((logo, logoIndex) => (
                  <AccordionItem
                    key={logo.id ? `logo-${logo.id}-${logoIndex}` : `logo-index-${logoIndex}-${logo.logoNumber || ''}`}
                    aria-label={`Logo ${logoIndex + 1}: ${logo.logoName || logo.logoNumber || 'Unnamed'}`}
                    title={
                      <div className="flex justify-between items-center flex-1 mr-4">
                        <span className="font-medium text-base text-primary">
                          Logo {logoIndex + 1} {logo.logoName && `- ${logo.logoName}`}
                        </span>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label="Edit Logo"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log("=== CLICKED EDIT BUTTON ===");
                              console.log("Logo index:", logoIndex);
                              console.log("Logo data:", { logoNumber: logo.logoNumber, logoName: logo.logoName, id: logo.id });
                              console.log("AllLogos:", allLogos.map((l, i) => ({ index: i, logoNumber: l.logoNumber, logoName: l.logoName, id: l.id })));
                              console.log("Is current:", isCurrentLogoValid && logoIndex === allLogos.length - 1);
                              // Passar o logo completo ou identificador único em vez de apenas o índice
                              onEditLogo && onEditLogo(logoIndex, isCurrentLogoValid && logoIndex === allLogos.length - 1, logo);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                onEditLogo && onEditLogo(logoIndex, isCurrentLogoValid && logoIndex === allLogos.length - 1, logo);
                              }
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-default-500 rounded-lg hover:bg-default-100 active:bg-default-200 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          >
                            <Icon icon="lucide:pencil" className="text-default-500" aria-hidden="true" />
                          </div>
                          <div
                            role="button"
                            tabIndex={0}
                            aria-label={`Delete logo: ${logo.logoName || logo.logoNumber || `Logo ${logoIndex + 1}`}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              if (window.confirm(`Tem certeza que deseja eliminar o logo "${logo.logoName || logo.logoNumber || `Logo ${logoIndex + 1}`}"?`)) {
                                onDeleteLogo && onDeleteLogo(logoIndex, isCurrentLogoValid && logoIndex === allLogos.length - 1);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation();
                                e.preventDefault();
                                if (window.confirm(`Tem certeza que deseja eliminar o logo "${logo.logoName || logo.logoNumber || `Logo ${logoIndex + 1}`}"?`)) {
                                  onDeleteLogo && onDeleteLogo(logoIndex, isCurrentLogoValid && logoIndex === allLogos.length - 1);
                                }
                              }
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 text-danger rounded-lg hover:bg-danger-50 active:bg-danger-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-2"
                            title="Eliminar logo"
                          >
                            <Icon icon="lucide:trash-2" className="w-4 h-4" aria-hidden="true" />
                          </div>
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
                                  Components ({logo.composition.componentes.filter(c => c.referencia).length})
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
                                                Reference: {comp.referencia}
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
                                  Balls ({logo.composition.bolas.length})
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
                                              Reference: {bola.referencia}
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
                      {((logo.generatedImage) || (logo.attachmentFiles && logo.attachmentFiles.length > 0)) && (
                        <div>
                          <h4 className="font-medium text-sm text-default-700 mb-2">Attachments</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* AI Generated Image */}
                            {logo.generatedImage && (
                              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary">
                                <img
                                  src={(() => {
                                    // Construir URL - sempre usar caminhos relativos para o proxy do Vite funcionar
                                    let imageUrl = logo.generatedImage;
                                    
                                    // Se for URL absoluta, extrair apenas o caminho
                                    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                                      try {
                                        const urlObj = new URL(imageUrl);
                                        imageUrl = urlObj.pathname; // Usar apenas o caminho (proxy do Vite resolve)
                                      } catch (e) {
                                        const match = imageUrl.match(/\/api\/[^\s]+/);
                                        if (match) imageUrl = match[0];
                                      }
                                    }
                                    
                                    // Se for caminho UNC do Windows, extrair nome do arquivo
                                    if (imageUrl && (imageUrl.startsWith('\\\\') || imageUrl.startsWith('//'))) {
                                      const filename = imageUrl.split(/[\\/]/).pop();
                                      if (filename) imageUrl = `/api/files/${filename}`;
                                    }
                                    
                                    // Garantir que começa com /api/
                                    if (imageUrl && !imageUrl.startsWith('/api/') && imageUrl.startsWith('/')) {
                                      imageUrl = `/api${imageUrl}`;
                                    } else if (imageUrl && !imageUrl.startsWith('/')) {
                                      imageUrl = `/api/files/${imageUrl}`;
                                    }
                                    
                                    return imageUrl;
                                  })()}
                                  alt="AI Generated"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                  AI Generated
                                </div>
                              </div>
                            )}

                            {/* Uploaded Files */}
                            {logo.attachmentFiles && logo.attachmentFiles.map((file, index) => {
                              const isImage = file.type?.startsWith('image/') || file.mimetype?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                              
                              // Construir URL - sempre usar caminhos relativos para o proxy do Vite funcionar
                              let fileUrl = file.url || file.path;
                              let needsCleanup = false;
                              
                              if (!fileUrl && (file instanceof File || file instanceof Blob)) {
                                try {
                                  fileUrl = URL.createObjectURL(file);
                                  needsCleanup = true;
                                } catch (e) {
                                  console.warn('Error creating object URL:', e);
                                  fileUrl = null;
                                }
                              }
                              
                              // Se for URL absoluta, extrair apenas o caminho
                              if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
                                try {
                                  const urlObj = new URL(fileUrl);
                                  fileUrl = urlObj.pathname; // Usar apenas o caminho (proxy do Vite resolve)
                                } catch (e) {
                                  const match = fileUrl.match(/\/api\/[^\s]+/);
                                  if (match) fileUrl = match[0];
                                }
                              }
                              
                              // Se for caminho UNC do Windows, extrair nome do arquivo
                              if (fileUrl && (fileUrl.startsWith('\\\\') || fileUrl.startsWith('//'))) {
                                const filename = fileUrl.split(/[\\/]/).pop();
                                if (filename) fileUrl = `/api/files/${filename}`;
                              }
                              
                              // Garantir que começa com /api/
                              if (fileUrl && !fileUrl.startsWith('/api/') && fileUrl.startsWith('/') && !fileUrl.startsWith('blob:')) {
                                fileUrl = `/api${fileUrl}`;
                              } else if (fileUrl && !fileUrl.startsWith('/') && !fileUrl.startsWith('blob:')) {
                                fileUrl = `/api/files/${fileUrl}`;
                              }

                              return (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-default-200">
                                  {isImage && fileUrl ? (
                                    <img
                                      src={fileUrl}
                                      alt={file.name || 'Attachment'}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        if (needsCleanup && fileUrl) {
                                          URL.revokeObjectURL(fileUrl);
                                        }
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-default-100 p-2">
                                      <Icon icon="lucide:file" className="w-8 h-8 text-default-400 mb-2" />
                                      <p className="text-xs text-center text-default-600 truncate w-full px-2">
                                        {file.name || 'File'}
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
                    <Icon icon="lucide:download" className="text-primary" aria-hidden="true" />
                    Export Options
                  </h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<Icon icon="lucide:file-text" aria-hidden="true" />}
                  onPress={handleCreatePresentation}
                  className="flex-1"
                  aria-label="Create presentation"
                >
                  Create Presentation
                </Button>
                <div className="flex gap-2">
                  <Button
                    color="default"
                    variant="flat"
                    startContent={<Icon icon="lucide:file" aria-hidden="true" />}
                    onPress={handleCreatePresentation}
                    aria-label="Export as PDF"
                  >
                    PDF
                  </Button>
                  <Button
                    color="default"
                    variant="flat"
                    startContent={<Icon icon="lucide:presentation" aria-hidden="true" />}
                    onPress={handleCreatePresentation}
                    aria-label="Export as PowerPoint"
                  >
                    PowerPoint
                  </Button>
                </div>
              </div>

              {hasSimulations && (
                <Button
                  color="secondary"
                  variant="flat"
                  startContent={<Icon icon="lucide:video" aria-hidden="true" />}
                  onPress={handleExportMovie}
                  className="w-full"
                  aria-label="Export AI movie with simulations"
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
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-danger-600" role="alert" aria-live="polite">
          <Icon icon="lucide:alert-circle" className="inline mr-2" aria-hidden="true" />
          {error}
        </div>
      )}
    </div>
  );
}

