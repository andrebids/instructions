import { Avatar, Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Input, Badge, Popover, PopoverTrigger, PopoverContent, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import React from "react";
import { useTheme } from "@heroui/use-theme";
import { useUser } from "../../context/UserContext";
import { useAuthContext } from "../../context/AuthContext";
import { GlobalSyncStatus } from "../features/SyncStatus";
import { LocaleSelector } from "./LocaleSelector";
import { useTranslation } from "react-i18next";
import { usersAPI, productsAPI, projectsAPI } from "../../services/api";
import { PasswordField } from "../admin/PasswordField";
import { usePasswordGenerator } from "../../hooks/usePasswordGenerator";
import { DragAndDropZone } from "../ui/DragAndDropZone";
import { useNavigate } from "react-router-dom";

export function Header() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const { userName, setUserName } = useUser();
  const [tempName, setTempName] = React.useState("");

  // Estados para edição de perfil
  const [editingName, setEditingName] = React.useState("");
  const [editingImage, setEditingImage] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [password, setPassword] = React.useState("");
  const [passwordConfirm, setPasswordConfirm] = React.useState("");
  const [showPasswordConfirm, setShowPasswordConfirm] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  // Hook para gerenciar senha
  const passwordGenerator = usePasswordGenerator((newPassword) => {
    setPassword(newPassword);
    setPasswordConfirm(newPassword);
  });

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

  // Debounce para pesquisa
  const searchTimeoutRef = React.useRef(null);
  // AbortController para cancelar requisições anteriores
  const abortControllerRef = React.useRef(null);

  // Função de pesquisa
  const performSearch = React.useCallback(async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController para esta requisição
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsSearching(true);
    try {
      // Pesquisar produtos e projetos em paralelo com signal de cancelamento
      const [products, projects] = await Promise.all([
        productsAPI.search(query, { signal: abortController.signal }).catch((err) => {
          // Ignorar erros de cancelamento
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            return null;
          }
          return [];
        }),
        projectsAPI.search(query, { signal: abortController.signal }).catch((err) => {
          // Ignorar erros de cancelamento
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            return null;
          }
          return [];
        }),
      ]);

      // Verificar se a requisição foi cancelada
      if (abortController.signal.aborted) {
        return;
      }

      // Se alguma requisição foi cancelada, retornar array vazio
      if (products === null || projects === null) {
        return;
      }

      // Combinar e formatar resultados
      const combinedResults = [
        ...products.slice(0, 3).map((product) => ({
          type: 'product',
          id: product.id,
          name: product.name,
          reference: product.id,
          data: product,
        })),
        ...projects.slice(0, 3).map((project) => ({
          type: 'project',
          id: project.id,
          name: project.name,
          clientName: project.clientName,
          status: project.status,
          data: project,
        })),
      ].slice(0, 3); // Limitar a 3 resultados totais

      // Verificar novamente se foi cancelado antes de atualizar estado
      if (!abortController.signal.aborted) {
        setSearchResults(combinedResults);
        setShowSearchResults(combinedResults.length > 0);
      }
    } catch (error) {
      // Ignorar erros de cancelamento
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return;
      }
      console.error('Erro ao pesquisar:', error);
      if (!abortController.signal.aborted) {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } finally {
      // Só atualizar loading se não foi cancelado
      if (!abortController.signal.aborted) {
        setIsSearching(false);
      }
    }
  }, []);

  // Handler para mudança no input de pesquisa
  const handleSearchChange = React.useCallback((value) => {
    setSearchQuery(value);
    
    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Se tiver menos de 3 caracteres, limpar resultados
    if (!value || value.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Debounce de 300ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value.trim());
    }, 300);
  }, [performSearch]);

  // Limpar timeout e cancelar requisições ao desmontar
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handler para clicar em um resultado
  const handleResultClick = React.useCallback((result) => {
    if (result.type === 'project') {
      navigate(`/projects/${result.id}`);
    } else if (result.type === 'product') {
      // Navegar para admin/products (pode ser ajustado conforme necessário)
      navigate(`/admin/products`);
    }
    setShowSearchResults(false);
    setSearchQuery("");
    setShowSearch(false);
  }, [navigate]);

  // Inicializar valores do formulário quando o modal abrir
  React.useEffect(() => {
    if (showSettings && activeUser) {
      setEditingName(activeUser.name || activeUser.email || "");
      setEditingImage(null);
      setImagePreview(activeUser.image || activeUser.imageUrl || null);
      setPassword("");
      setPasswordConfirm("");
      setShowPasswordConfirm(false);
      setSaveError(null);
      setSaveSuccess(false);
      passwordGenerator.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings, activeUser]);

  // Função para lidar com seleção de imagem
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const handleFilesSelected = (files) => {
    const file = files[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const validateAndSetImage = (file) => {
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
  };

  // Função para salvar perfil
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Validar senha se fornecida
      const passwordTrimmed = password?.trim() || '';
      const passwordConfirmTrimmed = passwordConfirm?.trim() || '';
      const hasPassword = passwordTrimmed.length > 0;
      const hasPasswordConfirm = passwordConfirmTrimmed.length > 0;

      if (hasPassword || hasPasswordConfirm) {
        // Se apenas um campo está preenchido, mostrar erro
        if (hasPassword !== hasPasswordConfirm) {
          setSaveError('Por favor, preencha ambos os campos de senha ou deixe-os vazios');
          setIsSaving(false);
          return;
        }

        // Se ambos estão preenchidos, validar
        if (hasPassword && hasPasswordConfirm) {
          if (passwordTrimmed !== passwordConfirmTrimmed) {
            setSaveError('As senhas não coincidem. Por favor, verifique.');
            setIsSaving(false);
            return;
          }

          if (passwordTrimmed.length < 8) {
            setSaveError('A senha deve ter pelo menos 8 caracteres');
            setIsSaving(false);
            return;
          }

          // Validar força da senha (mesma validação do backend)
          const hasUpperCase = /[A-Z]/.test(passwordTrimmed);
          const hasLowerCase = /[a-z]/.test(passwordTrimmed);
          const hasNumbers = /\d/.test(passwordTrimmed);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(passwordTrimmed);

          if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            setSaveError('A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial');
            setIsSaving(false);
            return;
          }
        }
      }

      // Atualizar senha se fornecida
      if (hasPassword && hasPasswordConfirm && passwordTrimmed === passwordConfirmTrimmed) {
        try {
          await usersAPI.updateProfilePassword(passwordTrimmed);
        } catch (passwordError) {
          const errorMessage = passwordError.response?.data?.message || passwordError.response?.data?.error || 'Erro ao atualizar senha';
          const errorDetails = passwordError.response?.data?.details;

          if (errorDetails && Array.isArray(errorDetails)) {
            setSaveError(`${errorMessage}\n\n${errorDetails.join('\n')}`);
          } else {
            setSaveError(errorMessage);
          }
          setIsSaving(false);
          return;
        }
      }

      // Atualizar imagem e nome
      let imageUrl = activeUser?.image || activeUser?.imageUrl;

      // Se há uma nova imagem, fazer upload primeiro
      if (editingImage) {
        const uploadResult = await usersAPI.uploadAvatar(editingImage);
        imageUrl = uploadResult.url;
      }

      // Atualizar perfil (nome e imagem)
      if (editingName.trim() !== (activeUser?.name || '') || imageUrl !== (activeUser?.image || activeUser?.imageUrl)) {
        await usersAPI.updateProfile(editingName.trim(), imageUrl);
      }

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
          <div className="relative">
            <Input
              autoFocus
              size="sm"
              className="w-64"
              placeholder={t('components.header.searchPlaceholder')}
              aria-label={t('common.search')}
              value={searchQuery}
              onValueChange={handleSearchChange}
              startContent={
                isSearching ? (
                  <Spinner size="sm" className="text-default-400" />
                ) : (
                  <Icon icon="lucide:search" className="text-default-400" />
                )
              }
              endContent={
                searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSearchResults(false);
                    }}
                    className="text-default-400 hover:text-default-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <Icon icon="lucide:x" className="text-sm" />
                  </button>
                )
              }
              onBlur={(e) => {
                // Delay para permitir cliques nos resultados
                setTimeout(() => {
                  const activeElement = document.activeElement;
                  const resultsContainer = document.querySelector('[data-search-results]');
                  if (!resultsContainer?.contains(activeElement)) {
                    setShowSearchResults(false);
                    if (!searchQuery) {
                      setShowSearch(false);
                    }
                  }
                }, 200);
              }}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchResults(true);
                }
              }}
            />
            {showSearchResults && searchResults.length > 0 && (
              <div
                data-search-results
                className="absolute top-full left-0 mt-1 w-[400px] max-h-[300px] overflow-y-auto bg-background border border-default-200 dark:border-default-100 rounded-lg shadow-lg z-50"
                onMouseDown={(e) => e.preventDefault()}
              >
                <div className="p-2">
                  {searchResults.map((result, index) => (
                    <div
                      key={`${result.type}-${result.id}-${index}`}
                      onClick={() => handleResultClick(result)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleResultClick(result);
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-default-100 dark:hover:bg-default-50 cursor-pointer transition-colors"
                    >
                      <div className="flex-shrink-0">
                        {result.type === 'product' ? (
                          <Icon icon="lucide:package" className="text-xl text-primary" />
                        ) : (
                          <Icon icon="lucide:folder" className="text-xl text-warning" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-default-500 uppercase">
                            {result.type === 'product' ? t('common.product', 'Produto') : t('common.project', 'Projeto')}
                          </span>
                        </div>
                        <div className="font-medium text-sm truncate mt-1">
                          {result.name}
                        </div>
                        {result.type === 'product' && result.reference && (
                          <div className="text-xs text-default-500 mt-1">
                            {t('common.reference', 'Referência')}: {result.reference}
                          </div>
                        )}
                        {result.type === 'project' && result.clientName && (
                          <div className="text-xs text-default-500 mt-1">
                            {t('common.client', 'Cliente')}: {result.clientName}
                          </div>
                        )}
                      </div>
                      <Icon icon="lucide:chevron-right" className="text-default-400 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button
            isIconOnly
            variant="light"
            aria-label={t('components.header.ariaLabels.openSearch')}
            onClick={() => {
              setShowSearch(true);
              setTimeout(() => {
                const input = document.querySelector('input[aria-label="' + t('common.search') + '"]');
                if (input) {
                  input.focus();
                }
              }, 100);
            }}
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
          <DropdownMenu aria-label="Profile Actions" variant="flat" onAction={(key) => {
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
          onClose={() => setShowSettings(false)}
          placement="center"
          backdrop="blur"
          size="2xl"
          scrollBehavior="inside"
          hideCloseButton
          classNames={{
            base: "max-w-[600px]",
            wrapper: "p-4"
          }}
        >
          <ModalContent className="p-0">
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
                <ModalBody className="p-0">
                  <div className="p-4 md:p-6">
                    <div className="space-y-5">
                      {/* Seção: Informações da Conta */}
                      <div>
                        <h3 className="text-base font-semibold mb-3">{t('components.header.accountInfo')}</h3>

                        {/* Informações não editáveis - Compacto */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-default-50 dark:bg-default-100/30 rounded-lg">
                          <p className="text-xs sm:text-sm">
                            <span className="font-medium text-default-600 dark:text-default-400">{t('common.email')}:</span>{' '}
                            <span className="text-default-700 dark:text-default-300 break-all">{activeUser?.email || '-'}</span>
                          </p>
                          {activeUser?.role && (
                            <p className="text-xs sm:text-sm">
                              <span className="font-medium text-default-600 dark:text-default-400">{t('common.role')}:</span>{' '}
                              <span className="text-default-700 dark:text-default-300">{activeUser.role}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Separador visual */}
                      <div className="h-px bg-divider" />

                      {/* Seção: Imagem de Perfil - Compacto */}
                      <div>
                        <h3 className="text-base font-semibold mb-3">Imagem de Perfil</h3>
                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          {/* Preview da imagem */}
                          {/* Preview da imagem */}
                          <div className="flex-shrink-0">
                            <DragAndDropZone
                              onFilesSelected={handleFilesSelected}
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              className="relative group flex-shrink-0 rounded-full overflow-hidden w-10 h-10 sm:w-16 sm:h-16 border-2 border-default-200"
                            >
                              <Avatar
                                src={imagePreview}
                                name={editingName || activeUser?.name || activeUser?.email}
                                className="w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Icon icon="lucide:camera" className="text-white" />
                              </div>
                            </DragAndDropZone>
                          </div>

                          {/* Botão de upload */}
                          <div className="flex-1 w-full sm:w-auto">
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={handleImageSelect}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label htmlFor="avatar-upload" className="block">
                              <Button
                                as="span"
                                variant="bordered"
                                size="sm"
                                className="w-full sm:w-auto"
                                startContent={<Icon icon="lucide:upload" className="text-sm" />}
                              >
                                <span className="text-xs sm:text-sm">Selecionar Imagem</span>
                              </Button>
                            </label>
                            <p className="text-xs text-default-500 mt-1.5">
                              JPEG, PNG, WebP • Máx. 5MB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Separador visual */}
                      <div className="h-px bg-divider" />

                      {/* Campo de nome */}
                      <div>
                        <Input
                          label={t('common.name')}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          placeholder={t('common.name')}
                          variant="bordered"
                          size="sm"
                          maxLength={100}
                        />
                      </div>

                      {/* Separador visual */}
                      <div className="h-px bg-divider" />

                      {/* Seção: Alterar Senha */}
                      <div>
                        <h3 className="text-base font-semibold mb-3">Alterar Senha</h3>
                        <div className="space-y-3">
                          <PasswordField
                            label="Nova Senha (opcional)"
                            placeholder="Digite a nova senha"
                            value={password}
                            onChange={(e) => {
                              const newPassword = e.target.value;
                              setPassword(newPassword);
                              passwordGenerator.updatePasswordStrength(newPassword);
                            }}
                            onPasswordGenerated={(newPassword) => {
                              setPassword(newPassword);
                              setPasswordConfirm(newPassword);
                            }}
                            size="sm"
                          />

                          {password && (
                            <>
                              <Input
                                label="Confirmar Nova Senha"
                                placeholder="Digite a senha novamente"
                                type={showPasswordConfirm ? 'text' : 'password'}
                                value={passwordConfirm}
                                onChange={(e) => {
                                  setPasswordConfirm(e.target.value);
                                }}
                                size="sm"
                                variant="bordered"
                                color={
                                  password &&
                                    passwordConfirm &&
                                    password === passwordConfirm
                                    ? 'success'
                                    : passwordConfirm
                                      ? 'danger'
                                      : 'default'
                                }
                                description={
                                  password && passwordConfirm
                                    ? password === passwordConfirm
                                      ? '✓ Senhas coincidem'
                                      : '✗ Senhas não coincidem'
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
                                      className="text-default-400 text-sm"
                                    />
                                  </Button>
                                }
                              />
                              <p className="text-xs text-default-500 leading-tight">
                                Mín. 8 caracteres: maiúsculas, minúsculas, números e especiais
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Mensagens de erro/sucesso */}
                      {saveError && (
                        <div className="p-2.5 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                          <p className="text-xs sm:text-sm text-danger whitespace-pre-line">{saveError}</p>
                        </div>
                      )}
                      {saveSuccess && (
                        <div className="p-2.5 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
                          <p className="text-xs sm:text-sm text-success">Perfil atualizado com sucesso!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter className="border-t border-divider p-3 md:p-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="light"
                      onPress={() => setShowSettings(false)}
                      isDisabled={isSaving}
                      size="sm"
                      className="flex-1 sm:flex-initial"
                    >
                      Cancelar
                    </Button>
                    <Button
                      color="primary"
                      onPress={handleSaveProfile}
                      isLoading={isSaving}
                      size="sm"
                      startContent={!isSaving && <Icon icon="lucide:save" className="text-sm" />}
                      className="flex-1 sm:flex-initial bg-blue-600 text-white"
                    >
                      Salvar
                    </Button>
                  </div>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </header>
  );
}
