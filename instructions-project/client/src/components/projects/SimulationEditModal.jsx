import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SimulationEditModal({ 
    isOpen, 
    onClose, 
    projectId 
}) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleEdit = () => {
        if (projectId) {
            navigate(`/projects/${projectId}/edit?step=ai-designer`);
            onClose();
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="md"
            placement="center"
            backdrop="blur"
        >
            <ModalContent>
                {(onModalClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <Icon icon="lucide:sparkles" className="text-primary" />
                                <span>{t('pages.projectDetails.instructions.editSimulation', 'Editar Simulação')}</span>
                            </div>
                        </ModalHeader>
                        <ModalBody>
                            <p className="text-default-600">
                                {t('pages.projectDetails.instructions.editSimulationDescription', 'Para editar a simulação, você será redirecionado para o editor AI Designer onde poderá modificar as decorações e imagens.')}
                            </p>
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="light"
                                onPress={onModalClose}
                            >
                                {t('common.cancel', 'Cancelar')}
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleEdit}
                                startContent={<Icon icon="lucide:arrow-right" />}
                            >
                                {t('pages.projectDetails.instructions.goToEditor', 'Ir para Editor')}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
}

