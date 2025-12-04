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

// Validação do Step 2: Notes (sempre válido - notas são opcionais)
export const validateStepNotes = (formData) => {
  // Notes are always valid since they are optional
  const isValid = true;

  logger.validation("notes", isValid, {
    hasNotes: !!formData.notes
  });

  return isValid;
};

// Validação do Step 3: Project Type (agora opcional - pode ser null)
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

  // Helper function para verificar se uma dimensão é válida
  const isValidDimension = (value) => {
    if (value == null || value === "" || value === "0" || value === "0.00") {
      return false;
    }
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(numValue) && numValue > 0;
  };

  // Verificar se pelo menos um campo de dimensões está preenchido
  // IMPORTANTE: Não aceitar 0, null, undefined, ou string vazia como valor válido
  // O valor deve ser um número maior que 0
  const hasHeight = isValidDimension(dimensions.height?.value);
  const hasLength = isValidDimension(dimensions.length?.value);
  const hasWidth = isValidDimension(dimensions.width?.value);
  const hasDiameter = isValidDimension(dimensions.diameter?.value);
  const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;

  // Verificar se o logo atual está completamente vazio (permitir prosseguir apenas com logos salvos)
  const isCurrentLogoEmpty = (
    (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "") &&
    (!currentLogo.logoName || currentLogo.logoName.trim() === "") &&
    (!currentLogo.description || currentLogo.description.trim() === "") &&
    (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "") &&
    (!currentLogo.fixationType || currentLogo.fixationType.trim() === "") &&
    !hasAtLeastOneDimension
  );

  // Step is valid if current logo is valid OR if current logo is empty AND there are saved logos
  const isCurrentLogoValid = (
    currentLogo.logoNumber?.trim() !== "" &&
    currentLogo.logoName?.trim() !== "" &&
    currentLogo.description?.trim() !== "" &&
    currentLogo.requestedBy?.trim() !== "" &&
    currentLogo.fixationType?.trim() !== "" &&
    hasAtLeastOneDimension
  );

  // Verificar se há pelo menos um logo válido nos savedLogos
  // Um logo é válido se tem todos os campos obrigatórios E pelo menos uma dimensão > 0
  const hasValidSavedLogo = savedLogos.some(logo => {
    const logoDimensions = logo.dimensions || {};
    const logoHasHeight = isValidDimension(logoDimensions.height?.value);
    const logoHasLength = isValidDimension(logoDimensions.length?.value);
    const logoHasWidth = isValidDimension(logoDimensions.width?.value);
    const logoHasDiameter = isValidDimension(logoDimensions.diameter?.value);
    const logoHasAtLeastOneDimension = logoHasHeight || logoHasLength || logoHasWidth || logoHasDiameter;
    
    return (
      logo.logoNumber?.trim() !== "" &&
      logo.logoName?.trim() !== "" &&
      logo.description?.trim() !== "" &&
      logo.requestedBy?.trim() !== "" &&
      logo.fixationType?.trim() !== "" &&
      logoHasAtLeastOneDimension
    );
  });

  // Valid if: 
  // 1. current logo is valid, OR
  // 2. there are saved logos AND (current logo is empty OR current logo is valid) AND at least one saved logo is valid
  // IMPORTANTE: Não pode finalizar se não há pelo menos um logo válido (com dimensões)
  const isValid = isCurrentLogoValid || (savedLogos.length > 0 && (isCurrentLogoEmpty || isCurrentLogoValid) && hasValidSavedLogo);

  logger.validation("logo-instructions", isValid, {
    hasLogoNumber: !!currentLogo.logoNumber,
    hasLogoName: !!currentLogo.logoName,
    hasDescription: !!currentLogo.description?.trim(),
    hasRequestedBy: !!currentLogo.requestedBy,
    hasFixationType: !!currentLogo.fixationType?.trim(),
    hasAtLeastOneDimension: hasAtLeastOneDimension,
    savedLogosCount: savedLogos.length,
    isCurrentLogoValid: isCurrentLogoValid,
    isCurrentLogoEmpty: isCurrentLogoEmpty,
    dimensions: {
      height: hasHeight,
      length: hasLength,
      width: hasWidth,
      diameter: hasDiameter
    },
    dimensionValues: {
      height: dimensions.height?.value,
      length: dimensions.length?.value,
      width: dimensions.width?.value,
      diameter: dimensions.diameter?.value
    }
  });

  // Debug log removed to prevent console spam - use logger.validation() instead for debugging

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
    case "notes":
      isValid = validateStepNotes(formData);
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

