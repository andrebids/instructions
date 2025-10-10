import React, { useEffect } from "react";
import { Card, Button } from "@heroui/react";
import { DatePicker } from "@heroui/date-picker";
import { today, getLocalTimeZone } from "@internationalized/date";
import { Icon } from "@iconify/react";

// Hooks
import { useProjectForm } from "./hooks/useProjectForm";
import { useClientManagement } from "./hooks/useClientManagement";
import { useStepNavigation } from "./hooks/useStepNavigation";

// Components
import { StepIndicator } from "./components/StepIndicator";
import { NavigationFooter } from "./components/NavigationFooter";
import { AddClientModal } from "./components/AddClientModal";

// Steps
import { StepProjectDetails } from "./steps/StepProjectDetails";
import { StepProjectType } from "./steps/StepProjectType";
import { StepAIDesigner } from "./steps/StepAIDesigner";
import { StepConfirmDetails } from "./steps/StepConfirmDetails";

// Utils & Constants
import { STEPS } from "./constants";
import { getVisibleSteps } from "./utils/stepHelpers";
import { logger } from "./utils/logger";

// 🧪 Breakpoint de Teste 5 (Componente Principal)
const TEST_BREAKPOINT_5 = false;

export function CreateProjectMultiStep({ onClose, selectedImage, onUploadStepChange, onCurrentStepChange }) {
  // Initialize hooks
  const formState = useProjectForm(onClose);
  const clientState = useClientManagement(formState.setFormData);
  
  // Get visible steps based on project type
  const visibleSteps = getVisibleSteps(formState.formData, STEPS);
  const navigation = useStepNavigation(formState.formData, visibleSteps);

  // Comunicar mudanças do step atual para o componente pai
  useEffect(() => {
    if (onCurrentStepChange) {
      const currentStepData = visibleSteps[navigation.currentStep - 1];
      onCurrentStepChange(currentStepData?.id);
    }
  }, [navigation.currentStep, visibleSteps, onCurrentStepChange]);
  
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
            onAddNewClient={() => clientState.setNewClientModal(true)}
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
            onUploadStepChange={onUploadStepChange}
          />
        );
      
      case "confirm-details":
        return (
          <StepConfirmDetails
            formData={formState.formData}
            error={formState.error}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full">
      <Card className="shadow-lg overflow-hidden h-full rounded-none bg-default-100">
        <div className="flex flex-col h-full min-h-0">
          {/* Top bar + horizontal stepper */}
          <div className="w-full bg-content1 px-4 py-2 sm:px-6 sm:py-3 border-b border-divider">
            <div className="flex items-center gap-4">
              <Button
                variant="light"
                className="text-default-600 shrink-0"
                startContent={<Icon icon="lucide:arrow-left" />}
                as="a"
                href="/"
              >
                Back to dashboard
              </Button>

              <StepIndicator 
                steps={visibleSteps}
                currentStep={navigation.currentStep} 
              />
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 min-h-0 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-y-auto bg-default-100">
            <div className="max-w-6xl mx-auto pb-24">
              {renderStepContent()}
            </div>
          </div>
          
          {/* Navigation Footer */}
          <NavigationFooter
            currentStep={navigation.currentStep}
            totalSteps={visibleSteps.length}
            onNext={navigation.nextStep}
            onPrev={navigation.prevStep}
            onSubmit={formState.handleSubmit}
            isValid={navigation.canProceed()}
            loading={formState.loading}
          />
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

