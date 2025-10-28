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
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm" placement="center">
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
                <Button variant="light" onPress={close}>{cancelText}</Button>
                <Button color={confirmColor} onPress={() => { onConfirm?.(); close(); }}>{confirmText}</Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


