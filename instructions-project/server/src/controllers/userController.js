import { createClient } from '@supabase/supabase-js';
import { getAuth } from '../middleware/auth.js';
import { logError, logInfo } from '../utils/projectLogger.js';
import sequelize from '../config/database.js';

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
    createdAt: null, // next_auth.users não tem created_at
    lastSignInAt: null, // next_auth.users não tem last_sign_in_at
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
      `SELECT id, name, email, image, role, "emailVerified" FROM next_auth.users`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    logInfo(`Total de usuários encontrados em next_auth.users: ${usersFromNextAuth.length}`);
    
    // Transformar dados para formato da aplicação
    let users = usersFromNextAuth.map(transformUserFromNextAuth);
    
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
      `SELECT id, name, email, image, role, "emailVerified" FROM next_auth.users WHERE id = :userId LIMIT 1`,
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
    
    const supabase = getSupabaseAdmin();
    
    // Verificar se usuário já existe
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    if (existingUser?.user) {
      return res.status(400).json({ 
        error: 'Este email já está registrado',
        message: 'O utilizador com este email já existe no sistema'
      });
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
    
    // Validar força da senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password muito curto',
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
    
    const supabase = getSupabaseAdmin();
    
    // Atualizar senha usando Admin API
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(id, {
      password: password,
    });
    
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    const user = transformUserFromSupabase(updatedUser.user);
    
    logInfo('Senha atualizada com sucesso', { id });
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
    
    const supabase = getSupabaseAdmin();
    
    // Verificar se email já está em uso por outro usuário
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    if (existingUser?.user && existingUser.user.id !== id) {
      return res.status(400).json({ 
        error: 'Email já está em uso',
        message: 'Este email já está registrado por outro utilizador'
      });
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
    
    const supabase = getSupabaseAdmin();
    
    // Buscar usuário atual
    const { data: currentUserData, error: getUserError } = await supabase.auth.admin.getUserById(id);
    if (getUserError || !currentUserData.user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    const currentUserMeta = currentUserData.user.user_metadata || {};
    const currentAppMeta = currentUserData.user.app_metadata || {};
    
    // Preparar atualizações
    const updateData = {};
    
    // Atualizar email se fornecido
    if (email !== undefined) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Email inválido' });
      }
      
      // Verificar se email já está em uso
      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
      if (existingUser?.user && existingUser.user.id !== id) {
        return res.status(400).json({ 
          error: 'Email já está em uso',
          message: 'Este email já está registrado por outro utilizador'
        });
      }
      
      updateData.email = email;
      updateData.email_confirm = true;
    }
    
    // Atualizar senha se fornecida
    if (password !== undefined) {
      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password muito curto',
          message: 'A senha deve ter pelo menos 6 caracteres'
        });
      }
      updateData.password = password;
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
    
    // Aplicar atualizações
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(id, updateData);
    
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    const user = transformUserFromSupabase(updatedUser.user);
    
    logInfo('Utilizador atualizado com sucesso', { id });
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
