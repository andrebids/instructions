import { logError, logInfo } from '../utils/projectLogger.js';

/**
 * Controller de utilizadores - DESABILITADO
 * Este controller foi desabilitado porque o Clerk não está mais em uso.
 * As funcionalidades de gestão de utilizadores precisam ser reimplementadas
 * usando o sistema de autenticação atual (Auth.js).
 */

const NOT_AVAILABLE_MESSAGE = 'Funcionalidade de gestão de utilizadores não está disponível. O Clerk foi removido e esta funcionalidade precisa ser reimplementada.';

// GET /api/users - Listar todos os utilizadores
export async function getAll(req, res) {
  try {
    logInfo('GET /api/users - Funcionalidade desabilitada (Clerk removido)');
    res.status(501).json({ 
      error: 'Funcionalidade não implementada',
      message: NOT_AVAILABLE_MESSAGE
    });
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
    logInfo(`GET /api/users/${id} - Funcionalidade desabilitada (Clerk removido)`);
    res.status(501).json({ 
      error: 'Funcionalidade não implementada',
      message: NOT_AVAILABLE_MESSAGE
    });
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
    logInfo('POST /api/users - Funcionalidade desabilitada (Clerk removido)');
    res.status(501).json({ 
      error: 'Funcionalidade não implementada',
      message: NOT_AVAILABLE_MESSAGE
    });
  } catch (error) {
    logError('Erro ao criar utilizador', error);
    res.status(500).json({ 
      error: 'Erro ao criar utilizador',
      message: error.message 
    });
  }
}

// POST /api/users/invite - Enviar convite
export async function sendInvitation(req, res) {
  try {
    logInfo('POST /api/users/invite - Funcionalidade desabilitada (Clerk removido)');
    res.status(501).json({ 
      error: 'Funcionalidade não implementada',
      message: NOT_AVAILABLE_MESSAGE
    });
  } catch (error) {
    logError('Erro ao enviar convite', error);
    res.status(500).json({ 
      error: 'Erro ao enviar convite',
      message: error.message 
    });
  }
}

// PUT /api/users/:id/role - Atualizar role
export async function updateRole(req, res) {
  try {
    const { id } = req.params;
    logInfo(`PUT /api/users/${id}/role - Funcionalidade desabilitada (Clerk removido)`);
    res.status(501).json({ 
      error: 'Funcionalidade não implementada',
      message: NOT_AVAILABLE_MESSAGE
    });
  } catch (error) {
    logError('Erro ao atualizar role', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar role',
      message: error.message 
    });
  }
}

// DELETE /api/users/:id - Remover utilizador
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    logInfo(`DELETE /api/users/${id} - Funcionalidade desabilitada (Clerk removido)`);
    res.status(501).json({ 
      error: 'Funcionalidade não implementada',
      message: NOT_AVAILABLE_MESSAGE
    });
  } catch (error) {
    logError('Erro ao remover utilizador', error);
    res.status(500).json({ 
      error: 'Erro ao remover utilizador',
      message: error.message 
    });
  }
}
