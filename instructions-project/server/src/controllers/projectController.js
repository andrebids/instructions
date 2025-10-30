import { Project, ProjectElement, Decoration } from '../models/index.js';

// GET /api/projects - Listar todos os projetos
export async function getAll(req, res) {
  try {
    console.log('📋 [PROJECTS API] GET /api/projects - Iniciando busca');
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
          include: [
            {
              model: Decoration,
              as: 'decoration',
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
    console.error('❌ [PROJECTS API] Stack:', error.stack);
    res.status(500).json({ error: error.message });
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
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
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
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Erro ao deletar projeto:', error);
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
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    var updateData = {};
    if (req.body.snapZonesByImage !== undefined) {
      updateData.snapZonesByImage = req.body.snapZonesByImage;
    }
    if (req.body.canvasDecorations !== undefined) {
      updateData.canvasDecorations = req.body.canvasDecorations;
    }
    if (req.body.canvasImages !== undefined) {
      updateData.canvasImages = req.body.canvasImages;
    }
    if (req.body.decorationsByImage !== undefined) {
      updateData.decorationsByImage = req.body.decorationsByImage;
    }
    
    await project.update(updateData);
    console.log('✅ Canvas atualizado para projeto:', req.params.id, updateData);
    res.json(project);
  } catch (error) {
    console.error('Erro ao atualizar canvas:', error);
    res.status(400).json({ error: error.message });
  }
}

// GET /api/projects/stats - Estatísticas dos projetos
export async function getStats(req, res) {
  try {
    console.log('📊 [PROJECTS API] GET /api/projects/stats - Iniciando busca');
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
    console.error('❌ [PROJECTS API] Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
}

