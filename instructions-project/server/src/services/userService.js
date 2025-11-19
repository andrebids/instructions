import bcrypt from 'bcryptjs';
import { logInfo, logError } from '../utils/projectLogger.js';
import { transformUserFromNextAuth, transformUserFromSupabase, buildFullName } from '../utils/userTransformers.js';
import { validateEmail, validateRole, validatePassword, validateUserCreation, validateUserUpdate, validateSelfOperation } from '../validators/userValidator.js';
import * as userRepository from '../repositories/userRepository.js';
import * as supabaseAuthService from './supabaseAuthService.js';
import { sendInvitationEmail, sendPasswordChangedEmail } from './emailService.js';

/**
 * Serviço de gerenciamento de usuários
 * Orquestra toda a lógica de negócio relacionada a usuários
 */

/**
 * Lista todos os usuários com filtros opcionais
 * @param {Object} filters - Filtros de busca
 * @param {string} [filters.role] - Filtrar por role
 * @param {string} [filters.search] - Buscar por nome ou email
 * @returns {Promise<Array>} Lista de usuários
 */
export async function getAllUsers(filters = {}) {
  try {
    logInfo('Service: Listando usuários', { filters });

    // Buscar todos os usuários da tabela
    let users = await userRepository.findAll();

    // Transformar para formato da aplicação
    users = users.map(user => {
      try {
        return transformUserFromNextAuth(user);
      } catch (transformError) {
        logError('Service: Erro ao transformar usuário', {
          error: transformError.message,
          userId: user.id,
          userEmail: user.email
        });
        return null;
      }
    }).filter(user => user !== null);

    // Filtrar por role se especificado
    if (filters.role && filters.role !== 'all') {
      logInfo('Service: Aplicando filtro de role', { role: filters.role });
      users = users.filter(user => user.role === filters.role);
    }

    // Filtrar por pesquisa (nome ou email)
    if (filters.search) {
      logInfo('Service: Aplicando filtro de pesquisa', { search: filters.search });
      const searchLower = filters.search.toLowerCase();
      users = users.filter(user =>
        user.fullName.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Ordenar por data de criação (mais recentes primeiro)
    users.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

    logInfo('Service: Total de usuários retornados', { count: users.length });
    return users;
  } catch (error) {
    logError('Service: Erro ao listar usuários', error);
    throw error;
  }
}

/**
 * Busca usuário por ID
 * @param {string} id - ID do usuário
 * @returns {Promise<Object>} Usuário encontrado
 * @throws {Error} Se usuário não for encontrado
 */
export async function getUserById(id) {
  try {
    logInfo('Service: Buscando usuário por ID', { userId: id });

    const user = await userRepository.findById(id);

    if (!user) {
      throw new Error('Utilizador não encontrado');
    }

    return transformUserFromNextAuth(user);
  } catch (error) {
    logError('Service: Erro ao buscar usuário', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Cria um novo usuário
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.firstName - Primeiro nome
 * @param {string} userData.lastName - Último nome
 * @param {string} userData.email - Email
 * @param {string} userData.password - Senha
 * @param {string} [userData.role='comercial'] - Role do usuário
 * @returns {Promise<Object>} Usuário criado
 */
export async function createUser(userData) {
  try {
    logInfo('Service: Criando usuário', {
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role || 'comercial',
    });

    // Validar dados
    const validation = validateUserCreation(userData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    const { firstName, lastName, email, password, role = 'comercial' } = userData;

    // Verificar se email já existe na tabela next_auth.users
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Este email já está registrado');
    }

    // Verificar também no Supabase Auth
    const emailExistsInSupabase = await supabaseAuthService.checkEmailExistsInSupabase(email);
    if (emailExistsInSupabase) {
      throw new Error('Este email já está registrado no Supabase');
    }

    // Preparar metadados
    const userMetadata = {
      firstName: firstName || '',
      lastName: lastName || '',
    };
    const appMetadata = {
      role: role,
    };

    // Criar no Supabase Auth
    const supabaseUser = await supabaseAuthService.createSupabaseUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata,
      app_metadata: appMetadata,
    });

    // Criar também na tabela next_auth.users
    let dbErrorOccurred = false;
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const fullName = buildFullName(firstName, lastName, email);

      logInfo('Service: Preparando dados para inserir na tabela next_auth.users', {
        userId: supabaseUser.id,
        email: email,
        fullName: fullName,
        role: role,
        hasPasswordHash: !!passwordHash,
        passwordHashLength: passwordHash ? passwordHash.length : 0,
      });

      await userRepository.create({
        id: supabaseUser.id,
        name: fullName,
        email,
        password: passwordHash,
        role,
        emailVerified: new Date(),
      });

      logInfo('Service: Usuário criado com sucesso na tabela next_auth.users', {
        userId: supabaseUser.id,
        email: email,
      });
    } catch (dbError) {
      dbErrorOccurred = true;
      // Logar o erro completo (agora logError trata erros do Sequelize)
      logError('Service: Erro ao criar usuário na tabela next_auth.users', dbError);
      
      // Log adicional com contexto
      logInfo('Service: Contexto do erro ao criar na tabela', {
        userId: supabaseUser.id,
        email: email,
        firstName: firstName,
        lastName: lastName,
        role: role,
        supabaseUserCreated: true,
        errorName: dbError?.name,
        errorMessage: dbError?.message,
        hasOriginalError: !!dbError?.original,
      });
      
      // Não falhar a criação se houver erro na tabela (usuário já existe no Supabase)
      // Mas vamos verificar se o usuário foi criado mesmo assim
    }

    // Buscar usuário criado da tabela next_auth.users
    logInfo('Service: Buscando usuário criado na tabela next_auth.users', {
      userId: supabaseUser.id,
      dbErrorOccurred: dbErrorOccurred,
    });

    const createdUser = await userRepository.findById(supabaseUser.id);
    
    if (createdUser) {
      logInfo('Service: Usuário encontrado na tabela next_auth.users', {
        userId: supabaseUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
      });
      return transformUserFromNextAuth(createdUser);
    } else {
      // Fallback: usar dados do Supabase
      logInfo('Service: Usuário não encontrado na tabela, usando dados do Supabase como fallback', {
        userId: supabaseUser.id,
        email: supabaseUser.email,
        dbErrorOccurred: dbErrorOccurred,
      });
      return transformUserFromSupabase(supabaseUser);
    }
  } catch (error) {
    // Logar o erro completo (agora logError trata erros do Sequelize)
    logError('Service: Erro ao criar usuário', error);
    
    // Log adicional com contexto
    logInfo('Service: Contexto do erro ao criar usuário', {
      email: userData?.email,
      firstName: userData?.firstName,
      lastName: userData?.lastName,
      role: userData?.role,
      hasPassword: !!userData?.password,
      errorName: error?.name,
      errorMessage: error?.message,
      hasOriginalError: !!error?.original,
    });

    // Tratar erros específicos
    if (error.message?.includes('already registered') ||
        error.message?.includes('already exists') ||
        error.message?.includes('já está registrado')) {
      throw new Error('Este email já está registrado');
    }

    throw error;
  }
}

/**
 * Atualiza um usuário
 * @param {string} id - ID do usuário
 * @param {Object} updates - Dados a atualizar
 * @param {string} [updates.firstName] - Primeiro nome
 * @param {string} [updates.lastName] - Último nome
 * @param {string} [updates.email] - Email
 * @param {string} [updates.role] - Role
 * @param {string} [updates.password] - Senha
 * @param {string} [updates.imageUrl] - URL da imagem
 * @param {string} currentUserId - ID do usuário atual (para validações)
 * @returns {Promise<Object>} Usuário atualizado
 */
export async function updateUser(id, updates, currentUserId) {
  try {
    logInfo('Service: Atualizando usuário', { userId: id, updates: Object.keys(updates) });

    // Buscar usuário atual
    const currentUser = await userRepository.findById(id);
    if (!currentUser) {
      throw new Error('Utilizador não encontrado');
    }

    // Validar atualizações
    const validation = validateUserUpdate(updates);
    if (!validation.isValid) {
      throw new Error(validation.errors.join('. '));
    }

    // Validar role se fornecido
    if (updates.role !== undefined) {
      const roleValidation = validateRole(updates.role);
      if (!roleValidation.isValid) {
        throw new Error(roleValidation.error);
      }

      // Validar auto-operação
      const selfOpValidation = validateSelfOperation(id, currentUserId, 'update_role', {
        newRole: updates.role
      });
      if (!selfOpValidation.isValid) {
        throw new Error(selfOpValidation.error);
      }
    }

    // Verificar email se fornecido
    if (updates.email !== undefined) {
      const emailExists = await userRepository.checkEmailExists(updates.email, id);
      if (emailExists) {
        throw new Error('Email já está em uso');
      }

      // Verificar também no Supabase
      try {
        const { users } = await supabaseAuthService.listSupabaseUsers();
        if (users) {
          const existingSupabaseUser = users.find(u => u.email === updates.email && u.id !== id);
          if (existingSupabaseUser) {
            throw new Error('Email já está em uso no Supabase');
          }
        }
      } catch (supabaseError) {
        logError('Service: Erro ao verificar email no Supabase', supabaseError);
        // Continuar mesmo com erro
      }
    }

    // Preparar atualizações para Supabase
    const supabaseUpdates = {};
    let passwordHash = null;

    // Verificar se usuário existe no Supabase
    let supabaseUserExists = false;
    try {
      await supabaseAuthService.getSupabaseUserById(id);
      supabaseUserExists = true;
    } catch (error) {
      // Usuário não existe no Supabase, continuar apenas com atualização na tabela
    }

    if (supabaseUserExists) {
      // Buscar metadados atuais do Supabase
      const supabaseUser = await supabaseAuthService.getSupabaseUserById(id);
      const currentUserMeta = supabaseUser.user_metadata || {};
      const currentAppMeta = supabaseUser.app_metadata || {};

      // Atualizar email se fornecido
      if (updates.email !== undefined) {
        supabaseUpdates.email = updates.email;
        supabaseUpdates.email_confirm = true;
      }

      // Atualizar senha se fornecida
      if (updates.password !== undefined) {
        supabaseUpdates.password = updates.password;
        passwordHash = await bcrypt.hash(updates.password, 10);
      }

      // Atualizar user_metadata
      const newUserMeta = { ...currentUserMeta };
      if (updates.firstName !== undefined) newUserMeta.firstName = updates.firstName;
      if (updates.lastName !== undefined) newUserMeta.lastName = updates.lastName;
      if (updates.imageUrl !== undefined) {
        newUserMeta.avatar_url = updates.imageUrl;
        newUserMeta.imageUrl = updates.imageUrl;
        newUserMeta.image = updates.imageUrl;
      }
      supabaseUpdates.user_metadata = newUserMeta;

      // Atualizar app_metadata (role)
      if (updates.role !== undefined) {
        supabaseUpdates.app_metadata = {
          ...currentAppMeta,
          role: updates.role,
        };
      }

      // Aplicar atualizações no Supabase
      if (Object.keys(supabaseUpdates).length > 0) {
        try {
          await supabaseAuthService.updateSupabaseUser(id, supabaseUpdates);
        } catch (supabaseError) {
          logError('Service: Erro ao atualizar no Supabase (não crítico)', supabaseError);
          // Continuar com atualização na tabela
        }
      }
    } else if (updates.password !== undefined) {
      // Se não existe no Supabase mas está atualizando senha, gerar hash
      passwordHash = await bcrypt.hash(updates.password, 10);
    }

    // Preparar atualizações para tabela next_auth.users
    const tableUpdates = {};

    if (updates.firstName !== undefined || updates.lastName !== undefined) {
      const first = updates.firstName !== undefined ? updates.firstName : (currentUser.name?.split(' ')[0] || '');
      const last = updates.lastName !== undefined ? updates.lastName : (currentUser.name?.split(' ').slice(1).join(' ') || '');
      tableUpdates.name = buildFullName(first, last, updates.email || currentUser.email);
    }

    if (updates.email !== undefined) {
      tableUpdates.email = updates.email;
    }

    if (updates.imageUrl !== undefined) {
      tableUpdates.image = updates.imageUrl;
    }

    if (updates.role !== undefined) {
      tableUpdates.role = updates.role;
    }

    if (passwordHash) {
      tableUpdates.password = passwordHash;
    }

    // Atualizar na tabela next_auth.users
    if (Object.keys(tableUpdates).length > 0) {
      await userRepository.update(id, tableUpdates);
    }

    // Buscar usuário atualizado
    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new Error('Utilizador não encontrado após atualização');
    }

    return transformUserFromNextAuth(updatedUser);
  } catch (error) {
    logError('Service: Erro ao atualizar usuário', {
      error: error.message,
      userId: id,
    });
    throw error;
  }
}

/**
 * Atualiza role de um usuário
 * @param {string} id - ID do usuário
 * @param {string} role - Novo role
 * @param {string} currentUserId - ID do usuário atual
 * @returns {Promise<Object>} Usuário atualizado
 */
export async function updateUserRole(id, role, currentUserId) {
  try {
    logInfo('Service: Atualizando role', { userId: id, role });

    // Validar role
    const roleValidation = validateRole(role);
    if (!roleValidation.isValid) {
      throw new Error(roleValidation.error);
    }

    // Validar auto-operação
    const selfOpValidation = validateSelfOperation(id, currentUserId, 'update_role', {
      newRole: role
    });
    if (!selfOpValidation.isValid) {
      throw new Error(selfOpValidation.error);
    }

    // Buscar usuário no Supabase
    try {
      const supabaseUser = await supabaseAuthService.getSupabaseUserById(id);
      const currentAppMeta = supabaseUser.app_metadata || {};

      // Atualizar no Supabase
      await supabaseAuthService.updateSupabaseUser(id, {
        app_metadata: {
          ...currentAppMeta,
          role: role,
        },
      });
    } catch (error) {
      logError('Service: Erro ao atualizar role no Supabase', error);
      // Continuar com atualização na tabela
    }

    // Atualizar na tabela
    await userRepository.update(id, { role });

    // Buscar usuário atualizado
    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new Error('Utilizador não encontrado');
    }

    return transformUserFromNextAuth(updatedUser);
  } catch (error) {
    logError('Service: Erro ao atualizar role', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Atualiza senha de um usuário
 * @param {string} id - ID do usuário
 * @param {string} password - Nova senha
 * @returns {Promise<Object>} Usuário atualizado
 */
export async function updateUserPassword(id, password) {
  try {
    logInfo('Service: Atualizando senha', { userId: id });

    // Validar senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join('. '));
    }

    // Buscar email do usuário (para enviar notificação)
    let userEmail = null;
    try {
      const supabaseUser = await supabaseAuthService.getSupabaseUserById(id);
      userEmail = supabaseUser.email;
    } catch (error) {
      // Tentar buscar da tabela
      const user = await userRepository.findById(id);
      if (user) {
        userEmail = user.email;
      }
    }

    // Atualizar no Supabase
    try {
      await supabaseAuthService.updateSupabaseUser(id, { password });
    } catch (error) {
      logError('Service: Erro ao atualizar senha no Supabase', error);
      // Continuar com atualização na tabela
    }

    // Atualizar na tabela next_auth.users
    const passwordHash = await bcrypt.hash(password, 10);
    await userRepository.updatePassword(id, passwordHash);

    // Buscar usuário atualizado
    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new Error('Utilizador não encontrado');
    }

    // Enviar email de notificação (não-bloqueante)
    if (process.env.EMAIL_ENABLED === 'true' && userEmail) {
      try {
        sendPasswordChangedEmail(userEmail, 'Administrador', new Date())
          .then((result) => {
            if (result.success) {
              logInfo('Service: Email de notificação enviado', { email: userEmail });
            } else {
              logError('Service: Falha ao enviar email', { email: userEmail, error: result.message });
            }
          })
          .catch((error) => {
            logError('Service: Erro ao enviar email', error);
          });
      } catch (emailError) {
        logError('Service: Erro ao tentar enviar email', emailError);
      }
    }

    return transformUserFromNextAuth(updatedUser);
  } catch (error) {
    logError('Service: Erro ao atualizar senha', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Atualiza email de um usuário
 * @param {string} id - ID do usuário
 * @param {string} email - Novo email
 * @returns {Promise<Object>} Usuário atualizado
 */
export async function updateUserEmail(id, email) {
  try {
    logInfo('Service: Atualizando email', { userId: id, email });

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Verificar se email já está em uso
    const emailExists = await userRepository.checkEmailExists(email, id);
    if (emailExists) {
      throw new Error('Email já está em uso');
    }

    // Verificar também no Supabase
    try {
      const { users } = await supabaseAuthService.listSupabaseUsers();
      if (users) {
        const existingSupabaseUser = users.find(u => u.email === email && u.id !== id);
        if (existingSupabaseUser) {
          throw new Error('Email já está em uso no Supabase');
        }
      }
    } catch (error) {
      logError('Service: Erro ao verificar email no Supabase', error);
      // Continuar mesmo com erro
    }

    // Atualizar no Supabase
    try {
      await supabaseAuthService.updateSupabaseUser(id, {
        email,
        email_confirm: true,
      });
    } catch (error) {
      logError('Service: Erro ao atualizar email no Supabase', error);
      // Continuar com atualização na tabela
    }

    // Atualizar na tabela
    await userRepository.update(id, { email });

    // Buscar usuário atualizado
    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new Error('Utilizador não encontrado');
    }

    return transformUserFromNextAuth(updatedUser);
  } catch (error) {
    logError('Service: Erro ao atualizar email', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Atualiza perfil de um usuário (nome, imagem)
 * @param {string} id - ID do usuário
 * @param {Object} profileData - Dados do perfil
 * @param {string} [profileData.firstName] - Primeiro nome
 * @param {string} [profileData.lastName] - Último nome
 * @param {string} [profileData.imageUrl] - URL da imagem
 * @returns {Promise<Object>} Usuário atualizado
 */
export async function updateUserProfile(id, profileData) {
  try {
    logInfo('Service: Atualizando perfil', { userId: id });

    // Buscar usuário no Supabase
    try {
      const supabaseUser = await supabaseAuthService.getSupabaseUserById(id);
      const currentUserMeta = supabaseUser.user_metadata || {};

      // Preparar novos metadados
      const newUserMeta = { ...currentUserMeta };
      if (profileData.firstName !== undefined) newUserMeta.firstName = profileData.firstName;
      if (profileData.lastName !== undefined) newUserMeta.lastName = profileData.lastName;
      if (profileData.imageUrl !== undefined) {
        newUserMeta.avatar_url = profileData.imageUrl;
        newUserMeta.imageUrl = profileData.imageUrl;
        newUserMeta.image = profileData.imageUrl;
      }

      // Atualizar no Supabase
      await supabaseAuthService.updateSupabaseUser(id, {
        user_metadata: newUserMeta,
      });
    } catch (error) {
      logError('Service: Erro ao atualizar perfil no Supabase', error);
      // Continuar com atualização na tabela
    }

    // Atualizar na tabela
    const currentUser = await userRepository.findById(id);
    if (!currentUser) {
      throw new Error('Utilizador não encontrado');
    }

    const tableUpdates = {};
    if (profileData.firstName !== undefined || profileData.lastName !== undefined) {
      const first = profileData.firstName !== undefined ? profileData.firstName : (currentUser.name?.split(' ')[0] || '');
      const last = profileData.lastName !== undefined ? profileData.lastName : (currentUser.name?.split(' ').slice(1).join(' ') || '');
      tableUpdates.name = buildFullName(first, last, currentUser.email);
    }
    if (profileData.imageUrl !== undefined) {
      tableUpdates.image = profileData.imageUrl;
    }

    if (Object.keys(tableUpdates).length > 0) {
      await userRepository.update(id, tableUpdates);
    }

    // Buscar usuário atualizado
    const updatedUser = await userRepository.findById(id);
    if (!updatedUser) {
      throw new Error('Utilizador não encontrado');
    }

    return transformUserFromNextAuth(updatedUser);
  } catch (error) {
    logError('Service: Erro ao atualizar perfil', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Remove um usuário
 * @param {string} id - ID do usuário
 * @param {string} currentUserId - ID do usuário atual
 * @returns {Promise<void>}
 */
export async function deleteUser(id, currentUserId) {
  try {
    logInfo('Service: Removendo usuário', { userId: id });

    // Validar auto-operação
    const selfOpValidation = validateSelfOperation(id, currentUserId, 'delete');
    if (!selfOpValidation.isValid) {
      throw new Error(selfOpValidation.error);
    }

    // Remover do Supabase
    try {
      await supabaseAuthService.deleteSupabaseUser(id);
    } catch (error) {
      logError('Service: Erro ao remover usuário do Supabase', error);
      // Continuar com remoção da tabela
    }

    // Remover da tabela
    await userRepository.deleteUser(id);

    logInfo('Service: Usuário removido com sucesso', { userId: id });
  } catch (error) {
    logError('Service: Erro ao remover usuário', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Envia convite para um usuário
 * @param {string} email - Email do usuário
 * @param {string} [role='comercial'] - Role do usuário
 * @returns {Promise<Object>} Dados do convite
 */
export async function sendUserInvitation(email, role = 'comercial') {
  try {
    logInfo('Service: Enviando convite', { email, role });

    // Validar email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Verificar se usuário já existe
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Este email já está registrado');
    }

    // Verificar também no Supabase
    const emailExistsInSupabase = await supabaseAuthService.checkEmailExistsInSupabase(email);
    if (emailExistsInSupabase) {
      throw new Error('Este email já está registrado no Supabase');
    }

    // Criar convite via Supabase
    // O Supabase inviteUserByEmail cria o usuário em estado "invited" (sem senha definida)
    // e permite que o usuário defina a senha ao clicar no link de convite
    // NOTA: O Supabase envia automaticamente um email padrão ao usar inviteUserByEmail
    const inviteData = await supabaseAuthService.inviteUserByEmail(email, { role });

    // Se EMAIL_ENABLED=true, enviar também nosso email personalizado
    // Isso resultará em dois emails: um do Supabase (padrão) e um nosso (personalizado)
    // O email personalizado tem melhor controle sobre o design e conteúdo
    if (process.env.EMAIL_ENABLED === 'true') {
      try {
        const frontendUrl = process.env.FRONTEND_URL ||
          process.env.CLIENT_URL ||
          'http://localhost:3003';

        const invitationLink = `${frontendUrl}/signin?email=${encodeURIComponent(email)}&invited=true`;

        // Enviar email personalizado de forma não-bloqueante
        // Se falhar, o email do Supabase já foi enviado, então o usuário ainda receberá o convite
        sendInvitationEmail(email, role, invitationLink)
          .then((result) => {
            if (result.success) {
              logInfo('Service: Email de convite personalizado enviado', { email, messageId: result.messageId });
            } else {
              logError('Service: Falha ao enviar email de convite personalizado', { email, error: result.message });
            }
          })
          .catch((error) => {
            logError('Service: Erro ao enviar email de convite personalizado', error);
          });
      } catch (emailError) {
        logError('Service: Erro ao tentar enviar email de convite personalizado', emailError);
      }
    } else {
      logInfo('Service: Apenas email do Supabase será enviado (EMAIL_ENABLED=false)', { email });
    }

    return {
      success: true,
      message: 'Convite enviado com sucesso',
      invitationId: inviteData?.id,
      email: email,
    };
  } catch (error) {
    logError('Service: Erro ao enviar convite', { error: error.message, email });
    throw error;
  }
}

/**
 * Faz upload de avatar de um usuário
 * @param {string} id - ID do usuário
 * @param {Object} file - Arquivo de imagem
 * @returns {Promise<Object>} URL e path do arquivo
 */
export async function uploadUserAvatar(id, file) {
  try {
    logInfo('Service: Fazendo upload de avatar', { userId: id, fileSize: file?.size });

    if (!file) {
      throw new Error('Arquivo não fornecido');
    }

    // Importar serviços necessários
    const { uploadFile, isSupabaseConfigured } = await import('./supabaseStorage.js');
    const path = await import('path');

    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não configurado');
    }

    // Gerar nome do arquivo
    const timestamp = Date.now();
    const ext = path.default.extname(file.originalname).toLowerCase();
    const fileName = `${id}/${timestamp}${ext}`;

    // Fazer upload
    const uploadResult = await uploadFile(
      file.buffer,
      'avatars',
      fileName,
      {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      }
    );

    logInfo('Service: Avatar enviado com sucesso', { userId: id, url: uploadResult.url });

    // Atualizar URL no perfil
    await updateUserProfile(id, { imageUrl: uploadResult.url });

    return {
      url: uploadResult.url,
      path: uploadResult.path
    };
  } catch (error) {
    logError('Service: Erro ao fazer upload de avatar', { error: error.message, userId: id });
    throw error;
  }
}

