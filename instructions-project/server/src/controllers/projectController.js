import { Project, ProjectElement, Decoration } from '../models/index.js';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import fs from 'fs';
import path from 'path';

// GET /api/projects - Listar todos os projetos
export async function getAll(req, res) {
  try {
    console.log('📋 [PROJECTS API] GET /api/projects - Iniciando busca');
    
    // Verificar se a tabela existe primeiro
    try {
      var tableExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects')",
        { type: QueryTypes.SELECT }
      );
      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        console.error('❌ [PROJECTS API] Tabela "projects" não existe!');
        return res.status(500).json({ 
          error: 'Tabela projects não existe. Execute: npm run setup',
          details: 'A tabela de projetos não foi criada. Execute o setup da base de dados.'
        });
      }
    } catch (tableCheckError) {
      console.error('❌ [PROJECTS API] Erro ao verificar tabela:', tableCheckError.message);
    }
    
    const { status, projectType, favorite, includeElements } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (favorite) where.isFavorite = favorite === 'true';
    
    // Só carregar elementos se explicitamente solicitado (para melhor performance)
    const includeOptions = includeElements === 'true' ? [
      {
        model: ProjectElement,
        as: 'elements',
        required: false,
        include: [
          {
            model: Decoration,
            as: 'decoration',
            required: false,
          },
        ],
      },
    ] : [];
    
    const projects = await Project.findAll({
      where,
      include: includeOptions,
      order: [['createdAt', 'DESC']],
    });
    
    // Garantir que cartoucheByImage sempre tem valor padrão para projetos antigos
    const projectsWithDefaults = projects.map(project => {
      if (!project.cartoucheByImage) {
        project.cartoucheByImage = {};
      }
      return project;
    });
    
    console.log('📋 [PROJECTS API] Projetos encontrados:', projectsWithDefaults.length);
    res.json(projectsWithDefaults);
  } catch (error) {
    console.error('❌ [PROJECTS API] Erro ao buscar projetos:', error);
    console.error('❌ [PROJECTS API] Nome do erro:', error.name);
    console.error('❌ [PROJECTS API] Mensagem:', error.message);
    console.error('❌ [PROJECTS API] Stack:', error.stack);
    
    // Mensagem mais detalhada para o cliente
    var errorMessage = error.message;
    if (error.message && error.message.indexOf('does not exist') !== -1) {
      errorMessage = 'Tabela não existe. Execute: npm run setup';
    } else if (error.message && error.message.indexOf('relation') !== -1) {
      errorMessage = 'Tabela não encontrada. Execute o setup da base de dados.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      hint: 'Verifique se executou: npm run setup'
    });
  }
}

// GET /api/projects/:id - Buscar projeto por ID
export async function getById(req, res) {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: ProjectElement,
          as: 'elements',
          include: [
            {
              model: Decoration,
              as: 'decoration',
            },
          ],
        },
      ],
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Garantir que cartoucheByImage sempre tem valor padrão para projetos antigos
    if (!project.cartoucheByImage) {
      project.cartoucheByImage = {};
    }
    
    res.json(project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/projects - Criar novo projeto
export async function create(req, res) {
  try {
    console.log('💾 [SERVER] ===== CRIANDO NOVO PROJETO =====');
    console.log('💾 [SERVER] Dados recebidos:', {
      name: req.body.name,
      clientName: req.body.clientName,
      projectType: req.body.projectType,
      location: req.body.location,
      description: req.body.description ? `[${req.body.description.length} caracteres]` : '[vazio]',
      hasSnapZones: !!(req.body.snapZonesByImage && Object.keys(req.body.snapZonesByImage).length > 0),
    });
    
    // Log das zonas se existirem
    if (req.body.snapZonesByImage && Object.keys(req.body.snapZonesByImage).length > 0) {
      var zonasResumo = {};
      for (var imageId in req.body.snapZonesByImage) {
        var zones = req.body.snapZonesByImage[imageId];
        zonasResumo[imageId] = {
          day: zones?.day?.length || 0,
          night: zones?.night?.length || 0,
          total: (zones?.day?.length || 0) + (zones?.night?.length || 0)
        };
      }
      console.log('💾 [SERVER] Projeto criado COM zonas:', JSON.stringify(zonasResumo, null, 2));
    } else {
      console.log('💾 [SERVER] Projeto criado SEM zonas');
    }
    
    console.log('💾 [SERVER] Salvando projeto na base de dados...');
    
    // Garantir que cartoucheByImage existe e tem valor padrão se não fornecido
    const projectData = {
      ...req.body,
      cartoucheByImage: req.body.cartoucheByImage || {}
    };
    
    const project = await Project.create(projectData);
    
    // Verificar o que foi realmente guardado
    if (project.snapZonesByImage) {
      var zonasGuardadas = {};
      for (var imgId in project.snapZonesByImage) {
        var z = project.snapZonesByImage[imgId];
        zonasGuardadas[imgId] = {
          day: z?.day?.length || 0,
          night: z?.night?.length || 0,
          total: (z?.day?.length || 0) + (z?.night?.length || 0)
        };
      }
      console.log('✅ [SERVER] Zonas guardadas na BD após criação:', JSON.stringify(zonasGuardadas, null, 2));
    }
    
    console.log('✅ [SERVER] Projeto criado com ID:', project.id);
    console.log('✅ [SERVER] Description guardada na BD:', project.description ? `[${project.description.length} caracteres]` : '[vazio]');
    console.log('✅ [SERVER] ===== PROJETO CRIADO COM SUCESSO =====');
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ [SERVER] ===== ERRO AO CRIAR PROJETO =====');
    console.error('❌ [SERVER] Erro:', error.message);
    console.error('❌ [SERVER] Stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
}

// Constantes de validação
const MAX_DESCRIPTION_SIZE = 500000; // 500KB (~500.000 caracteres)
const isDevelopment = process.env.NODE_ENV !== 'production';

// Função auxiliar para validar description
function validateDescription(description) {
  if (description === null || description === undefined) {
    return { valid: true }; // null/undefined é permitido (limpar campo)
  }
  
  if (typeof description !== 'string') {
    return { valid: false, error: 'Description deve ser uma string' };
  }
  
  // Validar tamanho máximo
  if (description.length > MAX_DESCRIPTION_SIZE) {
    return { 
      valid: false, 
      error: `Description muito grande (${description.length} caracteres). Máximo permitido: ${MAX_DESCRIPTION_SIZE.toLocaleString()} caracteres.` 
    };
  }
  
  // Validar estrutura HTML básica (prevenir HTML malformado)
  if (description.trim() && description.includes('<')) {
    const openTags = (description.match(/<[^/][^>]*>/g) || []).length;
    const closeTags = (description.match(/<\/[^>]+>/g) || []).length;
    const selfClosingTags = (description.match(/<[^>]+\/>/g) || []).length;
    
    // Permitir diferença razoável (algumas tags podem ser self-closing)
    if (Math.abs(openTags - closeTags - selfClosingTags) > 10) {
      return { valid: false, error: 'HTML malformado detectado na description' };
    }
  }
  
  return { valid: true };
}

// PUT /api/projects/:id - Atualizar projeto
export async function update(req, res) {
  try {
    if (isDevelopment) {
      console.log('💾 [SERVER] ===== ATUALIZANDO PROJETO =====');
      console.log('💾 [SERVER] Project ID:', req.params.id);
      console.log('💾 [SERVER] Campos a atualizar:', Object.keys(req.body));
    }
    
    // Validar description se estiver presente
    if (req.body.description !== undefined) {
      const validation = validateDescription(req.body.description);
      if (!validation.valid) {
        console.error('❌ [SERVER] Validação de description falhou:', validation.error);
        return res.status(400).json({ error: validation.error });
      }
      
      if (isDevelopment) {
        console.log('💾 [SERVER] Atualizando description (notas):', req.body.description ? `[${req.body.description.length} caracteres]` : '[vazio]');
      }
    }
    
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      console.error('❌ [SERVER] Projeto não encontrado:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (isDevelopment) {
      console.log('💾 [SERVER] Projeto encontrado:', {
        id: project.id,
        name: project.name,
        currentDescription: project.description ? `[${project.description.length} caracteres]` : '[vazio]'
      });
      console.log('💾 [SERVER] Salvando atualizações na base de dados...');
    }
    
    await project.update(req.body);
    
    // Recarregar para verificar o que foi guardado
    await project.reload();
    
    if (isDevelopment) {
      console.log('✅ [SERVER] Projeto atualizado com sucesso!');
      if (req.body.description !== undefined) {
        console.log('✅ [SERVER] Description guardada na BD:', project.description ? `[${project.description.length} caracteres]` : '[vazio]');
      }
      console.log('✅ [SERVER] ===== ATUALIZAÇÃO CONCLUÍDA =====');
    }
    
    res.json(project);
  } catch (error) {
    console.error('❌ [SERVER] ===== ERRO AO ATUALIZAR PROJETO =====');
    console.error('❌ [SERVER] Project ID:', req.params.id);
    console.error('❌ [SERVER] Erro:', error.message);
    if (isDevelopment) {
      console.error('❌ [SERVER] Stack:', error.stack);
    }
    res.status(400).json({ error: error.message });
  }
}

// DELETE /api/projects/:id - Deletar projeto
export async function deleteProject(req, res) {
  const transaction = await sequelize.transaction();
  
  try {
    // Validar ID
    const projectId = req.params.id;
    if (!projectId) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    // Buscar projeto com suas relações para garantir que existe
    const project = await Project.findByPk(projectId, { transaction });
    
    if (!project) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Deletar projeto (as relações serão deletadas automaticamente devido ao CASCADE)
    // ProjectElement e ProjectNote têm onDelete: 'CASCADE' configurado
    await project.destroy({ transaction });
    
    // Commit da transação
    await transaction.commit();
    
    console.log(`✅ [PROJECTS API] Projeto ${projectId} deletado com sucesso`);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    // Rollback em caso de erro
    await transaction.rollback();
    console.error('❌ [PROJECTS API] Erro ao deletar projeto:', error);
    console.error('❌ [PROJECTS API] Stack:', error.stack);
    
    // Verificar se é erro de constraint de foreign key
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(409).json({ 
        error: 'Cannot delete project: it has associated records that prevent deletion',
        details: error.message 
      });
    }
    
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/projects/:id/status - Atualizar status do projeto
export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.update({ status });
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(400).json({ error: error.message });
  }
}

// PATCH /api/projects/:id/favorite - Toggle favorito
export async function toggleFavorite(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.update({ isFavorite: !project.isFavorite });
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/projects/:id/canvas - Atualizar dados do canvas (zonas, decorações, etc)
export async function updateCanvas(req, res) {
  try {
    console.log('💾 [SERVER] ===== RECEBENDO ATUALIZAÇÃO DE CANVAS =====');
    console.log('💾 [SERVER] Projeto ID:', req.params.id);
    console.log('💾 [SERVER] Body recebido:', {
      temSnapZonesByImage: req.body.snapZonesByImage !== undefined,
      temCanvasDecorations: req.body.canvasDecorations !== undefined,
      temCanvasImages: req.body.canvasImages !== undefined,
      temDecorationsByImage: req.body.decorationsByImage !== undefined,
      temUploadedImages: req.body.uploadedImages !== undefined,
      temSimulationState: req.body.simulationState !== undefined
    });
    
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      console.error('❌ [SERVER] Projeto não encontrado:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    var updateData = {};
    if (req.body.snapZonesByImage !== undefined) {
      updateData.snapZonesByImage = req.body.snapZonesByImage;
      
      // Log detalhado das zonas recebidas
      var zonasResumo = {};
      for (var imageId in req.body.snapZonesByImage) {
        var zones = req.body.snapZonesByImage[imageId];
        zonasResumo[imageId] = {
          day: zones?.day?.length || 0,
          night: zones?.night?.length || 0,
          total: (zones?.day?.length || 0) + (zones?.night?.length || 0)
        };
      }
      console.log('💾 [SERVER] Zonas recebidas (resumo):', JSON.stringify(zonasResumo, null, 2));
      console.log('💾 [SERVER] Zonas completas:', JSON.stringify(req.body.snapZonesByImage, null, 2));
    }
    if (req.body.canvasDecorations !== undefined) {
      updateData.canvasDecorations = req.body.canvasDecorations;
      console.log('💾 [SERVER] CanvasDecorations recebidas:', Array.isArray(req.body.canvasDecorations) ? req.body.canvasDecorations.length : 'N/A');
    }
    if (req.body.canvasImages !== undefined) {
      updateData.canvasImages = req.body.canvasImages;
      console.log('💾 [SERVER] CanvasImages recebidas:', Array.isArray(req.body.canvasImages) ? req.body.canvasImages.length : 'N/A');
    }
    if (req.body.decorationsByImage !== undefined) {
      updateData.decorationsByImage = req.body.decorationsByImage;
      console.log('💾 [SERVER] DecorationsByImage recebidas:', Object.keys(req.body.decorationsByImage || {}).length, 'imagens');
    }
    if (req.body.lastEditedStep !== undefined) {
      updateData.lastEditedStep = req.body.lastEditedStep;
      console.log('💾 [SERVER] lastEditedStep recebido:', req.body.lastEditedStep);
    }
    if (req.body.uploadedImages !== undefined) {
      updateData.uploadedImages = req.body.uploadedImages;
      console.log('💾 [SERVER] UploadedImages recebidas:', Array.isArray(req.body.uploadedImages) ? req.body.uploadedImages.length : 'N/A');
    }
    if (req.body.simulationState !== undefined) {
      updateData.simulationState = req.body.simulationState;
      console.log('💾 [SERVER] SimulationState recebido:', req.body.simulationState);
    }
    
    console.log('💾 [SERVER] Dados a atualizar:', Object.keys(updateData));
    console.log('💾 [SERVER] Salvando na base de dados...');
    
    await project.update(updateData);
    
    // Verificar o que foi realmente guardado
    await project.reload();
    
    console.log('✅ [SERVER] ===== CANVAS ATUALIZADO COM SUCESSO =====');
    console.log('✅ [SERVER] Projeto ID:', req.params.id);
    if (project.snapZonesByImage) {
      var zonasGuardadas = {};
      for (var imgId in project.snapZonesByImage) {
        var z = project.snapZonesByImage[imgId];
        zonasGuardadas[imgId] = {
          day: z?.day?.length || 0,
          night: z?.night?.length || 0,
          total: (z?.day?.length || 0) + (z?.night?.length || 0)
        };
      }
      console.log('✅ [SERVER] Zonas guardadas na BD (resumo):', JSON.stringify(zonasGuardadas, null, 2));
    }
    
    res.json(project);
  } catch (error) {
    console.error('❌ [SERVER] ===== ERRO AO ATUALIZAR CANVAS =====');
    console.error('❌ [SERVER] Projeto ID:', req.params.id);
    console.error('❌ [SERVER] Erro:', error.message);
    console.error('❌ [SERVER] Stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
}

// POST /api/projects/:id/images/upload - Upload de imagens para projeto
export async function uploadImages(req, res) {
  try {
    const projectId = req.params.id;
    
    if (!projectId) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID é obrigatório' 
      });
    }

    // Verificar se projeto existe
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Projeto não encontrado' 
      });
    }

    // Verificar se há arquivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Nenhuma imagem fornecida' 
      });
    }

    // Processar arquivos e retornar URLs
    const uploadedImages = req.files.map((file, index) => {
      const imageId = `img-${Date.now()}-${index}`;
      const imageUrl = `/uploads/projects/${projectId}/day/${file.filename}`;
      
      // Verificar se arquivo foi realmente salvo
      const filePath = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day/${file.filename}`);
      const fileExists = fs.existsSync(filePath);
      
      // Verificar também o caminho completo do multer (file.path)
      const multerPath = file.path;
      const multerPathExists = multerPath ? fs.existsSync(multerPath) : false;
      
      const fileInfo = {
        filename: file.filename,
        originalname: file.originalname,
        multerPath: multerPath,
        multerPathExists: multerPathExists,
        expectedPath: filePath,
        expectedPathExists: fileExists,
        size: file.size,
        url: imageUrl,
        cwd: process.cwd()
      };
      
      console.log('📁 [PROJECT UPLOAD] Arquivo:', fileInfo);
      
      // Armazenar informações para retornar na resposta (para debug no cliente)
      file._uploadDebug = fileInfo;
      
      if (!fileExists && !multerPathExists) {
        console.error('❌ [PROJECT UPLOAD] Arquivo não encontrado após upload!');
        console.error('   Multer path:', multerPath);
        console.error('   Expected path:', filePath);
        console.error('   CWD:', process.cwd());
        console.error('   File object:', JSON.stringify({
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          path: file.path,
          destination: file.destination
        }, null, 2));
        
        // Tentar listar o diretório para debug
        const dirPath = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day`);
        if (fs.existsSync(dirPath)) {
          const files = fs.readdirSync(dirPath);
          console.log('   Arquivos no diretório:', files);
        } else {
          console.error('   Diretório não existe:', dirPath);
          // Tentar criar o diretório
          try {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log('   ✅ Diretório criado:', dirPath);
          } catch (e) {
            console.error('   ❌ Erro ao criar diretório:', e.message);
          }
        }
      } else if (multerPathExists && !fileExists) {
        // Arquivo está em local diferente do esperado - usar o caminho do multer
        console.warn('⚠️ [PROJECT UPLOAD] Arquivo salvo em local diferente do esperado');
        console.warn('   Multer path (existe):', multerPath);
        console.warn('   Expected path (não existe):', filePath);
        console.warn('   Usando caminho do multer para URL');
        
        // Ajustar URL para usar o caminho relativo do multer
        const relativePath = multerPath.replace(path.resolve(process.cwd(), 'public'), '');
        const adjustedUrl = relativePath.replace(/\\/g, '/'); // Normalizar separadores
        return {
          id: imageId,
          name: file.originalname,
          originalUrl: adjustedUrl,
          thumbnail: adjustedUrl,
          dayVersion: adjustedUrl,
          nightVersion: null,
          conversionStatus: 'pending',
          uploadedAt: new Date().toISOString(),
          cartouche: req.body.cartouche ? JSON.parse(req.body.cartouche) : null,
          _debug: { multerPath, expectedPath: filePath }
        };
      }
      
      return {
        id: imageId,
        name: file.originalname,
        originalUrl: imageUrl,
        thumbnail: imageUrl, // Por enquanto usar a mesma URL, pode gerar thumbnail depois
        dayVersion: imageUrl,
        nightVersion: null, // Será preenchido após conversão via API
        conversionStatus: 'pending',
        uploadedAt: new Date().toISOString(),
        // Metadados do cartouche (se fornecidos no body)
        cartouche: req.body.cartouche ? JSON.parse(req.body.cartouche) : null
      };
    });

    console.log('✅ [PROJECT UPLOAD] Imagens uploadadas:', uploadedImages.length, 'para projeto:', projectId);

    // Coletar informações de debug de cada arquivo
    const uploadDebugInfo = req.files.map((f, index) => {
      const fileDebug = f._uploadDebug || {
        filename: f.filename,
        originalname: f.originalname,
        multerPath: f.path,
        multerPathExists: f.path ? fs.existsSync(f.path) : false,
        expectedPath: path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day/${f.filename}`),
        expectedPathExists: fs.existsSync(path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day/${f.filename}`)),
        size: f.size,
        url: `/uploads/projects/${projectId}/day/${f.filename}`,
        cwd: process.cwd()
      };
      return fileDebug;
    });

    // Incluir informações de debug na resposta (sempre incluir para diagnóstico)
    const projectDayDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day`);
    const debugInfo = {
      uploadDebug: uploadDebugInfo,
      cwd: process.cwd(),
      publicDir: path.resolve(process.cwd(), 'public'),
      publicDirExists: fs.existsSync(path.resolve(process.cwd(), 'public')),
      uploadsDir: path.resolve(process.cwd(), 'public/uploads'),
      uploadsDirExists: fs.existsSync(path.resolve(process.cwd(), 'public/uploads')),
      projectDayDir: projectDayDir,
      projectDayDirExists: fs.existsSync(projectDayDir),
      filesInDayDir: fs.existsSync(projectDayDir) 
        ? fs.readdirSync(projectDayDir)
        : [],
      filesCount: req.files ? req.files.length : 0
    };

    console.log('🔍 [PROJECT UPLOAD] Debug info preparado:', {
      uploadDebugCount: debugInfo.uploadDebug.length,
      filesInDayDir: debugInfo.filesInDayDir.length,
      projectDayDirExists: debugInfo.projectDayDirExists
    });

    res.json({
      success: true,
      images: uploadedImages,
      projectId: projectId,
      message: `${uploadedImages.length} imagem(ns) enviada(s) com sucesso`,
      debug: debugInfo
    });
  } catch (error) {
    console.error('❌ [PROJECT UPLOAD] Erro ao fazer upload:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao fazer upload das imagens' 
    });
  }
}

/**
 * Função helper para atualizar nightVersion de uma imagem no array uploadedImages
 * @param {string} projectId - ID do projeto
 * @param {string} imageId - ID da imagem
 * @param {string} nightImageUrl - URL da imagem de noite
 * @param {string} status - Status da conversão ('completed' ou 'failed')
 */
async function updateImageNightVersion(projectId, imageId, nightImageUrl, status = 'completed') {
  const project = await Project.findByPk(projectId);
  if (!project) {
    throw new Error('Projeto não encontrado');
  }

  const uploadedImages = project.uploadedImages || [];
  const imageIndex = uploadedImages.findIndex(img => img.id === imageId);
  
  if (imageIndex === -1) {
    throw new Error('Imagem não encontrada no projeto');
  }

  // Atualizar imagem no array
  uploadedImages[imageIndex] = {
    ...uploadedImages[imageIndex],
    nightVersion: nightImageUrl || uploadedImages[imageIndex].nightVersion,
    conversionStatus: status
  };

  // Atualizar projeto
  project.uploadedImages = uploadedImages;
  await project.save();

  console.log(`✅ [NIGHT VERSION] Atualizado para imagem ${imageId}: status=${status}`);
  return uploadedImages[imageIndex];
}

// POST /api/projects/:id/images/:imageId/night - Receber imagem de noite convertida
export async function receiveNightImage(req, res) {
  try {
    const projectId = req.params.id;
    const imageId = req.params.imageId;
    
    if (!projectId || !imageId) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID e Image ID são obrigatórios' 
      });
    }

    // Verificar se projeto existe
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Projeto não encontrado' 
      });
    }

    // Verificar se há arquivo ou URL fornecida
    const nightImageUrl = req.body.nightImageUrl || (req.file ? `/uploads/projects/${projectId}/night/${req.file.filename}` : null);
    
    if (!nightImageUrl && !req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'Imagem de noite ou URL deve ser fornecida' 
      });
    }

    // Se há arquivo, já foi salvo pelo multer na pasta night
    // Atualizar nightVersion no projeto
    const updatedImage = await updateImageNightVersion(projectId, imageId, nightImageUrl, 'completed');

    res.json({
      success: true,
      nightVersion: updatedImage.nightVersion,
      conversionStatus: updatedImage.conversionStatus,
      message: 'Imagem de noite recebida com sucesso'
    });
  } catch (error) {
    console.error('❌ [NIGHT IMAGE] Erro ao receber imagem de noite:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao receber imagem de noite' 
    });
  }
}

// POST /api/projects/:id/images/:imageId/night/failed - Marcar conversão como falhada
export async function markConversionFailed(req, res) {
  try {
    const projectId = req.params.id;
    const imageId = req.params.imageId;
    const { error: errorMessage } = req.body;
    
    if (!projectId || !imageId) {
      return res.status(400).json({ 
        success: false,
        error: 'Project ID e Image ID são obrigatórios' 
      });
    }

    // Verificar se projeto existe
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: 'Projeto não encontrado' 
      });
    }

    // Atualizar status para 'failed'
    const updatedImage = await updateImageNightVersion(projectId, imageId, null, 'failed');

    console.log('⚠️ [NIGHT CONVERSION] Conversão falhada para imagem:', imageId, errorMessage || '');

    res.json({
      success: true,
      conversionStatus: updatedImage.conversionStatus,
      message: 'Conversão marcada como falhada',
      error: errorMessage || 'Conversão dia/noite não disponível no momento'
    });
  } catch (error) {
    console.error('❌ [NIGHT CONVERSION] Erro ao marcar conversão como falhada:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao marcar conversão como falhada' 
    });
  }
}

// GET /api/projects/:id/images/debug - Debug: verificar arquivos de imagens
export async function debugProjectImages(req, res) {
  try {
    const projectId = req.params.id;
    const dayDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/day`);
    const nightDir = path.resolve(process.cwd(), `public/uploads/projects/${projectId}/night`);
    const publicDir = path.resolve(process.cwd(), 'public');
    const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
    
    const dayFiles = fs.existsSync(dayDir) ? fs.readdirSync(dayDir).map(f => {
      const filePath = path.join(dayDir, f);
      const stats = fs.statSync(filePath);
      return {
        name: f,
        size: stats.size,
        modified: stats.mtime,
        url: `/uploads/projects/${projectId}/day/${f}`,
        apiUrl: `/api/uploads/projects/${projectId}/day/${f}`
      };
    }) : [];
    const nightFiles = fs.existsSync(nightDir) ? fs.readdirSync(nightDir) : [];
    
    res.json({
      projectId,
      cwd: process.cwd(),
      dayDir,
      dayDirExists: fs.existsSync(dayDir),
      dayFiles,
      nightDir,
      nightDirExists: fs.existsSync(nightDir),
      nightFiles,
      staticPublic: publicDir,
      staticPublicExists: fs.existsSync(publicDir),
      uploadsDir,
      uploadsDirExists: fs.existsSync(uploadsDir),
      env: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}

// GET /api/projects/stats - Estatísticas dos projetos
export async function getStats(req, res) {
  try {
    console.log('📊 [PROJECTS API] GET /api/projects/stats - Iniciando busca');
    
    // Verificar se a tabela existe primeiro
    try {
      var tableExists = await sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects')",
        { type: QueryTypes.SELECT }
      );
      if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
        console.error('❌ [PROJECTS API] Tabela "projects" não existe!');
        return res.status(500).json({ 
          error: 'Tabela projects não existe. Execute: npm run setup',
          details: 'A tabela de projetos não foi criada. Execute o setup da base de dados.'
        });
      }
    } catch (tableCheckError) {
      console.error('❌ [PROJECTS API] Erro ao verificar tabela:', tableCheckError.message);
    }
    
    const total = await Project.count();
    const inProgress = await Project.count({ where: { status: 'in_progress' } });
    const finished = await Project.count({ where: { status: 'finished' } });
    const approved = await Project.count({ where: { status: 'approved' } });
    const cancelled = await Project.count({ where: { status: 'cancelled' } });
    const inQueue = await Project.count({ where: { status: 'in_queue' } });
    
    const stats = {
      total,
      inProgress,
      finished,
      approved,
      cancelled,
      inQueue,
    };
    
    console.log('📊 [PROJECTS API] Stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ [PROJECTS API] Erro ao buscar estatísticas:', error);
    console.error('❌ [PROJECTS API] Nome do erro:', error.name);
    console.error('❌ [PROJECTS API] Mensagem:', error.message);
    console.error('❌ [PROJECTS API] Stack:', error.stack);
    
    // Mensagem mais detalhada para o cliente
    var errorMessage = error.message;
    if (error.message && error.message.indexOf('does not exist') !== -1) {
      errorMessage = 'Tabela não existe. Execute: npm run setup';
    } else if (error.message && error.message.indexOf('relation') !== -1) {
      errorMessage = 'Tabela não encontrada. Execute o setup da base de dados.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message,
      hint: 'Verifique se executou: npm run setup'
    });
  }
}

