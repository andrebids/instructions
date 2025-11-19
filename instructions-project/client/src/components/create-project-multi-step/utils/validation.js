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

// Validação do Step 2: Project Type (agora opcional - pode ser null)
export const validateStepProjectType = (formData) => {
  // Se projectType for null, é válido (pode fazer skip)
  // Se projectType for "simu", precisa ter simuWorkflow definido
  // Se projectType for "logo" ou outro, é válido
  const isValid = (
    formData.projectType === null || // Permite skip (não selecionar nada)
    formData.projectType !== "simu" || // Se não for simu, é válido
    (formData.projectType === "simu" && formData.simuWorkflow !== null) // Se for simu, precisa workflow
  );

  logger.validation("project-type", isValid, {
    projectType: formData.projectType,
    simuWorkflow: formData.simuWorkflow,
    canSkip: formData.projectType === null
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

// Validação do Step 3: AI Designer (apenas para AI workflow)
export const validateStepAIDesigner = (formData) => {
  const isValid = formData.canvasDecorations && formData.canvasDecorations.length > 0;

  logger.validation("ai-designer", isValid, {
    decorationsCount: formData.canvasDecorations?.length || 0
  });

  return isValid;
};

// Validação do Step: Logo Instructions (apenas para projetos Logo)
export const validateStepLogoInstructions = (formData) => {
  const logoDetails = formData.logoDetails || {};
  // Support both old structure (direct logoDetails) and new structure (with currentLogo)
  const currentLogo = logoDetails.currentLogo || logoDetails;
  const savedLogos = logoDetails.logos || [];
  const dimensions = currentLogo.dimensions || {};
  
  // Verificar se pelo menos um campo de dimensões está preenchido
  const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "";
  const hasLength = dimensions.length?.value != null && dimensions.length.value !== "";
  const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "";
  const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "";
  const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
  
  // Step is valid if current logo is valid OR if there are saved logos (user can proceed with saved logos)
  const isCurrentLogoValid = (
    currentLogo.logoNumber?.trim() !== "" &&
    currentLogo.logoName?.trim() !== "" &&
    currentLogo.requestedBy?.trim() !== "" &&
    hasAtLeastOneDimension
  );
  
  const isValid = isCurrentLogoValid || savedLogos.length > 0;

  logger.validation("logo-instructions", isValid, {
    hasLogoNumber: !!currentLogo.logoNumber,
    hasLogoName: !!currentLogo.logoName,
    hasRequestedBy: !!currentLogo.requestedBy,
    hasAtLeastOneDimension: hasAtLeastOneDimension,
    savedLogosCount: savedLogos.length,
    isCurrentLogoValid: isCurrentLogoValid,
    dimensions: {
      height: hasHeight,
      length: hasLength,
      width: hasWidth,
      diameter: hasDiameter
    }
  });

  return isValid;
};

// Validação do Step 6: Confirm Details
export const validateStepConfirmDetails = (formData) => {
  return true; // Review step
};

// 🧪 Breakpoint de Teste 6
export const TEST_BREAKPOINT_6 = false;

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
    case "ai-designer":
      isValid = validateStepAIDesigner(formData);
      break;
    case "logo-instructions":
      isValid = validateStepLogoInstructions(formData);
      break;
    case "notes":
      // Notes step sempre é válido (opcional)
      isValid = true;
      break;
    case "confirm-details":
      isValid = validateStepConfirmDetails(formData);
      break;
    default:
      logger.warn("validation", `Unknown step ID: ${stepId}`);
      isValid = false;
  }

  // Logs de teste removidos

  return isValid;
};

