import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectsAPI } from "../../../services/api";
import { logger } from "../utils/logger";
import { getLocalTimeZone, parseDate } from "@internationalized/date";

// 🧪 Breakpoint de Teste 2
export const TEST_BREAKPOINT_2 = false;

export const useProjectForm = (onClose, projectId = null) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(!!projectId);
  
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
  
  logger.lifecycle('useProjectForm', 'Hook initialized', { hasOnClose: !!onClose, projectId });

  // Carregar projeto existente quando projectId fornecido (modo edição)
  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        setIsLoadingProject(true);
        logger.lifecycle('useProjectForm', 'Loading existing project', { projectId });
        
        const project = await projectsAPI.getById(projectId);
        
        if (project) {
          // Converter datas do backend para formato do DatePicker
          const startDate = project.startDate ? parseDate(project.startDate.split('T')[0]) : null;
          const endDate = project.endDate ? parseDate(project.endDate.split('T')[0]) : null;
          
          // Restaurar estado completo do formulário
          setFormData({
            id: project.id,
            name: project.name || "",
            projectType: project.projectType || null,
            simuWorkflow: null, // Não guardado no backend
            status: project.status || "created",
            clientId: null,
            selectedClientKey: null,
            clientName: project.clientName || "",
            clientEmail: "", // Não guardado no backend
            clientPhone: "", // Não guardado no backend
            startDate: startDate,
            endDate: endDate,
            budget: project.budget ? String(project.budget) : "",
            location: project.location || "",
            description: project.description || "",
            tempProjectId: project.id, // Já existe, usar o ID real
            // Restaurar estado do canvas
            canvasDecorations: project.canvasDecorations || [],
            canvasImages: project.canvasImages || [],
            snapZonesByImage: project.snapZonesByImage || {},
            decorationsByImage: project.decorationsByImage || {},
          });
          
          logger.lifecycle('useProjectForm', 'Project loaded successfully', { 
            projectId: project.id,
            name: project.name,
            hasCanvasData: !!(project.canvasDecorations?.length || project.canvasImages?.length)
          });
        }
      } catch (err) {
        logger.error('useProjectForm.loadProject', err);
        setError(err.response?.data?.error || "Failed to load project");
      } finally {
        setIsLoadingProject(false);
      }
    };

    loadProject();
  }, [projectId]);

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
      
      // Se já existe tempProjectId ou projectId, atualizar projeto existente em vez de criar novo
      let finalProject;
      const projectIdToUpdate = projectId || formData.tempProjectId;
      if (projectIdToUpdate) {
        // Atualizar projeto existente
        finalProject = await projectsAPI.update(projectIdToUpdate, projectData);
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
    loading: loading || isLoadingProject,
    error,
    setError,
  };
};

