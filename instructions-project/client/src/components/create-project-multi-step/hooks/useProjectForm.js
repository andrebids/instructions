import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { projectsAPI } from "../../../services/api";
import { logger } from "../utils/logger";
import { getLocalTimeZone } from "@internationalized/date";

// 🧪 Breakpoint de Teste 2
export const TEST_BREAKPOINT_2 = false;

export const useProjectForm = (onClose) => {
  const navigate = useNavigate();
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
    tempProjectId: null, // ID temporário do projeto criado após Project Details
    // 🆕 Novos campos para Canvas Konva (apenas projectos Simu)
    canvasDecorations: [],    // Array de decorações geradas pelo AI Designer
    canvasImages: [],          // Array de imagens adicionadas ao canvas
    snapZonesByImage: {},      // Zonas de snap por imagem: { 'image-id': { day: [], night: [] } }
    decorationsByImage: {},   // Decorações por imagem: { 'image-id': [...] }
  });

  // 🧪 Logging inicial - removido para evitar logs infinitos
  
  logger.lifecycle('useProjectForm', 'Hook initialized', { hasOnClose: !!onClose });

  // Handler genérico de input - usando useCallback para evitar re-renders desnecessários
  const handleInputChange = useCallback((field, value) => {
    logger.userAction('Input Change', field, value);
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // 🧪 Breakpoint de Teste 7
  const TEST_BREAKPOINT_7 = false;

  // Submissão do formulário
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const projectData = {
        name: formData.name,
        clientName: formData.clientName,
        // Se projectType for null (skip), usar 'decor' como padrão (compatibilidade com BD)
        projectType: formData.projectType || 'decor',
        status: formData.status,
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: null,
        endDate: formData.endDate ? formData.endDate.toDate(getLocalTimeZone()).toISOString() : null,
        // Dados do canvas (AI Designer)
        canvasDecorations: formData.canvasDecorations || [],
        canvasImages: formData.canvasImages || [],
        snapZonesByImage: formData.snapZonesByImage || {},
        decorationsByImage: formData.decorationsByImage || {},
      };
      
      // Log detalhado das zonas incluídas na criação
      if (projectData.snapZonesByImage && Object.keys(projectData.snapZonesByImage).length > 0) {
        var zonasResumo = {};
        for (var imageId in projectData.snapZonesByImage) {
          var zones = projectData.snapZonesByImage[imageId];
          zonasResumo[imageId] = {
            day: zones?.day?.length || 0,
            night: zones?.night?.length || 0,
            total: (zones?.day?.length || 0) + (zones?.night?.length || 0)
          };
        }
        console.log('💾 [CREATE PROJECT] Criando projeto COM zonas:', JSON.stringify(zonasResumo, null, 2));
      } else {
        console.log('💾 [CREATE PROJECT] Criando projeto SEM zonas');
      }
      
      logger.api('projects', 'POST', projectData);
      logger.lifecycle('useProjectForm', 'Submitting project', projectData);
      
      // Logs de teste removidos
      
      // Se já existe tempProjectId, atualizar projeto existente em vez de criar novo
      let finalProject;
      if (formData.tempProjectId) {
        // Atualizar projeto existente
        finalProject = await projectsAPI.update(formData.tempProjectId, projectData);
        logger.lifecycle('useProjectForm', 'Project updated', finalProject);
      } else {
        // Criar novo projeto
        finalProject = await projectsAPI.create(projectData);
        logger.lifecycle('useProjectForm', 'Project created', finalProject);
      }
      
      // Atualizar formData com o ID do projeto
      setFormData(prev => ({
        ...prev,
        id: finalProject.id,
        tempProjectId: finalProject.id
      }));
      
      // Redirecionar para página de notas do projeto
      if (finalProject?.id) {
        navigate(`/projects/${finalProject.id}/notes`);
      } else {
        onClose?.();  // Fallback: fecha modal e recarrega dados
      }
    } catch (err) {
      logger.error('useProjectForm.handleSubmit', err);
      
      // Logs de teste removidos
      
      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // Criar projeto temporariamente após Project Details
  const createTempProject = async () => {
    // Se já existe tempProjectId, não criar novamente
    if (formData.tempProjectId) {
      return formData.tempProjectId;
    }

    try {
      const projectData = {
        name: formData.name,
        clientName: formData.clientName,
        projectType: formData.projectType || 'decor',
        status: 'created',
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: null,
        endDate: formData.endDate ? formData.endDate.toDate(getLocalTimeZone()).toISOString() : null,
      };
      
      const newProject = await projectsAPI.create(projectData);
      
      // Guardar ID temporário no formData
      setFormData(prev => ({
        ...prev,
        tempProjectId: newProject.id,
        id: newProject.id
      }));
      
      logger.lifecycle('useProjectForm', 'Temporary project created', newProject);
      return newProject.id;
    } catch (err) {
      logger.error('useProjectForm.createTempProject', err);
      throw err;
    }
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    createTempProject,
    loading,
    error,
    setError,
  };
};

