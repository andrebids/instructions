import React from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Alert
} from '@heroui/react';
import { Icon } from '@iconify/react';

/**
 * Componente de diálogo de confirmação de eliminação
 * Usando as mesmas cores e estilos dos outros cards de confirmação do site
 * Baseado em ConfirmDialog e ConfirmModal existentes
 */
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  message,
  warningMessage = 'This action cannot be undone. All data related to this project will be permanently removed.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  itemName = null // Nome do item sendo eliminado para destacar (ex: "123ABC456")
}) {
  const handleConfirm = async () => {
    try {
      // Se onConfirm retornar uma Promise, aguardar
      const result = onConfirm?.();
      if (result instanceof Promise) {
        await result;
      }
      onClose();
    } catch (error) {
      // Não fechar em caso de erro - deixar o componente pai lidar
      console.error('Erro na confirmação:', error);
      throw error;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="md"
      placement="center"
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex gap-3 items-center">
              <div className="p-2 rounded-full bg-danger/10 text-danger">
                <Icon icon="lucide:alert-triangle" className="text-xl" />
              </div>
              <span>{title}</span>
            </ModalHeader>
            
            <ModalBody>
              {/* Mensagem principal */}
              <p className="text-default-600 mb-4">
                {message && itemName ? (
                  <>
                    {message.split(itemName)[0]}
                    <strong>{itemName}</strong>
                    {message.split(itemName)[1] || '?'}
                  </>
                ) : (
                  message
                )}
              </p>

              {/* Caixa de aviso usando Alert do HeroUI */}
              <Alert
                variant="flat"
                color="danger"
                description={warningMessage}
                hideIcon={true}
              />
            </ModalBody>
            
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {cancelText}
              </Button>
              <Button color="danger" onPress={handleConfirm}>
                {confirmText}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
