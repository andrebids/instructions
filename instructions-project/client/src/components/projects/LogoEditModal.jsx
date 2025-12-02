import React, { useMemo, useCallback, useRef } from 'react';
import { Modal, ModalContent, Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import { StepLogoInstructions } from '../create-project-multi-step/steps/StepLogoInstructions';
import { useProjectForm } from '../create-project-multi-step/hooks/useProjectForm';
import { useSaveStatus } from '../create-project-multi-step/hooks/useSaveStatus';
import { useTranslation } from 'react-i18next';

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

    // Usar useProjectForm para gerenciar o formulário - ele já carrega o logo específico automaticamente
    const formState = useProjectForm(
        useCallback(() => {}, []), // onClose callback memoizado
        projectId, // projectId
        saveStatus, // saveStatus
        logoIndex // logoIndex para carregar o logo específico
    );

    // Reset quando modal abre e capturar estado inicial
    const prevIsOpenRef = useRef(false);
    React.useEffect(() => {
        if (isOpen && !prevIsOpenRef.current && formState.formData?.logoDetails && !formState.isLoadingProject) {
            savedFormDataRef.current = JSON.stringify(formState.formData.logoDetails);
            hasUnsavedChangesRef.current = false;
        }
        prevIsOpenRef.current = isOpen;
    }, [isOpen, formState.formData?.logoDetails, formState.isLoadingProject]);

    const handleClose = useCallback(async () => {
        // Salvar apenas se houver alterações não salvas
        if (hasUnsavedChangesRef.current && formState.formData && projectId) {
            try {
                await formState.handleSave();
                hasUnsavedChangesRef.current = false;
                // Recarregar projeto após salvar
                if (onSave) {
                    await onSave();
                }
            } catch (error) {
                console.error('Error saving logo:', error);
            }
        }
        onClose();
    }, [formState, projectId, onSave, onClose]);

    const isLoading = useMemo(() => {
        return formState.isLoadingProject || !formState.formData?.logoDetails;
    }, [formState.isLoadingProject, formState.formData?.logoDetails]);

    // Memoizar classNames do modal - ajustar ao tamanho do conteúdo
    const modalClassNames = useMemo(() => ({
        base: "max-w-[95vw] w-fit h-fit",
        wrapper: "items-center justify-center",
        body: "p-0",
    }), []);

    // CSS inline memoizado - ajustar modal para se ajustar ao conteúdo
    const compactStyle = useMemo(() => (
        <style key="compact-style">{`
            /* Header mais compacto - espaço para botão de fechar */
            .logo-edit-modal-compact .step-logo-header {
                padding-right: 4.5rem !important;
            }
            /* Fazer o modal se ajustar ao conteúdo */
            .logo-edit-modal-wrapper {
                width: fit-content !important;
                height: fit-content !important;
            }
        `}</style>
    ), []);

    // Memoizar handleInputChange wrapper para evitar re-renders desnecessários
    const handleInputChangeOptimized = useCallback((field, value) => {
        if (field === 'logoDetails') {
            // Marcar como tendo mudanças apenas quando realmente mudar
            hasUnsavedChangesRef.current = true;
        }
        formState.handleInputChange(field, value);
    }, [formState.handleInputChange]);

    // Memoizar o conteúdo do modal - apenas recalcular quando necessário
    const modalContent = useMemo(() => {
        if (isLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <Spinner size="lg" label={t('common.loading', 'Carregando...')} />
                </div>
            );
        }

        if (!formState.formData) {
            return null;
        }

        return (
            <>
                {compactStyle}
                <div className="w-auto h-auto relative">
                    {/* Botão de fechar no topo direito */}
                    <div className="absolute top-4 right-4 z-50">
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={handleClose}
                            className="bg-background/90 backdrop-blur-md hover:bg-background shadow-lg border border-default-200"
                            size="sm"
                        >
                            <Icon icon="lucide:x" className="text-lg" />
                        </Button>
                    </div>
                    
                    {/* StepLogoInstructions com espaçamento para botão de fechar */}
                    <div className="logo-edit-modal-wrapper logo-edit-modal-compact w-auto h-auto">
                        <StepLogoInstructions
                            formData={formState.formData}
                            onInputChange={handleInputChangeOptimized}
                            saveStatus={saveStatus}
                            isCompact={true}
                        />
                    </div>
                </div>
            </>
        );
    }, [isLoading, formState.formData, handleInputChangeOptimized, saveStatus, handleClose, compactStyle, t]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="5xl"
            placement="center"
            scrollBehavior="outside"
            classNames={modalClassNames}
            hideCloseButton
        >
            <ModalContent>
                {(onModalClose) => (
                    <div className="w-auto h-auto flex flex-col relative">
                        {modalContent}
                    </div>
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
