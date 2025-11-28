import { useState, useEffect, useRef } from "react";
import { isStepValid } from "../utils/validation";
import { logger } from "../utils/logger";
import { projectsAPI } from "../../../services/api";
import { saveLastStep, getEditorState } from "../../../services/indexedDB";
import { registerSyncTag, isBackgroundSyncAvailable } from "../../../services/backgroundSync";

// 🧪 Breakpoint de Teste 3
export const TEST_BREAKPOINT_3 = false;

// ✅ CORRIGIDO: Agora recebe visibleSteps para navegação correta
// Também aceita initialStep para navegação direta via URL (ex: ?step=ai-designer)
export const useStepNavigation = (formData, visibleSteps, onCreateTempProject, initialStep = null) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const debounceTimerRef = useRef(null);
  const projectIdRef = useRef(formData.id || formData.tempProjectId);
  const isRestoringRef = useRef(false); // Flag para evitar salvar durante restauração
  const hasRestoredRef = useRef(false); // Flag para evitar múltiplas restaurações
  const lastProjectIdRef = useRef(null); // Rastrear último projectId restaurado
  const initialStepAppliedRef = useRef(false); // Flag para aplicar initialStep apenas uma vez

  // Atualizar projectId ref quando mudar
  useEffect(() => {
    projectIdRef.current = formData.id || formData.tempProjectId;
  }, [formData.id, formData.tempProjectId]);

  // Aplicar initialStep do URL se fornecido (tem prioridade absoluta sobre step salvo)
  // Este useEffect deve executar ANTES do restore para garantir prioridade
  // IMPORTANTE: Re-executar sempre que visibleSteps mudar, pois o step pode aparecer depois
  useEffect(() => {
    if (initialStep && visibleSteps.length > 0) {
      const stepIndex = visibleSteps.findIndex(step => step.id === initialStep);
      if (stepIndex >= 0) {
        // Aplicar mesmo se já foi aplicado antes (caso os visibleSteps tenham mudado)
        if (currentStep !== stepIndex + 1) {
          console.log('🎯 Aplicando initialStep do URL:', initialStep, '→ Step', stepIndex + 1);
          isRestoringRef.current = true;
          setCurrentStep(stepIndex + 1);
          logger.lifecycle('useStepNavigation', 'Step inicial do URL aplicado', { 
            stepId: initialStep, 
            stepIndex: stepIndex + 1,
            visibleSteps: visibleSteps.map(s => s.id)
          });
          setTimeout(() => {
            isRestoringRef.current = false;
          }, 100);
        }
        initialStepAppliedRef.current = true;
        hasRestoredRef.current = true; // Marcar como restaurado para não sobrescrever
      } else {
        // Step não encontrado nos visibleSteps - pode ser que ainda não estejam prontos
        // Não marcar como aplicado ainda, para tentar novamente quando visibleSteps mudar
        if (!initialStepAppliedRef.current) {
          console.warn('⚠️ Step inicial não encontrado nos visibleSteps ainda:', initialStep, 'Available:', visibleSteps.map(s => s.id));
        }
      }
    }
  }, [initialStep, visibleSteps]);

  // Restaurar step salvo ao carregar projeto existente (apenas se não houver initialStep do URL)
  useEffect(() => {
    // Se houver initialStep do URL, NUNCA restaurar do storage (mesmo que ainda não tenha sido aplicado)
    if (initialStep) {
      return;
    }
    
    // Se já foi aplicado initialStep, também não restaurar
    if (initialStepAppliedRef.current) {
      return;
    }

    const projectId = formData.id || formData.tempProjectId;

    // Se não há projectId ou já foi restaurado para este projectId, não fazer nada
    if (!projectId || (hasRestoredRef.current && lastProjectIdRef.current === projectId)) {
      return;
    }

    // Se o projectId mudou, resetar a flag de restauração
    if (lastProjectIdRef.current !== projectId) {
      hasRestoredRef.current = false;
      lastProjectIdRef.current = projectId;
    }

    // Se já foi restaurado para este projectId, não restaurar novamente
    if (hasRestoredRef.current) {
      return;
    }

    const restoreStep = async () => {
      try {
        isRestoringRef.current = true; // Marcar que estamos restaurando

        // Tentar carregar do IndexedDB primeiro (mais rápido)
        const editorState = await getEditorState(projectId);
        let stepToRestore = editorState?.lastEditedStep;

        // Se não encontrou no IndexedDB, tentar do backend
        if (!stepToRestore && projectId) {
          try {
            const project = await projectsAPI.getById(projectId);
            stepToRestore = project?.lastEditedStep;
          } catch (err) {
            console.warn('Erro ao carregar step do backend:', err);
          }
        }

        // Fallback para localStorage
        if (!stepToRestore) {
          const savedStep = localStorage.getItem(`project_${projectId}_lastStep`);
          if (savedStep) {
            stepToRestore = savedStep;
          }
        }

        // Se encontrou step salvo, navegar para ele
        if (stepToRestore) {
          const stepIndex = visibleSteps.findIndex(step => step.id === stepToRestore);
          if (stepIndex >= 0) {
            setCurrentStep(stepIndex + 1);
            logger.lifecycle('useStepNavigation', 'Step restaurado', { stepId: stepToRestore, stepIndex: stepIndex + 1 });
            hasRestoredRef.current = true; // Marcar como restaurado
          }
        } else {
          // Se não encontrou step salvo, marcar como restaurado mesmo assim para evitar tentativas futuras
          hasRestoredRef.current = true;
        }
      } catch (error) {
        console.error('Erro ao restaurar step:', error);
        hasRestoredRef.current = true; // Marcar como restaurado mesmo em caso de erro
      } finally {
        // Aguardar um pouco antes de permitir salvamento novamente
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 100);
      }
    };

    restoreStep();
  }, [formData.id, formData.tempProjectId, visibleSteps]); // Added visibleSteps back since it's used in the effect

  // Persistir step atual quando mudar (mas não durante restauração)
  useEffect(() => {
    const projectId = projectIdRef.current;
    if (!projectId) return;

    // Não salvar se estiver restaurando
    if (isRestoringRef.current) {
      return;
    }

    const currentStepData = visibleSteps[currentStep - 1];
    const stepId = currentStepData?.id;
    if (!stepId) return;

    logger.navigation(
      currentStep - 1,
      currentStep,
      {
        stepId,
        totalSteps: visibleSteps.length
      }
    );

    // Persistir imediatamente no localStorage (fallback rápido)
    try {
      localStorage.setItem(`project_${projectId}_lastStep`, stepId);
      localStorage.setItem(`project_${projectId}_lastStepTime`, new Date().toISOString());
    } catch (err) {
      console.warn('Erro ao salvar no localStorage:', err);
    }

    // Persistir no IndexedDB (robusto para mobile)
    saveLastStep(projectId, stepId).catch(err => {
      console.warn('Erro ao salvar no IndexedDB:', err);
    });

    // Persistir no backend com debounce (500ms)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        await projectsAPI.update(projectId, { lastEditedStep: stepId });
        logger.lifecycle('useStepNavigation', 'Step salvo no backend', { projectId, stepId });
      } catch (error) {
        console.error('Erro ao salvar step no backend:', error);
        // Se offline, registar para sync quando voltar online
        if (!navigator.onLine && isBackgroundSyncAvailable()) {
          registerSyncTag(projectId);
        }
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentStep]); // Removed visibleSteps to prevent infinite loop

  // Avançar para próximo step
  const nextStep = async () => {
    const currentStepId = visibleSteps[currentStep - 1]?.id;
    const nextStepId = visibleSteps[currentStep]?.id;

    if (currentStep < visibleSteps.length && isStepValid(currentStepId, formData)) {
      setIsNavigating(true);

      try {
        // Se estamos a sair de "project-details", criar projeto temporário primeiro
        if (currentStepId === 'project-details' && onCreateTempProject) {
          try {
            await onCreateTempProject();
          } catch (error) {
            logger.error('useStepNavigation', 'Failed to create temp project', error);
            // Continuar mesmo assim
          }
        }

        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
        logger.userAction('Next Step', currentStepId, currentStep + 1);
      } finally {
        setIsNavigating(false);
      }
    } else {
      logger.warn('useStepNavigation', `Cannot proceed from step ${currentStepId}`);
    }
  };

  // Voltar para step anterior
  const prevStep = () => {
    if (currentStep > 1) {
      const currentStepId = visibleSteps[currentStep - 1]?.id;
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
      logger.userAction('Previous Step', currentStepId, currentStep - 1);
    }
  };

  // Verificar se step atual é válido
  const canProceed = () => {
    const currentStepId = visibleSteps[currentStep - 1]?.id;
    return isStepValid(currentStepId, formData);
  };

  return {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    canProceed,
    isNavigating,
  };
};

