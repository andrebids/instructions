import {Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Badge, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter} from "@heroui/react";
import {Icon} from "@iconify/react";
import React from "react";
import {useTheme} from "@heroui/use-theme";
import { useUser } from "../../context/UserContext";
import { useAuthContext } from "../../context/AuthContext";
import { GlobalSyncStatus } from "../features/SyncStatus";
import { LocaleSelector } from "./LocaleSelector";
import { useTranslation } from "react-i18next";
import { usersAPI } from "../../services/api";

export function Header() {
  const { t } = useTranslation();
  const {theme, setTheme} = useTheme();
  const [showSearch, setShowSearch] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const { userName, setUserName } = useUser();
  const [tempName, setTempName] = React.useState("");
  
  // Estados para edição de perfil
  const [editingName, setEditingName] = React.useState("");
  const [editingImage, setEditingImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  
  const authContext = useAuthContext();
  const activeUser = authContext?.user;
  const handleSignOut = async () => {
    if (authContext?.signOut) {
      await authContext.signOut();
    }
  };
  
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Inicializar valores do formulário quando o modal abrir
  React.useEffect(() => {
    if (showSettings && activeUser) {
      setEditingName(activeUser.name || activeUser.email || "");
      setEditingImage(null);
      setImagePreview(activeUser.image || activeUser.imageUrl || null);
      setSaveError(null);
      setSaveSuccess(false);
    }
  }, [showSettings, activeUser]);

  // Função para lidar com seleção de imagem
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSaveError('Apenas imagens (JPEG, PNG, WebP) são permitidas');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('A imagem deve ter no máximo 5MB');
        return;
      }

      setEditingImage(file);
      setSaveError(null);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para salvar perfil
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      let imageUrl = activeUser?.image || activeUser?.imageUrl;

      // Se há uma nova imagem, fazer upload primeiro
      if (editingImage) {
        const uploadResult = await usersAPI.uploadAvatar(editingImage);
        imageUrl = uploadResult.url;
      }

      // Atualizar perfil
      const updatedUser = await usersAPI.updateProfile(editingName.trim(), imageUrl);

      // Atualizar estado local
      setSaveSuccess(true);
      
      // Aguardar um pouco para garantir que o banco processou a atualização
      // e então forçar atualização da sessão para refletir as mudanças
      setTimeout(async () => {
        if (authContext?.refreshSession) {
          try {
            console.log('🔄 [Header] Atualizando sessão após salvar perfil...');
            await authContext.refreshSession();
            console.log('✅ [Header] Sessão atualizada com sucesso');
          } catch (error) {
            console.warn('⚠️ [Header] Não foi possível atualizar a sessão:', error);
          }
        }
      }, 300); // Pequeno delay para garantir que o banco processou
      
      // Fechar modal após 1 segundo
      setTimeout(() => {
        setShowSettings(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setSaveError(error.response?.data?.message || error.message || 'Erro ao salvar perfil');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        {/* Left side empty (previous search icon removed per request) */}
      </div>
      <div className="flex items-center gap-3">
        <GlobalSyncStatus />
        
        <LocaleSelector />
        
        <Button 
          isIconOnly 
          variant="light" 
          onClick={toggleTheme}
          className="bg-default-100/50 hover:bg-default-200/50"
          aria-label={t('components.header.ariaLabels.toggleTheme')}
        >
          <Icon 
            icon={theme === "light" ? "lucide:moon" : "lucide:sun"} 
            className="text-xl" 
          />
        </Button>

        {showSearch ? (
          <Input
            autoFocus
            size="sm"
            className="w-64"
            placeholder={t('components.header.searchPlaceholder')}
            aria-label={t('common.search')}
            startContent={<Icon icon="lucide:search" className="text-default-400" />}
            onBlur={() => setShowSearch(false)}
          />
        ) : (
          <Button
            isIconOnly
            variant="light"
            aria-label={t('components.header.ariaLabels.openSearch')}
            onClick={() => setShowSearch(true)}
          >
            <Icon icon="lucide:search" className="text-xl" />
          </Button>
        )}

        <Popover 
          placement="bottom-end"
          isOpen={showNotifications}
          onOpenChange={setShowNotifications}
        >
          <PopoverTrigger>
            <Badge content="3" color="danger" shape="circle" placement="top-right">
              <Button 
                isIconOnly 
                variant="light" 
                aria-label={t('components.header.ariaLabels.notifications')}
                className="bg-default-100/50 hover:bg-default-200/50"
                onPress={() => {
                  console.log("🔔 Notifications button clicked");
                  setShowNotifications(!showNotifications);
                }}
              >
                <Icon icon="lucide:bell" className="text-xl" />
              </Button>
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 bg-background/70 border border-default-200/30 rounded-xl shadow-xl">
            <div className="p-4 border-b border-divider/50">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t('components.header.recentUpdates')}</h3>
                <Button 
                  size="sm" 
                  variant="light" 
                  isIconOnly
                  onPress={() => setShowNotifications(false)}
                  className="mr-0"
                  aria-label={t('components.header.ariaLabels.closeNotifications')}
                >
                  <Icon icon="lucide:x" className="text-sm" />
                </Button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <div className="p-3 space-y-2">
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-2 h-2 bg-success rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t('components.header.notifications.designApproved')}</div>
                    <div className="text-xs text-default-500 mt-1">{t('components.header.notifications.designApprovedDescription')}</div>
                    <div className="text-xs text-default-400 mt-1">{t('components.header.notifications.hoursAgo', { count: 2 })}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-2 h-2 bg-warning rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t('components.header.notifications.projectDeadline')}</div>
                    <div className="text-xs text-default-500 mt-1">{t('components.header.notifications.projectDeadlineDescription')}</div>
                    <div className="text-xs text-default-400 mt-1">{t('components.header.notifications.hoursAgo', { count: 4 })}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t('components.header.notifications.newRevision')}</div>
                    <div className="text-xs text-default-500 mt-1">{t('components.header.notifications.newRevisionDescription')}</div>
                    <div className="text-xs text-default-400 mt-1">{t('components.header.notifications.dayAgo')}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-default-100/30 transition-colors cursor-pointer opacity-60">
                  <div className="flex-shrink-0 w-2 h-2 bg-default-300 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{t('components.header.notifications.projectDelivered')}</div>
                    <div className="text-xs text-default-500 mt-1">{t('components.header.notifications.projectDeliveredDescription')}</div>
                    <div className="text-xs text-default-400 mt-1">{t('components.header.notifications.daysAgo', { count: 2 })}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 border-t border-divider/50">
              <Button 
                size="sm" 
                variant="light" 
                className="w-full"
                onPress={() => console.log("📋 View all projects clicked")}
              >
                {t('components.header.viewAllProjects')}
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar
              isBordered
              as="button"
              src={activeUser?.image || activeUser?.imageUrl}
              name={activeUser?.name || activeUser?.fullName || activeUser?.firstName || userName || "User"}
              className="transition-transform"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="Profile Actions" variant="flat" onAction={(key)=>{
            if (key === 'settings') {
              setTempName(userName || "Christopher");
              setShowSettings(true);
            } else if (key === 'logout') {
              handleSignOut();
            }
          }}>
            <DropdownItem key="settings">{t('components.header.mySettings')}</DropdownItem>
            <DropdownItem key="logout" color="danger">
              {t('components.header.logOut')}
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>

        {/* My Settings Modal */}
        <Modal 
          isOpen={showSettings} 
          onClose={()=>setShowSettings(false)} 
          placement="center" 
          backdrop="blur"
          size="5xl"
          scrollBehavior="outside"
          hideCloseButton
        >
          <ModalContent className="p-0 max-w-[900px]">
            {(onClose) => (
              <>
                <ModalHeader className="flex items-center justify-between p-4 border-b border-divider">
                  <span className="text-xl font-semibold">{t('components.header.manageAccount')}</span>
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={onClose}
                    aria-label={t('components.header.ariaLabels.close')}
                  >
                    <Icon icon="lucide:x" className="text-lg" />
                  </Button>
                </ModalHeader>
                <ModalBody className="p-0 overflow-hidden">
                  <div className="w-full max-h-[calc(80vh-80px)] overflow-auto">
                    <div className="p-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold mb-4">{t('components.header.accountInfo')}</h3>
                          
                          {/* Informações não editáveis */}
                          <div className="space-y-2 mb-6">
                            <p><strong>{t('common.email')}:</strong> {activeUser?.email || '-'}</p>
                            {activeUser?.role && (
                              <p><strong>{t('common.role')}:</strong> {activeUser.role}</p>
                            )}
                          </div>

                          {/* Formulário de edição */}
                          <div className="space-y-4">
                            {/* Campo de nome */}
                            <div>
                              <label className="block text-sm font-medium mb-2">{t('common.name')}</label>
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                placeholder={t('common.name')}
                                variant="bordered"
                                size="md"
                                maxLength={100}
                              />
                            </div>

                            {/* Upload de imagem */}
                            <div>
                              <label className="block text-sm font-medium mb-2">Imagem de Perfil</label>
                              <div className="flex items-start gap-4">
                                {/* Preview da imagem */}
                                <div className="flex-shrink-0">
                                  <Avatar
                                    src={imagePreview}
                                    name={editingName || activeUser?.name || activeUser?.email}
                                    size="lg"
                                    isBordered
                                  />
                                </div>
                                
                                {/* Botão de upload */}
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/jpg,image/png,image/webp"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                    id="avatar-upload"
                                  />
                                  <label htmlFor="avatar-upload">
                                    <Button
                                      as="span"
                                      variant="bordered"
                                      size="sm"
                                      startContent={<Icon icon="lucide:upload" />}
                                    >
                                      Selecionar Imagem
                                    </Button>
                                  </label>
                                  <p className="text-xs text-default-500 mt-2">
                                    Formatos: JPEG, PNG, WebP. Máximo: 5MB
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Mensagens de erro/sucesso */}
                            {saveError && (
                              <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                                <p className="text-sm text-danger">{saveError}</p>
                              </div>
                            )}
                            {saveSuccess && (
                              <div className="p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                                <p className="text-sm text-success">Perfil atualizado com sucesso!</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="border-t border-divider">
                  <Button
                    variant="light"
                    onPress={() => setShowSettings(false)}
                    isDisabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSaveProfile}
                    isLoading={isSaving}
                    startContent={!isSaving && <Icon icon="lucide:save" />}
                  >
                    Salvar
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </header>
  );
}
