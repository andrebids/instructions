// Array de steps (incluindo steps condicionais)
export const STEPS = [
  { id: "project-details", label: "Project Details", icon: "lucide:folder", conditional: false },
  { id: "project-type", label: "Project Type", icon: "lucide:layers", conditional: false },
  { id: "canvas-selection", label: "Select Decorations", icon: "lucide:palette", conditional: true, condition: "isSimu" },
  { id: "canvas-positioning", label: "Position Elements", icon: "lucide:move", conditional: true, condition: "isSimu" },
  { id: "location-description", label: "Location & Description", icon: "lucide:map-pin", conditional: false },
  { id: "confirm-details", label: "Confirm Details", icon: "lucide:check-circle", conditional: false },
];

// Configurações de validação
export const VALIDATION_CONFIG = {
  minBudget: 0,
  maxBudget: 1000000,
  minDescriptionLength: 0,
  maxDescriptionLength: 5000,
};

// Status de projetos
export const PROJECT_STATUS = {
  CREATED: "created",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// Configurações do Canvas Konva
export const CANVAS_CONFIG = {
  width: 1200,
  height: 800,
  defaultDecorationSize: 150,
  snapDistance: 10,
  gridSize: 20,
  maxZoom: 3,
  minZoom: 0.5,
};

// 📊 Configuração de Logging
export const LOG_CONFIG = {
  ENABLE_LOGS: true, // Toggle global (false em produção)
  LEVELS: {
    LIFECYCLE: true,    // Mounting, unmounting
    NAVIGATION: true,   // Step changes
    VALIDATION: true,   // Validação de steps
    CANVAS: true,       // Operações no canvas
    API: true,          // Chamadas API
    USER_ACTION: true,  // Cliques, inputs
  }
};

// 🧪 Breakpoint de Teste 1
export const TEST_BREAKPOINT_1 = true;

if (TEST_BREAKPOINT_1) {
  console.log("🧪 TEST 1: Constants loaded", {
    stepsCount: STEPS.length,
    hasCanvasSteps: STEPS.some(s => s.condition === "isSimu"),
    canvasConfig: CANVAS_CONFIG,
    validationConfig: VALIDATION_CONFIG,
    loggingEnabled: LOG_CONFIG.ENABLE_LOGS
  });
}

