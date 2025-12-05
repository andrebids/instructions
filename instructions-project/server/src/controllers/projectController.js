/**
 * Controller de projetos - Apenas rotas HTTP
 * Lógica de negócio movida para services/
 */
import * as projectService from '../services/projectService.js';
import * as projectUploadService from '../services/projectUploadService.js';
import * as projectImageService from '../services/projectImageService.js';
import { validateDescription, validateProjectId, validateFiles } from '../validators/projectValidator.js';
import { logInfo, logError, logServerOperation, formatErrorMessage } from '../utils/projectLogger.js';
import { getUserRole } from '../middleware/roles.js';
import { getAuth } from '../middleware/auth.js';
import { getLogoFinalDir } from '../utils/pathUtils.js';
import fs from 'fs';
import path from 'path';

// GET /api/projects - Listar todos os projetos
export async function getAll(req, res) {
  try {
    logInfo('GET /api/projects - Iniciando busca');

    // Verificar se a tabela existe primeiro
    // Se a verificação falhar, tentar consultar diretamente (fallback)
    let tableExists = await projectService.checkTableExists();
    if (!tableExists) {
      logError('Tabela "projects" não encontrada na verificação inicial');
      // Tentar uma consulta direta como fallback (pode ser problema de cache)
      try {
        await projectService.findAllProjectsList({});
        // Se chegou aqui, a tabela existe mas a verificação falhou
        logInfo('Tabela projects existe (verificado por consulta direta)');
        tableExists = true;
      } catch (directQueryError) {
        logError('Tabela "projects" não existe ou não pode ser acessada!', directQueryError);
        return res.status(500).json({
          error: 'Tabela projects não existe. Execute: npm run setup',
          details: 'A tabela de projetos não foi criada. Execute o setup da base de dados.',
          hint: 'Se executou o setup recentemente, reinicie o servidor.'
        });
      }
    }

    // Obter informações do usuário para filtrar projetos
    let userId = null;
    let userRole = null;

    try {
      // Obter auth usando Auth.js
      const auth = await getAuth(req);
      userId = auth?.userId || null;
      userRole = await getUserRole(req);
    } catch (error) {
      // Se houver erro ao obter auth (ex: middleware não registrado), continuar sem auth
      console.warn('Aviso: Não foi possível obter informações de autenticação:', error.message);
    }

    // Adicionar filtros baseados no role do usuário
    const filters = {
      ...req.query,
      userId,
      userRole,
    };

    // Usar função otimizada para listagem (exclui campos JSON grandes)
    const projects = await projectService.findAllProjectsList(filters);

    logInfo('Projetos encontrados:', projects.length);
    logInfo('Filtros aplicados:', { userId, userRole });
    res.json(projects);
  } catch (error) {
    logError('Erro ao buscar projetos', error);
    console.error('❌ [ProjectController] Erro completo:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      code: error.code,
      original: error.original?.message
    });
    res.status(500).json({
      error: formatErrorMessage(error),
      details: error.message,
      hint: 'Verifique se executou: npm run setup',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        name: error.name,
        code: error.code
      })
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

    // Verificar permissões: comercial só pode ver seus próprios projetos
    const auth = getAuth(req);
    const userId = auth?.userId || null;
    const userRole = getUserRole(req);

    if (userRole === 'comercial' && project.createdBy && project.createdBy !== userId) {
      return res.status(403).json({
        error: 'Sem permissão',
        message: 'Só pode visualizar os seus próprios projetos'
      });
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
    // Obter userId do Auth.js e definir createdBy automaticamente
    const auth = await getAuth(req);
    const userId = auth?.userId || null;

    if (!userId) {
      logError('POST /api/projects - Autenticação falhou', {
        hasAuth: !!auth,
        authSource: auth?.source,
        hasCookies: !!req.headers.cookie,
        host: req.get('host'),
        protocol: req.protocol,
        secure: req.secure,
        forwardedProto: req.get('x-forwarded-proto'),
        userAgent: req.get('user-agent')
      });

      return res.status(401).json({
        error: 'Não autenticado',
        message: 'É necessário estar autenticado para criar projetos'
      });
    }

    // Adicionar createdBy aos dados do projeto
    const projectData = {
      ...req.body,
      createdBy: userId,
    };

    const project = await projectService.createProject(projectData);
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

    // Buscar projeto primeiro para verificar permissões
    const project = await projectService.findProjectById(req.params.id, false);

    if (!project) {
      logError('Projeto não encontrado:', req.params.id);
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verificar permissões: comercial só pode editar seus próprios projetos
    const auth = getAuth(req);
    const userId = auth?.userId || null;
    const userRole = getUserRole(req);

    if (userRole === 'comercial' && project.createdBy && project.createdBy !== userId) {
      return res.status(403).json({
        error: 'Sem permissão',
        message: 'Só pode editar os seus próprios projetos'
      });
    }

    // Não permitir alterar createdBy (proteção)
    const updateData = { ...req.body };
    delete updateData.createdBy;

    const updatedProject = await projectService.updateProject(req.params.id, updateData);

    res.json(updatedProject);
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

    // Buscar projeto primeiro para verificar permissões
    const project = await projectService.findProjectById(projectId, false);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verificar permissões: comercial só pode deletar seus próprios projetos
    const auth = getAuth(req);
    const userId = auth?.userId || null;
    const userRole = getUserRole(req);

    if (userRole === 'comercial' && project.createdBy && project.createdBy !== userId) {
      return res.status(403).json({
        error: 'Sem permissão',
        message: 'Só pode eliminar os seus próprios projetos'
      });
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

// PATCH /api/projects/:id/add-random-designer - Adicionar designer aleatório ao projeto
export async function addRandomDesigner(req, res) {
  try {
    const projectId = req.params.id;
    
    const DESIGNERS = [
      { name: "Ana Silva", email: "ana.silva@example.com" },
      { name: "João Santos", email: "joao.santos@example.com" },
      { name: "Sofia Martins", email: "sofia.martins@example.com" },
      { name: "Pedro Oliveira", email: "pedro.oliveira@example.com" },
      { name: "Maria Costa", email: "maria.costa@example.com" },
      { name: "Rui Ferreira", email: "rui.ferreira@example.com" }
    ];

    function getAvatarUrl(seed) {
      return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
    }

    // Buscar projeto
    const project = await projectService.findProjectById(projectId, false);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Obter designers já atribuídos
    const currentDesigners = project.assignedDesigners || [];
    
    // Filtrar designers que já estão atribuídos (por email)
    const assignedEmails = currentDesigners.map(d => d.email);
    const availableDesigners = DESIGNERS.filter(d => !assignedEmails.includes(d.email));
    
    if (availableDesigners.length === 0) {
      return res.status(400).json({ 
        error: 'Todos os designers já estão atribuídos a este projeto' 
      });
    }

    // Escolher designer aleatório
    const randomDesigner = availableDesigners[Math.floor(Math.random() * availableDesigners.length)];
    
    // Criar objeto do designer
    const newDesigner = {
      id: `designer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: randomDesigner.name,
      email: randomDesigner.email,
      image: getAvatarUrl(randomDesigner.name.replace(' ', ''))
    };

    // Adicionar ao array de designers
    const updatedDesigners = [...currentDesigners, newDesigner];

    // Atualizar projeto
    const updatedProject = await projectService.updateProject(projectId, {
      assignedDesigners: updatedDesigners
    });

    logInfo(`Designer "${randomDesigner.name}" adicionado ao projeto "${project.name}"`);
    
    res.json(updatedProject);
  } catch (error) {
    logError('Erro ao adicionar designer aleatório', error);
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
// GET /api/projects/:id/observations - Buscar observações
export async function getObservations(req, res) {
  try {
    const observations = await projectService.getObservations(req.params.id);

    // Transformar para o formato esperado pelo frontend se necessário
    // O frontend espera: id, content, author { name, avatar, role }, createdAt, attachments, linkedInstruction, linkedResultImage
    const formattedObservations = observations.map(obs => ({
      id: obs.id,
      content: obs.content,
      author: {
        name: obs.authorName,
        avatar: obs.authorAvatar,
        role: obs.authorRole
      },
      createdAt: obs.createdAt,
      attachments: obs.attachments,
      linkedInstruction: obs.linkedInstructionId ? { id: obs.linkedInstructionId } : null, // Frontend vai precisar buscar detalhes se necessário ou podemos fazer include
      linkedResultImage: obs.linkedResultImageId ? { id: obs.linkedResultImageId } : null
    }));

    res.json(formattedObservations);
  } catch (error) {
    logError('Erro ao buscar observações', error);
    res.status(500).json({ error: error.message });
  }
}

// POST /api/projects/:id/observations - Adicionar observação
export async function addObservation(req, res) {
  try {
    const auth = await getAuth(req);
    const userId = auth?.userId;
    const userRole = await getUserRole(req);

    // Obter dados do usuário do auth
    // O auth retorna: { userId, user: { id, name, email, image, role }, role, source }
    const userName = auth?.user?.name || auth?.user?.email?.split('@')[0] || 'Unknown User';
    const userAvatar = auth?.user?.image || null;
    const userRoleDisplay = userRole || auth?.user?.role || 'User';

    console.log('🔍 [Observations] Auth data:', {
      userId: auth?.userId,
      userName: userName,
      userAvatar: userAvatar,
      userRole: userRoleDisplay,
      fullUser: auth?.user
    });

    const observationData = {
      content: req.body.content,
      // Attachments can include regular files and annotated images
      // Annotated images are created by the ImageAnnotationEditor and added to this array
      attachments: req.body.attachments || [],
      linkedInstructionId: req.body.linkedInstructionId,
      linkedResultImageId: req.body.linkedResultImageId,
      authorName: userName,
      authorAvatar: userAvatar,
      authorRole: userRoleDisplay
    };

    const observation = await projectService.addObservation(req.params.id, observationData);

    // Retornar no formato esperado
    res.status(201).json({
      id: observation.id,
      content: observation.content,
      author: {
        name: observation.authorName,
        avatar: observation.authorAvatar,
        role: observation.authorRole
      },
      createdAt: observation.createdAt,
      attachments: observation.attachments,
      linkedInstruction: observation.linkedInstructionId ? { id: observation.linkedInstructionId } : null,
      linkedResultImage: observation.linkedResultImageId ? { id: observation.linkedResultImageId } : null
    });
  } catch (error) {
    logError('Erro ao adicionar observação', error);
    res.status(500).json({ error: error.message });
  }
}

// DELETE /api/projects/:id/observations/:observationId - Deletar observação
export async function deleteObservation(req, res) {
  try {
    const { observationId } = req.params;
    const auth = await getAuth(req);
    const userId = auth?.userId;
    const userRole = await getUserRole(req);

    // Buscar a observação para verificar permissões
    const observations = await projectService.getObservations(req.params.id);
    const targetObservation = observations.find(obs => obs.id === observationId);

    if (!targetObservation) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    // Verificar se o usuário é o autor ou admin
    const isAuthor = targetObservation.authorName === (auth?.user?.name || auth?.user?.email?.split('@')[0]);
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only delete your own observations'
      });
    }

    const result = await projectService.deleteObservation(observationId);

    if (!result) {
      return res.status(404).json({ error: 'Observation not found' });
    }

    res.json({ success: true, message: 'Observation deleted successfully' });
  } catch (error) {
    logError('Erro ao deletar observação', error);
    res.status(500).json({ error: error.message });
  }
}

// GET /api/projects/:id/results - Listar imagens de resultados do projeto
export async function getResults(req, res) {
  try {
    const { id } = req.params;
    
    // Buscar o projeto para verificar o tipo
    const project = await projectService.findProjectById(id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Se não for projeto do tipo "logo", retornar array vazio (frontend usa LANDSCAPES)
    if (project.projectType !== 'logo') {
      return res.json([]);
    }
    
    // Buscar imagens do diretório LOGO_FINAL
    const logoFinalDir = getLogoFinalDir();
    
    // Verificar se o diretório existe
    if (!fs.existsSync(logoFinalDir)) {
      logError(`Diretório LOGO_FINAL não encontrado: ${logoFinalDir}`);
      return res.json([]);
    }
    
    // Listar arquivos do diretório
    let files = [];
    try {
      files = fs.readdirSync(logoFinalDir);
    } catch (error) {
      logError(`Erro ao ler diretório LOGO_FINAL: ${error.message}`);
      return res.json([]);
    }
    
    // Filtrar apenas arquivos de imagem
    const imageExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.gif'];
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    });
    
    // Ordenar arquivos por nome
    imageFiles.sort();
    
    // Mapear para o formato esperado pelo frontend
    const results = imageFiles.map((file, index) => {
      const filename = path.basename(file, path.extname(file));
      return {
        id: index,
        title: `Result Proposal ${index + 1}`,
        src: `/api/uploads/logos/${file}`
      };
    });
    
    logInfo(`Encontradas ${results.length} imagens em LOGO_FINAL para projeto ${id}`);
    res.json(results);
  } catch (error) {
    logError('Erro ao buscar resultados do projeto', error);
    res.status(500).json({ error: error.message });
  }
}
