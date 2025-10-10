import { useState, useEffect } from "react";
import { isStepValid } from "../utils/validation";
import { logger } from "../utils/logger";

// 🧪 Breakpoint de Teste 3
export const TEST_BREAKPOINT_3 = true;

// ✅ CORRIGIDO: Agora recebe visibleSteps para navegação correta
export const useStepNavigation = (formData, visibleSteps) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Log de navegação
  useEffect(() => {
    const currentStepData = visibleSteps[currentStep - 1];
    
    logger.navigation(
      currentStep - 1,
      currentStep,
      { 
        stepId: currentStepData?.id,
        totalSteps: visibleSteps.length
      }
    );
    
    if (TEST_BREAKPOINT_3) {
      console.log("🧪 TEST 3: Step changed", {
        currentStep,
        totalSteps: visibleSteps.length,
        stepId: currentStepData?.id,
        projectType: formData.projectType,
        canProceed: canProceed()
      });
    }
  }, [currentStep, visibleSteps]);

  // Avançar para próximo step
  const nextStep = () => {
    const currentStepId = visibleSteps[currentStep - 1]?.id;
    
    if (currentStep < visibleSteps.length && isStepValid(currentStepId, formData)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
      logger.userAction('Next Step', currentStepId, currentStep + 1);
    } else {
      logger.warn('useStepNavigation', `Cannot proceed from step ${currentStepId}`);
    }
  };

  // Voltar para step anterior
  const prevStep = () => {
    if (currentStep > 1) {
      const currentStepId = visibleSteps[currentStep - 1]?.id;
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
      logger.userAction('Previous Step', currentStepId, currentStep - 1);
    }
  };

  // Verificar se step atual é válido
  const canProceed = () => {
    const currentStepId = visibleSteps[currentStep - 1]?.id;
    return isStepValid(currentStepId, formData);
  };

  return {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    canProceed,
  };
};

