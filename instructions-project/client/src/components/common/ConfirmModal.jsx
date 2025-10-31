import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

export default function ConfirmModal({
  isOpen,
  onOpenChange,
  title = "Confirm",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "danger",
  onConfirm,
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm" placement="center" hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              {typeof description === 'string' ? (
                <p className="text-default-600">{description}</p>
              ) : description}
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-end gap-2">
                <Button 
                  variant="flat" 
                  onPress={close}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
                >
                  {cancelText}
                </Button>
                <Button color={confirmColor} onPress={() => { onConfirm?.(); close(); }}>{confirmText}</Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


