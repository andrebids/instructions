import sequelize from '../config/database.js';
import { logInfo, logError } from '../utils/projectLogger.js';

/**
 * Repository para acesso à tabela next_auth.users
 * Encapsula todas as operações de banco de dados relacionadas a usuários
 */

/**
 * Busca todos os usuários da tabela next_auth.users
 * @returns {Promise<Array>} Lista de usuários
 */
export async function findAll() {
  try {
    logInfo('Repository: Buscando todos os usuários da tabela next_auth.users');
    
    const users = await sequelize.query(
      `SELECT id, name, email, image, role, "emailVerified", created_at, last_login FROM next_auth.users`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    logInfo(`Repository: Total de usuários encontrados: ${users.length}`);
    return users;
  } catch (error) {
    logError('Repository: Erro ao buscar todos os usuários', error);
    throw error;
  }
}

/**
 * Busca usuário por ID
 * @param {string} id - ID do usuário
 * @returns {Promise<Object|null>} Usuário encontrado ou null
 */
export async function findById(id) {
  try {
    logInfo('Repository: Buscando usuário por ID', { userId: id });
    
    const users = await sequelize.query(
      `SELECT id, name, email, image, role, "emailVerified", created_at, last_login FROM next_auth.users WHERE id = :userId LIMIT 1`,
      {
        replacements: { userId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!users || users.length === 0) {
      logInfo('Repository: Usuário não encontrado', { userId: id });
      return null;
    }

    logInfo('Repository: Usuário encontrado', { userId: id });
    return users[0];
  } catch (error) {
    logError('Repository: Erro ao buscar usuário por ID', { error: error.message, userId: id });
    throw error;
  }
}

/**
 * Busca usuário por email
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|null>} Usuário encontrado ou null
 */
export async function findByEmail(email) {
  try {
    logInfo('Repository: Buscando usuário por email', { email });
    
    const users = await sequelize.query(
      `SELECT id, email FROM next_auth.users WHERE email = :emailValue LIMIT 1`,
      {
        replacements: { emailValue: email },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!users || users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    logError('Repository: Erro ao buscar usuário por email', { error: error.message, email });
    throw error;
  }
}

/**
 * Verifica se um email já existe na tabela
 * @param {string} email - Email a verificar
 * @param {string} [excludeId] - ID a excluir da verificação (útil para updates)
 * @returns {Promise<boolean>} True se email existe, false caso contrário
 */
export async function checkEmailExists(email, excludeId = null) {
  try {
    logInfo('Repository: Verificando se email existe', { email, excludeId });
    
    let query;
    let replacements;

    if (excludeId) {
      query = `SELECT id FROM next_auth.users WHERE email = :emailValue AND id != :userIdValue LIMIT 1`;
      replacements = { emailValue: email, userIdValue: excludeId };
    } else {
      query = `SELECT id FROM next_auth.users WHERE email = :emailValue LIMIT 1`;
      replacements = { emailValue: email };
    }

    const users = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const exists = users && users.length > 0;
    logInfo('Repository: Email existe?', { email, exists });
    return exists;
  } catch (error) {
    logError('Repository: Erro ao verificar email', { error: error.message, email });
    throw error;
  }
}

/**
 * Cria um novo usuário na tabela next_auth.users
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.id - ID do usuário
 * @param {string} userData.name - Nome completo
 * @param {string} userData.email - Email
 * @param {string} userData.password - Hash da senha (bcrypt)
 * @param {string} userData.role - Role do usuário
 * @param {Date} userData.emailVerified - Data de verificação do email
 * @returns {Promise<Object>} Usuário criado
 */
export async function create(userData) {
  try {
    logInfo('Repository: Criando usuário na tabela next_auth.users', {
      userId: userData.id,
      email: userData.email,
    });

    const insertResult = await sequelize.query(
      `INSERT INTO next_auth.users (id, name, email, password, role, "emailVerified", created_at, updated_at)
       VALUES (:id, :name, :email, :password, :role, :emailVerified, NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         "emailVerified" = EXCLUDED."emailVerified",
         updated_at = NOW()`,
      {
        replacements: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: userData.role,
          emailVerified: userData.emailVerified,
        },
        type: sequelize.QueryTypes.INSERT
      }
    );

    logInfo('Repository: INSERT executado na tabela next_auth.users', {
      userId: userData.id,
      email: userData.email,
    });

    // Verificar se o usuário foi realmente inserido
    const verifyUsers = await sequelize.query(
      `SELECT id, name, email, role FROM next_auth.users WHERE id = :userId LIMIT 1`,
      {
        replacements: { userId: userData.id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (verifyUsers && verifyUsers.length > 0) {
      logInfo('Repository: Usuário criado com sucesso (verificado)', {
        userId: userData.id,
        email: userData.email,
      });
      return verifyUsers[0];
    } else {
      logError('Repository: Usuário não encontrado após INSERT', {
        userId: userData.id,
        email: userData.email,
      });
      throw new Error('Falha ao criar usuário na tabela');
    }
  } catch (error) {
    logError('Repository: Erro ao criar usuário', {
      error: error.message,
      stack: error.stack,
      userId: userData?.id,
      email: userData?.email,
    });
    throw error;
  }
}

/**
 * Atualiza um usuário na tabela next_auth.users
 * @param {string} id - ID do usuário
 * @param {Object} updates - Campos a atualizar
 * @param {string} [updates.name] - Nome completo
 * @param {string} [updates.email] - Email
 * @param {string} [updates.image] - URL da imagem
 * @param {string} [updates.role] - Role
 * @param {string} [updates.password] - Hash da senha (bcrypt)
 * @returns {Promise<Object>} Usuário atualizado
 */
export async function update(id, updates) {
  try {
    logInfo('Repository: Atualizando usuário na tabela next_auth.users', {
      userId: id,
      updates: Object.keys(updates),
    });

    // Construir query dinâmica
    const updateFields = [];
    const replacements = {
      userIdValue: id
    };

    if (updates.name !== undefined) {
      updateFields.push('name = :nameValue');
      replacements.nameValue = updates.name;
    }

    if (updates.email !== undefined) {
      updateFields.push('email = :emailValue');
      replacements.emailValue = updates.email;
    }

    if (updates.image !== undefined) {
      updateFields.push('image = :imageValue');
      replacements.imageValue = updates.image;
    }

    if (updates.role !== undefined) {
      updateFields.push('role = :roleValue');
      replacements.roleValue = updates.role;
    }

    if (updates.password !== undefined) {
      updateFields.push('password = :passwordHash');
      replacements.passwordHash = updates.password;
    }

    // Sempre atualizar updated_at
    updateFields.push('updated_at = NOW()');

    if (updateFields.length === 1) {
      // Apenas updated_at, não há nada para atualizar
      logInfo('Repository: Nenhum campo para atualizar além de updated_at');
    } else {
      const updateResult = await sequelize.query(
        `UPDATE next_auth.users SET ${updateFields.join(', ')} WHERE id = :userIdValue`,
        {
          replacements: replacements,
          type: sequelize.QueryTypes.UPDATE
        }
      );

      logInfo('Repository: UPDATE executado na tabela next_auth.users', {
        userId: id,
        updateResult: updateResult ? 'sucesso' : 'sem resultado'
      });
    }

    // Buscar usuário atualizado
    const updatedUsers = await sequelize.query(
      `SELECT id, name, email, image, role, "emailVerified" FROM next_auth.users WHERE id = :userId LIMIT 1`,
      {
        replacements: { userId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );

    if (!updatedUsers || updatedUsers.length === 0) {
      logError('Repository: Usuário não encontrado após UPDATE', { userId: id });
      throw new Error('Usuário não encontrado após atualização');
    }

    logInfo('Repository: Usuário atualizado com sucesso', {
      userId: id,
      name: updatedUsers[0].name,
      email: updatedUsers[0].email,
    });

    return updatedUsers[0];
  } catch (error) {
    logError('Repository: Erro ao atualizar usuário', {
      error: error.message,
      stack: error.stack,
      userId: id,
    });
    throw error;
  }
}

/**
 * Atualiza apenas a senha do usuário
 * @param {string} id - ID do usuário
 * @param {string} passwordHash - Hash bcrypt da senha
 * @returns {Promise<void>}
 */
export async function updatePassword(id, passwordHash) {
  try {
    logInfo('Repository: Atualizando senha do usuário', { userId: id });

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

    logInfo('Repository: Senha atualizada com sucesso', { userId: id });
  } catch (error) {
    logError('Repository: Erro ao atualizar senha', {
      error: error.message,
      userId: id,
    });
    throw error;
  }
}

/**
 * Remove um usuário da tabela next_auth.users
 * @param {string} id - ID do usuário
 * @returns {Promise<void>}
 */
export async function deleteUser(id) {
  try {
    logInfo('Repository: Removendo usuário da tabela next_auth.users', { userId: id });

    await sequelize.query(
      `DELETE FROM next_auth.users WHERE id = :userId`,
      {
        replacements: { userId: id },
        type: sequelize.QueryTypes.DELETE
      }
    );

    logInfo('Repository: Usuário removido com sucesso', { userId: id });
  } catch (error) {
    logError('Repository: Erro ao remover usuário', {
      error: error.message,
      userId: id,
    });
    throw error;
  }
}

