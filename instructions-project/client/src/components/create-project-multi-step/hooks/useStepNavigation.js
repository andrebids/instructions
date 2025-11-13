import { useState, useEffect, useRef } from "react";
import { isStepValid } from "../utils/validation";
import { logger } from "../utils/logger";
import { projectsAPI } from "../../../services/api";
import { saveLastStep, getEditorState } from "../../../services/indexedDB";
import { registerSyncTag, isBackgroundSyncAvailable } from "../../../services/backgroundSync";

// 🧪 Breakpoint de Teste 3
export const TEST_BREAKPOINT_3 = false;

// ✅ CORRIGIDO: Agora recebe visibleSteps para navegação correta
export const useStepNavigation = (formData, visibleSteps, onCreateTempProject) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const debounceTimerRef = useRef(null);
  const projectIdRef = useRef(formData.id || formData.tempProjectId);
  
  // Atualizar projectId ref quando mudar
  useEffect(() => {
    projectIdRef.current = formData.id || formData.tempProjectId;
  }, [formData.id, formData.tempProjectId]);

  // Restaurar step salvo ao carregar projeto existente
  useEffect(() => {
    const projectId = formData.id || formData.tempProjectId;
    if (!projectId) return;

    const restoreStep = async () => {
      try {
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
          }
        }
      } catch (error) {
        console.error('Erro ao restaurar step:', error);
      }
    };

    restoreStep();
  }, [formData.id, formData.tempProjectId, visibleSteps]);

  // Persistir step atual quando mudar
  useEffect(() => {
    const projectId = projectIdRef.current;
    if (!projectId) return;

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
  }, [currentStep, visibleSteps]);

  // Avançar para próximo step
  const nextStep = async () => {
    const currentStepId = visibleSteps[currentStep - 1]?.id;
    const nextStepId = visibleSteps[currentStep]?.id;
    
    if (currentStep < visibleSteps.length && isStepValid(currentStepId, formData)) {
      setIsNavigating(true);
      
      try {
        // Se estamos a sair de "project-details" e vamos para "notes", criar projeto primeiro
        if (currentStepId === 'project-details' && nextStepId === 'notes' && onCreateTempProject) {
          try {
            await onCreateTempProject();
          } catch (error) {
            logger.error('useStepNavigation', 'Failed to create temp project', error);
            // Continuar mesmo assim - o step Notes vai mostrar mensagem
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

