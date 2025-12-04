import React, { useMemo, useCallback, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepLogoInstructions } from '../create-project-multi-step/steps/StepLogoInstructions';
import { useProjectForm } from '../create-project-multi-step/hooks/useProjectForm';
import { useSaveStatus } from '../create-project-multi-step/hooks/useSaveStatus';
import { useTranslation } from 'react-i18next';
import { projectsAPI } from '../../services/api';

export default React.memo(function LogoEditModal({ 
    isOpen, 
    onClose, 
    projectId, 
    logoIndex,
    onSave 
}) {
    const { t } = useTranslation();
    const saveStatus = useSaveStatus();
    const hasUnsavedChangesRef = useRef(false);
    const savedFormDataRef = useRef(null);
    const isSavingRef = useRef(false);
    const autosaveTimeoutRef = useRef(null);
    const lastLogoDetailsRef = useRef(null);
    const reloadTriggerRef = useRef(0);

    // Usar useProjectForm para gerenciar o formulário - ele já carrega o logo específico automaticamente
    const formState = useProjectForm(
        useCallback(() => {}, []), // onClose callback memoizado
        projectId, // projectId
        saveStatus, // saveStatus
        logoIndex // logoIndex para carregar o logo específico
    );

    // Reset quando modal abre e capturar estado inicial
    const prevIsOpenRef = useRef(false);
    const reloadKeyRef = useRef(0);
    
    React.useEffect(() => {
        if (isOpen && !prevIsOpenRef.current && formState.formData?.logoDetails && !formState.isLoadingProject) {
            const logoDetails = formState.formData.logoDetails;
            savedFormDataRef.current = JSON.stringify(logoDetails);
            lastLogoDetailsRef.current = logoDetails;
            hasUnsavedChangesRef.current = false;
            // Resetar status de save quando modal abre
            saveStatus.reset();
            
            console.log('✅ LogoEditModal: Modal aberto com dados iniciais', {
                logoNumber: logoDetails.currentLogo?.logoNumber,
                logoName: logoDetails.currentLogo?.logoName,
                requestedBy: logoDetails.currentLogo?.requestedBy
            });
        }
        prevIsOpenRef.current = isOpen;
        
        // Limpar timeout de autosave quando modal fecha
        return () => {
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current);
                autosaveTimeoutRef.current = null;
            }
        };
    }, [isOpen, formState.formData?.logoDetails, formState.isLoadingProject, saveStatus]);
    
    // Effect para detectar mudanças no logoDetails e atualizar lastLogoDetailsRef
    React.useEffect(() => {
        if (formState.formData?.logoDetails) {
            const logoDetails = formState.formData.logoDetails;
            lastLogoDetailsRef.current = logoDetails;
            
            console.log('🔄 LogoEditModal: logoDetails atualizado no formState', {
                logoNumber: logoDetails.currentLogo?.logoNumber,
                logoName: logoDetails.currentLogo?.logoName,
                requestedBy: logoDetails.currentLogo?.requestedBy
            });
        }
    }, [formState.formData?.logoDetails]);
    
    // Função para forçar recarregamento do projeto
    const forceReloadProject = useCallback(async () => {
        if (!projectId) return;
        
        try {
            // Aguardar um pouco para garantir que o servidor processou o salvamento
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Recarregar projeto do servidor
            const projectData = await projectsAPI.getById(projectId);
            
            // Atualizar formState com os dados atualizados do servidor
            if (projectData && projectData.logoDetails) {
                // Reconstruir logoDetails com o logoIndex correto (mesma lógica do useProjectForm)
                const savedLogos = projectData.logoDetails.logos || [];
                const currentLogo = projectData.logoDetails.currentLogo || projectData.logoDetails;
                
                let updatedLogoDetails = projectData.logoDetails;
                
                // Se logoIndex foi fornecido, carregar esse logo específico
                if (logoIndex !== null && logoIndex !== undefined) {
                    const isCurrentLogoValid = currentLogo?.logoNumber?.trim() && currentLogo?.logoName?.trim();
                    let allLogos = [...savedLogos];
                    if (isCurrentLogoValid && currentLogo) {
                        const alreadyInSaved = savedLogos.some(logo => 
                            (logo.id && currentLogo.id && logo.id === currentLogo.id) ||
                            (logo.logoNumber && currentLogo.logoNumber && logo.logoNumber === currentLogo.logoNumber)
                        );
                        if (!alreadyInSaved) {
                            allLogos.push(currentLogo);
                        }
                    }
                    
                    if (allLogos[logoIndex] !== undefined) {
                        const logoToEdit = allLogos[logoIndex];
                        const isCurrent = isCurrentLogoValid && logoIndex === allLogos.length - 1;
                        
                        if (isCurrent) {
                            updatedLogoDetails = {
                                ...projectData.logoDetails,
                                logos: savedLogos,
                                currentLogo: logoToEdit
                            };
                        } else {
                            const originalIndexInSaved = savedLogos.findIndex((logo) => {
                                if (logo.id && logoToEdit.id) return logo.id === logoToEdit.id;
                                if (logo.logoNumber && logoToEdit.logoNumber) {
                                    return logo.logoNumber.trim() === logoToEdit.logoNumber.trim();
                                }
                                return false;
                            });
                            
                            if (originalIndexInSaved >= 0) {
                                const newSavedLogos = savedLogos.filter((_, i) => i !== originalIndexInSaved);
                                updatedLogoDetails = {
                                    ...projectData.logoDetails,
                                    logos: newSavedLogos,
                                    currentLogo: {
                                        ...logoToEdit,
                                        _originalIndex: originalIndexInSaved
                                    }
                                };
                            }
                        }
                    }
                }
                
                // Atualizar formState com os dados atualizados do servidor
                formState.handleInputChange('logoDetails', updatedLogoDetails);
                lastLogoDetailsRef.current = updatedLogoDetails;
                savedFormDataRef.current = JSON.stringify(updatedLogoDetails);
                
                console.log('✅ LogoEditModal: Projeto recarregado com dados atualizados', {
                    logoNumber: updatedLogoDetails.currentLogo?.logoNumber,
                    logoName: updatedLogoDetails.currentLogo?.logoName,
                    requestedBy: updatedLogoDetails.currentLogo?.requestedBy
                });
            }
        } catch (error) {
            console.error('Error reloading project:', error);
        }
    }, [projectId, logoIndex, formState]);

    // Função de autosave com debounce
    const performAutosave = useCallback(async () => {
        if (!projectId || isSavingRef.current || !isOpen) {
            return;
        }

        // Usar o último logoDetails armazenado no ref (mais confiável)
        const logoDetails = lastLogoDetailsRef.current || formState.formData?.logoDetails || {};
        
        // Validar que logoDetails não está vazio
        if (!logoDetails || Object.keys(logoDetails).length === 0) {
            console.warn('LogoEditModal: logoDetails está vazio, pulando autosave');
            saveStatus.reset();
            return;
        }

        try {
            isSavingRef.current = true;
            saveStatus.setSaving();
            
            // Salvar usando apenas updateCanvas (mais simples e direto)
            await projectsAPI.updateCanvas(projectId, {
                logoDetails: logoDetails,
                lastEditedStep: 'logo-instructions'
            });
            
            // Recarregar projeto do servidor para garantir que temos os dados mais recentes
            await forceReloadProject();
            
            hasUnsavedChangesRef.current = false;
            saveStatus.setSaved();
            
            // Não recarregar o projeto no autosave para evitar flicker na UI
            // O recarregamento acontece apenas ao fechar o modal
        } catch (error) {
            console.error('Error autosaving logo:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                projectId,
                logoDetails: logoDetails
            });
            saveStatus.setError();
            // Não bloquear a UI em caso de erro no autosave
        } finally {
            isSavingRef.current = false;
        }
    }, [projectId, saveStatus, isOpen, formState, forceReloadProject]);

    // Função para forçar sincronização final do formik antes de salvar
    // Esta função garante que todos os valores do formik sejam sincronizados com logoDetails
    const forceSyncFormikValues = useCallback(() => {
        if (formState.formData?.logoDetails) {
            const logoDetails = formState.formData.logoDetails;
            const currentLogo = logoDetails.currentLogo || logoDetails;
            const savedLogos = logoDetails.logos || [];
            
            // Criar um trigger de atualização forçando uma última sincronização
            // O StepLogoInstructions já sincroniza através do onChange, mas vamos garantir
            // que qualquer valor pendente seja salvo
            const updatedLogoDetails = {
                ...logoDetails,
                currentLogo: {
                    ...currentLogo,
                    // Forçar atualização do timestamp para garantir que será salvo
                    _lastSync: Date.now()
                },
                logos: savedLogos
            };
            
            // Atualizar logoDetails para forçar uma última sincronização
            formState.handleInputChange('logoDetails', updatedLogoDetails);
        }
    }, [formState]);

    const handleClose = useCallback(async () => {
        // Limpar timeout de autosave pendente
        if (autosaveTimeoutRef.current) {
            clearTimeout(autosaveTimeoutRef.current);
            autosaveTimeoutRef.current = null;
        }
        
        // Sempre salvar ao fechar o modal para garantir que todas as alterações sejam persistidas
        // Verificar se temos os dados necessários e não estamos já salvando
        if (formState.formData && projectId && isOpen) {
            // Se há um autosave em andamento, aguardar um pouco
            if (isSavingRef.current) {
                let attempts = 0;
                while (isSavingRef.current && attempts < 10) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }
            }
            
            // Se ainda há mudanças não salvas, salvar agora
            if (hasUnsavedChangesRef.current && !isSavingRef.current) {
                try {
                    isSavingRef.current = true;
                    saveStatus.setSaving();
                    
                    // Forçar sincronização final dos valores do formik
                    forceSyncFormikValues();
                    
                    // Aguardar um pequeno delay para garantir que todas as atualizações foram processadas
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Garantir que logoDetails está atualizado antes de salvar
                    const logoDetails = formState.formData.logoDetails || {};
                    
                    // Validar que logoDetails não está vazio
                    if (logoDetails && Object.keys(logoDetails).length > 0) {
                        // Salvar diretamente usando updateCanvas
                        await projectsAPI.updateCanvas(projectId, {
                            logoDetails: logoDetails,
                            lastEditedStep: 'logo-instructions'
                        });
                        
                        // Recarregar projeto do servidor para garantir que temos os dados mais recentes
                        await forceReloadProject();
                        
                        hasUnsavedChangesRef.current = false;
                        saveStatus.setSaved();
                        
                        // Aguardar um pouco para garantir que o save foi completado no servidor
                        await new Promise(resolve => setTimeout(resolve, 300));
                    } else {
                        console.warn('LogoEditModal: logoDetails está vazio ao fechar, pulando salvamento');
                    }
                    
                    // Recarregar projeto após salvar para garantir sincronização completa
                    if (onSave) {
                        await onSave();
                    }
                } catch (error) {
                    console.error('Error saving logo on close:', error);
                    console.error('Error details:', {
                        message: error.message,
                        response: error.response?.data,
                        projectId,
                        logoDetails: formState.formData?.logoDetails
                    });
                    saveStatus.setError();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } finally {
                    isSavingRef.current = false;
                }
            }
        }
        
        // Fechar modal após salvar (ou se não foi possível salvar)
        onClose();
    }, [formState, projectId, onSave, onClose, saveStatus, isOpen, forceSyncFormikValues, forceReloadProject]);

    const isLoading = useMemo(() => {
        return formState.isLoadingProject || !formState.formData?.logoDetails;
    }, [formState.isLoadingProject, formState.formData?.logoDetails]);

    // Memoizar classNames do modal - glassmorphism effect
    const modalClassNames = useMemo(() => ({
        base: "max-w-[95vw] w-[96vw] max-h-[90vh] bg-white/10 dark:bg-black/30 backdrop-blur-2xl rounded-lg border border-white/40 dark:border-white/30 shadow-2xl",
        wrapper: "items-center justify-center",
        header: "border-b border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-md rounded-t-lg",
        body: "p-0 rounded-b-lg bg-transparent",
    }), []);

    // Memoizar handleInputChange wrapper com autosave
    const handleInputChangeOptimized = useCallback((field, value) => {
        if (field === 'logoDetails') {
            // Armazenar o último logoDetails no ref para garantir que temos os dados mais recentes
            lastLogoDetailsRef.current = value;
            
            // Marcar como tendo mudanças
            hasUnsavedChangesRef.current = true;
            
            // Atualizar o estado primeiro
            formState.handleInputChange(field, value);
            
            // Limpar timeout anterior se existir
            if (autosaveTimeoutRef.current) {
                clearTimeout(autosaveTimeoutRef.current);
                autosaveTimeoutRef.current = null;
            }
            
            // Agendar autosave com debounce de 1000ms após a última alteração
            // Aumentado para 1000ms para dar mais tempo para sincronização
            autosaveTimeoutRef.current = setTimeout(() => {
                // Verificar novamente se ainda há mudanças antes de salvar
                if (hasUnsavedChangesRef.current && lastLogoDetailsRef.current) {
                    performAutosave();
                }
                autosaveTimeoutRef.current = null;
            }, 1000);
        } else {
            formState.handleInputChange(field, value);
        }
    }, [formState.handleInputChange, performAutosave]);

    // Memoizar o conteúdo do modal - apenas recalcular quando necessário
    const modalContent = useMemo(() => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full min-h-[400px]">
                    <Spinner size="lg" label={t('common.loading', 'Carregando...')} />
                </div>
            );
        }

        if (!formState.formData) {
            return null;
        }

        return (
            <StepLogoInstructions
                formData={formState.formData}
                onInputChange={handleInputChangeOptimized}
                saveStatus={saveStatus}
                isCompact={true}
            />
        );
    }, [isLoading, formState.formData, handleInputChangeOptimized, saveStatus, t]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="5xl"
            placement="center"
            scrollBehavior="inside"
            backdrop="blur"
            classNames={modalClassNames}
            hideCloseButton
        >
            <ModalContent className="bg-white/10 dark:bg-black/30 backdrop-blur-2xl">
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex items-center justify-between bg-white/15 dark:bg-white/10 backdrop-blur-md rounded-t-lg border-b border-white/30 dark:border-white/20">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-semibold text-foreground">Logo Instructions</span>
                                {/* Indicador de status de autosave */}
                                {saveStatus.status === 'saving' && (
                                    <div className="flex items-center gap-2 text-xs text-yellow-500">
                                        <Spinner size="sm" />
                                        <span>Salvando...</span>
                                    </div>
                                )}
                                {saveStatus.status === 'saved' && (
                                    <div className="flex items-center gap-2 text-xs text-green-500">
                                        <Icon icon="lucide:check-circle" className="text-sm" />
                                        <span>Salvo</span>
                                    </div>
                                )}
                                {saveStatus.status === 'error' && (
                                    <div className="flex items-center gap-2 text-xs text-red-500">
                                        <Icon icon="lucide:alert-circle" className="text-sm" />
                                        <span>Erro ao salvar</span>
                                    </div>
                                )}
                            </div>
                            <Button
                                isIconOnly
                                variant="light"
                                onPress={handleClose}
                                aria-label="Close"
                                className="bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 backdrop-blur-sm border border-white/30 dark:border-white/20"
                            >
                                <Icon icon="lucide:x" className="text-lg" />
                            </Button>
                        </ModalHeader>
                        <ModalBody className="bg-transparent">
                            {modalContent}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}, (prevProps, nextProps) => {
    // Custom comparison para evitar re-renders desnecessários
    return (
        prevProps.isOpen === nextProps.isOpen &&
        prevProps.projectId === nextProps.projectId &&
        prevProps.logoIndex === nextProps.logoIndex
    );
});
