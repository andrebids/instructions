/**
 * Modal de informações de cartouche
 */
import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { StreetNameInput } from './StreetNameInput';

/**
 * Modal para editar informações do cartouche
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback para fechar o modal
 * @param {Object} props.cartoucheData - Dados do cartouche { projectName, streetOrZone, option }
 * @param {Function} props.onProjectNameChange - Callback para mudar nome do projeto
 * @param {Function} props.onStreetOrZoneChange - Callback para mudar rua/zona
 * @param {Function} props.onOptionChange - Callback para mudar opção
 * @param {Function} props.onApply - Callback para aplicar cartouche
 * @param {boolean} props.canApply - Se pode aplicar (tem imagem de fundo)
 */
export const CartoucheModal = ({
  isOpen,
  onClose,
  cartoucheData,
  onProjectNameChange,
  onStreetOrZoneChange,
  onOptionChange,
  onApply,
  canApply = true
}) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="lg"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Cartouche Information</h3>
          <p className="text-sm text-default-500">Enter project name, street or zone, and option</p>
        </ModalHeader>
        <ModalBody>
          <StreetNameInput
            projectName={cartoucheData?.projectName || ""}
            streetOrZone={cartoucheData?.streetOrZone || ""}
            option={cartoucheData?.option || "base"}
            onProjectNameChange={onProjectNameChange}
            onStreetOrZoneChange={onStreetOrZoneChange}
            onOptionChange={onOptionChange}
          />
        </ModalBody>
        <ModalFooter>
          <Button 
            variant="light"
            onPress={onClose}
          >
            Close
          </Button>
          <Button 
            color="primary" 
            onPress={onApply}
            isDisabled={!canApply}
            startContent={<Icon icon="lucide:check" />}
          >
            Apply
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

