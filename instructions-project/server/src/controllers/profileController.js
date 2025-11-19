import sequelize from '../config/database.js';
import { getAuth } from '../middleware/auth.js';
import { logError, logInfo } from '../utils/projectLogger.js';
import { uploadFile, isSupabaseConfigured } from '../services/supabaseStorage.js';
import { validatePassword } from '../validators/userValidator.js';
import { updateUserPassword } from '../services/userService.js';
import multer from 'multer';
import path from 'path';

// Configurar multer para upload de imagens
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    
    if (allowedTypes.test(ext) && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens (jpeg, jpg, png, webp) são permitidas'), false);
    }
  },
});

// Middleware para upload de avatar
export const uploadAvatar = upload.single('avatar');

// PUT /api/users/profile - Atualizar perfil do usuário
export async function updateProfile(req, res) {
  try {
    const auth = await getAuth(req);
    
    if (!auth || !auth.userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para atualizar o perfil'
      });
    }

    const { name, image } = req.body;
    const userId = auth.userId;

    logInfo(`PUT /api/users/profile - Atualizando perfil`, { 
      userId, 
      userIdType: typeof userId,
      name: name ? 'fornecido' : 'não fornecido', 
      image: image ? 'fornecido' : 'não fornecido',
      body: req.body
    });

    // Validar userId
    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuário inválido',
        message: 'Não foi possível identificar o usuário'
      });
    }

    // Verificar se o usuário existe antes de atualizar
    console.log('🔍 [Profile Controller] Verificando se usuário existe no banco...', { userId });
    try {
      const existingUsers = await sequelize.query(
        `SELECT id FROM next_auth.users WHERE id = :userIdParam LIMIT 1`,
        {
          replacements: { userIdParam: userId },
          type: sequelize.QueryTypes.SELECT
        }
      );

      console.log('🔍 [Profile Controller] Resultado da verificação:', { 
        userId, 
        found: existingUsers && existingUsers.length > 0,
        count: existingUsers ? existingUsers.length : 0
      });

      if (!existingUsers || existingUsers.length === 0) {
        console.error('❌ [Profile Controller] Usuário não encontrado no banco', { userId });
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Não foi possível encontrar o usuário no banco de dados'
        });
      }

      console.log('✅ [Profile Controller] Usuário encontrado no banco', { 
        userId, 
        existingUser: existingUsers[0] 
      });
    } catch (checkError) {
      console.error('❌ [Profile Controller] Erro ao verificar usuário', checkError);
      return res.status(500).json({
        error: 'Erro ao verificar usuário',
        message: checkError.message || 'Erro desconhecido'
      });
    }

    // Validar nome se fornecido
    if (name !== undefined) {
      if (typeof name !== 'string') {
        return res.status(400).json({
          error: 'Nome inválido',
          message: 'O nome deve ser uma string'
        });
      }
      
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        return res.status(400).json({
          error: 'Nome inválido',
          message: 'O nome deve ter pelo menos 2 caracteres'
        });
      }
      
      if (trimmedName.length > 100) {
        return res.status(400).json({
          error: 'Nome inválido',
          message: 'O nome deve ter no máximo 100 caracteres'
        });
      }
    }

    // Preparar dados para atualização
    // Executar updates separados para cada campo (mais simples e confiável)
    const updates = {};
    if (name !== undefined) {
      updates.name = name.trim();
    }
    if (image !== undefined) {
      updates.image = image;
    }
    
    // Se não há nada para atualizar
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'Nenhum dado para atualizar',
        message: 'Forneça pelo menos um campo para atualizar (name ou image)'
      });
    }
    
    // Executar updates separados para cada campo
    console.log('🔄 [Profile Controller] Iniciando atualização de campos...', { 
      userId, 
      fieldsToUpdate: Object.keys(updates),
      updates: Object.keys(updates).reduce((acc, key) => {
        acc[key] = key === 'name' ? updates[key].substring(0, 50) : (updates[key] ? 'fornecido' : 'não fornecido');
        return acc;
      }, {})
    });
    
    try {
      if (updates.name !== undefined) {
        console.log('📝 [Profile Controller] Executando UPDATE para nome...', { 
          userId, 
          name: updates.name.substring(0, 50) 
        });
        const nameResult = await sequelize.query(
          `UPDATE next_auth.users SET name = :nameValue WHERE id = :userIdValue`,
          {
            replacements: {
              nameValue: updates.name,
              userIdValue: userId
            }
          }
        );
        console.log('✅ [Profile Controller] UPDATE nome executado', { 
          userId, 
          rowCount: nameResult[1]?.rowCount || 'N/A',
          success: nameResult[1]?.rowCount > 0
        });
      }
      
      if (updates.image !== undefined) {
        console.log('🖼️  [Profile Controller] Executando UPDATE para imagem...', { 
          userId, 
          image: updates.image ? 'fornecido' : 'não fornecido' 
        });
        const imageResult = await sequelize.query(
          `UPDATE next_auth.users SET image = :imageValue WHERE id = :userIdValue`,
          {
            replacements: {
              imageValue: updates.image,
              userIdValue: userId
            }
          }
        );
        console.log('✅ [Profile Controller] UPDATE imagem executado', { 
          userId, 
          rowCount: imageResult[1]?.rowCount || 'N/A',
          success: imageResult[1]?.rowCount > 0
        });
      }

      console.log('✅ [Profile Controller] Todos os updates executados com sucesso', { 
        userId, 
        updatedFields: Object.keys(updates) 
      });
    } catch (queryError) {
      console.error('❌ [Profile Controller] Erro na query UPDATE', {
        message: queryError.message,
        sql: queryError.sql,
        parameters: queryError.parameters,
        original: queryError.original,
        stack: queryError.stack
      });
      throw queryError;
    }

    // Buscar usuário atualizado
    console.log('🔍 [Profile Controller] Buscando usuário atualizado...', { userId });
    const users = await sequelize.query(
      `SELECT id, name, email, image, role FROM next_auth.users WHERE id = :userIdParam LIMIT 1`,
      {
        replacements: { userIdParam: userId },
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log('🔍 [Profile Controller] Resultado da busca:', { 
      userId, 
      found: users && users.length > 0,
      count: users ? users.length : 0,
      user: users && users.length > 0 ? {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        hasImage: !!users[0].image,
        role: users[0].role
      } : null
    });

    if (!users || users.length === 0) {
      console.error('❌ [Profile Controller] Usuário não encontrado após update', { userId });
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'Não foi possível encontrar o usuário para atualizar'
      });
    }

    const updatedUser = users[0];

    console.log('✅ [Profile Controller] Perfil atualizado com sucesso!', { 
      userId, 
      updatedFields: Object.keys(updates),
      finalUser: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasImage: !!updatedUser.image,
        role: updatedUser.role
      }
    });

    console.log('📤 [Profile Controller] Enviando resposta ao cliente...', {
      userId,
      responseData: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image ? 'presente' : 'null',
        role: updatedUser.role
      }
    });

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      role: updatedUser.role
    });
  } catch (error) {
    console.error('❌ [Profile Controller] ========== ERRO CAPTURADO ==========');
    console.error('❌ [Profile Controller] Nome do erro:', error.name);
    console.error('❌ [Profile Controller] Mensagem:', error.message);
    console.error('❌ [Profile Controller] Stack:', error.stack);
    console.error('❌ [Profile Controller] Detalhes completos:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...(error.sql && { sql: error.sql }),
      ...(error.parameters && { parameters: error.parameters }),
      ...(error.original && { original: error.original })
    });
    console.error('❌ [Profile Controller] ====================================');
    
    res.status(500).json({
      error: 'Erro ao atualizar perfil',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// POST /api/users/profile/avatar - Upload de imagem de perfil
export async function uploadAvatarImage(req, res) {
  try {
    const auth = await getAuth(req);
    
    if (!auth || !auth.userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para fazer upload de imagem'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'Arquivo não fornecido',
        message: 'É necessário fornecer uma imagem'
      });
    }

    const userId = auth.userId;
    logInfo(`POST /api/users/profile/avatar - Upload de avatar`, { userId, fileSize: req.file.size });

    // Verificar se Supabase está configurado
    if (!isSupabaseConfigured()) {
      return res.status(500).json({
        error: 'Supabase não configurado',
        message: 'O serviço de armazenamento não está configurado'
      });
    }

    // Nota: A criação do bucket 'avatars' deve ser feita manualmente ou via migration
    // Por enquanto, assumimos que o bucket existe

    // Gerar nome do arquivo: avatars/{userId}/{timestamp}.{ext}
    const timestamp = Date.now();
    const ext = path.extname(req.file.originalname).toLowerCase();
    const fileName = `${userId}/${timestamp}${ext}`;
    const filePath = `avatars/${fileName}`;

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

    logInfo('Avatar enviado com sucesso', { userId, url: uploadResult.url });

    res.json({
      url: uploadResult.url,
      path: uploadResult.path
    });
  } catch (error) {
    logError('Erro ao fazer upload de avatar', error);
    res.status(500).json({
      error: 'Erro ao fazer upload de avatar',
      message: error.message || 'Erro desconhecido'
    });
  }
}

// PUT /api/users/profile/password - Atualizar senha do próprio perfil
export async function updatePassword(req, res) {
  try {
    const auth = await getAuth(req);
    
    if (!auth || !auth.userId) {
      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para atualizar a senha'
      });
    }

    const { password } = req.body;
    const userId = auth.userId;

    logInfo(`PUT /api/users/profile/password - Atualizando senha do perfil`, { 
      userId,
      passwordProvided: !!password
    });

    // Validar userId
    if (!userId) {
      return res.status(400).json({
        error: 'ID de usuário inválido',
        message: 'Não foi possível identificar o usuário'
      });
    }

    // Validar senha
    if (!password) {
      return res.status(400).json({
        error: 'Senha não fornecida',
        message: 'É necessário fornecer uma nova senha'
      });
    }

    // Validar senha usando o mesmo validador do EditUserModal
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Password não cumpre os requisitos de segurança',
        message: passwordValidation.errors.join('. '),
        details: passwordValidation.errors
      });
    }

    // Usar o serviço de atualização de senha (mesma lógica do admin)
    const updatedUser = await updateUserPassword(userId, password);

    logInfo('Senha do perfil atualizada com sucesso', { userId });

    res.json({
      success: true,
      message: 'Senha atualizada com sucesso',
      user: updatedUser
    });
  } catch (error) {
    logError('Erro ao atualizar senha do perfil', error);

    if (error.message?.includes('não encontrado')) {
      return res.status(404).json({ 
        error: error.message,
        message: 'Usuário não encontrado'
      });
    }

    if (error.message?.includes('não cumpre') || error.message?.includes('obrigatório')) {
      return res.status(400).json({
        error: 'Password não cumpre os requisitos de segurança',
        message: error.message,
        details: error.details
      });
    }

    res.status(500).json({
      error: 'Erro ao atualizar senha',
      message: error.message || 'Erro desconhecido'
    });
  }
}

