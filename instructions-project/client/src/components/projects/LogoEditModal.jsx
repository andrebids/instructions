import React, { useMemo, useCallback, useRef } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button, Spinner } from '@heroui/react';
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

    // Memoizar classNames do modal - glassmorphism effect
    const modalClassNames = useMemo(() => ({
        base: "max-w-[95vw] w-[96vw] max-h-[90vh] bg-white/10 dark:bg-black/30 backdrop-blur-2xl rounded-lg border border-white/40 dark:border-white/30 shadow-2xl",
        wrapper: "items-center justify-center",
        header: "border-b border-white/30 dark:border-white/20 bg-white/10 dark:bg-white/10 backdrop-blur-md rounded-t-lg",
        body: "p-0 rounded-b-lg bg-transparent",
    }), []);

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
                            <span className="text-xl font-semibold text-foreground">Logo Instructions</span>
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
