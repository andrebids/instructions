/**
 * Controller de projetos - Apenas rotas HTTP
 * Lógica de negócio movida para services/
 */
import * as projectService from '../services/projectService.js';
import * as projectUploadService from '../services/projectUploadService.js';
import * as projectImageService from '../services/projectImageService.js';
import { validateDescription, validateProjectId, validateFiles } from '../validators/projectValidator.js';
import { logInfo, logError, logServerOperation, formatErrorMessage } from '../utils/projectLogger.js';

// GET /api/projects - Listar todos os projetos
export async function getAll(req, res) {
  try {
    logInfo('GET /api/projects - Iniciando busca');
    
    // Verificar se a tabela existe primeiro
    const tableExists = await projectService.checkTableExists();
    if (!tableExists) {
      logError('Tabela "projects" não existe!');
      return res.status(500).json({ 
        error: 'Tabela projects não existe. Execute: npm run setup',
        details: 'A tabela de projetos não foi criada. Execute o setup da base de dados.'
      });
    }
    
    const projects = await projectService.findAllProjects(req.query);
    
    logInfo('Projetos encontrados:', projects.length);
    res.json(projects);
  } catch (error) {
    logError('Erro ao buscar projetos', error);
    res.status(500).json({ 
      error: formatErrorMessage(error),
      details: error.message,
      hint: 'Verifique se executou: npm run setup'
    });
  }
}

// GET /api/projects/:id - Buscar projeto por ID
export async function getById(req, res) {
  try {
    const project = await projectService.findProjectById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logError('Erro ao buscar projeto', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/projects - Criar novo projeto
export async function create(req, res) {
  try {
    const project = await projectService.createProject(req.body);
    res.status(201).json(project);
  } catch (error) {
    logError('===== ERRO AO CRIAR PROJETO =====', error);
    res.status(400).json({ error: error.message });
  }
}

// PUT /api/projects/:id - Atualizar projeto
export async function update(req, res) {
  try {
    // Validar description se estiver presente
    if (req.body.description !== undefined) {
      const validation = validateDescription(req.body.description);
      if (!validation.valid) {
        logError('Validação de description falhou:', validation.error);
        return res.status(400).json({ error: validation.error });
      }
    }
    
    const project = await projectService.updateProject(req.params.id, req.body);
    
    if (!project) {
      logError('Projeto não encontrado:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logError('===== ERRO AO ATUALIZAR PROJETO =====', error);
    logError('Project ID:', req.params.id);
    res.status(400).json({ error: error.message });
  }
}

// DELETE /api/projects/:id - Deletar projeto
export async function deleteProject(req, res) {
  try {
    const projectId = req.params.id;
    
    // Validar ID
    const idValidation = validateProjectId(projectId);
    if (!idValidation.valid) {
      return res.status(400).json({ error: idValidation.error });
    }
    
    const result = await projectService.deleteProjectWithRelations(projectId);
    
    if (!result) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logError('Erro ao deletar projeto', error);
    
    // Verificar se é erro de constraint de foreign key
    if (error.name === 'SequelizeForeignKeyConstraintError' || 
        (error.name === 'SequelizeDatabaseError' && 
         (error.message?.includes('foreign key') || error.message?.includes('constraint')))) {
      return res.status(409).json({ 
        error: 'Cannot delete project: it has associated records that prevent deletion',
        details: error.message 
      });
    }
    
    const errorMessage = error.message || 'Unknown error occurred while deleting project';
    res.status(500).json({ 
      error: errorMessage,
      details: error.stack 
    });
  }
}

// PATCH /api/projects/:id/status - Atualizar status do projeto
export async function updateStatus(req, res) {
  try {
    const { status } = req.body;
    const project = await projectService.updateProjectStatus(req.params.id, status);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logError('Erro ao atualizar status', error);
    res.status(400).json({ error: error.message });
  }
}

// PATCH /api/projects/:id/favorite - Toggle favorito
export async function toggleFavorite(req, res) {
  try {
    const project = await projectService.toggleProjectFavorite(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logError('Erro ao atualizar favorito', error);
    res.status(500).json({ error: error.message });
  }
}

// PATCH /api/projects/:id/canvas - Atualizar dados do canvas (zonas, decorações, etc)
export async function updateCanvas(req, res) {
  try {
    const project = await projectService.updateProjectCanvas(req.params.id, req.body);
    
    if (!project) {
      logError('Projeto não encontrado:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    logError('===== ERRO AO ATUALIZAR CANVAS =====', error);
    logError('Projeto ID:', req.params.id);
    res.status(400).json({ error: error.message });
  }
}

// POST /api/projects/:id/images/upload - Upload de imagens para projeto
export async function uploadImages(req, res) {
  try {
    const projectId = req.params.id;
    
    // Validar projectId
    const idValidation = validateProjectId(projectId);
    if (!idValidation.valid) {
      return res.status(400).json({ 
        success: false,
        error: idValidation.error 
      });
    }

    // Validar arquivos
    const filesValidation = validateFiles(req.files);
    if (!filesValidation.valid) {
      return res.status(400).json({ 
        success: false,
        error: filesValidation.error 
      });
    }

    // Processar upload
    const { images, debug } = await projectUploadService.handleImageUpload(
      projectId, 
      req.files, 
      req.body.cartouche
    );

    res.json({
      success: true,
      images: images,
      projectId: projectId,
      message: `${images.length} imagem(ns) enviada(s) com sucesso`,
      debug: debug
    });
  } catch (error) {
    logError('Erro ao fazer upload', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao fazer upload das imagens' 
    });
  }
}

// POST /api/projects/:id/images/:imageId/night - Receber imagem de noite convertida
export async function receiveNightImage(req, res) {
  try {
    const projectId = req.params.id;
    const imageId = req.params.imageId;
    const nightImageUrl = req.body.nightImageUrl || (req.file ? `/uploads/projects/${projectId}/night/${req.file.filename}` : null);
    
    const result = await projectImageService.receiveNightImage(projectId, imageId, nightImageUrl);

    res.json({
      success: true,
      nightVersion: result.nightVersion,
      conversionStatus: result.conversionStatus,
      message: 'Imagem de noite recebida com sucesso'
    });
  } catch (error) {
    logError('Erro ao receber imagem de noite', error);
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
    
    const result = await projectImageService.markConversionFailed(projectId, imageId, errorMessage);

    res.json({
      success: true,
      conversionStatus: result.conversionStatus,
      message: 'Conversão marcada como falhada',
      error: result.error
    });
  } catch (error) {
    logError('Erro ao marcar conversão como falhada', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Erro ao marcar conversão como falhada' 
    });
  }
}

// GET /api/projects/:id/images/debug - Debug: verificar arquivos de imagens
export async function debugProjectImages(req, res) {
  try {
    const debugInfo = projectUploadService.debugProjectImageFiles(req.params.id);
    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
}

// GET /api/projects/stats - Estatísticas dos projetos
export async function getStats(req, res) {
  try {
    // Verificar se a tabela existe primeiro
    const tableExists = await projectService.checkTableExists();
    if (!tableExists) {
      logError('Tabela "projects" não existe!');
      return res.status(500).json({ 
        error: 'Tabela projects não existe. Execute: npm run setup',
        details: 'A tabela de projetos não foi criada. Execute o setup da base de dados.'
      });
    }
    
    const stats = await projectService.getProjectStats();
    res.json(stats);
  } catch (error) {
    logError('Erro ao buscar estatísticas', error);
    res.status(500).json({ 
      error: formatErrorMessage(error),
      details: error.message,
      hint: 'Verifique se executou: npm run setup'
    });
  }
}
