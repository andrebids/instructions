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
    enableNotes: false, // Controla se o step "Notes" deve aparecer
    notes: [], // Array de notas organizadas por tópicos
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
            enableNotes: project.enableNotes ?? false, // Restaurar se existir, senão false
            notes: project.notes || [], // Restaurar notas se existirem
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
                const currentLogo = project.logoDetails.currentLogo || project.logoDetails;
                
                // Usar a MESMA lógica do StepConfirmDetails para construir allLogos
                // Verificar se currentLogo é válido (mesma validação que StepConfirmDetails)
                const isCurrentLogoEmpty = (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "") && 
                                           (!currentLogo.logoName || currentLogo.logoName.trim() === "") && 
                                           (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "");
                
                const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
                const hasLogoName = currentLogo.logoName?.trim() !== "";
                const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
                const dimensions = currentLogo.dimensions || {};
                const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && dimensions.height.value !== 0;
                const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && dimensions.length.value !== 0;
                const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && dimensions.width.value !== 0;
                const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && dimensions.diameter.value !== 0;
                const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
                const isCurrentLogoValid = !isCurrentLogoEmpty && hasLogoNumber && hasLogoName && hasRequestedBy && hasAtLeastOneDimension;
                
                // Construir allLogos da mesma forma que StepConfirmDetails
                // Verificar se o currentLogo já existe nos savedLogos (para evitar duplicatas)
                const currentLogoExistsInSaved = isCurrentLogoValid && savedLogos.some(logo => {
                  // Comparar por ID se disponível (mais confiável)
                  if (currentLogo.id && logo.id) {
                    return logo.id === currentLogo.id;
                  }
                  // Se não tem ID, comparar por logoNumber
                  if (currentLogo.logoNumber && logo.logoNumber) {
                    return currentLogo.logoNumber.trim() === logo.logoNumber.trim();
                  }
                  return false;
                });
                
                const allLogos = isCurrentLogoValid && !currentLogoExistsInSaved 
                  ? [...savedLogos, currentLogo] 
                  : savedLogos;
                
                console.log('🔍 useProjectForm: Loading logo for editing', {
                  logoIndex,
                  savedLogosCount: savedLogos.length,
                  isCurrentLogoValid,
                  allLogosCount: allLogos.length,
                  allLogos: allLogos.map((l, i) => ({ index: i, logoNumber: l.logoNumber, logoName: l.logoName, id: l.id }))
                });
                
                if (allLogos[logoIndex] !== undefined) {
                  const logoToEdit = allLogos[logoIndex];
                  console.log('✅ useProjectForm: Logo found for editing', {
                    logoNumber: logoToEdit.logoNumber,
                    logoName: logoToEdit.logoName,
                    id: logoToEdit.id,
                    isCurrent: isCurrentLogoValid && logoIndex === allLogos.length - 1
                  });
                  
                  // Se o logo a editar é o currentLogo válido, apenas retornar os dados como estão
                  if (isCurrentLogoValid && logoIndex === allLogos.length - 1) {
                    // O logo já está no currentLogo, preservar _originalIndex se existir
                    const currentLogoWithIndex = {
                      ...logoToEdit,
                      _originalIndex: logoToEdit._originalIndex !== undefined ? logoToEdit._originalIndex : (savedLogos.length > 0 ? savedLogos.length - 1 : null)
                    };
                    return {
                      ...project.logoDetails,
                      logos: savedLogos,
                      currentLogo: currentLogoWithIndex
                    };
                  }
                  
                  // Encontrar o índice original do logo nos savedLogos antes de removê-lo
                  const originalIndexInSaved = savedLogos.findIndex((logo) => {
                    if (logo.id && logoToEdit.id) {
                      return logo.id === logoToEdit.id;
                    }
                    if (logo.logoNumber && logoToEdit.logoNumber) {
                      return logo.logoNumber.trim() === logoToEdit.logoNumber.trim();
                    }
                    return false;
                  });
                  
                  // Se o logo está nos savedLogos, remover dos savedLogos e colocar no currentLogo
                  let newSavedLogos = savedLogos.filter((logo) => {
                    // Comparar por ID se disponível, senão por logoNumber
                    if (logo.id && logoToEdit.id) {
                      return logo.id !== logoToEdit.id;
                    }
                    if (logo.logoNumber && logoToEdit.logoNumber) {
                      return logo.logoNumber.trim() !== logoToEdit.logoNumber.trim();
                    }
                    return true; // Se não conseguir comparar, manter
                  });
                  
                  // Se currentLogo é válido e diferente do logo a editar, adicionar aos savedLogos
                  if (isCurrentLogoValid && currentLogo.logoNumber && currentLogo.logoNumber !== logoToEdit.logoNumber) {
                    const logoToSave = {
                      ...currentLogo,
                      id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                      savedAt: currentLogo.savedAt || new Date().toISOString()
                    };
                    newSavedLogos.push(logoToSave);
                  }
                  
                  logger.lifecycle('useProjectForm', 'Logo loaded for editing', {
                    logoIndex,
                    logoNumber: logoToEdit.logoNumber,
                    logoName: logoToEdit.logoName,
                    originalIndexInSaved
                  });
                  
                  // IMPORTANTE: Preservar _originalIndex para que quando salvar, saiba onde substituir
                  const logoToEditWithIndex = {
                    ...logoToEdit,
                    _originalIndex: originalIndexInSaved >= 0 ? originalIndexInSaved : (logoToEdit._originalIndex !== undefined ? logoToEdit._originalIndex : null)
                  };
                  
                  // Retornar logoDetails atualizado com o logo a editar como currentLogo
                  return {
                    ...project.logoDetails,
                    logos: newSavedLogos,
                    currentLogo: logoToEditWithIndex
                  };
                } else {
                  console.warn('⚠️ useProjectForm: Logo not found at index', logoIndex, 'Available logos:', allLogos.length);
                }
              }
              
              // Se não há logoIndex ou logo não encontrado, verificar se currentLogo já está nos savedLogos
              // Se estiver, limpar o currentLogo para evitar duplicados
              const logoDetails = project.logoDetails || {};
              const savedLogos = logoDetails.logos || [];
              const currentLogo = logoDetails.currentLogo || logoDetails;
              
              // Verificar se o currentLogo já está nos savedLogos (por ID ou logoNumber)
              if (currentLogo && (currentLogo.logoNumber || currentLogo.logoName)) {
                const isCurrentLogoInSaved = savedLogos.some(logo => {
                  if (currentLogo.id && logo.id) {
                    return logo.id === currentLogo.id;
                  }
                  if (currentLogo.logoNumber && logo.logoNumber) {
                    return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
                  }
                  return false;
                });
                
                // Se o currentLogo já está nos savedLogos, limpá-lo para evitar duplicados
                if (isCurrentLogoInSaved) {
                  console.log('🧹 [useProjectForm] Limpando currentLogo que já está nos savedLogos');
                  return {
                    ...logoDetails,
                    currentLogo: {
                      logoNumber: "",
                      logoName: "",
                      requestedBy: "",
                      dimensions: {},
                      usageOutdoor: false,
                      usageIndoor: true,
                      fixationType: "",
                      lacqueredStructure: false,
                      lacquerColor: "",
                      mastDiameter: "",
                      maxWeightConstraint: false,
                      maxWeight: "",
                      ballast: false,
                      controlReport: false,
                      criteria: "",
                      description: "",
                      composition: {
                        componentes: [],
                        bolas: []
                      },
                      attachmentFiles: []
                    }
                  };
                }
              }
              
              // Retornar logoDetails original
              return logoDetails;
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
        enableNotes: formData.enableNotes ?? false,
        // Inicializar campo notes quando enableNotes é true
        notes: formData.enableNotes === true ? (formData.notes || []) : (formData.notes || []),
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
            
            // Se currentLogo é válido, atualizar ou adicionar aos savedLogos
            if (isCurrentLogoValid) {
              // Verificar se o currentLogo já está nos savedLogos (por ID ou logoNumber)
              const existingLogoIndex = savedLogos.findIndex(logo => {
                // Se currentLogo tem ID, comparar por ID
                if (currentLogo.id && logo.id) {
                  return logo.id === currentLogo.id;
                }
                // Se não tem ID, comparar por logoNumber
                if (logo.logoNumber && currentLogo.logoNumber) {
                  return logo.logoNumber.trim() === currentLogo.logoNumber.trim();
                }
                return false;
              });
              
              // Remover _originalIndex antes de salvar (é apenas para controle interno)
              const { _originalIndex, ...logoWithoutOriginalIndex } = currentLogo;
              
              const logoToSave = {
                ...logoWithoutOriginalIndex,
                id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                savedAt: currentLogo.savedAt || new Date().toISOString()
              };
              
              let updatedSavedLogos;
              
              if (existingLogoIndex >= 0) {
                // Logo já existe - ATUALIZAR em vez de criar novo
                updatedSavedLogos = [...savedLogos];
                updatedSavedLogos[existingLogoIndex] = logoToSave;
                
                console.log('✅ [handleSubmit] Atualizando logo existente nos savedLogos:', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  index: existingLogoIndex,
                  totalLogos: updatedSavedLogos.length
                });
              } else if (currentLogo._originalIndex !== undefined && currentLogo._originalIndex >= 0 && currentLogo._originalIndex < savedLogos.length) {
                // Logo não existe mas tem posição original válida - SUBSTITUIR na posição original
                // IMPORTANTE: Substituir em vez de inserir para manter o mesmo número de logos
                updatedSavedLogos = [...savedLogos];
                updatedSavedLogos[currentLogo._originalIndex] = logoToSave;
                
                console.log('✅ [handleSubmit] Substituindo logo na posição original:', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  originalIndex: currentLogo._originalIndex,
                  totalLogos: updatedSavedLogos.length
                });
              } else {
                // Logo não existe e não tem posição original - ADICIONAR como novo no final
                updatedSavedLogos = [...savedLogos, logoToSave];
                
                console.log('✅ [handleSubmit] Adicionando novo logo aos savedLogos:', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  totalLogos: updatedSavedLogos.length
                });
              }
              
              // IMPORTANTE: Limpar currentLogo após salvar para evitar que apareça duplicado na lista
              return {
                ...logoDetails,
                logos: updatedSavedLogos,
                currentLogo: {
                  logoNumber: "",
                  logoName: "",
                  requestedBy: "",
                  dimensions: {},
                  usageOutdoor: false,
                  usageIndoor: true,
                  fixationType: "",
                  lacqueredStructure: false,
                  lacquerColor: "",
                  mastDiameter: "",
                  maxWeightConstraint: false,
                  maxWeight: "",
                  ballast: false,
                  controlReport: false,
                  criteria: "",
                  description: "",
                  composition: {
                    componentes: [],
                    bolas: []
                  },
                  attachmentFiles: []
                }
              };
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

      // IMPORTANTE: Atualizar formData local com o logoDetails atualizado (incluindo currentLogo limpo)
      setFormData(prev => ({
        ...prev,
        id: finalProject.id,
        tempProjectId: finalProject.id,
        logoDetails: projectData.logoDetails
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
        enableNotes: formData.enableNotes ?? false,
        // Inicializar campo notes quando enableNotes é true
        notes: formData.enableNotes === true ? (formData.notes || []) : (formData.notes || []),
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
            let savedLogos = logoDetails.logos || [];
            const currentLogo = logoDetails.currentLogo || logoDetails;
            
            // IMPORTANTE: Filtrar logos inválidos dos savedLogos antes de processar
            // Um logo é inválido se não tem logoName (campo obrigatório)
            savedLogos = savedLogos.filter(logo => {
              const hasLogoName = logo.logoName?.trim() !== "";
              if (!hasLogoName) {
                console.warn('⚠️ [handleSave] Removendo logo inválido dos savedLogos (sem logoName):', {
                  logoId: logo.id,
                  logoNumber: logo.logoNumber
                });
              }
              return hasLogoName;
            });
            
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
            
            // Helper function para verificar se uma dimensão é válida (mesma lógica da validação)
            const isValidDimension = (value) => {
              if (value == null || value === "" || value === "0" || value === "0.00") {
                return false;
              }
              const numValue = typeof value === 'number' ? value : parseFloat(value);
              return !isNaN(numValue) && numValue > 0;
            };
            
            const hasHeight = isValidDimension(dimensions.height?.value);
            const hasLength = isValidDimension(dimensions.length?.value);
            const hasWidth = isValidDimension(dimensions.width?.value);
            const hasDiameter = isValidDimension(dimensions.diameter?.value);
            const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
            const isCurrentLogoValid = hasLogoNumber && hasLogoName && hasDescription && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
            
            console.log('🔍 [handleSave] Validação do currentLogo:', {
              hasLogoNumber,
              hasLogoName,
              hasDescription,
              hasRequestedBy,
              hasFixationType,
              hasAtLeastOneDimension,
              isCurrentLogoValid,
              dimensions: {
                height: dimensions.height?.value,
                length: dimensions.length?.value,
                width: dimensions.width?.value,
                diameter: dimensions.diameter?.value
              },
              dimensionChecks: { hasHeight, hasLength, hasWidth, hasDiameter }
            });
            
            // Se currentLogo é válido, atualizar ou adicionar aos savedLogos
            if (isCurrentLogoValid) {
              // Guardar _originalIndex antes de remover (é apenas para controle interno)
              const originalIndex = currentLogo._originalIndex;
              
              // Remover _originalIndex antes de salvar (é apenas para controle interno)
              const { _originalIndex, ...logoWithoutOriginalIndex } = currentLogo;
              
              const logoToSave = {
                ...logoWithoutOriginalIndex,
                id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                savedAt: currentLogo.savedAt || new Date().toISOString()
              };
              
              console.log('🔍 [handleSave] Verificando logo para salvar:', {
                logoId: logoToSave.id,
                logoNumber: logoToSave.logoNumber,
                logoName: logoToSave.logoName,
                originalIndex: originalIndex,
                savedLogosCount: savedLogos.length,
                savedLogosIds: savedLogos.map(l => ({ id: l.id, logoNumber: l.logoNumber }))
              });
              
              // Verificar se o currentLogo já está nos savedLogos (por ID ou logoNumber)
              // IMPORTANTE: Se o logo foi removido dos savedLogos para edição, pode não estar mais lá
              // Por isso, também verificamos o originalIndex
              const existingLogoIndex = savedLogos.findIndex(logo => {
                // Se currentLogo tem ID, comparar por ID (mais confiável)
                if (logoToSave.id && logo.id) {
                  return logo.id === logoToSave.id;
                }
                // Se não tem ID, comparar por logoNumber
                if (logo.logoNumber && logoToSave.logoNumber) {
                  return logo.logoNumber.trim() === logoToSave.logoNumber.trim();
                }
                return false;
              });
              
              // IMPORTANTE: Se o logo foi editado (tem originalIndex), sempre substituir na posição original
              // mesmo que não encontre por ID/logoNumber (porque foi removido dos savedLogos para edição)
              let updatedSavedLogos;
              let finalExistingIndex = -1; // Índice final onde o logo foi colocado
              
              if (existingLogoIndex >= 0) {
                // Logo encontrado por ID/logoNumber - SUBSTITUIR na posição encontrada
                updatedSavedLogos = [...savedLogos];
                updatedSavedLogos[existingLogoIndex] = logoToSave;
                finalExistingIndex = existingLogoIndex;
                
                console.log('✅ [handleSave] Substituindo logo existente nos savedLogos (encontrado por ID/logoNumber):', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  logoId: logoToSave.id,
                  index: existingLogoIndex,
                  totalLogos: updatedSavedLogos.length
                });
              } else if (originalIndex !== undefined && originalIndex >= 0) {
                // Logo foi editado (tem originalIndex) - SUBSTITUIR na posição original
                // IMPORTANTE: Se o logo foi removido dos savedLogos para edição, ele não está mais lá
                // Mas sabemos a posição original, então devemos substituir nessa posição
                updatedSavedLogos = [...savedLogos];
                
                if (originalIndex < updatedSavedLogos.length) {
                  // Posição válida - SUBSTITUIR (pode ser que outro logo esteja nessa posição, mas substituímos mesmo assim)
                  updatedSavedLogos[originalIndex] = logoToSave;
                  finalExistingIndex = originalIndex;
                  console.log('✅ [handleSave] Substituindo logo editado na posição original:', {
                    logoNumber: logoToSave.logoNumber,
                    logoName: logoToSave.logoName,
                    logoId: logoToSave.id,
                    originalIndex: originalIndex,
                    totalLogos: updatedSavedLogos.length
                  });
                } else {
                  // Posição fora dos limites - o array mudou enquanto editávamos
                  // IMPORTANTE: Se o originalIndex era o último logo antes de remover, 
                  // o array agora tem um logo a menos, então o originalIndex seria savedLogos.length
                  // Nesse caso, substituir no final (não adicionar um novo)
                  // Se o originalIndex era menor, significa que outros logos foram removidos
                  // Nesse caso, também substituir no final para manter o número de logos
                  // IMPORTANTE: Quando o logo foi removido dos savedLogos para edição,
                  // o array ficou menor. O originalIndex aponta para a posição ANTES de remover.
                  // Se originalIndex >= savedLogos.length, significa que era o último logo
                  // e agora o array tem um logo a menos, então devemos substituir no final.
                  // Se originalIndex < savedLogos.length, significa que outros logos foram removidos
                  // e devemos substituir na posição mais próxima possível.
                  // IMPORTANTE: NUNCA adicionar um novo logo quando temos originalIndex (logo foi editado)
                  // IMPORTANTE: Quando o logo foi removido dos savedLogos para edição,
                  // o array ficou menor. O originalIndex aponta para a posição ANTES de remover.
                  // Se originalIndex >= savedLogos.length, significa que era o último logo
                  // e agora o array tem um logo a menos, então devemos substituir no final.
                  // Se originalIndex < savedLogos.length, significa que outros logos foram removidos
                  // e devemos substituir na posição mais próxima possível.
                  // IMPORTANTE: NUNCA adicionar um novo logo quando temos originalIndex (logo foi editado)
                  // Se o originalIndex está fora dos limites, significa que o logo foi removido
                  // e o array ficou menor. Nesse caso, devemos substituir no final para manter
                  // o número de logos igual ao que era antes de remover.
                  const targetPosition = Math.min(originalIndex, updatedSavedLogos.length);
                  
                  // Sempre substituir na posição targetPosition, não adicionar
                  // Se targetPosition === updatedSavedLogos.length, significa que era o último logo
                  // e devemos substituir no final (que é a posição correta após remover)
                  if (targetPosition < updatedSavedLogos.length) {
                    // Substituir na posição mais próxima possível
                    updatedSavedLogos[targetPosition] = logoToSave;
                    finalExistingIndex = targetPosition;
                  } else {
                    // Era o último logo - substituir no final (mantém o número de logos)
                    // IMPORTANTE: Não usar push, usar indexação direta para substituir
                    updatedSavedLogos[targetPosition] = logoToSave;
                    finalExistingIndex = targetPosition;
                  }
                  console.log('⚠️ [handleSave] Logo editado com posição original fora dos limites, ajustando:', {
                    logoNumber: logoToSave.logoNumber,
                    logoName: logoToSave.logoName,
                    logoId: logoToSave.id,
                    originalIndex: originalIndex,
                    targetPosition: targetPosition,
                    savedLogosLength: savedLogos.length,
                    totalLogos: updatedSavedLogos.length
                  });
                }
              } else {
                // Logo não existe e não tem posição original - ADICIONAR como novo no final
                updatedSavedLogos = [...savedLogos, logoToSave];
                finalExistingIndex = updatedSavedLogos.length - 1; // Novo logo adicionado no final
                
                console.log('✅ [handleSave] Adicionando novo logo aos savedLogos:', {
                  logoNumber: logoToSave.logoNumber,
                  logoName: logoToSave.logoName,
                  logoId: logoToSave.id,
                  totalLogos: updatedSavedLogos.length
                });
              }
              
              // IMPORTANTE: Garantir que todos os logos salvos tenham logoName
              // Filtrar qualquer logo que não tenha logoName (proteção adicional)
              const validSavedLogos = updatedSavedLogos.filter(logo => {
                const hasLogoName = logo.logoName?.trim() !== "";
                if (!hasLogoName) {
                  console.warn('⚠️ [handleSave] Removendo logo inválido (sem logoName) antes de salvar:', {
                    logoId: logo.id,
                    logoNumber: logo.logoNumber
                  });
                }
                return hasLogoName;
              });
              
              // IMPORTANTE: Se o logo já existe nos savedLogos (foi editado), limpar currentLogo
              // para evitar duplicação. Só manter no currentLogo se for um logo novo.
              // Se estamos editando um logo específico (logoIndex fornecido) E o logo já existe,
              // limpar o currentLogo porque o logo já está nos savedLogos atualizado.
              if (finalExistingIndex >= 0) {
                // Logo já existe nos savedLogos (foi editado) - limpar currentLogo para evitar duplicação
                return {
                  ...logoDetails,
                  logos: validSavedLogos,
                  currentLogo: {
                    logoNumber: "",
                    logoName: "",
                    requestedBy: "",
                    dimensions: {},
                    usageOutdoor: false,
                    usageIndoor: true,
                    fixationType: "",
                    lacqueredStructure: false,
                    lacquerColor: "",
                    mastDiameter: "",
                    maxWeightConstraint: false,
                    maxWeight: "",
                    ballast: false,
                    controlReport: false,
                    criteria: "",
                    description: "",
                    composition: {
                      componentes: [],
                      bolas: []
                    },
                    attachmentFiles: []
                  }
                };
              } else if (logoIndex !== null && logoIndex !== undefined) {
                // Modo edição mas logo não existe ainda (caso raro) - manter no currentLogo
                // Filtrar logos inválidos antes de salvar
                const validSavedLogos = updatedSavedLogos.filter(logo => {
                  const hasLogoName = logo.logoName?.trim() !== "";
                  if (!hasLogoName) {
                    console.warn('⚠️ [handleSave] Removendo logo inválido (sem logoName) antes de salvar:', {
                      logoId: logo.id,
                      logoNumber: logo.logoNumber
                    });
                  }
                  return hasLogoName;
                });
                
                return {
                  ...logoDetails,
                  logos: validSavedLogos,
                  currentLogo: logoToSave
                };
              } else {
                // Modo criação: limpar currentLogo após salvar
                // Filtrar logos inválidos antes de salvar
                const validSavedLogos = updatedSavedLogos.filter(logo => {
                  const hasLogoName = logo.logoName?.trim() !== "";
                  if (!hasLogoName) {
                    console.warn('⚠️ [handleSave] Removendo logo inválido (sem logoName) antes de salvar:', {
                      logoId: logo.id,
                      logoNumber: logo.logoNumber
                    });
                  }
                  return hasLogoName;
                });
                
                return {
                  ...logoDetails,
                  logos: validSavedLogos,
                  currentLogo: {
                    logoNumber: "",
                    logoName: "",
                    requestedBy: "",
                    dimensions: {},
                    usageOutdoor: false,
                    usageIndoor: true,
                    fixationType: "",
                    lacqueredStructure: false,
                    lacquerColor: "",
                    mastDiameter: "",
                    maxWeightConstraint: false,
                    maxWeight: "",
                    ballast: false,
                    controlReport: false,
                    criteria: "",
                    description: "",
                    composition: {
                      componentes: [],
                      bolas: []
                    },
                    attachmentFiles: []
                  }
                };
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

        // IMPORTANTE: Atualizar formData local com o logoDetails atualizado (incluindo currentLogo limpo)
        setFormData(prev => ({
          ...prev,
          logoDetails: projectData.logoDetails
        }));

        // Indicate save success
        if (saveStatus) saveStatus.setSaved();
      } else {
        throw new Error('No project ID available for saving');
      }
    } catch (err) {
      logger.error('useProjectForm.handleSave', err);
      
      // Log detalhado do erro para debug
      console.error('❌ [handleSave] Erro ao salvar projeto:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        projectId: projectId || formData.tempProjectId,
        projectType: formData.projectType,
        hasLogoDetails: !!formData.logoDetails
      });

      // Indicate save error
      if (saveStatus) saveStatus.setError();

      const errorMessage = err.response?.data?.error || err.message || "Failed to save project";
      setError(errorMessage);
      
      // Não fazer throw para não bloquear a UI, mas logar o erro
      console.error('❌ [handleSave] Erro não tratado:', errorMessage);
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
        enableNotes: formData.enableNotes ?? false,
        // Inicializar campo notes quando enableNotes é true
        notes: formData.enableNotes === true ? (formData.notes || []) : (formData.notes || []),
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

