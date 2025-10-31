import React from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import { Icon } from "@iconify/react";

export function AddClientModal({ 
  isOpen, 
  onClose, 
  clientData,      // Recebe estado do pai
  setClientData,   // Recebe setter do pai
  onAddClient      // Callback sem parâmetros
}) {
  const handleAdd = () => {
    onAddClient();  // Não passa parâmetros - usa estado do pai
  };

  const handleClose = () => {
    onClose();
    setClientData({ name: "", email: "", phone: "" });  // Reset via setter do pai
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="md"
      placement="center"
      backdrop="blur"
      hideCloseButton
    >
      <ModalContent>
        {(onModalClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:user-plus" className="text-primary text-xl" />
                <span>Add New Client</span>
              </div>
              <p className="text-xs text-default-500 font-normal">
                Fill in the client information below
              </p>
            </ModalHeader>
            <ModalBody className="py-6">
              <div className="space-y-4">
                <Input
                  label="Client Name"
                  labelPlacement="outside"
                  placeholder="Enter client name"
                  value={clientData.name}
                  onChange={(e) => setClientData(prev => ({ ...prev, name: e.target.value }))}
                  isRequired
                  variant="bordered"
                  startContent={<Icon icon="lucide:building-2" className="text-default-400" />}
                  className="mb-8"
                />
                <Input
                  label="Email"
                  labelPlacement="outside"
                  type="email"
                  placeholder="client@example.com"
                  value={clientData.email}
                  onChange={(e) => setClientData(prev => ({ ...prev, email: e.target.value }))}
                  variant="bordered"
                  startContent={<Icon icon="lucide:mail" className="text-default-400" />}
                  className="mb-8"
                />
                <Input
                  label="Phone"
                  labelPlacement="outside"
                  placeholder="+351 123 456 789"
                  value={clientData.phone}
                  onChange={(e) => setClientData(prev => ({ ...prev, phone: e.target.value }))}
                  variant="bordered"
                  startContent={<Icon icon="lucide:phone" className="text-default-400" />}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                onPress={handleClose}
                className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 shadow-sm"
              >
                Cancel
              </Button>
              <Button 
                color="primary" 
                onPress={handleAdd}
                isDisabled={!clientData.name.trim()}
                startContent={<Icon icon="lucide:check" />}
              >
                Add Client
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

