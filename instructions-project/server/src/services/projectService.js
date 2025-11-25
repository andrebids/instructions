/**
 * Serviço de projetos - Lógica de negócio CRUD
 */
import { Project, ProjectElement, Decoration, ProjectNote, Observation } from '../models/index.js';
import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { logInfo, logSuccess, logError, logServerOperation, logStats, logDelete, formatErrorMessage } from '../utils/projectLogger.js';

/**
 * Verifica se a tabela projects existe
 */
export async function checkTableExists() {
  try {
    // Primeiro, verificar se a conexão está ativa
    await sequelize.authenticate();

    // Verificar se a tabela existe usando query mais robusta
    const result = await sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') as exists",
      { type: QueryTypes.SELECT }
    );

    const exists = result && result[0] && (result[0].exists === true || result[0].exists === 'true');

    if (!exists) {
      logError('Tabela projects não encontrada na verificação');
      // Tentar verificar diretamente se a tabela pode ser consultada
      try {
        await sequelize.query('SELECT 1 FROM projects LIMIT 1', { type: QueryTypes.SELECT });
        // Se chegou aqui, a tabela existe mas a query de verificação falhou
        logInfo('Tabela projects existe (verificado por consulta direta)');
        return true;
      } catch (directQueryError) {
        logError('Tabela projects não pode ser consultada:', directQueryError.message);
        return false;
      }
    }

    return exists;
  } catch (error) {
    logError('Erro ao verificar tabela', error);
    // Em caso de erro de conexão, tentar verificar diretamente
    try {
      await sequelize.query('SELECT 1 FROM projects LIMIT 1', { type: QueryTypes.SELECT });
      logInfo('Tabela projects existe (verificado após erro de verificação)');
      return true;
    } catch (directQueryError) {
      return false;
    }
  }
}

/**
 * Busca todos os projetos com filtros opcionais
 * @param {Object} filters - Filtros de busca
 * @param {string} filters.status - Filtrar por status
 * @param {string} filters.projectType - Filtrar por tipo de projeto
 * @param {string} filters.favorite - Filtrar por favorito
 * @param {string} filters.includeElements - Incluir elementos do projeto
 * @param {string} filters.createdBy - Filtrar por criador (userId)
 * @param {string} filters.userRole - Role do usuário (para filtrar automaticamente se comercial)
 * @param {string} filters.userId - ID do usuário (para filtrar automaticamente se comercial)
 */
export async function findAllProjects(filters = {}) {
  try {
    const { status, projectType, favorite, includeElements, createdBy, userRole, userId } = filters;
    const where = {};

    if (status) where.status = status;
    if (projectType) where.projectType = projectType;
    if (favorite) where.isFavorite = favorite === 'true';

    // Se for comercial, filtrar apenas projetos criados por ele
    // Se createdBy for explicitamente passado, usar esse valor
    if (createdBy) {
      where.created_by = createdBy;
    } else if (userRole === 'comercial' && userId) {
      // Comercial só vê seus próprios projetos
      where.created_by = userId;
    }
    // Admin vê todos os projetos (não adiciona filtro createdBy)

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
    return projects.map(project => {
      if (!project.cartoucheByImage) {
        project.cartoucheByImage = {};
      }
      return project;
    });
  } catch (error) {
    logError('Erro em findAllProjects', error);
    // Re-lançar o erro para ser tratado no controller
    throw error;
  }
}

/**
 * Busca projeto por ID
 */
export async function findProjectById(id, includeElements = true) {
  const includeOptions = includeElements ? [
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
  ] : [];

  const project = await Project.findByPk(id, {
    include: includeOptions,
  });

  if (project && !project.cartoucheByImage) {
    project.cartoucheByImage = {};
  }

  return project;
}

/**
 * Cria um novo projeto
 * @param {Object} projectData - Dados do projeto
 * @param {string} projectData.createdBy - ID do usuário que cria o projeto (Auth.js userId)
 */
export async function createProject(projectData) {
  logServerOperation('CRIANDO NOVO PROJETO', {
    name: projectData.name,
    clientName: projectData.clientName,
    projectType: projectData.projectType,
    location: projectData.location,
    description: projectData.description ? `[${projectData.description.length} caracteres]` : '[vazio]',
    hasSnapZones: !!(projectData.snapZonesByImage && Object.keys(projectData.snapZonesByImage).length > 0),
    createdBy: projectData.createdBy || 'N/A',
  });

  // Log das zonas se existirem
  if (projectData.snapZonesByImage && Object.keys(projectData.snapZonesByImage).length > 0) {
    const zonasResumo = {};
    for (const imageId in projectData.snapZonesByImage) {
      const zones = projectData.snapZonesByImage[imageId];
      zonasResumo[imageId] = {
        day: zones?.day?.length || 0,
        night: zones?.night?.length || 0,
        total: (zones?.day?.length || 0) + (zones?.night?.length || 0)
      };
    }
    logInfo('Projeto criado COM zonas:', JSON.stringify(zonasResumo, null, 2));
  } else {
    logInfo('Projeto criado SEM zonas');
  }

  // Garantir que cartoucheByImage existe e tem valor padrão se não fornecido
  // createdBy deve ser definido pelo controller (do req.auth.userId)
  const data = {
    ...projectData,
    cartoucheByImage: projectData.cartoucheByImage || {}
  };

  // Se createdBy não foi fornecido, não definir (será null)
  // Isso permite que projetos antigos continuem funcionando

  const project = await Project.create(data);

  // Verificar o que foi realmente guardado
  if (project.snapZonesByImage) {
    const zonasGuardadas = {};
    for (const imgId in project.snapZonesByImage) {
      const z = project.snapZonesByImage[imgId];
      zonasGuardadas[imgId] = {
        day: z?.day?.length || 0,
        night: z?.night?.length || 0,
        total: (z?.day?.length || 0) + (z?.night?.length || 0)
      };
    }
    logSuccess('Zonas guardadas na BD após criação:', JSON.stringify(zonasGuardadas, null, 2));
  }

  logSuccess('Projeto criado com ID:', project.id);
  logSuccess('Created by:', project.createdBy || 'N/A');
  logSuccess('Description guardada na BD:', project.description ? `[${project.description.length} caracteres]` : '[vazio]');
  logSuccess('===== PROJETO CRIADO COM SUCESSO =====');

  return project;
}

/**
 * Atualiza um projeto
 */
export async function updateProject(id, updateData) {
  logServerOperation('ATUALIZANDO PROJETO', {
    'Project ID': id,
    'Campos a atualizar': Object.keys(updateData),
  });

  const project = await Project.findByPk(id);

  if (!project) {
    return null;
  }

  logInfo('Projeto encontrado:', {
    id: project.id,
    name: project.name,
    currentDescription: project.description ? `[${project.description.length} caracteres]` : '[vazio]'
  });
  logInfo('Salvando atualizações na base de dados...');

  await project.update(updateData);
  await project.reload();

  logSuccess('Projeto atualizado com sucesso!');
  if (updateData.description !== undefined) {
    logSuccess('Description guardada na BD:', project.description ? `[${project.description.length} caracteres]` : '[vazio]');
  }
  logSuccess('===== ATUALIZAÇÃO CONCLUÍDA =====');

  return project;
}

/**
 * Deleta um projeto e suas relações
 */
export async function deleteProjectWithRelations(projectId) {
  const transaction = await sequelize.transaction();

  try {
    logDelete(`Iniciando deleção do projeto ${projectId}`);

    // Buscar projeto com suas relações
    const project = await Project.findByPk(projectId, {
      transaction,
      include: [
        {
          model: ProjectElement,
          as: 'elements',
          required: false,
        },
        {
          model: ProjectNote,
          as: 'note',
          required: false,
        },
      ],
    });

    if (!project) {
      await transaction.rollback();
      return null;
    }

    logInfo(`Projeto encontrado: ${project.name}`);

    // Deletar ProjectElements manualmente
    const elementsCount = await ProjectElement.count({
      where: { projectId },
      transaction
    });

    if (elementsCount > 0) {
      logDelete(`Deletando ${elementsCount} elemento(s) do projeto...`);
      await ProjectElement.destroy({
        where: { projectId },
        transaction
      });
      logSuccess(`${elementsCount} elemento(s) deletado(s)`);
    }

    // Deletar ProjectNote manualmente
    const noteCount = await ProjectNote.count({
      where: { projectId },
      transaction
    });

    if (noteCount > 0) {
      logDelete('Deletando nota(s) do projeto...');
      await ProjectNote.destroy({
        where: { projectId },
        transaction
      });
      logSuccess('Nota(s) deletada(s)');
    }

    // Deletar o projeto
    logDelete('Deletando projeto...');
    await project.destroy({ transaction });

    // Commit da transação
    await transaction.commit();

    logSuccess(`Projeto ${projectId} deletado com sucesso`);
    return { success: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Atualiza status do projeto
 */
export async function updateProjectStatus(id, status) {
  const project = await Project.findByPk(id);
  if (!project) {
    return null;
  }
  await project.update({ status });
  return project;
}

/**
 * Toggle favorito do projeto
 */
export async function toggleProjectFavorite(id) {
  const project = await Project.findByPk(id);
  if (!project) {
    return null;
  }
  await project.update({ isFavorite: !project.isFavorite });
  return project;
}

/**
 * Atualiza dados do canvas
 */
export async function updateProjectCanvas(id, canvasData) {
  logServerOperation('RECEBENDO ATUALIZAÇÃO DE CANVAS', {
    'Projeto ID': id,
    'Body recebido': {
      temSnapZonesByImage: canvasData.snapZonesByImage !== undefined,
      temCanvasDecorations: canvasData.canvasDecorations !== undefined,
      temCanvasImages: canvasData.canvasImages !== undefined,
      temDecorationsByImage: canvasData.decorationsByImage !== undefined,
      temUploadedImages: canvasData.uploadedImages !== undefined,
      temSimulationState: canvasData.simulationState !== undefined,
      temLogoDetails: canvasData.logoDetails !== undefined
    }
  });

  const project = await Project.findByPk(id);
  if (!project) {
    return null;
  }

  const updateData = {};
  if (canvasData.snapZonesByImage !== undefined) {
    updateData.snapZonesByImage = canvasData.snapZonesByImage;

    // Log detalhado das zonas recebidas
    const zonasResumo = {};
    for (const imageId in canvasData.snapZonesByImage) {
      const zones = canvasData.snapZonesByImage[imageId];
      zonasResumo[imageId] = {
        day: zones?.day?.length || 0,
        night: zones?.night?.length || 0,
        total: (zones?.day?.length || 0) + (zones?.night?.length || 0)
      };
    }
    logInfo('Zonas recebidas (resumo):', JSON.stringify(zonasResumo, null, 2));
    logInfo('Zonas completas:', JSON.stringify(canvasData.snapZonesByImage, null, 2));
  }
  if (canvasData.canvasDecorations !== undefined) {
    updateData.canvasDecorations = canvasData.canvasDecorations;
    logInfo('CanvasDecorations recebidas:', Array.isArray(canvasData.canvasDecorations) ? canvasData.canvasDecorations.length : 'N/A');
  }
  if (canvasData.canvasImages !== undefined) {
    updateData.canvasImages = canvasData.canvasImages;
    logInfo('CanvasImages recebidas:', Array.isArray(canvasData.canvasImages) ? canvasData.canvasImages.length : 'N/A');
  }
  if (canvasData.decorationsByImage !== undefined) {
    updateData.decorationsByImage = canvasData.decorationsByImage;
    logInfo('DecorationsByImage recebidas:', Object.keys(canvasData.decorationsByImage || {}).length, 'imagens');
  }
  if (canvasData.lastEditedStep !== undefined) {
    updateData.lastEditedStep = canvasData.lastEditedStep;
    logInfo('lastEditedStep recebido:', canvasData.lastEditedStep);
  }
  if (canvasData.uploadedImages !== undefined) {
    updateData.uploadedImages = canvasData.uploadedImages;
    logInfo('UploadedImages recebidas:', Array.isArray(canvasData.uploadedImages) ? canvasData.uploadedImages.length : 'N/A');
  }
  if (canvasData.simulationState !== undefined) {
    updateData.simulationState = canvasData.simulationState;
    logInfo('SimulationState recebido:', canvasData.simulationState);
  }
  if (canvasData.logoDetails !== undefined) {
    updateData.logoDetails = canvasData.logoDetails;
    logInfo('LogoDetails recebido:', Object.keys(canvasData.logoDetails || {}).length, 'campos');
  }

  logInfo('Dados a atualizar:', Object.keys(updateData));
  logInfo('Salvando na base de dados...');

  await project.update(updateData);
  await project.reload();

  logSuccess('===== CANVAS ATUALIZADO COM SUCESSO =====');
  logSuccess('Projeto ID:', id);
  if (project.snapZonesByImage) {
    const zonasGuardadas = {};
    for (const imgId in project.snapZonesByImage) {
      const z = project.snapZonesByImage[imgId];
      zonasGuardadas[imgId] = {
        day: z?.day?.length || 0,
        night: z?.night?.length || 0,
        total: (z?.day?.length || 0) + (z?.night?.length || 0)
      };
    }
    logSuccess('Zonas guardadas na BD (resumo):', JSON.stringify(zonasGuardadas, null, 2));
  }

  return project;
}

/**
 * Busca estatísticas dos projetos
 */
export async function getProjectStats() {
  logStats('GET /api/projects/stats - Iniciando busca');

  const total = await Project.count();
  const draft = await Project.count({ where: { status: 'draft' } });
  const created = await Project.count({ where: { status: 'created' } });
  const inProgress = await Project.count({ where: { status: 'in_progress' } });
  const finished = await Project.count({ where: { status: 'finished' } });
  const approved = await Project.count({ where: { status: 'approved' } });
  const cancelled = await Project.count({ where: { status: 'cancelled' } });
  const inQueue = await Project.count({ where: { status: 'in_queue' } });

  const stats = {
    total,
    draft,
    created,
    inProgress,
    finished,
    approved,
    cancelled,
    inQueue,
  };

  logStats('Stats:', stats);
  return stats;
}
/**
 * Busca observações de um projeto
 */
export async function getObservations(projectId) {
  return await Observation.findAll({
    where: { projectId },
    order: [['createdAt', 'ASC']],
  });
}

/**
 * Adiciona uma observação a um projeto
 */
export async function addObservation(projectId, data) {
  return await Observation.create({
    projectId,
    ...data,
  });
}

/**
 * Deleta uma observação
 */
export async function deleteObservation(observationId) {
  const observation = await Observation.findByPk(observationId);
  if (!observation) {
    return null;
  }
  await observation.destroy();
  return { success: true };
}
