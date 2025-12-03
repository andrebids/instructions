import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { projectsAPI } from "../../../services/api";
import { logger } from "../utils/logger";
import { getLocalTimeZone, parseDate } from "@internationalized/date";

// 🧪 Breakpoint de Teste 2
export const TEST_BREAKPOINT_2 = false;

export const useProjectForm = (onClose, projectId = null, saveStatus = null, logoIndex = null) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingProject, setIsLoadingProject] = useState(!!projectId);

  // Estado do formulário
  const [formData, setFormData] = useState({
    name: "",
    projectType: null,
    simuWorkflow: null,
    status: "draft",
    category: "normal",
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
    snapZonesByImage: {},      // Zonas de snap por imagem (mantido vazio após remoção de zonas)
    decorationsByImage: {},   // Decorações por imagem: { 'image-id': [...] }
    cartoucheByImage: {},     // Metadados do cartouche por imagem: { 'image-id': { projectName, streetOrZone, option, hasCartouche } }
    uploadedImages: [],        // Lista de imagens uploadadas para o projeto
    simulationState: {        // Estado da simulação
      uploadStep: 'uploading', // 'uploading' | 'loading' | 'done'
      selectedImageId: null,
      isDayMode: true,
      conversionComplete: {}
    },
    logoDetails: {},          // Dados das instruções do logo (apenas para projetos tipo logo)
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

          // Determinar simuWorkflow baseado nos dados do projeto
          // Se tem dados do AI Designer (canvasDecorations, canvasImages), é workflow "ai"
          const hasAIDesignerData = !!(project.canvasDecorations?.length || project.canvasImages?.length);
          const simuWorkflow = project.projectType === "simu" && hasAIDesignerData ? "ai" : null;
          
          // Restaurar estado completo do formulário
          setFormData({
            id: project.id,
            name: project.name || "",
            projectType: project.projectType || null,
            simuWorkflow: simuWorkflow, // Determinar baseado nos dados do projeto
            status: project.status || "draft",
            category: project.category || "normal",
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
            cartoucheByImage: project.cartoucheByImage || {},
            uploadedImages: project.uploadedImages || [],
            simulationState: project.simulationState || {
              uploadStep: project.uploadedImages && project.uploadedImages.length > 0 ? 'done' : 'uploading',
              selectedImageId: null,
              isDayMode: true,
              conversionComplete: {}
            },
            logoDetails: (() => {
              // Se logoIndex foi fornecido, carregar esse logo específico para currentLogo
              if (logoIndex !== null && logoIndex !== undefined && project.logoDetails) {
                const savedLogos = project.logoDetails.logos || [];
                const hasCurrentLogo = project.logoDetails.currentLogo?.logoNumber || project.logoDetails.logoNumber;
                
                // Usar a mesma lógica do ProjectDetails para construir logoInstructions
                const logoInstructions = savedLogos.length > 0 ? savedLogos : (hasCurrentLogo ? [project.logoDetails.currentLogo || project.logoDetails] : []);
                
                console.log('🔍 useProjectForm: Loading logo for editing', {
                  logoIndex,
                  savedLogosCount: savedLogos.length,
                  hasCurrentLogo,
                  logoInstructionsCount: logoInstructions.length,
                  logoInstructions: logoInstructions.map(l => ({ logoNumber: l.logoNumber, logoName: l.logoName }))
                });
                
                if (logoInstructions[logoIndex] !== undefined) {
                  const logoToEdit = logoInstructions[logoIndex];
                  console.log('✅ useProjectForm: Logo found for editing', {
                    logoNumber: logoToEdit.logoNumber,
                    logoName: logoToEdit.logoName
                  });
                  
                  // Remove o logo do array de savedLogos se estiver lá
                  let newSavedLogos = savedLogos.filter((logo) => {
                    return logo.logoNumber !== logoToEdit.logoNumber;
                  });
                  
                  // Se currentLogo é válido e diferente do logo a editar, adicionar aos savedLogos
                  const currentLogo = project.logoDetails.currentLogo || project.logoDetails;
                  const isCurrentLogoValid = currentLogo?.logoNumber && currentLogo.logoNumber !== logoToEdit.logoNumber;
                  
                  if (isCurrentLogoValid && currentLogo.logoNumber) {
                    const logoToSave = {
                      ...currentLogo,
                      id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      savedAt: new Date().toISOString()
                    };
                    newSavedLogos.push(logoToSave);
                  }
                  
                  logger.lifecycle('useProjectForm', 'Logo loaded for editing', {
                    logoIndex,
                    logoNumber: logoToEdit.logoNumber,
                    logoName: logoToEdit.logoName
                  });
                  
                  // Retornar logoDetails atualizado com o logo a editar como currentLogo
                  return {
                    ...project.logoDetails,
                    logos: newSavedLogos,
                    currentLogo: { ...logoToEdit }
                  };
                } else {
                  console.warn('⚠️ useProjectForm: Logo not found at index', logoIndex, 'Available logos:', logoInstructions.length);
                }
              }
              
              // Se não há logoIndex ou logo não encontrado, retornar logoDetails original
              return project.logoDetails || {};
            })(),
          });

          logger.lifecycle('useProjectForm', 'Project loaded successfully', {
            projectId: project.id,
            name: project.name,
            hasCanvasData: !!(project.canvasDecorations?.length || project.canvasImages?.length),
            logoIndex
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
  }, [projectId, logoIndex]);

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
        status: "created", // Status definido como "created" ao finalizar o projeto
        category: formData.category || "normal",
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: new Date().toISOString(), // Data de criação do projeto
        endDate: formData.endDate ? formData.endDate.toDate(getLocalTimeZone()).toISOString() : null,
        // Dados do canvas (AI Designer)
        canvasDecorations: formData.canvasDecorations || [],
        canvasImages: formData.canvasImages || [],
        snapZonesByImage: formData.snapZonesByImage || {}, // Mantido vazio após remoção de zonas
        decorationsByImage: formData.decorationsByImage || {},
        // Metadados do cartouche (nome da rua, projeto, opção) - IMPORTANTE: ficam associados às imagens
        cartoucheByImage: formData.cartoucheByImage || {},
        // Estado das simulações
        uploadedImages: formData.uploadedImages || [],
        simulationState: formData.simulationState || {
          uploadStep: 'uploading',
          selectedImageId: null,
          isDayMode: true,
          conversionComplete: {}
        },
        // Dados das instruções do logo (apenas para projetos tipo logo)
        // Garantir que o currentLogo válido seja incluído nos savedLogos antes de salvar
        logoDetails: (() => {
          const logoDetails = formData.logoDetails || {};
          if (formData.projectType === 'logo' && logoDetails) {
            const savedLogos = logoDetails.logos || [];
            const currentLogo = logoDetails.currentLogo || logoDetails;
            
            console.log('🔍 [handleSubmit] Verificando logoDetails:', {
              savedLogosCount: savedLogos.length,
              hasCurrentLogo: !!currentLogo,
              currentLogoNumber: currentLogo.logoNumber,
              currentLogoName: currentLogo.logoName
            });
            
            // Verificar se currentLogo é válido (mesma validação que isLogoValid)
            const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
            const hasLogoName = currentLogo.logoName?.trim() !== "";
            const hasDescription = currentLogo.description?.trim() !== "";
            const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
            const hasFixationType = currentLogo.fixationType?.trim() !== "";
            const dimensions = currentLogo.dimensions || {};
            const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "";
            const hasLength = dimensions.length?.value != null && dimensions.length.value !== "";
            const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "";
            const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "";
            const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
            const isCurrentLogoValid = hasLogoNumber && hasLogoName && hasDescription && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
            
            console.log('🔍 [handleSubmit] Validação do currentLogo:', {
              hasLogoNumber,
              hasLogoName,
              hasDescription,
              hasRequestedBy,
              hasFixationType,
              hasAtLeastOneDimension,
              isCurrentLogoValid
            });
            
            // Se currentLogo é válido e ainda não está nos savedLogos, adicioná-lo
            if (isCurrentLogoValid) {
              // Verificar se o currentLogo já está nos savedLogos
              // IMPORTANTE: Comparar por ID primeiro (mais confiável)
              // Se o currentLogo tem ID, só considerar como "já salvo" se encontrar um logo salvo com o mesmo ID
              // Se o currentLogo não tem ID, comparar por logoNumber (mas só se ambos existirem e forem iguais)
              const alreadySaved = savedLogos.some(logo => {
                // Se currentLogo tem ID, só considerar como "já salvo" se o ID for igual
                if (currentLogo.id) {
                  return logo.id === currentLogo.id;
                }
                // Se currentLogo não tem ID, comparar por logoNumber (mas só se ambos existirem e forem iguais)
                // E também verificar se o logo salvo não tem ID (para evitar falsos positivos)
                if (logo.logoNumber && currentLogo.logoNumber && !logo.id) {
                  return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
                }
                return false;
              });
              
              console.log('🔍 [handleSubmit] currentLogo já está salvo?', alreadySaved, {
                currentLogoId: currentLogo.id,
                currentLogoNumber: currentLogo.logoNumber,
                savedLogosIds: savedLogos.map(l => l.id),
                savedLogosNumbers: savedLogos.map(l => l.logoNumber)
              });
              
              if (!alreadySaved) {
                const logoToSave = {
                  ...currentLogo,
                  id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  savedAt: currentLogo.savedAt || new Date().toISOString()
                };
                
                console.log('✅ [handleSubmit] Adicionando currentLogo aos savedLogos:', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  totalLogos: savedLogos.length + 1
                });
                
                return {
                  ...logoDetails,
                  logos: [...savedLogos, logoToSave],
                  currentLogo: currentLogo // Manter currentLogo também
                };
              } else {
                console.log('⏭️ [handleSubmit] currentLogo já está nos savedLogos, mantendo como está');
              }
            } else {
              console.log('⚠️ [handleSubmit] currentLogo não é válido, não será adicionado aos savedLogos');
            }
          }
          return logoDetails;
        })(),
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
        // Log removido
      }

      // Log detalhado do logoDetails antes de enviar
      console.log('📤 [handleSubmit] Dados do projeto a serem enviados:', {
        projectType: projectData.projectType,
        logoDetails: projectData.logoDetails,
        savedLogosCount: projectData.logoDetails?.logos?.length || 0,
        hasCurrentLogo: !!projectData.logoDetails?.currentLogo,
        currentLogoNumber: projectData.logoDetails?.currentLogo?.logoNumber
      });
      
      logger.api('projects', 'POST', projectData);
      logger.lifecycle('useProjectForm', 'Submitting project', projectData);

      // Logs de teste removidos

      // Se já existe tempProjectId ou projectId, atualizar projeto existente em vez de criar novo
      let finalProject;
      const projectIdToUpdate = projectId || formData.tempProjectId;
      if (projectIdToUpdate) {
        // Atualizar projeto existente
        // Se é um projeto temporário (tempProjectId) e não tem startDate, definir como data atual
        // Se é edição de projeto existente (projectId), não alterar startDate
        if (formData.tempProjectId && !projectId) {
          // É atualização de projeto temporário - verificar se já tem startDate
          try {
            const existingProject = await projectsAPI.getById(projectIdToUpdate);
            if (!existingProject.startDate) {
              // Se não tem startDate, definir como data atual (finalização da criação)
              projectData.startDate = new Date().toISOString();
            }
          } catch (err) {
            // Se não conseguir buscar, definir startDate como data atual
            projectData.startDate = new Date().toISOString();
          }
        }
        // Se projectId existe, é edição de projeto existente - não alterar startDate
        finalProject = await projectsAPI.update(projectIdToUpdate, projectData);
        logger.lifecycle('useProjectForm', 'Project updated', finalProject);
      } else {
        // Criar novo projeto - definir startDate como data atual (finalização da criação)
        const createData = {
          ...projectData,
          startDate: new Date().toISOString(), // Data de criação do projeto
        };
        finalProject = await projectsAPI.create(createData);
        logger.lifecycle('useProjectForm', 'Project created', finalProject);
      }

      // Atualizar formData com o ID do projeto
      setFormData(prev => ({
        ...prev,
        id: finalProject.id,
        tempProjectId: finalProject.id
      }));

      // Fechar modal se houver e redirecionar para a página de overview do projeto
      if (onClose) {
        onClose();  // Fecha modal e recarrega dados
      }
      // Redirecionar para a página de overview do projeto criado
      navigate(`/projects/${finalProject.id}`);
    } catch (err) {
      logger.error('useProjectForm.handleSubmit', err);

      // Logs de teste removidos

      setError(err.response?.data?.error || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // Save current project state without closing modal
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Indicate save start
      if (saveStatus) saveStatus.setSaving();

      const projectData = {
        name: formData.name,
        clientName: formData.clientName,
        projectType: formData.projectType || 'decor',
        status: formData.status || 'draft',
        category: formData.category || "normal",
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        endDate: formData.endDate ? formData.endDate.toDate(getLocalTimeZone()).toISOString() : null,
        canvasDecorations: formData.canvasDecorations || [],
        canvasImages: formData.canvasImages || [],
        snapZonesByImage: formData.snapZonesByImage || {},
        decorationsByImage: formData.decorationsByImage || {},
        cartoucheByImage: formData.cartoucheByImage || {},
        uploadedImages: formData.uploadedImages || [],
        simulationState: formData.simulationState || {
          uploadStep: 'uploading',
          selectedImageId: null,
          isDayMode: true,
          conversionComplete: {}
        },
        // Dados das instruções do logo (apenas para projetos tipo logo)
        // Garantir que o currentLogo válido seja incluído nos savedLogos antes de salvar
        logoDetails: (() => {
          const logoDetails = formData.logoDetails || {};
          if (formData.projectType === 'logo' && logoDetails) {
            const savedLogos = logoDetails.logos || [];
            const currentLogo = logoDetails.currentLogo || logoDetails;
            
            console.log('🔍 [handleSave] Verificando logoDetails:', {
              savedLogosCount: savedLogos.length,
              hasCurrentLogo: !!currentLogo,
              currentLogoNumber: currentLogo.logoNumber,
              currentLogoName: currentLogo.logoName
            });
            
            // Verificar se currentLogo é válido (mesma validação que isLogoValid)
            const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
            const hasLogoName = currentLogo.logoName?.trim() !== "";
            const hasDescription = currentLogo.description?.trim() !== "";
            const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
            const hasFixationType = currentLogo.fixationType?.trim() !== "";
            const dimensions = currentLogo.dimensions || {};
            const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "";
            const hasLength = dimensions.length?.value != null && dimensions.length.value !== "";
            const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "";
            const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "";
            const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
            const isCurrentLogoValid = hasLogoNumber && hasLogoName && hasDescription && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
            
            console.log('🔍 [handleSave] Validação do currentLogo:', {
              hasLogoNumber,
              hasLogoName,
              hasDescription,
              hasRequestedBy,
              hasFixationType,
              hasAtLeastOneDimension,
              isCurrentLogoValid
            });
            
            // Se currentLogo é válido e ainda não está nos savedLogos, adicioná-lo
            if (isCurrentLogoValid) {
              // Verificar se o currentLogo já está nos savedLogos
              // IMPORTANTE: Comparar por ID primeiro (mais confiável)
              // Se o currentLogo tem ID, só considerar como "já salvo" se encontrar um logo salvo com o mesmo ID
              // Se o currentLogo não tem ID, comparar por logoNumber (mas só se ambos existirem e forem iguais)
              const alreadySaved = savedLogos.some(logo => {
                // Se currentLogo tem ID, só considerar como "já salvo" se o ID for igual
                if (currentLogo.id) {
                  return logo.id === currentLogo.id;
                }
                // Se currentLogo não tem ID, comparar por logoNumber (mas só se ambos existirem e forem iguais)
                // E também verificar se o logo salvo não tem ID (para evitar falsos positivos)
                if (logo.logoNumber && currentLogo.logoNumber && !logo.id) {
                  return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
                }
                return false;
              });
              
              console.log('🔍 [handleSave] currentLogo já está salvo?', alreadySaved, {
                currentLogoId: currentLogo.id,
                currentLogoNumber: currentLogo.logoNumber,
                savedLogosIds: savedLogos.map(l => l.id),
                savedLogosNumbers: savedLogos.map(l => l.logoNumber)
              });
              
              if (!alreadySaved) {
                const logoToSave = {
                  ...currentLogo,
                  id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  savedAt: currentLogo.savedAt || new Date().toISOString()
                };
                
                console.log('✅ [handleSave] Adicionando currentLogo aos savedLogos:', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  totalLogos: savedLogos.length + 1
                });
                
                return {
                  ...logoDetails,
                  logos: [...savedLogos, logoToSave],
                  currentLogo: currentLogo // Manter currentLogo também
                };
              } else {
                console.log('⏭️ [handleSave] currentLogo já está nos savedLogos, mantendo como está');
              }
            } else {
              console.log('⚠️ [handleSave] currentLogo não é válido, não será adicionado aos savedLogos');
            }
          }
          return logoDetails;
        })(),
      };

      const projectIdToUpdate = projectId || formData.tempProjectId;
      if (projectIdToUpdate) {
        await projectsAPI.update(projectIdToUpdate, projectData);
        logger.lifecycle('useProjectForm', 'Project saved', { projectId: projectIdToUpdate });

        // Indicate save success
        if (saveStatus) saveStatus.setSaved();
      } else {
        throw new Error('No project ID available for saving');
      }
    } catch (err) {
      logger.error('useProjectForm.handleSave', err);

      // Indicate save error
      if (saveStatus) saveStatus.setError();

      setError(err.response?.data?.error || "Failed to save project");
      throw err;
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
      // Indicar início do salvamento
      if (saveStatus) saveStatus.setSaving();

      const projectData = {
        name: formData.name,
        clientName: formData.clientName,
        projectType: formData.projectType || 'decor',
        status: 'draft',
        category: formData.category || "normal",
        location: formData.location,
        description: formData.description,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        startDate: null, // Será definido apenas quando o projeto for finalizado
        endDate: formData.endDate ? formData.endDate.toDate(getLocalTimeZone()).toISOString() : null,
      };

      const newProject = await projectsAPI.create(projectData);

      // Guardar ID temporário no formData
      setFormData(prev => ({
        ...prev,
        tempProjectId: newProject.id,
        id: newProject.id
      }));

      // Indicar salvamento bem-sucedido
      if (saveStatus) saveStatus.setSaved();

      logger.lifecycle('useProjectForm', 'Temporary project created', newProject);
      return newProject.id;
    } catch (err) {
      console.error('❌ [CREATE TEMP PROJECT] ===== ERRO AO CRIAR PROJETO TEMPORÁRIO =====');
      console.error('❌ [CREATE TEMP PROJECT] Erro:', err.message);
      console.error('❌ [CREATE TEMP PROJECT] Stack:', err.stack);

      // Indicar erro no salvamento
      if (saveStatus) saveStatus.setError();

      logger.error('useProjectForm.createTempProject', err);
      throw err;
    }
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    handleSave,
    createTempProject,
    loading: loading || isLoadingProject,
    error,
    setError,
  };
};

