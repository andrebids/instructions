import { useState, useCallback, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useTranslation } from 'react-i18next';

/**
 * Hook para gerenciar CRUD de usuários
 * @param {boolean} isAdmin - Se o usuário atual é admin
 * @returns {Object} - Estados e funções para gerenciar usuários
 */
export function useUsersManagement(isAdmin) {
  const { t } = useTranslation();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  /**
   * Carrega lista de usuários
   */
  const loadUsers = useCallback(async () => {
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
      
      console.log('[useUsersManagement] Carregando usuários com parâmetros:', params);
      const data = await usersAPI.getAll(params);
      console.log('[useUsersManagement] Usuários recebidos da API:', {
        count: Array.isArray(data) ? data.length : 0,
        userIds: Array.isArray(data) ? data.map(u => u.id) : [],
        emails: Array.isArray(data) ? data.map(u => u.email) : []
      });
      
      if (!Array.isArray(data)) {
        console.error('[useUsersManagement] Dados recebidos não são um array:', data);
        setUsers([]);
      } else {
        setUsers(data);
        console.log('[useUsersManagement] Estado de usuários atualizado:', {
          count: data.length
        });
      }
    } catch (err) {
      console.error('[useUsersManagement] Erro ao carregar utilizadores:', err);
      setError(err.message || t('pages.dashboard.adminUsers.status.error'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchQuery, t]);

  /**
   * Cria um novo usuário
   * @param {Object} userData - Dados do usuário
   * @returns {Promise<void>}
   */
  const createUser = useCallback(async (userData) => {
    try {
      setActionLoading(true);
      console.log('[useUsersManagement] Criando usuário:', { email: userData.email });
      await usersAPI.create(userData);
      console.log('[useUsersManagement] Usuário criado com sucesso, recarregando lista...');
      await loadUsers();
      console.log('[useUsersManagement] Lista recarregada após criar usuário');
    } catch (err) {
      console.error('[useUsersManagement] Erro ao criar utilizador:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadUsers]);

  /**
   * Atualiza um usuário
   * @param {string} userId - ID do usuário
   * @param {Object} userData - Dados atualizados
   * @param {File|null} avatarFile - Arquivo de avatar (opcional)
   * @returns {Promise<void>}
   */
  const updateUser = useCallback(async (userId, userData, avatarFile = null) => {
    try {
      setActionLoading(true);
      console.log('[useUsersManagement] Atualizando usuário:', { userId, email: userData.email });
      let imageUrl = userData.imageUrl;

      // Upload avatar se fornecido
      if (avatarFile) {
        console.log('[useUsersManagement] Fazendo upload de avatar para usuário:', userId);
        const uploadResult = await usersAPI.uploadUserAvatar(userId, avatarFile);
        imageUrl = uploadResult.url;
      }

      const updateData = {
        ...userData,
        imageUrl: imageUrl
      };

      await usersAPI.update(userId, updateData);
      console.log('[useUsersManagement] Usuário atualizado com sucesso, recarregando lista...');
      await loadUsers();
      console.log('[useUsersManagement] Lista recarregada após atualizar usuário');
    } catch (err) {
      console.error('[useUsersManagement] Erro ao atualizar utilizador:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadUsers]);

  /**
   * Deleta um usuário
   * @param {string} userId - ID do usuário
   * @returns {Promise<void>}
   */
  const deleteUser = useCallback(async (userId) => {
    try {
      setActionLoading(true);
      await usersAPI.delete(userId);
      await loadUsers();
    } catch (err) {
      console.error('Erro ao remover utilizador:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadUsers]);

  /**
   * Envia convite para novo usuário
   * @param {string} email - Email do usuário
   * @param {string} role - Role do usuário
   * @returns {Promise<void>}
   */
  const sendInvite = useCallback(async (email, role) => {
    try {
      setActionLoading(true);
      await usersAPI.sendInvitation(email, role);
      await loadUsers();
    } catch (err) {
      console.error('Erro ao enviar convite:', err);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [loadUsers]);

  // Carregar usuários quando isAdmin mudar ou filtros mudarem
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  return {
    // Estados
    users,
    loading,
    error,
    searchQuery,
    roleFilter,
    actionLoading,
    
    // Setters
    setSearchQuery,
    setRoleFilter,
    
    // Funções
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    sendInvite,
  };
}

