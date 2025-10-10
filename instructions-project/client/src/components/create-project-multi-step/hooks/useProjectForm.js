import { useState } from "react";
import { projectsAPI } from "../../../services/api";
import { logger } from "../utils/logger";
import { getLocalTimeZone } from "@internationalized/date";

// 🧪 Breakpoint de Teste 2
export const TEST_BREAKPOINT_2 = true;

export const useProjectForm = (onClose) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estado do formulário
  const [formData, setFormData] = useState({
    name: "",
    projectType: null,
    simuWorkflow: null,
    status: "created",
    clientId: null,
    selectedClientKey: null,
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    startDate: null,
    endDate: null,
    budget: "",
    location: "",
    description: "",
    // 🆕 Novos campos para Canvas Konva (apenas projectos Simu)
    canvasDecorations: [],    // Array de decorações geradas pelo AI Designer
  });

  // 🧪 Logging inicial
  if (TEST_BREAKPOINT_2) {
    console.log("🧪 TEST 2: useProjectForm initialized", {
      hasOnClose: !!onClose,
      initialFormData: formData
    });
  }
  
  logger.lifecycle('useProjectForm', 'Hook initialized', { hasOnClose: !!onClose });

  // Handler genérico de input
  const handleInputChange = (field, value) => {
    logger.userAction('Input Change', field, value);
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 🧪 Breakpoint de Teste 7
  const TEST_BREAKPOINT_7 = true;

  // Submissão do formulário
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projectData = {
        name: formData.name,
        clientName: formData.clientName,
        projectType: formData.projectType,
        status: formData.status,
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: null,
        endDate: formData.endDate ? formData.endDate.toDate(getLocalTimeZone()).toISOString() : null,
      };
      
      logger.api('projects', 'POST', projectData);
      logger.lifecycle('useProjectForm', 'Submitting project', projectData);
      
      if (TEST_BREAKPOINT_7) {
        console.log("🧪 TEST 7: Before API call", {
          projectData,
          apiEndpoint: '/api/projects'
        });
      }
      
      const newProject = await projectsAPI.create(projectData);
      
      logger.lifecycle('useProjectForm', 'Project created', newProject);
      
      if (TEST_BREAKPOINT_7) {
        console.log("🧪 TEST 7: API Success", newProject);
      }
      
      onClose?.();  // Optional chaining
    } catch (err) {
      logger.error('useProjectForm.handleSubmit', err);
      
      if (TEST_BREAKPOINT_7) {
        console.log("🧪 TEST 7: API Error", err);
      }
      
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    loading,
    error,
    setError,
  };
};

