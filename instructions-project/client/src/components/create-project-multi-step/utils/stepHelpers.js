// Helper para determinar quais steps são visíveis baseado no formData
export const getVisibleSteps = (formData, allSteps) => {
  return allSteps.filter(step => {
    if (!step.conditional) return true;
    
    // Steps condicionais apenas para projectos Simu
    if (step.condition === "isSimu") {
      return formData.projectType === "simu" && formData.simuWorkflow !== null;
    }
    
    return true;
  });
};

// Calcular número total de steps visíveis
export const getTotalVisibleSteps = (formData, allSteps) => {
  return getVisibleSteps(formData, allSteps).length;
};

// Mapear step index para step visível
export const getVisibleStepIndex = (currentStep, formData, allSteps) => {
  const visibleSteps = getVisibleSteps(formData, allSteps);
  return visibleSteps.findIndex((_, index) => index + 1 === currentStep);
};

