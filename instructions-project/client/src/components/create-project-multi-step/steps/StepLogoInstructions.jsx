import React from "react";
import { useTranslation } from "react-i18next";
import { useFormikStep } from "../hooks/useFormikStep";
import { useLogoPersistence } from "../hooks/useLogoPersistence";
import { useUser } from "../../../context/UserContext";
import { AIAssistantChat } from "../components/AIAssistantChat";
import { StepIndicator } from "../components/StepIndicator";
import { validationSchema } from "./logo-instructions/utils/validationSchema";
import { useRequestedBy } from "./logo-instructions/hooks/useRequestedBy";
import { useLogoNumber } from "./logo-instructions/hooks/useLogoNumber";
import { useFileUpload } from "./logo-instructions/hooks/useFileUpload";
import { useProductModification } from "./logo-instructions/hooks/useProductModification";
import { useLogoComposition } from "./logo-instructions/hooks/useLogoComposition";
import { DetailsAndAttachmentsRenderer } from "./logo-instructions/renderers/DetailsAndAttachmentsRenderer";
import { DimensionsRenderer } from "./logo-instructions/renderers/DimensionsRenderer";
import { CompositionRenderer } from "./logo-instructions/renderers/CompositionRenderer";
import { SummaryRenderer } from "./logo-instructions/renderers/SummaryRenderer";

export function StepLogoInstructions({ formData, onInputChange, saveStatus, isCompact = false, onBack, onNext, onSave, projectId, currentStep, totalSteps, onInternalPageChange, handlersRef }) {
  const { t } = useTranslation();
  const logoDetails = formData.logoDetails || {};
  // Support both old structure (direct logoDetails) and new structure (with currentLogo)
  const rawCurrentLogo = logoDetails.currentLogo || logoDetails;
  // Garantir que isModification seja false por padrão se não estiver definido
  const currentLogo = {
    ...rawCurrentLogo,
    isModification: rawCurrentLogo.isModification === true ? true : false
  };
  const savedLogos = logoDetails.logos || [];
  const composition = currentLogo.composition || { componentes: [], bolas: [] };

  // Obter nome do usuário atual
  const { userName } = useUser();

  // Wizard state - controla a página atual do wizard step-by-step
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isFinishing, setIsFinishing] = React.useState(false);

  // Estado para controlar a visibilidade do chat
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  // Estado para rastrear qual attachment AI Generated está sendo editado
  const [editingAttachmentIndex, setEditingAttachmentIndex] = React.useState(null);

  // Ref para rastrear o ID do logo atual para detectar quando um novo logo é criado
  const currentLogoIdRef = React.useRef(currentLogo.id || null);

  // Ref para debounce do onAIStateChange e evitar loops infinitos
  const aiStateChangeTimeoutRef = React.useRef(null);
  const isProcessingAIStateChangeRef = React.useRef(false);

  // Notificar o componente pai sobre mudanças na página interna
  React.useEffect(() => {
    if (onInternalPageChange) {
      onInternalPageChange(currentPage);
    }
  }, [currentPage, onInternalPageChange]);

  const logoSteps = [
    { id: 'details-attachments', label: 'Details & Attachments' },
    { id: 'dimensions', label: 'Dimensions' },
    { id: 'composition', label: 'Composition' },
    { id: 'summary', label: 'Summary' }
  ];

  // Cleanup do timeout quando o componente for desmontado ou o chat fechar
  React.useEffect(() => {
    return () => {
      if (aiStateChangeTimeoutRef.current) {
        clearTimeout(aiStateChangeTimeoutRef.current);
      }
    };
  }, []);

  // Refs temporários para usar no onChange do formik antes dos hooks serem chamados
  const preservedRequestedByRefTemp = React.useRef(null);
  const preservedLogoNumberRefTemp = React.useRef(null);

  // Usar Formik para gerenciar estado e validação
  const formik = useFormikStep({
    initialValues: {
      logoNumber: currentLogo.logoNumber || "",
      logoName: currentLogo.logoName || "",
      requestedBy: currentLogo.requestedBy || "",
      budget: currentLogo.budget || "",
      dimensions: currentLogo.dimensions || {},
      // Manter outros campos para compatibilidade
      usageOutdoor: currentLogo.usageOutdoor || false,
      usageIndoor: currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true,
      fixationType: currentLogo.fixationType || "",
      lacqueredStructure: currentLogo.lacqueredStructure || false,
      lacquerColor: currentLogo.lacquerColor || "",
      mastDiameter: currentLogo.mastDiameter || "",
      maxWeightConstraint: currentLogo.maxWeightConstraint || false,
      maxWeight: currentLogo.maxWeight || "",
      ballast: currentLogo.ballast || false,
      controlReport: currentLogo.controlReport || false,
      criteria: currentLogo.criteria || "",
      description: currentLogo.description || "",
      // Campos de modificação de logo
      isModification: currentLogo.isModification || false,
      baseProductId: currentLogo.baseProductId || null,
      baseProduct: currentLogo.baseProduct || null,
      relatedProducts: currentLogo.relatedProducts || [],
      productSizes: currentLogo.productSizes || [],
    },
    validationSchema,
    onChange: (field, value) => {
      // Sincronizar com formData global através de currentLogo
      // IMPORTANTE: Preservar TODOS os valores do formik para não perder dados durante atualizações
      // IMPORTANTE: Preservar também _originalIndex, id e savedAt que são essenciais para identificar e posicionar logos editados

      // Usar o valor novo do parâmetro quando o campo sendo alterado é o mesmo, senão usar o valor do formik
      const updatedCurrentLogo = {
        ...currentLogo,
        // Preservar metadados importantes para logos editados
        id: currentLogo.id,
        savedAt: currentLogo.savedAt,
        _originalIndex: currentLogo._originalIndex,
        // Preservar TODOS os valores do formik (que podem ter sido digitados mas ainda não sincronizados)
        // IMPORTANTE: Se o campo sendo alterado é o mesmo, usar o valor novo do parâmetro, senão usar formik.values
        logoName: field === "logoName" ? value : (formik.values.logoName || currentLogo.logoName || ""),
        description: field === "description" ? value : (formik.values.description || currentLogo.description || ""),
        logoNumber: field === "logoNumber" ? value : (formik.values.logoNumber || currentLogo.logoNumber || ""),
        requestedBy: field === "requestedBy" ? value : (formik.values.requestedBy || currentLogo.requestedBy || ""),
        budget: field === "budget" ? value : (formik.values.budget || currentLogo.budget || ""),
        fixationType: field === "fixationType" ? value : (formik.values.fixationType || currentLogo.fixationType || ""),
        dimensions: field === "dimensions" ? value : (formik.values.dimensions || currentLogo.dimensions || {}),
        // Atualizar o campo específico que está sendo alterado (garantir que o valor novo seja usado)
        [field]: value,
        // Garantir que valores preservados sejam sempre incluídos se o campo atual estiver vazio
        ...(preservedRequestedByRefTemp.current && (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "") ? { requestedBy: preservedRequestedByRefTemp.current } : {}),
        ...(preservedLogoNumberRefTemp.current && (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "") ? { logoNumber: preservedLogoNumberRefTemp.current } : {}),
      };
      // Update logoDetails with new structure (preserving saved logos)
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos, // Preserve saved logos
      };
      onInputChange("logoDetails", updatedLogoDetails);
    },
    formData: currentLogo,
  });

  // Helper para atualizar logoDetails completo (mantém compatibilidade)
  // IMPORTANTE: Preservar todos os valores do formik para não perder dados durante atualizações
  const handleUpdate = React.useCallback((key, value) => {
    // Usar valores do formik como base para preservar todos os campos preenchidos
    const updatedCurrentLogo = {
      ...currentLogo,
      // Preservar valores do formik (que podem ter sido digitados mas ainda não sincronizados)
      logoName: formik.values.logoName || currentLogo.logoName || "",
      description: formik.values.description || currentLogo.description || "",
      logoNumber: formik.values.logoNumber || currentLogo.logoNumber || "",
      requestedBy: formik.values.requestedBy || currentLogo.requestedBy || "",
      budget: formik.values.budget || currentLogo.budget || "",
      fixationType: formik.values.fixationType || currentLogo.fixationType || "",
      // Atualizar o campo específico
      [key]: value
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos, // Preserve saved logos
    };
    onInputChange("logoDetails", updatedLogoDetails);
    // NÃO sincronizar com Formik aqui - o formik já foi atualizado antes de chamar handleUpdate
    // Isso evita loops infinitos
  }, [currentLogo, formik.values, logoDetails, savedLogos, onInputChange]);

  // Helper melhorado para atualizar dimensões usando Formik
  const handleDimensionUpdate = (dim, field, value) => {
    const dimensions = formik.values.dimensions || {};
    const updatedDimensions = {
      ...dimensions,
      [dim]: {
        ...dimensions[dim],
        [field]: value
      }
    };
    formik.setFieldValue("dimensions", updatedDimensions);
    // Sincronizar com formData global
    handleUpdate("dimensions", updatedDimensions);
  };

  // Hooks customizados
  const { requestedByAutoFilled, preservedRequestedByRef } = useRequestedBy({
    userName,
    currentLogo,
    formik,
    logoDetails,
    savedLogos,
    onInputChange,
  });

  // Sincronizar refs temporários com refs dos hooks
  React.useEffect(() => {
    if (preservedRequestedByRef?.current) {
      preservedRequestedByRefTemp.current = preservedRequestedByRef.current;
    }
  }, [preservedRequestedByRef?.current]);

  const { logoNumberInitialized, preservedLogoNumberRef } = useLogoNumber({
    formData,
    currentLogo,
    formik,
    logoDetails,
    savedLogos,
    onInputChange,
    currentLogoIdRef,
  });

  // Sincronizar refs temporários com refs dos hooks
  React.useEffect(() => {
    if (preservedLogoNumberRef?.current) {
      preservedLogoNumberRefTemp.current = preservedLogoNumberRef.current;
    }
  }, [preservedLogoNumberRef?.current]);

  // Resetar refs quando um novo logo é criado (quando o ID muda ou quando o logo está vazio)
  // E atualizar formik quando currentLogo for carregado (especialmente quando o modal abre)
  React.useEffect(() => {
    const currentLogoId = currentLogo.id || null;
    const isLogoEmpty = !currentLogo.logoNumber && !currentLogo.logoName;
    const previousLogoId = currentLogoIdRef.current;

    // Se o logo foi carregado (tem dados mas não tinha ID antes), atualizar formik
    const hasLogoData = currentLogo.logoNumber || currentLogo.logoName || currentLogo.requestedBy;
    if (hasLogoData && previousLogoId === null && currentLogoId !== null) {
      // Logo foi carregado, atualizar formik com os valores
      // Usar setTimeout para garantir que o formik esteja pronto
      setTimeout(() => {
        formik.setFieldValue("logoNumber", currentLogo.logoNumber || "");
        formik.setFieldValue("logoName", currentLogo.logoName || "");
        formik.setFieldValue("requestedBy", currentLogo.requestedBy || "");
        formik.setFieldValue("budget", currentLogo.budget || "");
        formik.setFieldValue("dimensions", currentLogo.dimensions || {});
        formik.setFieldValue("usageOutdoor", currentLogo.usageOutdoor || false);
        formik.setFieldValue("usageIndoor", currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true);
        formik.setFieldValue("fixationType", currentLogo.fixationType || "");
        formik.setFieldValue("lacqueredStructure", currentLogo.lacqueredStructure || false);
        formik.setFieldValue("lacquerColor", currentLogo.lacquerColor || "");
        formik.setFieldValue("mastDiameter", currentLogo.mastDiameter || "");
        formik.setFieldValue("maxWeightConstraint", currentLogo.maxWeightConstraint || false);
        formik.setFieldValue("maxWeight", currentLogo.maxWeight || "");
        formik.setFieldValue("ballast", currentLogo.ballast || false);
        formik.setFieldValue("controlReport", currentLogo.controlReport || false);
        formik.setFieldValue("criteria", currentLogo.criteria || "");
        formik.setFieldValue("description", currentLogo.description || "");
        formik.setFieldValue("isModification", currentLogo.isModification || false);
        formik.setFieldValue("baseProductId", currentLogo.baseProductId || null);
        formik.setFieldValue("baseProduct", currentLogo.baseProduct || null);
        formik.setFieldValue("relatedProducts", currentLogo.relatedProducts || []);
        formik.setFieldValue("productSizes", currentLogo.productSizes || []);
      }, 0);
    }

    // Também verificar se o logo tem dados mas o formik está vazio (caso o logo seja carregado após o componente montar)
    if (hasLogoData && (!formik.values.logoNumber && !formik.values.logoName && !formik.values.requestedBy)) {
      // Formik está vazio mas o logo tem dados, atualizar
      setTimeout(() => {
        formik.setFieldValue("logoNumber", currentLogo.logoNumber || "");
        formik.setFieldValue("logoName", currentLogo.logoName || "");
        formik.setFieldValue("requestedBy", currentLogo.requestedBy || "");
        formik.setFieldValue("budget", currentLogo.budget || "");
        formik.setFieldValue("dimensions", currentLogo.dimensions || {});
        formik.setFieldValue("usageOutdoor", currentLogo.usageOutdoor || false);
        formik.setFieldValue("usageIndoor", currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true);
        formik.setFieldValue("fixationType", currentLogo.fixationType || "");
        formik.setFieldValue("lacqueredStructure", currentLogo.lacqueredStructure || false);
        formik.setFieldValue("lacquerColor", currentLogo.lacquerColor || "");
        formik.setFieldValue("mastDiameter", currentLogo.mastDiameter || "");
        formik.setFieldValue("maxWeightConstraint", currentLogo.maxWeightConstraint || false);
        formik.setFieldValue("maxWeight", currentLogo.maxWeight || "");
        formik.setFieldValue("ballast", currentLogo.ballast || false);
        formik.setFieldValue("controlReport", currentLogo.controlReport || false);
        formik.setFieldValue("criteria", currentLogo.criteria || "");
        formik.setFieldValue("description", currentLogo.description || "");
        formik.setFieldValue("isModification", currentLogo.isModification || false);
        formik.setFieldValue("baseProductId", currentLogo.baseProductId || null);
        formik.setFieldValue("baseProduct", currentLogo.baseProduct || null);
        formik.setFieldValue("relatedProducts", currentLogo.relatedProducts || []);
        formik.setFieldValue("productSizes", currentLogo.productSizes || []);
      }, 0);
    }

    // Se o ID mudou ou o logo está vazio (novo logo), resetar refs
    if (currentLogoId !== previousLogoId || (isLogoEmpty && previousLogoId !== null)) {
      // IMPORTANTE: Quando o ID do logo muda (editando um logo diferente), atualizar todos os campos do formik
      if (currentLogoId !== previousLogoId && currentLogoId !== null && previousLogoId !== null) {
        console.log("Logo ID changed, updating formik with new logo data. Previous ID:", previousLogoId, "New ID:", currentLogoId);
        // Atualizar todos os campos do formik com os valores do novo currentLogo
        formik.setFieldValue("logoNumber", currentLogo.logoNumber || "");
        formik.setFieldValue("logoName", currentLogo.logoName || "");
        formik.setFieldValue("requestedBy", currentLogo.requestedBy || "");
        formik.setFieldValue("budget", currentLogo.budget || "");
        formik.setFieldValue("dimensions", currentLogo.dimensions || {});
        formik.setFieldValue("usageOutdoor", currentLogo.usageOutdoor || false);
        formik.setFieldValue("usageIndoor", currentLogo.usageIndoor !== undefined ? currentLogo.usageIndoor : true);
        formik.setFieldValue("fixationType", currentLogo.fixationType || "");
        formik.setFieldValue("lacqueredStructure", currentLogo.lacqueredStructure || false);
        formik.setFieldValue("lacquerColor", currentLogo.lacquerColor || "");
        formik.setFieldValue("mastDiameter", currentLogo.mastDiameter || "");
        formik.setFieldValue("maxWeightConstraint", currentLogo.maxWeightConstraint || false);
        formik.setFieldValue("maxWeight", currentLogo.maxWeight || "");
        formik.setFieldValue("ballast", currentLogo.ballast || false);
        formik.setFieldValue("controlReport", currentLogo.controlReport || false);
        formik.setFieldValue("criteria", currentLogo.criteria || "");
        formik.setFieldValue("description", currentLogo.description || "");
        formik.setFieldValue("composition", currentLogo.composition || { componentes: [], bolas: [] });
        formik.setFieldValue("isModification", currentLogo.isModification || false);
        formik.setFieldValue("baseProductId", currentLogo.baseProductId || null);
        formik.setFieldValue("baseProduct", currentLogo.baseProduct || null);
        formik.setFieldValue("relatedProducts", currentLogo.relatedProducts || []);
        formik.setFieldValue("productSizes", currentLogo.productSizes || []);
      }

      currentLogoIdRef.current = currentLogoId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogo.id, currentLogo.logoNumber, currentLogo.logoName, savedLogos.length]);

  const { handleFileUpload, handleRemoveAttachment } = useFileUpload({
    currentLogo,
    logoDetails,
    savedLogos,
    onInputChange,
    formData,
  });

  const {
    productSearchValue,
    setProductSearchValue,
    productSearchResults,
    isSearchingProducts,
    relatedProducts,
    productSizes,
    selectedRelatedProductId,
    handleProductSelection,
    handleClearProductSelection,
    handleSelectRelatedProduct,
    handleModificationToggle,
  } = useProductModification({
    currentLogo,
    logoDetails,
    savedLogos,
    onInputChange,
    formik,
    handleUpdate,
  });

  const {
    componenteSearchValues,
    setComponenteSearchValues,
    componentesEditando,
    setComponentesEditando,
    bolasEditando,
    setBolasEditando,
    filterComponentes,
    isComponenteCompleto,
    isBolaCompleta,
    hasBolaData,
    handleCompositionUpdate,
    handleAddComponente,
    handleRemoveComponente,
    handleClearAllComponentes,
    handleToggleEditComponente,
    handleAddBola,
    handleRemoveBola,
    handleToggleEditBola,
    handleBolaUpdate,
  } = useLogoComposition({
    composition,
    handleUpdate,
  });

  // Garantir que valores preservados sejam salvos no currentLogo quando outros campos mudarem
  React.useEffect(() => {
    const needsUpdate = {};
    let shouldUpdate = false;

    // Verificar se requestedBy precisa ser atualizado
    if (preservedRequestedByRef?.current && (!currentLogo.requestedBy || currentLogo.requestedBy.trim() === "")) {
      needsUpdate.requestedBy = preservedRequestedByRef.current;
      shouldUpdate = true;
    }

    // Verificar se logoNumber precisa ser atualizado
    if (preservedLogoNumberRef?.current && (!currentLogo.logoNumber || currentLogo.logoNumber.trim() === "")) {
      needsUpdate.logoNumber = preservedLogoNumberRef.current;
      shouldUpdate = true;
    }

    // Atualizar currentLogo se necessário
    if (shouldUpdate) {
      const updatedCurrentLogo = {
        ...currentLogo,
        ...needsUpdate,
      };
      const updatedLogoDetails = {
        ...logoDetails,
        currentLogo: updatedCurrentLogo,
        logos: savedLogos,
      };
      onInputChange("logoDetails", updatedLogoDetails);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogo]); // Executar quando currentLogo mudar

  // Sincronizar valores do Formik quando currentLogo mudar (especialmente para campos que podem ser atualizados externamente)
  // IMPORTANTE: Não sincronizar logoName aqui para evitar conflitos com a digitação do usuário
  // O logoName é gerenciado diretamente pelo updateField através do onChange
  React.useEffect(() => {
    if (currentLogo.fixationType !== formik.values.fixationType) {
      formik.setFieldValue("fixationType", currentLogo.fixationType || "");
    }
    if (currentLogo.description !== formik.values.description) {
      formik.setFieldValue("description", currentLogo.description || "");
    }
    // Removido logoName da sincronização automática para evitar conflitos com digitação
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLogo.fixationType, currentLogo.description]);

  const handleEditAIGenerated = (index) => {
    // Armazenar o índice do attachment que está sendo editado
    setEditingAttachmentIndex(index);
    // Abrir o AI Assistant Chat
    setIsChatOpen(true);
  };

  const handleSaveImageFromAI = (imageUrl) => {
    if (!imageUrl) {
      console.error('No image URL provided to save');
      return;
    }

    // Criar objeto de arquivo para o attachment
    const aiGeneratedFile = {
      name: `AI-Generated-${Date.now()}.webp`,
      url: imageUrl,
      path: imageUrl,
      mimetype: 'image/webp',
      isAIGenerated: true,
      generatedAt: new Date().toISOString()
    };

    // Se estamos editando um attachment existente, substituí-lo
    let newAttachments;
    if (editingAttachmentIndex !== null && editingAttachmentIndex >= 0) {
      newAttachments = [...(currentLogo.attachmentFiles || [])];
      newAttachments[editingAttachmentIndex] = aiGeneratedFile;
      setEditingAttachmentIndex(null);
    } else {
      // Caso contrário, adicionar como novo attachment
      newAttachments = [...(currentLogo.attachmentFiles || []), aiGeneratedFile];
    }

    // Atualizar currentLogo com o novo attachment
    const updatedCurrentLogo = {
      ...currentLogo,
      attachmentFiles: newAttachments,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);

    // Fechar o modal
    setIsChatOpen(false);
  };

  const handleAIStateChange = (aiState) => {
    // Salvar o estado do AI Assistant no currentLogo para persistência
    const updatedCurrentLogo = {
      ...currentLogo,
      aiAssistantState: aiState,
    };
    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: updatedCurrentLogo,
      logos: savedLogos,
    };
    onInputChange("logoDetails", updatedLogoDetails);
  };

  // Persistência automática dos dados do logo (PWA)
  useLogoPersistence({
    logoDetails: logoDetails,
    formData: formData,
    onInputChange: onInputChange,
    saveStatus: saveStatus
  });

  // Validação por página
  const validatePage = (pageNumber) => {
    switch (pageNumber) {
      case 1: // Details & Attachments
        // Validar apenas campos visíveis nesta página (Logo Number, Requested By e Criteria são guardados mas não visíveis aqui)
        const hasLogoName = formik.values.logoName?.trim() !== "";
        const hasDescription = formik.values.description?.trim() !== "";
        return hasLogoName && hasDescription;
      case 2: // Dimensions & Fixation
        // Validar pelo menos uma dimensão preenchida
        const dimensions = formik.values.dimensions || {};
        const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && !isNaN(parseFloat(dimensions.height.value));
        const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && !isNaN(parseFloat(dimensions.length.value));
        const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && !isNaN(parseFloat(dimensions.width.value));
        const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && !isNaN(parseFloat(dimensions.diameter.value));
        const hasDimension = hasHeight || hasLength || hasWidth || hasDiameter;
        // Validar que Fixation Type está selecionado
        const hasFixationType = formik.values.fixationType?.trim() !== "";
        return hasDimension && hasFixationType;
      case 3: // Composition
        // Sem validação obrigatória (pode estar vazio)
        return true;
      case 4: // Summary
        // Sem validação (já passou pelas outras páginas)
        return true;
      default:
        return true;
    }
  };

  const canProceedToNext = () => {
    return validatePage(currentPage);
  };

  const handleNextPage = () => {
    // Marcar campos como touched antes de validar para mostrar erros
    if (currentPage === 1) {
      formik.setFieldTouched("logoName", true);
      formik.setFieldTouched("description", true);
    } else if (currentPage === 2) {
      // Marcar dimensões como touched
      formik.setFieldTouched("dimensions", true);
      ['height', 'length', 'width', 'diameter'].forEach(key => {
        formik.setFieldTouched(`dimensions.${key}.value`, true);
      });
      // Marcar fixationType como touched
      formik.setFieldTouched("fixationType", true);
    }

    if (canProceedToNext() && currentPage < logoSteps.length) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleStepClick = (stepNumber) => {
    // Permitir navegar para qualquer step anterior ou o atual
    // Para steps futuros, só permitir se o step atual for válido
    if (stepNumber <= currentPage || (stepNumber === currentPage + 1 && canProceedToNext())) {
      setCurrentPage(stepNumber);
      if (onInternalPageChange) {
        onInternalPageChange(stepNumber);
      }
      window.scrollTo(0, 0);
    }
  };

  const handleFinish = async () => {
    // Finalizar e salvar o logo atual antes de navegar
    if (!canProceedToNext() || isFinishing) {
      return; // Não prosseguir se a página atual não for válida ou já estiver processando
    }

    setIsFinishing(true);
    try {
      // Salvar antes de avançar se estiver editando um projeto existente
      if (projectId && onSave) {
        try {
          await onSave();
        } catch (saveError) {
          console.error('❌ Erro ao salvar antes de avançar:', saveError);
          // Continuar mesmo se houver erro no save (pode ser um problema temporário)
          // O erro já foi mostrado no saveStatus
        }
      }

      // Navegar para o próximo passo
      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error('❌ Erro ao processar Finish:', error);
      // Não bloquear a UI, o erro já foi mostrado
    } finally {
      setIsFinishing(false);
    }
  };

  const handleNewLogo = () => {
    // Só salvar o logo atual se ele for válido
    let updatedSavedLogos = [...savedLogos];

    if (isCurrentLogoValid()) {
      // Guardar _originalIndex antes de remover (é apenas para controle interno)
      const originalIndex = currentLogo._originalIndex;

      // Remover _originalIndex antes de salvar (é apenas para controle interno)
      const { _originalIndex, ...logoWithoutOriginalIndex } = currentLogo;

      const logoToSave = {
        ...logoWithoutOriginalIndex,
        id: currentLogo.id || `logo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        savedAt: currentLogo.savedAt || new Date().toISOString()
      };

      // Verificar se o logo já existe nos savedLogos (por ID ou logoNumber)
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

      if (existingLogoIndex >= 0) {
        // Logo já existe - ATUALIZAR em vez de criar novo
        updatedSavedLogos[existingLogoIndex] = logoToSave;
      } else if (originalIndex !== undefined && originalIndex >= 0 && originalIndex < savedLogos.length) {
        // Logo não existe mas tem posição original válida - INSERIR na posição original
        updatedSavedLogos.splice(originalIndex, 0, logoToSave);
      } else {
        // Logo não existe e não tem posição original - ADICIONAR como novo no final
        updatedSavedLogos.push(logoToSave);
      }
    }

    // Resetar refs para permitir preenchimento automático novamente
    logoNumberInitialized.current = false;
    requestedByAutoFilled.current = false;

    // Criar um novo logo vazio
    const newLogo = {
      id: null,
      logoNumber: "",
      logoName: "",
      description: "",
      budget: "",
      requestedBy: userName || "",
      criteria: "",
      dimensions: {},
      usageIndoor: true,
      usageOutdoor: false,
      fixationType: "",
      lacqueredStructure: false,
      lacquerColor: "",
      maxWeightConstraint: false,
      maxWeight: "",
      ballast: false,
      controlReport: false,
      composition: { componentes: [], bolas: [] },
      attachmentFiles: [],
      isModification: false,
      baseProductId: null,
      baseProduct: null,
    };

    const updatedLogoDetails = {
      ...logoDetails,
      currentLogo: newLogo,
      logos: updatedSavedLogos, // Usar savedLogos atualizado (com o logo anterior salvo)
    };

    onInputChange("logoDetails", updatedLogoDetails);
    setCurrentPage(1); // Voltar para a primeira página
    if (onInternalPageChange) {
      onInternalPageChange(1);
    }
    window.scrollTo(0, 0);
  };

  // Renderizar página atual baseada no estado
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return (
          <DetailsAndAttachmentsRenderer
            formik={formik}
            currentLogo={currentLogo}
            isCompact={isCompact}
            handleModificationToggle={handleModificationToggle}
            productSearchValue={productSearchValue}
            setProductSearchValue={setProductSearchValue}
            productSearchResults={productSearchResults}
            isSearchingProducts={isSearchingProducts}
            handleProductSelection={handleProductSelection}
            handleClearProductSelection={handleClearProductSelection}
            relatedProducts={relatedProducts}
            selectedRelatedProductId={selectedRelatedProductId}
            handleSelectRelatedProduct={handleSelectRelatedProduct}
            handleFileUpload={handleFileUpload}
            handleRemoveAttachment={handleRemoveAttachment}
            handleEditAIGenerated={handleEditAIGenerated}
            setIsChatOpen={setIsChatOpen}
          />
        );
      case 2:
        return (
          <DimensionsRenderer
            formik={formik}
            isCompact={isCompact}
            handleDimensionUpdate={handleDimensionUpdate}
            t={t}
          />
        );
      case 3:
        return (
          <CompositionRenderer
            composition={composition}
            isCompact={isCompact}
            isComponenteCompleto={isComponenteCompleto}
            isBolaCompleta={isBolaCompleta}
            componenteSearchValues={componenteSearchValues}
            setComponenteSearchValues={setComponenteSearchValues}
            componentesEditando={componentesEditando}
            bolasEditando={bolasEditando}
            filterComponentes={filterComponentes}
            handleCompositionUpdate={handleCompositionUpdate}
            handleAddComponente={handleAddComponente}
            handleRemoveComponente={handleRemoveComponente}
            handleClearAllComponentes={handleClearAllComponentes}
            handleToggleEditComponente={handleToggleEditComponente}
            handleAddBola={handleAddBola}
            handleRemoveBola={handleRemoveBola}
            handleToggleEditBola={handleToggleEditBola}
            handleBolaUpdate={handleBolaUpdate}
          />
        );
      case 4:
        return (
          <SummaryRenderer
            formik={formik}
            composition={composition}
            currentLogo={currentLogo}
            hasBolaData={hasBolaData}
          />
        );
      default:
        return (
          <DetailsAndAttachmentsRenderer
            formik={formik}
            currentLogo={currentLogo}
            isCompact={isCompact}
            handleModificationToggle={handleModificationToggle}
            productSearchValue={productSearchValue}
            setProductSearchValue={setProductSearchValue}
            productSearchResults={productSearchResults}
            isSearchingProducts={isSearchingProducts}
            handleProductSelection={handleProductSelection}
            handleClearProductSelection={handleClearProductSelection}
            relatedProducts={relatedProducts}
            selectedRelatedProductId={selectedRelatedProductId}
            handleSelectRelatedProduct={handleSelectRelatedProduct}
            handleFileUpload={handleFileUpload}
            handleRemoveAttachment={handleRemoveAttachment}
            handleEditAIGenerated={handleEditAIGenerated}
            setIsChatOpen={setIsChatOpen}
          />
        );
    }
  };

  // Helper para verificar se o logo atual é válido (para o botão New Logo)
  const isCurrentLogoValid = () => {
    const hasLogoNumber = currentLogo.logoNumber?.trim() !== "";
    const hasLogoName = currentLogo.logoName?.trim() !== "";
    const hasDescription = currentLogo.description?.trim() !== "";
    const hasRequestedBy = currentLogo.requestedBy?.trim() !== "";
    const hasFixationType = currentLogo.fixationType?.trim() !== "";
    const dimensions = currentLogo.dimensions || {};
    const hasHeight = dimensions.height?.value != null && dimensions.height.value !== "" && !isNaN(parseFloat(dimensions.height.value)) && parseFloat(dimensions.height.value) >= 0;
    const hasLength = dimensions.length?.value != null && dimensions.length.value !== "" && !isNaN(parseFloat(dimensions.length.value)) && parseFloat(dimensions.length.value) >= 0;
    const hasWidth = dimensions.width?.value != null && dimensions.width.value !== "" && !isNaN(parseFloat(dimensions.width.value)) && parseFloat(dimensions.width.value) >= 0;
    const hasDiameter = dimensions.diameter?.value != null && dimensions.diameter.value !== "" && !isNaN(parseFloat(dimensions.diameter.value)) && parseFloat(dimensions.diameter.value) >= 0;
    const hasAtLeastOneDimension = hasHeight || hasLength || hasWidth || hasDiameter;
    return hasLogoNumber && hasLogoName && hasDescription && hasRequestedBy && hasFixationType && hasAtLeastOneDimension;
  };

  // Expor funções para o componente pai através de ref
  React.useEffect(() => {
    if (handlersRef) {
      handlersRef.current = {
        handleNextPage,
        handlePrevPage,
        handleNewLogo,
        handleFinish,
        canProceedToNext: canProceedToNext(),
        isCurrentLogoValid: isCurrentLogoValid(),
        isFinishing,
      };
    }
  });

  return (
    <div className={`${isCompact ? 'w-auto h-auto' : 'w-full h-full'} flex flex-col ${isCompact ? 'overflow-visible' : 'overflow-hidden'} ${isCompact ? 'bg-transparent' : 'bg-gradient-to-b from-[#e4e4ec] to-[#d6d4ee] dark:bg-none dark:bg-background'}`}>
      {/* Wizard Navigation - Vertical Floating StepIndicator (Desktop) */}
      {!isCompact && (
        <div className="hidden lg:block">
          <StepIndicator
            steps={logoSteps}
            currentStep={currentPage}
            onStepClick={handleStepClick}
            vertical={true}
          />
        </div>
      )}

      {/* Wizard Navigation - Horizontal (Mobile) */}
      {!isCompact && (
        <div className="lg:hidden w-full bg-content1 px-3 py-2 border-b border-divider flex-shrink-0">
          <StepIndicator
            steps={logoSteps}
            currentStep={currentPage}
            onStepClick={handleStepClick}
          />
        </div>
      )}

      {/* Form Content - Current Page */}
      <div className={`${isCompact ? 'flex-auto' : 'flex-1'} ${isCompact ? 'overflow-visible' : 'overflow-hidden'} ${isCompact ? 'p-1 sm:p-2' : 'p-2 sm:p-2 md:p-3 lg:p-3'}`}>
        <div className={`${isCompact ? 'h-auto' : 'h-full max-h-[calc(100vh-200px)]'} w-full mx-auto ${!isCompact ? 'lg:pr-20 transition-all duration-300' : ''}`}>
          <div className="h-full overflow-y-auto">
            {renderCurrentPage()}
          </div>
        </div>
      </div>

      {/* AI Assistant Chat Modal para geração de imagens */}
      <AIAssistantChat
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setEditingAttachmentIndex(null);
        }}
        onSaveImage={handleSaveImageFromAI}
        initialAIState={currentLogo.aiAssistantState || null}
        onAIStateChange={handleAIStateChange}
      />

    </div>
  );
}

export default StepLogoInstructions;
