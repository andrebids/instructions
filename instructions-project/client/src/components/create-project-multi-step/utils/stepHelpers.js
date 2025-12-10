// Helper para determinar quais steps são visíveis baseado no formData
export const getVisibleSteps = (formData, allSteps) => {
  return allSteps.filter(step => {
    if (!step.conditional) return true;

    // Steps condicionais apenas para projectos Simu
    if (step.condition === "isSimu") {
      // Step render-definition só aparece se houver imagens uploadadas
      // (não precisa ter decorações ainda, pode aparecer após posicionar)
      if (step.id === "render-definition") {
        const hasImages = formData.uploadedImages && formData.uploadedImages.length > 0;
        return formData.projectType === "simu" && hasImages;
      }
      return formData.projectType === "simu";
    }

    // Step condicional para AI Designer (agora aparece para qualquer projeto Simu)
    // O workflow é escolhido por imagem dentro do step
    if (step.condition === "isAIDesigner") {
      return formData.projectType === "simu";
    }

    // Step condicional para Logo Instructions
    if (step.condition === "isLogo") {
      return formData.projectType === "logo";
    }

    // Step condicional para Project Notes
    if (step.condition === "hasNotes") {
      return formData.enableNotes === true;
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

