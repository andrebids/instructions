import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from '@heroui/react';
import { useTranslation } from 'react-i18next';

/**
 * Modal para enviar convite a novo usuário
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback quando modal fecha
 * @param {Function} props.onInvite - Callback quando convite é enviado
 * @param {boolean} props.isLoading - Se está carregando
 */
export function InviteUserModal({
  isOpen,
  onClose,
  onInvite,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'comercial',
  });

  const handleSubmit = async () => {
    if (!inviteData.email) {
      return;
    }
    
    try {
      await onInvite(inviteData.email, inviteData.role);
      // Resetar formulário após sucesso
      setInviteData({ email: '', role: 'comercial' });
      onClose();
    } catch (err) {
      // Erro será tratado pelo componente pai
      console.error('Erro ao enviar convite:', err);
    }
  };

  const handleClose = () => {
    setInviteData({ email: '', role: 'comercial' });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {t('pages.dashboard.adminUsers.modals.inviteUser.title')}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Input
                  label={t('pages.dashboard.adminUsers.modals.inviteUser.email')}
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  isRequired
                />
                <Select
                  label={t('pages.dashboard.adminUsers.modals.inviteUser.role')}
                  selectedKeys={[inviteData.role]}
                  onSelectionChange={(keys) => 
                    setInviteData({ ...inviteData, role: Array.from(keys)[0] || 'comercial' })
                  }
                >
                  <SelectItem key="admin" value="admin">
                    {t('pages.dashboard.adminUsers.roles.admin')}
                  </SelectItem>
                  <SelectItem key="comercial" value="comercial">
                    {t('pages.dashboard.adminUsers.roles.comercial')}
                  </SelectItem>
                  <SelectItem key="editor_stock" value="editor_stock">
                    {t('pages.dashboard.adminUsers.roles.editor_stock')}
                  </SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="flat" onPress={onClose}>
                {t('pages.dashboard.adminUsers.modals.inviteUser.cancel')}
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={!inviteData.email}
              >
                {isLoading
                  ? t('pages.dashboard.adminUsers.modals.inviteUser.sending')
                  : t('pages.dashboard.adminUsers.modals.inviteUser.send')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

