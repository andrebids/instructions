import { createClerkClient } from '@clerk/backend';
import { getAuth } from '@clerk/express';
import { logError, logInfo } from '../utils/projectLogger.js';

/**
 * Controller de utilizadores - ATENÇÃO: Este controller ainda usa Clerk
 * TODO: Migrar para Auth.js - Este arquivo precisa ser reescrito para usar Auth.js
 * Todas as operações requerem role admin
 * 
 * Nota: Este controller ainda depende do Clerk e precisa ser migrado
 */
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

// GET /api/users - Listar todos os utilizadores
export async function getAll(req, res) {
  try {
    logInfo('GET /api/users - Listando utilizadores');
    
    const { role, search } = req.query;
    
    // Listar todos os utilizadores do Clerk
    const usersList = await clerkClient.users.getUserList({
      limit: 500, // Limite máximo
    });
    
    // Transformar dados do Clerk para formato da aplicação
    let users = usersList.data.map(user => {
      const role = user.publicMetadata?.role || null;
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Sem nome',
        email: user.emailAddresses[0]?.emailAddress || '',
        role: role,
        imageUrl: user.imageUrl,
        createdAt: new Date(user.createdAt).toISOString(),
        lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
        emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
      };
    });
    
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
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
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
    
    const user = await clerkClient.users.getUser(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilizador não encontrado' });
    }
    
    const role = user.publicMetadata?.role || null;
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Sem nome',
      email: user.emailAddresses[0]?.emailAddress || '',
      role: role,
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt).toISOString(),
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
      emailVerified: user.emailAddresses[0]?.verification?.status === 'verified',
    };
    
    res.json(userData);
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
    
    // Criar utilizador no Clerk
    const user = await clerkClient.users.createUser({
      firstName: firstName || '',
      lastName: lastName || '',
      emailAddress: [email],
      password: password,
      skipPasswordChecks: false, // Validar password
      publicMetadata: {
        role: role || 'comercial', // Role padrão: comercial
      },
    });
    
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || email,
      email: user.emailAddresses[0]?.emailAddress || email,
      role: user.publicMetadata?.role || 'comercial',
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt).toISOString(),
      lastSignInAt: null,
      emailVerified: false,
    };
    
    logInfo('Utilizador criado com sucesso', { id: user.id, email });
    res.status(201).json(userData);
  } catch (error) {
    logError('Erro ao criar utilizador', error);
    res.status(400).json({ 
      error: 'Erro ao criar utilizador',
      message: error.message || 'Erro desconhecido'
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
    
    // Criar convite no Clerk
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        role: role || 'comercial', // Role padrão: comercial
      },
    });
    
    logInfo('Convite enviado com sucesso', { email, id: invitation.id });
    res.status(201).json({
      success: true,
      message: 'Convite enviado com sucesso',
      invitationId: invitation.id,
      email: invitation.emailAddress,
    });
  } catch (error) {
    logError('Erro ao enviar convite', error);
    
    // Tratar erros específicos do Clerk
    if (error.errors && error.errors.length > 0) {
      const clerkError = error.errors[0];
      if (clerkError.message?.includes('already exists') || clerkError.message?.includes('already registered')) {
        return res.status(400).json({ 
          error: 'Este email já está registrado',
          message: 'O utilizador com este email já existe no sistema'
        });
      }
    }
    
    res.status(400).json({ 
      error: 'Erro ao enviar convite',
      message: error.message || 'Erro desconhecido'
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
    
    // Obter utilizador atual (ainda usando Clerk - precisa migrar)
    const auth = getAuth(req);
    const currentUserId = auth?.userId;
    
    // Não permitir que admin remova seu próprio role de admin
    if (id === currentUserId && role !== 'admin') {
      return res.status(400).json({ 
        error: 'Não pode alterar seu próprio role',
        message: 'Não é possível remover seu próprio role de administrador'
      });
    }
    
    // Atualizar publicMetadata do utilizador
    const user = await clerkClient.users.updateUserMetadata(id, {
      publicMetadata: {
        role: role,
      },
    });
    
    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Sem nome',
      email: user.emailAddresses[0]?.emailAddress || '',
      role: user.publicMetadata?.role || null,
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt).toISOString(),
      lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : null,
    };
    
    logInfo('Role atualizado com sucesso', { id, role });
    res.json(userData);
  } catch (error) {
    logError('Erro ao atualizar role', error);
    res.status(400).json({ 
      error: 'Erro ao atualizar role',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// DELETE /api/users/:id - Remover utilizador
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    logInfo(`DELETE /api/users/${id} - Removendo utilizador`);
    
    // Obter utilizador atual (ainda usando Clerk - precisa migrar)
    const auth = getAuth(req);
    const currentUserId = auth?.userId;
    
    // Não permitir que admin remova a si mesmo
    if (id === currentUserId) {
      return res.status(400).json({ 
        error: 'Não pode remover a si mesmo',
        message: 'Não é possível remover seu próprio utilizador'
      });
    }
    
    // Remover utilizador do Clerk
    await clerkClient.users.deleteUser(id);
    
    logInfo('Utilizador removido com sucesso', { id });
    res.json({ 
      success: true,
      message: 'Utilizador removido com sucesso'
    });
  } catch (error) {
    logError('Erro ao remover utilizador', error);
    res.status(400).json({ 
      error: 'Erro ao remover utilizador',
      message: error.message || 'Erro desconhecido'
    });
  }
}

