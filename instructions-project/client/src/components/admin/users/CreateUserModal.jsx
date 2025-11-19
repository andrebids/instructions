import React, { useState, useEffect } from 'react';
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
import { PasswordField } from '../PasswordField';
import { generateSecurePassword } from '../../../utils/passwordUtils';

/**
 * Modal para criar novo usuário
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback quando modal fecha
 * @param {Function} props.onCreate - Callback quando usuário é criado
 * @param {boolean} props.isLoading - Se está carregando
 */
export function CreateUserModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'comercial',
  });

  // Gerar senha automaticamente quando o modal abre
  useEffect(() => {
    if (isOpen) {
      const generatedPassword = generateSecurePassword(12);
      setFormData(prev => ({
        ...prev,
        password: generatedPassword,
      }));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      return;
    }
    
    try {
      await onCreate(formData);
      // Resetar formulário após sucesso
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'comercial',
      });
      onClose();
    } catch (err) {
      // Erro será tratado pelo componente pai
      console.error('Erro ao criar usuário:', err);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      role: 'comercial',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {t('pages.dashboard.adminUsers.modals.createUser.title')}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Input
                  label={t('pages.dashboard.adminUsers.modals.createUser.firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <Input
                  label={t('pages.dashboard.adminUsers.modals.createUser.lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                <Input
                  label={t('pages.dashboard.adminUsers.modals.createUser.email')}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  isRequired
                />
                <PasswordField
                  label={t('pages.dashboard.adminUsers.modals.createUser.password')}
                  placeholder={t('pages.dashboard.adminUsers.modals.createUser.passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onPasswordGenerated={(newPassword) => {
                    setFormData({ ...formData, password: newPassword });
                  }}
                  isRequired
                />
                <Select
                  label={t('pages.dashboard.adminUsers.modals.createUser.role')}
                  selectedKeys={[formData.role]}
                  onSelectionChange={(keys) => 
                    setFormData({ ...formData, role: Array.from(keys)[0] || 'comercial' })
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
                {t('pages.dashboard.adminUsers.modals.createUser.cancel')}
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
                isDisabled={!formData.email || !formData.password}
              >
                {isLoading
                  ? t('pages.dashboard.adminUsers.modals.createUser.creating')
                  : t('pages.dashboard.adminUsers.modals.createUser.create')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

