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
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
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
  
  // Unified Edit State
  const [editFormData, setEditFormData] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "comercial",
    password: "",
    passwordConfirm: "",
    avatarFile: null,
    avatarPreview: null
  });
  
  const [actionLoading, setActionLoading] = React.useState(false);
  const fileInputRef = React.useRef(null);
  
  // Estados para mostrar/ocultar senha
  const [showPassword, setShowPassword] = React.useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false);
  
  // Estado para força da senha
  const [passwordStrength, setPasswordStrength] = React.useState('');
  
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
  
  // Handler unificado para editar usuário
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      role: user.role || "comercial",
      password: "",
      passwordConfirm: "",
      avatarFile: null,
      avatarPreview: user.imageUrl || null
    });
    // Resetar estados de visibilidade e força ao abrir modal
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setPasswordStrength('');
    onEditOpen();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFormData({
        ...editFormData,
        avatarFile: file,
        avatarPreview: URL.createObjectURL(file)
      });
    }
  };

  // Avaliar força da senha (baseado no exemplo fornecido)
  const evaluatePasswordStrength = (password) => {
    if (!password) return '';
    
    let score = 0;
    
    // Check password length (mínimo 8 caracteres)
    if (password.length >= 8) score += 1;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) score += 1;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) score += 1;
    
    // Contains numbers
    if (/\d/.test(password)) score += 1;
    
    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Determinar força baseada no score
    switch (score) {
      case 0:
      case 1:
      case 2:
        return 'Weak';
      case 3:
        return 'Medium';
      case 4:
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };
  
  // Obter cor baseada na força da senha
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'Weak':
        return 'danger'; // Vermelho
      case 'Medium':
        return 'warning'; // Laranja/Amarelo
      case 'Strong':
        return 'success'; // Verde
      default:
        return 'default';
    }
  };
  
  // Obter label traduzido para força da senha
  const getStrengthLabel = (strength) => {
    switch (strength) {
      case 'Weak':
        return 'Fraca';
      case 'Medium':
        return 'Média';
      case 'Strong':
        return 'Forte';
      default:
        return '';
    }
  };

  // Gerar senha segura usando Web Crypto API (compatível com browser)
  const generateSecurePassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*(),.?":{}|<>_\\-+=[\\]\\/\'`~;';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    // Garantir que a senha tenha pelo menos um de cada tipo
    let password = '';
    
    // Usar Web Crypto API para seleção aleatória segura
    const randomArray = new Uint32Array(4);
    crypto.getRandomValues(randomArray);
    
    // Adicionar pelo menos um de cada tipo usando valores criptograficamente seguros
    password += uppercase[randomArray[0] % uppercase.length];
    password += lowercase[randomArray[1] % lowercase.length];
    password += numbers[randomArray[2] % numbers.length];
    password += symbols[randomArray[3] % symbols.length];
    
    // Preencher o resto com caracteres aleatórios usando Web Crypto API
    const array = new Uint32Array(length - 4);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length - 4; i++) {
      password += allChars[array[i] % allChars.length];
    }
    
    // Embaralhar a senha usando Web Crypto API (Fisher-Yates shuffle)
    const passwordArray = password.split('');
    const shuffleArray = new Uint32Array(passwordArray.length - 1);
    crypto.getRandomValues(shuffleArray);
    
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = shuffleArray[i - 1] % (i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    const newPassword = passwordArray.join('');
    
    // Preencher ambos os campos com a senha gerada e mostrar inicialmente
    setEditFormData({
      ...editFormData,
      password: newPassword,
      passwordConfirm: newPassword
    });
    
    // Mostrar senha inicialmente quando gerada
    setShowPassword(true);
    setShowPasswordConfirm(true);
    
    // Atualizar força da senha
    setPasswordStrength(evaluatePasswordStrength(newPassword));
  };

  const handleSaveChanges = async () => {
    try {
      setActionLoading(true);
      let imageUrl = selectedUser.imageUrl;

      // 1. Upload avatar if changed
      if (editFormData.avatarFile) {
        const uploadResult = await usersAPI.uploadUserAvatar(selectedUser.id, editFormData.avatarFile);
        imageUrl = uploadResult.url;
      }

      // 2. Update user data
      const updateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        role: editFormData.role,
        imageUrl: imageUrl
      };

      // 3. Validate password if provided
      if (editFormData.password) {
        // Verificar se passwords coincidem
        if (editFormData.password !== editFormData.passwordConfirm) {
          alert('As passwords não coincidem. Por favor, verifique.');
          setActionLoading(false);
          return;
        }
        
        // Validação básica de comprimento (servidor fará validação completa)
        if (editFormData.password.length < 8) {
          alert('A password deve ter pelo menos 8 caracteres.');
          setActionLoading(false);
          return;
        }
        
        updateData.password = editFormData.password;
      }

      await usersAPI.update(selectedUser.id, updateData);
      
      onEditClose();
      setSelectedUser(null);
      loadUsers();
    } catch (err) {
      console.error('Erro ao atualizar utilizador:', err);
      // Mostrar mensagem de erro detalhada do servidor
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erro ao atualizar utilizador';
      const errorDetails = err.response?.data?.details;
      
      if (errorDetails && Array.isArray(errorDetails)) {
        alert(`${errorMessage}\n\n${errorDetails.join('\n')}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(t('pages.dashboard.adminUsers.modals.delete.confirm') || 'Tem a certeza que deseja remover este utilizador?')) return;
    
    try {
      setActionLoading(true);
      await usersAPI.delete(selectedUser.id);
      onEditClose();
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
                        {t(`pages.dashboard.adminUsers.roles.${user.role}`)}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={() => handleEditClick(user)}
                        isDisabled={isCurrentUser(user.id)}
                      >
                        <Icon icon="lucide:pencil" className="text-default-400" />
                      </Button>
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
      
      {/* Modal Editar Usuário Unificado */}
      <Modal isOpen={isEditOpen} onOpenChange={onEditClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{t('pages.dashboard.adminUsers.modals.editUser.title')}</ModalHeader>
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
                      <p className="font-medium">{editFormData.firstName} {editFormData.lastName}</p>
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
                      onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    />
                    <Input
                      label={t('pages.dashboard.adminUsers.modals.editUser.lastName')}
                      value={editFormData.lastName}
                      onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    />
                  </div>

                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.email')}
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    isRequired
                  />

                  <Select
                    label={t('pages.dashboard.adminUsers.modals.editUser.role')}
                    selectedKeys={[editFormData.role]}
                    onSelectionChange={(keys) => setEditFormData({ ...editFormData, role: Array.from(keys)[0] || 'comercial' })}
                  >
                    <SelectItem key="admin" value="admin">{t('pages.dashboard.adminUsers.roles.admin')}</SelectItem>
                    <SelectItem key="comercial" value="comercial">{t('pages.dashboard.adminUsers.roles.comercial')}</SelectItem>
                    <SelectItem key="editor_stock" value="editor_stock">{t('pages.dashboard.adminUsers.roles.editor_stock')}</SelectItem>
                  </Select>

                  <Input
                    label={t('pages.dashboard.adminUsers.modals.editUser.newPasswordOptional')}
                    placeholder={t('pages.dashboard.adminUsers.modals.editUser.passwordPlaceholder')}
                    type={showPassword ? "text" : "password"}
                    value={editFormData.password}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setEditFormData({ ...editFormData, password: newPassword });
                      setPasswordStrength(evaluatePasswordStrength(newPassword));
                    }}
                    size="md"
                    color={passwordStrength ? getStrengthColor(passwordStrength) : 'default'}
                    description={passwordStrength ? `Força: ${getStrengthLabel(passwordStrength)}` : ''}
                    endContent={
                      <div className="flex items-center gap-1">
                        {editFormData.password && (
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            <Icon 
                              icon={showPassword ? "lucide:eye-off" : "lucide:eye"} 
                              className="text-default-400" 
                            />
                          </Button>
                        )}
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={generateSecurePassword}
                          aria-label="Gerar senha segura"
                        >
                          <Icon icon="lucide:refresh-cw" className="text-default-400" />
                        </Button>
                      </div>
                    }
                  />
                  
                  {editFormData.password && (
                    <>
                      <Input
                        label="Confirmar Nova Password"
                        placeholder="Digite a password novamente"
                        type={showPasswordConfirm ? "text" : "password"}
                        value={editFormData.passwordConfirm}
                        onChange={(e) => setEditFormData({ ...editFormData, passwordConfirm: e.target.value })}
                        size="md"
                        color={editFormData.password && editFormData.passwordConfirm && editFormData.password === editFormData.passwordConfirm ? 'success' : editFormData.passwordConfirm ? 'danger' : 'default'}
                        description={editFormData.password && editFormData.passwordConfirm ? (editFormData.password === editFormData.passwordConfirm ? '✓ Passwords coincidem' : '✗ Passwords não coincidem') : ''}
                        endContent={
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                            aria-label={showPasswordConfirm ? "Ocultar senha" : "Mostrar senha"}
                          >
                            <Icon 
                              icon={showPasswordConfirm ? "lucide:eye-off" : "lucide:eye"} 
                              className="text-default-400" 
                            />
                          </Button>
                        }
                      />
                      <p className="text-small text-default-500 mt-1">Mínimo 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais</p>
                    </>
                  )}
                </div>
              </ModalBody>
              <ModalFooter className="justify-between">
                <Button 
                  color="danger" 
                  variant="light" 
                  onPress={handleDeleteUser}
                  startContent={<Icon icon="lucide:trash" />}
                >
                  {t('pages.dashboard.adminUsers.actions.remove')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="flat" onPress={onClose}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveChanges}
                    isLoading={actionLoading}
                  >
                    {t('common.save')}
                  </Button>
                </div>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </Scroller>
  );
}

