import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { Icon } from '@iconify/react';

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'danger',
    icon = 'lucide:alert-triangle'
}) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalContent>
                <ModalHeader className="flex gap-3 items-center">
                    <div className={`p-2 rounded-full ${confirmColor === 'danger' ? 'bg-danger/10 text-danger' :
                            confirmColor === 'warning' ? 'bg-warning/10 text-warning' :
                                confirmColor === 'primary' ? 'bg-primary/10 text-primary' :
                                    'bg-default/10 text-default-500'
                        }`}>
                        <Icon icon={icon} className="text-xl" />
                    </div>
                    <span>{title}</span>
                </ModalHeader>
                <ModalBody>
                    <p className="text-default-600">{message}</p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        {cancelText}
                    </Button>
                    <Button color={confirmColor} onPress={handleConfirm}>
                        {confirmText}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
