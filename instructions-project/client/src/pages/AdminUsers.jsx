import React from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Select,
  SelectItem,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  useDisclosure,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { usersAPI } from "../services/api";
import { PageTitle } from "../components/layout/page-title";
import { useUser } from "../context/UserContext";
import { useResponsiveProfile } from "../hooks/useResponsiveProfile";
import { Scroller } from "../components/ui/scroller";
import { useTranslation } from "react-i18next";
import { useUserRole } from "../hooks/useUserRole";
import { useAuthContext } from "../context/AuthContext";

export default function AdminUsers() {
  const { t } = useTranslation();
  const { userName } = useUser();
  const { isAdmin, isLoaded: roleLoaded } = useUserRole();
  
  // Usar AuthContext para obter o usuário atual
  let currentUser = null;
  try {
    const authContext = useAuthContext();
    currentUser = authContext?.user;
  } catch (e) {
    // AuthContext não disponível
  }
  const { isHandheld } = useResponsiveProfile();
  
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  
  // Modais
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isInviteOpen, onOpen: onInviteOpen, onClose: onInviteClose } = useDisclosure();
  const { isOpen: isEditRoleOpen, onOpen: onEditRoleOpen, onClose: onEditRoleClose } = useDisclosure();
  const { isOpen: isEditUserOpen, onOpen: onEditUserOpen, onClose: onEditUserClose } = useDisclosure();
  const { isOpen: isEditPasswordOpen, onOpen: onEditPasswordOpen, onClose: onEditPasswordClose } = useDisclosure();
  const { isOpen: isEditEmailOpen, onOpen: onEditEmailOpen, onClose: onEditEmailClose } = useDisclosure();
  const { isOpen: isEditImageOpen, onOpen: onEditImageOpen, onClose: onEditImageClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "comercial",
  });
  const [inviteData, setInviteData] = React.useState({
    email: "",
    role: "comercial",
  });
  const [newRole, setNewRole] = React.useState("comercial");
  const [editUserData, setEditUserData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "comercial",
  });
  const [newPassword, setNewPassword] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newImageUrl, setNewImageUrl] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);
  
  // Verificação de role
  React.useEffect(() => {
    if (roleLoaded && !isAdmin) {
      window.location.href = '/';
    }
  }, [roleLoaded, isAdmin]);
  
  // Carregar utilizadores
  const loadUsers = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const data = await usersAPI.getAll(params);
      setUsers(data);
    } catch (err) {
      console.error('Erro ao carregar utilizadores:', err);
      setError(err.message || t('pages.dashboard.adminUsers.status.error'));
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery, t]);
  
  React.useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);
  
  // Handlers para criar utilizador
  const handleCreateUser = async () => {
    try {
      setActionLoading(true);
      await usersAPI.create(formData);
      onCreateClose();
      setFormData({ firstName: "", lastName: "", email: "", password: "", role: "comercial" });
      loadUsers();
    } catch (err) {
      console.error('Erro ao criar utilizador:', err);
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.createFailed'));
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handlers para enviar convite
  const handleSendInvite = async () => {
    try {
      setActionLoading(true);
      await usersAPI.sendInvitation(inviteData.email, inviteData.role);
      onInviteClose();
      setInviteData({ email: "", role: "comercial" });
      alert(t('pages.dashboard.adminUsers.modals.inviteUser.success'));
      loadUsers();
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.inviteFailed'));
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handlers para editar role
  const handleEditRole = (user) => {
    setSelectedUser(user);
    setNewRole(user.role || "comercial");
    onEditRoleOpen();
  };

  const handleUpdateRole = async () => {
    try {
      setActionLoading(true);
      await usersAPI.updateRole(selectedUser.id, newRole);
      onEditRoleClose();
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar role:', err);
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.updateRoleFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers para editar usuário completo
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditUserData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "comercial",
    });
    onEditUserOpen();
  };

  const handleUpdateUser = async () => {
    try {
      setActionLoading(true);
      await usersAPI.update(selectedUser.id, editUserData);
      onEditUserClose();
      setSelectedUser(null);
      setEditUserData({ firstName: "", lastName: "", email: "", role: "comercial" });
      loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar utilizador:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Erro ao atualizar utilizador');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers para alterar senha
  const handleEditPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    onEditPasswordOpen();
  };

  const handleUpdatePassword = async () => {
    try {
      setActionLoading(true);
      if (!newPassword || newPassword.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      await usersAPI.updatePassword(selectedUser.id, newPassword);
      onEditPasswordClose();
      setSelectedUser(null);
      setNewPassword("");
      alert('Senha atualizada com sucesso');
      loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar senha:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Erro ao atualizar senha');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers para alterar email
  const handleEditEmail = (user) => {
    setSelectedUser(user);
    setNewEmail(user.email || "");
    onEditEmailOpen();
  };

  const handleUpdateEmail = async () => {
    try {
      setActionLoading(true);
      if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        alert('Email inválido');
        return;
      }
      await usersAPI.updateEmail(selectedUser.id, newEmail);
      onEditEmailClose();
      setSelectedUser(null);
      setNewEmail("");
      alert('Email atualizado com sucesso');
      loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar email:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Erro ao atualizar email');
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers para alterar imagem
  const handleEditImage = (user) => {
    setSelectedUser(user);
    setNewImageUrl(user.imageUrl || "");
    onEditImageOpen();
  };

  const handleUpdateImage = async () => {
    try {
      setActionLoading(true);
      await usersAPI.updateUserProfile(selectedUser.id, { imageUrl: newImageUrl });
      onEditImageClose();
      setSelectedUser(null);
      setNewImageUrl("");
      alert('Imagem atualizada com sucesso');
      loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar imagem:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Erro ao atualizar imagem');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handlers para remover utilizador
  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    onDeleteOpen();
  };
  
  const handleConfirmDelete = async () => {
    try {
      setActionLoading(true);
      await usersAPI.delete(selectedUser.id);
      onDeleteClose();
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error('Erro ao remover utilizador:', err);
      alert(err.response?.data?.message || t('pages.dashboard.adminUsers.errors.deleteFailed'));
    } finally {
      setActionLoading(false);
    }
  };
  
  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };
  
  // Obter cor do role
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'comercial':
        return 'primary';
      case 'editor_stock':
        return 'secondary';
      default:
        return 'default';
    }
  };
  
  // Obter label do role traduzido
  const getRoleLabel = (role) => {
    if (!role) return t('pages.dashboard.adminUsers.status.noRole');
    return t(`pages.dashboard.adminUsers.roles.${role}`);
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
          onPress={onCreateOpen}
        >
          {t('pages.dashboard.adminUsers.addUser')}
        </Button>
        <Button
          color="secondary"
          variant="flat"
          startContent={<Icon icon="lucide:mail" />}
          onPress={onInviteOpen}
        >
          {t('pages.dashboard.adminUsers.sendInvite')}
        </Button>
      </div>
      
      {/* Tabela de utilizadores */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
          <span className="ml-4">{t('pages.dashboard.adminUsers.status.loading')}</span>
        </div>
      ) : error ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-danger mb-4">{error}</p>
              <Button onPress={loadUsers}>{t('common.retry')}</Button>
            </div>
          </CardBody>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8 text-default-500">
              {t('pages.dashboard.adminUsers.table.noUsersFound')}
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table aria-label="Tabela de utilizadores">
              <TableHeader>
                <TableColumn>{t('pages.dashboard.adminUsers.table.image')}</TableColumn>
                <TableColumn>{t('pages.dashboard.adminUsers.table.name')}</TableColumn>
                <TableColumn>{t('pages.dashboard.adminUsers.table.email')}</TableColumn>
                <TableColumn>{t('pages.dashboard.adminUsers.table.role')}</TableColumn>
                <TableColumn>{t('pages.dashboard.adminUsers.table.createdAt')}</TableColumn>
                <TableColumn>{t('pages.dashboard.adminUsers.table.lastLogin')}</TableColumn>
                <TableColumn>{t('pages.dashboard.adminUsers.table.actions')}</TableColumn>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-default-200 flex items-center justify-center">
                          <Icon icon="lucide:user" className="text-default-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span>{user.fullName}</span>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="sm"
                        color={getRoleColor(user.role)}
                        variant="flat"
                      >
                        {getRoleLabel(user.role)}
                      </Chip>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>{formatDate(user.lastSignInAt)}</TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                          >
                            <Icon icon="lucide:more-vertical" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label={t('pages.dashboard.adminUsers.table.actions')}>
                          <DropdownItem
                            key="edit"
                            startContent={<Icon icon="lucide:user" />}
                            onPress={() => handleEditUser(user)}
                            isDisabled={isCurrentUser(user.id)}
                          >
                            {t('pages.dashboard.adminUsers.actions.editUser')}
                          </DropdownItem>
                          <DropdownItem
                            key="editRole"
                            startContent={<Icon icon="lucide:shield" />}
                            onPress={() => handleEditRole(user)}
                            isDisabled={isCurrentUser(user.id)}
                          >
                            {t('pages.dashboard.adminUsers.actions.editRole')}
                          </DropdownItem>
                          <DropdownItem
                            key="editPassword"
                            startContent={<Icon icon="lucide:key" />}
                            onPress={() => handleEditPassword(user)}
                            isDisabled={isCurrentUser(user.id)}
                          >
                            {t('pages.dashboard.adminUsers.actions.changePassword')}
                          </DropdownItem>
                          <DropdownItem
                            key="editEmail"
                            startContent={<Icon icon="lucide:mail" />}
                            onPress={() => handleEditEmail(user)}
                            isDisabled={isCurrentUser(user.id)}
                          >
                            {t('pages.dashboard.adminUsers.actions.changeEmail')}
                          </DropdownItem>
                          <DropdownItem
                            key="editImage"
                            startContent={<Icon icon="lucide:image" />}
                            onPress={() => handleEditImage(user)}
                            isDisabled={isCurrentUser(user.id)}
                          >
                            {t('pages.dashboard.adminUsers.actions.changeImage')}
                          </DropdownItem>
                          <DropdownItem
                            key="delete"
                            className="text-danger"
                            color="danger"
                            startContent={<Icon icon="lucide:trash" />}
                            onPress={() => handleDeleteUser(user)}
                            isDisabled={isCurrentUser(user.id)}
                          >
                            {t('pages.dashboard.adminUsers.actions.remove')}
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}
      
      {/* Modal Criar Utilizador */}
      <Modal isOpen={isCreateOpen} onOpenChange={onCreateClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.createUser.title')}</ModalHeader>
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
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.createUser.password')}
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    isRequired
                  />
                  <Select
                    label={t('pages.dashboard.adminUsers.modals.createUser.role')}
                    selectedKeys={[formData.role]}
                    onSelectionChange={(keys) => setFormData({ ...formData, role: Array.from(keys)[0] || 'comercial' })}
                  >
                    <SelectItem key="admin" value="admin">{t('pages.dashboard.adminUsers.roles.admin')}</SelectItem>
                    <SelectItem key="comercial" value="comercial">{t('pages.dashboard.adminUsers.roles.comercial')}</SelectItem>
                    <SelectItem key="editor_stock" value="editor_stock">{t('pages.dashboard.adminUsers.roles.editor_stock')}</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.createUser.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleCreateUser}
                  isLoading={actionLoading}
                  isDisabled={!formData.email || !formData.password}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.createUser.creating') : t('pages.dashboard.adminUsers.modals.createUser.create')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Modal Enviar Convite */}
      <Modal isOpen={isInviteOpen} onOpenChange={onInviteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.inviteUser.title')}</ModalHeader>
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
                    onSelectionChange={(keys) => setInviteData({ ...inviteData, role: Array.from(keys)[0] || 'comercial' })}
                  >
                    <SelectItem key="admin" value="admin">{t('pages.dashboard.adminUsers.roles.admin')}</SelectItem>
                    <SelectItem key="comercial" value="comercial">{t('pages.dashboard.adminUsers.roles.comercial')}</SelectItem>
                    <SelectItem key="editor_stock" value="editor_stock">{t('pages.dashboard.adminUsers.roles.editor_stock')}</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.inviteUser.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleSendInvite}
                  isLoading={actionLoading}
                  isDisabled={!inviteData.email}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.inviteUser.sending') : t('pages.dashboard.adminUsers.modals.inviteUser.send')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Modal Editar Role */}
      <Modal isOpen={isEditRoleOpen} onOpenChange={onEditRoleClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.editRole.title')}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm text-default-500 mb-2">{t('pages.dashboard.adminUsers.modals.editRole.currentRole')}</p>
                    <Chip color={getRoleColor(selectedUser?.role)} variant="flat">
                      {getRoleLabel(selectedUser?.role)}
                    </Chip>
                  </div>
                  <Select
                    label={t('pages.dashboard.adminUsers.modals.editRole.newRole')}
                    selectedKeys={[newRole]}
                    onSelectionChange={(keys) => setNewRole(Array.from(keys)[0] || 'comercial')}
                  >
                    <SelectItem key="admin" value="admin">{t('pages.dashboard.adminUsers.roles.admin')}</SelectItem>
                    <SelectItem key="comercial" value="comercial">{t('pages.dashboard.adminUsers.roles.comercial')}</SelectItem>
                    <SelectItem key="editor_stock" value="editor_stock">{t('pages.dashboard.adminUsers.roles.editor_stock')}</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.editRole.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateRole}
                  isLoading={actionLoading}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.editRole.saving') : t('pages.dashboard.adminUsers.modals.editRole.save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Modal Editar Usuário */}
      <Modal isOpen={isEditUserOpen} onOpenChange={onEditUserClose} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.editUser.title')}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.firstName')}
                    value={editUserData.firstName}
                    onChange={(e) => setEditUserData({ ...editUserData, firstName: e.target.value })}
                  />
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.lastName')}
                    value={editUserData.lastName}
                    onChange={(e) => setEditUserData({ ...editUserData, lastName: e.target.value })}
                  />
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.email')}
                    type="email"
                    value={editUserData.email}
                    onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                    isRequired
                  />
                  <Select
                    label={t('pages.dashboard.adminUsers.modals.editUser.role')}
                    selectedKeys={[editUserData.role]}
                    onSelectionChange={(keys) => setEditUserData({ ...editUserData, role: Array.from(keys)[0] || 'comercial' })}
                  >
                    <SelectItem key="admin" value="admin">{t('pages.dashboard.adminUsers.roles.admin')}</SelectItem>
                    <SelectItem key="comercial" value="comercial">{t('pages.dashboard.adminUsers.roles.comercial')}</SelectItem>
                    <SelectItem key="editor_stock" value="editor_stock">{t('pages.dashboard.adminUsers.roles.editor_stock')}</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.editUser.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateUser}
                  isLoading={actionLoading}
                  isDisabled={!editUserData.email}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.editUser.saving') : t('pages.dashboard.adminUsers.modals.editUser.save')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Alterar Senha */}
      <Modal isOpen={isEditPasswordOpen} onOpenChange={onEditPasswordClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.changePassword.title')}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-default-500">
                    {t('pages.dashboard.adminUsers.modals.changePassword.user')}: {selectedUser?.fullName || selectedUser?.email}
                  </p>
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.changePassword.newPassword')}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    isRequired
                    description={t('pages.dashboard.adminUsers.modals.changePassword.passwordDescription')}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.changePassword.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdatePassword}
                  isLoading={actionLoading}
                  isDisabled={!newPassword || newPassword.length < 6}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.changePassword.updating') : t('pages.dashboard.adminUsers.modals.changePassword.update')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Alterar Email */}
      <Modal isOpen={isEditEmailOpen} onOpenChange={onEditEmailClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.changeEmail.title')}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-default-500">
                    {t('pages.dashboard.adminUsers.modals.changeEmail.user')}: {selectedUser?.fullName || selectedUser?.email}
                  </p>
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.changeEmail.newEmail')}
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    isRequired
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.changeEmail.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateEmail}
                  isLoading={actionLoading}
                  isDisabled={!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.changeEmail.updating') : t('pages.dashboard.adminUsers.modals.changeEmail.update')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Alterar Imagem */}
      <Modal isOpen={isEditImageOpen} onOpenChange={onEditImageClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.changeImage.title')}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <p className="text-sm text-default-500">
                    {t('pages.dashboard.adminUsers.modals.changeImage.user')}: {selectedUser?.fullName || selectedUser?.email}
                  </p>
                  {selectedUser?.imageUrl && (
                    <div className="flex justify-center">
                      <img
                        src={selectedUser.imageUrl}
                        alt={selectedUser.fullName}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    </div>
                  )}
                  <Input
                    label={t('pages.dashboard.adminUsers.modals.changeImage.imageUrl')}
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder={t('pages.dashboard.adminUsers.modals.changeImage.imageUrlPlaceholder')}
                    description={t('pages.dashboard.adminUsers.modals.changeImage.imageUrlDescription')}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.changeImage.cancel')}
                </Button>
                <Button
                  color="primary"
                  onPress={handleUpdateImage}
                  isLoading={actionLoading}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.changeImage.updating') : t('pages.dashboard.adminUsers.modals.changeImage.update')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Modal Confirmar Remoção */}
      <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteClose}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.deleteConfirm.title')}</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-2">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t('pages.dashboard.adminUsers.modals.deleteConfirm.description', { name: selectedUser?.fullName || selectedUser?.email })
                    }}
                  />
                  <p className="text-sm text-default-500 mt-2">
                    {t('pages.dashboard.adminUsers.modals.deleteConfirm.warning')}
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t('pages.dashboard.adminUsers.modals.deleteConfirm.cancel')}
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmDelete}
                  isLoading={actionLoading}
                >
                  {actionLoading ? t('pages.dashboard.adminUsers.modals.deleteConfirm.deleting') : t('pages.dashboard.adminUsers.modals.deleteConfirm.delete')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Scroller>
  );
}

