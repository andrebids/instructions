import { createClient } from '@supabase/supabase-js';
import { getAuth } from '../middleware/auth.js';
import { logError, logInfo } from '../utils/projectLogger.js';
import sequelize from '../config/database.js';
import { sendInvitationEmail } from '../services/emailService.js';
import bcrypt from 'bcryptjs';

/**
 * Controller de utilizadores usando Supabase Admin API e next_auth.users
 * Todas as operações requerem role admin
 */

// Criar cliente Supabase Admin (usando service role key)
let supabaseAdmin = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados');
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseAdmin;
}

/**
 * Transforma usuário da tabela next_auth.users para formato da aplicação
 */
function transformUserFromNextAuth(user) {
  // Separar nome completo em firstName e lastName
  const nameParts = (user.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const fullName = user.name || user.email || 'Sem nome';

  return {
    id: user.id,
    firstName: firstName,
    lastName: lastName,
    fullName: fullName,
    email: user.email || '',
    role: user.role || null,
    imageUrl: user.image || null,
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,
    lastLogin: user.last_login ? new Date(user.last_login).toISOString() : null,
    emailVerified: user.emailVerified !== null,
  };
}

/**
 * Transforma usuário do Supabase Auth para formato da aplicação
 */
function transformUserFromSupabase(user) {
  const rawUserMeta = user.user_metadata || {};
  const rawAppMeta = user.app_metadata || {};

  // Extrair nome (firstName, lastName) de raw_user_meta_data
  const firstName = rawUserMeta.firstName || rawUserMeta.first_name || '';
  const lastName = rawUserMeta.lastName || rawUserMeta.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || user.email || 'Sem nome';

  // Extrair role de raw_app_meta_data
  const role = rawAppMeta.role || null;

  // Extrair imagem de perfil
  const imageUrl = rawUserMeta.avatar_url || rawUserMeta.imageUrl || rawUserMeta.image || null;

  return {
    id: user.id,
    firstName: firstName,
    lastName: lastName,
    fullName: fullName,
    email: user.email || '',
    role: role,
    imageUrl: imageUrl,
    createdAt: user.created_at ? new Date(user.created_at).toISOString() : null,
    lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at).toISOString() : null,
    emailVerified: user.email_confirmed_at !== null,
  };
}

// GET /api/users - Listar todos os utilizadores
export async function getAll(req, res) {
  try {
    logInfo('GET /api/users - Listando utilizadores');

    const { role, search } = req.query;

    // Buscar usuários da tabela next_auth.users (usada pelo Auth.js)
    const usersFromNextAuth = await sequelize.query(
      `SELECT id, name, email, image, role, "emailVerified", created_at, last_login FROM next_auth.users`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    logInfo(`Total de usuários encontrados em next_auth.users: ${usersFromNextAuth.length}`);

    // Transformar dados para formato da aplicação
    let users = usersFromNextAuth.map(user => transformUserFromNextAuth(user));

    // Filtrar por role se especificado
    if (role && role !== 'all') {
      users = users.filter(user => user.role === role);
    }

    // Filtrar por pesquisa (nome ou email)
    if (search) {
      const searchLower = search.toLowerCase();
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

    logInfo(`Utilizadores encontrados: ${users.length}`);
    res.json(users);
  } catch (error) {
    logError('Erro ao listar utilizadores', error);
    res.status(500).json({
      error: 'Erro ao listar utilizadores',
      message: error.message
    });
  }
}

// GET /api/users/:id - Obter utilizador específico
export async function getById(req, res) {
  try {
    const { id } = req.params;
    logInfo(`GET /api/users/${id} - Buscando utilizador`);

    // Buscar usuário da tabela next_auth.users
    const users = await sequelize.query(
      `SELECT id, name, email, image, role, "emailVerified", created_at, last_login FROM next_auth.users WHERE id = :userId LIMIT 1`,
      {
        replacements: { userId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const user = transformUserFromNextAuth(users[0]);
    res.json(user);
  } catch (error) {
    logError('Erro ao buscar utilizador', error);
    res.status(500).json({
      error: 'Erro ao buscar utilizador',
      message: error.message
    });
  }
}

// POST /api/users - Criar novo utilizador
export async function create(req, res) {
  try {
    const { firstName, lastName, email, password, role } = req.body;
    logInfo('POST /api/users - Criando utilizador', { email, role: role || 'comercial' });

    // Validar campos obrigatórios
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email e password são obrigatórios'
      });
    }

    const supabase = getSupabaseAdmin();

    // Criar utilizador usando Admin API
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        firstName: firstName || '',
        lastName: lastName || '',
      },
      app_metadata: {
        role: role || 'comercial',
      },
    });

    if (createError) {
      throw new Error(createError.message);
    }

    // Após criar no Supabase Auth, buscar da tabela next_auth.users
    // Nota: O Auth.js pode criar automaticamente na next_auth.users quando o usuário faz login
    // Por enquanto, retornamos os dados do Supabase
    const user = transformUserFromSupabase(userData.user);

    logInfo('Utilizador criado com sucesso', { id: user.id, email });
    res.status(201).json(user);
  } catch (error) {
    logError('Erro ao criar utilizador', error);

    // Tratar erros específicos
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      return res.status(400).json({
        error: 'Este email já está registrado',
        message: 'O utilizador com este email já existe no sistema'
      });
    }

    res.status(400).json({
      error: 'Erro ao criar utilizador',
      message: error.message
    });
  }
}

// POST /api/users/invite - Enviar convite
export async function sendInvitation(req, res) {
  try {
    const { email, role } = req.body;
    logInfo('POST /api/users/invite - Enviando convite', { email, role: role || 'comercial' });

    // Validar email
    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Verificar se usuário já existe na tabela next_auth.users
    const existingUsers = await sequelize.query(
      `SELECT id FROM next_auth.users WHERE email = :emailValue LIMIT 1`,
      {
        replacements: { emailValue: email },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Este email já está registrado',
        message: 'O utilizador com este email já existe no sistema'
      });
    }

    // Verificar também no Supabase Auth (listar usuários)
    const supabase = getSupabaseAdmin();
    const { data: usersList } = await supabase.auth.admin.listUsers();
    if (usersList?.users) {
      const existingSupabaseUser = usersList.users.find(u => u.email === email);
      if (existingSupabaseUser) {
        return res.status(400).json({
          error: 'Este email já está registrado',
          message: 'O utilizador com este email já existe no Supabase'
        });
      }
    }

    // Criar convite usando Admin API
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role: role || 'comercial',
      },
    });

    if (inviteError) {
      throw new Error(inviteError.message);
    }

    logInfo('Convite enviado com sucesso', { email, id: inviteData.user?.id });

    // Enviar email de convite (não-bloqueante)
    if (process.env.EMAIL_ENABLED === 'true') {
      try {
        // Gerar link de ativação
        // O Supabase envia automaticamente um email, mas podemos enviar um customizado também
        // Usar URL do frontend ou URL padrão
        const frontendUrl = process.env.FRONTEND_URL ||
          process.env.CLIENT_URL ||
          'http://localhost:3003';

        // O Supabase gera um token de confirmação, mas podemos usar a página de sign-in
        // ou criar uma rota específica de ativação
        // Por enquanto, vamos usar a página de sign-in com o email como parâmetro
        const invitationLink = `${frontendUrl}/signin?email=${encodeURIComponent(email)}&invited=true`;

        // Enviar email de forma assíncrona (não bloquear a resposta)
        sendInvitationEmail(email, role || 'comercial', invitationLink)
          .then((result) => {
            if (result.success) {
              logInfo('Email de convite enviado com sucesso', { email, messageId: result.messageId });
            } else {
              logError('Falha ao enviar email de convite', { email, error: result.message });
            }
          })
          .catch((error) => {
            logError('Erro ao enviar email de convite', error);
          });
      } catch (emailError) {
        // Não falhar a criação do convite se o email falhar
        logError('Erro ao tentar enviar email de convite', emailError);
      }
    } else {
      logInfo('Email desabilitado, não enviando email de convite');
    }

    res.status(201).json({
      success: true,
      message: 'Convite enviado com sucesso',
      invitationId: inviteData.user?.id,
      email: email,
    });
  } catch (error) {
    logError('Erro ao enviar convite', error);

    // Tratar erros específicos
    if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
      return res.status(400).json({
        error: 'Este email já está registrado',
        message: 'O utilizador com este email já existe no sistema'
      });
    }

    res.status(400).json({
      error: 'Erro ao enviar convite',
      message: error.message
    });
  }
}

// PUT /api/users/:id/role - Atualizar role
export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;
    logInfo(`PUT /api/users/${id}/role - Atualizando role`, { role });

    // Validar role
    const validRoles = ['admin', 'comercial', 'editor_stock'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        error: 'Role inválido',
        message: `Role deve ser um dos seguintes: ${validRoles.join(', ')}`
      });
    }

    // Obter utilizador atual
    const auth = await getAuth(req);
    const currentUserId = auth?.userId;

    // Não permitir que admin remova seu próprio role de admin
    if (id === currentUserId && role !== 'admin') {
      return res.status(400).json({
        error: 'Não pode alterar seu próprio role',
        message: 'Não é possível remover seu próprio role de administrador'
      });
    }

    const supabase = getSupabaseAdmin();

    // Buscar usuário atual para preservar app_metadata existente
    const { data: currentUserData, error: getUserError } = await supabase.auth.admin.getUserById(id);
    if (getUserError || !currentUserData.user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const currentAppMeta = currentUserData.user.app_metadata || {};

    // Atualizar role mantendo outros metadados
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(id, {
      app_metadata: {
        ...currentAppMeta,
        role: role,
      },
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    const user = transformUserFromSupabase(updatedUser.user);

    logInfo('Role atualizado com sucesso', { id, role });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar role', error);
    res.status(500).json({
      error: 'Erro ao atualizar role',
      message: error.message
    });
  }
}

// PUT /api/users/:id/password - Atualizar senha
export async function updatePassword(req, res) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    logInfo(`PUT /api/users/${id}/password - Atualizando senha`);

    if (!password) {
      return res.status(400).json({
        error: 'Password é obrigatório'
      });
    }

    // Validar força da senha usando validador robusto
    const { validatePasswordStrength } = await import('../utils/passwordValidator.js');
    const validation = validatePasswordStrength(password);

    if (!validation.isValid) {
      logInfo(`Validação de password falhou para usuário ${id}:`, validation.errors);
      return res.status(400).json({
        error: 'Password não cumpre os requisitos de segurança',
        message: validation.errors.join('. '),
        details: validation.errors,
        strength: validation.strength
      });
    }

    const supabase = getSupabaseAdmin();

    // Buscar dados do usuário antes de atualizar (para enviar email)
    const { data: currentUserData, error: getUserError } = await supabase.auth.admin.getUserById(id);
    if (getUserError || !currentUserData.user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const userEmail = currentUserData.user.email;

    // Atualizar senha usando Admin API
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: password,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    // IMPORTANTE: Também atualizar a senha na tabela next_auth.users
    // porque o login verifica a senha nessa tabela, não no Supabase Auth
    try {
      // Gerar hash bcrypt da nova senha
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Atualizar na tabela next_auth.users
      await sequelize.query(
        `UPDATE next_auth.users SET password = :passwordHash WHERE id = :userId`,
        {
          replacements: {
            passwordHash: passwordHash,
            userId: id
          },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      logInfo('Senha atualizada na tabela next_auth.users', { id });
    } catch (nextAuthUpdateError) {
      logError('Erro ao atualizar senha na tabela next_auth.users', nextAuthUpdateError);
      // Não falhar a requisição, mas logar o erro
      // A senha foi atualizada no Supabase Auth, mas pode não funcionar no login
    }

    const user = transformUserFromSupabase(updatedUser.user);

    const adminEmail = req.auth?.user?.email || 'Administrador';

    logInfo('Senha atualizada com sucesso', {
      id,
      passwordStrength: validation.strength,
      updatedBy: adminEmail
    });

    // Enviar email de notificação (não-bloqueante)
    if (process.env.EMAIL_ENABLED === 'true' && userEmail) {
      try {
        const { sendPasswordChangedEmail } = await import('../services/emailService.js');
        sendPasswordChangedEmail(userEmail, adminEmail, new Date())
          .then((result) => {
            if (result.success) {
              logInfo('Email de notificação de mudança de password enviado', {
                email: userEmail,
                messageId: result.messageId
              });
            } else {
              logError('Falha ao enviar email de notificação', {
                email: userEmail,
                error: result.message
              });
            }
          })
          .catch((error) => {
            logError('Erro ao enviar email de notificação', error);
          });
      } catch (emailError) {
        // Não falhar a atualização se o email falhar
        logError('Erro ao tentar enviar email de notificação', emailError);
      }
    }

    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar senha', error);
    res.status(400).json({
      error: 'Erro ao atualizar senha',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// PUT /api/users/:id/email - Atualizar email
export async function updateEmail(req, res) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    logInfo(`PUT /api/users/${id}/email - Atualizando email`, { email });

    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }

    // Verificar se email já está em uso na tabela next_auth.users
    const existingUsers = await sequelize.query(
      `SELECT id FROM next_auth.users WHERE email = :emailValue AND id != :userIdValue LIMIT 1`,
      {
        replacements: { emailValue: email, userIdValue: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (existingUsers && existingUsers.length > 0) {
      return res.status(400).json({
        error: 'Email já está em uso',
        message: 'Este email já está registrado por outro utilizador'
      });
    }

    // Verificar também no Supabase Auth
    const supabase = getSupabaseAdmin();
    const { data: usersList } = await supabase.auth.admin.listUsers();
    if (usersList?.users) {
      const existingSupabaseUser = usersList.users.find(u => u.email === email && u.id !== id);
      if (existingSupabaseUser) {
        return res.status(400).json({
          error: 'Email já está em uso',
          message: 'Este email já está registrado por outro utilizador no Supabase'
        });
      }
    }

    // Atualizar email usando Admin API
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(id, {
      email: email,
      email_confirm: true, // Confirmar novo email automaticamente
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    const user = transformUserFromSupabase(updatedUser.user);

    logInfo('Email atualizado com sucesso', { id, email });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar email', error);
    res.status(400).json({
      error: 'Erro ao atualizar email',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// PUT /api/users/:id/profile - Atualizar perfil (nome, imagem)
export async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, imageUrl } = req.body;
    logInfo(`PUT /api/users/${id}/profile - Atualizando perfil`);

    const supabase = getSupabaseAdmin();

    // Buscar usuário atual para preservar user_metadata existente
    const { data: currentUserData, error: getUserError } = await supabase.auth.admin.getUserById(id);
    if (getUserError || !currentUserData.user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const currentUserMeta = currentUserData.user.user_metadata || {};

    // Preparar novos metadados
    const newUserMeta = { ...currentUserMeta };
    if (firstName !== undefined) newUserMeta.firstName = firstName;
    if (lastName !== undefined) newUserMeta.lastName = lastName;
    if (imageUrl !== undefined) {
      newUserMeta.avatar_url = imageUrl;
      newUserMeta.imageUrl = imageUrl;
      newUserMeta.image = imageUrl;
    }

    // Atualizar perfil usando Admin API
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(id, {
      user_metadata: newUserMeta,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }

    const user = transformUserFromSupabase(updatedUser.user);

    logInfo('Perfil atualizado com sucesso', { id });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar perfil', error);
    res.status(400).json({
      error: 'Erro ao atualizar perfil',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// PUT /api/users/:id - Atualização geral de usuário
export async function update(req, res) {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, password, imageUrl } = req.body;
    logInfo(`PUT /api/users/${id} - Atualizando utilizador`);

    // Primeiro, buscar o usuário na tabela next_auth.users para obter o email
    const usersFromNextAuth = await sequelize.query(
      `SELECT id, name, email, image, role FROM next_auth.users WHERE id = :userId LIMIT 1`,
      {
        replacements: { userId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!usersFromNextAuth || usersFromNextAuth.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const userFromNextAuth = usersFromNextAuth[0];
    const userEmail = email !== undefined ? email : userFromNextAuth.email;

    const supabase = getSupabaseAdmin();

    // Tentar buscar usuário no Supabase Auth pelo ID (pode ser que o ID seja o mesmo)
    let supabaseUserId = id;
    let currentUserMeta = {};
    let currentAppMeta = {};
    let supabaseUserExists = false;

    const { data: userById, error: getUserByIdError } = await supabase.auth.admin.getUserById(id);
    if (!getUserByIdError && userById?.user) {
      supabaseUserExists = true;
      supabaseUserId = userById.user.id;
      currentUserMeta = userById.user.user_metadata || {};
      currentAppMeta = userById.user.app_metadata || {};
    }

    // Preparar atualizações
    const updateData = {};

    // Atualizar email se fornecido
    if (email !== undefined) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      // Verificar se email já está em uso na tabela next_auth.users
      const existingUsers = await sequelize.query(
        `SELECT id FROM next_auth.users WHERE email = :emailValue AND id != :userIdValue LIMIT 1`,
        {
          replacements: { emailValue: email, userIdValue: id },
          type: sequelize.QueryTypes.SELECT
        }
      );

      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({
          error: 'Email já está em uso',
          message: 'Este email já está registrado por outro utilizador'
        });
      }

      // Se o usuário existe no Supabase, verificar lá também
      if (supabaseUserExists) {
        // Listar usuários e verificar se algum tem o email (não há getUserByEmail)
        const { data: usersList } = await supabase.auth.admin.listUsers();
        if (usersList?.users) {
          const existingSupabaseUser = usersList.users.find(u => u.email === email && u.id !== supabaseUserId);
          if (existingSupabaseUser) {
            return res.status(400).json({
              error: 'Email já está em uso',
              message: 'Este email já está registrado por outro utilizador no Supabase'
            });
          }
        }
      }

      updateData.email = email;
      updateData.email_confirm = true;
    }


    // Atualizar senha se fornecida
    let passwordHash = null;
    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password muito curto',
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
      }

      // Se o usuário existe no Supabase, atualizar lá também
      // O Supabase faz o hashing automaticamente
      if (supabaseUserExists) {
        updateData.password = password;
      }

      // IMPORTANTE: Gerar hash bcrypt para atualizar também na tabela next_auth.users
      // porque o login verifica a senha nessa tabela, não no Supabase Auth
      passwordHash = await bcrypt.hash(password, 10);
    }


    // Atualizar user_metadata
    const newUserMeta = { ...currentUserMeta };
    if (firstName !== undefined) newUserMeta.firstName = firstName;
    if (lastName !== undefined) newUserMeta.lastName = lastName;
    if (imageUrl !== undefined) {
      newUserMeta.avatar_url = imageUrl;
      newUserMeta.imageUrl = imageUrl;
      newUserMeta.image = imageUrl;
    }
    updateData.user_metadata = newUserMeta;

    // Atualizar app_metadata (role)
    if (role !== undefined) {
      const validRoles = ['admin', 'comercial', 'editor_stock'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: 'Role inválido',
          message: `Role deve ser um dos seguintes: ${validRoles.join(', ')}`
        });
      }

      // Verificar se não está removendo próprio role de admin
      const auth = await getAuth(req);
      const currentUserId = auth?.userId;
      if (id === currentUserId && role !== 'admin') {
        return res.status(400).json({
          error: 'Não pode alterar seu próprio role',
          message: 'Não é possível remover seu próprio role de administrador'
        });
      }

      updateData.app_metadata = {
        ...currentAppMeta,
        role: role,
      };
    }

    // Aplicar atualizações no Supabase Auth apenas se o usuário existir lá
    let updatedSupabaseUser = null;
    if (supabaseUserExists && Object.keys(updateData).length > 0) {
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(supabaseUserId, updateData);

      if (updateError) {
        logError('Erro ao atualizar no Supabase Auth (não crítico)', updateError);
        // Não falhar se houver erro no Supabase, continuar com atualização em next_auth.users
      } else {
        updatedSupabaseUser = updatedUser?.user;
      }
    }

    // Atualizar também na tabela next_auth.users para manter sincronização
    try {
      // Construir nome completo
      let nameToUpdate;
      if (firstName !== undefined || lastName !== undefined) {
        const first = firstName !== undefined ? firstName : (userFromNextAuth.name?.split(' ')[0] || '');
        const last = lastName !== undefined ? lastName : (userFromNextAuth.name?.split(' ').slice(1).join(' ') || '');
        nameToUpdate = `${first} ${last}`.trim();
      } else {
        nameToUpdate = userFromNextAuth.name || userEmail;
      }

      if (!nameToUpdate) {
        nameToUpdate = userEmail;
      }

      // Construir query dinâmica para incluir senha se fornecida
      const updateFields = [];
      const replacements = {
        nameValue: nameToUpdate,
        emailValue: email !== undefined ? email : userFromNextAuth.email,
        imageValue: imageUrl !== undefined ? imageUrl : userFromNextAuth.image,
        roleValue: role !== undefined ? role : userFromNextAuth.role,
        userIdValue: id
      };

      updateFields.push('name = :nameValue');
      updateFields.push('email = :emailValue');
      updateFields.push('image = :imageValue');
      updateFields.push('role = :roleValue');

      // Adicionar senha se foi fornecida
      if (passwordHash) {
        updateFields.push('password = :passwordHash');
        replacements.passwordHash = passwordHash;
      }

      await sequelize.query(
        `UPDATE next_auth.users SET ${updateFields.join(', ')} WHERE id = :userIdValue`,
        {
          replacements: replacements,
          type: sequelize.QueryTypes.UPDATE
        }
      );
    } catch (updateNextAuthError) {
      logError('Erro ao atualizar next_auth.users (não crítico)', updateNextAuthError);
      // Não falhar a requisição se houver erro ao atualizar next_auth.users
    }

    // Buscar usuário atualizado da tabela next_auth.users
    const updatedUsers = await sequelize.query(
      `SELECT id, name, email, image, role, "emailVerified" FROM next_auth.users WHERE id = :userId LIMIT 1`,
      {
        replacements: { userId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!updatedUsers || updatedUsers.length === 0) {
      return res.status(404).json({ error: 'Utilizador não encontrado após atualização' });
    }

    const user = transformUserFromNextAuth(updatedUsers[0]);

    logInfo('Utilizador atualizado com sucesso', { id, supabaseUserId, supabaseUserExists });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar utilizador', error);
    res.status(400).json({
      error: 'Erro ao atualizar utilizador',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// DELETE /api/users/:id - Remover utilizador
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    logInfo(`DELETE /api/users/${id} - Removendo utilizador`);

    // Obter utilizador atual
    const auth = await getAuth(req);
    const currentUserId = auth?.userId;

    // Não permitir que admin remova a si mesmo
    if (id === currentUserId) {
      return res.status(400).json({
        error: 'Não pode remover a si mesmo',
        message: 'Não é possível remover seu próprio utilizador'
      });
    }

    const supabase = getSupabaseAdmin();

    // Remover utilizador usando Admin API
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    logInfo('Utilizador removido com sucesso', { id });
    res.json({
      success: true,
      message: 'Utilizador removido com sucesso'
    });
  } catch (error) {
    logError('Erro ao remover utilizador', error);
    res.status(500).json({
      error: 'Erro ao remover utilizador',
      message: error.message
    });
  }
}
// POST /api/users/:id/avatar - Upload de avatar de usuário (admin)
export async function uploadUserAvatar(req, res) {
  try {
    const { id } = req.params;
    logInfo(`POST /api/users/${id}/avatar - Upload de avatar por admin`, {
      targetUserId: id,
      fileSize: req.file?.size
    });

    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo não fornecido',
        message: 'É necessário fornecer uma imagem'
      });
    }

    // Importar serviços necessários (lazy import para evitar ciclos se houver)
    const { uploadFile, isSupabaseConfigured } = await import('../services/supabaseStorage.js');
    const path = await import('path');

    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase não configurado',
        message: 'O serviço de armazenamento não está configurado'
      });
    }

    // Gerar nome do arquivo: avatars/{userId}/{timestamp}.{ext}
    const timestamp = Date.now();
    const ext = path.default.extname(req.file.originalname).toLowerCase();
    const fileName = `${id}/${timestamp}${ext}`;

    // Fazer upload para Supabase Storage
    const uploadResult = await uploadFile(
      req.file.buffer,
      'avatars',
      fileName,
      {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      }
    );

    logInfo('Avatar enviado com sucesso (admin)', { targetUserId: id, url: uploadResult.url });

    // Atualizar URL no perfil do usuário
    const supabase = getSupabaseAdmin();

    // Buscar metadados atuais
    const { data: currentUserData, error: getUserError } = await supabase.auth.admin.getUserById(id);
    if (getUserError || !currentUserData.user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }

    const currentUserMeta = currentUserData.user.user_metadata || {};

    // Atualizar metadados
    const newUserMeta = {
      ...currentUserMeta,
      avatar_url: uploadResult.url,
      imageUrl: uploadResult.url,
      image: uploadResult.url
    };

    await supabase.auth.admin.updateUserById(id, {
      user_metadata: newUserMeta,
    });

    // Atualizar também na tabela next_auth.users
    await sequelize.query(
      `UPDATE next_auth.users SET image = :imageValue WHERE id = :userIdValue`,
      {
        replacements: {
          imageValue: uploadResult.url,
          userIdValue: id
        }
      }
    );

    res.json({
      url: uploadResult.url,
      path: uploadResult.path
    });
  } catch (error) {
    logError('Erro ao fazer upload de avatar (admin)', error);
    res.status(500).json({
      error: 'Erro ao fazer upload de avatar',
      message: error.message || 'Erro desconhecido'
    });
  }
}
