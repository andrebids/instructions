import { Project, ProjectElement, Decoration } from '../models/index.js';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';

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
    
    const { status, projectType, favorite } = req.query;
    const where = {};
    
    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (favorite) where.isFavorite = favorite === 'true';
    
    console.log('📋 [PROJECTS API] Where clause:', JSON.stringify(where));
    
    const projects = await Project.findAll({
      where,
      include: [
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
      ],
      order: [['createdAt', 'DESC']],
    });
    
    console.log('📋 [PROJECTS API] Projetos encontrados:', projects.length);
    res.json(projects);
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
    
    const project = await Project.create(req.body);
    
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
    res.status(201).json(project);
  } catch (error) {
    console.error('❌ [SERVER] ===== ERRO AO CRIAR PROJETO =====');
    console.error('❌ [SERVER] Erro:', error.message);
    console.error('❌ [SERVER] Stack:', error.stack);
    res.status(400).json({ error: error.message });
  }
}

// PUT /api/projects/:id - Atualizar projeto
export async function update(req, res) {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.update(req.body);
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
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
      temDecorationsByImage: req.body.decorationsByImage !== undefined
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

