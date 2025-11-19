import { getAuth } from '../middleware/auth.js';
import { logError, logInfo } from '../utils/projectLogger.js';
import * as userService from '../services/userService.js';

/**
 * Controller de utilizadores
 * Orquestra requisições HTTP e delega lógica de negócio para userService
 * Todas as operações requerem role admin
 */

// GET /api/users - Listar todos os utilizadores
export async function getAll(req, res) {
  try {
    logInfo('GET /api/users - Listando utilizadores', {
      query: req.query,
      role: req.query.role,
      search: req.query.search
    });

    const { role, search } = req.query;
    const filters = {};
    if (role) filters.role = role;
    if (search) filters.search = search;

    const users = await userService.getAllUsers(filters);
    res.json(users);
  } catch (error) {
    logError('Erro ao listar utilizadores', {
      error: error.message,
      stack: error.stack,
      query: req.query
    });
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

    const user = await userService.getUserById(id);
    res.json(user);
  } catch (error) {
    logError('Erro ao buscar utilizador', error);
    
    if (error.message === 'Utilizador não encontrado') {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: 'Erro ao buscar utilizador',
      message: error.message
    });
  }
}

// POST /api/users - Criar novo utilizador
export async function create(req, res) {
  try {
    logInfo('POST /api/users - Controller create chamado', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      hasBody: !!req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    const { firstName, lastName, email, password, role } = req.body;

    logInfo('POST /api/users - Iniciando criação de utilizador', {
      email: email || 'NÃO FORNECIDO',
      firstName: firstName || 'NÃO FORNECIDO',
      lastName: lastName || 'NÃO FORNECIDO',
      role: role || 'comercial (padrão)',
      hasPassword: !!password,
      passwordLength: password ? password.length : 0,
    });

    const user = await userService.createUser({
      firstName,
      lastName,
      email,
      password,
      role
    });

    logInfo('POST /api/users - Utilizador criado com sucesso', {
      id: user.id,
      email: user.email,
    });

    res.status(201).json(user);
  } catch (error) {
    logError('POST /api/users - Erro ao criar utilizador', {
      error: error.message,
      stack: error.stack,
      email: req.body?.email,
    });

    // Tratar erros específicos
    if (error.message?.includes('já está registrado') ||
        error.message?.includes('already registered') ||
        error.message?.includes('already exists')) {
      return res.status(400).json({
        error: 'Este email já está registrado',
        message: 'O utilizador com este email já existe no sistema'
      });
    }

    if (error.message?.includes('obrigatório') || error.message?.includes('inválido')) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: error.message
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

    const result = await userService.sendUserInvitation(email, role);

    res.status(201).json(result);
  } catch (error) {
    logError('Erro ao enviar convite', error);

    // Tratar erros específicos
    if (error.message?.includes('já está registrado') ||
        error.message?.includes('already registered') ||
        error.message?.includes('already exists')) {
      return res.status(400).json({
        error: 'Este email já está registrado',
        message: 'O utilizador com este email já existe no sistema'
      });
    }

    if (error.message?.includes('obrigatório') || error.message?.includes('inválido')) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: error.message
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

    // Obter utilizador atual
    const auth = await getAuth(req);
    const currentUserId = auth?.userId;

    const user = await userService.updateUserRole(id, role, currentUserId);

    logInfo('Role atualizado com sucesso', { id, role });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar role', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes('inválido') || error.message?.includes('próprio')) {
      return res.status(400).json({
        error: 'Operação inválida',
        message: error.message
      });
    }

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

    const user = await userService.updateUserPassword(id, password);

    logInfo('Senha atualizada com sucesso', { id });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar senha', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes('não cumpre') || error.message?.includes('obrigatório')) {
      return res.status(400).json({
        error: 'Password não cumpre os requisitos de segurança',
        message: error.message,
        details: error.details
      });
    }

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

    const user = await userService.updateUserEmail(id, email);

    logInfo('Email atualizado com sucesso', { id, email });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar email', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes('já está em uso') || error.message?.includes('inválido')) {
      return res.status(400).json({
        error: 'Email inválido ou já em uso',
        message: error.message
      });
    }

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

    const user = await userService.updateUserProfile(id, {
      firstName,
      lastName,
      imageUrl
    });

    logInfo('Perfil atualizado com sucesso', { id });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar perfil', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

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

    // Obter utilizador atual
    const auth = await getAuth(req);
    const currentUserId = auth?.userId;

    const user = await userService.updateUser(id, {
      firstName,
      lastName,
      email,
      role,
      password,
      imageUrl
    }, currentUserId);

    logInfo('Utilizador atualizado com sucesso', { id });
    res.json(user);
  } catch (error) {
    logError('Erro ao atualizar utilizador', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes('já está em uso') ||
        error.message?.includes('inválido') ||
        error.message?.includes('próprio')) {
      return res.status(400).json({
        error: 'Dados inválidos',
        message: error.message
      });
    }

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

    await userService.deleteUser(id, currentUserId);

    logInfo('Utilizador removido com sucesso', { id });
    res.json({
      success: true,
      message: 'Utilizador removido com sucesso'
    });
  } catch (error) {
    logError('Erro ao remover utilizador', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message?.includes('próprio')) {
      return res.status(400).json({
        error: 'Operação inválida',
        message: error.message
      });
    }

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

    const result = await userService.uploadUserAvatar(id, req.file);

    res.json(result);
  } catch (error) {
    logError('Erro ao fazer upload de avatar (admin)', error);

    if (error.message?.includes('não fornecido') || error.message?.includes('não configurado')) {
      return res.status(400).json({
        error: error.message,
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Erro ao fazer upload de avatar',
      message: error.message || 'Erro desconhecido'
    });
  }
}
