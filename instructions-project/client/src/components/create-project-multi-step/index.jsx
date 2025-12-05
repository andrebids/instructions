import React, { useEffect, useMemo, useRef } from "react";
import { Card, Button, DatePicker } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";
import { useTranslation } from "react-i18next";

// Hooks
import { useProjectForm } from "./hooks/useProjectForm";
import { useClientManagement } from "./hooks/useClientManagement";
import { useStepNavigation } from "./hooks/useStepNavigation";
import { useSaveStatus } from "./hooks/useSaveStatus";

// Components
import { StepIndicator } from "./components/StepIndicator";
import { NavigationFooter } from "./components/NavigationFooter";
import { AddClientModal } from "./components/AddClientModal";
import { SaveStatus } from "./components/SaveStatus";

// Steps
import { StepProjectDetails } from "./steps/StepProjectDetails";
import { StepNotes } from "./steps/StepNotes";
import { StepProjectType } from "./steps/StepProjectType";
import { StepAIDesigner } from "./steps/StepAIDesigner";
import { StepLogoInstructions } from "./steps/StepLogoInstructions";
import { StepConfirmDetails } from "./steps/StepConfirmDetails";

// Utils & Constants
import { STEPS } from "./constants";
import { getVisibleSteps } from "./utils/stepHelpers";
import { logger } from "./utils/logger";
import { Scroller } from "../ui/scroller";

// 🧪 Breakpoint de Teste 5 (Componente Principal)
const TEST_BREAKPOINT_5 = false;

export function CreateProjectMultiStep({ onClose, selectedImage, projectId, initialStep, logoIndex }) {
  // Initialize hooks
  const { t } = useTranslation();
  const saveStatus = useSaveStatus();
  const formState = useProjectForm(onClose, projectId, saveStatus, logoIndex);
  const clientState = useClientManagement(formState.setFormData);

  // Verificar se estamos editando apenas um logo (modo simplificado)
  const isLogoEditOnlyMode = useMemo(() => {
    return initialStep === 'logo-instructions' && logoIndex !== null && logoIndex !== undefined;
  }, [initialStep, logoIndex]);

  // Get visible steps based on project type
  // Se estamos no modo de edição apenas de logo, mostrar apenas esse passo
  const visibleSteps = useMemo(() => {
    if (isLogoEditOnlyMode) {
      // Retornar apenas o passo logo-instructions
      return STEPS.filter(step => step.id === 'logo-instructions');
    }
    return getVisibleSteps(formState.formData, STEPS);
  }, [formState.formData, isLogoEditOnlyMode]);

  // Debug: verificar initialStep e visibleSteps (apenas uma vez quando initialStep é fornecido)
  const initialStepCheckedRef = useRef(false);
  useEffect(() => {
    if (initialStep && !initialStepCheckedRef.current && visibleSteps.length > 0) {
      console.log('📋 CreateProjectMultiStep: initialStep recebido:', initialStep);
      console.log('📋 VisibleSteps disponíveis:', visibleSteps.map(s => s.id));
      const stepExists = visibleSteps.some(s => s.id === initialStep);
      console.log('📋 Step existe nos visibleSteps?', stepExists);
      initialStepCheckedRef.current = true;
    }
  }, [initialStep, visibleSteps.length]); // Usar apenas length para evitar re-execuções

  const navigation = useStepNavigation(formState.formData, visibleSteps, formState.createTempProject, initialStep);

  // 🔄 Lifecycle logging
  useEffect(() => {
    logger.lifecycle('CreateProjectMultiStep', 'Component mounted', {
      hasOnClose: !!onClose,
      totalSteps: STEPS.length,
      visibleSteps: visibleSteps.length,
      isLogoEditOnlyMode
    });

    // Logs de teste removidos

    return () => {
      logger.lifecycle('CreateProjectMultiStep', 'Component unmounting');
    };
  }, [isLogoEditOnlyMode]);

  // Log quando steps visíveis mudam
  useEffect(() => {
    logger.lifecycle('CreateProjectMultiStep', 'Visible steps changed', {
      count: visibleSteps.length,
      stepIds: visibleSteps.map(s => s.id),
      projectType: formState.formData.projectType
    });
  }, [visibleSteps.length, formState.formData.projectType]);

  // Set default end date
  useEffect(() => {
    if (!formState.formData.endDate) {
      const base = today(getLocalTimeZone());
      formState.handleInputChange("endDate", base.add({ days: 7 }));
    }
  }, []);

  // Check if current step is AI Designer
  const isAIDesignerStep = () => {
    const currentVisibleStep = visibleSteps[navigation.currentStep - 1];
    return currentVisibleStep?.id === "ai-designer";
  };

  // Helper to check if a logo is valid
  const isLogoValid = (logo) => {
    if (!logo) return false;
    const hasLogoNumber = logo.logoNumber?.trim() !== "";
    const hasLogoName = logo.logoName?.trim() !== "";
    const hasDescription = logo.description?.trim() !== "";
    const hasRequestedBy = logo.requestedBy?.trim() !== "";
    const hasFixationType = logo.fixationType?.trim() !== "";
    const dimensions = logo.dimensions || {};
    // Aceitar valores numéricos válidos (incluindo 0)
    // Verificar se o valor existe, não é null, não é string vazia, e é um número válido >= 0
    const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && !isNaN(parseFloat(dimensions.height.value)) && parseFloat(dimensions.height.value) >= 0;
    const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && !isNaN(parseFloat(dimensions.length.value)) && parseFloat(dimensions.length.value) >= 0;
    const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && !isNaN(parseFloat(dimensions.width.value)) && parseFloat(dimensions.width.value) >= 0;
    const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && !isNaN(parseFloat(dimensions.diameter.value)) && parseFloat(dimensions.diameter.value) >= 0;
    const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
    return hasLogoNumber && hasLogoName && hasDescription && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
  };

  const handleDeleteLogo = (index, isCurrent) => {
    const logoDetails = formState.formData.logoDetails || {};
    const savedLogos = logoDetails.logos || [];

    if (isCurrent) {
      // Reset current logo
      formState.handleInputChange("logoDetails", {
        ...logoDetails,
        currentLogo: {
          logoNumber: "",
          logoName: "",
          requestedBy: "",
          dimensions: {},
          usageOutdoor: false,
          usageIndoor: true,
          fixationType: "",
          lacqueredStructure: false,
          lacquerColor: "",
          mastDiameter: "",
          maxWeightConstraint: false,
          maxWeight: "",
          ballast: false,
          controlReport: false,
          criteria: "",
          description: "",
          composition: {
            componentes: [],
            bolas: []
          }
        }
      });
    } else {
      // Remove from saved logos
      const newSavedLogos = savedLogos.filter((_, i) => i !== index);
      formState.handleInputChange("logoDetails", {
        ...logoDetails,
        logos: newSavedLogos
      });
    }
  };

  const handleAddLogo = () => {
    const logoDetails = formState.formData.logoDetails || {};
    const savedLogos = logoDetails.logos || [];
    const currentLogo = logoDetails.currentLogo || logoDetails;

    // Se o currentLogo é válido, salvá-lo antes de criar um novo
    if (isLogoValid(currentLogo)) {
      const logoToSave = {
        ...currentLogo,
        id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        savedAt: new Date().toISOString()
      };

      // Atualizar estado com logo salvo e novo currentLogo vazio
      formState.handleInputChange("logoDetails", {
        ...logoDetails,
        logos: [...savedLogos, logoToSave],
        currentLogo: {
          logoNumber: "",
          logoName: "",
          requestedBy: "",
          dimensions: {},
          usageOutdoor: false,
          usageIndoor: true,
          fixationType: "",
          lacqueredStructure: false,
          lacquerColor: "",
          mastDiameter: "",
          maxWeightConstraint: false,
          maxWeight: "",
          ballast: false,
          controlReport: false,
          criteria: "",
          description: "",
          composition: {
            componentes: [],
            bolas: []
          },
          attachmentFiles: [],
          isModification: false,
          baseProductId: null,
          baseProduct: null,
          relatedProducts: [],
          productSizes: []
        }
      });
    } else {
      // Se currentLogo não é válido, apenas limpar para criar novo
      formState.handleInputChange("logoDetails", {
        ...logoDetails,
        currentLogo: {
          logoNumber: "",
          logoName: "",
          requestedBy: "",
          dimensions: {},
          usageOutdoor: false,
          usageIndoor: true,
          fixationType: "",
          lacqueredStructure: false,
          lacquerColor: "",
          mastDiameter: "",
          maxWeightConstraint: false,
          maxWeight: "",
          ballast: false,
          controlReport: false,
          criteria: "",
          description: "",
          composition: {
            componentes: [],
            bolas: []
          },
          attachmentFiles: [],
          isModification: false,
          baseProductId: null,
          baseProduct: null,
          relatedProducts: [],
          productSizes: []
        }
      });
    }

    // Navegar para o step de logo-instructions
    const logoStepIndex = visibleSteps.findIndex(s => s.id === 'logo-instructions');
    if (logoStepIndex >= 0) {
      navigation.setCurrentStep(logoStepIndex + 1);
    }
  };

  const handleEditLogo = (index, isCurrent, logoData = null) => {
    const logoDetails = formState.formData.logoDetails || {};
    const savedLogos = logoDetails.logos || [];
    const currentLogo = logoDetails.currentLogo || logoDetails; // Fallback for structure

    // Verificar se currentLogo é válido para determinar a estrutura de allLogos
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

    // Construir allLogos da mesma forma que StepConfirmDetails
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
    
    const allLogos = isCurrentLogoValid && !currentLogoExistsInSaved 
      ? [...savedLogos, currentLogo] 
      : savedLogos;

    if (isCurrent || (isCurrentLogoValid && index === allLogos.length - 1)) {
      // Already in currentLogo, just navigate
      const logoStepIndex = visibleSteps.findIndex(s => s.id === 'logo-instructions');
      if (logoStepIndex >= 0) {
        navigation.setCurrentStep(logoStepIndex + 1);
      }
    } else {
      // It's a saved logo. We need to swap it into currentLogo.
      // IMPORTANTE: Usar logoData se fornecido (mais confiável que índice), senão usar índice
      let logoToEdit;
      
      if (logoData) {
        // Usar o logo passado diretamente, mas encontrar a versão completa nos savedLogos ou allLogos
        console.log("=== EDITING LOGO (using logoData) ===");
        console.log("LogoData received:", { logoNumber: logoData.logoNumber, logoName: logoData.logoName, id: logoData.id });
        
        // IMPORTANTE: Buscar primeiro em allLogos (que inclui savedLogos + currentLogo)
        // Isso garante que encontramos a versão mais completa do logo
        const foundInAll = allLogos.find(logo => {
          // Priorizar comparação por ID (mais confiável)
          if (logo.id && logoData.id) {
            return logo.id === logoData.id;
          }
          // Se não tem ID, comparar por logoNumber
          if (logo.logoNumber && logoData.logoNumber) {
            return logo.logoNumber.trim() === logoData.logoNumber.trim();
          }
          return false;
        });
        
        if (foundInAll) {
          logoToEdit = foundInAll;
          console.log("Found logo in allLogos:", { logoNumber: logoToEdit.logoNumber, logoName: logoToEdit.logoName, id: logoToEdit.id });
        } else {
          // Se não encontrou, usar logoData diretamente (pode ser uma versão parcial)
          logoToEdit = logoData;
          console.log("Using logoData directly (not found in allLogos)");
        }
      } else {
        // Fallback: usar índice (menos confiável)
        console.log("=== EDITING LOGO (using index) ===");
        logoToEdit = allLogos[index];
        if (!logoToEdit) {
          console.error("Logo not found at index:", index, "allLogos length:", allLogos.length);
          return;
        }
      }
      
      console.log("Index clicked:", index);
      console.log("AllLogos:", allLogos.map((l, i) => ({ index: i, logoNumber: l.logoNumber, logoName: l.logoName, id: l.id })));
      console.log("Logo to edit:", { logoNumber: logoToEdit?.logoNumber, logoName: logoToEdit?.logoName, id: logoToEdit?.id });
      console.log("CurrentLogo before edit:", { logoNumber: currentLogo?.logoNumber, logoName: currentLogo?.logoName, id: currentLogo?.id });
      console.log("SavedLogos:", savedLogos.map((l, i) => ({ index: i, logoNumber: l.logoNumber, logoName: l.logoName, id: l.id })));
      
      if (!logoToEdit) {
        console.error("Logo to edit not found. Index:", index, "allLogos length:", allLogos.length, "logoData:", logoData);
        return;
      }

      // IMPORTANTE: Se o logo clicado é o currentLogo (último na lista allLogos), não precisa procurar nos savedLogos
      // Caso contrário, encontrar o índice real no savedLogos usando ID ou logoNumber
      let newSavedLogos = [...savedLogos];
      const isCurrentLogoClicked = isCurrentLogoValid && index === allLogos.length - 1;
      
      // Guardar a posição original do logo que está sendo editado (para restaurar depois)
      let originalLogoIndex = -1;
      
      if (!isCurrentLogoClicked) {
        // Encontrar o índice real no savedLogos usando ID ou logoNumber
        const savedLogoIndex = savedLogos.findIndex(logo => {
          // Comparar por ID se ambos tiverem
          if (logo.id && logoToEdit.id) {
            return logo.id === logoToEdit.id;
          }
          // Comparar por logoNumber se ambos tiverem
          if (logo.logoNumber && logoToEdit.logoNumber) {
            return logo.logoNumber.trim() === logoToEdit.logoNumber.trim();
          }
          // Comparar por logoName como fallback
          if (logo.logoName && logoToEdit.logoName) {
            return logo.logoName.trim() === logoToEdit.logoName.trim();
          }
          return false;
        });

        originalLogoIndex = savedLogoIndex;
        console.log("Found logo in savedLogos at index:", savedLogoIndex, "savedLogos length:", savedLogos.length);
        
        // Se encontrou o logo nos savedLogos, removê-lo
        // IMPORTANTE: Guardar o índice ANTES de remover, porque depois de remover os índices mudam
        if (savedLogoIndex >= 0) {
          newSavedLogos = newSavedLogos.filter((_, i) => i !== savedLogoIndex);
          console.log("Removed logo from savedLogos, new length:", newSavedLogos.length, "originalIndex preserved:", originalLogoIndex);
        } else {
          console.warn("Logo not found in savedLogos, may be currentLogo or invalid index");
          // Se não encontrou, pode ser que o logo esteja no currentLogo
          // Nesse caso, o originalIndex seria o índice no allLogos (que inclui currentLogo)
          originalLogoIndex = index;
        }
      } else {
        console.log("Current logo was clicked, no need to remove from savedLogos");
        // Se é o currentLogo, a posição original seria o índice no allLogos
        // Mas como currentLogo não está nos savedLogos, o originalIndex deve ser undefined
        // ou o índice no allLogos se quisermos adicionar no final
        originalLogoIndex = savedLogos.length; // Posição seria no final dos savedLogos
      }

      // IMPORTANTE: Só salvar o currentLogo anterior se ele for válido E diferente do logo que está sendo editado
      // Isso evita criar logos duplicados quando você está apenas editando
      if (isLogoValid(currentLogo) && !isCurrentLogoClicked) {
        // Verificar se o currentLogo já está nos savedLogos (para evitar duplicados)
        const currentLogoIndexInSaved = newSavedLogos.findIndex(logo => {
          if (currentLogo.id && logo.id) {
            return logo.id === currentLogo.id;
          }
          if (logo.logoNumber && currentLogo.logoNumber) {
            return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
          }
          return false;
        });
        
        // Verificar se o currentLogo é diferente do logo que está sendo editado
        const isDifferentFromLogoToEdit = 
          (currentLogo.id && logoToEdit.id && currentLogo.id !== logoToEdit.id) ||
          (!currentLogo.id && !logoToEdit.id && currentLogo.logoNumber && logoToEdit.logoNumber && 
           currentLogo.logoNumber.trim() !== logoToEdit.logoNumber.trim());
        
        // Se o currentLogo já está nos savedLogos, atualizar no lugar (não adicionar novo)
        if (currentLogoIndexInSaved >= 0 && isDifferentFromLogoToEdit) {
          // Atualizar o logo existente no lugar
          const logoToSave = {
            ...currentLogo,
            id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            savedAt: currentLogo.savedAt || new Date().toISOString()
          };
          newSavedLogos[currentLogoIndexInSaved] = logoToSave;
          console.log("Updated currentLogo in savedLogos at index:", currentLogoIndexInSaved, { logoNumber: logoToSave.logoNumber, logoName: logoToSave.logoName, id: logoToSave.id });
        } else if (currentLogoIndexInSaved < 0 && isDifferentFromLogoToEdit) {
          // IMPORTANTE: Se não está nos savedLogos, inserir na posição original do logo que está sendo editado
          // Isso preserva a ordem dos logos
          const logoToSave = {
            ...currentLogo,
            id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            savedAt: currentLogo.savedAt || new Date().toISOString()
          };
          
          // Se sabemos a posição original, inserir lá (mas não depois de remover o logo a editar)
          // Se originalLogoIndex >= 0, inserir nessa posição (mas ajustar se necessário)
          if (originalLogoIndex >= 0 && originalLogoIndex < newSavedLogos.length) {
            newSavedLogos.splice(originalLogoIndex, 0, logoToSave);
            console.log("Inserted currentLogo at original position:", originalLogoIndex, { logoNumber: logoToSave.logoNumber, logoName: logoToSave.logoName, id: logoToSave.id });
          } else {
            // Se não sabemos a posição ou está fora dos limites, adicionar no final
            newSavedLogos.push(logoToSave);
            console.log("Added currentLogo to end of savedLogos:", { logoNumber: logoToSave.logoNumber, logoName: logoToSave.logoName, id: logoToSave.id });
          }
        }
      }

      // Update state - mover logo a editar para currentLogo
      // IMPORTANTE: Garantir que estamos passando o logo correto, não uma referência que pode mudar
      // E garantir que o logo mantém seu ID original para que possa ser atualizado corretamente quando salvo
      const logoToEditCopy = { 
        ...logoToEdit,
        // IMPORTANTE: Manter o ID original do logo que está sendo editado
        // Se o logo não tem ID, criar um novo (mas isso só deve acontecer se for um logo novo)
        // Se o logo já tem ID, preservá-lo para que possa ser atualizado corretamente quando salvo
        id: logoToEdit.id || (logoToEdit.logoNumber ? `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : undefined),
        // IMPORTANTE: Guardar a posição original para restaurar quando salvar
        _originalIndex: originalLogoIndex >= 0 ? originalLogoIndex : undefined
      };
      
      // Garantir que o logo tenha todas as propriedades necessárias
      if (!logoToEditCopy.savedAt && logoToEdit.savedAt) {
        logoToEditCopy.savedAt = logoToEdit.savedAt;
      }
      
      console.log("=== SETTING CURRENT LOGO FOR EDITING ===");
      console.log("Logo to edit copy:", { 
        logoNumber: logoToEditCopy.logoNumber, 
        logoName: logoToEditCopy.logoName, 
        id: logoToEditCopy.id,
        savedAt: logoToEditCopy.savedAt,
        originalIndex: logoToEditCopy._originalIndex
      });
      console.log("New savedLogos after removing logo to edit:", newSavedLogos.map((l, i) => ({ 
        index: i, 
        logoNumber: l.logoNumber, 
        logoName: l.logoName, 
        id: l.id 
      })));
      
      formState.handleInputChange("logoDetails", {
        ...logoDetails,
        logos: newSavedLogos,
        currentLogo: logoToEditCopy
      });

      // Navigate
      const logoStepIndex = visibleSteps.findIndex(s => s.id === 'logo-instructions');
      if (logoStepIndex >= 0) {
        navigation.setCurrentStep(logoStepIndex + 1);
      }
    }
  };

  // Render current step
  const renderStepContent = () => {
    const currentVisibleStep = visibleSteps[navigation.currentStep - 1];

    // Logs de teste removidos

    switch (currentVisibleStep?.id) {
      case "project-details":
        return (
          <StepProjectDetails
            formData={formState.formData}
            clients={clientState.clients}
            onInputChange={formState.handleInputChange}
            onClientSelect={clientState.handleClientSelection}
            onClientInputChange={clientState.handleClientInputChange}
            onAddNewClient={(data) => {
              // If data is provided (from Voice Wizard), set it
              if (data) {
                clientState.setNewClientData(prev => ({ ...prev, ...data }));
              }
              clientState.setNewClientModal(true);
            }}
            onNext={navigation.nextStep}
          />
        );

      case "notes":
        return (
          <StepNotes
            formData={formState.formData}
            onInputChange={formState.handleInputChange}
            saveStatus={saveStatus}
          />
        );

      case "project-type":
        return (
          <StepProjectType
            formData={formState.formData}
            onInputChange={formState.handleInputChange}
          />
        );

      case "ai-designer":
        return (
          <StepAIDesigner
            formData={formState.formData}
            onInputChange={formState.handleInputChange}
            selectedImage={selectedImage}
          />
        );

      case "logo-instructions":
        return (
          <StepLogoInstructions
            formData={formState.formData}
            onInputChange={formState.handleInputChange}
            saveStatus={saveStatus}
            onBack={navigation.prevStep}
          />
        );

      case "confirm-details":
        return (
          <StepConfirmDetails
            formData={formState.formData}
            error={formState.error}
            onEditLogo={handleEditLogo}
            onDeleteLogo={handleDeleteLogo}
            onAddLogo={handleAddLogo}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 relative">
      {/* Animated Gradient Background removed */}

      {/* Glassmorphism Card */}
      <Card
        className="shadow-2xl overflow-hidden flex-1 min-h-0 rounded-none relative z-10"
        classNames={{ base: "flex flex-col" }}
        style={{
          background: 'rgba(20, 20, 20, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}
      >
        <div className="flex flex-col h-full min-h-0">

          {/* Top bar + horizontal stepper */}
          <div className="w-full bg-content1 px-4 py-2 sm:px-6 sm:py-3 border-b border-divider flex-shrink-0">
            <div className="flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {isLogoEditOnlyMode ? (
                  <Button
                    variant="light"
                    className="text-default-600 shrink-0"
                    startContent={<Icon icon="lucide:arrow-left" />}
                    onPress={() => {
                      if (projectId) {
                        window.location.href = `/projects/${projectId}?tab=overview`;
                      } else {
                        window.location.href = "/";
                      }
                    }}
                  >
                    {t('common.back', 'Voltar')}
                  </Button>
                ) : (
                  <>
                <Button
                  variant="light"
                  className="text-default-600 shrink-0"
                  startContent={<Icon icon="lucide:arrow-left" />}
                  as="a"
                  href="/"
                >
                  {t('pages.createProject.backToDashboard')}
                </Button>

                <StepIndicator
                  steps={visibleSteps}
                  currentStep={navigation.currentStep}
                  onStepClick={(stepNumber) => navigation.setCurrentStep(stepNumber)}
                />
                  </>
                )}
              </div>

              {/* Status de salvamento à direita */}
              <div className="shrink-0">
                <SaveStatus status={saveStatus.status} />
              </div>
            </div>
          </div>

          {/* Main content */}
          {(() => {
            const currentVisibleStep = visibleSteps[navigation.currentStep - 1];
            const isLogoInstructionsStep = currentVisibleStep?.id === 'logo-instructions';

            return (
              <Scroller
                hideScrollbar
                className={`flex-1 min-h-0 ${isLogoInstructionsStep ? '' : 'bg-default-100'} ${isAIDesignerStep() || isLogoInstructionsStep
                    ? 'overflow-hidden'
                    : 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-y-auto'
                  }`}
              >
                <div className={
                  isAIDesignerStep() || isLogoInstructionsStep
                    ? 'h-full w-full'
                    : 'max-w-6xl mx-auto'
                }>
                  {renderStepContent()}
                </div>
              </Scroller>
            );
          })()}


          {/* Navigation Footer */}
          {!isLogoEditOnlyMode && visibleSteps[navigation.currentStep - 1]?.id !== 'logo-instructions' && (
          <div className="flex-shrink-0">
            <NavigationFooter
              currentStep={navigation.currentStep}
              totalSteps={visibleSteps.length}
              currentStepId={visibleSteps[navigation.currentStep - 1]?.id}
              onNext={navigation.nextStep}
              onPrev={navigation.prevStep}
              onSubmit={formState.handleSubmit}
              onSave={formState.handleSave}
              isValid={navigation.canProceed()}
              loading={formState.loading}
              isNavigating={navigation.isNavigating}
              projectId={projectId}
              isSaving={saveStatus.status === 'saving'}
              onResetLogo={() => {
                // Get current logoDetails structure
                const currentLogoDetails = formState.formData.logoDetails || {};
                const currentLogo = currentLogoDetails.currentLogo || currentLogoDetails; // Support both old and new structure
                const savedLogos = currentLogoDetails.logos || [];

                // Check if current logo is valid using the helper function
                const isCurrentLogoValid = isLogoValid(currentLogo);

                // Only save if logo is valid - button should be disabled if not valid
                if (isCurrentLogoValid) {
                  // Guardar _originalIndex antes de remover (é apenas para controle interno)
                  const originalIndex = currentLogo._originalIndex;
                  
                  // Remover _originalIndex antes de salvar (é apenas para controle interno)
                  const { _originalIndex, ...logoWithoutOriginalIndex } = currentLogo;
                  
                  const logoToSave = {
                    ...logoWithoutOriginalIndex,
                    id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    savedAt: currentLogo.savedAt || new Date().toISOString()
                  };

                  console.log('🔍 [onResetLogo] Verificando logo para salvar:', {
                    logoId: logoToSave.id,
                    logoNumber: logoToSave.logoNumber,
                    logoName: logoToSave.logoName,
                    originalIndex: originalIndex,
                    savedLogosCount: savedLogos.length,
                    savedLogosIds: savedLogos.map(l => ({ id: l.id, logoNumber: l.logoNumber }))
                  });

                  // Verificar se o logo já existe nos savedLogos (por ID ou logoNumber)
                  const existingLogoIndex = savedLogos.findIndex(logo => {
                    // Se currentLogo tem ID, comparar por ID (mais confiável)
                    if (logoToSave.id && logo.id) {
                      return logo.id === logoToSave.id;
                    }
                    // Se não tem ID, comparar por logoNumber
                    if (logo.logoNumber && logoToSave.logoNumber) {
                      return logo.logoNumber.trim() === logoToSave.logoNumber.trim();
                    }
                    return false;
                  });

                  let updatedSavedLogos;

                  if (existingLogoIndex >= 0) {
                    // Logo já existe - ATUALIZAR em vez de criar novo
                    updatedSavedLogos = [...savedLogos];
                    updatedSavedLogos[existingLogoIndex] = logoToSave;
                    
                    console.log('✅ [onResetLogo] Atualizando logo existente nos savedLogos:', {
                      logoNumber: logoToSave.logoNumber,
                      logoName: logoToSave.logoName,
                      logoId: logoToSave.id,
                      index: existingLogoIndex,
                      totalLogos: updatedSavedLogos.length
                    });
                  } else if (originalIndex !== undefined && originalIndex >= 0 && originalIndex < savedLogos.length) {
                    // Logo não existe mas tem posição original válida - INSERIR na posição original
                    // Isso acontece quando o logo foi editado (removido dos savedLogos) e agora está sendo salvo
                    updatedSavedLogos = [...savedLogos];
                    updatedSavedLogos.splice(originalIndex, 0, logoToSave);
                    
                    console.log('✅ [onResetLogo] Inserindo logo editado na posição original:', {
                      logoNumber: logoToSave.logoNumber,
                      logoName: logoToSave.logoName,
                      logoId: logoToSave.id,
                      originalIndex: originalIndex,
                      totalLogos: updatedSavedLogos.length
                    });
                  } else if (originalIndex !== undefined && originalIndex >= 0) {
                    // Logo tem posição original mas está fora dos limites - adicionar no final
                    updatedSavedLogos = [...savedLogos, logoToSave];
                    
                    console.log('⚠️ [onResetLogo] Logo tem posição original inválida, adicionando no final:', {
                      logoNumber: logoToSave.logoNumber,
                      logoName: logoToSave.logoName,
                      logoId: logoToSave.id,
                      originalIndex: originalIndex,
                      savedLogosLength: savedLogos.length,
                      totalLogos: updatedSavedLogos.length
                    });
                  } else {
                    // Logo não existe e não tem posição original - ADICIONAR como novo no final
                    updatedSavedLogos = [...savedLogos, logoToSave];
                    
                    console.log('✅ [onResetLogo] Adicionando novo logo aos savedLogos:', {
                      logoNumber: logoToSave.logoNumber,
                      logoName: logoToSave.logoName,
                      logoId: logoToSave.id,
                      totalLogos: updatedSavedLogos.length
                    });
                  }

                  // Update logoDetails with saved logos and new empty currentLogo
                  formState.handleInputChange("logoDetails", {
                    ...currentLogoDetails,
                    logos: updatedSavedLogos,
                    currentLogo: {
                      logoNumber: "",
                      logoName: "",
                      requestedBy: "",
                      dimensions: {},
                      usageOutdoor: false,
                      usageIndoor: true,
                      fixationType: "",
                      lacqueredStructure: false,
                      lacquerColor: "",
                      mastDiameter: "",
                      maxWeightConstraint: false,
                      maxWeight: "",
                      ballast: false,
                      controlReport: false,
                      criteria: "",
                      description: "",
                      composition: {
                        componentes: [],
                        bolas: []
                      },
                      attachmentFiles: [] // Reset attachments for new logo
                    }
                  });
                }
                // If logo is not valid, do nothing - button should be disabled
              }}
              isCurrentLogoValid={(() => {
                const currentLogoDetails = formState.formData.logoDetails || {};
                const currentLogo = currentLogoDetails.currentLogo || currentLogoDetails;
                return isLogoValid(currentLogo);
              })()}
            />
          </div>
          )}
          
          {/* Footer simplificado para edição de logo apenas - removido botão Save, save automático ao fechar */}
          {isLogoEditOnlyMode && (
            <div className="flex-shrink-0 w-full bg-content1 border-t border-divider px-4 py-4 sm:px-6 sm:py-6">
              <div className="max-w-6xl mx-auto flex justify-end items-center gap-4">
                <Button
                  color="primary"
                  variant="flat"
                  onPress={async () => {
                    // Save before closing
                    if (projectId) {
                      await formState.handleSave();
                    }
                    onClose();
                  }}
                  isLoading={saveStatus.status === 'saving'}
                  isDisabled={formState.loading || saveStatus.status === 'saving'}
                  startContent={<Icon icon="lucide:check" />}
                >
                  {saveStatus.status === 'saving' ? t('common.saving', 'A guardar...') : t('common.done', 'Concluído')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={clientState.newClientModal}
        onClose={() => clientState.setNewClientModal(false)}
        clientData={clientState.newClientData}
        setClientData={clientState.setNewClientData}
        onAddClient={clientState.handleCreateNewClient}
      />
    </div>
  );
}
