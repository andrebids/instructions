import React, { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { PageTitle } from "../components/layout/page-title";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";
import { useTranslation } from "react-i18next";
import { useUserRole } from "../hooks/useUserRole";
import { useAuthContext } from "../context/AuthContext";
import { useUsersManagement } from "../hooks/useUsersManagement";
import { UserTable } from "../components/admin/UserTable";
import { CreateUserModal } from "../components/admin/users/CreateUserModal";
import { EditUserModal } from "../components/admin/users/EditUserModal";
import { InviteUserModal } from "../components/admin/users/InviteUserModal";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { userName } = useUser();
  const { isAdmin, isLoaded: roleLoaded } = useUserRole();
  const { isHandheld } = useResponsiveProfile();
  
  // Obter usuário atual
  let currentUser = null;
  try {
    const authContext = useAuthContext();
    currentUser = authContext?.user;
  } catch (e) {
    // AuthContext não disponível
  }

  // Hook de gerenciamento de usuários
  const {
    users,
    loading,
    error,
    searchQuery,
    roleFilter,
    actionLoading,
    setSearchQuery,
    setRoleFilter,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    sendInvite,
  } = useUsersManagement(isAdmin);

  // Estados para modais
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  const [selectedUser, setSelectedUser] = useState(null);

  // Verificação de role
  React.useEffect(() => {
    if (roleLoaded && !isAdmin) {
      window.location.href = '/';
    }
  }, [roleLoaded, isAdmin]);

  // Log de usuários para debug
  React.useEffect(() => {
    console.log('[AdminUsers] Usuários para exibir na tabela:', {
      count: users.length,
      userIds: users.map(u => u.id),
      emails: users.map(u => u.email)
    });
  }, [users]);

  // Handler para criar usuário
  const handleCreateUser = async (userData) => {
    try {
      console.log('[AdminUsers] Criando usuário:', { email: userData.email });
      await createUser(userData);
      console.log('[AdminUsers] Usuário criado, fechando modal');
      onCreateClose();
    } catch (err) {
      console.error('[AdminUsers] Erro ao criar usuário:', err);
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.createFailed'));
      throw err;
    }
  };

  // Handler para editar usuário
  const handleEditClick = (user) => {
    // Limpar campo de busca ao abrir modal de edição
    setSearchQuery('');
    setSelectedUser(user);
    onEditOpen();
  };

  // Handler para atualizar usuário
  const handleUpdateUser = async (userId, updateData, avatarFile) => {
    try {
      console.log('[AdminUsers] Atualizando usuário:', { userId, email: updateData.email });
      await updateUser(userId, updateData, avatarFile);
      // Garantir que a lista seja recarregada após atualização
      console.log('[AdminUsers] Recarregando lista após atualizar usuário');
      await loadUsers();
      onEditClose();
      setSelectedUser(null);
    } catch (err) {
      console.error('[AdminUsers] Erro ao atualizar usuário:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao atualizar utilizador';
      const errorDetails = err.response?.data?.details;
      
      if (errorDetails && Array.isArray(errorDetails)) {
        alert(`${errorMessage}\n\n${errorDetails.join('\n')}`);
      } else {
        alert(errorMessage);
      }
      throw err;
    }
  };

  // Handler para deletar usuário
  const handleDeleteUser = async (userId) => {
    try {
      await deleteUser(userId);
      onEditClose();
      setSelectedUser(null);
    } catch (err) {
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.deleteFailed'));
      throw err;
    }
  };

  // Handler para enviar convite
  const handleSendInvite = async (email, role) => {
    try {
      await sendInvite(email, role);
      onInviteClose();
      alert(t('pages.dashboard.adminUsers.modals.inviteUser.success'));
    } catch (err) {
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.inviteFailed'));
      throw err;
    }
  };

  // Verificar se é o próprio utilizador
  const isCurrentUser = (userId) => {
    return currentUser?.id === userId;
  };

  if (!roleLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Scroller className={`flex-1 min-h-0 p-6 ${isHandheld ? "pb-24" : "pb-6"}`} hideScrollbar>
      <PageTitle
        title={t('pages.dashboard.adminUsers.title')}
        userName={userName}
        lead={t('pages.dashboard.adminUsers.lead')}
        subtitle={t('pages.dashboard.adminUsers.subtitle')}
        className="mb-6"
      />
      
      {/* Filtros e ações */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder={t('pages.dashboard.adminUsers.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Icon icon="lucide:search" className="text-default-400" />}
          className="flex-1"
          autoComplete="off"
          autoFocus={false}
          name="user-search"
          id="user-search-input"
        />
        <Select
          label={t('pages.dashboard.adminUsers.filterByRole')}
          selectedKeys={[roleFilter]}
          onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] || 'all')}
          className="w-full md:w-48"
        >
          <SelectItem key="all" value="all">{t('pages.dashboard.adminUsers.roles.all')}</SelectItem>
          <SelectItem key="admin" value="admin">{t('pages.dashboard.adminUsers.roles.admin')}</SelectItem>
          <SelectItem key="comercial" value="comercial">{t('pages.dashboard.adminUsers.roles.comercial')}</SelectItem>
          <SelectItem key="editor_stock" value="editor_stock">{t('pages.dashboard.adminUsers.roles.editor_stock')}</SelectItem>
        </Select>
        <Button
          color="primary"
          startContent={<Icon icon="lucide:user-plus" />}
          onPress={() => {
            // Limpar campo de busca ao abrir modal de criação
            setSearchQuery('');
            onCreateOpen();
          }}
          className="bg-blue-600 text-white"
        >
          {t('pages.dashboard.adminUsers.addUser')}
        </Button>
        <Button
          color="secondary"
          variant="flat"
          startContent={<Icon icon="lucide:mail" />}
          onPress={() => {
            // Limpar campo de busca ao abrir modal de convite
            setSearchQuery('');
            onInviteOpen();
          }}
        >
          {t('pages.dashboard.adminUsers.sendInvite')}
        </Button>
      </div>
      
      {/* Tabela de utilizadores */}
      <UserTable
        users={users}
        loading={loading}
        error={error}
        onEdit={handleEditClick}
        onRetry={loadUsers}
        isCurrentUser={isCurrentUser}
      />
      
      {/* Modais */}
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={() => {
          // Limpar campo de busca ao fechar modal de criação
          setSearchQuery('');
          onCreateClose();
        }}
        onCreate={handleCreateUser}
        isLoading={actionLoading}
      />
      
      <InviteUserModal
        isOpen={isInviteOpen}
        onClose={() => {
          // Limpar campo de busca ao fechar modal de convite
          setSearchQuery('');
          onInviteClose();
        }}
        onInvite={handleSendInvite}
        isLoading={actionLoading}
      />
      
      <EditUserModal
        isOpen={isEditOpen}
        onClose={async () => {
          console.log('[AdminUsers] Fechando modal de edição, recarregando lista');
          // Limpar campo de busca ao fechar modal de edição
          setSearchQuery('');
          setSelectedUser(null);
          onEditClose();
          // Recarregar lista quando modal fecha para garantir dados atualizados
          await loadUsers();
        }}
        onUpdate={handleUpdateUser}
        onDelete={handleDeleteUser}
        isLoading={actionLoading}
        user={selectedUser}
      />
    </Scroller>
  );
}
