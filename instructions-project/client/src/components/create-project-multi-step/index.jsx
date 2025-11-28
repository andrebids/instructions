import React, { useEffect, useMemo } from "react";
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

export function CreateProjectMultiStep({ onClose, selectedImage, projectId, initialStep }) {
  // Initialize hooks
  const { t } = useTranslation();
  const saveStatus = useSaveStatus();
  const formState = useProjectForm(onClose, projectId, saveStatus);
  const clientState = useClientManagement(formState.setFormData);

  // Get visible steps based on project type
  // Usar formState.formData completo para corresponder às dependências inferidas pelo React Compiler
  const visibleSteps = useMemo(() =>
    getVisibleSteps(formState.formData, STEPS),
    [formState.formData]
  );
  
  // Debug: verificar initialStep e visibleSteps
  useEffect(() => {
    if (initialStep) {
      console.log('📋 CreateProjectMultiStep: initialStep recebido:', initialStep);
      console.log('📋 VisibleSteps disponíveis:', visibleSteps.map(s => s.id));
      const stepExists = visibleSteps.some(s => s.id === initialStep);
      console.log('📋 Step existe nos visibleSteps?', stepExists);
    }
  }, [initialStep, visibleSteps]);
  
  const navigation = useStepNavigation(formState.formData, visibleSteps, formState.createTempProject, initialStep);

  // 🔄 Lifecycle logging
  useEffect(() => {
    logger.lifecycle('CreateProjectMultiStep', 'Component mounted', {
      hasOnClose: !!onClose,
      totalSteps: STEPS.length,
      visibleSteps: visibleSteps.length
    });

    // Logs de teste removidos

    return () => {
      logger.lifecycle('CreateProjectMultiStep', 'Component unmounting');
    };
  }, []);

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
    const hasRequestedBy = logo.requestedBy?.trim() !== "";
    const hasFixationType = logo.fixationType?.trim() !== "";
    const dimensions = logo.dimensions || {};
    const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "";
    const hasLength = dimensions.length?.value != null && dimensions.length.value !== "";
    const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "";
    const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "";
    const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
    return hasLogoNumber && hasLogoName && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
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

  const handleEditLogo = (index, isCurrent) => {
    const logoDetails = formState.formData.logoDetails || {};
    const savedLogos = logoDetails.logos || [];
    const currentLogo = logoDetails.currentLogo || logoDetails; // Fallback for structure

    if (isCurrent) {
      // Already in currentLogo, just navigate
      const logoStepIndex = visibleSteps.findIndex(s => s.id === 'logo-instructions');
      if (logoStepIndex >= 0) {
        navigation.setCurrentStep(logoStepIndex + 1);
      }
    } else {
      // It's a saved logo. We need to swap it into currentLogo.
      let newSavedLogos = [...savedLogos];
      const logoToEdit = savedLogos[index];

      // Remove logoToEdit from newSavedLogos
      newSavedLogos = newSavedLogos.filter((_, i) => i !== index);

      // If currentLogo is valid, add it to newSavedLogos so we don't lose it
      if (isLogoValid(currentLogo)) {
        const logoToSave = {
          ...currentLogo,
          id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          savedAt: new Date().toISOString()
        };
        newSavedLogos.push(logoToSave);
      }

      // Update state
      formState.handleInputChange("logoDetails", {
        ...logoDetails,
        logos: newSavedLogos,
        currentLogo: logoToEdit
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
          />
        );

      case "confirm-details":
        return (
          <StepConfirmDetails
            formData={formState.formData}
            error={formState.error}
            onEditLogo={handleEditLogo}
            onDeleteLogo={handleDeleteLogo}
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
              </div>

              {/* Status de salvamento à direita */}
              <div className="shrink-0">
                <SaveStatus status={saveStatus.status} />
              </div>
            </div>
          </div>

          {/* Main content */}
          <Scroller
            hideScrollbar
            className={`flex-1 min-h-0 bg-default-100 ${isAIDesignerStep()
              ? 'overflow-hidden'
              : 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-y-auto'
              }`}
          >
            <div className={isAIDesignerStep() ? 'h-full' : 'max-w-6xl mx-auto'}>
              {renderStepContent()}
            </div>
          </Scroller>

          {/* Navigation Footer */}
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
                  const logoToSave = {
                    ...currentLogo,
                    id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    savedAt: new Date().toISOString()
                  };

                  // Update logoDetails with saved logos and new empty currentLogo
                  formState.handleInputChange("logoDetails", {
                    ...currentLogoDetails,
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
                      }
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
