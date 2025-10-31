import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";

export default function EditNameModal({
  isOpen,
  onOpenChange,
  title = "Edit name",
  label = "Name",
  initialValue = "",
  confirmText = "Save",
  cancelText = "Cancel",
  onSubmit,
}) {
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    if (isOpen) setValue(initialValue || "");
  }, [isOpen, initialValue]);

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm" placement="center" hideCloseButton>
      <ModalContent>
        {(close) => (
          <>
            <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
            <ModalBody>
              <Input label={label} value={value} onValueChange={setValue} autoFocus />
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
                <Button color="primary" onPress={() => { onSubmit?.(value); close(); }}>{confirmText}</Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}


