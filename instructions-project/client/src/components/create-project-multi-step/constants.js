// Array de steps (incluindo steps condicionais)
export const STEPS = [
  { id: "project-details", label: "Project Details", icon: "lucide:folder", conditional: false },
  { id: "notes", label: "Notes", icon: "lucide:file-text", conditional: true, condition: "hasNotes" },
  { id: "project-type", label: "Project Type", icon: "lucide:layers", conditional: false },
  { id: "ai-designer", label: "AI Designer", icon: "lucide:sparkles", conditional: true, condition: "isAIDesigner" },
  { id: "logo-instructions", label: "Logo Instructions", icon: "lucide:pen-tool", conditional: true, condition: "isLogo" },
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
  ENABLE_LOGS: false, // Toggle global (false em produção)
  LEVELS: {
    LIFECYCLE: false,    // Mounting, unmounting
    NAVIGATION: false,   // Step changes
    VALIDATION: false,   // Validação de steps
    CANVAS: false,       // Operações no canvas
    API: false,          // Chamadas API
    USER_ACTION: false,  // Cliques, inputs
  }
};

// 🧪 Breakpoint de Teste 1
export const TEST_BREAKPOINT_1 = false;

// Logs de teste removidos

