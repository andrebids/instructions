import { logger } from "./logger";

// Validação do Step 1: Project Details
export const validateStepProjectDetails = (formData) => {
  const isValid = (
    formData.name.trim() !== "" && 
    formData.clientName.trim() !== "" && 
    formData.endDate  // Truthy check (null, undefined, false = inválido)
  );
  
  logger.validation("project-details", isValid, {
    hasName: !!formData.name,
    hasClient: !!formData.clientName,
    hasEndDate: !!formData.endDate
  });
  
  return isValid;
};

// Validação do Step 2: Project Type
export const validateStepProjectType = (formData) => {
  const isValid = (
    formData.projectType !== null &&
    (formData.projectType !== "simu" || formData.simuWorkflow !== null)
  );
  
  logger.validation("project-type", isValid, {
    projectType: formData.projectType,
    simuWorkflow: formData.simuWorkflow
  });
  
  return isValid;
};

// Validação do Step 3: Canvas Selection (apenas Simu)
export const validateCanvasSelection = (formData) => {
  const isValid = formData.canvasSelection && formData.canvasSelection.length > 0;
  
  logger.validation("canvas-selection", isValid, {
    selectionCount: formData.canvasSelection?.length || 0
  });
  
  return isValid;
};

// Validação do Step 4: Canvas Positioning (apenas Simu)
export const validateCanvasPositioning = (formData) => {
  const isValid = formData.canvasPositioning && formData.canvasPositioning.length > 0;
  
  logger.validation("canvas-positioning", isValid, {
    positionedCount: formData.canvasPositioning?.length || 0
  });
  
  return isValid;
};

// Validação do Step 5: Location & Description
export const validateStepLocationDescription = (formData) => {
  return true; // Campos opcionais
};

// Validação do Step 6: Confirm Details
export const validateStepConfirmDetails = (formData) => {
  return true; // Review step
};

// 🧪 Breakpoint de Teste 6
export const TEST_BREAKPOINT_6 = true;

// ✅ CORRIGIDO: Validação por STEP ID em vez de número
export const isStepValid = (stepId, formData) => {
  let isValid = false;
  
  switch (stepId) {
    case "project-details":
      isValid = validateStepProjectDetails(formData);
      break;
    case "project-type":
      isValid = validateStepProjectType(formData);
      break;
    case "canvas-selection":
      isValid = validateCanvasSelection(formData);
      break;
    case "canvas-positioning":
      isValid = validateCanvasPositioning(formData);
      break;
    case "location-description":
      isValid = validateStepLocationDescription(formData);
      break;
    case "confirm-details":
      isValid = validateStepConfirmDetails(formData);
      break;
    default:
      logger.warn("validation", `Unknown step ID: ${stepId}`);
      isValid = false;
  }
  
  if (TEST_BREAKPOINT_6) {
    console.log("🧪 TEST 6: Validation", {
      stepId,
      isValid,
      formDataKeys: Object.keys(formData),
      criticalFields: {
        name: formData.name,
        projectType: formData.projectType,
        clientName: formData.clientName,
        endDate: !!formData.endDate
      }
    });
  }
  
  return isValid;
};

