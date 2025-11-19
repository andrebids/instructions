import React, { useState, useRef, useEffect } from 'react';
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
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { PasswordField } from '../PasswordField';
import { usePasswordGenerator } from '../../../hooks/usePasswordGenerator';

/**
 * Modal para editar usuário
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback quando modal fecha
 * @param {Function} props.onUpdate - Callback quando usuário é atualizado
 * @param {Function} props.onDelete - Callback quando usuário é deletado
 * @param {boolean} props.isLoading - Se está carregando
 * @param {Object|null} props.user - Usuário a editar
 */
export function EditUserModal({
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isLoading = false,
  user = null,
}) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'comercial',
    password: '',
    passwordConfirm: '',
    avatarFile: null,
    avatarPreview: null,
  });

  // Hook para gerenciar senha principal
  const passwordGenerator = usePasswordGenerator((newPassword) => {
    setEditFormData((prev) => ({
      ...prev,
      password: newPassword,
      passwordConfirm: newPassword,
    }));
  });

  // Estado para visibilidade da confirmação de senha
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Resetar quando modal abre/fecha ou usuário muda
  useEffect(() => {
    if (isOpen && user) {
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        role: user.role || 'comercial',
        password: '',
        passwordConfirm: '',
        avatarFile: null,
        avatarPreview: user.imageUrl || null,
      });
      passwordGenerator.reset();
      setShowPasswordConfirm(false);
    } else if (!isOpen) {
      setEditFormData({
        firstName: '',
        lastName: '',
        email: '',
        role: 'comercial',
        password: '',
        passwordConfirm: '',
        avatarFile: null,
        avatarPreview: null,
      });
      passwordGenerator.reset();
      setShowPasswordConfirm(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData({
        ...editFormData,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Verificar se password foi fornecida (não vazia e não apenas espaços)
    const password = editFormData.password?.trim() || '';
    const passwordConfirm = editFormData.passwordConfirm?.trim() || '';
    const hasPassword = password.length > 0;
    const hasPasswordConfirm = passwordConfirm.length > 0;

    // Validar senha apenas se AMBOS os campos estiverem preenchidos
    // Se apenas um estiver preenchido ou nenhum, a password não será alterada
    if (hasPassword && hasPasswordConfirm) {
      // Ambos preenchidos - validar
      if (password !== passwordConfirm) {
        alert('As passwords não coincidem. Por favor, verifique.');
        return;
      }
      
      if (password.length < 8) {
        alert('A password deve ter pelo menos 8 caracteres.');
        return;
      }
    }
    // Se apenas um campo estiver preenchido ou nenhum, simplesmente não alterar a password
    // (não mostrar erro, apenas ignorar os campos de password)

    try {
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        role: editFormData.role,
        imageUrl: user.imageUrl,
      };

      // Apenas incluir password se ambos os campos estiverem preenchidos e coincidirem
      // Se não forneceu password ou apenas um campo, não incluir (password não será alterada)
      if (hasPassword && hasPasswordConfirm && password === passwordConfirm) {
        updateData.password = password;
      }

      await onUpdate(user.id, updateData, editFormData.avatarFile);
      handleClose();
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    
    if (!confirm(t('pages.dashboard.adminUsers.modals.delete.confirm') || 'Tem a certeza que deseja remover este utilizador?')) {
      return;
    }

    try {
      await onDelete(user.id);
      handleClose();
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
    }
  };

  const handleClose = () => {
    setEditFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'comercial',
      password: '',
      passwordConfirm: '',
      avatarFile: null,
      avatarPreview: null,
    });
    passwordGenerator.reset();
    setShowPasswordConfirm(false);
    onClose();
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={handleClose} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {t('pages.dashboard.adminUsers.modals.editUser.title')}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    {editFormData.avatarPreview ? (
                      <img
                        src={editFormData.avatarPreview}
                        alt="Avatar Preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-default-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-default-200 flex items-center justify-center border-2 border-default-200">
                        <Icon icon="lucide:user" className="w-8 h-8 text-default-400" />
                      </div>
                    )}
                    <div
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon icon="lucide:camera" className="text-white" />
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {editFormData.firstName} {editFormData.lastName}
                    </p>
                    <p className="text-small text-default-500">{editFormData.email}</p>
                    <Button
                      size="sm"
                      variant="flat"
                      className="mt-2"
                      onPress={() => fileInputRef.current?.click()}
                    >
                      {t('pages.dashboard.adminUsers.modals.editUser.changePhoto')}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.firstName')}
                    value={editFormData.firstName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, firstName: e.target.value })
                    }
                  />
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.lastName')}
                    value={editFormData.lastName}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, lastName: e.target.value })
                    }
                  />
                </div>

                <Input
                  label={t('pages.dashboard.adminUsers.modals.editUser.email')}
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, email: e.target.value })
                  }
                  isRequired
                />

                <Select
                  label={t('pages.dashboard.adminUsers.modals.editUser.role')}
                  selectedKeys={[editFormData.role]}
                  onSelectionChange={(keys) =>
                    setEditFormData({
                      ...editFormData,
                      role: Array.from(keys)[0] || 'comercial',
                    })
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

                <PasswordField
                  label={t('pages.dashboard.adminUsers.modals.editUser.newPasswordOptional')}
                  placeholder={t('pages.dashboard.adminUsers.modals.editUser.passwordPlaceholder')}
                  value={editFormData.password}
                  onChange={(e) => {
                    const newPassword = e.target.value;
                    setEditFormData({ ...editFormData, password: newPassword });
                    passwordGenerator.updatePasswordStrength(newPassword);
                  }}
                  onPasswordGenerated={(newPassword) => {
                    setEditFormData({
                      ...editFormData,
                      password: newPassword,
                      passwordConfirm: newPassword,
                    });
                  }}
                />

                {editFormData.password && (
                  <>
                    <Input
                      label="Confirmar Nova Password"
                      placeholder="Digite a password novamente"
                      type={showPasswordConfirm ? 'text' : 'password'}
                      value={editFormData.passwordConfirm}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, passwordConfirm: e.target.value });
                      }}
                      size="md"
                      color={
                        editFormData.password &&
                        editFormData.passwordConfirm &&
                        editFormData.password === editFormData.passwordConfirm
                          ? 'success'
                          : editFormData.passwordConfirm
                          ? 'danger'
                          : 'default'
                      }
                      description={
                        editFormData.password && editFormData.passwordConfirm
                          ? editFormData.password === editFormData.passwordConfirm
                            ? '✓ Passwords coincidem'
                            : '✗ Passwords não coincidem'
                          : ''
                      }
                      endContent={
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          aria-label={showPasswordConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          <Icon
                            icon={showPasswordConfirm ? 'lucide:eye-off' : 'lucide:eye'}
                            className="text-default-400"
                          />
                        </Button>
                      }
                    />
                    <p className="text-small text-default-500 mt-1">
                      Mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e
                      caracteres especiais
                    </p>
                  </>
                )}
              </div>
            </ModalBody>
            <ModalFooter className="justify-between">
              <Button
                color="danger"
                variant="light"
                onPress={handleDelete}
                startContent={<Icon icon="lucide:trash" />}
              >
                {t('pages.dashboard.adminUsers.actions.remove')}
              </Button>
              <div className="flex gap-2">
                <Button variant="flat" onPress={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                  {t('common.save')}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}

